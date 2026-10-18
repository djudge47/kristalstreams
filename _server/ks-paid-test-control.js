import { createPaidActivationReviewHandler } from './ks-paid-activation-review.js';
import { createPaidExecutionStore } from './ks-paid-execution-store.js';
import { createInternalPaidSetupWorker } from './ks-paid-worker.js';
import { issuePaidApproval, verifyPaidApproval, creditUnits } from './ks-paid-approval.js';
import { checkoutOrigin } from './ks-payments.js';

const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const referenceValid = value => typeof value === 'string' && value.length <= 200 && /^cs_test_[A-Za-z0-9]+$/.test(value);
const branch = 'codex/roomba-https-preview-f00470c0';
const states = { reserved: 'reserved', dispatching: 'processing', provider_verified: 'completion_pending', credentials_ready: 'complete', reconciliation_required: 'reconciliation_required' };
const confirmation = 'SPEND 1 CREDIT';

// No scope is installed by this release. Enabling a real test requires separate
// owner approval and one server-only, exact-order configuration on this branch.
export function paidTestScope(env) {
  if (!env.KS_PREVIEW_PAID_TEST_SCOPE) return null;
  if (env.VERCEL_ENV !== 'preview' || env.VERCEL_GIT_COMMIT_REF !== branch
    || typeof env.KS_PREVIEW_PAID_TEST_SCOPE !== 'string' || env.KS_PREVIEW_PAID_TEST_SCOPE.length > 1024) throw new Error('invalid_paid_test_scope');
  let value;
  try { value = JSON.parse(env.KS_PREVIEW_PAID_TEST_SCOPE); } catch { throw new Error('invalid_paid_test_scope'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).sort().join(',') !== 'creditUnits,customerEmail,enabled,ownerId,resellerId,sessionId'
    || value.enabled !== true || !referenceValid(value.sessionId) || !uuid(value.ownerId)
    || typeof value.customerEmail !== 'string' || value.customerEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.customerEmail)
    || typeof value.resellerId !== 'string' || !/^[1-9]\d{0,14}$/.test(value.resellerId) || value.creditUnits !== '1000000') throw new Error('invalid_paid_test_scope');
  return value;
}

