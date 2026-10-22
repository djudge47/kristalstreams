import { createHash } from 'node:crypto';
import { liveRenewalPurpose } from './ks-crm-renewal-live-plan.js';

const project = 'https://wftfxerblhlsxiijtfbo.supabase.co';
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
const states = ['reserved','dispatching','provider_verified','reconciliation_required','complete'];

// Server adapter. The caller must supply an independently authenticated
// admin and an explicit service client. No client/key creation or env fallback.
// There is no switch mutation and no access to the test-approval namespace.
export function createLiveRenewalLedger({ client, projectUrl } = {}) {
  if (projectUrl !== project || client?.supabaseUrl !== project || typeof client.rpc !== 'function') throw Error('active_live_renewal_project_required');
  const rpc = async (name, args) => {
    const { data, error } = await client.rpc(name, args);
    if (error) throw Error('live_renewal_ledger_unavailable');
    return data;
  };
  const binding = (receipt, token) => {
    if (receipt?.purpose !== liveRenewalPurpose || receipt.mode !== 'live-consent-only' || receipt.mayDispatch !== false
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
      const { data, error } = await client.from('ks_crm_live_renewal_control')
        .select('execution_enabled').eq('singleton', true).maybeSingle();
      if (error || typeof data?.execution_enabled !== 'boolean') throw Error('live_renewal_gate_unavailable');
      return data.execution_enabled;
    },
    async lookup(receipt, token) {
      const row = await rpc('ks_crm_live_lookup_renewal', binding(receipt, token));
      if (row === null) return null;
      if (!row || !states.includes(row.state) || !uuid(row.claimToken)
        || row.plan?.purpose !== liveRenewalPurpose || row.plan.kind !== 'live_consent'
        || row.plan.fingerprint !== receipt.fingerprint || row.plan.customerId !== receipt.customerId
        || (['provider_verified','complete'].includes(row.state) !== (typeof row.resultExpiry === 'string'))
        || (row.resultExpiry && !Number.isFinite(Date.parse(row.resultExpiry)))) throw Error('live_renewal_record_unverified');
      return row;
    },
    async reserve(receipt, token, plan, expiresAt) {
      const args = binding(receipt, token);
      if (plan?.purpose !== liveRenewalPurpose || plan.kind !== 'live_consent' || plan.executionEnabled !== false
        || plan.customerId !== receipt.customerId || plan.fingerprint !== receipt.fingerprint) throw Error('live_renewal_binding_required');
      const row = await rpc('ks_crm_live_reserve_renewal', { p_operation: args.p_operation, p_approval: args.p_approval,
        p_approver: args.p_approver, p_plan: plan, p_expires: expiresAt, p_approval_hash: args.p_approval_hash });
      if (!row || !uuid(row.claimToken) || row.may_dispatch !== false || typeof row.replayed !== 'boolean'
        || !states.includes(row.state)) throw Error('live_renewal_reservation_unverified');
      return row;
    },
    async begin(receipt, record) { return rpc('ks_crm_live_begin_renewal', claim(receipt, record)); },
    async stop(receipt, record) { await rpc('ks_crm_live_stop_renewal', claim(receipt, record)); },
    async verified(receipt, record, result, balance) {
      await rpc('ks_crm_live_verify_renewal', { ...claim(receipt, record), p_result: result,
        p_returned_expiry: result.expiresAt, p_balance: balance });
    },
    async complete(receipt, record, expiry) {
      const row = await rpc('ks_crm_live_complete_renewal', { ...claim(receipt, record), p_current_expiry: expiry });
      if (row?.state !== 'complete' || row.may_dispatch !== false || typeof row.replayed !== 'boolean') throw Error('live_renewal_completion_unverified');
      return row;
    },
  });
}
