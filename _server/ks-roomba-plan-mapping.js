// Read-only review helpers. No provider transport, database clients or activation calls.
import { createHash } from 'node:crypto';
import { getPlan } from './ks-payment-validation.js';
import { buildPackageSummary } from '../_shared/ks-roomba-package-summary.js';

const monthsByTier = { bronze: 1, silver: 3, gold: 6, platinum: 12 };
const standardName = /^(1|3|6|12)\s+months?\s*\+\s*([1-5])\s+connections?$/i;
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

function providerDetails(pkg) {
  return {
    id: pkg.id, name: pkg.name, duration: { count: pkg.paid.count, unit: pkg.paid.unit },
    credits: pkg.paid.credits, maxConnections: pkg.maxConnections,
    bouquetIds: [...new Set(pkg.bouquets)].sort((a, b) => a - b),
  };
}

export function buildPaidPlanMapping(summary) {
  if (summary?.schemaVersion !== 1 || summary.readOnly !== true) throw new Error('Use a package-summary export for this review.');
  const safe = buildPackageSummary(summary.packages, summary.checkedAt);
  const entries = [];
  for (const [tier, months] of Object.entries(monthsByTier)) {
    for (let connections = 1; connections <= 5; connections++) {
      const matches = safe.packages.filter(pkg => {
        const label = standardName.exec(pkg.name);
        return label && Number(label[1]) === months && Number(label[2]) === connections;
      });
      if (matches.length !== 1) throw new Error(`${tier}, ${connections} connection(s): exactly one standard package is required.`);
      const pkg = matches[0];
      if (pkg.issues.length || !pkg.paid || pkg.trial || pkg.paid.unit !== 'months'
        || pkg.paid.count !== months || pkg.maxConnections !== connections || pkg.paid.credits <= 0 || !pkg.bouquets?.length) {
        throw new Error(`${tier}, ${connections} connection(s): provider details need review.`);
      }
      const plan = getPlan(tier, connections);
      const provider = providerDetails(pkg);
      entries.push({
        tier: plan.tier, connections: plan.connections, interval: plan.interval,
        customerPriceCents: plan.cents, currency: 'usd', receiptDurationDays: plan.days,
        provider: { ...provider, fingerprint: hash(provider) },
      });
    }
  }
  return {
    schemaVersion: 1, status: 'review_draft', paidProvisioningEnabled: false,
    source: { kind: 'administrator_uploaded_package_summary', checkedAt: safe.checkedAt, catalogFingerprint: hash(safe) },
    policy: 'standard_packages',
    note: 'Review only. Re-read provider packages before any approved operation. Use provider calendar months, not receipt day counts. This file authorizes no provider action.',
    entries,
  };
}

export function validateMappedPackage(entry, currentPackage) {
  if (!entry || !Object.hasOwn(monthsByTier, entry.tier)) throw new Error('Unknown mapped plan.');
  const plan = getPlan(entry.tier, entry.connections);
  if (entry.customerPriceCents !== plan.cents || entry.currency !== 'usd' || entry.interval !== plan.interval
    || entry.receiptDurationDays !== plan.days) throw new Error('Mapped website plan changed.');
  const [pkg] = buildPackageSummary([currentPackage], new Date(0).toISOString()).packages;
  const label = standardName.exec(pkg.name);
  if (pkg.issues.length || !pkg.paid || pkg.trial || !pkg.bouquets?.length || !label
    || Number(label[1]) !== monthsByTier[plan.tier] || Number(label[2]) !== plan.connections
    || pkg.paid.count !== monthsByTier[plan.tier] || pkg.paid.unit !== 'months'
    || pkg.maxConnections !== plan.connections || pkg.paid.credits <= 0) throw new Error('Mapped provider package changed.');
  const provider = providerDetails(pkg);
  const { fingerprint, ...recorded } = entry.provider || {};
  if (fingerprint !== hash(provider) || fingerprint !== hash(recorded)) throw new Error('Mapped provider package changed.');
  return provider;
}
