import assert from 'node:assert/strict';
import { buildPreservingRenewalPlan, buildPreservingRenewalForm } from '../_server/ks-crm-renewal-plan.js';
import { createSimulatedCrmRenewal } from '../_server/ks-crm-renewal-simulation.js';
import { normalizeProviderLine } from '../_server/ks-roomba-line-snapshot.js';

const clock = Date.parse('2026-10-21T17:00:00Z');
const operationId = '11111111-1111-4111-8111-111111111111';
const secondOperationId = '22222222-2222-4222-8222-222222222222';
const customer = { id: '33333333-3333-4333-8333-333333333333', external_id: 9999901, username: 'fictional-renewal', expiration_at: '2026-11-15T10:00:00.000Z' };
const pkg = { id: '19', name: '12 Months + 1 Connection', maxConnections: 1, trial: null,
  paid: { count: 12, unit: 'months', credits: 12 }, bouquets: Array.from({ length: 107 }, (_, i) => i + 1), issues: [] };
const selected = [2, 13, 18, 40];
const raw = { status: 'STATUS_SUCCESS', data: { id: '9999901', username: customer.username, password: 'sensitive-password', member_id: '99997',
  package_id: '19', exp_date: String(Date.parse(customer.expiration_at) / 1000), max_connections: '1', is_trial: '0', enabled: '1', admin_enabled: '1', bouquet: JSON.stringify(selected) } };
const base = { customer, line: normalizeProviderLine(raw), account: { id: '99997', credits: 100 }, packages: [pkg],
  checkedAt: new Date(clock).toISOString(), preserveCurrentSelectionConfirmed: true };
const makePlan = patch => buildPreservingRenewalPlan({ ...structuredClone(base), ...patch }, clock);
const plan = makePlan();
let checks = 0;
async function test(name, run) { await run(); checks++; console.log(`PASS: ${name}`); }

await test('explicitly reviewed subset keeps exactly four groups from a 107-group package', () => {
  assert.deepEqual(plan.bouquetIds, selected); assert.equal(plan.executionEnabled, false); assert.equal(plan.kind, 'simulation_only');
  const entries = [...buildPreservingRenewalForm(plan).entries()];
  assert.deepEqual(entries, [['trial', '0'], ['package', '19'], ['package_duration', '12 months'], ['max_connections', '1'], ...selected.map(id => ['bouquets_selected[]', String(id)])]);
  for (const key of ['username', 'password', 'exp_date', 'reseller_notes', 'member_id', 'package_cost', 'enabled']) assert.ok(!entries.some(([name]) => name === key));
  assert.ok(!JSON.stringify(plan).includes('sensitive-'));
});
await test('selection confirmation and a fresh snapshot are required even for a matching full selection', () => {
  for (const patch of [{ preserveCurrentSelectionConfirmed: false }, { checkedAt: new Date(clock - 30001).toISOString() }, { checkedAt: new Date(clock + 1).toISOString() }]) assert.throws(() => makePlan(patch));
  const full = makePlan({ line: { ...base.line, bouquetIds: [...pkg.bouquets] } }); assert.equal(full.bouquetIds.length, 107);
});
await test('identity, ownership, paid state, expiry and allowance must remain bound', () => {
  for (const patch of [{ id: '9999902' }, { username: 'someone-else' }, { resellerId: '99998' }, { trial: true },
    { enabled: false }, { adminEnabled: false }, { expiresAt: new Date(clock).toISOString() }, { connections: 2 }, { packageId: '88' }]) assert.throws(() => makePlan({ line: { ...base.line, ...patch } }));
  assert.throws(() => makePlan({ customer: { ...customer, external_id: 9 } }));
  assert.throws(() => makePlan({ customer: { ...customer, id: 'bad-id' } }));
});
await test('unknown, duplicated or package-external groups cannot be preserved as verified', () => {
  for (const bouquetIds of [[], null, [2, 2], [2, 5000], ['2']]) assert.throws(() => makePlan({ line: { ...base.line, bouquetIds } }));
  assert.deepEqual(makePlan({ line: { ...base.line, bouquetIds: [...selected].reverse() } }).bouquetIds, selected);
});
await test('package changes and incomplete/alternative catalogs are blocked, without fallback selection', () => {
  for (const patch of [{ id: '88' }, { name: pkg.name + ' (Without Adults)' }, { trial: { count: 36, unit: 'hours', credits: 0 } },
    { paid: { count: 365, unit: 'days', credits: 12 } }, { maxConnections: 2 }, { issues: ['Incomplete'] }]) assert.throws(() => makePlan({ packages: [{ ...pkg, ...patch }] }));
});
await test('credit costs use exact micro-units and unreadable/insufficient balances stop the plan', () => {
  const p = makePlan({ packages: [{ ...pkg, paid: { ...pkg.paid, credits: 0.1 } }], account: { ...base.account, credits: '0.3' } });
  assert.equal(p.costUnits, '100000'); assert.equal(p.balanceUnits, '300000');
  for (const credits of ['11.999999', '-1', null, '1000001', '100.0000001']) assert.throws(() => makePlan({ account: { id: '99997', credits } }));
});
await test('changed plan evidence cannot silently change the documented multipart form', () => {
  for (const patch of [{ packageId: '88' }, { bouquetIds: [...pkg.bouquets] }, { months: 1 }, { lineId: '9' }, { executionEnabled: true }]) assert.throws(() => buildPreservingRenewalForm({ ...plan, ...patch }));
});

