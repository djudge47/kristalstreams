import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createGuardedWorkerFixture, runGuardedPaidWorkerChecks } from '../_server/ks-guarded-paid-fixtures.js';
import { issuePaidApproval, verifyPaidApproval, creditUnits } from '../_server/ks-paid-approval.js';
import { createPaidProviderAdapter } from '../_server/ks-paid-provider.js';
import { createPaidExecutionStore } from '../_server/ks-paid-execution-store.js';
import { createInternalPaidSetupWorker } from '../_server/ks-paid-worker.js';
import { verifySettledPaidIntent } from '../_server/ks-guarded-paid-executor.js';
import { readLineJson } from '../_server/ks-roomba-account-reader.js';
import { validatePaidSession } from '../_server/ks-payment-validation.js';
import { queuePreviewPaidOrder } from '../_server/ks-preview-paid-orders.js';
import { isPreviewPaidCustomer, isBillingExcluded, isUnpaidCustomer, isBillingOverdue, isDueWithin, displayedAccountStatus } from '../_shared/ks-crm-status.js';

let count = 0;
const check = async (name, fn) => { await fn(); count++; console.log(`PASS: ${name}`); };
for (const row of await runGuardedPaidWorkerChecks()) { assert.equal(row.passed, true); count++; console.log(`PASS: ${row.label}`); }
await check('credit arithmetic uses exact millionths and rejects excessive precision, negative, exponential and non-finite values', () => {
  assert.equal(creditUnits('100.5') - creditUnits('1.5'), creditUnits('99'));
  for (const value of [-1, NaN, Infinity, '1e3', '1.0000001', '1000001', null]) assert.throws(() => creditUnits(value));
});
await check('approval binds exact owner, administrator, session, intent, package, cost and account balance with a two-minute expiry', () => {
  const f = createGuardedWorkerFixture(), approval = issuePaidApproval(f.review, f.env, f.now);
  assert.equal(verifyPaidApproval(approval.token, f.review, f.env, f.now).costUnits, '1500000');
  for (const patch of [{ ownerId: f.input.approverId }, { approverId: f.input.ownerId }, { session: { ...f.session, payment_intent: { ...f.session.payment_intent, id: 'pi_Changed' } } },
    { account: { ...f.review.account, credits: '101.5' } }, { checkedAt: f.now - 30001 }]) assert.throws(() => verifyPaidApproval(approval.token, { ...f.review, ...patch }, f.env, f.now));
  assert.throws(() => verifyPaidApproval(approval.token, { ...f.review, checkedAt: f.now + 120000 }, f.env, f.now + 120000));
  assert.throws(() => verifyPaidApproval(approval.token + '.extra', f.review, f.env, f.now));
  assert.throws(() => verifyPaidApproval(approval.token, f.review, { ...f.env, ROOMBA_PREVIEW_SECRET: 'different_secret_012345678901234567890' }, f.now));
});
await check('payment intent and captured charge reject refunds, disputes, wrong amounts and unexpanded status', () => {
  const f = createGuardedWorkerFixture(), payment = validatePaidSession(f.session, false, f.input.ownerId);
  verifySettledPaidIntent(f.session, payment);
  for (const patch of [{ status: 'processing' }, { amount_received: 1999 }, { livemode: true }, { latest_charge: 'ch_NotExpanded' },
    { latest_charge: { ...f.session.payment_intent.latest_charge, disputed: true } }, { latest_charge: { ...f.session.payment_intent.latest_charge, captured: false } },
    { latest_charge: { ...f.session.payment_intent.latest_charge, refunded: true } }]) assert.throws(() => verifySettledPaidIntent({ ...f.session, payment_intent: { ...f.session.payment_intent, ...patch } }, payment));
});
await check('wrong owner and ciphertext cannot begin dispatch; lost result acknowledgement resumes locally', async () => {
  const bad = createGuardedWorkerFixture(); bad.row.user_id = bad.input.approverId; await assert.rejects(() => bad.execute(bad.input)); assert.equal(bad.calls.creates, 0);
  const tamper = createGuardedWorkerFixture(); tamper.row.login_envelope.tag = Buffer.alloc(16).toString('base64'); await assert.rejects(() => tamper.execute(tamper.input)); assert.equal(tamper.calls.begins, 0);
  const lost = createGuardedWorkerFixture('lost_verified_reply'); await lost.execute(lost.input); assert.equal((await lost.execute(lost.input)).state, 'credentials_ready'); assert.equal(lost.calls.creates, 1);
});
const fixtureEnv = { VERCEL_ENV: 'preview', ROOMBA_API_URL: 'https://cdn.rooomba.tv/WDXTMHmN/', ROOMBA_API_KEY: 'synthetic_key_not_real',
  ROOMBA_PREVIEW_SECRET: 'synthetic_secret_not_real_0123456789', FIXIE_URL: 'http://synthetic:synthetic-password@synthetic.usefixie.com:80' };
