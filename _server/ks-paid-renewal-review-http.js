import { createPaidRenewalReadProvider } from './ks-crm-renewal-live-provider.js';
import { verifyPaidRenewalReview } from './ks-paid-renewal-verification.js';
import { savePaidRenewalQuoteApproval } from './ks-paid-renewal-approval.js';
import { PaymentError } from './ks-payment-validation.js';
const project = 'https://wftfxerblhlsxiijtfbo.supabase.co';
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const uuid = v => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v);
export function createPaidRenewalReviewHandler({ createClient, env = process.env, now = Date.now,
  providerFactory = createPaidRenewalReadProvider } = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('Vary', 'Authorization');
    const reply = (code, body) => res.status(code).json(body);
    if (!['preview','production'].includes(env.VERCEL_ENV)) return reply(404, { error: 'Renewal verification is unavailable.' });
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reply(405, { error: 'Method not allowed.' }); }
    let origin; try { origin = new URL(req.headers?.origin); } catch { /* Rejected below. */ }
    if (!origin || origin.protocol !== 'https:' || origin.origin !== req.headers.origin || origin.host !== req.headers.host) return reply(403, { error: 'Use the renewal review on the website.' });
    const b = req.body;
    const saving = b?.action === 'save-quote-approval';
    const allowed = saving ? 'action,approvalOnlyConfirmed,costCredits,expectedQuoteFingerprint,operationId,preserveChannelsConfirmed,reference,serviceChangesConfirmed'
      : null;
    if (Object.keys(req.query || {}).join(',') !== 'view' || req.query.view !== 'paid-renewal-verification'
      || !/^application\/json(?:;\s*charset=utf-8)?$/i.test(req.headers?.['content-type'] || '')
      || !b || typeof b !== 'object' || Array.isArray(b)
      || (saving ? Object.keys(b).sort().join(',') !== allowed : !['reference','operationId,reference'].includes(Object.keys(b).sort().join(',')))
      || typeof b.reference !== 'string' || b.reference.length > 200 || !/^cs_live_[A-Za-z0-9]+$/.test(b.reference)
      || (b.operationId !== undefined && !uuid(b.operationId))
      || (saving && (!uuid(b.operationId) || b.approvalOnlyConfirmed !== true || b.preserveChannelsConfirmed !== true || b.serviceChangesConfirmed !== true
        || !/^[a-f0-9]{64}$/.test(b.expectedQuoteFingerprint || '') || typeof b.costCredits !== 'string' || b.costCredits.length>15))) return reply(400, { error: 'Choose the saved renewal verification attempt and review its exact quote.' });
    if (env.VITE_SUPABASE_URL !== project || !env.VITE_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) return reply(503, { error: 'Renewal verification is unavailable.' });
    const token = typeof req.headers?.authorization === 'string' && /^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];
    if (!token) return reply(401, { error: 'Sign in to your administrator account.' });
    try {
      const { data, error } = await createClient(project, env.VITE_SUPABASE_ANON_KEY, options).auth.getUser(token);
      const user = data?.user;
      if (error || !uuid(user?.id)) return reply(401, { error: 'Sign in to your administrator account again.' });
      if (user.is_anonymous || !user.email_confirmed_at || user.email?.trim().toLowerCase() !== 'djudge47@gmail.com') return reply(403, { error: 'Only the administrator can verify paid renewals.' });
      const admin = createClient(project, env.SUPABASE_SERVICE_ROLE_KEY, options);
      let lookup = admin.from('ks_paid_renewal_review_bindings').select('checkout_session_id,operation_id,user_id').eq('checkout_session_id', b.reference);
      if (b.operationId !== undefined) lookup = lookup.eq('operation_id', b.operationId);
      const { data: binding, error: readError } = await lookup.maybeSingle();
      if (readError) throw Error('binding_unavailable');
      if (!binding) return reply(404, { error: 'The saved paid renewal attempt was not found.' });
      if (binding.checkout_session_id !== b.reference || !uuid(binding.operation_id)
        || (b.operationId !== undefined && binding.operation_id !== b.operationId) || !uuid(binding.user_id)) throw Error('binding_changed');
      // Ownership is rechecked before the provider constructor is even used.
      const provider = { snapshot: customer => providerFactory({ env, now }).snapshot(customer) };
      const input = { admin, provider, reference: b.reference, ownerId: binding.user_id, operationId: binding.operation_id, now };
      const result = saving ? await savePaidRenewalQuoteApproval({ ...input, actorId: user.id,
        expectedQuoteFingerprint: b.expectedQuoteFingerprint, costCredits: b.costCredits,
        approvalOnlyConfirmed: b.approvalOnlyConfirmed, preserveChannelsConfirmed: b.preserveChannelsConfirmed, serviceChangesConfirmed: b.serviceChangesConfirmed })
        : await verifyPaidRenewalReview(input);
      return reply(200, { mode: 'verification-only', ...result });
    } catch (error) {
      if (error instanceof PaymentError) return reply(error.status, { mode: 'verification-only', mayDispatch: false, providerActivated: false, error: error.message });
      return reply(503, { mode: 'verification-only', state: 'verification_unavailable', mayDispatch: false, providerActivated: false,
        error: 'The saved renewal could not be verified. Retry this same attempt; do not start another payment or renewal.' });
    }
  };
}