function fixture(fault = '') {
  const records = new Map(), consumed = new Set(), resellerLocks = new Set(), committed = new Map();
  const calls = { renewals: 0, creditsSpent: 0, crmWrites: 0, reads: 0 };
  const state = { now: clock, balance: 100, raw: structuredClone(raw), customer: { ...customer, monthly_price: 50, payment_status: 'paid', renewal_at: '2026-12-01T00:00:00Z' }, failed: false, gate: null };
  const ledger = { kind: 'simulation',
    async reserve(id, proposed) {
      const existing = records.get(id);
      if (existing) return { fresh: false, fingerprint: existing.fingerprint, record: existing };
      const record = { fingerprint: proposed.fingerprint, state: 'reserved', result: null, resellerId: proposed.resellerId };
      records.set(id, record);
      if (fault === 'reserve_lost_reply' && !state.failed) { state.failed = true; throw Error('fictional lost reply'); }
      return { fresh: true, fingerprint: record.fingerprint, record };
    },
    async begin(record, proposed) {
      const version = `${proposed.resellerId}:${proposed.lineId}:${proposed.previousExpiresAt}`;
      if (record.state !== 'reserved' || consumed.has(version) || resellerLocks.has(proposed.resellerId)) return false;
      consumed.add(version); resellerLocks.add(proposed.resellerId); record.state = 'dispatching';
      if (fault === 'begin_lost_reply') throw Error('fictional lost begin reply');
      return true;
    },
    async verified(record, result) {
      if (fault === 'result_save_failure') throw Error('fictional result save failure');
      record.result = structuredClone(result); record.state = 'provider_verified';
    },
    async stop(record) { if (fault === 'stop_failure') throw Error('fictional stop failure'); record.state = 'reconciliation_required'; },
    async complete(record) {
      record.state = 'complete'; resellerLocks.delete(record.resellerId);
      if (fault === 'completion_lost_reply' && !state.failed) { state.failed = true; throw Error('fictional completion lost reply'); }
    },
  };
  const provider = { kind: 'simulation',
    async snapshot() {
      const line = normalizeProviderLine(state.raw);
      if (fault === 'identity_drift') line.username = 'different-user';
      if (fault === 'group_drift') line.bouquetIds = [2, 13];
      if (fault === 'package_drift') line.packageId = '88';
      return { line, account: { id: '99997', credits: fault === 'balance_drift' ? 99 : state.balance }, packages: [structuredClone(pkg)], checkedAt: new Date(state.now).toISOString() };
    },
    async renew(id, form) {
      assert.equal(id, '9999901'); assert.deepEqual([...form.entries()], [...buildPreservingRenewalForm(plan).entries()]);
      calls.renewals++; if (state.gate) await state.gate;
      state.balance -= fault === 'wrong_debit' ? 13 : 12; calls.creditsSpent += fault === 'wrong_debit' ? 13 : 12;
      state.raw.data.exp_date = String(Date.parse('2027-11-15T10:00:00Z') / 1000);
      if (fault === 'timeout_after_renew' || fault === 'stop_failure') throw Error('sensitive-provider-url');
      if (fault === 'groups_expanded') state.raw.data.bouquet = JSON.stringify(pkg.bouquets);
      if (fault === 'wrong_line') state.raw.data.id = '9999902';
      if (fault === 'wrong_username') state.raw.data.username = 'different-user';
      if (fault === 'wrong_reseller') state.raw.data.member_id = '99998';
      if (fault === 'wrong_allowance') state.raw.data.max_connections = '2';
      if (fault === 'no_extension') state.raw.data.exp_date = raw.data.exp_date;
      if (fault === 'too_short') state.raw.data.exp_date = String(Date.parse('2026-12-15T10:00:00Z') / 1000);
      if (fault === 'too_long') state.raw.data.exp_date = String(Date.parse('2028-11-15T10:00:00Z') / 1000);
      if (fault === 'malformed_result') return { status: 'STATUS_SUCCESS', data: null };
      return structuredClone(state.raw);
    },
    async read(id) {
      calls.reads++; assert.equal(id, '9999901'); const result = structuredClone(state.raw);
      if (fault === 'readback_mismatch') result.data.exp_date = String(Number(result.data.exp_date) + 86400);
      return result;
    },
    async account() { return { id: '99997', credits: state.balance }; },
  };
  const crm = { kind: 'simulation',
    async current() { return { ...state.customer }; },
    async commit(id, proposed, result) {
      if (committed.has(id)) { assert.equal(committed.get(id), proposed.fingerprint); return; }
      if (fault === 'crm_identity_drift') state.customer.username = 'different-user';
      if (state.customer.id !== proposed.customerId || String(state.customer.external_id) !== proposed.lineId
        || state.customer.username !== proposed.username || Date.parse(state.customer.expiration_at) !== Date.parse(proposed.previousExpiresAt)) throw Error('fictional CRM conflict');
      if (fault === 'crm_failure' && !state.failed) { state.failed = true; throw Error('fictional CRM failure'); }
      state.customer.expiration_at = result.expiresAt; committed.set(id, proposed.fingerprint); calls.crmWrites++;
      if (fault === 'crm_lost_reply' && !state.failed) { state.failed = true; throw Error('fictional CRM lost reply'); }
    },
  };
  const run = createSimulatedCrmRenewal({ ledger, provider, crm, now: () => state.now });
  return { state, calls, records, ledger, provider, crm, run: (patch = {}) => run({ operationId, plan: structuredClone(plan), preserveCurrentSelectionConfirmed: true, ...patch }) };
}
await test('simulation adapters are mandatory and confirmation cannot be omitted', async () => {
  const f = fixture();
  assert.throws(() => createSimulatedCrmRenewal({ ledger: f.ledger, provider: { ...f.provider, kind: 'live' }, crm: f.crm, now: () => clock }));
  await assert.rejects(() => f.run({ preserveCurrentSelectionConfirmed: false })); await assert.rejects(() => f.run({ operationId: 'bad' })); assert.equal(f.calls.renewals, 0);
});
await test('successful simulation preserves selection/login and updates only provider expiry in CRM', async () => {
  const f = fixture(); const before = { ...f.state.customer };
  assert.equal((await f.run()).state, 'complete'); assert.equal(f.calls.renewals, 1); assert.equal(f.calls.creditsSpent, 12); assert.equal(f.calls.crmWrites, 1);
  assert.deepEqual(JSON.parse(f.state.raw.data.bouquet), selected); assert.equal(f.state.raw.data.password, 'sensitive-password');
  assert.deepEqual({ ...f.state.customer, expiration_at: before.expiration_at }, before);
  assert.ok(!JSON.stringify(f.records.get(operationId).result).includes('sensitive-'));
});
await test('completed operation replay cannot renew or deduct credits twice', async () => {
  const f = fixture(); await f.run(); assert.equal((await f.run()).replayed, true); assert.equal(f.calls.renewals, 1); assert.equal(f.calls.crmWrites, 1);
});
await test('same-operation concurrency sends at most one simulated renewal', async () => {
  const f = fixture(); const results = await Promise.all([f.run(), f.run()]);
  assert.ok(results.some(r => r.state === 'complete')); assert.equal(f.calls.renewals, 1); assert.equal(f.calls.creditsSpent, 12);
});
await test('different concurrent operation IDs cannot renew the same line/version twice', async () => {
  let release; const f = fixture(); f.state.gate = new Promise(resolve => { release = resolve; });
  const first = f.run(); await new Promise(resolve => setImmediate(resolve));
  assert.equal((await f.run({ operationId: secondOperationId })).state, 'reconciliation_required');
  release(); await first; assert.equal(f.calls.renewals, 1);
  assert.equal((await f.run({ operationId: secondOperationId })).state, 'reconciliation_required');
});
await test('fresh provider drift stops before dispatch', async () => {
  for (const fault of ['identity_drift', 'group_drift', 'package_drift', 'balance_drift']) {
    const f = fixture(fault); assert.equal((await f.run()).state, 'reconciliation_required'); assert.equal(f.calls.renewals, 0); assert.equal(f.calls.crmWrites, 0);
  }
});
await test('lost reserve/begin acknowledgements cannot be retried into a renewal', async () => {
  const reserved = fixture('reserve_lost_reply'); await assert.rejects(() => reserved.run()); assert.equal((await reserved.run()).state, 'reconciliation_required'); assert.equal(reserved.calls.renewals, 0);
  const begun = fixture('begin_lost_reply'); assert.equal((await begun.run()).state, 'reconciliation_required'); assert.equal((await begun.run()).state, 'reconciliation_required'); assert.equal(begun.calls.renewals, 0);
});
await test('stale approval evidence and changed saved CRM expiry stop without renewal', async () => {
  const stale = fixture(); stale.state.now += 31000; assert.equal((await stale.run()).state, 'reconciliation_required'); assert.equal(stale.calls.renewals, 0);
  const changed = fixture(); changed.state.customer.expiration_at = '2026-11-16T10:00:00Z'; assert.equal((await changed.run()).state, 'reconciliation_required'); assert.equal(changed.calls.renewals, 0);
});
await test('timeouts after provider acceptance and failed stop saves never trigger a resend', async () => {
  for (const fault of ['timeout_after_renew', 'stop_failure']) {
    const f = fixture(fault); assert.equal((await f.run()).state, 'reconciliation_required'); assert.equal((await f.run()).state, 'reconciliation_required');
    assert.equal(f.calls.renewals, 1); assert.equal(f.calls.creditsSpent, 12); assert.equal(f.calls.crmWrites, 0);
  }
});
await test('expanded groups, wrong identity/allowance and bad renewal results stop CRM completion', async () => {
  for (const fault of ['groups_expanded', 'wrong_line', 'wrong_username', 'wrong_reseller', 'wrong_allowance', 'no_extension', 'too_short', 'too_long', 'malformed_result', 'readback_mismatch', 'wrong_debit', 'result_save_failure']) {
    const f = fixture(fault); assert.equal((await f.run()).state, 'reconciliation_required', fault); assert.equal(f.calls.crmWrites, 0, fault);
    await f.run(); assert.equal(f.calls.renewals, 1, fault);
  }
});
await test('CRM failures and lost replies resume local completion without another provider edit', async () => {
  for (const fault of ['crm_failure', 'crm_lost_reply', 'completion_lost_reply']) {
    const f = fixture(fault); assert.equal((await f.run()).state, 'crm_pending'); assert.equal((await f.run()).state, 'complete');
    assert.equal(f.calls.renewals, 1); assert.equal(f.calls.creditsSpent, 12); assert.equal(f.calls.crmWrites, 1);
  }
});
await test('changed CRM identity cannot be overwritten after a simulated provider renewal', async () => {
  const f = fixture('crm_identity_drift'); assert.equal((await f.run()).state, 'crm_pending'); assert.equal((await f.run()).state, 'crm_pending');
  assert.equal(f.calls.renewals, 1); assert.equal(f.calls.crmWrites, 0);
});
await test('operation identity cannot be reused with changed plan evidence', async () => {
  const f = fixture(); await f.run();
  const changed = makePlan({ account: { id: '99997', credits: 101 } });
  await assert.rejects(() => f.run({ plan: changed })); assert.equal(f.calls.renewals, 1);
});
await test('whole simulation executes with external network access forbidden', async () => {
  const previous = globalThis.fetch; globalThis.fetch = () => { throw Error('No external requests'); };
  try { assert.equal((await fixture().run()).state, 'complete'); } finally { globalThis.fetch = previous; }
});
console.log(`${checks} renewal planning/simulation checks passed. Fictional adapters only; no live line, credits, database or customer changes.`);
