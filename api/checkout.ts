import Stripe from 'stripe';

const allowedPrices = new Set([
  20, 35, 50, 65, 80,
  45, 75, 110, 140, 175,
  60, 105, 150, 195, 240,
  95, 165, 235, 305, 375,
]);

const getOrigin = (req: any) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'];
  const host = forwardedHost || req.headers.host;
  const protocol = forwardedProto || 'https';

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.VITE_SITE_URL || 'https://kristalstream.com';
};

const normalizePlanName = (plan: string) => {
  if (!plan || typeof plan !== 'string') return 'Kristal Streams Plan';
  return plan
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return res.status(500).json({
      error: 'Stripe is not configured yet. Add STRIPE_SECRET_KEY in Vercel Environment Variables.',
    });
  }

  try {
    const { plan, price, interval } = req.body || {};
    const numericPrice = Number(price);

    if (!plan || !interval || !Number.isFinite(numericPrice)) {
      return res.status(400).json({ error: 'Missing checkout details.' });
    }

    if (!allowedPrices.has(numericPrice)) {
      return res.status(400).json({ error: 'Invalid plan price.' });
    }

    const stripe = new Stripe(secretKey);
    const origin = getOrigin(req);
    const planName = normalizePlanName(plan);
    const intervalLabel = normalizePlanName(interval);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Kristal Streams ${planName} Plan`,
              description: `${intervalLabel} streaming access`,
            },
            unit_amount: Math.round(numericPrice * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?payment=cancelled`,
      metadata: {
        plan: String(plan),
        interval: String(interval),
        price: String(numericPrice),
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    const message = error instanceof Error ? error.message : 'Unable to create Stripe checkout session.';
    return res.status(500).json({ error: message });
  }
}
