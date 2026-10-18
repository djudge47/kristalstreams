import assert from 'node:assert/strict';
import { reserveDurablePaidSetup } from '../_server/ks-durable-paid-setup.js';
import { buildPaidPlanMapping } from '../_server/ks-roomba-plan-mapping.js';
import { simulationSession, simulationOwner } from '../_server/ks-new-paid-simulation.js';
import { openStreamingLogin } from '../_server/ks-login-envelope.js';
const packages = [1, 3, 6, 12].flatMap((months, i) => Array.from({ length: 5 }, (_, j) => ({ id: String(1000 + 5 * i + j), name: `${months} Months + ${j + 1} Connections`, maxConnections: j + 1,
  paid: { count: months, unit: 'months', credits: (i + 1) * (j + 1) }, trial: null, bouquets: [13, 14], issues: [] })));
const entry = buildPaidPlanMapping({ schemaVersion: 1, readOnly: true, checkedAt: '2026-10-18T00:00:00Z', packages }).entries[0];
const env = { KS_LOGIN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64') };
const make = (fault = '') => {
  let stored = null, writes = 0, reads = 0;
  const admin = { from(table) { assert.equal(table, 'ks_preview_provisioning_attempts'); const filters = [];
    return { select(columns) { assert.ok(columns.includes('login_envelope')); return this; }, eq(k, v) { filters.push([k, v]); return this; }, async maybeSingle() {
      reads++; assert.deepEqual(filters, [['checkout_session_id', 'cs_test_SimulatedNewCustomer'], ['user_id', simulationOwner]]);
      return { data: stored, error: fault === 'read_failure' ? {} : null }; } };
  }, async rpc(name, args) {
    assert.equal(name, 'ks_reserve_preview_provisioning');
    if (fault === 'reservation_failure') return { data: null, error: {} };
    if (stored) return { data: null, error: { message: 'concurrent reservation conflict' } };
    writes++; stored = { attempt_id: args.p_attempt_id, checkout_session_id: args.p_session_id, user_id: args.p_user_id,
      binding_hash: args.p_binding_hash, state: 'reserved', login_envelope: args.p_envelope };
    return fault === 'lost_reply' ? { data: null, error: {} } : { data: { fresh: true, state: 'reserved', attemptId: args.p_attempt_id }, error: null };
  } };
  return { input: { admin, env, environment: 'preview', newCustomerConfirmed: true, session: simulationSession('bronze', 1), ownerId: simulationOwner, entry, currentPackage: packages[0], resellerId: '99999' },
    snapshot: () => ({ stored, writes, reads }) };
};
let checks = 0; const check = async (name, fn) => { await fn(); checks++; console.log(`PASS: ${name}`); };
await check('explicit Preview/new-customer review and exact verified purchaser are required before storage', async () => {
  for (const patch of [{ environment: 'production' }, { newCustomerConfirmed: false }, { ownerId: undefined }, { ownerId: '00000000-0000-4000-8000-000000000099' }]) {
    const f = make(); await assert.rejects(() => reserveDurablePaidSetup({ ...f.input, ...patch })); assert.equal(f.snapshot().reads, 0); assert.equal(f.snapshot().writes, 0);
  }
});
await check('only encrypted generated credentials reach the reservation RPC, bound to the persisted owner/order/attempt', async () => {
  const f = make(); const result = await reserveDurablePaidSetup(f.input); assert.equal(result.replayed, false);
  const { stored, writes } = f.snapshot(); assert.equal(writes, 1); assert.equal(stored.password, undefined);
  const login = openStreamingLogin(stored.login_envelope, { environment: 'preview', ownerId: simulationOwner, sessionId: stored.checkout_session_id, attemptId: stored.attempt_id }, env);
  assert.ok(!JSON.stringify(stored).includes(login.username)); assert.ok(!JSON.stringify(stored).includes(login.password));
  assert.equal(result.claimToken, undefined); assert.equal(result.login_envelope, undefined);
});
await check('a new adapter call after restart reads the same reserved attempt without generating a new record', async () => {
  const f = make(); const first = await reserveDurablePaidSetup(f.input), again = await reserveDurablePaidSetup(f.input);
  assert.equal(first.attemptId, again.attemptId); assert.equal(again.replayed, true); assert.equal(f.snapshot().writes, 1);
});
await check('concurrent reservations and a lost reply recover the stored binding without another write', async () => {
  for (const fault of ['', 'lost_reply']) {
    const f = make(fault); const values = await Promise.all([reserveDurablePaidSetup(f.input), reserveDurablePaidSetup(f.input)]);
    assert.equal(values[0].attemptId, values[1].attemptId); assert.equal(f.snapshot().writes, 1);
  }
});
await check('missing encryption key, storage failure or changed package cannot create an attempt', async () => {
  for (const patch of [{ env: {} }, { currentPackage: { ...packages[0], bouquets: [99] } }]) {
    const f = make(); await assert.rejects(() => reserveDurablePaidSetup({ ...f.input, ...patch })); assert.equal(f.snapshot().writes, 0);
  }
  for (const fault of ['read_failure', 'reservation_failure']) { const f = make(fault); await assert.rejects(() => reserveDurablePaidSetup(f.input)); assert.equal(f.snapshot().writes, 0); }
});
await check('changed reseller cannot reuse an existing payment reservation', async () => {
  const f = make(); await reserveDurablePaidSetup(f.input);
  await assert.rejects(() => reserveDurablePaidSetup({ ...f.input, resellerId: '88888' }), /attempt_binding_changed/);
  assert.equal(f.snapshot().writes, 1);
});
console.log(`${checks} durable reservation adapter checks passed. Database operations were intercepted; no real rows or provider calls were made.`);
