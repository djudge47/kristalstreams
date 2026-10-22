import { createRoombaPreviewHandler } from './ks-roomba-preview.js';
import { createFixieDispatcher } from './ks-fixie-proxy.js';
import { buildRenewalReview } from './ks-roomba-renewal-review.js';
import { buildPackageSummary } from '../_shared/ks-roomba-package-summary.js';
import { buildPreservationReview } from './ks-crm-renewal-preservation-review.js';
import { issueRenewalTestReview } from './ks-crm-renewal-test-review.js';
import { buildRequestedRenewalReview, requestedPackageMatches } from './ks-crm-renewal-order-review.js';

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const lineId = value => ['string', 'number'].includes(typeof value) && /^[1-9]\d{0,14}$/.test(String(value));
const readLabels = { account: 'account check', line: 'customer line check', packages: 'package list check' };
const timeoutReasons = new Set(['TIMEOUT','KS_RESPONSE_TIMEOUT','UND_ERR_CONNECT_TIMEOUT','UND_ERR_HEADERS_TIMEOUT','UND_ERR_BODY_TIMEOUT','ETIMEDOUT']);
class StatusReadFailure extends Error {
  constructor(step, reason) { super('xui_read_failed'); this.step = step; this.reason = reason; }
}
function readFailure(step, code, body) {
  const reason = timeoutReasons.has(body?.reason) ? 'timeout'
    : body?.upstreamStatus === 429 || body?.reason === 'PROXY_HTTP_429' || code === 429 ? 'rate_limited'
      : body?.upstreamStatus === 403 ? 'provider_refused'
        : code === 503 ? 'configuration_unavailable'
          : body?.status === 'unexpected_response' || ['KS_INVALID_JSON','KS_HTML_RESPONSE','KS_RESPONSE_TOO_LARGE','KS_RESPONSE_COMPLEXITY','NON_JSON_RESPONSE'].includes(body?.reason) ? 'invalid_response'
            : 'connection_failed';
  return new StatusReadFailure(step, reason);
}
function failureReply(error, reviewRenewal) {
  if (!(error instanceof StatusReadFailure)) return { error: reviewRenewal
    ? 'The renewal review could not be verified. Saved CRM records have not changed.'
    : 'The matching XUI line could not be verified. Saved CRM records have not changed.' };
  const description = { timeout: 'timed out', rate_limited: 'was rate-limited by the connection',
    provider_refused: 'was refused by XUI', configuration_unavailable: 'could not connect with the configured settings',
    invalid_response: 'returned incomplete or unreadable details', connection_failed: 'could not reach XUI',
    identity_mismatch: 'did not match the saved customer and reseller', verification_failed: 'returned details that could not be verified' };
  return { error: `The XUI ${readLabels[error.step]} ${description[error.reason]}. Saved CRM records have not changed.`,
    diagnostic: { step: error.step, reason: error.reason } };
}

