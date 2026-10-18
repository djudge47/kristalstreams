import assert from 'node:assert/strict';
import { buildPaidPlanMapping, validateMappedPackage } from '../_server/ks-roomba-plan-mapping.js';
import { getPlan } from '../_server/ks-payment-validation.js';

const tiers = ['bronze', 'silver', 'gold', 'platinum'];
const months = [1, 3, 6, 12];
const packages = months.flatMap((month, i) => Array.from({ length: 5 }, (_, j) => ({
  id: String(1000 + i * 5 + j), name: `${month} Months + ${j + 1} Connections`, maxConnections: j + 1,
  paid: { count: month, unit: 'months', credits: (i + 1) * (j + 1) + 0.5 }, trial: null, bouquets: [13, 14], issues: [],
})));
const summary = { schemaVersion: 1, readOnly: true, checkedAt: '2026-10-17T13:40:00.000Z', packages };
const mapping = buildPaidPlanMapping(summary);
assert.equal(mapping.entries.length, 20);
for (let i = 0; i < 4; i++) for (let connections = 1; connections <= 5; connections++) {
  const row = mapping.entries.find(item => item.tier === tiers[i] && item.connections === connections);
  assert.equal(row.provider.id, packages[i * 5 + connections - 1].id);
  assert.equal(row.provider.duration.count, months[i]);
  assert.equal(row.provider.duration.unit, 'months');
  assert.equal(row.customerPriceCents, getPlan(tiers[i], connections).cents);
  assert.equal(row.provider.credits, packages[i * 5 + connections - 1].paid.credits);
}
console.log('PASS: all 20 matches preserve returned IDs, non-formula credit costs, calendar months and authoritative website prices');

const alternatives = packages.map(pkg => ({ ...pkg, id: String(Number(pkg.id) + 100), name: pkg.name + ' (Without Adults)' }));
assert.deepEqual(buildPaidPlanMapping({ ...summary, packages: [...alternatives, ...packages] }).entries, mapping.entries);
for (const name of ['1 Month + 1 Connection (Without Adults)', 'Migrated', '24 Months + 1 connection', 'VIP 1 Month + 1 Connection']) {
  assert.throws(() => buildPaidPlanMapping({ ...summary, packages: [{ ...packages[0], name }, ...packages.slice(1)] }));
}
assert.throws(() => buildPaidPlanMapping({ ...summary, packages: [...packages, { ...packages[0], id: '9999' }] }));
console.log('PASS: excluded and ambiguous package families cannot silently substitute for a standard plan');

for (const patch of [{ paid: { count: 30, unit: 'days', credits: 1 } }, { maxConnections: 5 }, { bouquets: null }, { issues: ['Missing details'] }, { paid: { count: 1, unit: 'months', credits: 0 } }, { trial: { count: 36, unit: 'hours', credits: 0 } }]) {
  assert.throws(() => buildPaidPlanMapping({ ...summary, packages: [{ ...packages[0], ...patch }, ...packages.slice(1)] }));
}
console.log('PASS: contradictory duration, allowance, trial flags, missing groups and incomplete package data block matching');

const first = mapping.entries[0];
assert.equal(validateMappedPackage(first, packages[0]).id, packages[0].id);
assert.equal(validateMappedPackage(first, { ...packages[0], bouquets: [14, 13] }).id, packages[0].id);
for (const patch of [{ id: '8888' }, { bouquets: [13, 99] }, { name: '1 Month + 1 Connection' }, { paid: { ...packages[0].paid, credits: 999 } }]) assert.throws(() => validateMappedPackage(first, { ...packages[0], ...patch }));
assert.throws(() => validateMappedPackage({ ...first, customerPriceCents: 1 }, packages[0]));
assert.throws(() => validateMappedPackage({ ...first, provider: { ...first.provider, id: '9999' } }, packages[0]));
console.log('PASS: later package or saved mapping changes require review; group order alone is harmless');

assert.equal(mapping.status, 'review_draft');
assert.equal(mapping.paidProvisioningEnabled, false);
assert.equal(buildPaidPlanMapping({ ...summary, paidProvisioningEnabled: true, status: 'active' }).paidProvisioningEnabled, false);
assert.equal(first.receiptDurationDays, 30);
assert.equal(first.provider.duration.count, 1);
assert.equal(first.provider.duration.unit, 'months');
console.log('PASS: review metadata cannot enable provisioning or convert provider months into fixed receipt days');

const originalFetch = globalThis.fetch;
globalThis.fetch = () => { throw new Error('No network request allowed'); };
try { assert.equal(buildPaidPlanMapping(summary).entries.length, 20); }
finally { globalThis.fetch = originalFetch; }
console.log('PASS: mapping review is offline and performs no provider or payment action');
console.log('6 mapping checks passed. Only synthetic packages were used.');
