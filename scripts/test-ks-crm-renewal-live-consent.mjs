import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createLiveRenewalConsent } from '../_server/ks-crm-renewal-live-consent.js';
import { buildPreservingRenewalPlan, assertSimulationRenewalPlan } from '../_server/ks-crm-renewal-plan.js';
import { httpFixture } from './fixtures/ks-crm-renewal/http.mjs';

globalThis.fetch = () => { throw Error('External requests forbidden'); };
let checks = 0;
const test = async (name, run) => { await run(); checks++; console.log(`PASS: ${name}`); };
function fixture() {
  const f = httpFixture(); const key = Buffer.alloc(32, 29);
  const input = () => ({ actorId: f.state.user.id, customer: f.state.customer,
    context: { line: f.state.line, account: f.state.account, packages: f.state.packages, checkedAt: new Date(f.state.now).toISOString() },
    preserveCurrentSelectionConfirmed: true, creditSpendConfirmed: true });
  const consent = createLiveRenewalConsent({ key, now: () => f.state.now });
  return { ...f, key, input, consent };
}
await test('a dedicated key, controlled clock and both explicit confirmations are mandatory', () => {
  for (const key of [undefined,'preview-secret',Buffer.alloc(31),Buffer.alloc(33)]) assert.throws(() => createLiveRenewalConsent({ key, now: Date.now }));
  const f = fixture();
  for (const patch of [{ preserveCurrentSelectionConfirmed: false },{ creditSpendConfirmed: false },{ actorId: 'bad' }]) {
    assert.throws(() => f.consent.issue({ ...f.input(), ...patch }));
  }
});
await test('consent binds exactly one immutable attempt and can never claim permission to dispatch', () => {
  const f = fixture(), issued = f.consent.issue(f.input()), verified = f.consent.verify(issued.token, f.input());
  assert.equal(issued.mode, 'live-consent-only'); assert.equal(issued.mayDispatch, false); assert.equal(verified.mayDispatch, false);
  assert.equal(issued.operationId, verified.operationId); assert.equal(issued.consentId, verified.consentId);
  assert.equal(Date.parse(issued.expiresAt) - Date.parse(issued.issuedAt), 300000);
  assert.ok(Object.isFrozen(issued)); assert.ok(Object.isFrozen(verified));
  assert.notEqual(f.consent.issue(f.input()).operationId, issued.operationId);
  assert.throws(() => assertSimulationRenewalPlan(verified));
});
await test('rechecking unchanged evidence after operator review retains the exact consent and original deadline', () => {
  const f = fixture(), issued = f.consent.issue(f.input()); f.state.now += 90000;
  const verified = f.consent.verify(issued.token, f.input());
  assert.equal(verified.operationId, issued.operationId); assert.equal(verified.expiresAt, issued.expiresAt);
  assert.equal(f.calls.rpc.length, 0); assert.equal(f.calls.reads.length, 0);
});
await test('every customer, reseller, line, term, cost, balance, package, allowance and group change invalidates consent', () => {
  const mutations = [
    f => f.state.customer.id = '00000000-0000-4000-8000-000000000078',
    f => { f.state.customer.external_id++; f.state.line.id = String(f.state.customer.external_id); },
    f => { f.state.customer.username = f.state.line.username = 'changed_customer'; },
    f => { f.state.line.resellerId = f.state.account.id = '89'; },
    f => f.state.packages[0].paid.credits = 13,
    f => f.state.account.credits = 99,
    f => { f.state.packages[0].paid.count = 6; f.state.packages[0].name = '6 Months + 1 Connection'; },
    f => { f.state.packages[0].id = f.state.line.packageId = '20'; },
    f => { f.state.line.connections = f.state.packages[0].maxConnections = 2; f.state.packages[0].name = '12 Months + 2 Connections'; },
    f => f.state.line.bouquetIds = [2,13],
    f => f.state.packages[0].bouquets.pop(),
    f => { f.state.customer.expiration_at = f.state.line.expiresAt = new Date(Date.parse(f.state.line.expiresAt) + 1000).toISOString(); },
  ];
  for (const mutate of mutations) {
    const f = fixture(), issued = f.consent.issue(f.input()); mutate(f);
    assert.throws(() => f.consent.verify(issued.token, f.input()));
  }
});
await test('CRM/provider expiry mismatch, stale or future evidence and inactive/trial lines cannot obtain consent', () => {
  for (const mutate of [
    f => f.state.customer.expiration_at = null,
    f => f.state.line.trial = true,
    f => f.state.line.enabled = false,
    f => f.state.line.adminEnabled = false,
    f => f.state.account.credits = 0,
    f => f.state.line.bouquetIds.push(9999),
  ]) { const f = fixture(); mutate(f); assert.throws(() => f.consent.issue(f.input())); }
  const f = fixture();
  for (const delay of [-1,30001]) {
    const input = f.input(); input.context.checkedAt = new Date(f.state.now - delay).toISOString();
    assert.throws(() => f.consent.issue(input));
  }
});
await test('old evidence cannot verify valid consent and an expired intent cannot be revived with fresh evidence', () => {
  const f = fixture(), input = f.input(), issued = f.consent.issue(input); f.state.now += 30001;
  assert.throws(() => f.consent.verify(issued.token, input));
  assert.equal(f.consent.verify(issued.token, f.input()).mayDispatch, false);
  f.state.now = Date.parse(issued.expiresAt); assert.throws(() => f.consent.verify(issued.token, f.input()));
});
await test('actor substitution, wrong key, malformed tokens and any signature alteration are rejected', () => {
  const f = fixture(), issued = f.consent.issue(f.input());
  assert.throws(() => f.consent.verify(issued.token, { ...f.input(), actorId: '00000000-0000-4000-8000-000000000071' }));
  const wrong = createLiveRenewalConsent({ key: Buffer.alloc(32, 30), now: () => f.state.now });
  assert.throws(() => wrong.verify(issued.token, f.input()));
  for (const token of ['',null,'x'.repeat(1101),issued.token + '.extra',issued.token.slice(0,-1) + (issued.token.endsWith('a') ? 'b' : 'a')]) {
    assert.throws(() => f.consent.verify(token, f.input()));
  }
});
await test('correctly signed wrong purposes, extra fields and extended deadlines are rejected', () => {
  const f = fixture(), issued = f.consent.issue(f.input()), payload = JSON.parse(Buffer.from(issued.token.split('.')[0], 'base64url'));
  for (const patch of [{ purpose: 'ks-crm-renewal-test-review/v2' },{ kind: 'dispatch' },{ unexpected: true },
    { expiresAt: new Date(Date.parse(payload.expiresAt) + 1).toISOString() },{ issuedAt: new Date(f.state.now + 1).toISOString() }]) {
    const encoded = Buffer.from(JSON.stringify({ ...payload, ...patch })).toString('base64url');
    const signature = createHmac('sha256', f.key).update(`ks-crm-live-renewal-consent/v1\0${encoded}`).digest('hex');
    assert.throws(() => f.consent.verify(encoded + '.' + signature, f.input()));
  }
});
await test('test-review tokens and rehearsal plan fingerprints cannot become live consent', async () => {
  const f = fixture(), testReview = await f.review();
  assert.equal(testReview.available, true); assert.throws(() => f.consent.verify(testReview.token, f.input()));
  const issued = f.consent.issue(f.input());
  const plan = buildPreservingRenewalPlan({ ...f.input().context, customer: f.state.customer, preserveCurrentSelectionConfirmed: true }, f.state.now);
  assert.notEqual(issued.fingerprint, plan.fingerprint);
});
await test('the dedicated key is copied and consent output contains no provider identity, credentials or signing key', () => {
  const f = fixture(), issued = f.consent.issue(f.input()); f.key.fill(0);
  assert.equal(f.consent.verify(issued.token, f.input()).mayDispatch, false);
  const payload = Buffer.from(issued.token.split('.')[0], 'base64url').toString();
  for (const text of [f.state.line.username,'resellerId','bouquetIds','credits','password','api_key']) assert.ok(!payload.includes(text));
  assert.equal(f.calls.rpc.length, 0); assert.equal(f.state.approvals.size, 0); assert.equal(f.state.operations.size, 0);
});
console.log(`${checks} separate live consent checks passed. No route, provider request, database write or dispatch permission.`);
