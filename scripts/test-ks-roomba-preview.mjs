import assert from 'node:assert/strict';
import { createRoombaPreviewHandler } from '../_server/ks-roomba-preview.js';

const env = {
  ROOMBA_PREVIEW_SECRET: 'fake-backend-secret', ROOMBA_API_KEY: 'fake-provider-key',
  ROOMBA_API_URL: 'http://live.roomba.tv:80/WDxTMHmN/', ROOMBA_ALLOW_INSECURE_HTTP: 'true',
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
await check('HTTP requires explicit server opt-in', async () => {
  const result = await run({ overrides: { ROOMBA_ALLOW_INSECURE_HTTP: '' } });
  assert.equal(result.body.status, 'http_opt_in_required'); assert.equal(result.calls.length, 0);
});
await check('the existing cron secret cannot authorize the Roomba test', async () => {
  const result = await run({ overrides: { ROOMBA_PREVIEW_SECRET: '', CRON_SECRET: env.ROOMBA_PREVIEW_SECRET } });
  assert.equal(result.code, 401); assert.equal(result.calls.length, 0);
});
await check('missing configuration and malformed keys never reach the provider', async () => {
  for (const overrides of [{ ROOMBA_API_KEY: '' }, { ROOMBA_API_KEY: 'bad key' }, { ROOMBA_API_KEY: 'bad\nkey' }, { ROOMBA_API_URL: '' }, { ROOMBA_PREVIEW_SECRET: '' }]) {
    assert.equal((await run({ overrides })).calls.length, 0);
  }
});
await check('lookalike hosts, other ports, paths and URL credentials are blocked', async () => {
  for (const url of ['http://live.roomba.tv.evil.invalid/WDxTMHmN/', 'http://live.roomba.tv:8080/WDxTMHmN/', 'http://live.roomba.tv/other/', 'http://user:pass@live.roomba.tv/WDxTMHmN/', 'http://127.0.0.1/WDxTMHmN/', 'http://live.roomba.tv/WDxTMHmN/?action=create_user', 'https://live.roomba.tv/WDxTMHmN/']) {
    assert.equal((await run({ overrides: { ROOMBA_API_URL: url } })).calls.length, 0);
  }
});
await check('approved port 80 address uses only the fixed read-only command', async () => {
  const result = await run(); assert.equal(result.code, 200); assert.equal(result.calls.length, 1);
  const { url, options } = result.calls[0]; const parsed = new URL(url);
  assert.equal(parsed.hostname, 'live.roomba.tv'); assert.equal(parsed.searchParams.get('action'), 'user_info');
  assert.equal(parsed.searchParams.get('api_key'), env.ROOMBA_API_KEY); assert.equal(options.method, 'GET');
  assert.equal(options.redirect, 'manual'); assert.ok(options.signal); assert.equal(result.body.account.credits, 5);
});
await check('redirects are never followed', async () => {
  const result = await run({ response: new Response('', { status: 302, headers: { Location: 'http://evil.invalid' } }) });
  assert.equal(result.code, 502); assert.equal(result.calls.length, 1);
});
await check('provider errors and network errors never disclose credentials', async () => {
  for (const options of [{ throws: true }, { response: new Response(env.ROOMBA_API_KEY, { status: 404 }) }, { response: new Response(env.ROOMBA_API_KEY) }]) assert.equal((await run(options)).code, 502);
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
