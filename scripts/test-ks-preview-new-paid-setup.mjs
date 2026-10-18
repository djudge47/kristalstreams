import assert from 'node:assert/strict';
import { createPreviewNewPaidSetupHandler } from '../_server/ks-preview-new-paid-setup.js';
import { createPreviewPaidOrdersHandler, createPreviewPaidOrdersRouter } from '../_server/ks-preview-paid-orders.js';
import { readdirSync } from 'node:fs';
const userId = '00000000-0000-4000-8000-000000000001', checkedAt = '2026-10-18T00:00:00.000Z';
const env = { VERCEL_ENV: 'preview', VITE_SUPABASE_URL: 'https://synthetic.supabase.co', VITE_SUPABASE_ANON_KEY: 'fake-anon', SUPABASE_SERVICE_ROLE_KEY: 'fake-server' };
const user = { id: userId, email: 'djudge47@gmail.com', email_confirmed_at: '2026-01-01', is_anonymous: false };
const row = { sessionId: 'cs_test_SavedTemplate', userId, testMode: true, tier: 'bronze', connections: 1, amountCents: 2000,
  currency: 'usd', receiptDurationDays: 30, websiteActivated: false, orderStatus: 'awaiting_activation', recordedAt: checkedAt, queuedAt: checkedAt };
const packages = [1, 3, 6, 12].flatMap((months, i) => Array.from({ length: 5 }, (_, j) => ({ id: String(1000 + i * 5 + j), name: `${months} Months + ${j + 1} Connections`,
  maxConnections: j + 1, paid: { count: months, unit: 'months', credits: (i + 1) * (j + 1) }, trial: null, bouquets: [13, 14], issues: [] })));
