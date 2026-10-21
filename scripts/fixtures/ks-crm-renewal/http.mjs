import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRoombaCrmRoute } from '../../../_server/ks-roomba-crm-route.js';

let serial = 0;
export function httpFixture(settings = {}) {
  const at = settings.now ?? Date.now();
  const expiresAt = new Date(Math.floor((at + 30 * 86400000) / 1000) * 1000).toISOString();
  const state = { now: at, user: { id: '00000000-0000-4000-8000-000000000090', email: 'djudge47@gmail.com', email_confirmed_at: new Date(at).toISOString() },
    customer: { id: randomUUID(), external_id: 97000000 + ++serial, username: `fictional_http_${serial}`, expiration_at: expiresAt },
    control: false, approvals: new Map(), operations: new Map(), ...settings };
  state.line = { id: String(state.customer.external_id), username: state.customer.username, resellerId: '88', packageId: '19',
    expiresAt, connections: 1, trial: false, enabled: true, adminEnabled: true, bouquetIds: [2,13,18,40], ...settings.line };
  state.account = { id: '88', credits: 100, ...settings.account };
  state.packages = settings.packages || [{ id: '19', name: '12 Months + 1 Connection', maxConnections: 1,
    trial: null, paid: { count: 12, unit: 'months', credits: 12 }, bouquets: Array.from({ length: 107 }, (_, i) => i + 1), issues: [] }];
  const env = { VERCEL_ENV: 'preview', VITE_SUPABASE_URL: 'https://wftfxerblhlsxiijtfbo.supabase.co', VITE_SUPABASE_ANON_KEY: 'fictional-anon',
    SUPABASE_SERVICE_ROLE_KEY: 'fictional-service', ROOMBA_PREVIEW_SECRET: 'fictional-preview-secret-at-least-thirty-two-bytes', ...settings.env };
  const calls = { auth: 0, selects: [], reads: [], rpc: [] };
  const storage = async ({ table, columns, field, value }) => {
    calls.selects.push({ table, columns, field, value });
    if (state.storage) return state.storage({ table, columns, field, value });
    if (state.lookupFails) return { data: null, error: {} };
    let row;
    if (table === 'iptv_customers') { assert.equal(field, 'id'); row = state.customer.id === value ? state.customer : null; }
    else if (table === 'ks_crm_renewal_control') { assert.equal(field, 'singleton'); row = { execution_enabled: state.control }; }
    else if (table === 'ks_crm_renewal_approvals') { assert.equal(field, 'operation_id'); row = state.approvals.get(value); }
    else if (table === 'ks_crm_renewal_operations') { assert.equal(field, 'operation_id'); row = state.operations.get(value); }
    else throw Error(`Forbidden table ${table}`);
    return { data: row ? Object.fromEntries(columns.split(',').map(k => [k, row[k]])) : null, error: null };
  };
  const createClient = (url, key) => {
    assert.equal(url, env.VITE_SUPABASE_URL);
    if (key === env.VITE_SUPABASE_ANON_KEY) return { auth: { async getUser() { calls.auth++; return { data: { user: state.user }, error: state.authError ? {} : null }; } } };
    assert.equal(key, env.SUPABASE_SERVICE_ROLE_KEY);
    return { from(table) { return { select(columns) { return { eq(field, value) { return { maybeSingle: () => storage({ table, columns, field, value }) }; } }; } }; },
      async rpc(name, args) {
        assert.equal(name, 'ks_crm_reserve_renewal'); calls.rpc.push(args);
        if (state.persist) return state.persist(args);
        if (state.rpcWait) await state.rpcWait;
        if (state.rpcFails) return { data: null, error: {} };
        const replayed = state.approvals.has(args.p_operation);
        state.approvals.set(args.p_operation, { approval_id: args.p_approval, operation_id: args.p_operation, approver_id: args.p_approver,
          customer_id: args.p_plan.customerId, approval_hash: args.p_approval_hash, plan_fingerprint: args.p_plan.fingerprint });
        state.operations.set(args.p_operation, { state: 'reserved' });
        if (state.lostReply) throw Error('fictional lost RPC reply');
        return { data: { state: 'reserved', may_dispatch: false, replayed, claimToken: 'never-return-to-browser' }, error: null };
      } };
  };
  const readFactory = settings => async (req, res) => {
    assert.equal(req.method, 'GET'); assert.ok(['user_info','get_line','packages'].includes(settings.readAction));
    calls.reads.push(settings.readAction);
    if (state.providerFails) throw Error('sensitive-provider-error');
    const content = settings.readAction === 'user_info' ? { status: 'connected', account: state.account }
      : settings.readAction === 'get_line' ? { status: 'line_ready', line: { ...state.line, password: 'sensitive-provider-password' } }
        : { status: 'packages_ready', packages: state.packages };
    state.now += state.readDelay || 0;
    return res.status(200).json({ mode: 'read-only', transport: 'fixie', databaseWrites: false, ...content });
  };
  const handler = createRoombaCrmRoute({ env, createClient, readFactory, now: () => state.now });
  const request = async ({ method = 'GET', view = 'customer-renewal', body, headers = {}, query = {} } = {}) => {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await handler({ method, query: { view, ...(method === 'GET' ? { customerId: state.customer.id } : {}), ...query }, body,
      headers: { authorization: 'Bearer fictional-auth', origin: 'https://fictional.example.invalid', host: 'fictional.example.invalid', 'content-type': 'application/json', ...headers } }, res);
    assert.equal(res.headers['Cache-Control'], 'private, no-store');
    const output = JSON.stringify(res.body);
    for (const secret of ['sensitive-', env.ROOMBA_PREVIEW_SECRET, env.SUPABASE_SERVICE_ROLE_KEY, 'never-return-to-browser']) assert.ok(!output.includes(secret));
    return res;
  };
  return { state, calls, env, request, async review() { return (await request()).body.testApproval; },
    save(review, overrides = {}) { return request({ method: 'POST', view: 'renewal-test-approval', body: { reviewToken: review.token, preserveCurrentSelectionConfirmed: true }, ...overrides }); } };
}
