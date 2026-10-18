import { parsePaidActivationReview } from './ks-paid-review-response.js';

const states = ['disabled','not_started','reserved','processing','completion_pending','complete','reconciliation_required','review_ready'];
export function parsePaidTestControl(raw, expected, adminId, now = Date.now()) {
  if (raw?.version !== 1 || raw.previewOnly !== true || raw.reference !== expected.reference || raw.adminAccountId !== adminId
    || !states.includes(raw.state) || (raw.state !== 'disabled' && raw.customerId !== expected.customerId)
    || raw.canPrepare !== ['not_started','reserved'].includes(raw.state) || raw.canExecute !== (raw.state === 'review_ready')
    || raw.canComplete !== (raw.state === 'completion_pending')) throw new Error('The activation control response could not be verified.');
  const result = { state: raw.state, canPrepare: raw.canPrepare, canExecute: raw.canExecute, canComplete: raw.canComplete };
  if (raw.state === 'review_ready') {
    const review = parsePaidActivationReview(raw.review, expected, adminId);
    if (expected.tier !== 'bronze' || expected.connections !== 1 || expected.interval !== 'monthly' || expected.amountCents !== 2000
      || review.creditCostUnits !== '1000000' || typeof raw.resumeReserved !== 'boolean'
      || review.blockers.some(reason => reason !== 'existing_setup_attempt' || !raw.resumeReserved)
      || (raw.resumeReserved && !review.blockers.includes('existing_setup_attempt'))
      || typeof raw.approvalToken !== 'string' || raw.approvalToken.length > 2048 || !/^[A-Za-z0-9_-]+\.[a-f0-9]{64}$/.test(raw.approvalToken)
      || typeof raw.expiresAt !== 'string' || !Number.isFinite(Date.parse(raw.expiresAt)) || Date.parse(raw.expiresAt) <= now || Date.parse(raw.expiresAt) > now + 120000) throw new Error('The one-credit approval has changed or expired.');
    return { ...result, review, approvalToken: raw.approvalToken, expiresAt: raw.expiresAt };
  }
  if (raw.approvalToken !== undefined || raw.review !== undefined || raw.expiresAt !== undefined) throw new Error('Unexpected approval data.');
  return result;
}
