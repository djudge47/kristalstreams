import { reserveDurablePaidSetup } from './ks-durable-paid-setup.js';

const columns = 'attempt_id,user_id,checkout_session_id,payment_intent_id,binding_hash,claim_token,state,reseller_id,package_id,package_months,connections,expected_credits,bouquet_ids,login_envelope,username_hash,provider_line_id,provider_expires_at';
// Service-only adapter. Never return its internal record, token or envelope to a client.
export function createPaidExecutionStore(admin, env = process.env) {
  const rpc = async (name, args) => {
    const { data, error } = await admin.rpc(name, args);
    if (error) throw new Error('paid_setup_storage_unavailable');
    return data;
  };
  const claim = attempt => ({ p_attempt_id: attempt.attempt_id, p_claim_token: attempt.claim_token });
  return {
    async reserve(input) { await this.assertNewCustomer(input.ownerId); return reserveDurablePaidSetup({ ...input, admin, env, environment: 'preview' }); },
    async load(attemptId, ownerId) {
      const { data, error } = await admin.from('ks_preview_provisioning_attempts').select(columns).eq('attempt_id', attemptId).eq('user_id', ownerId).maybeSingle();
      if (error) throw new Error('paid_setup_storage_unavailable');
      return data;
    },
    async assertNewCustomer(ownerId) {
      const { data: auth, error: authError } = await admin.auth.admin.getUserById(ownerId);
      const user = auth?.user;
      if (authError || user?.id !== ownerId || user.is_anonymous || !user.email_confirmed_at || typeof user.email !== 'string' || !user.email) throw new Error('confirmed_customer_required');
      const { data: profile, error: profileError } = await admin.from('profiles').select('id,email').eq('id', ownerId).maybeSingle();
      if (profileError || profile?.id !== ownerId || typeof profile.email !== 'string' || profile.email.toLowerCase() !== user.email.toLowerCase()) throw new Error('customer_identity_requires_review');
      if (await rpc('ks_assert_preview_new_customer', { p_user_id: ownerId }) !== true) throw new Error('new_customer_review_required');
    },
    async begin(attempt, approval) { return rpc('ks_begin_approved_preview_provisioning', { ...claim(attempt),
      p_approver_id: approval.approverId, p_approval_hash: approval.tokenHash, p_approval_expires_at: approval.expiresAt,
      p_credit_cost_units: approval.costUnits, p_balance_units: approval.balanceUnits }); },
    async verified(attempt, line) { if (await rpc('ks_record_preview_provider_result', { ...claim(attempt), p_line_id: line.id,
      p_reseller_id: line.resellerId, p_package_id: line.packageId, p_username_hash: attempt.username_hash,
      p_connections: line.connections, p_bouquets: line.bouquetIds, p_expires_at: line.expiresAt }) !== true) throw new Error('provider_result_not_saved'); },
    async reconcile(attempt) { return rpc('ks_reconcile_preview_provisioning', claim(attempt)); },
    async complete(attempt, username) {
      const result = await rpc('ks_commit_preview_paid_setup', { ...claim(attempt), p_username: username });
      if (result?.ok !== true || result.state !== 'credentials_ready') throw new Error('paid_completion_not_saved');
      return { ok: true };
    },
  };
}
