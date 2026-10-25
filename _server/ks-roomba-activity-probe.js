import { createAdminRoombaHandler } from './ks-roomba-admin.js';
import { createRoombaPreviewHandler } from './ks-roomba-preview.js';

// All labels are chosen locally. Never forward provider bodies or raw errors.
function diagnosticFor(result) {
  if (result.code === 200 && result.body?.status === 'activity_probe_complete')
    return result.body?.probe?.recognized === true ? 'activity_list_received' : 'response_unrecognized';
  if (result.code === 503) return 'configuration_unavailable';
  if (result.body?.status !== 'connection_failed') return 'diagnostic_failed';
  const { upstreamStatus, stage, reason } = result.body;
  if (upstreamStatus === 401 || upstreamStatus === 403) return 'provider_denied';
  if (upstreamStatus === 429) return 'provider_rate_limited';
  if (Number.isInteger(upstreamStatus) && upstreamStatus >= 300 && upstreamStatus < 400) return 'provider_redirect';
  if (Number.isInteger(upstreamStatus) && upstreamStatus >= 400 && upstreamStatus <= 599) return 'provider_http_error';
  if (['TIMEOUT', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT', 'KS_RESPONSE_TIMEOUT'].includes(reason)) return 'request_timeout';
  return stage === 'response_body' ? 'response_unreadable' : 'transport_failed';
}

// Existing administrator verification and reseller-account preflight precede
// every diagnostic. No provider/customer values are exposed by this route.
export function createActivityProbeHandler(settings = {}) {
  const { env = process.env, now = Date.now } = settings;
  const authorize = settings.authorize || createAdminRoombaHandler(settings);
  const probe = settings.probe || createRoombaPreviewHandler({ env, readAction: 'live_connections' });
  let pending, cached, retryAt = 0;
  const capture = async (handler, req) => {
    let code, body;
    await handler(req, { setHeader() {}, status(value) { code = value; return this; }, json(value) { body = value; return this; } });
    return { code, body };
  };
  return async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    const reply = (code, body) => res.status(code).json(body);
    if (env.VERCEL_ENV !== 'preview') return reply(404, { error: 'Activity diagnostics are available in Preview only.' });
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return reply(405, { error: 'Method not allowed.' }); }
    if (Object.keys(req.query || {}).join(',') !== 'view' || req.query.view !== 'activity-support') return reply(400, { error: 'Use the activity check button.' });
    try {
      const account = await capture(authorize, req);
      if (account.code !== 200 || account.body?.status !== 'connected' || !/^[1-9]\d{0,14}$/.test(String(account.body?.account?.id))) {
        const retryAfterSeconds = account.code === 429 ? 60 : 0;
        if (retryAfterSeconds) res.setHeader('Retry-After', String(retryAfterSeconds));
        return reply([401, 403, 429].includes(account.code) ? account.code : 503, { error: 'Administrator and reseller connection must be verified before checking activity.', retryAfterSeconds });
      }
      if (cached && now() - cached.at < 60000) return reply(200, { ...cached.body, cached: true });
      if (!pending && now() < retryAt) {
        const retryAfterSeconds = Math.max(1, Math.ceil((retryAt - now()) / 1000));
        res.setHeader('Retry-After', String(retryAfterSeconds)); return reply(429, { error: 'Please wait one minute before another activity check.', retryAfterSeconds });
      }
      if (!pending) {
        retryAt = now() + 60000;
        pending = (async () => {
          const result = await capture(probe, { method: 'GET', headers: { authorization: `Bearer ${env.ROOMBA_PREVIEW_SECRET}` } });
          const diagnostic = diagnosticFor(result);
          const recognized = diagnostic === 'activity_list_received';
          const body = { status: recognized ? 'activity_response_received' : 'activity_unverified',
            diagnostic,
            checkedAt: new Date(now()).toISOString(), mode: 'read-only', databaseWrites: false,
            message: recognized ? 'Roomba returned an activity list. Customer matching and live counts still need verification.'
              : 'This request did not establish activity support. No online or offline result can be inferred.' };
          cached = { at: now(), body }; return body;
        })().finally(() => { pending = null; });
      }
      return reply(200, { ...await pending, cached: false });
    } catch { return reply(502, { error: 'Activity could not be checked. No customer status has changed.' }); }
  };
}
