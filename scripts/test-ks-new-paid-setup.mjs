import assert from 'node:assert/strict';
import { buildPaidPlanMapping } from '../_server/ks-roomba-plan-mapping.js';
import { buildPaidCreationForm, createSimulatedPaidWorkflow } from '../_server/ks-new-paid-workflow.js';
import { createPaidSimulation, runPaidSetupSafetyChecks } from '../_server/ks-new-paid-simulation.js';
import { parsePaidSimulationReport } from '../_shared/ks-paid-simulation-report.js';

const packages = [1, 3, 6, 12].flatMap((months, i) => Array.from({ length: 5 }, (_, j) => ({
  id: String(1000 + i * 5 + j), name: `${months} Months + ${j + 1} Connections`, maxConnections: j + 1,
  paid: { count: months, unit: 'months', credits: (i + 1) * (j + 1) + 0.5 }, trial: null, bouquets: [13, 14], issues: [],
})));
const checkedAt = '2026-10-18T00:00:00.000Z';
const mapping = buildPaidPlanMapping({ schemaVersion: 1, readOnly: true, checkedAt, packages });
const entry = mapping.entries[0], pkg = packages[0];
let count = 0;
const check = async (name, test) => { await test(); count++; console.log(`PASS: ${name}`); };
const secret = 'synthetic_only_password_0123456789';
const login = { username: 'ks_simulation_customer', password: secret };

