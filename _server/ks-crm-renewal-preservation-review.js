import { buildPreservingRenewalPlan } from './ks-crm-renewal-plan.js';
import { compareChannelGroups } from './ks-roomba-renewal-review.js';

const reasons = {
  fresh_selection_review_required: 'This selection review has expired. Reload it before continuing.',
  renewal_identity_changed: 'The saved CRM customer and current XUI line could not be matched.',
  active_paid_line_required: 'This preview supports enabled, active paid lines only.',
  same_package_required: 'The current package, term and connection allowance need manual review.',
  selection_outside_current_package: 'The current channel selection could not be verified within this package.',
  insufficient_renewal_credits: 'The reseller balance is below the renewal cost.',
  invalid_credit_value: 'The credit cost or reseller balance could not be verified.',
};

// Feasibility preview only. The internal planner's confirmation parameter checks
// the hypothetical preserve-selection choice, not human consent. No plan hash,
// form, approval token, reseller identity or execution authority leaves here.
export function buildPreservationReview(context, customer, now = Date.now()) {
  const checked = Date.parse(context.checkedAt);
  if (!Number.isFinite(checked)) throw Error('invalid_selection_review');
  const comparison = compareChannelGroups(context.line.bouquetIds,
    context.packages.find(pkg => pkg.id === context.line.packageId)?.bouquets);
  let ready = false, blockers = [];
  try {
    buildPreservingRenewalPlan({ ...context, customer, preserveCurrentSelectionConfirmed: true }, now);
    ready = true;
  } catch (error) {
    blockers = [reasons[error.message] || 'The preserving renewal details could not be verified. Reload or review this line manually.'];
  }
  return {
    mode: 'review-only', status: ready ? 'review_ready' : 'manual_review', executionEnabled: false, sent: false,
    checkedAt: new Date(checked).toISOString(), validUntil: new Date(checked + 30000).toISOString(),
    currentGroupIds: comparison.status === 'unverified' ? [] : [...context.line.bouquetIds].sort((a, b) => a - b),
    packageGroupCount: comparison.packageCount, preservesCurrentSelection: ready, blockers,
  };
}
