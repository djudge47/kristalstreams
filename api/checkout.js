import Stripe from 'stripe';

const plans = {
  basic: { name: 'Bronze Plan', months: 1, prices: [20, 35, 50, 65, 80] },
  standard: { name: 'Silver Plan', months: 3, prices: [45, 75, 110, 140, 175] },
  premium: { name: 'Gold Plan', months: 6, prices: [60, 105, 150, 195, 240] },
  ultimate: { name: 'Platinum Plan', months: 12, prices: [95, 165, 235, 305, 375] },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!stripeSecretKey) {
    return res.status(503).json({
      error: 'Stripe checkout is not configured for this Vercel preview.'
    });
  }

  try {
    const { plan, price } = req.body;
    const selectedPlan = plans[plan];
    const numericPrice = Number(price);

    if (!selectedPlan || !Number.isFinite(numericPrice)) {
      return res.status(400).json({ error: 'Invalid plan selection' });
    }

    const connectionIndex = selectedPlan.prices.indexOf(numericPrice);
    if (connectionIndex === -1) {
      return res.status(400).json({ error: 'Invalid price for the selected plan' });
    }

    const stripe = new Stripe(stripeSecretKey);
    const connections = connectionIndex + 1;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPlan.name,
              description: `Kristal Streams ${selectedPlan.name} - ${selectedPlan.months} month${selectedPlan.months > 1 ? 's' : ''} - ${connections} connection${connections > 1 ? 's' : ''}`,
            },
            unit_amount: Math.round(numericPrice * 100),
            recurring: {
              interval: 'month',
              interval_count: selectedPlan.months,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      metadata: {
        plan,
        plan_name: selectedPlan.name,
        months: String(selectedPlan.months),
        connections: String(connections),
      },
      success_url: `${req.headers.origin || 'https://kristalstream.com'}/client/subscription?success=true`,
      cancel_url: `${req.headers.origin || 'https://kristalstream.com'}/pricing?canceled=true`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    const stripeMessage = error instanceof Error ? error.message : 'Unknown Stripe error';
    const publicMessage = process.env.VERCEL_ENV === 'preview'
      ? `Stripe preview error: ${stripeMessage}`
      : 'Stripe could not create the checkout session.';

    return res.status(500).json({ error: publicMessage });
  }
}
