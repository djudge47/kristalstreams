import { PaymentError } from './ks-payment-validation.js';
import { creditUnits } from './ks-paid-approval.js';
import { inspectPaidRenewalReview } from './ks-paid-renewal-verification.js';
const uuid = v => typeof v === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
const unavailable = () => new PaymentError(503, 'The saved renewal approval could not be checked. Retry this same attempt; do not pay again.');
function publicApproval(data, reference, operationId) {
  if (!data || data.reference !== reference || data.operationId !== operationId || !uuid(data.approvalId)
    || !['approval_saved','review_required'].includes(data.state) || !['quote_current','quote_expired','service_changed'].includes(data.reason)
    || (data.state === 'approval_saved') !== (data.reason === 'quote_current')
    || !/^[a-f0-9]{64}$/.test(data.quoteFingerprint || '') || !/^[1-9]\d{0,12}$/.test(data.costUnits || '')
    || ![data.approvedAt,data.validUntil].every(v => typeof v === 'string' && Number.isFinite(Date.parse(v)))
    || data.approvalSaved !== true || data.mayDispatch !== false || data.providerActivated !== false || typeof data.replayed !== 'boolean') throw unavailable();
  return { reference, operationId, approvalId: data.approvalId, state: data.state, reason: data.reason,
    quoteFingerprint: data.quoteFingerprint, approvedAt: data.approvedAt, validUntil: data.validUntil,
    approvalSaved: true, replayed: data.replayed, mayDispatch: false, providerActivated: false };
}
// Records this exact quote only. It cannot reserve provider credits, claim a
// dispatch, enable execution, or repeat the existing manual purchase.
export async function savePaidRenewalQuoteApproval(input) {
  const { admin, reference, ownerId, operationId, actorId, expectedQuoteFingerprint, costCredits } = input;
  if (!uuid(ownerId) || !uuid(operationId) || !uuid(actorId) || typeof reference !== 'string' || !/^cs_live_[A-Za-z0-9]+$/.test(reference)
    || !/^[a-f0-9]{64}$/.test(expectedQuoteFingerprint || '') || typeof costCredits !== 'string'
    || input.approvalOnlyConfirmed !== true || input.preserveChannelsConfirmed !== true || input.serviceChangesConfirmed !== true) {
    throw new PaymentError(400, 'Review the exact package, credit cost and service changes before saving approval.');
  }
  let costUnits; try { costUnits = String(creditUnits(costCredits)); if (costUnits === '0') throw Error(); } catch { throw new PaymentError(400,'Choose the exact reviewed credit cost.'); }
  const args = { p_session: reference, p_user: ownerId, p_operation: operationId, p_actor: actorId };
  const prior = await admin.rpc('ks_lookup_paid_renewal_quote_approval', args);
  if (prior.error) throw unavailable();
  if (prior.data !== null) {
    const recovered = publicApproval(prior.data, reference, operationId);
    if (prior.data.quoteFingerprint !== expectedQuoteFingerprint || prior.data.costUnits !== costUnits) throw new PaymentError(409, 'A different quote is already saved for this attempt. Review its saved status.');
    return recovered;
  }
  const { result, quote } = await inspectPaidRenewalReview(input);
  if (result.state !== 'verified_for_review' || !quote || quote.fingerprint !== expectedQuoteFingerprint || quote.costUnits !== costUnits) {
    throw new PaymentError(409, 'The package, cost or service changed. Load a fresh review before saving approval.');
  }
  const { data, error } = await admin.rpc('ks_save_paid_renewal_quote_approval', { ...args, p_canonical: quote.canonical,
    p_fingerprint: quote.fingerprint, p_cost: quote.costUnits, p_balance: quote.balanceUnits, p_checked: quote.checkedAt });
  if (error) throw unavailable();
  return publicApproval(data, reference, operationId);
}
