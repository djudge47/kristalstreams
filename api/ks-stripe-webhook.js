import { runtime, webhookSecret, fulfill, PaymentError, respondError } from '../_server/ks-payments.js';

export const config = { api: { bodyParser: false } };

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > 1024 * 1024) throw new PaymentError(413, 'Request too large.');
    chunks.push(bytes);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const context = runtime();
    const secret = webhookSecret();
    const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string') throw new PaymentError(400, 'Missing webhook signature.');
    const body = await readBody(req);
    let event;
    try { event = context.stripe.webhooks.constructEvent(body, signature, secret); }
    catch { throw new PaymentError(400, 'Invalid webhook signature.'); }
    if (event.livemode !== context.live) throw new PaymentError(400, 'Wrong webhook environment.');
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      if (event.data.object.payment_status === 'paid') {
        await fulfill(event.data.object.id, context);
      }
    }
    // Pending and failed payments never activate a profile.
    // Acknowledge only after the paid receipt transaction completes.
    return res.status(200).json({ received: true });
  } catch (error) { return respondError(res, error); }
}
