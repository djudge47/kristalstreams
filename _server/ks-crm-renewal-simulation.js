import { buildPreservingRenewalPlan, assertSimulationRenewalPlan, buildPreservingRenewalForm } from './ks-crm-renewal-plan.js';
import { normalizeProviderLine } from './ks-roomba-line-snapshot.js';
import { creditUnits } from './ks-paid-approval.js';

const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const sameGroups = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function verifyResult(payload, plan, now) {
  const line = normalizeProviderLine(payload);
  const extension = Date.parse(line.expiresAt) - Date.parse(plan.previousExpiresAt);
  if (line.id !== plan.lineId || line.username !== plan.username || line.resellerId !== plan.resellerId
    || line.packageId !== plan.packageId || line.connections !== plan.connections || line.trial !== false
    || line.enabled !== true || line.adminEnabled !== true || !sameGroups(line.bouquetIds, plan.bouquetIds)
    || Date.parse(line.expiresAt) <= now || extension < plan.months * 27 * 86400000
    || extension > plan.months * 32 * 86400000) throw new Error('renewal_result_requires_review');
  // The provider's returned expiry is authoritative. The broad duration bounds
  // reject gross errors, but do not prove exact calendar/DST/month-end semantics.
  return { customerId: plan.customerId, lineId: line.id, username: line.username, resellerId: line.resellerId,
    packageId: line.packageId, expiresAt: line.expiresAt, connections: line.connections,
    bouquetIds: [...line.bouquetIds], enabled: true, adminEnabled: true, trial: false };
}

// Deliberately simulation-only. There is no HTTP route, real database adapter,
// real provider transport, live flag or approval capability in this module.
export function createSimulatedCrmRenewal({ ledger, provider, crm, now } = {}) {
  if ([ledger, provider, crm].some(adapter => adapter?.kind !== 'simulation') || typeof now !== 'function') throw new Error('simulation_adapters_required');
  return async function run({ operationId, plan, preserveCurrentSelectionConfirmed = false }) {
    if (!uuid(operationId) || preserveCurrentSelectionConfirmed !== true) throw new Error('explicit_preservation_review_required');
    assertSimulationRenewalPlan(plan);
    const claim = await ledger.reserve(operationId, plan);
    if (claim.fingerprint !== plan.fingerprint) throw new Error('renewal_operation_binding_changed');
    const record = claim.record;
    if (!claim.fresh) {
      if (record.state === 'complete') return { state: 'complete', replayed: true };
      if (!['provider_verified', 'crm_pending'].includes(record.state)) return { state: 'reconciliation_required', replayed: true };
    } else {
      // Recheck both provider evidence and the saved CRM identity before begin.
      // A failed or lost begin reply must stop without dispatching.
      try {
        const snapshot = await provider.snapshot(plan.lineId);
        const customer = await crm.current(plan.customerId);
        if (Date.parse(customer?.expiration_at) !== Date.parse(plan.previousExpiresAt)) throw new Error('crm_expiry_requires_review');
        const current = buildPreservingRenewalPlan({ ...snapshot, customer, preserveCurrentSelectionConfirmed: true }, now());
        if (current.fingerprint !== plan.fingerprint) throw new Error('renewal_review_changed');
        if (await ledger.begin(record, plan) !== true) return { state: 'reconciliation_required', replayed: false };
      } catch {
        // Never reset the operation or an uncertain begin state for retry.
        try { await ledger.stop(record); } catch { /* reserved/dispatching stays stopped */ }
        return { state: 'reconciliation_required', replayed: false };
      }
      try {
        if (now() - Date.parse(plan.checkedAt) > 30000 || Date.parse(plan.previousExpiresAt) <= now()) throw new Error('renewal_review_stale');
        const returned = verifyResult(await provider.renew(plan.lineId, buildPreservingRenewalForm(plan)), plan, now());
        const readback = verifyResult(await provider.read(plan.lineId), plan, now());
        if (readback.expiresAt !== returned.expiresAt) throw new Error('renewal_expiry_changed');
        const account = await provider.account();
        if (String(account.id) !== plan.resellerId || creditUnits(account.credits) !== BigInt(plan.balanceUnits) - BigInt(plan.costUnits)) throw new Error('renewal_debit_requires_review');
        await ledger.verified(record, readback);
      } catch {
        try { await ledger.stop(record); } catch { /* dispatching remains stopped */ }
        return { state: 'reconciliation_required', replayed: false };
      }
    }
    try {
      // Resuming local completion only reads the line; it never edits it again.
      const current = verifyResult(await provider.read(plan.lineId), plan, now());
      if (current.expiresAt !== record.result?.expiresAt) throw new Error('saved_renewal_changed');
      await crm.commit(operationId, plan, record.result);
      await ledger.complete(record);
    } catch { return { state: 'crm_pending', replayed: !claim.fresh }; }
    return { state: 'complete', replayed: !claim.fresh };
  };
}
