import assert from 'node:assert/strict';
import { buildPackageSummary } from '../_shared/ks-roomba-package-summary.js';

const checkedAt = '2026-10-17T13:00:00.000Z';
const pkg = { id: '17', name: 'Synthetic monthly package', maxConnections: 2, paid: { count: 1, unit: 'months', credits: 1.5 }, trial: null, bouquets: [13, 14], issues: [] };
const summary = buildPackageSummary([{ ...pkg, password: 'never-export-password', api_key: 'never-export-key', username: 'never-export-login', notes: 'never-export-notes', paid: { ...pkg.paid, secret: 'never-export-nested' } }], checkedAt);
assert.deepEqual(summary.packages, [pkg]);
assert.ok(!JSON.stringify(summary).includes('never-export'));
assert.equal(summary.checkedAt, checkedAt);
assert.equal(summary.readOnly, true);
console.log('PASS: only whitelisted package fields are exported, including nested durations');

const incomplete = { ...pkg, id: '18', maxConnections: null, bouquets: null, paid: null, issues: ['Included channel groups could not be verified.'] };
assert.deepEqual(buildPackageSummary([incomplete], checkedAt).packages, [incomplete]);
assert.equal(buildPackageSummary([pkg, incomplete], checkedAt).packages.length, 2);
console.log('PASS: incomplete packages retain their unknown values for review');

for (const list of [[], [pkg, pkg], Array(129).fill(pkg), [{ ...pkg, id: '../bad' }], [{ ...pkg, bouquets: [0] }], [{ ...pkg, paid: { count: 1, unit: 'weeks', credits: 1 } }], [{ ...pkg, maxConnections: 2.5 }]]) assert.throws(() => buildPackageSummary(list, checkedAt));
assert.throws(() => buildPackageSummary([pkg], 'invalid'));
console.log('PASS: malformed, duplicate and oversized package lists are rejected');

const originalFetch = globalThis.fetch;
let calls = 0;
globalThis.fetch = () => { calls++; throw new Error('unexpected network request'); };
try {
  const copy = buildPackageSummary([pkg], checkedAt);
  copy.packages[0].bouquets.push(99);
  assert.deepEqual(pkg.bouquets, [13, 14]);
  assert.equal(calls, 0);
} finally { globalThis.fetch = originalFetch; }
console.log('PASS: summary creation neither mutates the catalog nor contacts a provider');
console.log('4 package-summary checks passed. No provider calls, account changes or payments.');
