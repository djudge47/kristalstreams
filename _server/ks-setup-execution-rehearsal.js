import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { validatePaidSession } from './ks-payment-validation.js';
import { verifySettledPaidIntent } from './ks-paid-settlement.js';
import { buildPaidPlanMapping, validateMappedPackage } from './ks-roomba-plan-mapping.js';
import { creditUnits } from './ks-paid-approval.js';
import { generateStreamingLogin, sealStreamingLogin, openStreamingLogin } from './ks-login-envelope.js';

const hash = value => createHash('sha256').update(value).digest('hex');
const same = isDeepStrictEqual;
const fresh = (at, clock) => Number.isSafeInteger(at) && at <= clock && clock - at <= 30000;
const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const packet = state => ({ state, simulation: true, mayDispatch: false });

// No environment variable enables real execution. There is deliberately no real
// store/provider constructor or API route for this rehearsal.
export function automaticSetupExecutionStatus() {
  return { state: 'disabled', reason: 'execution_integration_not_installed', mayDispatch: false };
}

function verifiedLine(line, claim, selected, login, dispatchedAt) {
  const expires = Date.parse(line?.expiresAt);
  if (!line || !/^[1-9]\d{0,14}$/.test(line.id || '') || line.username !== login.username
    || line.resellerId !== claim.resellerId || line.packageId !== claim.packageId
    || line.connections !== selected.maxConnections || line.trial !== false || line.enabled !== true || line.adminEnabled !== true
    || !same(line.bouquetIds, selected.bouquetIds) || !Number.isSafeInteger(dispatchedAt)
    || !Number.isFinite(expires) || expires < dispatchedAt + selected.duration.count * 27 * 86400000
    || expires > dispatchedAt + selected.duration.count * 32 * 86400000) throw new Error('simulated_provider_proof_mismatch');
  // Retain only verified fields. Never persist a raw provider body/password.
  return { id: line.id, username: line.username, resellerId: line.resellerId, packageId: line.packageId,
    connections: line.connections, bouquetIds: line.bouquetIds, expiresAt: line.expiresAt,
    trial: false, enabled: true, adminEnabled: true };
}

