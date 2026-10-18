import { randomBytes } from 'node:crypto';
import { runtime, authenticate, checkoutOrigin, webhookSecret, PaymentError, respondError } from '../_server/ks-payments.js';
import { validateOrder } from '../_server/ks-payment-validation.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const order = validateOrder(req.body);
    const context = runtime();
    webhookSecret();
    const user = await authenticate(req, context.auth);
    const { data: profile, error } = await context.admin.from('profiles').select('id').eq('id', user.id).maybeSingle();
    if (error || !profile) throw new PaymentError(409, 'Your account setup needs attention. Contact support before paying.');
    const origin = checkoutOrigin(req);
    const suffix = [...randomBytes(8)].map(byte => String.fromCharCode(97 + byte % 26)).join('');
    const session = await context.stripe.checkout.sessions.create({
      mode: 'payment',
      // Require payment in full; keep eligible cards and wallets available.
      excluded_payment_method_types: ['affirm', 'afterpay_clearpay', 'alma', 'billie', 'klarna', 'scalapay', 'sunbit', 'zip'],
      integration_identifier: `kristal_streams_${suffix}`,
      customer_email: user.email || undefined,
      client_reference_id: user.id,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Kristal Streams ${order.tier[0].toUpperCase() + order.tier.slice(1)} Plan`,
            description: `${order.interval} streaming access - ${order.connections} connection${order.connections > 1 ? 's' : ''}`,
          },
          unit_amount: order.cents,
        },
        quantity: 1,
      }],
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?payment=cancelled`,
      metadata: {
        user_id: user.id,
        plan: order.tier,
        interval: order.interval,
        price: String(order.cents / 100),
        connections: String(order.connections),
        duration_days: String(order.days),
      },
    });
    return res.status(200).json({ url: session.url });
  } catch (error) { return respondError(res, error); }
}
