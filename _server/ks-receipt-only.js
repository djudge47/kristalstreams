import { PaymentError, validatePaidSession } from './ks-payment-validation.js';

// Rollout preparation only: no checkout, webhook or confirmation handler imports
// this module. Recording money must not grant website or provider entitlement.
export async function recordPaymentReceipt(session, expectedLive, ownerId, admin) {
  const payment = validatePaidSession(session, expectedLive, ownerId);
  const { data, error } = await admin.rpc('ks_record_paid_checkout', {
    p_session_id: payment.sessionId,
    p_payment_intent_id: payment.intentId,
    p_user_id: payment.userId,
    p_livemode: payment.livemode,
    p_tier: payment.tier,
    p_connections: payment.connections,
    p_duration_days: payment.days,
    p_amount_cents: payment.cents,
    p_currency: 'usd',
  });
  const review = data?.order_status === 'requires_review';
  if (error || data?.ok !== true || data.payment_recorded !== true
    || data.receipt_reference !== payment.sessionId || data.account_id !== payment.userId
    || data.test_mode !== !expectedLive || data.tier !== payment.tier
    || data.connections_allowed !== payment.connections || data.activated !== false
    || data.provider_activated !== false || typeof data.replayed !== 'boolean'
    || typeof data.legacy_website_activated !== 'boolean'
    || (data.order_status !== 'awaiting_activation' && !review)
    || (data.legacy_website_activated && !review)
    || typeof data.recorded_at !== 'string' || !Number.isFinite(Date.parse(data.recorded_at))) {
    throw new PaymentError(503, 'Payment recording needs attention. If you already paid, do not pay again; contact support.');
  }
  // Whitelist the receipt result. A legacy website entitlement or arbitrary RPC
  // fields cannot turn this response into a provider-ready signal.
  return {
    ok: true, payment_recorded: true, test_mode: !expectedLive,
    receipt_reference: payment.sessionId, tier: payment.tier,
    connections_allowed: payment.connections, activated: false,
    provider_activated: false, order_status: data.order_status,
    legacy_website_activated: data.legacy_website_activated,
    recorded_at: data.recorded_at, replayed: data.replayed,
  };
}