// The server selects the line reference, verifies the current reseller, and
// never persists provider data. Requested term/allowance are read-only inputs.
export function createCustomerStatusHandler({ createClient, env = process.env, now = Date.now,
  readFactory, dispatcherFactory = createFixieDispatcher, reviewRenewal = false, reviewRequestedOrder = false, comparePackage = false } = {}) {
  let dispatcher;
  let proxySetting;
  const sharedDispatcher = setting => {
    if (!dispatcher || setting !== proxySetting) {
      const next = dispatcherFactory(setting);
      const previous = dispatcher;
      dispatcher = next; proxySetting = setting;
      if (previous) void Promise.resolve(previous.close()).catch(() => {});
    }
    return dispatcher;
  };
  const factory = readFactory || (settings => createRoombaPreviewHandler({ env, dispatcherFactory: sharedDispatcher, ...settings }));
  const accountHandler = factory({ readAction: 'user_info' });
  const cache = new Map();
  let pending;
  let retryAt = 0;
  async function read(handler, step) {
    let code; let body;
    try {
      await handler({ method: 'GET', headers: { authorization: `Bearer ${env.ROOMBA_PREVIEW_SECRET}` } }, {
        setHeader() {}, status(value) { code = value; return this; }, json(value) { body = value; return this; },
      });
    } catch { throw new StatusReadFailure(step, 'connection_failed'); }
    if (code !== 200 || body?.transport !== 'fixie' || body.mode !== 'read-only' || body.databaseWrites !== false) throw readFailure(step, code, body);
    return body;
  }
  const snapshot = entry => ({
    ...entry, access: Date.parse(entry.expiresAt) <= now() ? 'expired'
      : !entry.enabled || !entry.adminEnabled ? 'disabled' : 'within_service_period',
  });
  const content = (entry, customer, actorId, requested) => {
    const { renewalContext, ...line } = entry;
    if (reviewRequestedOrder) return { line: snapshot(line),
      requestedOrder: buildRequestedRenewalReview({ ...renewalContext, customer }, requested, now()) };
    return { line: snapshot(line), ...(reviewRenewal ? {
      renewal: buildRenewalReview(renewalContext, now()),
      preservation: buildPreservationReview(renewalContext, customer, now()),
      testApproval: issueRenewalTestReview({ context: renewalContext, customer, actorId, secret: env.ROOMBA_PREVIEW_SECRET, now: now() }),
    } : {}) };
  };
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    const reply = (code, body) => res.status(code).json(body);
    if (env.VERCEL_ENV !== 'preview') return reply(404, { error: 'XUI status checks are available in Preview only.' });
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return reply(405, { error: 'Method not allowed.' }); }
    const customerId = req.query?.customerId;
    if (!uuid(customerId)) return reply(400, { error: 'Choose a saved CRM customer.' });
    let requested;
    if (reviewRequestedOrder) {
      if (!reviewRenewal || Object.keys(req.query || {}).some(key => !['view', 'customerId', 'months', 'connections'].includes(key))
        || !['1', '3', '6', '12'].includes(req.query?.months)
        || typeof req.query?.connections !== 'string' || !/^[1-5]$/.test(req.query.connections)) {
        return reply(400, { error: 'Choose 1, 3, 6 or 12 months and 1 to 5 connections.' });
      }
      requested = { months: Number(req.query.months), connections: Number(req.query.connections) };
    }
    const token = typeof req.headers?.authorization === 'string' && /^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];
    if (!token) return reply(401, { error: 'Please sign in to your admin account.' });
    // This feature must never be pointed at a different Supabase project.
    if (env.VITE_SUPABASE_URL !== 'https://wftfxerblhlsxiijtfbo.supabase.co'
      || !env.VITE_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY || !env.ROOMBA_PREVIEW_SECRET) {
      return reply(503, { error: 'The Kristal Streams status connection is not configured.' });
    }
    let customer, actorId;
    try {
      const auth = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, options);
      const { data, error } = await auth.auth.getUser(token);
      const user = data?.user;
      actorId = user?.id;
      if (error || !user?.id) return reply(401, { error: 'Please sign in again to your admin account.' });
      if (user.is_anonymous || !user.email_confirmed_at || user.email?.trim().toLowerCase() !== 'djudge47@gmail.com') {
        return reply(403, { error: 'Only the Kristal Streams administrator can check XUI status.' });
      }
      const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options);
      const { data: row, error: readError } = await admin.from('iptv_customers')
        .select(reviewRenewal ? 'id,external_id,username,expiration_at' : 'id,external_id,username').eq('id', customerId).maybeSingle();
      if (readError) throw new Error('crm_unavailable');
      if (!row) return reply(404, { error: 'The CRM customer was not found.' });
      if (row.id !== customerId || !lineId(row.external_id) || typeof row.username !== 'string' || !/^[A-Za-z0-9_.-]{3,64}$/.test(row.username)) {
        return reply(409, { error: 'Review the saved Panel ID and IPTV username before checking XUI.' });
      }
      customer = row;
    } catch { return reply(503, { error: 'Admin access or the saved customer could not be verified.' }); }

    // Auth and current CRM identity are checked even for cached results.
    const key = JSON.stringify([customer.id, String(customer.external_id), customer.username,
      ...(reviewRequestedOrder ? [requested.months, requested.connections] : [])]);
    const cached = cache.get(key);
    if (cached && now() - Date.parse(cached.checkedAt) < 60000
      && (!reviewRenewal || now() - Date.parse(cached.renewalContext.checkedAt) < 30000)) {
      return reply(200, { mode: 'read-only', databaseWrites: false, cached: true, ...content(cached, customer, actorId, requested) });
    }
    if (pending?.key !== key && (pending || now() < retryAt)) {
      const seconds = Math.max(1, Math.ceil((retryAt - now()) / 1000));
      res.setHeader('Retry-After', String(seconds));
      return reply(429, { error: 'Another XUI check is running. Please wait briefly and try again.', retryAfterSeconds: seconds });
    }
    try {
      if (!pending) {
        retryAt = now() + 30000;
        const promise = (async () => {
          const startedAt = new Date(now()).toISOString();
          const account = await read(accountHandler, 'account');
          if (account.status !== 'connected' || !lineId(account.account?.id)) throw new StatusReadFailure('account', 'verification_failed');
          const result = await read(factory({ readAction: 'get_line', lineId: String(customer.external_id) }), 'line');
          const line = result.line;
          if (result.status !== 'line_ready' || line?.id !== String(customer.external_id)
            || line.username !== customer.username || line.resellerId !== String(account.account.id)) throw new StatusReadFailure('line', 'identity_mismatch');
          if (!Number.isFinite(Date.parse(line.expiresAt)) || !Number.isInteger(line.connections) || line.connections < 1 || line.connections > 32
            || ![line.trial, line.enabled, line.adminEnabled].every(value => typeof value === 'boolean')) throw new StatusReadFailure('line', 'verification_failed');
          let renewalContext;
          let packageComparison;
          if (reviewRenewal || comparePackage) {
            const catalog = await read(factory({ readAction: 'packages' }), 'packages');
            if (catalog.status !== 'packages_ready' || !Array.isArray(catalog.packages)) throw new StatusReadFailure('packages', 'verification_failed');
            let packages;
            try { packages = buildPackageSummary(catalog.packages, startedAt).packages; }
            catch { throw new StatusReadFailure('packages', 'verification_failed'); }
            if (comparePackage) {
              const pkg = packages.find(item => item.id === line.packageId);
              packageComparison = { packageId: line.packageId, packageName: pkg?.name ?? null };
            }
            if (reviewRenewal) {
              const { id, username, resellerId, packageId, expiresAt, connections, trial, enabled, adminEnabled, bouquetIds } = line;
              renewalContext = { line: { id, username, resellerId, packageId, expiresAt, connections, trial, enabled, adminEnabled, bouquetIds },
                account: { id: String(account.account.id), credits: account.account.credits }, packages, checkedAt: startedAt };
              if (reviewRequestedOrder) {
                buildRequestedRenewalReview({ ...renewalContext, customer }, requested, now());
                // Retain current and all matching candidates, so ambiguity stays
                // blocked on cache hits. Do not retain the whole private catalog.
                renewalContext.packages = packages.filter(pkg => pkg.id === packageId || requestedPackageMatches(pkg, requested));
              } else {
                buildRenewalReview(renewalContext, now());
                renewalContext.packages = [packages.find(pkg => pkg.id === packageId) || packages[0]];
              }
            }
          }
          const safe = {
            customerId, lineId: line.id, username: line.username, expiresAt: new Date(line.expiresAt).toISOString(),
            connectionsAllowed: line.connections, trial: line.trial, enabled: line.enabled, adminEnabled: line.adminEnabled,
            checkedAt: new Date(now()).toISOString(),
            ...(reviewRenewal ? { renewalContext } : {}),
            ...(comparePackage ? packageComparison : {}),
          };
          if (cache.size >= 100) cache.delete(cache.keys().next().value);
          cache.set(key, safe);
          return safe;
        })();
        pending = { key, promise };
        void promise.finally(() => { pending = null; }).catch(() => {});
      }
      return reply(200, { mode: 'read-only', databaseWrites: false, cached: false, ...content(await pending.promise, customer, actorId, requested) });
    } catch (error) {
      const safe = failureReply(error, reviewRenewal);
      if (safe.diagnostic) console.warn('ks_crm_xui_read_failed', { view: reviewRenewal ? 'renewal' : 'status', ...safe.diagnostic });
      return reply(502, { ...safe, retryAfterSeconds: 30 });
    }
  };
}
