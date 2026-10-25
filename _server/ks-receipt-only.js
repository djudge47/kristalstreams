import { PaymentError, validatePaidSession } from './ks-payment-validation.js';
import { loadLiveRenewalCompletions } from './ks-live-renewal-status.js';

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
  let completion;
  if (completed && expectedLive && !data.legacy_website_activated) {
    try {
      completion = (await loadLiveRenewalCompletions(admin, payment.userId, [{
        checkout_session_id: payment.sessionId, user_id: payment.userId, livemode: true,
        tier: payment.tier, connections: payment.connections, duration_days: payment.days, amount_cents: payment.cents,
        currency: 'usd', activated: false, expires_at: null, recorded_at: data.recorded_at,
      }])).get(payment.sessionId);
    } catch { throw new PaymentError(503, 'Your payment is recorded, but the completed renewal could not be checked. Contact support; do not pay again.'); }
  }
  // Whitelist the receipt result. A legacy website entitlement or arbitrary RPC
  // fields cannot turn this response into a provider-ready signal.
  return {
    ok: true, payment_recorded: true, test_mode: !expectedLive,
    receipt_reference: payment.sessionId, tier: payment.tier,
    connections_allowed: payment.connections, activated: false,
    // A historical renewal proof does not assert current streaming availability.
    provider_activated: false, order_status: completed ? completion?.status || 'requires_review' : data.order_status,
    ...(completion ? { renewal_completed: true, renewal_completed_at: completion.completedAt,
      setup_expires_at: completion.expiresAt, setup_checked_at: new Date().toISOString() } : {}),
    order_queued: true, queued_at: data.queued_at, queue_replayed: data.queue_replayed,
    legacy_website_activated: data.legacy_website_activated,
    recorded_at: data.recorded_at, replayed: data.replayed,
  };
}
