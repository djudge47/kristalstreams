import { runtime, authenticate, fulfill, PaymentError, respondError } from '../_server/ks-payments.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const sessionId = req.body?.sessionId;
    if (typeof sessionId !== 'string' || !/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) {
      throw new PaymentError(400, 'Missing or invalid checkout session.');
    }
    const context = runtime();
    const user = await authenticate(req, context.auth);
    const receipt = await fulfill(sessionId, context, user.id);
    return res.status(200).json(receipt);
  } catch (error) { return respondError(res, error); }
}
