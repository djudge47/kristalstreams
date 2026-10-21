import assert from 'node:assert/strict';
import { httpFixture } from './fixtures/ks-crm-renewal/http.mjs';
import { verifyRenewalTestReview } from '../_server/ks-crm-renewal-test-review.js';

let checks = 0;
const test = async (name, run) => { await run(); checks++; console.log(`PASS: ${name}`); };
globalThis.fetch = () => { throw Error('External network forbidden'); };

await test('real shared GET issues a short signed actor-bound review without writing', async () => {
  const f = httpFixture(); const review = await f.review(); assert.equal(review.available, true);
  assert.equal(f.calls.rpc.length, 0); assert.deepEqual(f.calls.reads, ['user_info','get_line','packages']);
  const p = verifyRenewalTestReview(review.token, { actorId: f.state.user.id, secret: f.env.ROOMBA_PREVIEW_SECRET, now: f.state.now });
  assert.equal(p.customerId, f.state.customer.id); assert.equal(p.operationId, review.operationId);
  assert.equal(Date.parse(p.expiresAt), Date.parse(p.checkedAt) + 30000);
  assert.ok(Buffer.byteLength(JSON.stringify({ reviewToken: review.token, preserveCurrentSelectionConfirmed: true })) < 1024);
});
await test('explicit confirmed save refreshes evidence and calls only the reserve RPC with the exact four groups', async () => {
  const f = httpFixture(); const review = await f.review(); const r = await f.save(review);
  assert.equal(r.code, 200); assert.equal(r.body.mode, 'test-approval-only'); assert.equal(r.body.simulation, true);
  assert.equal(r.body.executionEnabled, false); assert.equal(r.body.providerSent, false); assert.equal(r.body.replayed, false);
  assert.equal(r.body.operationId, review.operationId); assert.equal(f.calls.rpc.length, 1);
  const a = f.calls.rpc[0]; assert.equal(a.p_approver, f.state.user.id); assert.equal(a.p_plan.kind, 'simulation_only');
  assert.equal(a.p_plan.executionEnabled, false); assert.deepEqual(a.p_plan.bouquetIds, [2,13,18,40]);
  assert.deepEqual(f.calls.reads, ['user_info','get_line','packages','user_info','get_line','packages']);
  assert.equal(f.state.customer.expiration_at, f.state.line.expiresAt); assert.equal(f.state.account.credits, 100);
});
await test('duplicate and expired saved attempts return the same IDs without provider reads or another RPC', async () => {
  const f = httpFixture(); const review = await f.review(); await f.save(review); f.state.now += 60000;
  const before = f.calls.reads.length; const r = await f.save(review);
  assert.equal(r.code, 200); assert.equal(r.body.replayed, true); assert.equal(r.body.operationId, review.operationId);
  assert.equal(f.calls.reads.length, before); assert.equal(f.calls.rpc.length, 1);
});
await test('a lost RPC response is resolved by reading the immutable saved attempt, without retry', async () => {
  const f = httpFixture({ lostReply: true }); const review = await f.review();
  const r = await f.save(review); assert.equal(r.code, 200); assert.equal(r.body.replayed, true); assert.equal(f.calls.rpc.length, 1);
});
await test('production, wrong project and write methods outside this view stop before dependencies', async () => {
  for (const env of [{ VERCEL_ENV: 'production' }, { VITE_SUPABASE_URL: 'https://wrong.supabase.co' }]) {
    const f = httpFixture({ env }); const r = await f.save({ token: 'invalid' }); assert.ok([404,503].includes(r.code)); assert.equal(f.calls.auth, 0);
  }
  const f = httpFixture(); const r = await f.request({ view: 'renewal-test-approval' }); assert.equal(r.code, 405); assert.equal(f.calls.auth, 0);
});
await test('cross-origin, missing Bearer, non-admin, unconfirmed and anonymous requests cannot save', async () => {
  for (const patch of [{ email: 'other@example.invalid' }, { is_anonymous: true }, { email_confirmed_at: null }]) {
    const f = httpFixture(); const review = await f.review(); f.state.user = { ...f.state.user, ...patch };
    assert.equal((await f.save(review)).code, 403); assert.equal(f.calls.rpc.length, 0);
  }
  for (const headers of [{ origin: 'https://attacker.invalid' }, { origin: undefined }, { authorization: '' }]) {
    const f = httpFixture(); const review = await f.review(); assert.ok([401,403].includes((await f.save(review, { headers })).code)); assert.equal(f.calls.rpc.length, 0);
  }
});
await test('missing consent, extra customer fields, wrong media type and malformed tokens fail closed', async () => {
  const f = httpFixture(); const review = await f.review();
  for (const body of [{ reviewToken: review.token, preserveCurrentSelectionConfirmed: false },
    { reviewToken: review.token, preserveCurrentSelectionConfirmed: true, customerId: f.state.customer.id },
    { reviewToken: 'bad', preserveCurrentSelectionConfirmed: true }]) assert.ok([400,409].includes((await f.save(review, { body })).code));
  assert.equal((await f.save(review, { headers: { 'content-type': 'text/plain' } })).code, 400); assert.equal(f.calls.rpc.length, 0);
});
await test('signature tampering, purpose separation, rotated secret and actor substitution cannot authorize a save', async () => {
  const f = httpFixture(); const review = await f.review();
  const [encoded, signature] = review.token.split('.');
  const p = JSON.parse(Buffer.from(encoded, 'base64url').toString()); p.purpose = 'live-renewal';
  assert.equal((await f.save({ ...review, token: Buffer.from(JSON.stringify(p)).toString('base64url') + '.' + signature })).code, 409);
  assert.throws(() => verifyRenewalTestReview(review.token, { actorId: f.state.user.id, secret: 'different-secret-at-least-thirty-two-bytes', now: f.state.now }));
  f.state.user = { ...f.state.user, id: '00000000-0000-4000-8000-000000000091' };
  assert.equal((await f.save(review)).code, 409); assert.equal(f.calls.rpc.length, 0);
});
await test('expired or slowly refreshed evidence never reaches reserve', async () => {
  for (const slow of [false,true]) {
    const f = httpFixture(); const review = await f.review();
    if (slow) f.state.readDelay = 11000; else f.state.now += 30000;
    assert.equal((await f.save(review)).code, 409); assert.equal(f.calls.rpc.length, 0);
  }
});
await test('each changed identity, selection, catalog, cost, balance, expiry or allowance blocks the reviewed plan', async () => {
  for (const mutate of [s => s.line.bouquetIds = [2,13], s => s.account.credits = 99,
    s => s.packages[0].paid.credits = 13, s => s.packages[0].bouquets.pop(), s => s.line.username = 'different_customer',
    s => s.line.resellerId = '99', s => s.line.connections = 2, s => s.line.trial = true,
    s => s.customer.expiration_at = new Date(s.now + 86400000).toISOString()]) {
    const f = httpFixture(); const review = await f.review(); mutate(f.state);
    assert.notEqual((await f.save(review)).code, 200); assert.equal(f.calls.rpc.length, 0);
  }
});
await test('CRM expiry mismatch, stale provider evidence or weak signing secret makes the review unavailable', async () => {
  const f = httpFixture(); f.state.customer.expiration_at = null;
  assert.equal((await f.review()).available, false);
  const weak = httpFixture({ env: { ROOMBA_PREVIEW_SECRET: 'short' } }); assert.equal((await weak.review()).available, false);
  const slow = httpFixture({ readDelay: 11000 }); assert.equal((await slow.review()).available, false);
});
await test('enabled or missing control and failed lookups never write or fall back to a different project', async () => {
  for (const setting of [{ control: true }, { control: null }, { lookupFails: true }]) {
    const f = httpFixture(); const review = await f.review(); Object.assign(f.state, setting);
    assert.equal((await f.save(review)).code, 503); assert.equal(f.calls.rpc.length, 0);
  }
});
await test('storage uncertainty is explicit and never treated as a saved approval', async () => {
  const f = httpFixture({ rpcFails: true }); const review = await f.review(); const r = await f.save(review);
  assert.equal(r.code, 503); assert.equal(r.body.statusUnknown, true); assert.equal(f.calls.rpc.length, 1); assert.equal(f.state.approvals.size, 0);
});
await test('save read failures identify the exact stage and fixed reason without leaking provider data or reserving', async () => {
  const warnings = []; const originalWarn = console.warn; console.warn = (...args) => warnings.push(args);
  try {
    for (const [action, step, code, body, reason] of [
      ['user_info','account',502,{ reason: 'PROXY_HTTP_407', error: 'sensitive-proxy-url' },'proxy_refused'],
      ['get_line','line',502,{ upstreamStatus: 403, error: 'sensitive-api-key' },'provider_refused'],
      ['packages','packages',502,{ reason: 'KS_RESPONSE_TIMEOUT', error: 'sensitive-password' },'timeout'],
      ['packages','packages',502,{ status: 'unexpected_response', error: 'sensitive-token' },'invalid_response'],
    ]) {
      const f = httpFixture(); const review = await f.review();
      f.state.providerReply = current => current === action ? { code, body } : null;
      const r = await f.save(review);
      assert.equal(r.code, 409); assert.deepEqual(r.body.diagnostic, { step, reason });
      assert.match(r.body.error, /No test approval was saved/); assert.equal(r.body.statusUnknown, undefined);
      assert.equal(f.calls.rpc.length, 0); assert.equal(f.state.approvals.size, 0);
    }
    assert.ok(!JSON.stringify(warnings).includes('sensitive-'));
    assert.ok(warnings.every(([event, data]) => event === 'ks_crm_xui_read_failed'
      && Object.keys(data).sort().join(',') === 'reason,step,view' && data.view === 'test-approval'));
  } finally { console.warn = originalWarn; }
});
await test('customer and plan verification failures remain fixed categories and never write', async () => {
  const originalWarn = console.warn; console.warn = () => {};
  try {
    for (const [step, reason, mutate] of [
      ['saved_customer','verification_failed', state => state.customer.external_id = 'invalid'],
      ['plan','identity_changed', state => state.line.resellerId = '99'],
      ['plan','credits_unavailable', state => state.account.credits = 0],
    ]) {
      const f = httpFixture(); const review = await f.review(); mutate(f.state);
      const r = await f.save(review); assert.equal(r.code, 409);
      assert.deepEqual(r.body.diagnostic, { step, reason });
      assert.equal(f.calls.rpc.length, 0);
    }
  } finally { console.warn = originalWarn; }
});
console.log(`${checks} test approval HTTP checks passed. Synthetic dependencies only; no connected records or provider writes.`);
