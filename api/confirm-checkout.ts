import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const normalizeTier = (plan: string) => {
  const normalized = String(plan || 'bronze').toLowerCase();
  if (normalized.includes('platinum') || normalized.includes('ultimate')) return 'platinum';
  if (normalized.includes('gold') || normalized.includes('premium')) return 'gold';
  if (normalized.includes('silver') || normalized.includes('standard')) return 'silver';
  if (normalized.includes('bronze') || normalized.includes('basic')) return 'bronze';
  return 'bronze';
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey) {
    return res.status(500).json({ error: 'Stripe is not configured.' });
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return res.status(500).json({
      error: 'Subscription activation is not configured. Add SUPABASE_SERVICE_ROLE_KEY in Vercel Environment Variables.',
    });
  }

  try {
    const { sessionId } = req.body || {};
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Missing Stripe checkout session ID.' });
    }

    const stripe = new Stripe(stripeSecretKey);
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Stripe has not marked this checkout as paid yet.' });
    }

    const metadata = checkoutSession.metadata || {};
    const userId = metadata.user_id;
    const customerEmail = metadata.customer_email || checkoutSession.customer_email || undefined;

    if (!userId) {
      return res.status(400).json({
        error: 'This Stripe payment is missing the Kristal Streams client ID. Start checkout while logged in and try again.',
      });
    }

    const tier = normalizeTier(metadata.plan || 'bronze');
    const connectionsAllowed = Math.max(1, Math.min(5, Number(metadata.connections || 1)));
    const durationDays = Math.max(1, Number(metadata.duration_days || 30));
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const profileUpdate: Record<string, unknown> = {
      id: userId,
      subscription_tier: tier,
      subscription_status: 'active',
      connections_allowed: connectionsAllowed,
      active_connections: 0,
      subscription_expires_at: expiresAt,
      stripe_checkout_session_id: checkoutSession.id,
      stripe_payment_intent_id: typeof checkoutSession.payment_intent === 'string' ? checkoutSession.payment_intent : null,
      updated_at: new Date().toISOString(),
    };

    if (customerEmail) {
      profileUpdate.email = customerEmail;
    }

    const { error: updateError } = await adminClient
      .from('profiles')
      .upsert(profileUpdate, { onConflict: 'id' });

    if (updateError) {
      console.error('Supabase subscription update error:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({
      ok: true,
      subscription: {
        tier,
        status: 'active',
        connections_allowed: connectionsAllowed,
        expires_at: expiresAt,
      },
    });
  } catch (error) {
    console.error('Checkout confirmation error:', error);
    const message = error instanceof Error ? error.message : 'Unable to confirm checkout.';
    return res.status(500).json({ error: message });
  }
}
