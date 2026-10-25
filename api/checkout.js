import { randomBytes } from 'node:crypto';
import { runtime, authenticate, checkoutOrigin, webhookSecret, PaymentError, respondError } from '../_server/ks-payments.js';
import { validateOrder } from '../_server/ks-payment-validation.js';
import { checkoutParameters, createBoundCheckout } from '../_server/ks-checkout-intent.js';

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
    if (process.env.KS_CHECKOUT_INTENT_ENABLED === 'true' || req.body?.checkoutRequestId !== undefined
      || req.body?.purchaseKind !== undefined || req.body?.checkoutReference !== undefined) {
      const checkout = await createBoundCheckout({ body: req.body, user, order, context, origin });
      return res.status(200).json(checkout);
    }
    const suffix = [...randomBytes(8)].map(byte => String.fromCharCode(97 + byte % 26)).join('');
    const session = await context.stripe.checkout.sessions.create(checkoutParameters({
      order, userId: user.id, email: user.email || undefined, origin, suffix,
    }));
    return res.status(200).json({ url: session.url });
  } catch (error) { return respondError(res, error); }
}
