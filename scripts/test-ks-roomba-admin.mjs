import assert from 'node:assert/strict';
import { createAdminRoombaHandler } from '../_server/ks-roomba-admin.js';

const env = { VERCEL_ENV: 'preview', VITE_SUPABASE_URL: 'https://synthetic.supabase.co', VITE_SUPABASE_ANON_KEY: 'fake-anon', ROOMBA_PREVIEW_SECRET: 'fake-internal-preview-secret' };
const admin = { id: 'fake-admin-id', email: 'djudge47@gmail.com', email_confirmed_at: '2026-01-01T00:00:00Z', is_anonymous: false };
const account = { id: 12, username: 'synthetic-reseller', credits: 7 };
let checks = 0;
function fixture(options = {}) {
  const calls = { auth: [], provider: [] };
  let timestamp = Date.parse('2026-10-17T04:00:00Z');
  const createClient = (url, key, settings) => {
    assert.equal(url, env.VITE_SUPABASE_URL);
    assert.equal(key, env.VITE_SUPABASE_ANON_KEY);
    assert.equal(settings.auth.persistSession, false);
    return { auth: { async getUser(token) {
      calls.auth.push(token);
      if (options.authThrows) throw new Error('private auth error');
      const user = options.userForToken ? options.userForToken(token) : options.user === undefined ? admin : options.user;
      return { data: { user }, error: options.authError ? new Error('private error') : null };
    } } };
  };
  const accountHandler = async (req, res) => {
    calls.provider.push(req);
    assert.equal(req.method, 'GET');
    assert.equal(req.headers.authorization, `Bearer ${env.ROOMBA_PREVIEW_SECRET}`);
    if (options.wait) await options.wait;
    if (options.providerThrows) throw new Error('sensitive provider URL');
    return res.status(options.providerCode ?? 200).json(options.providerBody ?? {
      status: 'connected', transport: 'fixie', mode: 'read-only', databaseWrites: false,
      account: { ...account, api_key: 'must-not-appear' }, secret: 'must-not-appear',
    });
  };
  const handler = createAdminRoombaHandler({ createClient, env: { ...env, ...options.env }, accountHandler, now: () => timestamp });
  return { calls, advance(ms) { timestamp += ms; }, async request({ method = 'GET', token = 'verified-user-token', headers = {} } = {}) {
    const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await handler({ method, headers: { authorization: token ? `Bearer ${token}` : '', ...headers }, query: { admin: 'true', email: admin.email, action: 'create_line' } }, res);
    const output = JSON.stringify(res.body);
    for (const secret of ['must-not-appear', env.ROOMBA_PREVIEW_SECRET, 'verified-user-token', 'sensitive provider URL']) assert.ok(!output.includes(secret));
    assert.equal(res.headers['Cache-Control'], 'private, no-store');
    return res;
  } };
}
async function check(name, fn) { await fn(); checks++; console.log(`PASS: ${name}`); }

await check('missing or malformed login tokens never call Auth or Roomba', async () => {
  for (const headers of [{ authorization: '' }, { authorization: 'Basic fake' }, { authorization: 'Bearer a b' }]) {
    const f = fixture(); const result = await f.request({ headers });
    assert.equal(result.code, 401); assert.equal(f.calls.auth.length, 0); assert.equal(f.calls.provider.length, 0);
  }
});
await check('Production, Development and write methods are blocked before any external call', async () => {
  for (const VERCEL_ENV of ['production', 'development', undefined]) {
    const f = fixture({ env: { VERCEL_ENV } }); assert.equal((await f.request()).code, 404);
    assert.equal(f.calls.auth.length, 0); assert.equal(f.calls.provider.length, 0);
  }
  const f = fixture(); const result = await f.request({ method: 'POST' });
  assert.equal(result.code, 405); assert.equal(result.headers.Allow, 'GET'); assert.equal(f.calls.auth.length, 0);
});
await check('ordinary users cannot grant themselves admin access through metadata or query parameters', async () => {
  const f = fixture({ user: { ...admin, email: 'customer@example.invalid', user_metadata: { email: admin.email, role: 'admin', is_admin: true } } });
  assert.equal((await f.request()).code, 403); assert.equal(f.calls.provider.length, 0);
});
await check('unconfirmed, anonymous, expired and missing users cannot read account data', async () => {
  for (const user of [{ ...admin, email_confirmed_at: null }, { ...admin, is_anonymous: true }, null, { email: admin.email }]) {
    const f = fixture({ user }); assert.notEqual((await f.request()).code, 200); assert.equal(f.calls.provider.length, 0);
  }
  const f = fixture({ authError: true }); assert.equal((await f.request()).code, 401); assert.equal(f.calls.provider.length, 0);
});
await check('Auth failures and missing configuration fail closed without provider calls', async () => {
  for (const options of [{ authThrows: true }, { env: { VITE_SUPABASE_URL: '' } }, { env: { VITE_SUPABASE_ANON_KEY: '' } }, { env: { ROOMBA_PREVIEW_SECRET: '' } }]) {
    const f = fixture(options); assert.equal((await f.request()).code, 503); assert.equal(f.calls.provider.length, 0);
  }
});
await check('verified admin receives only the sanitized account snapshot and check time', async () => {
  const f = fixture(); const result = await f.request();
  assert.equal(result.code, 200); assert.deepEqual(result.body.account, account);
  assert.equal(result.body.checkedAt, '2026-10-17T04:00:00.000Z'); assert.equal(result.body.databaseWrites, false);
  assert.equal(f.calls.auth[0], 'verified-user-token'); assert.equal(result.body.cached, false);
});
await check('recent checks are reused only after revalidating the caller', async () => {
  const f = fixture({ userForToken: token => token === 'customer-token' ? { ...admin, email: 'customer@example.invalid' } : admin });
  await f.request(); f.advance(10000);
  assert.equal((await f.request()).body.cached, true);
  assert.equal((await f.request({ token: 'customer-token' })).code, 403);
  assert.equal(f.calls.auth.length, 3); assert.equal(f.calls.provider.length, 1);
  f.advance(51000); assert.equal((await f.request()).body.cached, false); assert.equal(f.calls.provider.length, 2);
});
await check('concurrent authorized checks share one provider request', async () => {
  let release; const wait = new Promise(resolve => { release = resolve; });
  const f = fixture({ wait });
  const first = f.request(); const second = f.request();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.calls.auth.length, 2); assert.equal(f.calls.provider.length, 1);
  release(); const results = await Promise.all([first, second]);
  assert.ok(results.every(result => result.code === 200));
});
await check('failed checks are not presented as connected and retries are throttled', async () => {
  const f = fixture({ providerThrows: true });
  const first = await f.request(); assert.equal(first.code, 502); assert.equal(first.body.account, undefined);
  const second = await f.request(); assert.equal(second.code, 429); assert.equal(second.headers['Retry-After'], '30');
  assert.equal(f.calls.provider.length, 1); f.advance(31000); await f.request(); assert.equal(f.calls.provider.length, 2);
});
await check('invalid or writable provider snapshots cannot become successful admin results', async () => {
  const valid = { status: 'connected', transport: 'fixie', mode: 'read-only', databaseWrites: false, account };
  for (const body of [{ ...valid, databaseWrites: true }, { ...valid, mode: 'write' }, { ...valid, transport: 'direct' }, { ...valid, status: 'connection_failed' }, { ...valid, account: {} }]) {
    const f = fixture({ providerBody: body }); assert.equal((await f.request()).code, 502);
  }
});

console.log(`${checks} admin connection checks passed. No real Auth, provider requests, database changes or customer lines.`);
