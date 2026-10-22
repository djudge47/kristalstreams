import { createOrderRenewalConsent } from './ks-crm-renewal-order-consent.js';
import { createOrderRenewalLedger } from './ks-crm-renewal-order-ledger.js';
import { createLiveRenewalProvider } from './ks-crm-renewal-live-provider.js';
import { createOrderRenewalExecutor } from './ks-crm-renewal-order-execution.js';
import { buildOrderRenewalEvidence } from './ks-crm-renewal-order-plan.js';

const project = 'https://wftfxerblhlsxiijtfbo.supabase.co';
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const actions = new Set(['renewal-order-readiness','renewal-order-review','renewal-order-execute','renewal-order-status']);
const states = new Set(['review_required','disabled','check_status','reconciliation_required','complete','crm_pending']);
function signingKey(env) {
  const value = env.KS_CRM_ORDER_RENEWAL_CONSENT_KEY;
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value) || /^0+$/.test(value)
    || value === env.ROOMBA_PREVIEW_SECRET || value === env.KS_CRM_LIVE_RENEWAL_CONSENT_KEY) throw Error('dedicated_live_key_required');
  const key = Buffer.from(value, 'hex');
  const old = Buffer.from(env.ROOMBA_PREVIEW_SECRET || '');
  if (old.length === key.length && old.equals(key)) { key.fill(0); throw Error('dedicated_live_key_required'); }
  return key;
}

