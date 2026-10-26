import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { reviewPaidNewService } from '../_server/ks-paid-new-service-review.js';
import { createPaidNewServiceHandler } from '../_server/ks-paid-new-service-http.js';
import { createPaidReadAdapter } from '../_server/ks-paid-provider-read.js';
import { createPreviewPaidOrdersRouter } from '../_server/ks-preview-paid-orders.js';

const project = 'https://wftfxerblhlsxiijtfbo.supabase.co';
const clone = value => structuredClone(value);
let passed = 0;
async function check(label, fn) { await fn(); passed++; console.log(`PASS: ${label}`); }
function fixture(environment = 'production') {
  const at = Date.now(), owner = randomUUID(), actor = randomUUID(), requestId = randomUUID();
  const reference = `cs_${environment === 'production' ? 'live' : 'test'}_NewServiceFixture`, intentId = 'pi_NewServiceFixture';
  const live = environment === 'production', email = 'new_service%fixture@example.invalid';
  const state = { at, providerReads: 0, paymentReads: 0, reads: [], afterSnapshot: null, finalPayment: null, failTable: null,
    adminUser: { id: actor, email: 'djudge47@gmail.com', email_confirmed_at: new Date(at - 60000).toISOString(), is_anonymous: false } };
  const row = { checkout_session_id: reference, payment_intent_id: intentId, user_id: owner, livemode: live,
    tier: 'bronze', connections: 1, duration_days: 30, amount_cents: 2000, currency: 'usd' };
  const tables = {
    ks_payment_receipts: [{ ...row, activated: false, expires_at: null, recorded_at: new Date(at - 1000).toISOString() }],
    ks_setup_order_queue: [{ ...row, fulfillment_status: 'awaiting_activation', queued_at: new Date(at - 500).toISOString() }],
    ks_paid_order_routes: [{ checkout_session_id: reference, user_id: owner, livemode: live, request_kind: 'new_service',
      destination: 'new_service_review', reason: 'new_service_requested', customer_id: null, external_id: null, routed_at: new Date(at - 500).toISOString() }],
    profiles: [{ id: owner, email, subscription_status: 'inactive', active_connections: 0, subscription_expires_at: null }],
    ks_crm_portal_links: [], iptv_customers: [], ks_roomba_trial_attempts: [], ks_preview_paid_fulfillments: [],
    ks_preview_provisioning_attempts: [], ks_setup_review_claims: [],
    [live ? 'ks_live_checkout_requests' : 'ks_checkout_requests']: [{ binding_version: 1, renewal_customer_id: null, renewal_external_id: null,
      user_id: owner, request_id: requestId, tier: 'bronze', connections: 1, duration_days: 30, amount_cents: 2000,
      currency: 'usd', kind: 'new_service', return_origin: 'https://kristalstream.com', customer_email: email, livemode: live,
      created_epoch: Math.floor(at / 1000) - 60, expires_epoch: Math.floor(at / 1000) + 3540,
      checkout_session_id: reference, bound_at: new Date(at - 30000).toISOString() }],
    ks_setup_purchase_intents: [{ checkout_session_id: reference, user_id: owner, kind: 'new_service',
      new_service_attested: true, source: 'authenticated_checkout', captured_at: new Date(at - 30000).toISOString() }],
  };
  const user = { id: owner, email, is_anonymous: false, email_confirmed_at: new Date(at - 60000).toISOString() };
  const session = { id: reference, livemode: live, mode: 'payment', status: 'complete', payment_status: 'paid',
    client_reference_id: owner, customer_email: email, expires_at: Math.floor(at / 1000) + 3540,
    currency: 'usd', amount_total: 2000, amount_subtotal: 2000,
    metadata: { user_id: owner, plan: 'bronze', interval: 'monthly', connections: '1', duration_days: '30', price: '20',
      checkout_binding_version: '1', checkout_request_id: requestId, purchase_kind: 'new_service' },
    payment_intent: { id: intentId, livemode: live, status: 'succeeded', currency: 'usd', amount: 2000, amount_received: 2000,
      latest_charge: { id: 'ch_NewServiceFixture', livemode: live, payment_intent: intentId, currency: 'usd', amount: 2000,
        paid: true, captured: true, refunded: false, amount_refunded: 0, disputed: false } } };
  const packages = [];
  for (const months of [1, 3, 6, 12]) for (let connections = 1; connections <= 5; connections++) packages.push({
    id: String(packages.length + 100), name: `${months} Months + ${connections} Connections`, maxConnections: connections,
    paid: { count: months, unit: 'months', credits: months * connections }, trial: null, bouquets: [1, 2], issues: [],
  });
  const snapshot = { checkedAt: at, account: { id: '400', credits: '100' }, packages };
  // Actual supabase-js constructs every Auth/PostgREST request. All traffic is
  // intercepted here; mutation methods and unrecognized destinations fail.
  const client = key => createClient(project, key, { auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input, init = {}) => {
      const url = new URL(typeof input === 'string' ? input : input.url ?? input);
      assert.equal(url.origin, project); assert.equal(init.method || 'GET', 'GET');
      if (url.pathname === '/auth/v1/user') return Response.json(state.adminUser);
      if (url.pathname === `/auth/v1/admin/users/${owner}`) return Response.json(user);
      assert.ok(url.pathname.startsWith('/rest/v1/'));
      const table = url.pathname.split('/').at(-1); assert.ok(Object.hasOwn(tables, table), table);
      state.reads.push({ table, params: new URLSearchParams(url.searchParams) });
      if (state.failTable === table) return Response.json({ message: 'fictional private failure' }, { status: 500 });
      let rows = tables[table].filter(row => [...url.searchParams].every(([key, value]) => {
        if (['select', 'limit', 'order'].includes(key)) return true;
        if (value.startsWith('eq.')) return String(row[key]) === value.slice(3);
        if (value.startsWith('neq.')) return String(row[key]) !== value.slice(4);
        if (value.startsWith('in.')) return value.slice(4, -1).split(',').includes(String(row[key]));
        if (value.startsWith('ilike.')) {
          // This fixture uses literal %/_ in email to catch wildcard mistakes.
          assert.equal(value, `ilike.${email.replace(/[\\%_]/g, '\\$&')}`);
          return row[key]?.toLowerCase() === email.toLowerCase();
        }
        assert.fail(`unexpected filter ${key}:${value}`);
      }));
      if (url.searchParams.has('limit')) rows = rows.slice(0, Number(url.searchParams.get('limit')));
      const select = url.searchParams.get('select');
      if (select !== '*') rows = rows.map(row => Object.fromEntries(select.split(',').filter(k => k in row).map(k => [k, row[k]])));
      return Response.json(rows);
    } } });
  const admin = client('fictional-service');
  const provider = { async snapshot() { state.providerReads++; await state.afterSnapshot?.(); return clone(snapshot); } };
  const payments = { async retrieve(id) { assert.equal(id, reference); state.paymentReads++; return clone(state.paymentReads > 1 && state.finalPayment ? state.finalPayment : session); } };
  const run = () => reviewPaidNewService({ admin, provider, payments, reference, environment, now: () => state.at });
  const env = { VERCEL_ENV: environment, VITE_SUPABASE_URL: project, VITE_SUPABASE_ANON_KEY: 'fictional-anon', SUPABASE_SERVICE_ROLE_KEY: 'fictional-service' };
  const handler = createPaidNewServiceHandler({ env, now: () => state.at, createClient: (_url, key) => client(key),
    providerFactory: () => provider, paymentsFactory: () => payments });
  const call = async (patch = {}) => {
    const res = { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
    await handler({ method: 'POST', query: { view: 'paid-new-service-review' }, body: { reference }, headers: {
      origin: 'https://fixture.vercel.app', host: 'fixture.vercel.app', 'content-type': 'application/json', authorization: 'Bearer fictional-token',
    }, ...patch }, res);
    return res;
  };
  return { state, tables, user, session, snapshot, run, call, handler, reference, owner, admin, env };
}

