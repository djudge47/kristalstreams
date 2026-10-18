import { createHash } from 'node:crypto';
import { validatePaidSession } from './ks-payment-validation.js';
import { buildPaidPlanMapping, validateMappedPackage } from './ks-roomba-plan-mapping.js';
import { verifyPaidApproval, creditUnits } from './ks-paid-approval.js';
import { openStreamingLogin } from './ks-login-envelope.js';

const hash = value => createHash('sha256').update(value).digest('hex');
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const groups = value => JSON.stringify(value);
export function verifySettledPaidIntent(session, payment) {
  const intent = session.payment_intent, charge = intent?.latest_charge;
  if (!intent || typeof intent !== 'object' || intent.id !== payment.intentId || intent.status !== 'succeeded'
    || intent.livemode !== false || intent.currency !== 'usd' || intent.amount !== payment.cents || intent.amount_received !== payment.cents
    || !charge || typeof charge !== 'object' || !/^ch_[A-Za-z0-9]+$/.test(charge.id || '') || charge.livemode !== false
    || charge.payment_intent !== intent.id || charge.amount !== payment.cents || charge.currency !== 'usd'
    || charge.paid !== true || charge.captured !== true || charge.refunded !== false || charge.amount_refunded !== 0 || charge.disputed !== false) throw new Error('settled_payment_required');
}
function verifyLine(line, expected, login, now) {
  if (!line || !/^[1-9]\d{0,14}$/.test(line.id) || line.username !== login.username
    || line.resellerId !== expected.resellerId || line.packageId !== expected.selected.id
    || line.connections !== expected.selected.maxConnections || line.trial !== false || line.enabled !== true || line.adminEnabled !== true
    || groups(line.bouquetIds) !== groups(expected.selected.bouquetIds) || !Number.isFinite(Date.parse(line.expiresAt))
    || Date.parse(line.expiresAt) < now + expected.selected.duration.count * 27 * 86400000
    || Date.parse(line.expiresAt) > now + expected.selected.duration.count * 32 * 86400000) throw new Error('paid_line_requires_reconciliation');
  return line;
}
// Internal worker core, deliberately not imported by a deployed API, checkout or webhook.
// A future entrypoint must independently authenticate/authorize the administrator and be separately approved for release.
export function createGuardedPaidExecutor({ store, provider, payments, env = process.env, now = Date.now } = {}) {
  return async function execute({ attemptId, ownerId, approverId, approvalToken, confirmed = false }) {
    if (env.VERCEL_ENV !== 'preview' || confirmed !== true || !uuid(attemptId) || !uuid(ownerId) || !uuid(approverId)) throw new Error('explicit_preview_credit_approval_required');
    const attempt = await store.load(attemptId, ownerId);
    if (!attempt || attempt.attempt_id !== attemptId || attempt.user_id !== ownerId || !uuid(attempt.claim_token)) throw new Error('paid_attempt_unavailable');
    // Retry of local completion never sends another provider request.
    if (attempt.state === 'credentials_ready') return { state: 'credentials_ready', replayed: true };
    if (!['reserved', 'provider_verified'].includes(attempt.state)) return { state: 'reconciliation_required', replayed: true };
    const session = await payments.retrieve(attempt.checkout_session_id);
    const payment = validatePaidSession(session, false, ownerId);
    if (payment.sessionId !== attempt.checkout_session_id || payment.intentId !== attempt.payment_intent_id) throw new Error('paid_payment_changed');
    verifySettledPaidIntent(session, payment);
    await store.assertNewCustomer(ownerId);
    if (attempt.state === 'provider_verified') {
      const login = openStreamingLogin(attempt.login_envelope, { environment: 'preview', ownerId, sessionId: attempt.checkout_session_id, attemptId }, env);
      const line = verifyLine(await provider.line(attempt.provider_line_id, login.password), { resellerId: attempt.reseller_id,
        selected: { id: attempt.package_id, duration: { count: attempt.package_months, unit: 'months' }, maxConnections: attempt.connections, bouquetIds: attempt.bouquet_ids } }, login, now());
      if (line.id !== attempt.provider_line_id || line.expiresAt !== attempt.provider_expires_at) throw new Error('saved_provider_result_changed');
      await store.complete(attempt, login.username); return { state: 'credentials_ready', replayed: true };
    }
    const snapshot = await provider.snapshot();
    const mapping = buildPaidPlanMapping({ schemaVersion: 1, readOnly: true, checkedAt: new Date(snapshot.checkedAt).toISOString(), packages: snapshot.packages });
    const entry = mapping.entries.find(row => row.tier === payment.tier && row.connections === payment.connections);
    const currentPackage = snapshot.packages.find(row => row.id === entry?.provider.id);
    const selected = validateMappedPackage(entry, currentPackage);
    const input = { session, ownerId, approverId, entry, currentPackage, account: snapshot.account, checkedAt: snapshot.checkedAt };
    const approval = verifyPaidApproval(approvalToken, input, env, now());
    const bindingHash = hash(JSON.stringify({ sessionId: payment.sessionId, ownerId, intentId: payment.intentId,
      tier: payment.tier, connections: payment.connections, amountCents: payment.cents, resellerId: approval.resellerId, packageFingerprint: entry.provider.fingerprint }));
    if (attempt.binding_hash !== bindingHash || attempt.reseller_id !== approval.resellerId || attempt.package_id !== selected.id
      || attempt.package_months !== selected.duration.count || attempt.connections !== selected.maxConnections
      || creditUnits(attempt.expected_credits) !== creditUnits(selected.credits) || groups(attempt.bouquet_ids) !== groups(selected.bouquetIds)) throw new Error('paid_attempt_binding_changed');
    const login = openStreamingLogin(attempt.login_envelope, { environment: 'preview', ownerId, sessionId: payment.sessionId, attemptId }, env);
    if (hash(login.username) !== attempt.username_hash) throw new Error('paid_login_binding_changed');
    // begin persists a unique reseller-wide lock and single dispatch state atomically.
    // If this call loses its reply, do not send. The durable dispatch state/lock stays stopped.
    const encodedApproval = JSON.parse(Buffer.from(approvalToken.split('.')[0], 'base64url').toString('utf8'));
    if (await store.begin(attempt, { ...approval, tokenHash: hash(approvalToken), expiresAt: new Date(encodedApproval.expires).toISOString() }) !== true) return { state: 'reconciliation_required', replayed: true };
    let line;
    try {
      // Approval freshness is checked again after obtaining the durable lock.
      verifyPaidApproval(approvalToken, input, env, now());
      const expected = { selected, resellerId: approval.resellerId };
      const created = verifyLine(await provider.create(selected, login), expected, login, now());
      line = verifyLine(await provider.line(created.id, login.password), expected, login, now());
      if (line.id !== created.id || line.expiresAt !== created.expiresAt) throw new Error('paid_line_changed');
      const account = await provider.account();
      if (String(account.id) !== approval.resellerId || creditUnits(account.credits) !== BigInt(approval.balanceUnits) - BigInt(approval.costUnits)) throw new Error('paid_credit_change_requires_review');
      await store.verified(attempt, line);
    } catch {
      try { await store.reconcile(attempt); } catch { /* dispatching remains permanently stopped */ }
      return { state: 'reconciliation_required', replayed: false };
    }
    try { await store.complete(attempt, login.username); }
    catch { return { state: 'completion_pending', replayed: false }; }
    return { state: 'credentials_ready', replayed: false };
  };
}
