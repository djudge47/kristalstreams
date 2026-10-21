import assert from 'node:assert/strict';
import { createCustomerStatusHandler } from '../_server/ks-roomba-customer-status.js';
import { createRoombaPreviewHandler } from '../_server/ks-roomba-preview.js';
import { createRoombaCrmRoute } from '../_server/ks-roomba-crm-route.js';
import { readdir, readFile } from 'node:fs/promises';

const customerId = '11111111-1111-4111-8111-111111111111';
const otherId = '22222222-2222-4222-8222-222222222222';
const env = { VERCEL_ENV: 'preview', VITE_SUPABASE_URL: 'https://wftfxerblhlsxiijtfbo.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'fictional-anon', SUPABASE_SERVICE_ROLE_KEY: 'fictional-service', ROOMBA_PREVIEW_SECRET: 'fictional-preview' };
const admin = { id: otherId, email: 'djudge47@gmail.com', email_confirmed_at: '2026-01-01T00:00:00Z' };
const customer = { id: customerId, external_id: 123, username: 'fictional-customer' };
const line = { id: '123', username: customer.username, resellerId: '12', packageId: '1', expiresAt: '2026-10-22T12:00:00Z',
  connections: 1, trial: true, enabled: true, adminEnabled: true, bouquetIds: [1] };
function fixture(settings = {}) {
  let time = Date.parse('2026-10-21T12:00:00Z');
  const calls = { auth: [], selects: [], provider: [] };
  const state = { user: admin, customer: { ...customer }, ...settings };
  const createClient = (url, key) => {
    assert.equal(url, env.VITE_SUPABASE_URL);
    if (key === env.VITE_SUPABASE_ANON_KEY) return { auth: { async getUser(token) {
      calls.auth.push(token); if (state.authThrows) throw new Error('sensitive-auth');
      return { data: { user: state.user }, error: state.authError ? {} : null };
    } } };
    assert.equal(key, env.SUPABASE_SERVICE_ROLE_KEY);
    return { from(table) { assert.equal(table, 'iptv_customers'); return {
      select(columns) { assert.equal(columns, 'id,external_id,username'); calls.selects.push(columns); return this; },
      eq(column, value) { assert.equal(column, 'id'); assert.ok([customerId, otherId].includes(value)); return this; },
      async maybeSingle() { return { data: state.customer, error: state.storageError ? {} : null }; },
    }; } };
  };
  const readFactory = action => async (req, res) => {
    calls.provider.push(action);
    assert.equal(req.method, 'GET'); assert.equal(req.headers.authorization, `Bearer ${env.ROOMBA_PREVIEW_SECRET}`);
    if (state.wait) await state.wait;
    if (state.providerThrows) throw new Error('sensitive-provider');
    const content = action.readAction === 'user_info' ? { status: 'connected', account: { id: '12', ...state.account } }
      : { status: 'line_ready', line: { ...line, ...state.line, password: 'sensitive-password' } };
    res.status(state.providerCode ?? 200).json({ transport: 'fixie', mode: 'read-only', databaseWrites: false, ...content, ...state.envelope });
  };
  const handler = createCustomerStatusHandler({ env: { ...env, ...state.env }, createClient, readFactory, now: () => time });
  return { state, calls, advance(ms) { time += ms; }, async request(settings = {}) {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await handler({ method: settings.method || 'GET', headers: { authorization: 'Bearer fictional-token', ...settings.headers },
      query: { customerId, action: 'create_line', lineId: '999', username: 'attacker', ...settings.query } }, res);
    assert.equal(res.headers['Cache-Control'], 'private, no-store');
    const output = JSON.stringify(res.body);
    for (const secret of ['sensitive-', env.SUPABASE_SERVICE_ROLE_KEY, env.ROOMBA_PREVIEW_SECRET, 'fictional-token', 'bouquetIds', 'resellerId']) assert.ok(!output.includes(secret));
    return res;
  } };
}
let count = 0;
async function test(name, run) { await run(); console.log(`PASS: ${name}`); count++; }

await test('Preview and GET gates reject all writes before dependencies', async () => {
  for (const VERCEL_ENV of ['production', 'development', undefined]) {
    const f = fixture({ env: { VERCEL_ENV } }); assert.equal((await f.request()).code, 404); assert.equal(f.calls.auth.length, 0);
  }
  for (const method of ['POST', 'PUT', 'DELETE']) { const f = fixture(); assert.equal((await f.request({ method })).code, 405); assert.equal(f.calls.auth.length, 0); }
});
await test('only configured active project and scalar UUID are accepted', async () => {
  for (const value of [null, ['111'], '123', `${customerId}&action=create_line`]) {
    const f = fixture(); assert.equal((await f.request({ query: { customerId: value } })).code, 400); assert.equal(f.calls.auth.length, 0);
  }
  const f = fixture({ env: { VITE_SUPABASE_URL: 'https://another-project.supabase.co' } });
  assert.equal((await f.request()).code, 503); assert.equal(f.calls.auth.length, 0);
});
await test('verified confirmed admin required before CRM or provider reads', async () => {
  for (const user of [null, { ...admin, is_anonymous: true }, { ...admin, email_confirmed_at: null },
    { ...admin, email: 'someone@example.invalid', user_metadata: { email: admin.email, role: 'admin' } }]) {
    const f = fixture({ user }); assert.ok([401, 403].includes((await f.request()).code)); assert.equal(f.calls.selects.length, 0); assert.equal(f.calls.provider.length, 0);
  }
  const f = fixture(); assert.equal((await f.request({ headers: { authorization: 'Bearer a b' } })).code, 401); assert.equal(f.calls.auth.length, 0);
});
await test('missing or invalid CRM identity never contacts provider', async () => {
  for (const row of [null, { ...customer, external_id: -1 }, { ...customer, username: 'bad username' }, { ...customer, id: otherId }]) {
    const f = fixture({ customer: row }); assert.ok([404, 409].includes((await f.request()).code)); assert.equal(f.calls.provider.length, 0);
  }
  for (const setting of [{ storageError: true }, { authThrows: true }, { authError: true }]) {
    const f = fixture(setting); assert.notEqual((await f.request()).code, 200); assert.equal(f.calls.provider.length, 0);
  }
});
await test('server-selected line and current reseller verified; only safe status returned', async () => {
  const f = fixture(); const result = await f.request(); assert.equal(result.code, 200);
  assert.deepEqual(f.calls.provider, [{ readAction: 'user_info' }, { readAction: 'get_line', lineId: '123' }]);
  assert.deepEqual(Object.keys(result.body.line).sort(), ['customerId', 'lineId', 'username', 'expiresAt', 'connectionsAllowed', 'trial', 'enabled', 'adminEnabled', 'checkedAt', 'access'].sort());
  assert.equal(result.body.line.access, 'within_service_period'); assert.equal(result.body.databaseWrites, false);
});
await test('wrong line, username or reseller fails closed without leaking returned identity', async () => {
  for (const change of [{ id: '999' }, { username: 'sensitive-wrong-customer' }, { resellerId: '99' }]) {
    const f = fixture({ line: change }); const result = await f.request(); assert.equal(result.code, 502); assert.equal(result.body.line, undefined);
  }
});
await test('invalid snapshots and provider failures never appear successful', async () => {
  for (const setting of [{ providerCode: 502 }, { providerThrows: true }, { account: { id: null } }, { envelope: { databaseWrites: true } },
    { line: { enabled: '1' } }, { line: { connections: 0 } }, { line: { expiresAt: 'bad' } }]) {
    const f = fixture(setting); assert.equal((await f.request()).code, 502); assert.equal((await f.request()).code, 429);
    f.advance(31000); assert.equal((await f.request()).code, 502);
  }
});
await test('disabled and expired status distinguished from online or payment status', async () => {
  const disabled = fixture({ line: { enabled: false } }); assert.equal((await disabled.request()).body.line.access, 'disabled');
  const expired = fixture({ line: { expiresAt: '2026-10-21T11:59:59Z' } }); assert.equal((await expired.request()).body.line.access, 'expired');
});
await test('cache always rechecks auth and saved identity, recalculates expiry, and expires after 60 seconds', async () => {
  const f = fixture({ line: { expiresAt: '2026-10-21T12:00:20Z' } }); await f.request(); f.advance(21000);
  const cached = await f.request(); assert.equal(cached.body.cached, true); assert.equal(cached.body.line.access, 'expired');
  assert.equal(f.calls.auth.length, 2); assert.equal(f.calls.selects.length, 2); assert.equal(f.calls.provider.length, 2);
  f.state.user = { ...admin, email: 'someone@example.invalid' }; assert.equal((await f.request()).code, 403);
  f.state.user = admin; f.state.customer.username = 'changed-customer'; assert.equal((await f.request()).code, 429);
  f.advance(40000); assert.equal((await f.request()).code, 502); assert.equal(f.calls.provider.length, 4);
});
await test('concurrent checks coalesce and different customers cannot flood provider', async () => {
  let release; const wait = new Promise(resolve => { release = resolve; });
  const f = fixture({ wait }); const a = f.request(); const b = f.request();
  await new Promise(resolve => setImmediate(resolve)); assert.equal(f.calls.provider.length, 1);
  f.state.customer = { ...customer, id: otherId };
  assert.equal((await f.request({ query: { customerId: otherId } })).code, 429);
  release(); assert.equal((await a).code, 200); assert.equal((await b).code, 200); assert.equal(f.calls.provider.length, 2);
});
await test('real transport parser strips provider password and uses only documented GET actions', async () => {
  const calls = [];
  const transportEnv = { ...env, ROOMBA_API_URL: 'https://cdn.rooomba.tv/WDXTMHmN/', ROOMBA_API_KEY: 'fictional-api-key', FIXIE_URL: 'http://fictional:proxy-password@test-proxy.usefixie.com:80' };
  const readFactory = settings => createRoombaPreviewHandler({ env: transportEnv, ...settings, dispatcherFactory: () => ({ dispatch() {} }),
    fetchImpl: async (url, settings) => {
      calls.push(url.searchParams.get('action')); assert.equal(settings.method, 'GET'); assert.equal(settings.redirect, 'manual');
      const data = calls.length === 1 ? { id: '12', username: 'fictional-reseller', credits: '10', api_key: 'sensitive-api-key' }
        : { id: '123', username: customer.username, member_id: '12', package_id: '1', exp_date: '1792670400', max_connections: '1',
          is_trial: '1', enabled: '1', admin_enabled: '1', bouquet: '[1]', password: 'sensitive-password' };
      return new Response(JSON.stringify({ status: 'STATUS_SUCCESS', data }), { headers: { 'content-type': 'application/json' } });
    } });
  const handler = createCustomerStatusHandler({ env, readFactory, createClient: (url, key) => key === env.VITE_SUPABASE_ANON_KEY
    ? { auth: { getUser: async () => ({ data: { user: admin } }) } }
    : { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: customer }) }) }) }) } });
  let output; let code;
  await handler({ method: 'GET', query: { customerId }, headers: { authorization: 'Bearer fictional-token' } },
    { setHeader() {}, status(value) { code = value; return this; }, json(value) { output = value; } });
  assert.equal(code, 200); assert.deepEqual(calls, ['user_info', 'get_line']); assert.ok(!JSON.stringify(output).includes('sensitive-'));
});
await test('shared CRM function keeps default receipt routes and isolates the new read-only view', async () => {
  const route = createRoombaCrmRoute({ env: { VERCEL_ENV: 'preview' } });
  const request = async (query, method = 'GET') => {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await route({ method, query, headers: {} }, res); return res;
  };
  assert.equal((await request({})).code, 401);
  assert.equal((await request({}, 'POST')).code, 401);
  assert.equal((await request({ view: 'customer-status', customerId })).code, 401);
  assert.equal((await request({ view: 'customer-status', customerId }, 'POST')).code, 405);
  assert.equal((await request({ view: ['customer-status'] })).code, 400);
  assert.equal((await request({ view: 'unknown' })).code, 400);
});
await test('deployment stays within twelve functions and client uses the shared endpoint', async () => {
  const entries = await readdir(new URL('../api/', import.meta.url));
  assert.equal(entries.filter(name => /\.(js|ts)$/.test(name)).length, 12);
  const client = await readFile(new URL('../src/pages/admin/RoombaCustomerStatus.tsx', import.meta.url), 'utf8');
  assert.ok(client.includes('/api/ks-roomba-crm?view=customer-status&customerId='));
});
console.log(`${count} customer status checks passed. No live provider requests or database writes.`);
