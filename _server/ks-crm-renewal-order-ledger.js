import { createHash } from 'node:crypto';
import { orderRenewalPurpose } from './ks-crm-renewal-order-plan.js';

const project = 'https://wftfxerblhlsxiijtfbo.supabase.co';
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
const states = ['reserved','dispatching','provider_verified','reconciliation_required','complete'];

// Server adapter. The caller must supply an independently authenticated
// admin and an explicit service client. No client/key creation or env fallback.
// There is no switch mutation and no access to the test-approval namespace.
export function createOrderRenewalLedger({ client, projectUrl } = {}) {
  if (projectUrl !== project || client?.supabaseUrl !== project || typeof client.rpc !== 'function') throw Error('active_live_renewal_project_required');
  const rpc = async (name, args) => {
    const { data, error } = await client.rpc(name, args);
    if (error) throw Error('live_renewal_ledger_unavailable');
    return data;
  };
  const binding = (receipt, token) => {
    if (receipt?.purpose !== orderRenewalPurpose || receipt.mode !== 'changed-order-consent-only' || receipt.mayDispatch !== false
      || ![receipt.operationId,receipt.consentId,receipt.actorId,receipt.customerId].every(uuid)
      || !/^[a-f0-9]{64}$/.test(receipt.fingerprint || '') || typeof token !== 'string' || token.length > 1100) throw Error('live_renewal_binding_required');
    return { p_operation: receipt.operationId, p_approval: receipt.consentId, p_approver: receipt.actorId,
      p_customer: receipt.customerId, p_fingerprint: receipt.fingerprint,
      p_approval_hash: createHash('sha256').update(token).digest('hex') };
  };
  const claim = (receipt, record) => {
    if (!uuid(receipt?.operationId) || !uuid(record?.claimToken)) throw Error('live_renewal_claim_required');
    return { p_operation: receipt.operationId, p_claim: record.claimToken };
  };
  return Object.freeze({
    async enabled() {
      const rows = [];
      for (const table of ['ks_crm_order_renewal_control','ks_crm_renewal_control','ks_crm_live_renewal_control']) {
        rows.push(await client.from(table).select('execution_enabled').eq('singleton', true).maybeSingle());
      }
      if (rows.some(row => row.error || typeof row.data?.execution_enabled !== 'boolean')) throw Error('changed_order_gate_unavailable');
      return rows[0].data.execution_enabled && !rows[1].data.execution_enabled && !rows[2].data.execution_enabled;
    },
    async lookup(receipt, token) {
      const row = await rpc('ks_crm_order_lookup_renewal', binding(receipt, token));
      if (row === null) return null;
      if (!row || !states.includes(row.state) || !uuid(row.claimToken)
        || row.plan?.purpose !== orderRenewalPurpose || row.plan.kind !== 'changed_order_consent'
        || row.plan.fingerprint !== receipt.fingerprint || row.plan.customerId !== receipt.customerId
        || (['provider_verified','complete'].includes(row.state) !== (typeof row.resultExpiry === 'string'))
        || (row.resultExpiry && !Number.isFinite(Date.parse(row.resultExpiry)))
        || (row.state !== 'reserved' && row.state !== 'reconciliation_required' && !Number.isFinite(Date.parse(row.dispatchedAt)))) throw Error('live_renewal_record_unverified');
      return row;
    },
    async reserve(receipt, token, plan, expiresAt) {
      const args = binding(receipt, token);
      if (plan?.purpose !== orderRenewalPurpose || plan.kind !== 'changed_order_consent' || plan.executionEnabled !== false
        || plan.customerId !== receipt.customerId || plan.fingerprint !== receipt.fingerprint) throw Error('live_renewal_binding_required');
      const row = await rpc('ks_crm_order_reserve_renewal', { p_operation: args.p_operation, p_approval: args.p_approval,
        p_approver: args.p_approver, p_plan: plan, p_expires: expiresAt, p_approval_hash: args.p_approval_hash });
      if (!row || !uuid(row.claimToken) || row.may_dispatch !== false || typeof row.replayed !== 'boolean'
        || !states.includes(row.state)) throw Error('live_renewal_reservation_unverified');
      return row;
    },
    async begin(receipt, record) { return rpc('ks_crm_order_begin_renewal', claim(receipt, record)); },
    async stop(receipt, record) { await rpc('ks_crm_order_stop_renewal', claim(receipt, record)); },
    async verified(receipt, record, result, balance) {
      await rpc('ks_crm_order_verify_renewal', { ...claim(receipt, record), p_result: result,
        p_returned_expiry: result.expiresAt, p_balance: balance });
    },
    async complete(receipt, record, expiry) {
      const row = await rpc('ks_crm_order_complete_renewal', { ...claim(receipt, record), p_current_expiry: expiry });
      if (row?.state !== 'complete' || row.may_dispatch !== false || typeof row.replayed !== 'boolean') throw Error('live_renewal_completion_unverified');
      return row;
    },
  });
}
