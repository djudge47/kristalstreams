import assert from 'node:assert/strict';
import { createStreamingLoginHandler, createCustomerSetupRouter } from '../_server/ks-streaming-login.js';
import { createPaidFoundationHandler } from '../_server/ks-paid-foundation.js';
import { sealStreamingLogin } from '../_server/ks-login-envelope.js';
import { parseLoginAvailability, parseStreamingLogin } from '../_shared/ks-streaming-login-response.js';
const id = '00000000-0000-4000-8000-000000000001', other = '00000000-0000-4000-8000-000000000002', attempt = '00000000-0000-4000-8000-000000000003';
const reference = 'cs_test_LoginFixture', key = Buffer.alloc(32, 7).toString('base64');
const env = { VERCEL_ENV: 'preview', VITE_SUPABASE_URL: 'https://synthetic.supabase.co', VITE_SUPABASE_ANON_KEY: 'fake-anon', SUPABASE_SERVICE_ROLE_KEY: 'fake-service', KS_LOGIN_ENCRYPTION_KEY: key };
const login = { username: 'ks_fixture_user', password: 'synthetic_password_only_1234567890' };
const user = { id, email: 'djudge47@gmail.com', email_confirmed_at: '2026-01-01', is_anonymous: false };
const envelope = sealStreamingLogin(login, { environment: 'preview', ownerId: id, sessionId: reference, attemptId: attempt }, env);
const row = { attempt_id: attempt, checkout_session_id: reference, user_id: id, created_at: '2026-10-17T12:00:00Z',
  attempt: { attempt_id: attempt, checkout_session_id: reference, user_id: id, state: 'credentials_ready', login_envelope: envelope, provider_expires_at: '2026-11-17T12:00:00Z' }, receipt: { user_id: id, livemode: false } };