// Preview-only bridge. The service client, actor, line and provider target are
// selected server-side. No body/query can change flags, package, price or endpoint.
export function createOrderRenewalHttpHandler({ createClient, env = process.env, now = Date.now,
  orderProviderFactory = settings => createLiveRenewalProvider({ ...settings, writePolicy: 'changed-order' }) } = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    const reply = (code, body) => res.status(code).json(body);
    const view = req.query?.view;
    if (env.VERCEL_ENV !== 'preview') return reply(404, { error: 'Renewal controls are available in Preview only.' });
    if (!actions.has(view)) return reply(400, { error: 'Unknown renewal action.' });
    const readiness = view === 'renewal-order-readiness';
    if (req.method !== (readiness ? 'GET' : 'POST')) { res.setHeader('Allow', readiness ? 'GET' : 'POST'); return reply(405, { error: 'Method not allowed.' }); }
    if (!readiness) {
      let origin;
      try { origin = new URL(req.headers?.origin); } catch { /* rejected below */ }
      if (!origin || origin.protocol !== 'https:' || origin.origin !== req.headers.origin || origin.host !== req.headers.host) return reply(403, { error: 'Use the renewal controls on the CRM page.' });
    }
    const statusOnly = view === 'renewal-order-status';
    const body = req.body;
    const confirmations = ['creditSpendConfirmed','preserveCurrentSelectionConfirmed','unusedTimeLossConfirmed','providerTestConfirmed'];
    const required = view === 'renewal-order-review' ? [...confirmations,'customerId','months','connections']
      : statusOnly ? ['customerId','token'] : [...confirmations,'customerId','token'];
    if (!readiness && (!/^application\/json(?:;\s*charset=utf-8)?$/i.test(req.headers['content-type'] || '')
      || !body || Array.isArray(body) || typeof body !== 'object' || Object.keys(body).sort().join(',') !== required.sort().join(',')
      || Buffer.byteLength(JSON.stringify(body)) > 1800
      || (!statusOnly && confirmations.some(field => body[field] !== true))
      || (view !== 'renewal-order-review' && (typeof body.token !== 'string' || body.token.length > 1100)))) return reply(400, { error: 'Use the current changed-order review and all four confirmations.' });
    if (Object.keys(req.query || {}).sort().join(',') !== (readiness ? 'customerId,view' : 'view')) return reply(400, { error: 'Use the changed-order controls on the CRM page.' });
    if (view === 'renewal-order-review' && (![1,3,6,12].includes(body.months) || !Number.isInteger(body.connections) || body.connections < 1 || body.connections > 5)) return reply(400, { error: 'Choose a supported term and connection allowance.' });
    if (view === 'renewal-order-review' && (body.months !== 6 || body.connections !== 3)) return reply(400, { error: 'This controlled purchase supports the reviewed change to 6 months and 3 connections.' });
    const customerId = readiness ? req.query?.customerId : body.customerId;
    if (!uuid(customerId)) return reply(400, { error: 'Choose a saved CRM customer.' });
    if (env.VITE_SUPABASE_URL !== project || !env.VITE_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) return reply(503, { error: 'The Kristal Streams renewal connection is unavailable.' });
    const bearer = typeof req.headers?.authorization === 'string' && /^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];
    if (!bearer) return reply(401, { error: 'Please sign in to your admin account.' });
    let admin, actorId;
    try {
      const auth = createClient(project, env.VITE_SUPABASE_ANON_KEY, options);
      const { data, error } = await auth.auth.getUser(bearer);
      const user = data?.user;
      if (error || !uuid(user?.id)) return reply(401, { error: 'Please sign in again to your admin account.' });
      if (user.is_anonymous || !user.email_confirmed_at || user.email?.trim().toLowerCase() !== 'djudge47@gmail.com') return reply(403, { error: 'Only the Kristal Streams administrator can use renewal controls.' });
      actorId = user.id;
      admin = createClient(project, env.SUPABASE_SERVICE_ROLE_KEY, options);
    } catch { return reply(503, { error: 'Administrator access could not be verified.' }); }
    const crm = { async current(id) {
      if (id !== customerId) throw Error('customer_changed');
      const { data, error } = await admin.from('iptv_customers').select('id,external_id,username,expiration_at,connections_allowed,package_name').eq('id', id).maybeSingle();
      if (error || data?.id !== id || !/^[1-9]\d{0,14}$/.test(String(data.external_id))
        || !/^[A-Za-z0-9_.-]{3,64}$/.test(data.username || '') || !Number.isFinite(Date.parse(data.expiration_at))) throw Error('customer_unverified');
      return data;
    } };
    let ledger, consent;
    if (!statusOnly && env.KS_CRM_ORDER_RENEWAL_ENABLED !== 'true') return reply(200, { mode: 'changed-order-renewal', state: 'disabled', ready: false, mayDispatch: false });
    if (!statusOnly && (!uuid(env.KS_CRM_ORDER_RENEWAL_CUSTOMER_ID) || customerId !== env.KS_CRM_ORDER_RENEWAL_CUSTOMER_ID)) {
      return reply(200, { mode: 'changed-order-renewal', state: 'disabled', ready: false, mayDispatch: false });
    }
    try {
      ledger = createOrderRenewalLedger({ client: admin, projectUrl: project });
      if (!statusOnly) {
        // Separate changed-order release and SQL gates; existing test and
        // same-package execution must stay off. This route mutates no control.
        const test = await admin.from('ks_crm_renewal_control').select('execution_enabled').eq('singleton', true).maybeSingle();
        if (test.error || test.data?.execution_enabled !== false) throw Error('test_safeguards_unverified');
        const same = await admin.from('ks_crm_live_renewal_control').select('execution_enabled').eq('singleton', true).maybeSingle();
        if (same.error || same.data?.execution_enabled !== false) throw Error('same_package_must_be_off');
        const enabled = await ledger.enabled();
        if (!enabled || env.KS_CRM_ORDER_RENEWAL_ENABLED !== 'true') return reply(200, { mode: 'changed-order-renewal', state: 'disabled', ready: false, mayDispatch: false });
      }
      const key = signingKey(env);
      try { consent = createOrderRenewalConsent({ key, now }); } finally { key.fill(0); }
    } catch {
      return reply(readiness ? 200 : 503, { mode: 'changed-order-renewal', state: 'unavailable', ready: false, mayDispatch: false,
        error: 'Changed-order purchase is not ready. Installation and connection checks must be completed before activation.' });
    }
    try {
      if (statusOnly) {
        const identity = consent.identify(body.token, { actorId, customerId });
        const record = await ledger.lookup(identity, body.token);
        return reply(200, { mode: 'changed-order-renewal', state: record?.state || 'not_found', operationId: identity.operationId,
          canStartNewReview: record === null && now() >= Date.parse(identity.expiresAt) + 60000, mayDispatch: false });
      }
      const provider = orderProviderFactory({ env, now });
      if (readiness) {
        await crm.current(customerId);
        return reply(200, { mode: 'changed-order-renewal', state: 'ready_for_review', ready: true, mayDispatch: false });
      }
      if (view === 'renewal-order-review') {
        const customer = await crm.current(customerId), context = await provider.snapshot(customer);
        const input = { ...body, actorId, customer, context, requested: { months: body.months, connections: body.connections } };
        const receipt = consent.issue(input);
        const { plan } = buildOrderRenewalEvidence(input, now());
        return reply(200, { mode: 'changed-order-renewal', state: 'review_ready', mayDispatch: false,
          review: { token: receipt.token, operationId: receipt.operationId, consentId: receipt.consentId,
            expiresAt: receipt.expiresAt, customerId, username: plan.username, lineId: plan.lineId, months: plan.months,
            connections: plan.connections, currentGroupIds: plan.bouquetIds, previousExpiresAt: plan.previousExpiresAt,
            costUnits: plan.costUnits, balanceUnits: plan.balanceUnits, packageId: plan.packageId, packageName: plan.packageName,
            currentMonths: plan.currentMonths, currentConnections: plan.currentConnections, termPolicy: plan.termPolicy,
            unusedTimeLossConfirmed: true, providerTestConfirmed: true } });
      }
      const result = await createOrderRenewalExecutor({ consent, ledger, provider, crm, now })({ ...body, actorId });
      if (!states.has(result.state)) throw Error('result_unverified');
      return reply(200, { mode: 'changed-order-renewal', ...result });
    } catch {
      // No raw upstream data, errors, signing key, claim or result bodies.
      if (view === 'renewal-order-review') return reply(409, { mode: 'changed-order-renewal', state: 'review_required', mayDispatch: false,
        error: 'The changed-order review could not be verified. No purchase was submitted.' });
      return reply(503, { mode: 'changed-order-renewal', state: 'check_status', mayDispatch: false,
        error: 'The renewal connection could not be verified. Check this same attempt before starting another.' });
    }
  };
}
