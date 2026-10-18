import assert from 'node:assert/strict';
import { createPaidActivationReviewHandler } from '../_server/ks-paid-activation-review.js';
import { createPreviewPaidOrdersRouter } from '../_server/ks-preview-paid-orders.js';
import { createGuardedWorkerFixture } from '../_server/ks-guarded-paid-fixtures.js';
import { parsePaidActivationReview, formatCreditUnits } from '../_shared/ks-paid-review-response.js';

const base = createGuardedWorkerFixture();
const order = { sessionId: base.session.id, userId: base.input.ownerId, testMode: true, tier: 'bronze', connections: 1, amountCents: 2000, currency: 'usd', receiptDurationDays: 30,
  websiteActivated: false, orderStatus: 'awaiting_activation', recordedAt: '2030-01-15T12:00:00Z', queuedAt: '2030-01-15T12:00:00Z', accountLabel: 'Synthetic customer' };
const administrator = { id: base.input.approverId, email: 'djudge47@gmail.com', email_confirmed_at: '2030-01-01', is_anonymous: false };
const customer = { id: base.input.ownerId, email: 'synthetic.customer@example.invalid', email_confirmed_at: '2030-01-01', is_anonymous: false };
const snapshot = { account: base.review.account, packages: [1, 3, 6, 12].flatMap((months, i) => Array.from({ length: 5 }, (_, j) => ({ id: String(1000 + i * 5 + j), name: `${months} Months + ${j + 1} Connections`, maxConnections: j + 1,
  paid: { count: months, unit: 'months', credits: (i + 1) * (j + 1) + 0.5 }, trial: null, bouquets: [13, 14], issues: [] }))), checkedAt: base.now };
