import { timingSafeEqual } from 'node:crypto';
import { fetch } from 'undici';
import { createFixieDispatcher, fixieProxyUrl } from './ks-fixie-proxy.js';

// HTTPS hostname supplied by Roomba support; access-code case copied from
// the reseller panel's API URL tooltip. Connectivity still requires a test.
const endpoint = 'https://cdn.rooomba.tv/WDXTMHmN/';
const service = 'Kristal Streams Roomba Preview';
// The confirmed JSON prefix exceeds 1 MiB; user_info includes large permissions.
// Keep a finite bound and the existing timeout, returning only account fields.
const maxResponseBytes = 8 * 1024 * 1024;

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
  let prefix = Buffer.alloc(0);
  let bodyFormat = 'unknown';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (prefix.length < 512) prefix = Buffer.concat([prefix, Buffer.from(value).subarray(0, 512 - prefix.length)]);
      const opening = prefix.toString('utf8').trimStart();
      bodyFormat = !opening ? 'unknown' : opening[0] === '{' ? 'json_object_prefix' : opening[0] === '[' ? 'json_array_prefix' : opening[0] === '<' ? 'markup' : 'other';
      if (bodyFormat === 'markup') {
        throw Object.assign(new Error('HTML response'), { code: 'KS_HTML_RESPONSE' });
      }
      if (size > maxResponseBytes) throw Object.assign(new Error('response too large'), { code: 'KS_RESPONSE_TOO_LARGE' });
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    throw Object.assign(new Error('Response read failed', { cause: error }), {
      ksResponseDiagnostics: { bodyFormat, receivedBytes: size },
    });
  } finally {
    await reader.cancel().catch(() => {});
  }
}

// Report only fixed diagnostic labels, never raw errors, URLs or bodies.
function failureReason(error, stage) {
  const known = new Set(['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT',
    'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT',
    'UND_ERR_SOCKET', 'UND_ERR_PRX_TLS', 'UND_ERR_PRX_CONN', 'UND_ERR_ABORTED',
    'ERR_TLS_CERT_ALTNAME_INVALID', 'CERT_HAS_EXPIRED', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
    'DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN',
    'ERR_SSL_WRONG_VERSION_NUMBER', 'UND_ERR_INVALID_ARG', 'KS_RESPONSE_TOO_LARGE', 'KS_HTML_RESPONSE']);
  let current = error;
  for (let depth = 0; current && depth < 5; depth++, current = current.cause) {
    if (known.has(current.code)) {
      if (current.code === 'UND_ERR_ABORTED') {
        const match = /^Proxy response \((403|407|429|502|503|504)\) !== 200 when HTTP Tunneling$/.exec(current.message);
        if (match) return `PROXY_HTTP_${match[1]}`;
      }
      return current.code;
    }
    if (current.name === 'TimeoutError') return 'TIMEOUT';
    if (stage === 'response_body' && current instanceof SyntaxError) return 'NON_JSON_RESPONSE';
  }
  return stage === 'response_body' ? 'RESPONSE_READ_FAILED' : 'TRANSPORT_FAILED';
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
    let stage = 'proxy_request';
    let upstreamStatus;
    let responseType;
    try {
      const response = await fetchImpl(url, {
        method: 'GET', redirect: 'manual', headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
        dispatcher,
      });
      upstreamStatus = response.status;
      const mediaType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      responseType = ['application/json', 'text/html', 'text/plain'].includes(mediaType) ? mediaType : mediaType ? 'other' : 'missing';
      if (!response.ok) {
        await response.body?.cancel().catch(() => {});
        return reply(502, 'connection_failed', {
          error: response.status >= 300 && response.status < 400 ? 'Provider redirect blocked.' : 'Provider request failed.',
          upstreamStatus: response.status,
        });
      }
      stage = 'response_body';
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
    } catch (error) {
      // Network errors and provider bodies can include credentials. Never
      // return or log their raw contents.
      return reply(502, 'connection_failed', {
        error: 'Unable to read the provider account response.',
        stage, reason: failureReason(error, stage),
        ...(upstreamStatus === undefined ? {} : { upstreamStatus, responseType }),
        ...(stage === 'response_body' && error?.ksResponseDiagnostics ? error.ksResponseDiagnostics : {}),
      });
    }
  };
}

