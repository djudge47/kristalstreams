import { createHash } from 'node:crypto';
import { FormData } from 'undici';
import { buildPackageSummary } from '../_shared/ks-roomba-package-summary.js';
import { compareChannelGroups } from './ks-roomba-renewal-review.js';
import { creditUnits } from './ks-paid-approval.js';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const id = value => ['string', 'number'].includes(typeof value) && /^[1-9]\d{0,14}$/.test(String(value));
const same = (a, b) => String(a) === String(b);
const standardName = /^(1|3|6|12)\s+months?\s*\+\s*([1-5])\s+connections?$/i;

// This hash detects changed evidence; it is not an approval token or authority
// to spend. The plan is used only by the simulation workflow below.
function binding(plan) {
  return { version: plan.version, kind: plan.kind, executionEnabled: plan.executionEnabled,
    customerId: plan.customerId, lineId: plan.lineId, username: plan.username, resellerId: plan.resellerId,
    packageId: plan.packageId, months: plan.months, connections: plan.connections,
    previousExpiresAt: plan.previousExpiresAt, bouquetIds: plan.bouquetIds,
    catalogFingerprint: plan.catalogFingerprint, costUnits: plan.costUnits, balanceUnits: plan.balanceUnits };
}

export function buildPreservingRenewalPlan({ customer, line, account, packages, checkedAt,
  preserveCurrentSelectionConfirmed = false }, now = Date.now()) {
  const checked = Date.parse(checkedAt);
  if (preserveCurrentSelectionConfirmed !== true || !Number.isFinite(checked) || checked > now || now - checked > 30000) throw new Error('fresh_selection_review_required');
  if (!uuid(customer?.id) || !id(customer.external_id) || !id(line?.id) || !same(customer.external_id, line.id)
    || typeof line.username !== 'string' || !/^[A-Za-z0-9_.-]{3,64}$/.test(line.username) || customer.username !== line.username
    || !id(account?.id) || !same(line.resellerId, account.id) || !id(line.packageId)) throw new Error('renewal_identity_changed');
  const expiry = Date.parse(line.expiresAt);
  if (!Number.isFinite(expiry) || expiry % 1000 !== 0 || expiry <= now || line.trial !== false || line.enabled !== true
    || line.adminEnabled !== true || !Number.isInteger(line.connections) || line.connections < 1 || line.connections > 5) throw new Error('active_paid_line_required');
  const catalog = buildPackageSummary(packages, checkedAt).packages;
  const pkg = catalog.find(item => same(item.id, line.packageId));
  const label = pkg && standardName.exec(pkg.name);
  if (!pkg || !label || pkg.issues.length || pkg.trial !== null || pkg.paid?.unit !== 'months'
    || ![1, 3, 6, 12].includes(pkg.paid.count) || pkg.paid.count !== Number(label[1])
    || pkg.maxConnections !== Number(label[2]) || pkg.maxConnections !== line.connections) throw new Error('same_package_required');
  const comparison = compareChannelGroups(line.bouquetIds, pkg.bouquets);
  if (comparison.status === 'unverified' || comparison.lineOnly.length > 0) throw new Error('selection_outside_current_package');
  const cost = creditUnits(pkg.paid.credits), balance = creditUnits(account.credits);
  if (cost <= 0n || balance < cost) throw new Error('insufficient_renewal_credits');
  const plan = { version: 1, kind: 'simulation_only', executionEnabled: false,
    customerId: customer.id, lineId: String(line.id), username: line.username, resellerId: String(account.id), packageId: pkg.id,
    months: pkg.paid.count, connections: line.connections, previousExpiresAt: new Date(expiry).toISOString(),
    bouquetIds: [...line.bouquetIds].sort((a, b) => a - b),
    catalogFingerprint: hash({ ...pkg, bouquets: [...pkg.bouquets].sort((a, b) => a - b) }),
    costUnits: String(cost), balanceUnits: String(balance), checkedAt: new Date(checked).toISOString() };
  return { ...plan, fingerprint: hash(binding(plan)) };
}

export function assertSimulationRenewalPlan(plan) {
  if (plan?.version !== 1 || plan.kind !== 'simulation_only' || plan.executionEnabled !== false
    || !/^[a-f0-9]{64}$/.test(plan.fingerprint || '') || plan.fingerprint !== hash(binding(plan))) throw new Error('renewal_plan_changed');
  return plan;
}

// Documented multipart fields, kept offline. Actual line selections are sent
// explicitly. Password, username, notes, flags and expiry are not edit fields.
export function buildPreservingRenewalForm(plan) {
  assertSimulationRenewalPlan(plan);
  const form = new FormData();
  for (const [key, value] of Object.entries({ trial: '0', package: plan.packageId,
    package_duration: `${plan.months} months`, max_connections: String(plan.connections) })) form.append(key, value);
  for (const group of plan.bouquetIds) form.append('bouquets_selected[]', String(group));
  return form;
}