await check('documented multipart creation retains exact months, allowance and repeated groups without privileged fields', () => {
  const entries = [...buildPaidCreationForm({ ...entry.provider, maxConnections: 1 }, login)];
  assert.deepEqual(entries.map(([key]) => key), ['trial', 'username', 'password', 'package', 'package_duration', 'max_connections', 'bouquets_selected[]', 'bouquets_selected[]']);
  assert.equal(entries.find(([key]) => key === 'trial')[1], '0');
  assert.equal(entries.find(([key]) => key === 'package_duration')[1], '1 months');
  assert.equal(entries.find(([key]) => key === 'package')[1], pkg.id);
  assert.ok(!entries.some(([key]) => ['member_id', 'package_cost', 'exp_date'].includes(key)));
});
await check('all twenty website plans simulate exact package costs and verified provider-reported calendar expiry', async () => {
  for (const mapped of mapping.entries) {
    const simulation = createPaidSimulation(mapped, packages.find(item => item.id === mapped.provider.id));
    assert.equal((await simulation.execute(simulation.input)).state, 'ready');
    assert.equal(simulation.calls.creates, 1); assert.equal(simulation.calls.credits, mapped.provider.credits);
    const saved = [...simulation.customers.values()][0];
    assert.equal(saved.line.expiresAt, new Date(Number(simulation.line.data.exp_date) * 1000).toISOString());
    assert.equal(saved.line.password, undefined); assert.equal(saved.line.bouquet, undefined);
    assert.equal(saved.line.connections, mapped.connections); assert.equal(saved.line.resellerId, '99999');
  }
});
await check('unpaid, incomplete, live, wrong-owner, amount, currency, metadata and missing intent fail before reservations', async () => {
  const changes = [{ payment_status: 'unpaid' }, { status: 'open' }, { mode: 'subscription' }, { livemode: true },
    { amount_total: 1 }, { amount_subtotal: 1 }, { currency: 'eur' }, { payment_intent: null },
    { metadata: { user_id: '00000000-0000-4000-8000-000000000099' } }];
  for (const patch of changes) {
    const simulation = createPaidSimulation(entry, pkg);
    await assert.rejects(() => simulation.execute({ ...simulation.input, session: { ...simulation.input.session, ...patch } }));
    assert.equal(simulation.attempts.size, 0); assert.equal(simulation.calls.creates, 0);
  }
});
await check('changed packages and plan mismatches cannot reserve an attempt', async () => {
  for (const patch of [{ currentPackage: { ...pkg, bouquets: [99] } }, { entry: { ...entry, connections: 5 } }]) {
    const simulation = createPaidSimulation(entry, pkg);
    await assert.rejects(() => simulation.execute({ ...simulation.input, ...patch }));
    assert.equal(simulation.attempts.size, 0); assert.equal(simulation.calls.creates, 0);
  }
});
await check('existing streaming access blocks new creation without changing or upgrading that line', async () => {
  const simulation = createPaidSimulation(entry, pkg);
  assert.equal((await simulation.execute({ ...simulation.input, existingLineId: '9991234' })).state, 'existing_line_requires_review');
  assert.equal(simulation.attempts.size, 0); assert.equal(simulation.calls.creates, 0);
});
await check('replay and simultaneous calls share one simulated reservation, creation, CRM record and login handoff', async () => {
  const simulation = createPaidSimulation(entry, pkg);
  await Promise.all(Array.from({ length: 25 }, () => simulation.execute(simulation.input)));
  assert.equal((await simulation.execute(simulation.input)).state, 'ready');
  assert.deepEqual(simulation.calls, { creates: 1, credits: entry.provider.credits, crm: 1, handoffs: 1, reads: 1 });
  assert.equal(simulation.attempts.size, 1);
});
await check('a changed payment intent cannot reuse the original attempt binding', async () => {
  const simulation = createPaidSimulation(entry, pkg);
  await simulation.execute(simulation.input);
  await assert.rejects(() => simulation.execute({ ...simulation.input, session: { ...simulation.input.session, payment_intent: 'pi_DifferentIntent' } }), /attempt_binding_changed/);
  assert.equal(simulation.calls.creates, 1);
});
await check('reservation failure and insufficient balance stop before a simulated paid request', async () => {
  const simulation = createPaidSimulation(entry, pkg, 'reservation_failure');
  await assert.rejects(() => simulation.execute(simulation.input)); assert.equal(simulation.calls.creates, 0);
  const noCredits = createPaidSimulation(entry, pkg, 'insufficient_credits');
  assert.equal((await noCredits.execute(noCredits.input)).state, 'blocked_before_creation'); assert.equal(noCredits.calls.creates, 0);
});
await check('timeout, mismatched line, malformed creation, unexpected debit and lost result persistence lock further creates', async () => {
  for (const fault of ['timeout_after_creation', 'line_mismatch', 'bad_create_response', 'unexpected_debit', 'receipt_write_failure']) {
    const simulation = createPaidSimulation(entry, pkg, fault);
    assert.equal((await simulation.execute(simulation.input)).state, 'reconciliation_required', fault);
    for (let retry = 0; retry < 3; retry++) assert.equal((await simulation.execute(simulation.input)).state, 'reconciliation_required');
    assert.equal(simulation.calls.creates, 1); assert.equal(simulation.calls.crm, 0); assert.equal(simulation.calls.handoffs, 0);
  }
});
await check('CRM and handoff retries reuse the verified result without another paid creation', async () => {
  for (const [fault, state] of [['crm_failure', 'crm_pending'], ['delivery_failure', 'delivery_pending']]) {
    const simulation = createPaidSimulation(entry, pkg, fault);
    assert.equal((await simulation.execute(simulation.input)).state, state);
    assert.equal((await simulation.execute(simulation.input)).state, 'ready');
    assert.equal(simulation.calls.creates, 1); assert.equal(simulation.calls.crm, 1); assert.equal(simulation.calls.handoffs, 1);
  }
});
await check('all visible cases run without network and the public report contains no credentials or raw provider results', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('network forbidden'); };
  try {
    const checks = await runPaidSetupSafetyChecks(entry, pkg); assert.equal(checks.length, 8);
    const text = JSON.stringify(checks); assert.ok(!text.includes(secret)); assert.ok(!text.includes(login.username));
    assert.ok(!text.includes('9999901')); assert.ok(checks.every(item => item.passed));
  } finally { globalThis.fetch = original; }
  assert.throws(() => createSimulatedPaidWorkflow({}), /simulation_adapters_required/);
});
const raw = { simulationOnly: true, liveExecutionEnabled: false, realProviderWrites: 0, realCreditsSpent: 0,
  databaseWrites: false, realMessagesSent: 0, existingTrialUnchanged: true, source: 'saved_test_order_plan_template',
  liveGate: 'durable_storage_secure_login_handoff_and_separate_spending_approval_required', catalogCheckedAt: checkedAt,
  plan: { tier: entry.tier, connections: entry.connections, amountCents: entry.customerPriceCents, interval: entry.interval,
    providerMonths: entry.provider.duration.count, expectedProviderCredits: entry.provider.credits, bouquetCount: 2 },
  checks: await runPaidSetupSafetyChecks(entry, pkg) };
const expected = { tier: entry.tier, connections: entry.connections, interval: entry.interval, amountCents: entry.customerPriceCents };
await check('browser report whitelist discards unexpected credentials and rejects changed plan, live flags and fake passed checks', () => {
  const parsed = parsePaidSimulationReport({ ...raw, password: secret }, expected); assert.equal(parsed.checks.length, 8);
  assert.ok(!JSON.stringify(parsed).includes(secret));
  for (const patch of [{ liveExecutionEnabled: true }, { realCreditsSpent: 1 }, { databaseWrites: true }, { realMessagesSent: 1 },
    { existingTrialUnchanged: false }, { plan: { ...raw.plan, amountCents: 1 } }, { checks: [] },
    { checks: raw.checks.map((row, i) => i === 0 ? { ...row, simulatedCreates: 2 } : row) }]) assert.throws(() => parsePaidSimulationReport({ ...raw, ...patch }, expected));
});
console.log(`${count} new-paid workflow checks passed. All provider/storage/handoff adapters were simulated in memory; no real charges, lines, records or messages.`);
