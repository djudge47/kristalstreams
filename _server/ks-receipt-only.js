import { PaymentError, validatePaidSession } from './ks-payment-validation.js';

// The opt-in live rollout uses this recorder. Recording money must not grant
// website or provider entitlement. The rollout flag remains off by default.
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
  const completed = data?.order_status === 'setup_complete';
  if (error || data?.ok !== true || data.payment_recorded !== true
    || data.receipt_reference !== payment.sessionId || data.account_id !== payment.userId
    || data.test_mode !== !expectedLive || data.tier !== payment.tier
    || data.connections_allowed !== payment.connections || data.activated !== false
    || data.provider_activated !== false || typeof data.replayed !== 'boolean'
    || data.order_queued !== true || typeof data.queue_replayed !== 'boolean'
    || typeof data.queued_at !== 'string' || !Number.isFinite(Date.parse(data.queued_at))
    || typeof data.legacy_website_activated !== 'boolean'
    || (data.order_status !== 'awaiting_activation' && !review && !completed)
    || (completed && (data.replayed !== true || data.queue_replayed !== true))
    || (data.legacy_website_activated && !review && !completed)
    || typeof data.recorded_at !== 'string' || !Number.isFinite(Date.parse(data.recorded_at))) {
    throw new PaymentError(503, 'Payment recording needs attention. If you already paid, do not pay again; contact support.');
  }
  // Whitelist the receipt result. A legacy website entitlement or arbitrary RPC
  // fields cannot turn this response into a provider-ready signal.
  return {
    ok: true, payment_recorded: true, test_mode: !expectedLive,
    receipt_reference: payment.sessionId, tier: payment.tier,
    connections_allowed: payment.connections, activated: false,
    // A completed queue is not a live completion proof. Preserve the payment
    // and stop pending alerts while the live owner/completion contract is open.
    provider_activated: false, order_status: completed ? 'requires_review' : data.order_status,
    order_queued: true, queued_at: data.queued_at, queue_replayed: data.queue_replayed,
    legacy_website_activated: data.legacy_website_activated,
    recorded_at: data.recorded_at, replayed: data.replayed,
  };
}
