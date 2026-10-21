import { createRoombaPreviewHandler } from './ks-roomba-preview.js';
import { createFixieDispatcher } from './ks-fixie-proxy.js';
import { buildPackageSummary } from '../_shared/ks-roomba-package-summary.js';
import { buildPreservingRenewalPlan } from './ks-crm-renewal-plan.js';
import { renewalUuid, verifyRenewalTestReview, renewalTestApprovalHash } from './ks-crm-renewal-test-review.js';

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const project = 'https://wftfxerblhlsxiijtfbo.supabase.co';
const canonicalId = value => ['string','number'].includes(typeof value) && /^[1-9]\d{0,14}$/.test(String(value));
const stepLabels = { saved_customer: 'saved customer check', account: 'XUI account check',
  line: 'XUI customer line check', packages: 'XUI package list check', plan: 'renewal plan check' };
const timeoutReasons = new Set(['TIMEOUT','KS_RESPONSE_TIMEOUT','UND_ERR_CONNECT_TIMEOUT','UND_ERR_HEADERS_TIMEOUT','UND_ERR_BODY_TIMEOUT','ETIMEDOUT']);
const planFailureReasons = new Map([
  ['fresh_selection_review_required','evidence_expired'], ['renewal_identity_changed','identity_changed'],
  ['active_paid_line_required','active_line_required'], ['same_package_required','package_unverified'],
  ['selection_outside_current_package','selection_unverified'], ['insufficient_renewal_credits','credits_unavailable'],
]);
class TestReadFailure extends Error {
  constructor(reason) { super('test_read_failed'); this.reason = reason; }
}
function readFailure(code, body) {
  return new TestReadFailure(timeoutReasons.has(body?.reason) ? 'timeout'
    : body?.upstreamStatus === 429 || body?.reason === 'PROXY_HTTP_429' || code === 429 ? 'rate_limited'
      : body?.reason === 'PROXY_HTTP_407' ? 'proxy_refused'
        : body?.upstreamStatus === 403 ? 'provider_refused'
          : code === 503 ? 'configuration_unavailable'
            : body?.status === 'unexpected_response' || ['KS_INVALID_JSON','KS_HTML_RESPONSE','KS_RESPONSE_TOO_LARGE','KS_RESPONSE_COMPLEXITY','NON_JSON_RESPONSE'].includes(body?.reason) ? 'invalid_response'
              : 'connection_failed');
}
function verificationFailure(error, step) {
  const reason = error instanceof TestReadFailure ? error.reason
    : step === 'plan' ? planFailureReasons.get(error?.message) || 'verification_failed' : 'verification_failed';
  const descriptions = { timeout: 'timed out', rate_limited: 'was rate-limited', proxy_refused: 'was refused by the proxy',
    provider_refused: 'was refused by XUI', configuration_unavailable: 'could not connect with the configured settings',
    invalid_response: 'returned incomplete or unreadable details', connection_failed: 'could not reach XUI',
    verification_failed: 'returned details that could not be verified', evidence_expired: 'used evidence that expired',
    identity_changed: 'found a customer, line or reseller mismatch', active_line_required: 'could not verify an active paid line',
    package_unverified: 'could not verify the same package and connection allowance',
    selection_unverified: 'could not verify the current channel selection', credits_unavailable: 'could not verify sufficient credits' };
  return { error: `The ${stepLabels[step]} ${descriptions[reason]}. No test approval was saved. Load a new renewal review.`,
    diagnostic: { step, reason } };
}

