import assert from 'node:assert/strict';
import { createRoombaCrmHandler, trialSnapshot } from '../_server/ks-roomba-crm.js';
import { isBillingOverdue, isDueWithin, isTrialCustomer, isUnpaidCustomer, trialBadge, displayedAccountStatus } from '../_shared/ks-crm-status.js';

const user = { id: '00000000-0000-4000-8000-000000000001', email: 'djudge47@gmail.com', email_confirmed_at: '2026-01-01' };
const customerId = '00000000-0000-4000-8000-000000000002';
const now = Date.parse('2026-10-17T13:00:00Z');
const receipt = { slot: 'preview_trial_activation_v1', admin_id: user.id, package_id: '1', username: 'synthetic_trial', state: 'succeeded', result: { trial: true, lineId: '123', username: 'synthetic_trial', connections: 1, expiresAt: '2026-10-18T17:00:00.000Z', password: 'MUST_NOT_APPEAR' }, updated_at: '2026-10-17T05:00:00.000Z', crm_customer_id: null, crm_linked_at: null };
const env = { VERCEL_ENV: 'preview', VITE_SUPABASE_URL: 'https://fake.supabase.co', VITE_SUPABASE_ANON_KEY: 'fake-anon', SUPABASE_SERVICE_ROLE_KEY: 'MUST_NOT_APPEAR' };
function fixture(settings = {}) {
  let saved = structuredClone(settings.receipt === undefined ? receipt : settings.receipt);
  let customer = settings.customer ?? null;
  const calls = { auth: 0, service: 0, reads: 0, writes: 0 };
  const createClient = (_url, key) => {
    if (key !== env.SUPABASE_SERVICE_ROLE_KEY) return { auth: { async getUser(token) {
      calls.auth++; if (settings.authFails) throw new Error('MUST_NOT_APPEAR');
      return { data: { user: settings.user === undefined ? user : settings.user }, error: token === 'expired' ? {} : null };
    } } };
    calls.service++;
    return {
      from(table) { return { select(columns) { assert.ok(!columns.includes('password')); assert.ok(!columns.includes('*')); return { eq(key, value) { assert.equal(key, table === 'iptv_customers' ? 'id' : 'slot'); assert.equal(value, table === 'iptv_customers' ? customerId : receipt.slot); return { async maybeSingle() { calls.reads++; return { data: table === 'iptv_customers' ? customer : saved, error: settings.readFails ? {} : null }; } }; } }; } }; },
      async rpc(name, args) {
        calls.writes++; assert.equal(name, 'ks_link_roomba_trial_to_crm'); assert.deepEqual(args, { p_admin_id: user.id });
        if (settings.rpcError) return { error: { code: settings.rpcError, message: 'MUST_NOT_APPEAR' } };
        const replayed = !!saved.crm_customer_id;
        saved = { ...saved, crm_customer_id: customerId, crm_linked_at: '2026-10-17T13:00:00.000Z' };
        customer = { id: customerId, external_id: 123, username: receipt.username, password: 'MUST_NOT_APPEAR' };
        return { data: { ok: true, customerId, replayed } };
      },
    };
  };
  const handler = createRoombaCrmHandler({ createClient, env: { ...env, ...settings.env }, now: () => now });
  return { calls, async request({ method = 'GET', body, token = 'synthetic-token' } = {}) {
    const res = { setHeader(k,v) { assert.equal(k, 'Cache-Control'); assert.equal(v, 'private, no-store'); }, status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } };
    // Override Allow header handling without weakening cache assertions.
    const set = res.setHeader; res.setHeader = (k,v) => k === 'Allow' ? undefined : set(k,v);
    await handler({ method, body, headers: { authorization: token ? `Bearer ${token}` : '' }, query: { customerId: 'forged', admin: true } }, res);
    assert.ok(!JSON.stringify(res.body).includes('MUST_NOT_APPEAR')); return res;
  } };
}
let checks = 0;
async function check(name, fn) { await fn(); checks++; console.log(`PASS: ${name}`); }
await check('Production, invalid methods and unauthorized identities cannot use the service client', async () => {
  for (const settings of [{ env: { VERCEL_ENV: 'production' } }, { env: { VERCEL_ENV: 'development' } }, { user: null }, { user: { ...user, email: 'customer@example.invalid', user_metadata: { role: 'admin' } } }, { user: { ...user, is_anonymous: true } }, { user: { ...user, email_confirmed_at: null } }, { authFails: true }]) {
    const f = fixture(settings); assert.ok((await f.request()).code >= 400); assert.equal(f.calls.service, 0); assert.equal(f.calls.writes, 0);
  }
  const f = fixture(); assert.equal((await f.request({ token: '' })).code, 401); assert.equal((await f.request({ token: 'expired' })).code, 401); assert.equal((await f.request({ method: 'DELETE' })).code, 405); assert.equal(f.calls.service, 0);
});
await check('saved setup GET is read-only, bounded and excludes credentials', async () => {
  const f = fixture(); const res = await f.request(); assert.equal(res.code, 200); assert.equal(res.body.setup.status, 'unlinked'); assert.equal(res.body.setup.lineId, '123'); assert.equal(res.body.trialCreationEnabled, false); assert.equal(f.calls.writes, 0);
});
await check('CRM linking works with provider creation disabled and ignores caller identity overrides', async () => {
  const f = fixture(); const res = await f.request({ method: 'POST', body: { confirmed: true, customerId: 'forged', username: 'forged', p_admin_id: 'forged', password: 'MUST_NOT_APPEAR' } });
  assert.equal(res.code, 200); assert.equal(res.body.setup.status, 'linked'); assert.equal(res.body.setup.customerId, customerId); assert.equal(f.calls.writes, 1);
  const replay = await f.request({ method: 'POST', body: { confirmed: true } }); assert.equal(replay.body.replayed, true);
});
await check('confirmation and a valid owned receipt are required for linking', async () => {
  const f = fixture(); assert.equal((await f.request({ method: 'POST', body: {} })).code, 400); assert.equal(f.calls.writes, 0);
  for (const row of [null, { ...receipt, state: 'unknown' }, { ...receipt, admin_id: customerId }, { ...receipt, result: { ...receipt.result, trial: false } }, { ...receipt, result: { ...receipt.result, connections: 2 } }, { ...receipt, result: { ...receipt.result, username: 'different' } }, { ...receipt, result: { ...receipt.result, expiresAt: 'invalid' } }]) {
    const g = fixture({ receipt: row }); assert.ok((await g.request({ method: 'POST', body: { confirmed: true } })).code >= 400); assert.equal(g.calls.writes, 0);
  }
});
await check('identity conflicts and database errors never report a successful link', async () => {
  const f = fixture({ receipt: { ...receipt, crm_customer_id: customerId }, customer: { id: customerId, external_id: 999, username: receipt.username } });
  assert.equal((await f.request()).body.setup.status, 'conflict'); assert.equal((await f.request({ method: 'POST', body: { confirmed: true } })).code, 409); assert.equal(f.calls.writes, 0);
  for (const rpcError of ['P0001', '23505', 'unavailable']) { const g = fixture({ rpcError }); assert.ok((await g.request({ method: 'POST', body: { confirmed: true } })).code >= 400); }
  assert.equal((await fixture({ readFails: true }).request()).code, 503);
});
await check('the snapshot preserves provider expiry without claiming live online status', async () => {
  assert.equal(trialSnapshot(receipt, null, now).access, 'within_trial_period');
  const later = trialSnapshot(receipt, null, now + 3 * 86400000); assert.equal(later.access, 'expired'); assert.equal(later.expiresAt, receipt.result.expiresAt);
  assert.equal(later.online, undefined); assert.equal(later.password, undefined);
});
await check('active and expired trials do not inflate unpaid, due, overdue or revenue filters', async () => {
  const c = { trial: true, payment_status: 'trial', account_status: 'active', renewal_at: '2026-10-18T17:00:00Z', expiration_at: receipt.result.expiresAt };
  for (const time of [now, now + 3 * 86400000]) { assert.equal(isTrialCustomer(c), true); assert.equal(isUnpaidCustomer(c), false); assert.equal(isBillingOverdue(c, time), false); assert.equal(isDueWithin(c, 3, time), false); }
  assert.equal(trialBadge(c, now), 'Trial active'); assert.equal(trialBadge(c, now + 3 * 86400000), 'Trial expired'); assert.equal(displayedAccountStatus(c, now + 3 * 86400000), 'expired');
  assert.equal(trialBadge({ ...c, expiration_at: null }, now), 'Trial · expiry unknown');
});
await check('existing paid and unpaid billing behavior remains unchanged', async () => {
  const c = { trial: false, payment_status: 'unpaid', account_status: 'active', renewal_at: '2026-10-18T00:00:00Z', expiration_at: '2026-10-18T00:00:00Z' };
  assert.equal(isUnpaidCustomer(c), true); assert.equal(isDueWithin(c, 3, now), true); assert.equal(isBillingOverdue(c, now), false);
  assert.equal(isBillingOverdue(c, now + 3 * 86400000), true); assert.equal(isUnpaidCustomer({ ...c, payment_status: 'paid' }), false);
  assert.equal(isBillingOverdue({ ...c, expiration_at: 'invalid', renewal_at: null }, now), false);
});
console.log(`${checks} CRM link checks passed. No provider requests, live customer writes or payment changes.`);
