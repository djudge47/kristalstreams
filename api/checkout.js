import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const planNames = {
  basic: 'Bronze Plan',
  standard: 'Silver Plan',
  premium: 'Gold Plan',
  ultimate: 'Platinum Plan',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan, price, interval } = req.body;

    if (!plan || !price || !interval) {
      return res.status(400).json({ error: 'Missing plan, price, or interval' });
    }

    const planName = planNames[plan] || plan;
    const isSubscription = interval === 'monthly' || interval === 'yearly';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planName,
              description: `Kristal Streams ${planName} - ${interval}`,
            },
            unit_amount: Math.round(price * 100),
            ...(isSubscription
              ? {
                  recurring: {
                    interval: interval === 'yearly' ? 'year' : 'month',
                  },
                }
              : {}),
          },
          quantity: 1,
        },
      ],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: `${req.headers.origin || 'https://kristalstream.com'}/client/subscription?success=true`,
      cancel_url: `${req.headers.origin || 'https://kristalstream.com'}/pricing?canceled=true`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: error.message });
  }
}