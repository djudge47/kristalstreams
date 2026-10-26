import Stripe from 'stripe';
import { createPaidReadAdapter } from './ks-paid-provider-read.js';
import { reviewPaidNewService } from './ks-paid-new-service-review.js';
import { getPlan } from './ks-payment-validation.js';

const project = 'https://wftfxerblhlsxiijtfbo.supabase.co';
const uuid = v => typeof v === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const payments = env => {
  const live = env.VERCEL_ENV === 'production';
  if (typeof env.STRIPE_SECRET_KEY !== 'string' || !(live ? /^sk_live_[A-Za-z0-9]+$/ : /^sk_test_[A-Za-z0-9]+$/).test(env.STRIPE_SECRET_KEY)) throw Error('payment_configuration_required');
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-08-26.dahlia', timeout: 10000, maxNetworkRetries: 0 });
  return { retrieve: id => stripe.checkout.sessions.retrieve(id, { expand: ['payment_intent.latest_charge'] }) };
};
const options = { auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(8000) }) } };

export function createPaidNewServiceHandler({ createClient, env = process.env, now = Date.now,
  paymentsFactory = payments, providerFactory = input => createPaidReadAdapter({ ...input, allowProductionReview: true }) } = {}) {
  let reviewing = false, lastStarted = null;
  return async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('Vary', 'Authorization');
    const reply = (code, body) => res.status(code).json(body);
    const referencePattern = env.VERCEL_ENV === 'production' ? /^cs_live_[A-Za-z0-9]+$/ : /^cs_test_[A-Za-z0-9]+$/;
    if (!['preview', 'production'].includes(env.VERCEL_ENV)) return reply(404, { error: 'New-service review is unavailable.' });
    if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); return reply(405, { error: 'Method not allowed.' }); }
    if (Object.keys(req.query || {}).join(',') !== 'view' || req.query.view !== 'paid-new-service-review') return reply(400, { error: 'Choose a supported review.' });
    if (req.method === 'POST') {
      let origin; try { origin = new URL(req.headers?.origin); } catch { /* Rejected below. */ }
      if (!origin || origin.protocol !== 'https:' || origin.origin !== req.headers.origin || origin.host !== req.headers.host) return reply(403, { error: 'Use new-service review on the website.' });
      if (!/^application\/json(?:;\s*charset=utf-8)?$/i.test(req.headers?.['content-type'] || '')
        || !req.body || typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).join(',') !== 'reference'
        || typeof req.body.reference !== 'string' || req.body.reference.length > 200 || !referencePattern.test(req.body.reference)) return reply(400, { error: 'Choose a saved new-service order.' });
    }
    if (env.VITE_SUPABASE_URL !== project || !env.VITE_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) return reply(503, { error: 'New-service review is unavailable.' });
    const token = typeof req.headers?.authorization === 'string' && /^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];
    if (!token) return reply(401, { error: 'Sign in to your administrator account.' });
    let claimed = false;
    try {
      const { data, error } = await createClient(project, env.VITE_SUPABASE_ANON_KEY, options).auth.getUser(token);
      const actor = data?.user;
      if (error || !uuid(actor?.id)) return reply(401, { error: 'Sign in to your administrator account again.' });
      if (actor.is_anonymous !== false || !Number.isFinite(Date.parse(actor.email_confirmed_at))
        || actor.email?.trim().toLowerCase() !== 'djudge47@gmail.com') return reply(403, { error: 'Only the administrator can review new-service orders.' });
      const admin = createClient(project, env.SUPABASE_SERVICE_ROLE_KEY, options);
      if (req.method === 'GET') {
        const live = env.VERCEL_ENV === 'production';
        const { data: routes, error: routeError } = await admin.from('ks_paid_order_routes')
          .select('checkout_session_id,user_id,routed_at').eq('livemode', live).eq('destination', 'new_service_review')
          .order('routed_at', { ascending: false }).order('checkout_session_id', { ascending: false }).limit(50);
        if (routeError || !Array.isArray(routes) || routes.length > 50 || routes.some(r => !referencePattern.test(r.checkout_session_id)
          || !uuid(r.user_id) || !Number.isFinite(Date.parse(r.routed_at)))) throw Error('orders_unavailable');
        const references = routes.map(r => r.checkout_session_id);
        const { data: rows, error: queueError } = references.length ? await admin.from('ks_setup_order_queue')
          .select('checkout_session_id,user_id,tier,connections,amount_cents,currency,queued_at').eq('livemode', live)
          .eq('fulfillment_status', 'awaiting_activation').in('checkout_session_id', references).limit(50) : { data: [], error: null };
        if (queueError || !Array.isArray(rows) || rows.length > 50) throw Error('orders_unavailable');
        const seen = new Set();
        const orders = rows.map(row => {
          const route = routes.find(r => r.checkout_session_id === row.checkout_session_id), plan = getPlan(row.tier, row.connections);
          if (!route || route.user_id !== row.user_id || seen.has(row.checkout_session_id) || row.amount_cents !== plan.cents
            || row.currency !== 'usd' || !Number.isFinite(Date.parse(row.queued_at))) throw Error('orders_unavailable');
          seen.add(row.checkout_session_id);
          return { reference: row.checkout_session_id, plan: plan.tier, connections: plan.connections,
            amountCents: plan.cents, queuedAt: row.queued_at };
        });
        return reply(200, { mode: 'verification-only', mayDispatch: false, providerActivated: false, orders });
      }
      const at = now();
      if (reviewing || (lastStarted !== null && at - lastStarted < 30000)) {
        res.setHeader('Retry-After', '30'); return reply(429, { error: 'Wait 30 seconds before reviewing again.' });
      }
      reviewing = true; claimed = true; lastStarted = at;
      const result = await reviewPaidNewService({ admin, reference: req.body.reference, environment: env.VERCEL_ENV, now,
        payments: { retrieve: id => paymentsFactory(env).retrieve(id) },
        provider: { snapshot: () => providerFactory({ env, now }).snapshot() } });
      return reply(200, { mode: 'verification-only', ...result });
    } catch {
      return reply(503, { mode: 'verification-only', state: 'verification_unavailable', mayDispatch: false, providerActivated: false,
        error: 'The order could not be verified. Retry this same order; do not take another payment.' });
    } finally { if (claimed) reviewing = false; }
  };
}
