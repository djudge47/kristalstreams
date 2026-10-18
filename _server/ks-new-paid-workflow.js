// Simulation-only orchestration. There is no live provider, database or mail adapter.
import { createHash } from 'node:crypto';
import { validatePaidSession } from './ks-payment-validation.js';
import { validateMappedPackage } from './ks-roomba-plan-mapping.js';
import { normalizeProviderLine } from './ks-roomba-line-snapshot.js';

const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const fingerprint = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

// The documented create_line multipart body, kept offline. Never put this body in a response/log.
export function buildPaidCreationForm(provider, credentials) {
  if (!provider || !/^[1-9]\d{0,11}$/.test(provider.id) || provider.duration?.unit !== 'months'
    || ![1, 3, 6, 12].includes(provider.duration.count) || !Number.isInteger(provider.maxConnections)
    || provider.maxConnections < 1 || provider.maxConnections > 5 || !Array.isArray(provider.bouquetIds)
    || provider.bouquetIds.length === 0 || provider.bouquetIds.length > 2000
    || new Set(provider.bouquetIds).size !== provider.bouquetIds.length
    || !provider.bouquetIds.every(id => Number.isSafeInteger(id) && id > 0 && id <= 2147483647)
    || !/^[A-Za-z0-9_.-]{8,64}$/.test(credentials?.username || '')
    || typeof credentials.password !== 'string' || !/^[A-Za-z0-9_-]{24,64}$/.test(credentials.password)) throw new Error('invalid_creation');
  const form = new FormData();
  for (const [key, value] of Object.entries({ trial: '0', username: credentials.username, password: credentials.password,
    package: provider.id, package_duration: `${provider.duration.count} months`, max_connections: String(provider.maxConnections) })) form.append(key, value);
  for (const id of provider.bouquetIds) form.append('bouquets_selected[]', String(id));
  return form;
}

function verifyCreatedLine(payload, expected, now) {
  const line = normalizeProviderLine(payload);
  if (line.id !== expected.lineId || line.username !== expected.username || line.resellerId !== expected.resellerId
    || line.packageId !== expected.provider.id || line.connections !== expected.provider.maxConnections
    || line.trial !== false || !line.enabled || !line.adminEnabled || Date.parse(line.expiresAt) <= now
    || Date.parse(line.expiresAt) > now + expected.provider.duration.count * 32 * 86400000
    || Date.parse(line.expiresAt) < now + expected.provider.duration.count * 27 * 86400000
    || JSON.stringify(line.bouquetIds) !== JSON.stringify(expected.provider.bouquetIds)) throw new Error('line_mismatch');
  return line; // normalizeProviderLine has discarded password and arbitrary response fields.
}

export function createSimulatedPaidWorkflow({ ledger, provider, crm, delivery, credentials, now } = {}) {
  // Do not wire this into checkout/webhooks. These adapters are explicitly simulated.
  if ([ledger, provider, crm, delivery].some(adapter => adapter?.kind !== 'simulation') || typeof credentials !== 'function'
    || typeof now !== 'function') throw new Error('simulation_adapters_required');
  return async function run({ session, ownerId, entry, currentPackage, existingLineId = null }) {
    if (!uuid(ownerId)) throw new Error('invalid_owner');
    const payment = validatePaidSession(session, false, ownerId);
    if (payment.tier !== entry?.tier || payment.connections !== entry.connections) throw new Error('plan_mismatch');
    const selected = validateMappedPackage(entry, currentPackage);
    if (existingLineId !== null) return { state: 'existing_line_requires_review', replay: false };
    const binding = { sessionId: payment.sessionId, intentId: payment.intentId, ownerId, resellerId: provider.resellerId,
      packageFingerprint: entry.provider.fingerprint, amountCents: payment.cents, currency: 'usd' };
    if (!/^[1-9]\d{0,14}$/.test(binding.resellerId || '')) throw new Error('invalid_reseller');
    const key = `sandbox:new_paid:${payment.sessionId}`;
    const digest = fingerprint(binding);
    // The simulation store implements an atomic unique reservation, not a production database guarantee.
    const claim = await ledger.reserve(key, digest);
    if (claim.digest !== digest) throw new Error('attempt_binding_changed');
    if (!claim.fresh) {
      if (claim.state === 'ready') return { state: 'ready', replay: true };
      if (!['provider_verified', 'crm_pending', 'delivery_pending'].includes(claim.state)) return { state: 'reconciliation_required', replay: true };
    }
    const state = claim.record;
    if (claim.fresh) {
      const balance = await provider.balance();
      if (!Number.isFinite(balance) || balance < selected.credits) {
        await ledger.set(state, 'blocked_before_creation');
        return { state: 'blocked_before_creation', replay: false };
      }
      const login = credentials();
      const form = buildPaidCreationForm(selected, login);
      // Persist the attempt BEFORE issuing a potentially credit-spending request. No automatic resend.
      await ledger.set(state, 'creating');
      try {
        const creation = await provider.create(form);
        const created = normalizeProviderLine(creation);
        const expected = { lineId: created.id, username: login.username, resellerId: binding.resellerId, provider: selected };
        verifyCreatedLine(creation, expected, now());
        const current = await provider.read(created.id);
        const line = verifyCreatedLine(current, expected, now());
        if (await provider.balance() !== balance - selected.credits) throw new Error('credit_change_requires_review');
        // Credentials remain only in this simulated adapter's memory, never in the API report.
        await ledger.verified(state, { line, login, binding });
      } catch {
        await ledger.set(state, 'reconciliation_required');
        return { state: 'reconciliation_required', replay: false };
      }
    }
    // Local retries may resume the saved simulated result, never issue another provider create.
    try {
      await crm.commit(key, state.result);
    } catch {
      await ledger.set(state, 'crm_pending');
      return { state: 'crm_pending', replay: !claim.fresh };
    }
    try {
      await delivery.deliver(key, state.result.login);
    } catch {
      await ledger.set(state, 'delivery_pending');
      return { state: 'delivery_pending', replay: !claim.fresh };
    }
    await ledger.set(state, 'ready');
    return { state: 'ready', replay: !claim.fresh };
  };
}