// Dependencies are explicitly fictional. Tests supply an isolated PostgreSQL
// store and intercepted provider/Stripe responses. This is NOT an execution
// capability for review-only claims, and cannot be promoted by setting an env.
export function createSetupExecutionRehearsal({ store, provider, payments, env, now = Date.now } = {}) {
  if ([store, provider, payments].some(value => value?.kind !== 'isolated-simulation')
    || env?.VERCEL_ENV !== 'preview' || env?.NODE_ENV !== 'test') throw new Error('isolated_rehearsal_required');

  return async function rehearse({ claimId, ownerId }) {
    if (!uuid(claimId) || !uuid(ownerId)) throw new Error('invalid_rehearsal_binding');
    let row;
    try { row = await store.load(claimId, ownerId); }
    catch { return packet('storage_unavailable'); }
    const claim = row?.claim;
    if (!claim || claim.id !== claimId || claim.ownerId !== ownerId || claim.environment !== 'preview'
      || claim.state !== 'reserved_for_review' || claim.mayDispatch !== false) throw new Error('review_claim_required');
    if (row.execution?.state === 'credentials_ready') return packet('credentials_ready');
    if (row.execution && !['prepared', 'provider_verified'].includes(row.execution.state)) return packet('reconciliation_required');

    // Re-fetch a settled payment and the confirmed owner on every unfinished
    // run, including a local completion retry. A receipt alone is insufficient.
    const session = await payments.retrieve(claim.sessionId);
    const payment = validatePaidSession(session, false, ownerId);
    verifySettledPaidIntent(session, payment, false);
    if (payment.sessionId !== claim.sessionId || payment.intentId !== claim.intentId
      || payment.tier !== claim.tier || payment.connections !== claim.connections) throw new Error('rehearsal_payment_binding_changed');
    await store.assertOwnerAndEligibility(claim);
    const context = { environment: 'preview', ownerId, sessionId: claim.sessionId, attemptId: claimId };

    if (row.execution?.state === 'provider_verified') {
      const login = openStreamingLogin(row.execution.envelope, context, env);
      if (hash(login.username) !== row.execution.usernameHash) throw new Error('rehearsal_login_binding_changed');
      const line = verifiedLine(await provider.line(row.execution.proof.id, login.password), claim,
        row.execution.selected, login, row.execution.dispatchedAt);
      if (!same(line, row.execution.proof)) return packet('reconciliation_required');
      try { await store.complete(claim, row.execution.proof); }
      catch { return packet('completion_pending'); }
      return packet('credentials_ready');
    }

    const snapshot = await provider.snapshot();
    const mapping = buildPaidPlanMapping({ schemaVersion: 1, readOnly: true,
      checkedAt: new Date(snapshot.checkedAt).toISOString(), packages: snapshot.packages });
    const entry = mapping.entries.find(value => value.tier === payment.tier && value.connections === payment.connections);
    const selected = validateMappedPackage(entry, snapshot.packages.find(value => value.id === entry?.provider.id));
    if (!fresh(snapshot.checkedAt, now()) || snapshot.account.id !== claim.resellerId || selected.id !== claim.packageId
      || entry.provider.fingerprint !== claim.packageFingerprint || String(creditUnits(selected.credits)) !== claim.costUnits
      || String(creditUnits(snapshot.account.credits)) !== claim.balanceUnits) throw new Error('fresh_matching_rehearsal_snapshot_required');
    await store.assertCurrentReservation(claim, now());

    if (!row.execution) {
      const login = generateStreamingLogin();
      // prepare must persist once before begin; a lost prepare reply never
      // calls the provider. A retry loads the original encrypted credentials.
      try { await store.prepare(claim, { envelope: sealStreamingLogin(login, context, env), usernameHash: hash(login.username), selected }); }
      catch { return packet('preparation_pending'); }
      row = await store.load(claimId, ownerId);
    }
    const execution = row.execution;
    if (execution?.state !== 'prepared') return packet('reconciliation_required');
    if (!same(execution.selected, selected)) throw new Error('prepared_rehearsal_package_changed');
    const login = openStreamingLogin(execution.envelope, context, env);
    if (hash(login.username) !== execution.usernameHash) throw new Error('rehearsal_login_binding_changed');
    const dispatchedAt = now();
    let acquired;
    // begin is a durable CAS, NOT a replayable permission. Only the caller that
    // receives true may simulate the one creation. A lost acknowledgement stops.
    try { acquired = await store.begin(claim, dispatchedAt); }
    catch { return packet('reconciliation_required'); }
    if (acquired !== true) return packet('reconciliation_required');
    try {
      if (!fresh(snapshot.checkedAt, now())) throw new Error('snapshot_expired_after_claim');
      await store.assertDispatchWindow(claim, now());
      const created = verifiedLine(await provider.create(selected, login), claim, selected, login, dispatchedAt);
      const line = verifiedLine(await provider.line(created.id, login.password), claim, selected, login, dispatchedAt);
      if (!same(created, line)) throw new Error('simulated_line_changed');
      const account = await provider.account();
      if (account.id !== claim.resellerId || creditUnits(account.credits) !== BigInt(claim.balanceUnits) - BigInt(claim.costUnits)) throw new Error('simulated_debit_changed');
      await store.verified(claim, line);
    } catch {
      // The adapter must only change dispatching -> reconciliation_required.
      // A successfully saved proof survives a lost verification reply.
      try { await store.reconcile(claim); } catch { /* durable dispatch state remains stopped */ }
      return packet('reconciliation_required');
    }
    try { await store.complete(claim, (await store.load(claimId, ownerId)).execution.proof); }
    catch { return packet('completion_pending'); }
    return packet('credentials_ready');
  };
}
