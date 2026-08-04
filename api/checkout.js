import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const allowedPrices = new Set([
  20, 35, 50, 65, 80,
  45, 75, 110, 140, 175,
  60, 105, 150, 195, 240,
  95, 165, 235, 305, 375,
]);

const getOrigin = (req) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'];
  const host = forwardedHost || req.headers.host;
  const protocol = forwardedProto || 'https';

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.VITE_SITE_URL || 'https://kristalstream.com';
};

const normalizePlanName = (plan) => {
  if (!plan || typeof plan !== 'string') return 'Kristal Streams Plan';
  return plan
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const [scheme, token] = authHeader.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
};

const getPlanDurationDays = (plan, interval) => {
  const source = `${plan} ${interval}`.toLowerCase();
  if (source.includes('platinum') || source.includes('ultimate') || source.includes('12')) return 365;
  if (source.includes('gold') || source.includes('premium') || source.includes('6')) return 180;
  if (source.includes('silver') || source.includes('standard') || source.includes('3')) return 90;
  return 30;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!secretKey) {
    return res.status(500).json({
      error: 'Stripe is not configured yet. Add STRIPE_SECRET_KEY in Vercel Environment Variables.',
    });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({
      error: 'Supabase is not configured on the server. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.',
    });
  }

  try {
    const { plan, price, interval, connections } = req.body || {};
    const numericPrice = Number(price);
    const numericConnections = Math.max(1, Math.min(5, Number(connections || 1)));

    if (!plan || !interval || !Number.isFinite(numericPrice)) {
      return res.status(400).json({ error: 'Missing checkout details.' });
    }

    if (!allowedPrices.has(numericPrice)) {
      return res.status(400).json({ error: 'Invalid plan price.' });
    }

    const accessToken = getBearerToken(req);
    if (!accessToken) {
      return res.status(401).json({ error: 'Please log in before checkout so the purchase can be connected to your dashboard.' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return res.status(401).json({ error: 'Your login session expired. Please log in again before checkout.' });
    }

    const stripe = new Stripe(secretKey);
    const origin = getOrigin(req);
    const planName = normalizePlanName(plan);
    const intervalLabel = normalizePlanName(interval);
    const durationDays = getPlanDurationDays(String(plan), String(interval));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Kristal Streams ${planName} Plan`,
              description: `${intervalLabel} streaming access • ${numericConnections} connection${numericConnections > 1 ? 's' : ''}`,
            },
            unit_amount: Math.round(numericPrice * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?payment=cancelled`,
      metadata: {
        user_id: user.id,
        customer_email: user.email || '',
        plan: String(plan),
        interval: String(interval),
        price: String(numericPrice),
        connections: String(numericConnections),
        duration_days: String(durationDays),
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    const message = error instanceof Error ? error.message : 'Unable to create Stripe checkout session.';
    return res.status(500).json({ error: message });
  }
}
