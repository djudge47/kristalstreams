export const paidSimulationCases = [
  ['success', 'Successful new-customer setup', 'ready'],
  ['duplicate', 'Repeated payment notification', 'ready'],
  ['concurrent', 'Simultaneous setup requests', 'ready'],
  ['timeout', 'Provider timeout after creation', 'reconciliation_required'],
  ['crm_retry', 'CRM failure followed by a local retry', 'ready'],
  ['handoff_retry', 'Login handoff failure followed by a local retry', 'ready'],
  ['invalid_payment', 'Incorrect payment amount', 'payment_rejected'],
  ['existing_line', 'Customer already has a streaming line', 'existing_line_requires_review'],
];
export function parsePaidSimulationReport(raw, expected) {
  const fail = () => { throw new Error('The simulation report could not be verified.'); };
  if (!raw || raw.simulationOnly !== true || raw.liveExecutionEnabled !== false || raw.realProviderWrites !== 0
    || raw.realCreditsSpent !== 0 || raw.databaseWrites !== false || raw.realMessagesSent !== 0 || raw.existingTrialUnchanged !== true
    || raw.source !== 'saved_test_order_plan_template' || raw.liveGate !== 'durable_storage_secure_login_handoff_and_separate_spending_approval_required'
    || typeof raw.catalogCheckedAt !== 'string' || !Number.isFinite(Date.parse(raw.catalogCheckedAt))) return fail();
  const plan = raw.plan;
  if (!plan || plan.tier !== expected.tier || plan.connections !== expected.connections || plan.amountCents !== expected.amountCents
    || plan.interval !== expected.interval || !['bronze', 'silver', 'gold', 'platinum'].includes(plan.tier)
    || !Number.isInteger(plan.connections) || plan.connections < 1 || plan.connections > 5
    || !Number.isSafeInteger(plan.amountCents) || plan.amountCents <= 0
    || plan.providerMonths !== ({ bronze: 1, silver: 3, gold: 6, platinum: 12 })[plan.tier]
    || !Number.isFinite(plan.expectedProviderCredits) || plan.expectedProviderCredits <= 0 || plan.expectedProviderCredits > 1000000
    || !Number.isInteger(plan.bouquetCount) || plan.bouquetCount < 1 || plan.bouquetCount > 2000
    || !Array.isArray(raw.checks) || raw.checks.length !== paidSimulationCases.length) return fail();
  const checks = paidSimulationCases.map(([id, label, state]) => {
    const matches = raw.checks.filter(row => row?.id === id);
    if (matches.length !== 1) return fail();
    const row = matches[0], creates = ['invalid_payment', 'existing_line'].includes(id) ? 0 : 1;
    if (row.passed !== true || row.state !== state || row.simulatedCreates !== creates
      || row.simulatedCredits !== (creates ? plan.expectedProviderCredits : 0)
      || row.simulatedCrmRecords !== (state === 'ready' ? 1 : 0) || row.simulatedHandoffs !== (state === 'ready' ? 1 : 0)) return fail();
    return { id, label, state, passed: true, simulatedCreates: creates, simulatedCredits: row.simulatedCredits };
  });
  return { plan: { tier: plan.tier, connections: plan.connections, interval: plan.interval, amountCents: plan.amountCents,
    providerMonths: plan.providerMonths, expectedProviderCredits: plan.expectedProviderCredits, bouquetCount: plan.bouquetCount },
    checks, catalogCheckedAt: raw.catalogCheckedAt };
}
