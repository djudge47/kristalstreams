import { getPlan } from './ks-payment-validation.js';
import { buildPaidCreationForm, createSimulatedPaidWorkflow } from './ks-new-paid-workflow.js';

// All identities and provider responses below are fictional. No network client is imported.
export const simulationOwner = '00000000-0000-4000-8000-000000000011';
const clock = Date.UTC(2030, 0, 15, 12);
const login = { username: 'ks_simulation_customer', password: 'synthetic_only_password_0123456789' };
export function simulationSession(tier, connections) {
  const plan = getPlan(tier, connections);
  return { id: 'cs_test_SimulatedNewCustomer', livemode: false, mode: 'payment', status: 'complete', payment_status: 'paid',
    currency: 'usd', amount_total: plan.cents, amount_subtotal: plan.cents, payment_intent: 'pi_SimulatedNewCustomer',
    metadata: { user_id: simulationOwner, plan: plan.tier, connections: String(plan.connections), interval: plan.interval,
      price: String(plan.cents / 100), duration_days: String(plan.days) } };
}

export function createPaidSimulation(entry, currentPackage, fault = '') {
  const attempts = new Map(), customers = new Map(), handoffs = new Set();
  const calls = { creates: 0, credits: 0, crm: 0, handoffs: 0, reads: 0 };
  let balance = 1000000, failed = false;
  const expiry = new Date(clock); expiry.setUTCMonth(expiry.getUTCMonth() + entry.provider.duration.count);
  const line = { status: 'STATUS_SUCCESS', data: { id: '9999901', username: login.username, password: login.password, member_id: '99999',
    package_id: entry.provider.id, exp_date: String(expiry.getTime() / 1000), max_connections: String(entry.connections),
    is_trial: '0', enabled: '1', admin_enabled: '1', bouquet: JSON.stringify(entry.provider.bouquetIds) } };
  const ledger = { kind: 'simulation',
    async reserve(key, digest) {
      if (fault === 'reservation_failure') throw new Error('synthetic reservation failure');
      let record = attempts.get(key); const fresh = !record;
      if (!record) { record = { digest, state: 'reserved', result: null }; attempts.set(key, record); }
      return { fresh, digest: record.digest, state: record.state, record };
    },
    async set(record, state) { record.state = state; },
    async verified(record, result) {
      if (fault === 'receipt_write_failure') throw new Error('synthetic persistence failure');
      record.result = result; record.state = 'provider_verified';
    },
  };
  const provider = { kind: 'simulation', resellerId: '99999',
    async balance() { return fault === 'insufficient_credits' ? 0 : balance; },
    async create(form) {
      calls.creates++;
      const expected = buildPaidCreationForm({ ...entry.provider, maxConnections: entry.connections }, login);
      if (JSON.stringify([...form.entries()]) !== JSON.stringify([...expected.entries()])) throw new Error('unexpected request fields');
      calls.credits += entry.provider.credits; balance -= entry.provider.credits;
      if (fault === 'unexpected_debit') balance--;
      if (fault === 'timeout_after_creation') throw new Error('synthetic timeout after creation');
      if (fault === 'bad_create_response') return { status: 'STATUS_SUCCESS', data: { ...line.data, is_trial: '1' } };
      return structuredClone(line);
    },
    async read(id) {
      calls.reads++;
      if (id !== line.data.id) throw new Error('wrong line selected');
      return fault === 'line_mismatch' ? { status: 'STATUS_SUCCESS', data: { ...line.data, max_connections: '32' } } : structuredClone(line);
    },
  };
  const crm = { kind: 'simulation', async commit(key, result) {
    if (fault === 'crm_failure' && !failed) { failed = true; throw new Error('synthetic CRM failure'); }
    const previous = customers.get(key);
    if (previous && previous.line.id !== result.line.id) throw new Error('identity conflict');
    if (!previous) { customers.set(key, result); calls.crm++; }
  } };
  const delivery = { kind: 'simulation', async deliver(key) {
    if (fault === 'delivery_failure' && !failed) { failed = true; throw new Error('synthetic handoff failure'); }
    if (!handoffs.has(key)) { handoffs.add(key); calls.handoffs++; }
  } };
  const execute = createSimulatedPaidWorkflow({ ledger, provider, crm, delivery, credentials: () => ({ ...login }), now: () => clock });
  return { calls, attempts, customers, line, execute,
    input: { session: simulationSession(entry.tier, entry.connections), ownerId: simulationOwner, entry, currentPackage } };
}

const scenarios = [
  ['success', 'Successful new-customer setup', '', 'ready'],
  ['duplicate', 'Repeated payment notification', '', 'ready'],
  ['concurrent', 'Simultaneous setup requests', '', 'ready'],
  ['timeout', 'Provider timeout after creation', 'timeout_after_creation', 'reconciliation_required'],
  ['crm_retry', 'CRM failure followed by a local retry', 'crm_failure', 'ready'],
  ['handoff_retry', 'Login handoff failure followed by a local retry', 'delivery_failure', 'ready'],
  ['invalid_payment', 'Incorrect payment amount', '', 'payment_rejected'],
  ['existing_line', 'Customer already has a streaming line', '', 'existing_line_requires_review'],
];
export async function runPaidSetupSafetyChecks(entry, currentPackage) {
  const results = [];
  for (const [id, label, fault, expectedState] of scenarios) {
    const simulation = createPaidSimulation(entry, currentPackage, fault);
    let result, firstState;
    if (id === 'invalid_payment') {
      try { await simulation.execute({ ...simulation.input, session: { ...simulation.input.session, amount_total: 1 } }); }
      catch { result = { state: 'payment_rejected' }; }
    } else if (id === 'existing_line') result = await simulation.execute({ ...simulation.input, existingLineId: '9999900' });
    else if (id === 'concurrent') {
      await Promise.all([simulation.execute(simulation.input), simulation.execute(simulation.input)]);
      result = await simulation.execute(simulation.input);
    } else {
      result = await simulation.execute(simulation.input); firstState = result.state;
      if (id !== 'success') result = await simulation.execute(simulation.input);
    }
    const expectedCreates = ['invalid_payment', 'existing_line'].includes(id) ? 0 : 1;
    const passed = result?.state === expectedState && simulation.calls.creates === expectedCreates
      && simulation.calls.credits === (expectedCreates ? entry.provider.credits : 0)
      && simulation.calls.crm === (expectedState === 'ready' ? 1 : 0)
      && simulation.calls.handoffs === (expectedState === 'ready' ? 1 : 0)
      && (id !== 'crm_retry' || firstState === 'crm_pending') && (id !== 'handoff_retry' || firstState === 'delivery_pending');
    results.push({ id, label, passed, state: result?.state || 'failed', simulatedCreates: simulation.calls.creates,
      simulatedCredits: simulation.calls.credits, simulatedCrmRecords: simulation.calls.crm, simulatedHandoffs: simulation.calls.handoffs });
  }
  if (results.some(result => !result.passed)) throw new Error('simulation_check_failed');
  return results;
}
