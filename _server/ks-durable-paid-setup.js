import { createHash, randomUUID } from 'node:crypto';
import { validatePaidSession } from './ks-payment-validation.js';
import { validateMappedPackage } from './ks-roomba-plan-mapping.js';
import { generateStreamingLogin, sealStreamingLogin } from './ks-login-envelope.js';

const hash = value => createHash('sha256').update(value).digest('hex');
const columns = 'attempt_id,checkout_session_id,user_id,binding_hash,claim_token,state,login_envelope';
// Internal service-only adapter. Not imported by any paid execution endpoint/webhook.
export async function reserveDurablePaidSetup({ admin, session, ownerId, entry, currentPackage, resellerId,
  newCustomerConfirmed = false, environment, env = process.env }) {
  if (environment !== 'preview' || newCustomerConfirmed !== true || typeof ownerId !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ownerId)) throw new Error('preview_new_customer_review_required');
  const paid = validatePaidSession(session, false, ownerId);
  const selected = validateMappedPackage(entry, currentPackage);
  if (entry.tier !== paid.tier || entry.connections !== paid.connections || typeof resellerId !== 'string' || !/^[1-9]\d{0,14}$/.test(resellerId)) throw new Error('invalid_attempt_binding');
  const bindingHash = hash(JSON.stringify({ sessionId: paid.sessionId, ownerId: paid.userId, intentId: paid.intentId,
    tier: paid.tier, connections: paid.connections, amountCents: paid.cents, resellerId, packageFingerprint: entry.provider.fingerprint }));
  const find = async () => {
    const { data, error } = await admin.from('ks_preview_provisioning_attempts').select(columns)
      .eq('checkout_session_id', paid.sessionId).eq('user_id', ownerId).maybeSingle();
    if (error) throw new Error('attempt_storage_unavailable');
    if (data && (data.user_id !== ownerId || data.checkout_session_id !== paid.sessionId || data.binding_hash !== bindingHash)) throw new Error('attempt_binding_changed');
    return data;
  };
  const prior = await find();
  if (prior) return { attemptId: prior.attempt_id, state: prior.state, replayed: true };
  const attemptId = randomUUID(), login = generateStreamingLogin();
  const envelope = sealStreamingLogin(login, { environment: 'preview', ownerId, sessionId: paid.sessionId, attemptId }, env);
  const { data, error } = await admin.rpc('ks_reserve_preview_provisioning', {
    p_attempt_id: attemptId, p_session_id: paid.sessionId, p_user_id: ownerId, p_binding_hash: bindingHash,
    p_reseller_id: resellerId, p_package_id: selected.id, p_months: selected.duration.count,
    p_connections: selected.maxConnections, p_credits: selected.credits, p_bouquets: selected.bouquetIds,
    p_envelope: envelope, p_username_hash: hash(login.username), p_new_customer_confirmed: true,
  });
  // A lost reservation reply or concurrent reserve can be recovered by a safe read. Never send a provider request here.
  if (error || !data?.attemptId) {
    const recovered = await find();
    if (!recovered) throw new Error('attempt_reservation_unavailable');
    return { attemptId: recovered.attempt_id, state: recovered.state, replayed: true };
  }
  if (data.attemptId !== attemptId || data.fresh !== true || data.state !== 'reserved') throw new Error('attempt_binding_changed');
  return { attemptId, state: 'reserved', replayed: false };
}
