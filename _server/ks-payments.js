import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { PaymentError, applyPaidSession } from './ks-payment-validation.js';

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

export function checkoutOrigin() {
  if (process.env.VERCEL_ENV !== 'production' && process.env.VERCEL_URL) {
    if (!/^[A-Za-z0-9.-]+\.vercel\.app$/.test(process.env.VERCEL_URL)) throw new PaymentError(503, 'Preview address is not configured correctly.');
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.VERCEL_ENV === 'production') return 'https://kristalstream.com';
  return 'http://127.0.0.1:5174';
}

export function webhookSecret() {
  const secret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  if (!/^whsec_[A-Za-z0-9]+$/.test(secret)) throw new PaymentError(503, 'Payment notifications are not configured yet. Contact support.');
  return secret;
}

export async function fulfill(sessionId, context, ownerId) {
  const session = await context.stripe.checkout.sessions.retrieve(sessionId);
  return applyPaidSession(session, context.live, ownerId, context.admin);
}

export function respondError(res, error) {
  if (error instanceof PaymentError) return res.status(error.status).json({ error: error.message });
  console.error('Kristal Streams payment request failed', { type: error?.type || error?.name || 'UnknownError', code: error?.code || null });
  return res.status(502).json({ error: 'Payment verification could not finish. Please try again or contact support; do not pay again if you were already charged.' });
}
