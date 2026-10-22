import { buildPackageSummary } from '../_shared/ks-roomba-package-summary.js';
import { compareChannelGroups } from './ks-roomba-renewal-review.js';
import { creditUnits } from './ks-paid-approval.js';

const standardName = /^(1|3|6|12)\s+months?\s*\+\s*([1-5])\s+connections?$/i;
const id = value => ['string', 'number'].includes(typeof value) && /^[1-9]\d{0,14}$/.test(String(value));
const timestamp = value => typeof value === 'string'
  && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
const packageValid = pkg => {
  const name = pkg && standardName.exec(pkg.name);
  return Boolean(name && !pkg.issues.length && pkg.trial === null && pkg.paid?.unit === 'months'
    && pkg.paid.count === Number(name[1]) && pkg.maxConnections === Number(name[2]) && pkg.paid.credits > 0);
};
export function requestedPackageMatches(pkg, requested) {
  const name = standardName.exec(pkg.name);
  return Boolean(name && Number(name[1]) === requested.months && Number(name[2]) === requested.connections);
}

// Catalog feasibility only. This deliberately does not construct a renewal
// plan, approval token, form or future expiration, and cannot authorize a write.
export function buildRequestedRenewalReview({ customer, line, account, packages, checkedAt }, requested, now = Date.now()) {
  if (!requested || ![1, 3, 6, 12].includes(requested.months)
    || !Number.isInteger(requested.connections) || requested.connections < 1 || requested.connections > 5) throw Error('invalid_requested_order');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customer?.id || '')
    || !id(customer.external_id) || !id(line?.id) || String(customer.external_id) !== String(line.id)
    || !/^[A-Za-z0-9_.-]{3,64}$/.test(line.username || '') || customer.username !== line.username
    || !id(account?.id) || String(account.id) !== String(line.resellerId) || !id(line.packageId)
    || !timestamp(line.expiresAt) || Date.parse(line.expiresAt) % 1000 !== 0
    || !timestamp(checkedAt) || Date.parse(checkedAt) > now) throw Error('unverified_requested_order');
  const catalog = buildPackageSummary(packages, checkedAt).packages;
  const current = catalog.find(pkg => pkg.id === String(line.packageId));
  const candidates = catalog.filter(pkg => requestedPackageMatches(pkg, requested));
  const target = candidates.length === 1 && packageValid(candidates[0]) ? candidates[0] : null;
  const currentValid = packageValid(current) && current.maxConnections === line.connections;
  const selected = compareChannelGroups(line.bouquetIds, current?.bouquets);
  const proposed = compareChannelGroups(line.bouquetIds, target?.bouquets);
  const blockers = [];
  if (now - Date.parse(checkedAt) >= 30000) blockers.push('This review has expired. Load a new requested-order review.');
  if (line.trial !== false || line.enabled !== true || line.adminEnabled !== true || Date.parse(line.expiresAt) <= now) {
    blockers.push('This review requires an enabled, unexpired paid line.');
  }
  if (!currentValid) blockers.push('The current package and connection allowance need manual review.');
  if (!target) blockers.push('A unique, complete standard package for this order could not be verified. No alternative was selected.');
  if (selected.status === 'unverified' || selected.lineOnly.length) blockers.push('The current channel selection could not be verified against the current package.');
  if (proposed.status === 'unverified' || proposed.lineOnly.length) blockers.push('The requested package could not be verified to support every selected channel group.');
  if (!timestamp(customer.expiration_at) || Date.parse(customer.expiration_at) !== Date.parse(line.expiresAt)) {
    blockers.push('The saved CRM expiration and XUI expiration must match.');
  }
  let creditsAvailable = null, cost = null;
  try { creditUnits(account.credits); creditsAvailable = Number(account.credits); } catch { /* Keep an unreadable balance unverified. */ }
  try { if (target && creditUnits(target.paid.credits) > 0n) cost = target.paid.credits; } catch { /* No rounded or inferred quote. */ }
  if (cost === null) blockers.push('The requested package credit cost could not be verified.');
  if (creditsAvailable === null) blockers.push('The reseller credit balance could not be verified.');
  else if (cost !== null && creditUnits(creditsAvailable) < creditUnits(cost)) blockers.push('The reseller credit balance is below the requested package cost.');
  const validSelection = selected.status !== 'unverified' && !selected.lineOnly.length
    && proposed.status !== 'unverified' && !proposed.lineOnly.length;
  return {
    kind: 'requested-renewal-review', mode: 'read-only', executionEnabled: false, sent: false,
    providerChangeVerified: false, status: blockers.length ? 'needs_review' : 'catalog_compatible',
    checkedAt: new Date(checkedAt).toISOString(), validUntil: new Date(Date.parse(checkedAt) + 30000).toISOString(),
    currentMonths: currentValid ? current.paid.count : null, currentConnections: line.connections,
    requestedMonths: requested.months, requestedConnections: requested.connections,
    packageId: target?.id ?? null, packageName: target ? `${requested.months} months · ${requested.connections} connections` : null,
    credits: cost, creditsAvailable, currentGroupIds: validSelection ? [...line.bouquetIds].sort((a, b) => a - b) : [],
    packageGroupCount: proposed.packageCount, blockers,
  };
}
