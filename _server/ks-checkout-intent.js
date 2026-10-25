import { createHash } from 'node:crypto';
import { getPlan, PaymentError, validatePaidSession } from './ks-payment-validation.js';

const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
const customerUuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
const kinds = ['new_service', 'renewal', 'requires_review'];
const unavailable = () => new PaymentError(503, 'Checkout could not be safely saved. Retry this checkout or contact support; do not start another payment.');
const conflict = () => new PaymentError(409, 'This checkout needs review. Contact support before starting another payment.');

export function checkoutParameters({ order, userId, email, origin, suffix, requestId, kind, expiresAt, bindingVersion = 1, renewalCustomerId }) {
  return {
    mode: 'payment',
    excluded_payment_method_types: ['affirm', 'afterpay_clearpay', 'alma', 'billie', 'klarna', 'scalapay', 'sunbit', 'zip'],
    integration_identifier: `kristal_streams_${suffix}`,
    customer_email: email,
    client_reference_id: userId,
    line_items: [{ price_data: { currency: 'usd', product_data: {
      name: `Kristal Streams ${order.tier[0].toUpperCase() + order.tier.slice(1)} Plan`,
      description: `${order.interval} streaming access - ${order.connections} connection${order.connections > 1 ? 's' : ''}`,
    }, unit_amount: order.cents }, quantity: 1 }],
    success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?payment=cancelled`,
    ...(expiresAt === undefined ? {} : { expires_at: expiresAt }),
    metadata: {
      user_id: userId, plan: order.tier, interval: order.interval, price: String(order.cents / 100),
      connections: String(order.connections), duration_days: String(order.days),
      ...(requestId ? { checkout_binding_version: String(bindingVersion), checkout_request_id: requestId, purchase_kind: kind,
        ...(bindingVersion === 2 ? { renewal_customer_id: renewalCustomerId } : {}) } : {}),
    },
  };
}

const sessionPattern = live => live ? /^cs_live_[A-Za-z0-9]+$/ : /^cs_test_[A-Za-z0-9]+$/;
function checkoutMode(context) {
  if (context.environment === 'production' && context.live === true) return true;
  if (context.environment === 'preview' && context.live === false) return false;
  throw new PaymentError(503, 'The updated checkout is not configured for this environment.');
}

function validateRow(row, { userId, requestId, order, kind, origin, email, live = false, bindingVersion = 1, renewalCustomerId }) {
  if (!row || row.user_id !== userId || row.request_id !== requestId || row.livemode !== live
    || row.tier !== order.tier || row.connections !== order.connections || row.duration_days !== order.days
    || row.amount_cents !== order.cents || row.currency !== 'usd' || row.kind !== kind
    || row.return_origin !== origin || row.customer_email !== email || row.binding_version !== bindingVersion
    || (bindingVersion === 2 && (!live || kind !== 'renewal' || row.renewal_customer_id !== renewalCustomerId
      || !Number.isSafeInteger(row.renewal_external_id) || row.renewal_external_id <= 0))
    || (bindingVersion === 1 && (row.renewal_customer_id != null || row.renewal_external_id != null))
    || !Number.isInteger(row.created_epoch) || !Number.isInteger(row.expires_epoch)
    || row.expires_epoch !== row.created_epoch + 3600
    || !(row.checkout_session_id === null || sessionPattern(live).test(row.checkout_session_id))) throw unavailable();
  return row;
}

function matchesSession(session, row, order) {
  const metadata = session?.metadata;
  return sessionPattern(row.livemode).test(session?.id) && session.livemode === row.livemode && session.mode === 'payment'
    && session.client_reference_id === row.user_id && session.customer_email === row.customer_email
    && session.expires_at === row.expires_epoch && session.currency === 'usd'
    && session.amount_subtotal === order.cents && session.amount_total === order.cents
    && metadata?.user_id === row.user_id && metadata.plan === order.tier && metadata.interval === order.interval
    && metadata.price === String(order.cents / 100) && metadata.connections === String(order.connections)
    && metadata.duration_days === String(order.days) && metadata.checkout_binding_version === String(row.binding_version)
    && metadata.checkout_request_id === row.request_id && metadata.purchase_kind === row.kind
    && (row.binding_version !== 2 || metadata.renewal_customer_id === row.renewal_customer_id);
}

function payableUrl(session) {
  if (session.status !== 'open' || session.payment_status !== 'unpaid') throw conflict();
  try {
    const url = new URL(session.url);
    if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com' || url.port || url.username || url.password) throw conflict();
    return url.href;
  } catch { throw conflict(); }
}

// New live admission also requires receipt-only fulfillment. Existing Preview
// request IDs, Stripe parameters and idempotency keys retain their v1 protocol.
export async function createBoundCheckout({ body, user, order, context, origin, env = process.env, now = Date.now }) {
  const live = checkoutMode(context);
  if (env.KS_CHECKOUT_INTENT_ENABLED !== 'true' || env.VERCEL_ENV !== context.environment
    || (live && context.receiptOnlyLive !== true)) {
    throw new PaymentError(503, 'The updated checkout is not enabled on this website yet.');
  }
  if (!user || user.is_anonymous !== false || !user.email || !Number.isFinite(Date.parse(user.email_confirmed_at))) {
    throw new PaymentError(403, 'Confirm your account email and sign in before checkout.');
  }
  const requestId = body?.checkoutRequestId, kind = body?.purchaseKind;
  if (!uuid(requestId) || !kinds.includes(kind)) throw new PaymentError(400, 'Choose the service type and retry checkout.');
  const selected = body.renewalCustomerId;
  if (selected !== undefined && (!live || kind !== 'renewal' || !customerUuid(selected))) {
    throw new PaymentError(400, 'Choose your linked service before renewal checkout.');
  }
  const bindingVersion = selected === undefined ? 1 : 2;
  if (body.checkoutReference !== undefined && !sessionPattern(live).test(body.checkoutReference)) throw conflict();
  const expected = { userId: user.id, requestId, order, kind, origin, email: user.email, live, bindingVersion, renewalCustomerId: selected };
  const { data, error } = await context.admin.rpc(bindingVersion === 2 ? 'ks_reserve_live_service_checkout_request'
    : live ? 'ks_reserve_live_checkout_request' : 'ks_reserve_checkout_request', {
    p_user_id: user.id, p_request_id: requestId, p_tier: order.tier, p_connections: order.connections,
    p_kind: kind, p_origin: origin, p_email: user.email,
    ...(bindingVersion === 2 ? { p_customer: selected } : {}),
  });
  if (error) throw unavailable();
  const row = validateRow(data, expected);
  if (body.checkoutReference !== undefined && row.checkout_session_id !== body.checkoutReference) throw conflict();
  const current = Math.floor(now() / 1000);
  // Never re-create an uncertain session after Stripe's idempotency window.
  // A shorter 20-minute retry period also leaves >=30 minutes to session expiry.
  if (current < row.created_epoch || current >= row.expires_epoch
    || (!row.checkout_session_id && current >= row.created_epoch + 1200)) throw conflict();
  const protocol = bindingVersion === 2 ? 'ks_checkout_live_v2' : live ? 'ks_checkout_live_v1' : 'ks_checkout_v1';
  const key = createHash('sha256').update(`${protocol}:${user.id}:${requestId}`).digest('hex');
  const params = checkoutParameters({ order, userId: row.user_id, email: row.customer_email,
    origin: row.return_origin, requestId, kind: row.kind, expiresAt: row.expires_epoch, bindingVersion, renewalCustomerId: selected,
    suffix: [...Buffer.from(key, 'hex').subarray(0, 8)].map(byte => String.fromCharCode(97 + byte % 26)).join('') });
  const created = row.checkout_session_id ? { id: row.checkout_session_id }
    : await context.stripe.checkout.sessions.create(params, { idempotencyKey: `${protocol}_${key}` });
  // Always retrieve: an idempotent create response may describe an earlier state.
  const session = await context.stripe.checkout.sessions.retrieve(created.id);
  if (!matchesSession(session, row, order)) throw conflict();
  const url = payableUrl(session);
  const { data: captured, error: captureError } = await context.admin.rpc(live ? 'ks_bind_live_checkout_request' : 'ks_bind_checkout_request', {
    p_user_id: user.id, p_request_id: requestId, p_session_id: session.id,
  });
  if (captureError || !captured?.intent) throw unavailable();
  validateRow(captured.request, expected);
  const intent = captured.intent;
  if (captured.request.checkout_session_id !== session.id || intent.checkout_session_id !== session.id
    || intent.user_id !== user.id || intent.kind !== kind || intent.new_service_attested !== (kind === 'new_service')
    || intent.source !== 'authenticated_checkout' || Date.parse(intent.captured_at) !== Date.parse(captured.request.bound_at)
    || !Number.isFinite(Date.parse(intent.captured_at)) || Date.parse(intent.captured_at) / 1000 < row.created_epoch
    || Date.parse(intent.captured_at) / 1000 >= row.expires_epoch) throw unavailable();
  return { url, reference: session.id };
}

// Receipt/review input comes from the immutable server record, never browser metadata alone.
export async function verifiedCheckoutIntent(session, context, ownerId) {
  const payment = validatePaidSession(session, context.live, ownerId);
  const live = checkoutMode(context);
  if (!uuid(session.metadata.checkout_request_id)) throw conflict();
  const { data: row, error } = await context.admin.from(live ? 'ks_live_checkout_requests' : 'ks_checkout_requests').select('*')
    .eq('user_id', payment.userId).eq('request_id', session.metadata.checkout_request_id)
    .eq('checkout_session_id', session.id).maybeSingle();
  if (error || !row) throw unavailable();
  const bindingVersion = session.metadata.checkout_binding_version === '2' ? 2 : 1;
  if (bindingVersion === 2 && (!live || !customerUuid(session.metadata.renewal_customer_id))) throw conflict();
  const order = getPlan(row.tier, row.connections);
  validateRow(row, { userId: payment.userId, requestId: session.metadata.checkout_request_id,
    order, kind: session.metadata.purchase_kind, origin: row.return_origin, email: row.customer_email, live,
    bindingVersion, renewalCustomerId: session.metadata.renewal_customer_id });
  if (!matchesSession(session, row, order)) throw conflict();
  const { data: intent, error: intentError } = await context.admin.from('ks_setup_purchase_intents').select('*')
    .eq('checkout_session_id', session.id).eq('user_id', payment.userId).maybeSingle();
  if (intentError || !intent || intent.checkout_session_id !== session.id || intent.user_id !== payment.userId
    || intent.kind !== row.kind || intent.source !== 'authenticated_checkout' || Date.parse(intent.captured_at) !== Date.parse(row.bound_at)
    || intent.new_service_attested !== (row.kind === 'new_service') || !Number.isFinite(Date.parse(intent.captured_at))
    || Date.parse(intent.captured_at) / 1000 < row.created_epoch
    || Date.parse(intent.captured_at) / 1000 >= row.expires_epoch) throw unavailable();
  return { source: intent.source, userId: payment.userId, sessionId: session.id,
    kind: intent.kind, newServiceAttested: intent.new_service_attested, capturedAt: intent.captured_at, receiptOnly: live };
}