const expected = { reference: order.sessionId, customerId: order.userId, tier: order.tier, connections: 1, interval: 'monthly', amountCents: 2000 };
function fixture(patch = {}) {
  const calls = { auth: 0, payments: 0, provider: 0, rpcs: [], tables: [] };
  const env = { ...base.env, VITE_SUPABASE_URL: 'https://synthetic.supabase.co', VITE_SUPABASE_ANON_KEY: 'fake-anon', SUPABASE_SERVICE_ROLE_KEY: 'fake-service', ...patch.env };
  const createClient = (_url, key) => key === 'fake-anon' ? { auth: { getUser: async () => { calls.auth++; return { data: { user: patch.user === undefined ? administrator : patch.user }, error: patch.authError ? {} : null }; } } } : {
    auth: { admin: { async getUserById(id) { assert.equal(id, order.userId); return { data: { user: patch.owner || customer }, error: null }; } } },
    async rpc(name, args) {
      calls.rpcs.push(name);
      if (name === 'ks_list_preview_paid_orders') return { data: patch.rows || [order], error: patch.listFailure ? {} : null };
      if (name === 'ks_assert_preview_new_customer') { assert.equal(args.p_user_id, order.userId); return patch.eligibilityError ? { data: null, error: patch.eligibilityError } : { data: true, error: null }; }
      if (name === 'ks_preview_provisioning_foundation_status') return { data: { version: 1, durableAttempts: true, encryptedLoginTable: true, browserAccessRevoked: !patch.badFoundation }, error: null };
      if (name === 'ks_preview_paid_execution_status') return { data: { version: 1, atomicCompletion: true, resellerDispatchLock: true, browserAccessRevoked: true }, error: null };
      throw new Error('A review must never call a mutation RPC.');
    },
    from(table) {
      calls.tables.push(table); const filters = [];
      return { select(columns) { assert.ok(!/password|login_envelope|claim_token/.test(columns)); return this; }, eq(k, v) { filters.push([k, v]); return this; },
        async limit(limit) { assert.equal(table, 'ks_roomba_trial_attempts'); assert.equal(limit, 1); assert.deepEqual(filters, [['admin_id', order.userId]]); return { data: patch.trialRows || [], error: null }; },
        async maybeSingle() {
          if (table === 'profiles') { assert.deepEqual(filters, [['id', order.userId]]); return { data: patch.profile || { id: customer.id, email: customer.email }, error: null }; }
          if (table === 'ks_preview_provisioning_attempts') { assert.deepEqual(filters, [['checkout_session_id', order.sessionId], ['user_id', order.userId]]); return { data: patch.attempt || null, error: null }; }
          if (table === 'ks_payment_receipts') { assert.deepEqual(filters, [['checkout_session_id', order.sessionId], ['user_id', order.userId]]); return { data: patch.receipt || { checkout_session_id: order.sessionId, payment_intent_id: base.session.payment_intent.id, user_id: order.userId, livemode: false, tier: 'bronze', connections: 1, duration_days: 30, amount_cents: 2000, currency: 'usd', activated: false, expires_at: null }, error: null }; }
          if (table === 'ks_preview_reseller_dispatches') { assert.deepEqual(filters, [['reseller_id', base.review.account.id]]); return { data: patch.lock || null, error: null }; }
          throw new Error('Unexpected review table.');
        },
      };
    },
  };
  const handler = createPaidActivationReviewHandler({ createClient, env, now: () => base.now,
    paymentsFactory: patch.defaultPayments ? undefined : () => ({ async retrieve(id) { calls.payments++; assert.equal(id, order.sessionId); if (patch.paymentFailure) throw new Error('MUST_NOT_LEAK'); return patch.session || base.session; } }),
    providerFactory: () => ({ async snapshot() { calls.provider++; if (patch.providerFailure) throw new Error('MUST_NOT_LEAK'); return patch.snapshot || structuredClone(snapshot); } }),
  });
  const request = async (change = {}) => {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await handler({ method: 'GET', headers: { authorization: 'Bearer synthetic-token' }, query: { sessionId: order.sessionId, userId: 'forged', action: 'create_line', enabled: 'true' }, ...change }, res);
    assert.equal(res.headers['Cache-Control'], 'private, no-store'); assert.equal(res.headers.Vary, 'Authorization'); assert.ok(!JSON.stringify(res.body).includes('MUST_NOT_LEAK'));
    return res;
  };
  return { calls, request, handler };
}
let count = 0; const check = async (name, fn) => { await fn(); count++; console.log(`PASS: ${name}`); };
await check('Preview, GET, token and reference gates reject writes before any authentication or data read', async () => {
  for (const [patch, change, code] of [[{ env: { VERCEL_ENV: 'production' } }, {}, 404], [{}, { method: 'POST', body: { confirmed: true } }, 405], [{}, { headers: {} }, 401], [{}, { query: { sessionId: ['bad'] } }, 400]]) {
    const f = fixture(patch); assert.equal((await f.request(change)).code, code); assert.deepEqual(f.calls, { auth: 0, payments: 0, provider: 0, rpcs: [], tables: [] });
  }
});
await check('current confirmed administrator is required; user metadata and request overrides grant no authority', async () => {
  for (const user of [null, { ...administrator, email: 'other@example.invalid', user_metadata: { role: 'admin' } }, { ...administrator, is_anonymous: true }, { ...administrator, email_confirmed_at: null }]) {
    const f = fixture({ user }); assert.ok((await f.request()).code >= 400); assert.equal(f.calls.rpcs.length, 0); assert.equal(f.calls.payments, 0); assert.equal(f.calls.provider, 0);
  }
});
await check('missing, malformed and mismatched saved payment cannot select a customer or reach provider reads', async () => {
  for (const rows of [[], [{ ...order, amountCents: 1 }], [{ ...order, sessionId: 'cs_test_Different' }]]) {
    const f = fixture({ rows }); assert.ok((await f.request()).code >= 400); assert.equal(f.calls.payments, 0); assert.equal(f.calls.provider, 0);
  }
  for (const session of [{ ...base.session, livemode: true }, { ...base.session, payment_status: 'unpaid' }, { ...base.session, amount_total: 1 },
    { ...base.session, metadata: { ...base.session.metadata, user_id: administrator.id } }, { ...base.session, payment_intent: { ...base.session.payment_intent, latest_charge: { ...base.session.payment_intent.latest_charge, disputed: true } } }]) {
    const f = fixture({ session }); assert.equal((await f.request()).code, 503); assert.equal(f.calls.provider, 0);
  }
});
await check('eligible review reports exact real cost and projected balance but grants no approval or activation capability', async () => {
  const f = fixture(); const res = await f.request(); assert.equal(res.code, 200); const r = res.body.review;
  assert.equal(r.status, 'review_only'); assert.equal(r.creditCostUnits, '1500000'); assert.equal(r.balanceUnits, '100500000'); assert.equal(r.projectedBalanceUnits, '99000000');
  assert.equal(r.databaseWrites, false); assert.equal(r.realProviderWrites, 0); assert.equal(r.canActivate, false); assert.equal(r.approvalTokenIssued, false); assert.equal(r.creditApprovalRecorded, false);
  assert.equal(r.approvalToken, undefined); assert.equal(r.login_envelope, undefined); assert.equal(r.customer.accountId, order.userId); assert.equal(r.adminAccountId, administrator.id);
  assert.deepEqual(parsePaidActivationReview(r, expected, administrator.id).blockers, []); assert.equal(f.calls.provider, 1);
});
await check('prior trial activity and active website access remain blocked while the price stays visible for review', async () => {
  const f = fixture({ trialRows: [{ admin_id: customer.id, state: 'succeeded' }], eligibilityError: { code: 'P0001', message: 'existing_website_access_requires_review' } });
  const res = await f.request(); assert.equal(res.code, 200); assert.equal(res.body.review.status, 'blocked'); assert.deepEqual(res.body.review.blockers, ['prior_trial_activity','existing_website_access']); assert.equal(res.body.review.creditCostUnits, '1500000');
});
await check('unconfirmed email, saved attempts, insufficient balance, missing encryption and reseller locks never become ready', async () => {
  const cases = [ [{ owner: { ...customer, email_confirmed_at: null } }, 'customer_email_unconfirmed'], [{ attempt: { attempt_id: base.input.attemptId, user_id: customer.id, checkout_session_id: order.sessionId, state: 'dispatching' } }, 'existing_setup_attempt'],
    [{ snapshot: { ...snapshot, account: { ...snapshot.account, credits: 0 } } }, 'insufficient_credits'], [{ env: { KS_LOGIN_ENCRYPTION_KEY: undefined } }, 'encryption_missing'],
    [{ lock: { attempt_id: base.input.attemptId, reseller_id: snapshot.account.id } }, 'reseller_dispatch_locked'], [{ eligibilityError: { code: 'P0001', message: 'existing_streaming_access_requires_review' } }, 'existing_streaming_access'] ];
  for (const [patch, reason] of cases) { const f = fixture(patch); const res = await f.request(); assert.equal(res.code, 200); assert.equal(res.body.review.status, 'blocked'); assert.ok(res.body.review.blockers.includes(reason)); parsePaidActivationReview(res.body.review, expected, administrator.id); }
});
await check('wrong customer/profile/trial/attempt/lock identities fail independent result checks', async () => {
  for (const patch of [{ owner: { ...customer, id: administrator.id } }, { profile: { id: customer.id, email: 'different@example.invalid' } },
    { trialRows: [{ admin_id: administrator.id, state: 'succeeded' }] }, { attempt: { attempt_id: base.input.attemptId, user_id: administrator.id, checkout_session_id: order.sessionId, state: 'reserved' } },
    { lock: { attempt_id: base.input.attemptId, reseller_id: '88888' } }, { receipt: { checkout_session_id: order.sessionId, payment_intent_id: 'pi_Changed' } }]) assert.equal((await fixture(patch).request()).code, 503);
});
await check('unknown eligibility failures, broken foundations, stale catalog and network errors fail closed with sanitized errors', async () => {
  for (const patch of [{ eligibilityError: { code: 'XX000', message: 'MUST_NOT_LEAK' } }, { badFoundation: true }, { snapshot: { ...snapshot, checkedAt: base.now - 30001 } },
    { paymentFailure: true }, { providerFailure: true }, { defaultPayments: true, env: { STRIPE_SECRET_KEY: 'sk_live_synthetic' } }]) assert.equal((await fixture(patch).request()).code, 503);
});
await check('simultaneous and immediate repeat reviews are throttled after revalidating the administrator', async () => {
  const f = fixture(); const values = await Promise.all(Array.from({ length: 5 }, () => f.request())); assert.equal(values.filter(x => x.code === 200).length, 1); assert.equal(values.filter(x => x.code === 429).length, 4); assert.equal(f.calls.payments, 1); assert.equal(f.calls.provider, 1); assert.equal(f.calls.auth, 5);
});
await check('shared route selects only the explicit review view and preserves POST and Preview gates', async () => {
  const f = fixture(); const router = createPreviewPaidOrdersRouter({ listHandler: () => {}, simulationHandler: () => {}, foundationHandler: () => {}, activationReviewHandler: f.handler });
  const res = { setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await router({ method: 'POST', headers: {}, query: { view: 'activation-review', sessionId: order.sessionId } }, res); assert.equal(res.code, 405); assert.equal(f.calls.auth, 0);
  for (const view of [['activation-review'], 'create_line', 'activate']) { await router({ query: { view } }, res); assert.equal(res.code, 400); }
});
await check('browser whitelist rejects changed accounts, money, credit arithmetic, freshness, blockers or writable flags', async () => {
  const r = (await fixture().request()).body.review; const parsed = parsePaidActivationReview({ ...r, password: 'MUST_NOT_LEAK' }, expected, administrator.id); assert.ok(!JSON.stringify(parsed).includes('MUST_NOT_LEAK'));
  for (const patch of [{ adminAccountId: customer.id }, { customer: { ...r.customer, accountId: administrator.id } }, { reference: 'cs_test_Other' }, { plan: { ...r.plan, amountCents: 1 } },
    { projectedBalanceUnits: '1' }, { status: 'ready' }, { canActivate: true }, { approvalTokenIssued: true }, { databaseWrites: true }, { realProviderWrites: 1 },
    { blockers: ['unknown'] }, { providerCheckedAt: '2000-01-01' }, { creditCostUnits: '0' }]) assert.throws(() => parsePaidActivationReview({ ...r, ...patch }, expected, administrator.id));
  assert.equal(formatCreditUnits('1000000'), '1'); assert.equal(formatCreditUnits('1500000'), '1.5'); assert.equal(formatCreditUnits('1'), '0.000001');
});
console.log(`${count} read-only paid activation review checks passed. All Auth, Stripe, provider and database responses were fictional; no real account or state was changed.`);