let reads = 0, catalogs = 0, authCalls = 0;
const make = (patch = {}) => createPreviewNewPaidSetupHandler({ env: patch.env || env, now: () => Date.parse(checkedAt),
  createClient: (_url, key) => key === 'fake-anon' ? { auth: { getUser: async () => { authCalls++; return { data: { user: patch.user === undefined ? user : patch.user }, error: null }; } } }
    : { rpc: async name => { reads++; assert.equal(name, 'ks_list_preview_paid_orders'); return { data: patch.rows || [row], error: patch.storageFail ? {} : null }; } },
  packagesHandler: async (req, res) => { catalogs++; assert.equal(req.method, 'GET'); assert.equal(req.headers.authorization, 'Bearer fake-token');
    return res.status(patch.catalogCode || 200).json({ status: 'packages_ready', mode: 'read-only', databaseWrites: false, transport: 'fixie', checkedAt: patch.checkedAt || checkedAt, packages: patch.packages || packages, password: 'secret-marker' }); },
});
const req = { method: 'GET', headers: { authorization: 'Bearer fake-token' }, query: { sessionId: row.sessionId } };
const response = () => ({ headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
let count = 0;
const check = async (name, test) => { await test(); count++; console.log(`PASS: ${name}`); };
await check('production, unsupported methods, missing tokens and malformed references stop before storage or provider reads', async () => {
  for (const [handler, request, code] of [[make({ env: { ...env, VERCEL_ENV: 'production' } }), req, 404], [make(), { ...req, method: 'POST' }, 405],
    [make(), { ...req, headers: {} }, 401], [make(), { ...req, query: { sessionId: ['bad'] } }, 400]]) {
    const res = response(); await handler(request, res); assert.equal(res.code, code);
  }
  assert.equal(reads, 0); assert.equal(catalogs, 0); assert.equal(authCalls, 0);
});
await check('verified confirmed administrator is required; editable metadata grants no authority', async () => {
  for (const who of [{ ...user, email: 'other@example.invalid', user_metadata: { role: 'admin' } }, { ...user, is_anonymous: true }, { ...user, email_confirmed_at: null }]) {
    const res = response(); await make({ user: who })(req, res); assert.equal(res.code, 403);
  }
  const res = response(); await make({ user: null })(req, res); assert.equal(res.code, 401);
  assert.equal(reads, 0); assert.equal(catalogs, 0);
});
await check('missing or other-account test order cannot be used as a template', async () => {
  for (const rows of [[], [{ ...row, userId: '00000000-0000-4000-8000-000000000002' }]]) {
    const res = response(); await make({ rows })(req, res); assert.equal(res.code, 409);
  }
  assert.equal(catalogs, 0);
});
await check('saved owner plan generates eight synthetic cases with zero real writes and no line/customer/credential disclosure', async () => {
  const res = response(); await make()(req, res); assert.equal(res.code, 200);
  assert.equal(res.headers['Cache-Control'], 'private, no-store'); assert.equal(res.headers.Vary, 'Authorization');
  const report = res.body.report; assert.equal(report.checks.length, 8); assert.equal(report.liveExecutionEnabled, false);
  assert.equal(report.realCreditsSpent, 0); assert.equal(report.databaseWrites, false); assert.equal(report.realMessagesSent, 0);
  assert.equal(report.plan.expectedProviderCredits, 1); assert.equal(report.plan.providerMonths, 1);
  for (const privateValue of ['secret-marker', userId, 'ks_simulation_customer', 'synthetic_only_password', row.sessionId]) assert.ok(!JSON.stringify(report).includes(privateValue));
});
await check('stale, malformed, ambiguous and unavailable catalogs fail without false completion', async () => {
  for (const patch of [{ storageFail: true }, { catalogCode: 502 }, { checkedAt: '2020-01-01T00:00:00Z' },
    { packages: [...packages, { ...packages[0], id: '88888' }] }]) {
    const res = response(); await make(patch)(req, res); assert.equal(res.code, 503); assert.equal(res.body.report, undefined);
  }
  const res = response(); await make({ catalogCode: 429 })(req, res); assert.equal(res.code, 429); assert.equal(res.headers['Retry-After'], '30');
});
await check('forged enable flags, target lines, packages, passwords and approvals cannot turn GET or POST into activation', async () => {
  const handler = make({ env: { ...env, ROOMBA_PAID_CREATE_ENABLED: 'true' } });
  const res = response(); await handler({ ...req, query: { ...req.query, action: 'create_line', package: 'attacker', lineId: 'attacker' }, body: { approved: true, password: 'secret-marker' } }, res);
  assert.equal(res.code, 200); assert.equal(res.body.report.liveExecutionEnabled, false); assert.equal(res.body.report.realProviderWrites, 0);
  const before = [reads, catalogs]; const post = response(); await handler({ ...req, method: 'POST', body: { approved: true } }, post);
  assert.equal(post.code, 405); assert.deepEqual([reads, catalogs], before);
});
await check('shared deployment route preserves ordinary order listing and only the explicit view selects the simulator', async () => {
  let listCalls = 0, simulationCalls = 0;
  const router = createPreviewPaidOrdersRouter({ listHandler: async (_req, res) => { listCalls++; return res.status(200).json({ mode: 'read-only', orders: [] }); },
    simulationHandler: make() });
  const list = response(); await router({ ...req, query: {} }, list); assert.equal(list.code, 200); assert.equal(listCalls, 1);
  const actualSimulation = make(); const route = createPreviewPaidOrdersRouter({ listHandler: () => { throw new Error('wrong view'); },
    simulationHandler: async (request, res) => { simulationCalls++; return actualSimulation(request, res); } });
  const result = response(); await route({ ...req, query: { ...req.query, view: 'new-customer-simulation' } }, result);
  assert.equal(result.code, 200); assert.equal(simulationCalls, 1); assert.equal(result.body.report.liveExecutionEnabled, false);
  for (const view of ['create_line', ['new-customer-simulation'], null]) {
    const invalid = response(); await router({ ...req, query: { ...req.query, view } }, invalid); assert.equal(invalid.code, 400);
  }
  assert.equal(listCalls, 1);
});
await check('shared route cannot bypass simulation auth, Preview gate or POST rejection', async () => {
  for (const [patch, request, code] of [[{}, { ...req, headers: {} }, 401], [{ env: { ...env, VERCEL_ENV: 'production' } }, req, 404],
    [{ user: { ...user, email: 'other@example.invalid' } }, req, 403], [{}, { ...req, method: 'POST' }, 405]]) {
    const route = createPreviewPaidOrdersRouter({ listHandler: createPreviewPaidOrdersHandler({}), simulationHandler: make(patch) });
    const res = response(); await route({ ...request, query: { ...req.query, view: 'new-customer-simulation' } }, res);
    assert.equal(res.code, code);
  }
});
await check('deployment uses twelve API function entrypoints and no separate simulator entrypoint', () => {
  const entries = readdirSync(new URL('../api/', import.meta.url)).filter(name => /\.(js|ts)$/.test(name));
  assert.equal(entries.length, 12); assert.ok(!entries.includes('ks-preview-new-paid-setup.js'));
});
console.log(`${count} Preview simulation API checks passed. Only synthetic auth/catalog/storage responses were used.`);
