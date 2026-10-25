import { PaymentError, validatePaidSession } from './ks-payment-validation.js';

const reasons = {
  new_service_review: new Set(['new_service_requested']),
  renewal_review: new Set(['approved_service_link']),
  manual_review: new Set(['missing_intent', 'unverified_intent', 'owner_unconfirmed', 'review_requested',
    'existing_service', 'service_link_missing', 'service_links_ambiguous', 'service_link_stale', 'receipt_requires_review']),
};

// Store a destination once. A replay never reassigns an order after an identity
// or service-link change. Provider execution must independently revalidate it.
export async function routePaidOrder(session, expectedLive, ownerId, admin) {
  const payment = validatePaidSession(session, expectedLive, ownerId);
  const { data, error } = await admin.rpc('ks_route_paid_order', { p_session: payment.sessionId });
  if (error || data?.ok !== true || data.reference !== payment.sessionId || data.account_id !== payment.userId
    || data.test_mode !== !expectedLive || typeof data.replayed !== 'boolean'
    || ![null, 'new_service', 'renewal', 'requires_review'].includes(data.request_kind)
    || !Object.prototype.hasOwnProperty.call(reasons, data.destination) || !reasons[data.destination].has(data.reason)
    || (data.destination === 'renewal_review' && data.request_kind !== 'renewal')
    || (data.destination === 'new_service_review' && data.request_kind !== 'new_service')
    || typeof data.routed_at !== 'string' || !Number.isFinite(Date.parse(data.routed_at))) {
    throw new PaymentError(503, 'Your payment is recorded, but its request needs verification. Contact support; do not pay again.');
  }
  return { request_kind: data.request_kind, destination: data.destination, reason: data.reason,
    routed_at: data.routed_at, replayed: data.replayed };
}