// This handler has no provider write adapter, form builder, begin/verify/complete
// RPC or execution switch mutation. It can only save simulation-only evidence.
export function createRenewalTestApprovalHandler({ createClient, env = process.env, now = Date.now,
  readFactory, dispatcherFactory = createFixieDispatcher } = {}) {
  let dispatcher;
  const factory = readFactory || (settings => createRoombaPreviewHandler({ env, ...settings,
    dispatcherFactory: setting => dispatcher || (dispatcher = dispatcherFactory(setting)) }));
  const read = async settings => {
    let code, body;
    try {
      await factory(settings)({ method: 'GET', headers: { authorization: `Bearer ${env.ROOMBA_PREVIEW_SECRET}` } }, {
        setHeader() {}, status(value) { code = value; return this; }, json(value) { body = value; return this; },
      });
    } catch { throw new TestReadFailure('connection_failed'); }
    if (code !== 200 || body?.transport !== 'fixie' || body.mode !== 'read-only' || body.databaseWrites !== false) throw readFailure(code, body);
    return body;
  };
  return async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    const reply = (code, body) => res.status(code).json(body);
    if (env.VERCEL_ENV !== 'preview') return reply(404, { error: 'Test approvals are available in Preview only.' });
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reply(405, { error: 'Method not allowed.' }); }
    let origin;
    try { origin = new URL(req.headers?.origin); } catch { /* reject below */ }
    if (!origin || origin.protocol !== 'https:' || origin.origin !== req.headers.origin || origin.host !== req.headers.host) {
      return reply(403, { error: 'Save this test approval from the CRM page.' });
    }
    if (env.VITE_SUPABASE_URL !== project || !env.VITE_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY
      || typeof env.ROOMBA_PREVIEW_SECRET !== 'string' || Buffer.byteLength(env.ROOMBA_PREVIEW_SECRET) < 32) {
      return reply(503, { error: 'The Kristal Streams test approval connection is unavailable.' });
    }
    const bearer = typeof req.headers.authorization === 'string' && /^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];
    if (!bearer) return reply(401, { error: 'Please sign in to your admin account.' });
    const body = req.body;
    if (!/^application\/json(?:;\s*charset=utf-8)?$/i.test(req.headers['content-type'] || '') || !body || Array.isArray(body)
      || Object.keys(body).sort().join(',') !== 'preserveCurrentSelectionConfirmed,reviewToken'
      || body.preserveCurrentSelectionConfirmed !== true || typeof body.reviewToken !== 'string'
      || Buffer.byteLength(JSON.stringify(body)) > 1024) return reply(400, { error: 'Confirm the current selection on a fresh renewal review.' });
    let admin, actor, evidence;
    try {
      const auth = createClient(project, env.VITE_SUPABASE_ANON_KEY, options);
      const { data, error } = await auth.auth.getUser(bearer);
      actor = data?.user;
      if (error || !renewalUuid(actor?.id)) return reply(401, { error: 'Please sign in again to your admin account.' });
      if (actor.is_anonymous || !actor.email_confirmed_at || actor.email?.trim().toLowerCase() !== 'djudge47@gmail.com') {
        return reply(403, { error: 'Only the Kristal Streams administrator can save a test approval.' });
      }
      evidence = verifyRenewalTestReview(body.reviewToken, { actorId: actor.id, secret: env.ROOMBA_PREVIEW_SECRET, now: now() });
      admin = createClient(project, env.SUPABASE_SERVICE_ROLE_KEY, options);
    } catch { return reply(409, { error: 'The review could not be verified. Load a new renewal review.' }); }

    const approvalHash = renewalTestApprovalHash(body.reviewToken);
    const savedResponse = replayed => ({ mode: 'test-approval-only', status: 'saved', simulation: true,
      executionEnabled: false, providerSent: false, operationId: evidence.operationId, approvalId: evidence.approvalId, replayed });
    const existing = async () => {
      const { data, error } = await admin.from('ks_crm_renewal_approvals')
        .select('approval_id,operation_id,approver_id,customer_id,approval_hash,plan_fingerprint')
        .eq('operation_id', evidence.operationId).maybeSingle();
      if (error) throw Error('approval_lookup_failed');
      if (!data) return false;
      if (data.approval_id !== evidence.approvalId || data.operation_id !== evidence.operationId
        || data.approver_id !== actor.id || data.customer_id !== evidence.customerId
        || data.approval_hash !== approvalHash || data.plan_fingerprint !== evidence.fingerprint) throw Error('approval_binding_conflict');
      const result = await admin.from('ks_crm_renewal_operations').select('state')
        .eq('operation_id', evidence.operationId).maybeSingle();
      if (result.error || result.data?.state !== 'reserved') throw Error('approval_state_requires_review');
      return true;
    };
    let attemptedSave = false;
    let verificationStep = 'saved_customer';
    try {
      const control = await admin.from('ks_crm_renewal_control').select('execution_enabled').eq('singleton', true).maybeSingle();
      if (control.error || control.data?.execution_enabled !== false) return reply(503, { error: 'The disabled test approval safeguards could not be verified.' });
      if (await existing()) return reply(200, savedResponse(true));
      if (Date.parse(evidence.expiresAt) <= now()) return reply(409, { error: 'This review expired without a saved test approval. Load a new renewal review.' });
      const row = await admin.from('iptv_customers').select('id,external_id,username,expiration_at').eq('id', evidence.customerId).maybeSingle();
      const customer = row.data;
      if (row.error || !customer || customer.id !== evidence.customerId || !canonicalId(customer.external_id)
        || !/^[A-Za-z0-9_.-]{3,64}$/.test(customer.username || '')) throw Error('customer_unverified');
      const checkedAt = new Date(now()).toISOString();
      verificationStep = 'account';
      const account = await read({ readAction: 'user_info' });
      if (account.status !== 'connected' || !canonicalId(account.account?.id)) throw Error('account_unverified');
      verificationStep = 'line';
      const result = await read({ readAction: 'get_line', lineId: String(customer.external_id) });
      if (result.status !== 'line_ready') throw Error('line_unverified');
      verificationStep = 'packages';
      const catalog = await read({ readAction: 'packages' });
      if (catalog.status !== 'packages_ready') throw Error('catalog_unverified');
      if (Date.parse(evidence.expiresAt) <= now()) return reply(409, { error: 'This review expired. Load a new renewal review before saving.' });
      verificationStep = 'plan';
      const plan = buildPreservingRenewalPlan({ customer, line: result.line, account: account.account,
        packages: buildPackageSummary(catalog.packages, checkedAt).packages, checkedAt,
        preserveCurrentSelectionConfirmed: true }, now());
      if (Date.parse(customer.expiration_at) !== Date.parse(plan.previousExpiresAt)
        || plan.fingerprint !== evidence.fingerprint || Date.parse(evidence.expiresAt) <= now()) {
        return reply(409, { error: 'The reviewed details changed or expired. Load a new renewal review before saving.' });
      }
      attemptedSave = true;
      // The operator's review intent and the new provider evidence have separate
      // deadlines. Never reuse the displayed snapshot as fresh database evidence.
      const approvalExpiresAt = new Date(Math.min(Date.parse(evidence.expiresAt), Date.parse(plan.checkedAt) + 30000)).toISOString();
      const saved = await admin.rpc('ks_crm_reserve_renewal', { p_operation: evidence.operationId,
        p_approval: evidence.approvalId, p_approver: actor.id, p_plan: plan,
        p_expires: approvalExpiresAt, p_approval_hash: approvalHash });
      if (saved.error || saved.data?.state !== 'reserved' || saved.data.may_dispatch !== false
        || typeof saved.data.replayed !== 'boolean') throw Error('save_outcome_unverified');
      // Read back immutable binding and operation state. Never return the claim.
      if (!await existing()) throw Error('saved_approval_not_verified');
      return reply(200, savedResponse(saved.data.replayed));
    } catch (error) {
      // A lost RPC reply can be resolved by reading the same immutable attempt.
      // No second reservation, provider send or automatic retry is performed.
      try {
        if (await existing()) return reply(200, savedResponse(true));
        if (!attemptedSave) {
          const failure = verificationFailure(error, verificationStep);
          console.warn('ks_crm_xui_read_failed', { view: 'test-approval', ...failure.diagnostic });
          return reply(409, failure);
        }
      } catch { /* uncertain */ }
      return reply(503, { error: 'The test approval status could not be verified. Check this same attempt before starting another review.',
        statusUnknown: true, executionEnabled: false, providerSent: false });
    }
  };
}