export function createPaidTestControlHandler({ createClient, env = process.env, now = Date.now,
  reviewFactory = createPaidActivationReviewHandler, storeFactory = createPaidExecutionStore, workerFactory = createInternalPaidSetupWorker } = {}) {
  const options = { auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(8000) }) } };
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('Vary', 'Authorization');
    if (env.VERCEL_ENV !== 'preview') return res.status(404).json({ error: 'This controlled test is available in Preview only.' });
    if (!['GET','POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Unsupported test action.' }); }
    const accessToken = typeof req.headers?.authorization === 'string' && /^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];
    if (!accessToken) return res.status(401).json({ error: 'Please sign in to your administrator account.' });
    const reference = req.method === 'GET' ? req.query?.sessionId : req.body?.sessionId;
    if (!referenceValid(reference)) return res.status(400).json({ error: 'Choose the saved sandbox order.' });
    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({ error: 'The paid test control needs configuration.' });
    let dispatched = false;
    try {
      const { data, error } = await createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, options).auth.getUser(accessToken);
      const user = data?.user;
      if (error || !uuid(user?.id)) return res.status(401).json({ error: 'Please sign in again.' });
      if (user.is_anonymous || !user.email_confirmed_at || user.email?.toLowerCase() !== 'djudge47@gmail.com') return res.status(403).json({ error: 'Administrator access is required.' });
      if (req.method === 'POST') {
        if (typeof req.headers.origin !== 'string' || !/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) return res.status(400).json({ error: 'Use the approval form on this Preview website.' });
        checkoutOrigin(req, env);
      }
      const packet = (state, extra = {}) => ({ version: 1, previewOnly: true, adminAccountId: user.id, reference, state,
        canPrepare: ['not_started','reserved'].includes(state), canExecute: state === 'review_ready', canComplete: state === 'completion_pending', ...extra });
      const scope = paidTestScope(env);
      if (!scope) {
        if (req.method === 'POST') return res.status(409).json({ error: 'Real paid activation is disabled. No approval or provider request was made.' });
        return res.status(200).json(packet('disabled'));
      }
      if (reference !== scope.sessionId || user.id === scope.ownerId) return res.status(403).json({ error: 'This test control is restricted to its separately approved new-customer order.' });
      const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options);
      const load = async () => {
        const { data: attempt, error: readError } = await admin.from('ks_preview_provisioning_attempts').select('attempt_id,user_id,checkout_session_id,state')
          .eq('checkout_session_id', scope.sessionId).eq('user_id', scope.ownerId).maybeSingle();
        if (readError || (attempt && (!uuid(attempt.attempt_id) || attempt.user_id !== scope.ownerId || attempt.checkout_session_id !== scope.sessionId || !Object.hasOwn(states, attempt.state)))) throw new Error('attempt_status_unavailable');
        return attempt;
      };
      if (req.method === 'GET') { const attempt = await load(); return res.status(200).json(packet(attempt ? states[attempt.state] : 'not_started', { customerId: scope.ownerId })); }
      const action = req.body?.action;
      if (!['prepare','execute','complete'].includes(action)) return res.status(400).json({ error: 'Choose a supported test action.' });
      if (action === 'complete') {
        const attempt = await load();
        if (!attempt || !['provider_verified','credentials_ready'].includes(attempt.state)) return res.status(409).json({ error: 'There is no verified provider result ready for local completion. Check status; do not create another line.' });
        // No approval token is supplied. A reserved attempt cannot dispatch via
        // this path even if storage were to return an inconsistent earlier state.
        dispatched = true;
        const result = await workerFactory({ admin, env })({ accessToken, attemptId: attempt.attempt_id, ownerId: scope.ownerId, confirmed: true });
        return res.status(200).json(packet(resultState(result), { customerId: scope.ownerId }));
      }
      let verified;
      const captured = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
      const inspect = reviewFactory({ createClient, env, now, captureVerifiedReview: value => { verified = value; } });
      await inspect({ method: 'GET', headers: { authorization: `Bearer ${accessToken}` }, query: { sessionId: reference } }, captured);
      if (captured.code !== 200 || !verified) return res.status(captured.code || 503).json({ error: captured.body?.error || 'A fresh paid test review is required.' });
      const { session, owner, snapshot, entry, currentPackage, payment, attempt, blockers } = verified;
      const allowedReserved = attempt?.state === 'reserved';
      if (verified.adminUser.id !== user.id || owner.id !== scope.ownerId || owner.email.toLowerCase() !== scope.customerEmail.toLowerCase()
        || payment.sessionId !== scope.sessionId || payment.tier !== 'bronze' || payment.connections !== 1 || payment.interval !== 'monthly' || payment.cents !== 2000
        || String(snapshot.account.id) !== scope.resellerId || String(creditUnits(entry.provider.credits)) !== scope.creditUnits
        || blockers.some(reason => reason !== 'existing_setup_attempt' || !allowedReserved)) return res.status(409).json({ error: 'Payment, customer, package or setup state no longer matches the approved one-credit test. No new provider request was sent.' });
      const binding = { session, ownerId: owner.id, approverId: user.id, entry, currentPackage, account: snapshot.account, checkedAt: snapshot.checkedAt };
      if (action === 'prepare') {
        const approval = issuePaidApproval(binding, env, now());
        return res.status(200).json(packet('review_ready', { customerId: scope.ownerId, review: captured.body.review, resumeReserved: allowedReserved, approvalToken: approval.token, expiresAt: approval.expiresAt }));
      }
      if (req.body.newCustomerConfirmed !== true || req.body.confirmation !== confirmation || req.body.creditUnits !== scope.creditUnits) return res.status(400).json({ error: 'Confirm this is a new streaming customer and approve exactly one real credit.' });
      verifyPaidApproval(req.body.approvalToken, binding, env, now());
      const store = storeFactory(admin, env);
      const reservation = await store.reserve({ session, ownerId: owner.id, entry, currentPackage, resellerId: scope.resellerId, newCustomerConfirmed: true });
      if (!uuid(reservation?.attemptId) || !Object.hasOwn(states, reservation.state)) throw new Error('invalid_reservation_result');
      if (!['reserved','provider_verified','credentials_ready'].includes(reservation.state)) return res.status(200).json(packet(states[reservation.state], { customerId: scope.ownerId }));
      dispatched = true;
      const result = await workerFactory({ admin, env })({ accessToken, attemptId: reservation.attemptId, ownerId: scope.ownerId, approvalToken: req.body.approvalToken, confirmed: true });
      return res.status(200).json(packet(resultState(result), { customerId: scope.ownerId }));
    } catch {
      return res.status(503).json({ error: dispatched
        ? 'The saved setup result needs a status check. Do not submit another creation or payment. Use Check activation status.'
        : 'The approval could not be verified. No provider request was sent by this action. Check activation status before trying again.' });
    }
  };
}
function resultState(result) {
  if (result?.state === 'credentials_ready') return 'complete';
  if (result?.state === 'completion_pending') return 'completion_pending';
  if (result?.state === 'reconciliation_required') return 'reconciliation_required';
  throw new Error('unverified_worker_result');
}
