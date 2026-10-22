import { createHash } from 'node:crypto';
import { FormData } from 'undici';
import { buildRequestedRenewalReview } from './ks-crm-renewal-order-review.js';
import { buildPackageSummary } from '../_shared/ks-roomba-package-summary.js';
import { creditUnits } from './ks-paid-approval.js';

export const orderRenewalPurpose = 'ks-crm-changed-order-consent/v1';
export const orderTermPolicy = 'reset_from_purchase_calendar_months_new_york';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fingerprint = ({ checkedAt: _checkedAt, fingerprint: _fingerprint, ...facts }) => hash(facts);

// Calendar expectation from the owner's XUI preview, not verified API behavior.
// A different API result remains locked for reconciliation; it is never adopted
// as proof of a different duration policy. SQL checks the same expectation.
const localParts = value => Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
}).formatToParts(value).filter(p => p.type !== 'literal').map(p => [p.type, Number(p.value)]));
export function expectedChangedOrderExpiry(startedAt, months) {
  if (!Number.isSafeInteger(startedAt) || ![1,3,6,12].includes(months)) throw Error('order_calendar_expectation_required');
  const p = localParts(startedAt), month = new Date(Date.UTC(p.year, p.month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
  const wall = Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), Math.min(p.day, lastDay), p.hour, p.minute, p.second);
  let instant = wall;
  for (let i = 0; i < 3; i++) {
    const actual = localParts(instant);
    instant += wall - Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
  }
  return instant;
}

export function buildOrderRenewalEvidence(input, now) {
  if (input?.preserveCurrentSelectionConfirmed !== true || input.creditSpendConfirmed !== true
    || input.unusedTimeLossConfirmed !== true || input.providerTestConfirmed !== true) throw Error('explicit_changed_order_consent_required');
  const { customer, context, requested } = input;
  const review = buildRequestedRenewalReview({ ...context, customer }, requested, now);
  if (review.status !== 'catalog_compatible' || !Number.isSafeInteger(now)
    || customer.connections_allowed !== review.currentConnections
    || !(customer.package_name === null || (typeof customer.package_name === 'string' && customer.package_name.length <= 200))) {
    throw Error('changed_order_facts_unverified');
  }
  const catalog = buildPackageSummary(context.packages, context.checkedAt).packages;
  const current = catalog.find(p => p.id === String(context.line.packageId));
  const target = catalog.find(p => p.id === review.packageId);
  if (target.id === current.id) throw Error('use_same_package_renewal');
  // Only this change has an owner-observed XUI reset-time warning. Other
  // combinations remain catalog quotes until their provider policy is reviewed.
  if (current.paid.count !== 6 || current.maxConnections !== 4 || requested.months !== 6 || requested.connections !== 3) {
    throw Error('changed_order_provider_policy_not_reviewed');
  }
  if (customer.package_name !== null && customer.package_name !== current.name) throw Error('saved_package_mismatch');
  const canonical = p => ({ ...p, bouquets: [...p.bouquets].sort((a,b) => a-b) });
  const facts = { purpose: orderRenewalPurpose, version: 1, kind: 'changed_order_consent', executionEnabled: false,
    customerId: customer.id, lineId: String(context.line.id), username: context.line.username,
    resellerId: String(context.account.id), currentPackageId: current.id, currentMonths: current.paid.count,
    currentConnections: review.currentConnections, savedPackageName: customer.package_name,
    packageId: target.id, packageName: target.name, months: requested.months, connections: requested.connections,
    previousExpiresAt: new Date(context.line.expiresAt).toISOString(), bouquetIds: review.currentGroupIds,
    termPolicy: orderTermPolicy, unusedTimeLossConfirmed: true, providerTestConfirmed: true,
    catalogFingerprint: hash([canonical(current), canonical(target)]),
    costUnits: String(creditUnits(target.paid.credits)), balanceUnits: String(creditUnits(context.account.credits)) };
  const plan = { ...facts, checkedAt: review.checkedAt, fingerprint: hash(facts) };
  return { plan, form: () => buildOrderRenewalForm(plan) };
}

export function buildOrderRenewalForm(plan) {
  if (plan?.purpose !== orderRenewalPurpose || plan.kind !== 'changed_order_consent' || plan.executionEnabled !== false
    || plan.termPolicy !== orderTermPolicy || plan.unusedTimeLossConfirmed !== true || plan.providerTestConfirmed !== true
    || plan.fingerprint !== fingerprint(plan)) throw Error('changed_order_plan_changed');
  const form = new FormData();
  for (const [key,value] of Object.entries({ trial: '0', package: plan.packageId,
    package_duration: `${plan.months} months`, max_connections: String(plan.connections) })) form.append(key,value);
  for (const group of plan.bouquetIds) form.append('bouquets_selected[]', String(group));
  return form;
}
