import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { validatePaidSession } from './ks-payment-validation.js';
import { verifySettledPaidIntent } from './ks-paid-settlement.js';
import { verifyPaidApproval, creditUnits } from './ks-paid-approval.js';
import { buildPaidPlanMapping, validateMappedPackage } from './ks-roomba-plan-mapping.js';
import { openStreamingLogin } from './ks-login-envelope.js';

const hash = value => createHash('sha256').update(value).digest('hex');
const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const packet = (state, replayed = false, wouldDispatch = false) => ({ state, replayed, simulation: true, mayDispatch: false, wouldDispatch });

// Test wiring only. Markers are not authentication. There is no real adapter,
// environment switch, API route, or provider-create operation in this module.
export function createReviewedHandoffRehearsal({ store, payments, provider, env, now = Date.now } = {}) {
  if (env?.VERCEL_ENV !== 'preview' || env?.NODE_ENV !== 'test'
    || [store, payments, provider].some(value => value?.kind !== 'isolated-simulation')) throw new Error('isolated_handoff_rehearsal_required');

  return async function rehearse(input) {
    if (!input || Object.keys(input).sort().join(',') !== 'approvalToken,approverId,attemptId,claimId,confirmed,ownerId'
      || input.confirmed !== true || !['claimId', 'attemptId', 'ownerId', 'approverId'].every(key => uuid(input[key]))) throw new Error('explicit_handoff_review_required');
    const { claimId, attemptId, ownerId, approverId, approvalToken } = input;
    let saved;
    try { saved = await store.load(claimId, attemptId, ownerId); }
    catch { return packet('storage_unavailable'); }
    const { claim, attempt, handoff } = saved || {};
    if (!claim || !attempt || claim.claim_id !== claimId || claim.user_id !== ownerId || claim.environment !== 'preview'
      || claim.state !== 'reserved_for_review' || attempt.attempt_id !== attemptId || attempt.user_id !== ownerId
      || !uuid(attempt.claim_token)) throw new Error('matching_review_attempt_required');
    // A saved transfer never supplies another one-shot decision, including after
    // an acknowledgement was lost, policy expiry, or provider uncertainty.
    if (handoff) {
      if (handoff.claim_id !== claimId || handoff.attempt_id !== attemptId || handoff.user_id !== ownerId) throw new Error('saved_handoff_binding_changed');
      return packet(['dispatching', 'provider_verified', 'credentials_ready', 'reconciliation_required'].includes(attempt.state)
        ? attempt.state : 'reconciliation_required', true);
    }
    if (attempt.state !== 'reserved') return packet('reconciliation_required', true);
    const clock = now();
    if (!Number.isSafeInteger(clock) || claim.utc_day !== new Date(clock).toISOString().slice(0, 10)) throw new Error('current_review_budget_day_required');
    const session = await payments.retrieve(claim.checkout_session_id);
    const payment = validatePaidSession(session, false, ownerId);
    verifySettledPaidIntent(session, payment, false);
    await store.assertOwnerAndEligibility(ownerId);
    const snapshot = await provider.snapshot();
    const mapping = buildPaidPlanMapping({ schemaVersion: 1, readOnly: true, checkedAt: new Date(snapshot.checkedAt).toISOString(), packages: snapshot.packages });
    const entry = mapping.entries.find(row => row.tier === payment.tier && row.connections === payment.connections);
    const currentPackage = snapshot.packages.find(row => row.id === entry?.provider.id);
    const selected = validateMappedPackage(entry, currentPackage);
    const review = { session, ownerId, approverId, entry, currentPackage, account: snapshot.account, checkedAt: snapshot.checkedAt };
    const approval = verifyPaidApproval(approvalToken, review, env, now());
    const bindingHash = hash(JSON.stringify({ sessionId: payment.sessionId, ownerId, intentId: payment.intentId,
      tier: payment.tier, connections: payment.connections, amountCents: payment.cents, resellerId: approval.resellerId, packageFingerprint: entry.provider.fingerprint }));
    if (claim.checkout_session_id !== payment.sessionId || claim.payment_intent_id !== payment.intentId
      || attempt.checkout_session_id !== payment.sessionId || attempt.payment_intent_id !== payment.intentId
      || claim.reseller_id !== approval.resellerId || attempt.reseller_id !== approval.resellerId
      || claim.package_id !== selected.id || attempt.package_id !== selected.id || claim.package_fingerprint !== entry.provider.fingerprint
      || String(claim.cost_units) !== approval.costUnits || creditUnits(attempt.expected_credits) !== BigInt(approval.costUnits)
      || attempt.binding_hash !== bindingHash || attempt.package_months !== selected.duration.count
      || attempt.connections !== selected.maxConnections || !isDeepStrictEqual(attempt.bouquet_ids, selected.bouquetIds)) throw new Error('handoff_payment_package_binding_changed');
    // The execution balance is fresh approval evidence. The immutable review
    // claim's historical balance must not be substituted for it or overwritten.
    const login = openStreamingLogin(attempt.login_envelope, { environment: 'preview', ownerId, sessionId: payment.sessionId, attemptId }, env);
    if (hash(login.username) !== attempt.username_hash) throw new Error('handoff_login_binding_changed');
    const encoded = JSON.parse(Buffer.from(approvalToken.split('.')[0], 'base64url').toString('utf8'));
    const evidence = { approvalId: encoded.nonce, claimId, attemptId, approverId, tokenHash: hash(approvalToken),
      costUnits: approval.costUnits, balanceUnits: approval.balanceUnits,
      evidenceAt: new Date(snapshot.checkedAt).toISOString(), expiresAt: new Date(encoded.expires).toISOString() };
    try { await store.capture(evidence); }
    catch { return packet('approval_capture_pending'); }
    let result;
    // Adapter contract: resolve only AFTER COMMIT and deferred constraints.
    // A timeout/lost reply never grants a decision, and is never retried here.
    try { result = await store.transfer(evidence, attempt.claim_token); }
    catch { return packet('reconciliation_required'); }
    if (result?.may_dispatch !== false || typeof result.replayed !== 'boolean' || typeof result.would_dispatch !== 'boolean') return packet('reconciliation_required', true);
    if (result.replayed && !result.would_dispatch && ['dispatching', 'provider_verified', 'credentials_ready', 'reconciliation_required'].includes(result.state)) return packet(result.state, true);
    if (result.replayed || !result.would_dispatch || result.state !== 'dispatching') return packet('reconciliation_required', true);
    try {
      verifyPaidApproval(approvalToken, review, env, now());
      if (claim.utc_day !== new Date(now()).toISOString().slice(0, 10)) throw new Error('review_day_changed');
    } catch { return packet('reconciliation_required'); }
    return packet('dispatching', false, true);
  };
}
