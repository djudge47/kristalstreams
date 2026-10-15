import assert from 'node:assert/strict';
import { createRoombaPreviewHandler } from '../_server/ks-roomba-preview.js';

const env = {
  ROOMBA_PREVIEW_SECRET: 'fake-backend-secret', ROOMBA_API_KEY: 'fake-provider-key',
  ROOMBA_API_URL: 'https://cdn.rooomba.tv/WDXTMHmN/',
};
let checks = 0;
async function run({ overrides = {}, method = 'GET', auth = `Bearer ${env.ROOMBA_PREVIEW_SECRET}`, response, throws = false } = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    if (throws) throw new Error(`network failure ${env.ROOMBA_API_KEY}`);
    return response || Response.json({ data: { id: 12, username: 'test-reseller', credits: 5 } });
  };
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await createRoombaPreviewHandler({ env: { ...env, ...overrides }, fetchImpl })({ method, headers: { authorization: auth }, query: { action: 'create_user', url: 'http://evil.invalid' } }, res);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.equal(res.body.databaseWrites, false);
  assert.ok(!JSON.stringify(res.body).includes(env.ROOMBA_API_KEY));
  return { ...res, calls };
}
async function check(name, fn) { await fn(); checks++; console.log(`PASS: ${name}`); }

await check('unauthorized and write requests never contact the provider', async () => {
  for (const options of [{ auth: '' }, { auth: 'Bearer wrong' }, { method: 'POST' }]) assert.equal((await run(options)).calls.length, 0);
});
await check('HTTP stays blocked even when the legacy opt-in is set', async () => {
  for (const url of ['http://cdn.rooomba.tv/WDXTMHmN/', 'http://live.roomba.tv:80/WDxTMHmN/', 'http://limited-names.com:80/WDXTMHmN/']) {
    const result = await run({ overrides: { ROOMBA_API_URL: url, ROOMBA_ALLOW_INSECURE_HTTP: 'true' } });
    assert.equal(result.body.status, 'endpoint_not_approved'); assert.equal(result.calls.length, 0);
  }
});
await check('the existing cron secret cannot authorize the Roomba test', async () => {
  const result = await run({ overrides: { ROOMBA_PREVIEW_SECRET: '', CRON_SECRET: env.ROOMBA_PREVIEW_SECRET } });
  assert.equal(result.code, 401); assert.equal(result.calls.length, 0);
});
await check('missing settings are identified by name without exposing their values', async () => {
  for (const name of ['ROOMBA_API_URL', 'ROOMBA_API_KEY']) {
    const result = await run({ overrides: { [name]: '' } });
    assert.equal(result.code, 503); assert.deepEqual(result.body.missing, [name]);
    assert.equal(result.calls.length, 0);
  }
  const result = await run({ auth: '', overrides: { ROOMBA_API_KEY: '' } });
  assert.equal(result.code, 401); assert.equal(result.body.missing, undefined);
});
await check('missing configuration and malformed keys never reach the provider', async () => {
  for (const overrides of [{ ROOMBA_API_KEY: '' }, { ROOMBA_API_KEY: 'bad key' }, { ROOMBA_API_KEY: 'bad\nkey' }, { ROOMBA_API_URL: '' }, { ROOMBA_PREVIEW_SECRET: '' }]) {
    assert.equal((await run({ overrides })).calls.length, 0);
  }
});
await check('lookalike hosts, other ports, paths and URL credentials are blocked', async () => {
  for (const url of ['https://cdn.rooomba.tv.evil.invalid/WDXTMHmN/', 'https://cdn.rooomba.tv:8080/WDXTMHmN/', 'https://cdn.rooomba.tv/other/', 'https://user:pass@cdn.rooomba.tv/WDXTMHmN/', 'https://127.0.0.1/WDXTMHmN/', 'https://cdn.rooomba.tv/WDXTMHmN/?action=create_line', 'https://cdn.rooomba.tv/WDXTMHmN/?api_key=untrusted', 'https://cdn.rooomba.tv/WDXTMHmN/#fragment', 'https://cdn.rooomba.tv/WDxTMHmN/', 'https://cdn.rooomba.tv/WDXTM/HmN/', 'https://cdn.rooomba.tv/WDXTMHmN', 'https://live.cdn.rooomba.tv/WDXTMHmN/', 'https://limited-names.com/WDXTMHmN/', 'not a URL']) {
    const result = await run({ overrides: { ROOMBA_API_URL: url } });
    assert.equal(result.body.status, 'endpoint_not_approved'); assert.equal(result.calls.length, 0);
  }
});
await check('approved HTTPS address uses only the fixed read-only command without HTTP opt-in', async () => {
  const result = await run(); assert.equal(result.code, 200); assert.equal(result.calls.length, 1);
  const { url, options } = result.calls[0]; const parsed = new URL(url);
  assert.equal(parsed.protocol, 'https:'); assert.equal(parsed.hostname, 'cdn.rooomba.tv');
  assert.equal(parsed.port, ''); assert.equal(parsed.pathname, '/WDXTMHmN/');
  assert.equal(parsed.searchParams.get('action'), 'user_info');
  assert.deepEqual([...parsed.searchParams.keys()].sort(), ['action', 'api_key']);
  assert.equal(parsed.searchParams.get('api_key'), env.ROOMBA_API_KEY); assert.equal(options.method, 'GET');
  assert.equal(options.redirect, 'manual'); assert.ok(options.signal); assert.equal(result.body.account.credits, 5);
});
await check('the explicit default HTTPS port is accepted without changing the destination', async () => {
  const result = await run({ overrides: { ROOMBA_API_URL: 'https://cdn.rooomba.tv:443/WDXTMHmN/' } });
  assert.equal(result.code, 200); assert.equal(result.calls.length, 1);
  assert.equal(new URL(result.calls[0].url).origin, 'https://cdn.rooomba.tv');
});
await check('redirects are never followed', async () => {
  const result = await run({ response: new Response('', { status: 302, headers: { Location: 'http://evil.invalid' } }) });
  assert.equal(result.code, 502); assert.equal(result.calls.length, 1);
});
await check('provider errors and network errors never disclose credentials', async () => {
  for (const options of [{ throws: true }, { response: new Response(env.ROOMBA_API_KEY, { status: 403 }) }, { response: new Response(env.ROOMBA_API_KEY, { status: 404 }) }, { response: new Response(env.ROOMBA_API_KEY) }]) assert.equal((await run(options)).code, 502);
});
await check('a forbidden response is reported accurately without claiming a connection', async () => {
  const result = await run({ response: new Response('Forbidden', { status: 403 }) });
  assert.equal(result.code, 502); assert.equal(result.body.status, 'connection_failed');
  assert.equal(result.body.upstreamStatus, 403); assert.equal(result.body.account, undefined);
});
await check('unrecognized and error payloads cannot report a connection', async () => {
  for (const payload of [{}, { data: [] }, { error: 'bad key', data: { id: 1 } }, { status: false, data: { id: 1 } }]) assert.equal((await run({ response: Response.json(payload) })).code, 502);
});
await check('large responses are rejected and account output is limited', async () => {
  assert.equal((await run({ response: new Response('x'.repeat(65537)) })).code, 502);
  const result = await run({ response: Response.json({ data: { id: 12, username: env.ROOMBA_API_KEY, password: 'hidden', api_key: env.ROOMBA_API_KEY, credits: 1 } }) });
  assert.deepEqual(result.body.account, { id: 12, username: null, credits: 1 });
});
console.log(`${checks} checks passed. No network requests, real credentials, database changes or customer lines.`);