const request = { method: 'POST', headers: { authorization: 'Bearer synthetic-token' }, body: { sessionId: reference, userId: other }, query: {} };
const response = () => ({ headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
let reads = 0, authCalls = 0, foundationReads = 0, count = 0;
const make = (patch = {}) => createStreamingLoginHandler({ env: patch.env || env, reveal: patch.reveal === undefined ? true : patch.reveal, now: () => Date.parse('2026-10-18T00:00:00Z'),
  createClient: (_url, apiKey) => apiKey === 'fake-anon' ? { auth: { getUser: async () => { authCalls++; return { data: { user: patch.user === undefined ? user : patch.user }, error: null }; } } } : {
    from: table => {
      reads++; assert.equal(table, 'ks_preview_streaming_logins'); const filters = [];
      const query = { select(columns) { assert.ok(columns.includes('!inner')); return this; }, eq(k, v) { filters.push([k, v]); return this; },
        gt(k, v) { assert.equal(k, 'attempt.provider_expires_at'); assert.equal(v, '2026-10-18T00:00:00.000Z'); return this; },
        order(k, options) { assert.equal(k, 'created_at'); assert.equal(options.ascending, false); return this; },
        async limit(n) {
          for (const owner of ['user_id', 'attempt.user_id', 'receipt.user_id']) assert.ok(filters.some(([k, v]) => k === owner && v === id));
          assert.ok(filters.some(([k, v]) => k === 'receipt.livemode' && v === false));
          assert.ok(filters.some(([k, v]) => k === 'attempt.state' && v === 'credentials_ready'));
          if (n === 1) assert.ok(filters.some(([k, v]) => k === 'checkout_session_id' && v === reference));
          else assert.equal(n, 5);
          return { data: patch.rows || [row], error: patch.storageFail ? {} : null };
        } }; return query;
    },
  } });
const check = async (name, test) => { await test(); count++; console.log(`PASS: ${name}`); };
await check('production, prefetch GET, missing authorization and invalid references stop before storage', async () => {
  for (const [handler, req, code] of [[make({ env: { ...env, VERCEL_ENV: 'production' } }), request, 404], [make(), { ...request, method: 'GET' }, 405], [make(), { ...request, headers: {} }, 401], [make(), { ...request, body: { sessionId: ['bad'] } }, 400]]) {
    const res = response(); await handler(req, res); assert.equal(res.code, code);
  } assert.equal(reads, 0); assert.equal(authCalls, 0);
});
await check('unconfirmed, anonymous and missing sessions cannot retrieve a login', async () => {
  for (const who of [{ ...user, email_confirmed_at: null }, { ...user, is_anonymous: true }, null]) {
    const res = response(); await make({ user: who })(request, res); assert.equal(res.code, who ? 403 : 401);
  } assert.equal(reads, 0);
});
await check('owner-only explicit reveal ignores a caller-selected account and returns only the bound login', async () => {
  const res = response(); await make()(request, res); assert.equal(res.code, 200); assert.deepEqual(res.body.login, login);
  assert.equal(res.body.accountId, id); assert.equal(res.headers['Cache-Control'], 'private, no-store'); assert.equal(res.headers.Pragma, 'no-cache');
  assert.equal(res.headers.Vary, 'Authorization'); assert.ok(!JSON.stringify(res.body).includes(key)); assert.equal(res.body.login_envelope, undefined);
});
await check('availability never returns plaintext login or encryption envelope', async () => {
  const res = response(); await make({ reveal: false })({ ...request, method: 'GET' }, res); assert.equal(res.code, 200);
  const text = JSON.stringify(res.body); for (const value of [login.username, login.password, envelope.ciphertext, key]) assert.ok(!text.includes(value));
  assert.equal(parseLoginAvailability(res.body, id).length, 1);
});
await check('wrong owner, receipt environment, attempt, state, order or expiry fails independent result checks', async () => {
  for (const changed of [{ ...row, user_id: other }, { ...row, receipt: { user_id: other, livemode: false } }, { ...row, receipt: { user_id: id, livemode: true } },
    { ...row, attempt: { ...row.attempt, user_id: other } }, { ...row, attempt: { ...row.attempt, state: 'dispatching' } },
    { ...row, checkout_session_id: 'cs_test_Other' }, { ...row, attempt_id: other }, { ...row, attempt: { ...row.attempt, provider_expires_at: '2020-01-01' } }]) {
    const res = response(); await make({ rows: [changed] })(request, res); assert.equal(res.code, 503); assert.equal(res.body.login, undefined);
  }
});
await check('missing records, key failures, ciphertext tampering and database failures never disclose a login', async () => {
  const empty = response(); await make({ rows: [] })(request, empty); assert.equal(empty.code, 404);
  for (const patch of [{ env: { ...env, KS_LOGIN_ENCRYPTION_KEY: undefined } }, { storageFail: true },
    { rows: [{ ...row, attempt: { ...row.attempt, login_envelope: { ...envelope, tag: Buffer.alloc(16).toString('base64') } } }] }]) {
    const res = response(); await make(patch)(request, res); assert.equal(res.code, 503); assert.equal(res.body.login, undefined);
    for (const value of [key, login.password, envelope.ciphertext]) assert.ok(!JSON.stringify(res.body).includes(value));
  }
});
await check('shared customer route preserves status, separates availability from explicit reveal and rejects arbitrary views', async () => {
  let status = 0, available = 0, reveals = 0;
  const router = createCustomerSetupRouter({ statusHandler: () => { status++; }, availabilityHandler: () => { available++; }, revealHandler: () => { reveals++; } });
  await router({ query: {} }, response()); await router({ query: { view: 'login-availability' } }, response()); await router({ query: { view: 'streaming-login' } }, response());
  for (const view of ['create_line', ['streaming-login'], null]) { const res = response(); await router({ query: { view } }, res); assert.equal(res.code, 400); }
  assert.deepEqual([status, available, reveals], [1, 1, 1]);
});
await check('browser response helpers bind identity/order, whitelist fields and reject cross-account or malformed responses', () => {
  const raw = { accountId: id, previewOnly: true, reference, expiresAt: row.attempt.provider_expires_at, login: { ...login, api_key: 'discard' }, api_key: 'discard' };
  assert.deepEqual(parseStreamingLogin(raw, id, reference), login);
  for (const patch of [{ accountId: other }, { reference: 'cs_test_Other' }, { previewOnly: false }, { login: { ...login, password: 'short' } }]) assert.throws(() => parseStreamingLogin({ ...raw, ...patch }, id, reference));
  assert.throws(() => parseLoginAvailability({ accountId: id, previewOnly: true, logins: [{ reference, expiresAt: raw.expiresAt }, { reference, expiresAt: raw.expiresAt }] }, id));
});
await check('foundation status is administrator-only, read-only and exposes key configuration rather than key values', async () => {
  const client = (_url, apiKey) => apiKey === 'fake-anon' ? { auth: { getUser: async () => ({ data: { user }, error: null }) } } : {
    rpc: async name => { foundationReads++; if (name === 'ks_preview_paid_execution_status') return { data: { version: 1, atomicCompletion: true, resellerDispatchLock: true, browserAccessRevoked: true }, error: null }; assert.equal(name, 'ks_preview_provisioning_foundation_status'); return { data: { version: 1, durableAttempts: true, encryptedLoginTable: true, browserAccessRevoked: true }, error: null }; },
  };
  for (const configured of [true, false]) {
    const res = response(); await createPaidFoundationHandler({ createClient: client, env: { ...env, KS_LOGIN_ENCRYPTION_KEY: configured ? key : undefined } })({ ...request, method: 'GET' }, res);
    assert.equal(res.code, 200); assert.equal(res.body.foundation.encryptionConfigured, configured); assert.equal(res.body.foundation.providerExecutionEnabled, false); assert.equal(res.body.foundation.guardedWorkerChecks.length, 9); assert.ok(res.body.foundation.guardedWorkerChecks.every(row => row.passed)); assert.equal(res.body.foundation.realProviderWrites, 0);
    assert.ok(!JSON.stringify(res.body).includes(key));
  }
  const before = foundationReads;
  const res = response(); await createPaidFoundationHandler({ createClient: client, env })(request, res); assert.equal(res.code, 405); assert.equal(foundationReads, before);
  const denied = response(); await createPaidFoundationHandler({ env, createClient: () => ({ auth: { getUser: async () => ({ data: { user: { ...user, email: 'other@example.invalid' } }, error: null }) } }) })({ ...request, method: 'GET' }, denied);
  assert.equal(denied.code, 403); assert.equal(foundationReads, before);
});
console.log(`${count} streaming-login/foundation API checks passed. No real login, key, provider call or account mutation was used.`);
