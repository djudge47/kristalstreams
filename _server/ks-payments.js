import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { PaymentError, applyPaidSession, validatePaidSession } from './ks-payment-validation.js';
import { queuePreviewPaidOrder } from './ks-preview-paid-orders.js';
import { verifiedCheckoutIntent } from './ks-checkout-intent.js';
import { recordPaymentReceipt } from './ks-receipt-only.js';
import { loadPreviewCompletions } from './ks-preview-completion-status.js';

export { PaymentError } from './ks-payment-validation.js';

export function runtime() {
  const key = (process.env.STRIPE_SECRET_KEY || '').trim();
  const live = process.env.VERCEL_ENV === 'production';
  if (!/^[sr]k_(test|live)_[A-Za-z0-9]+$/.test(key)) {
    throw new PaymentError(503, 'Payment configuration needs attention. Contact support.');
  }
  if (key.includes('_live_') !== live) {
    throw new PaymentError(503, live ? 'Live payments are not configured yet.' : 'Preview checkout requires a test payment key.');
  }
  if (live && process.env.KS_LIVE_PAYMENTS_ENABLED !== 'true') {
    throw new PaymentError(503, 'Live checkout is not enabled yet. Please contact support.');
  }
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !adminKey) throw new PaymentError(503, 'Payment activation is not configured. Contact support.');
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  return {
    live,
    environment: process.env.VERCEL_ENV,
    receiptOnlyLive: process.env.KS_LIVE_RECEIPT_ONLY_ENABLED === 'true',
    stripe: new Stripe(key, { apiVersion: '2026-08-26.dahlia', timeout: 15000, maxNetworkRetries: 1 }),
    auth: createClient(url, anonKey, options),
    admin: createClient(url, adminKey, options),
  };
}

export async function authenticate(req, auth) {
  const header = req.headers.authorization;
  const match = typeof header === 'string' && /^Bearer ([^\s]+)$/i.exec(header);
  if (!match) throw new PaymentError(401, 'Please sign in to your Kristal Streams account.');
  const { data, error } = await auth.auth.getUser(match[1]);
  if (error || !data?.user) throw new PaymentError(401, 'Your login expired. Please sign in again.');
  return data.user;
}

export function checkoutOrigin(req, env = process.env) {
  if (env.VERCEL_ENV === 'production') return 'https://kristalstream.com';
  if (env.VERCEL_ENV === 'preview') {
    // Auth storage belongs to one origin. Preserve the browser's known deployment
    // or branch address; never trust arbitrary Host/forwarded/body return URLs.
    const hosts = [env.VERCEL_BRANCH_URL, env.VERCEL_URL].filter(Boolean);
    if (!hosts.length || hosts.some(host => !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.vercel\.app$/.test(host))) {
      throw new PaymentError(503, 'Preview address is not configured correctly.');
    }
    const allowedOrigins = hosts.map(host => `https://${host.toLowerCase()}`);
    const origin = req?.headers?.origin;
    if (origin !== undefined) {
      if (typeof origin !== 'string' || !allowedOrigins.includes(origin)) {
        throw new PaymentError(400, 'Open checkout on the current Kristal Streams Preview website and try again.');
      }
      return origin;
    }
    return allowedOrigins[0];
  }
  return 'http://127.0.0.1:5174';
}

export function webhookSecret() {
  const secret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  if (!/^whsec_[A-Za-z0-9]+$/.test(secret)) throw new PaymentError(503, 'Payment notifications are not configured yet. Contact support.');
  return secret;
}

export async function fulfill(sessionId, context, ownerId) {
  if (context.receiptOnlyLive === true && (context.environment !== 'production' || context.live !== true)) {
    throw new PaymentError(503, 'The receipt-only payment rollout is not configured for this environment.');
  }
  const session = await context.stripe.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.checkout_binding_version !== undefined) await verifiedCheckoutIntent(session, context, ownerId);
  let receiptOnly = context.receiptOnlyLive === true;
  if (!receiptOnly && context.environment === 'production' && context.live === true) {
    // An accepted receipt-only order stays in that protocol even if the flag
    // is later disabled. A lookup failure must never fall back to activation.
    const { data: queued, error } = await context.admin.from('ks_setup_order_queue')
      .select('checkout_session_id').eq('checkout_session_id', sessionId).eq('livemode', true).maybeSingle();
    if (error || (queued !== null && queued?.checkout_session_id !== sessionId)) {
      throw new PaymentError(503, 'Your saved payment protocol could not be checked. If you already paid, do not pay again; contact support.');
    }
    receiptOnly = queued !== null;
  }
  if (receiptOnly) {
    const receipt = await recordPaymentReceipt(session, true, ownerId, context.admin);
    // Preserve legacy delivery identities. Review-blocked receipts are not
    // eligible for a new pending alert or another activation attempt.
    if (receipt.order_status === 'requires_review') return receipt;
    const { data: alert, error: alertError } = await context.admin.functions.invoke('ks-order-notification', {
      body: { sessionId: session.id, protocol: 'receipt-only-v1' },
    });
    if (alertError || alert?.success !== true) {
      throw new PaymentError(503, 'Your payment is recorded, but the setup notification needs attention. Please contact support; do not pay again.');
    }
    return receipt;
  }
  const receipt = await applyPaidSession(session, context.live, ownerId, context.admin);
  const queued = await queuePreviewPaidOrder(session, context, ownerId);
  if (queued?.order_status === 'setup_complete') {
    const payment = validatePaidSession(session, false, ownerId);
    const now = Date.now();
    try {
      const expected = { checkout_session_id: payment.sessionId, user_id: payment.userId, livemode: false,
        tier: payment.tier, connections: payment.connections, duration_days: payment.days, amount_cents: payment.cents,
        currency: 'usd', activated: false, expires_at: null, payment_intent_id: payment.intentId };
      const completion = (await loadPreviewCompletions(context.admin, payment.userId, [expected], now)).get(session.id);
      // A completed payment recheck never starts another pending/setup email.
      return { ...receipt, order_status: completion.status, provider_activated: completion.providerActivated,
        setup_expires_at: completion.expiresAt, setup_checked_at: new Date(now).toISOString() };
    } catch {
      throw new PaymentError(503, 'Your payment is recorded, but the completed setup needs verification. Contact support; do not pay again.');
    }
  }
  const { data: alert, error: alertError } = await context.admin.functions.invoke('ks-order-notification', {
    body: { sessionId: session.id },
  });
  if (alertError || !alert?.success) {
    throw new PaymentError(503, 'Your payment is recorded, but the setup notification needs attention. Please contact support; do not pay again.');
  }
  return { ...receipt, ...queued };
}

export function respondError(res, error) {
  if (error instanceof PaymentError) return res.status(error.status).json({ error: error.message });
  console.error('Kristal Streams payment request failed', { type: error?.type || error?.name || 'UnknownError', code: error?.code || null });
  return res.status(502).json({ error: 'Payment verification could not finish. Please try again or contact support; do not pay again if you were already charged.' });
}

