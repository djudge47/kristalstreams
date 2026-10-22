import { retailPlans as tiers } from '../_shared/ks-retail-pricing.js';

export class PaymentError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}



export function getPlan(plan, connections) {
  const name = typeof plan === 'string' ? plan.trim().toLowerCase() : '';
  const entry = Object.entries(tiers).find(([, value]) => value.aliases.includes(name));
  const count = Number(connections);
  if (!entry || !Number.isInteger(count) || count < 1 || count > 5) {
    throw new PaymentError(400, 'Choose a valid plan and connection count.');
  }
  const [tier, value] = entry;
  return { tier, connections: count, interval: value.interval, days: value.days, cents: value.prices[count - 1] };
}

export function validateOrder(body) {
  const plan = getPlan(body?.plan, body?.connections);
  if (body.interval !== plan.interval || Number(body.price) !== plan.cents / 100) {
    throw new PaymentError(400, 'Plan details changed. Return to pricing and select your plan again.');
  }
  return plan;
}

export function validatePaidSession(session, expectedLive, ownerId) {
  if (ownerId && session?.metadata?.user_id !== ownerId) {
    throw new PaymentError(403, 'This payment belongs to a different account.');
  }
  if (session?.livemode !== expectedLive) throw new PaymentError(400, 'Payment environment does not match this website.');
  if (session?.mode !== 'payment' || session.status !== 'complete' || session.payment_status !== 'paid') {
    throw new PaymentError(409, 'Payment has not been confirmed yet. Please wait and try again.');
  }
  if (!/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(session.id || '')) throw new PaymentError(400, 'Invalid checkout session.');
  const metadata = session.metadata || {};
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(metadata.user_id || '')) {
    throw new PaymentError(400, 'Payment is missing a valid Kristal Streams account.');
  }
  const plan = getPlan(metadata.plan, metadata.connections);
  if (metadata.interval !== plan.interval || Number(metadata.duration_days) !== plan.days || Number(metadata.price) !== plan.cents / 100 ||
      session.currency !== 'usd' || session.amount_total !== plan.cents || session.amount_subtotal !== plan.cents) {
    throw new PaymentError(400, 'Payment does not match the selected plan. Contact support.');
  }
  const intentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  if (!/^pi_[A-Za-z0-9]+$/.test(intentId || '')) throw new PaymentError(400, 'Payment confirmation is missing.');
  return { ...plan, userId: metadata.user_id, sessionId: session.id, intentId, livemode: session.livemode };
}

export async function applyPaidSession(session, expectedLive, ownerId, admin) {
  const payment = validatePaidSession(session, expectedLive, ownerId);
  const { data, error } = await admin.rpc('ks_apply_paid_checkout', {
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
  if (error || !data?.ok) throw new PaymentError(503, 'Payment was received, but recording it needs attention. Please contact support; do not pay again.');
  return data;
}
