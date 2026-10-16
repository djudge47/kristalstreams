import { timingSafeEqual } from 'node:crypto';
import { fetch } from 'undici';
import { createFixieDispatcher, fixieProxyUrl } from './ks-fixie-proxy.js';

// HTTPS hostname supplied by Roomba support; access-code case copied from
// the reseller panel's API URL tooltip. Connectivity still requires a test.
const endpoint = 'https://cdn.rooomba.tv/WDXTMHmN/';
const service = 'Kristal Streams Roomba Preview';

function authorized(header, secret) {
  if (typeof secret !== 'string' || !secret || typeof header !== 'string') return false;
  const actual = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function readJson(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('empty response');
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 65536) throw new Error('response too large');
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally {
    await reader.cancel().catch(() => {});
  }
}

// Dependencies are injectable so tests never contact the provider.
export function createRoombaPreviewHandler({ env = process.env, fetchImpl = fetch, dispatcherFactory = createFixieDispatcher } = {}) {
  let dispatcher;
  let dispatcherSetting;
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    const reply = (code, status, extra = {}) => res.status(code).json({
      service, status, mode: 'read-only', databaseWrites: false, ...extra,
    });
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return reply(405, 'method_not_allowed');
    }
    if (env.VERCEL_ENV === 'production') return reply(404, 'preview_only');
    if (!authorized(req.headers?.authorization, env.ROOMBA_PREVIEW_SECRET)) return reply(401, 'unauthorized');
    const missing = ['ROOMBA_API_URL', 'ROOMBA_API_KEY', 'FIXIE_URL'].filter(name => typeof env[name] !== 'string' || !env[name].trim());
    if (missing.length) return reply(503, 'not_configured', { missing });

    // Only this HTTPS destination is permitted. No request parameters can
    // change the target or the original read-only action.
    let url;
    try {
      url = new URL(env.ROOMBA_API_URL);
      if (url.href !== endpoint) return reply(503, 'endpoint_not_approved');
    } catch { return reply(503, 'endpoint_not_approved'); }
    const apiKey = env.ROOMBA_API_KEY.trim();
    if (!apiKey || /\s/.test(apiKey)) return reply(503, 'invalid_configuration');

    let proxyUrl;
    try { proxyUrl = fixieProxyUrl(env.FIXIE_URL); }
    catch { return reply(503, 'invalid_proxy_configuration'); }
    // A rotated proxy setting needs a fresh dispatcher, without changing the
    // global dispatcher used by payments, email, or other API routes.
    try {
      if (!dispatcher || dispatcherSetting !== proxyUrl.href) {
        const next = dispatcherFactory(proxyUrl.href);
        if (!next || typeof next.dispatch !== 'function') throw new Error('Invalid dispatcher');
        const previous = dispatcher;
        dispatcher = next;
        dispatcherSetting = proxyUrl.href;
        if (previous) void Promise.resolve(previous.close()).catch(() => {});
      }
    } catch { return reply(503, 'invalid_proxy_configuration'); }

    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('action', 'user_info');
    try {
      const response = await fetchImpl(url, {
        method: 'GET', redirect: 'manual', headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
        dispatcher,
      });
      if (!response.ok) {
        await response.body?.cancel().catch(() => {});
        return reply(502, 'connection_failed', {
          error: response.status >= 300 && response.status < 400 ? 'Provider redirect blocked.' : 'Provider request failed.',
          upstreamStatus: response.status,
        });
      }
      const payload = await readJson(response);
      const account = payload?.data;
      if (payload?.error || payload?.status === false || ['error', 'failed'].includes(payload?.status)
          || !account || typeof account !== 'object' || Array.isArray(account)
          || !['id', 'username', 'credits'].some(key => ['string', 'number'].includes(typeof account[key]))) {
        return reply(502, 'unexpected_response', { error: 'Provider response did not contain recognizable account data.' });
      }
      const secrets = [apiKey, env.FIXIE_URL, proxyUrl.password, decodeURIComponent(proxyUrl.password)];
      const safeValue = value => (typeof value === 'number' && Number.isFinite(value)) || (typeof value === 'string' && value.length <= 256 && !secrets.some(secret => value.includes(secret))) ? value : null;
      return reply(200, 'connected', { transport: 'fixie', account: {
        id: safeValue(account.id), username: safeValue(account.username), credits: safeValue(account.credits),
      } });
    } catch {
      // Network errors and provider bodies can include credentials. Never
      // return or log their raw contents.
      return reply(502, 'connection_failed', { error: 'Unable to read the provider account response.' });
    }
  };
}

