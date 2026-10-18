export const paidReviewBlockers = {
  prior_trial_activity: 'This account was used for the earlier trial. Use a separate new-customer account for a paid-create test; keep the earlier trial intact.',
  customer_email_unconfirmed: 'Confirm the test customer’s email before proceeding.',
  existing_website_access: 'This customer already has website access that needs review before creating a new service.',
  existing_streaming_access: 'A known streaming or CRM record needs review. A new line must not replace existing access.',
  existing_setup_attempt: 'A saved setup attempt already exists. Review its status before any further action.',
  encryption_missing: 'The Preview login encryption key needs configuration.',
  insufficient_credits: 'The reseller balance is below this package’s credit cost.',
  reseller_dispatch_locked: 'Another unresolved paid dispatch holds the reseller lock. Reconcile it before proceeding.',
};
const units = value => typeof value === 'string' && /^\d{1,13}$/.test(value) && BigInt(value) <= 1000000000000n;
const date = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
export function parsePaidActivationReview(raw, expected, adminId) {
  if (raw?.version !== 1 || raw.adminAccountId !== adminId || raw.reference !== expected.reference || raw.customer?.accountId !== expected.customerId
    || typeof raw.customer.email !== 'string' || raw.customer.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.customer.email)
    || raw.plan?.tier !== expected.tier || raw.plan.connections !== expected.connections || raw.plan.interval !== expected.interval
    || raw.plan.amountCents !== expected.amountCents || raw.plan.providerMonths !== ({ bronze: 1, silver: 3, gold: 6, platinum: 12 })[expected.tier]
    || !Number.isInteger(raw.plan.bouquetCount) || raw.plan.bouquetCount < 1 || raw.plan.bouquetCount > 2000
    || raw.previewOnly !== true || raw.mode !== 'read-only' || raw.canActivate !== false || raw.creditApprovalRecorded !== false
    || raw.approvalTokenIssued !== false || raw.databaseWrites !== false || raw.realProviderWrites !== 0
    || !date(raw.checkedAt) || !date(raw.providerCheckedAt) || Date.parse(raw.checkedAt) < Date.parse(raw.providerCheckedAt)
    || Date.parse(raw.checkedAt) - Date.parse(raw.providerCheckedAt) > 30000 || !units(raw.creditCostUnits) || BigInt(raw.creditCostUnits) <= 0n
    || !units(raw.balanceUnits) || !Array.isArray(raw.blockers) || raw.blockers.length > 8 || new Set(raw.blockers).size !== raw.blockers.length
    || raw.blockers.some(reason => typeof reason !== 'string' || !Object.hasOwn(paidReviewBlockers, reason))
    || raw.status !== (raw.blockers.length ? 'blocked' : 'review_only')) throw new Error('The paid test review could not be verified.');
  const enough = BigInt(raw.balanceUnits) >= BigInt(raw.creditCostUnits);
  if (enough ? (!units(raw.projectedBalanceUnits) || BigInt(raw.projectedBalanceUnits) !== BigInt(raw.balanceUnits) - BigInt(raw.creditCostUnits) || raw.blockers.includes('insufficient_credits'))
    : (raw.projectedBalanceUnits !== null || !raw.blockers.includes('insufficient_credits'))) throw new Error('The credit estimate could not be verified.');
  return { customerEmail: raw.customer.email, creditCostUnits: raw.creditCostUnits, balanceUnits: raw.balanceUnits,
    projectedBalanceUnits: raw.projectedBalanceUnits, checkedAt: raw.checkedAt, providerMonths: raw.plan.providerMonths,
    connections: raw.plan.connections, blockers: raw.blockers.map(reason => reason), status: raw.status };
}
export function formatCreditUnits(value) {
  if (!units(value)) throw new Error('Invalid credit estimate.');
  const number = BigInt(value), fraction = String(number % 1000000n).padStart(6, '0').replace(/0+$/, '');
  return `${number / 1000000n}${fraction ? `.${fraction}` : ''}`;
}
