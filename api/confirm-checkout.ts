import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const getBearerToken = (req: any) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const [scheme, token] = authHeader.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
};

const normalizeTier = (plan: string) => {
  const normalized = String(plan || 'basic').toLowerCase();
  if (normalized.includes('platinum') || normalized.includes('ultimate')) return 'platinum';
  if (normalized.includes('gold') || normalized.includes('premium')) return 'gold';
  if (normalized.includes('silver') || normalized.includes('standard')) return 'silver';
  if (normalized.includes('bronze') || normalized.includes('basic')) return 'bronze';
  return normalized;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey) {
    return res.status(500).json({ error: 'Stripe is not configured.' });
  }

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return res.status(500).json({
      error: 'Subscription activation is not configured. Add SUPABASE_SERVICE_ROLE_KEY in Vercel Environment Variables.',
    });
  }

  try {
    const { sessionId } = req.body || {};
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Missing Stripe checkout session ID.' });
    }

    const accessToken = getBearerToken(req);
    if (!accessToken) {
      return res.status(401).json({ error: 'Please log in to activate this purchase.' });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: userError } = await userClient.auth.getUser(accessToken);

    if (userError || !user) {
      return res.status(401).json({ error: 'Your login session expired. Please log in again.' });
    }

    const stripe = new Stripe(stripeSecretKey);
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Stripe has not marked this checkout as paid yet.' });
    }

    const metadata = checkoutSession.metadata || {};
    if (metadata.user_id && metadata.user_id !== user.id) {
      return res.status(403).json({ error: 'This payment belongs to a different account.' });
    }

    const tier = normalizeTier(metadata.plan || 'bronze');
    const connectionsAllowed = Math.max(1, Math.min(5, Number(metadata.connections || 1)));

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { error: updateError } = await adminClient
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        subscription_tier: tier,
        subscription_status: 'active',
        connections_allowed: connectionsAllowed,
        active_connections: 0,
      }, { onConflict: 'id' });

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
      },
    });
  } catch (error) {
    console.error('Checkout confirmation error:', error);
    const message = error instanceof Error ? error.message : 'Unable to confirm checkout.';
    return res.status(500).json({ error: message });
  }
}