await check('live and sandbox settled purchases receive a bounded quote without dispatch or private identity', async () => {
  for (const environment of ['preview', 'production']) {
    const f = fixture(environment), result = await f.run();
    assert.equal(result.state, 'verified_for_review', JSON.stringify(result)); assert.equal(result.costCredits, '1'); assert.equal(result.months, 1);
    assert.equal(result.mayDispatch, false); assert.equal(result.providerActivated, false);
    assert.equal(Date.parse(result.validUntil) - f.state.at, 30000); assert.equal(f.state.paymentReads, 2);
    const output = JSON.stringify(result); assert.ok(!output.includes(f.owner)); assert.ok(!output.includes(f.user.email));
    assert.ok(!output.includes('claimToken')); assert.ok(!output.includes('bouquet')); assert.match(result.quoteFingerprint, /^[a-f0-9]{64}$/);
    assert.ok(f.state.reads.every(r => !/password|envelope|claim_token/.test(r.params.get('select'))));
  }
});
await check('refunded, disputed, uncaptured, underpaid and wrong-owner payments stop before provider reads', async () => {
  for (const patch of [s => { s.payment_intent.latest_charge.refunded = true; }, s => { s.payment_intent.latest_charge.disputed = true; },
    s => { s.payment_intent.latest_charge.captured = false; }, s => { s.payment_intent.amount_received = 1999; },
    s => { s.metadata.user_id = randomUUID(); }, s => { s.id = 'cs_live_Other'; }, s => { s.livemode = false; }]) {
    const f = fixture(); patch(f.session); assert.equal((await f.run()).state, 'review_required'); assert.equal(f.state.providerReads, 0);
  }
});
await check('only the bound authenticated new-service declaration qualifies', async () => {
  for (const patch of [f => { f.session.metadata.checkout_binding_version = '2'; },
    f => { f.tables.ks_setup_purchase_intents[0].new_service_attested = false; },
    f => { f.tables.ks_live_checkout_requests[0].kind = 'renewal'; },
    f => { f.tables.ks_live_checkout_requests[0].customer_email = 'other@example.invalid'; }]) {
    const f = fixture(); patch(f); assert.equal((await f.run()).state, 'review_required'); assert.equal(f.state.providerReads, 0);
  }
});
await check('existing CRM, trials, setup attempts, review claims, completed service and other orders stop new creation review', async () => {
  for (const table of ['ks_crm_portal_links', 'iptv_customers', 'ks_roomba_trial_attempts', 'ks_preview_paid_fulfillments',
    'ks_preview_provisioning_attempts', 'ks_setup_review_claims', 'ks_setup_order_queue']) {
    const f = fixture(); f.tables[table].push({ id: randomUUID(), user_id: f.owner, admin_id: f.owner,
      email: f.user.email, checkout_session_id: 'cs_live_PreviousOrder' });
    assert.equal((await f.run()).reason, 'existing_or_uncertain_service', table); assert.equal(f.state.providerReads, 0);
  }
});
await check('null or unknown website status and unconfirmed/anonymous owners fail closed', async () => {
  for (const patch of [f => { f.tables.profiles[0].subscription_status = null; }, f => { f.tables.profiles[0].active_connections = null; },
    f => { f.tables.profiles[0].subscription_expires_at = '2025-01-01T00:00:00Z'; }, f => { f.user.is_anonymous = true; },
    f => { f.user.email_confirmed_at = null; }, f => { f.tables.profiles[0].email = 'other@example.invalid'; }]) {
    const f = fixture(); patch(f); assert.equal((await f.run()).state, 'review_required'); assert.equal(f.state.providerReads, 0);
  }
});
await check('a completed, altered, misrouted or missing queue cannot qualify', async () => {
  for (const patch of [f => { f.tables.ks_setup_order_queue[0].fulfillment_status = 'setup_complete'; },
    f => { f.tables.ks_payment_receipts[0].activated = true; }, f => { f.tables.ks_setup_order_queue[0].amount_cents = 1; },
    f => { f.tables.ks_paid_order_routes[0].destination = 'renewal_review'; }, f => { f.tables.ks_setup_order_queue = []; }]) {
    const f = fixture(); patch(f); assert.equal((await f.run()).state, 'review_required'); assert.equal(f.state.providerReads, 0);
  }
});
await check('unavailable local history returns no quote and makes no provider call', async () => {
  const f = fixture(); f.state.failTable = 'ks_preview_provisioning_attempts';
  await assert.rejects(f.run(), /new_service_review_unavailable/); assert.equal(f.state.providerReads, 0);
});
await check('duplicate packages, bad catalog and insufficient credits never produce a quote', async () => {
  for (const patch of [f => { f.snapshot.packages.push(clone(f.snapshot.packages[0])); },
    f => { f.snapshot.packages[0].paid.count = 12; }, f => { f.snapshot.account.credits = '0'; }]) {
    const f = fixture(); patch(f); assert.equal((await f.run()).state, 'review_required');
  }
});
await check('refunds and identity/service changes during provider reads stop the review', async () => {
  const refunded = fixture(); refunded.state.finalPayment = clone(refunded.session);
  refunded.state.finalPayment.payment_intent.latest_charge.refunded = true;
  assert.equal((await refunded.run()).reason, 'payment_changed_during_review');
  for (const patch of [f => { f.tables.profiles[0].active_connections = 1; },
    f => { f.tables.ks_setup_order_queue[0].fulfillment_status = 'requires_review'; },
    f => { f.tables.ks_setup_purchase_intents[0].captured_at = new Date(f.state.at).toISOString(); }]) {
    const f = fixture(); f.state.afterSnapshot = () => patch(f); assert.equal((await f.run()).state, 'review_required');
  }
});
await check('slow or backwards clocks cannot leave an apparently valid review', async () => {
  const slow = fixture(); slow.state.afterSnapshot = () => { slow.state.at += 30000; };
  assert.equal((await slow.run()).reason, 'review_expired');
  const backwards = fixture(); backwards.state.afterSnapshot = () => { backwards.state.at--; };
  await assert.rejects(backwards.run(), /new_service_review_unavailable/);
});
await check('HTTP authentication, method, origin, project and body checks happen before provider reads', async () => {
  for (const [patch, status] of [[{ method: 'DELETE' }, 405], [{ headers: {} }, 403],
    [{ body: { reference: 'cs_live_NewServiceFixture', ownerId: randomUUID() } }, 400],
    [{ body: { reference: 'cs_test_WrongEnvironment' } }, 400]]) {
    const f = fixture(), res = await f.call(patch); assert.equal(res.code, status); assert.equal(f.state.providerReads, 0);
  }
  const unauthorized = fixture(); unauthorized.state.adminUser.email = 'customer@example.invalid';
  assert.equal((await unauthorized.call()).code, 403); assert.equal(unauthorized.state.paymentReads, 0);
  const anonymous = fixture(); anonymous.state.adminUser.is_anonymous = true; assert.equal((await anonymous.call()).code, 403);
});
await check('admin list contains only pending routed orders and never constructs a provider', async () => {
  const f = fixture(), res = await f.call({ method: 'GET', body: undefined });
  assert.equal(res.code, 200); assert.equal(res.body.orders.length, 1); assert.equal(res.body.orders[0].reference, f.reference);
  assert.equal(f.state.providerReads, 0); assert.ok(!JSON.stringify(res.body).includes(f.owner));
  f.tables.ks_setup_order_queue[0].fulfillment_status = 'setup_complete';
  assert.deepEqual((await f.call({ method: 'GET', body: undefined })).body.orders, []);
});
await check('HTTP review is private, throttled and never authorizes account creation', async () => {
  const f = fixture(), res = await f.call(); assert.equal(res.code, 200); assert.equal(res.body.state, 'verified_for_review');
  assert.equal(res.headers['Cache-Control'], 'private, no-store'); assert.equal(res.headers.Vary, 'Authorization');
  assert.equal((await f.call()).code, 429); assert.equal(f.state.providerReads, 1);
  const broken = fixture(); broken.state.failTable = 'profiles'; const error = await broken.call();
  assert.equal(error.code, 503); assert.equal(error.body.mayDispatch, false); assert.ok(!JSON.stringify(error.body).includes('private failure'));
});
await check('shared function routes review separately and read-only production opt-in cannot construct a writer', async () => {
  let routed = false;
  const router = createPreviewPaidOrdersRouter({ newServiceReviewHandler: () => { routed = true; } });
  router({ query: { view: 'paid-new-service-review' } }, { setHeader() {} }); assert.equal(routed, true);
  const env = { VERCEL_ENV: 'production', ROOMBA_API_URL: 'https://cdn.rooomba.tv/WDXTMHmN/', ROOMBA_API_KEY: 'fictional-key', FIXIE_URL: 'https://fixture:fixture@fixture.usefixie.com:443' };
  assert.throws(() => createPaidReadAdapter({ env }));
  const reader = createPaidReadAdapter({ env, allowProductionReview: true }); assert.equal(reader.create, undefined); assert.equal(reader.renew, undefined);
  assert.throws(() => createPaidReadAdapter({ env: { ...env, ROOMBA_API_URL: 'http://untrusted.invalid' }, allowProductionReview: true }));
});
await check('production catalog transport makes only fixed HTTPS GETs and strips raw provider secrets', async () => {
  const calls = [], env = { VERCEL_ENV: 'production', ROOMBA_API_URL: 'https://cdn.rooomba.tv/WDXTMHmN/',
    ROOMBA_API_KEY: 'fictional-key', FIXIE_URL: 'https://fixture:fixture@fixture.usefixie.com:443' };
  const adapter = createPaidReadAdapter({ env, allowProductionReview: true,
    dispatcherFactory: () => ({ dispatch() {}, async close() {} }), fetchImpl: async (url, init) => {
      assert.equal(url.origin, 'https://cdn.rooomba.tv'); assert.equal(url.pathname, '/WDXTMHmN/');
      assert.equal(init.method, 'GET'); assert.equal(init.redirect, 'manual'); assert.equal(init.body, undefined);
      const action = url.searchParams.get('action'); calls.push(action);
      const data = action === 'user_info' ? { id: '400', username: 'fixture_reseller', credits: '100', api_key: 'RAW_PRIVATE_KEY' }
        : [{ id: '100', package_name: '1 Months + 1 Connections', max_connections: '1', is_official: '1', is_trial: '0',
          official_duration: '1', official_duration_in: 'months', official_credits: '1', bouquets: '[1,2]' }];
      return Response.json({ status: 'STATUS_SUCCESS', data });
    } });
  const snapshot = await adapter.snapshot(); assert.deepEqual(calls.sort(), ['packages', 'user_info']);
  assert.equal(snapshot.account.id, '400'); assert.equal(snapshot.packages[0].paid.count, 1);
  assert.ok(!JSON.stringify(snapshot).includes('RAW_PRIVATE_KEY'));
});
console.log(`${passed} new-service verification scenarios passed with actual SDK requests intercepted. No real payment, provider write, email or customer change occurred.`);