const rawLine = { id: '9999901', member_id: '99999', package_id: '1000', username: 'ks_fixture_paid_customer', password: 'synthetic_password_only_0123456789',
  max_connections: '1', exp_date: '1897387200', is_trial: '0', enabled: '1', admin_enabled: '1', bouquet: '[13,14]' };
await check('paid transport sends one documented multipart POST through the TLS proxy and strips provider passwords', async () => {
  let calls = 0, closes = 0;
  const f = createGuardedWorkerFixture();
  const adapter = createPaidProviderAdapter({ env: fixtureEnv, dispatcherFactory: value => { assert.match(value, /^https:/); return { dispatch() {}, async close() { closes++; } }; },
    fetchImpl: async (url, options) => {
      calls++; assert.equal(url.origin + url.pathname, fixtureEnv.ROOMBA_API_URL); assert.equal(url.searchParams.get('action'), 'create_line'); assert.equal(options.method, 'POST');
      assert.equal(options.redirect, 'manual'); assert.ok(options.dispatcher); assert.ok(options.signal);
      assert.deepEqual([...options.body.keys()], ['trial','username','password','package','package_duration','max_connections','bouquets_selected[]','bouquets_selected[]']);
      return new Response(JSON.stringify({ status: 'STATUS_SUCCESS', data: rawLine }), { headers: { 'Content-Type': 'application/json' } });
    } });
  const result = await adapter.create(f.review.entry.provider, f.login);
  assert.equal(calls, 1); assert.equal(closes, 1); assert.equal(result.id, rawLine.id); assert.ok(!JSON.stringify(result).includes(rawLine.password));
});
await check('redirects, transport errors, malformed bodies and invalid destinations never retry or fall back to HTTP', async () => {
  for (const fault of ['redirect', 'error', 'body']) {
    let calls = 0;
    const adapter = createPaidProviderAdapter({ env: fixtureEnv, dispatcherFactory: () => ({ dispatch() {}, async close() {} }), fetchImpl: async () => {
      calls++; if (fault === 'error') throw new Error('MUST_NOT_LEAK');
      return new Response(fault === 'body' ? '<html>not json</html>' : '', { status: fault === 'redirect' ? 302 : 200 });
    } });
    const f = createGuardedWorkerFixture(); await assert.rejects(() => adapter.create(f.review.entry.provider, f.login), /paid_provider_result_uncertain/); assert.equal(calls, 1);
  }
  for (const patch of [{ VERCEL_ENV: 'production' }, { ROOMBA_API_URL: 'http://cdn.rooomba.tv/WDXTMHmN/' }, { FIXIE_URL: '' }, { ROOMBA_API_KEY: 'bad\nkey' }]) assert.throws(() => createPaidProviderAdapter({ env: { ...fixtureEnv, ...patch } }));
});
await check('fresh provider reads use only fixed account/packages/line actions and independently normalize the returned line', async () => {
  const calls = [];
  const adapter = createPaidProviderAdapter({ env: fixtureEnv, dispatcherFactory: () => ({ dispatch() {}, async close() {} }), fetchImpl: async (url, options) => {
    const action = url.searchParams.get('action'); calls.push(action); assert.equal(options.method, 'GET'); assert.equal(options.redirect, 'manual');
    const data = action === 'get_line' ? rawLine : action === 'user_info' ? { id: '99999', username: 'synthetic_reseller', credits: '100.5', api_key: 'MUST_NOT_LEAK' } :
      [{ id: '1000', package_name: '1 Months + 1 Connections', max_connections: '1', is_official: '1', is_trial: '0', official_duration: '1', official_duration_in: 'months', official_credits: '1.5', bouquets: '[13,14]' }];
    return new Response(JSON.stringify({ status: 'STATUS_SUCCESS', data }), { headers: { 'Content-Type': 'text/html' } });
  } });
  const snapshot = await adapter.snapshot(); assert.equal(snapshot.packages.length, 1); assert.equal(snapshot.account.id, '99999');
  assert.ok(!JSON.stringify(snapshot).includes('MUST_NOT_LEAK')); await adapter.line(rawLine.id, rawLine.password); assert.deepEqual(calls.sort(), ['get_line','packages','user_info']);
  await assert.rejects(() => adapter.line('../other'));
});
await check('service adapter verifies the confirmed Auth owner/profile before eligibility and scopes internal attempt reads', async () => {
  const f = createGuardedWorkerFixture(); let rpcs = 0;
  const make = (bad = false) => createPaidExecutionStore({ auth: { admin: { getUserById: async id => ({ data: { user: { id, email: 'synthetic@example.invalid', email_confirmed_at: bad ? null : '2030-01-01', is_anonymous: false } } }) } },
    from: table => ({ select() { return this; }, eq(key, value) { if (key === 'user_id' || key === 'id') assert.equal(value, f.input.ownerId); return this; }, async maybeSingle() { return { data: table === 'profiles' ? { id: f.input.ownerId, email: 'synthetic@example.invalid' } : f.row, error: null }; } }),
    rpc: async (name, args) => { rpcs++; assert.equal(name, 'ks_assert_preview_new_customer'); assert.equal(args.p_user_id, f.input.ownerId); return { data: true }; } });
  await make().assertNewCustomer(f.input.ownerId); assert.equal(rpcs, 1); await assert.rejects(() => make(true).assertNewCustomer(f.input.ownerId)); assert.equal(rpcs, 1);
  assert.equal((await make().load(f.input.attemptId, f.input.ownerId)).attempt_id, f.input.attemptId);
});
await check('streamed password verification rejects missing, changed and oversized values without retaining credentials', async () => {
  for (const password of [undefined, 'wrong_password_01234567890123456789', 'x'.repeat(257)]) {
    await assert.rejects(() => readLineJson(new Response(JSON.stringify({ status: 'STATUS_SUCCESS', data: { ...rawLine, password } })), { expectedLinePassword: rawLine.password }), error => error.code === 'KS_LINE_LOGIN_MISMATCH');
  }
  const safe = await readLineJson(new Response(JSON.stringify({ status: 'STATUS_SUCCESS', data: rawLine })), { expectedLinePassword: rawLine.password });
  assert.equal(safe.data.password, undefined); assert.ok(!JSON.stringify(safe).includes(rawLine.password));
});
await check('internal SDK worker verifies the current administrator and rejects a missing or forged sign-in before storage or transport', async () => {
  const env = { ...fixtureEnv, STRIPE_SECRET_KEY: 'sk_test_synthetic' }; let authCalls = 0;
  const worker = createInternalPaidSetupWorker({ env, admin: { auth: { getUser: async () => { authCalls++; return { data: { user: { id: '00000000-0000-4000-8000-000000000099', email: 'other@example.invalid', email_confirmed_at: '2030-01-01', user_metadata: { role: 'admin' } } } }; } } } });
  await assert.rejects(() => worker({}), /administrator_sign_in_required/); assert.equal(authCalls, 0);
  await assert.rejects(() => worker({ accessToken: 'synthetic-token', confirmed: true }), /administrator_sign_in_required/); assert.equal(authCalls, 1);
});
await check('completed Preview queue replay preserves completion and rejects inconsistent status/activation pairs', async () => {
  const f = createGuardedWorkerFixture();
  const context = data => ({ environment: 'preview', live: false, admin: { rpc: async () => ({ data: { ok: true, test_mode: true, ...data }, error: null }) } });
  assert.deepEqual(await queuePreviewPaidOrder(f.session, context({ order_status: 'setup_complete', provider_activated: true }), f.input.ownerId), { order_status: 'setup_complete', provider_activated: true });
  for (const data of [{ order_status: 'setup_complete', provider_activated: false }, { order_status: 'awaiting_activation', provider_activated: true }]) await assert.rejects(() => queuePreviewPaidOrder(f.session, context(data), f.input.ownerId));
});
await check('Preview paid CRM rows are distinct from trials and excluded from billing attention and revenue', () => {
  const row = { source: 'roomba_preview_paid', trial: false, payment_status: 'preview_test', account_status: 'active', expiration_at: '2020-01-01', renewal_at: '2020-01-01' };
  assert.equal(isPreviewPaidCustomer(row), true); assert.equal(isBillingExcluded(row), true); assert.equal(isUnpaidCustomer(row), false); assert.equal(isBillingOverdue(row), false); assert.equal(isDueWithin(row, 7), false); assert.equal(displayedAccountStatus(row), 'expired');
});
await check('checkout, webhooks and API entrypoints do not import the real worker directly; Preview-only SDK gates remain intact', async () => {
  const files = (await readdir(new URL('../api/', import.meta.url))).filter(name => /\.(js|ts)$/.test(name)); assert.equal(files.length, 12);
  for (const name of files) { const source = await readFile(new URL(`../api/${name}`, import.meta.url), 'utf8'); assert.doesNotMatch(source, /ks-paid-worker|ks-guarded-paid-executor|ks-paid-provider|ks-paid-execution-store/); }
  for (const patch of [{ VERCEL_ENV: 'production' }, { STRIPE_SECRET_KEY: 'sk_live_synthetic' }]) assert.throws(() => createInternalPaidSetupWorker({ env: { VERCEL_ENV: 'preview', STRIPE_SECRET_KEY: 'sk_test_synthetic', ...patch } }));
});
console.log(`${count} guarded paid-execution checks passed. Provider/Stripe/storage responses were intercepted or fictional; no real charge, line, credit spend, email or customer mutation occurred.`);
