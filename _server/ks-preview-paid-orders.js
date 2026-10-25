import { PaymentError, getPlan, validatePaidSession } from './ks-payment-validation.js';

// Two read-only views share one deployment function; each retains its own auth/environment checks.
export function createPreviewPaidOrdersRouter({ listHandler, simulationHandler, foundationHandler, activationReviewHandler, paidTestControlHandler, renewalReviewHandler, adminPaymentHistoryHandler }) {
  return function route(req, res) {
    res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('Vary', 'Authorization');
    const view = req.query?.view;
    if (view === undefined) return listHandler(req, res);
    if (view === 'new-customer-simulation') return simulationHandler(req, res);
    if (view === 'foundation' && foundationHandler) return foundationHandler(req, res);
    if (view === 'activation-review' && activationReviewHandler) return activationReviewHandler(req, res);
    if (view === 'paid-test-control' && paidTestControlHandler) return paidTestControlHandler(req, res);
    if (view === 'admin-website-payments' && adminPaymentHistoryHandler) return adminPaymentHistoryHandler(req, res);
    if (view === 'paid-renewal-verification' && renewalReviewHandler) return renewalReviewHandler(req, res);
    return res.status(400).json({ error: 'Choose a supported payment review.' });
  };
}

export async function queuePreviewPaidOrder(session, context, ownerId) {
  if (context.environment !== 'preview' || context.live !== false) return null;
  const payment = validatePaidSession(session, false, ownerId);
  const { data, error } = await context.admin.rpc('ks_queue_preview_paid_order', {
    p_session_id: payment.sessionId, p_user_id: payment.userId,
  });
  const pending = data?.order_status === 'awaiting_activation' && data.provider_activated === false;
  const completed = data?.order_status === 'setup_complete' && data.provider_activated === true;
  if (error || data?.ok !== true || (!pending && !completed) || data.test_mode !== true) {
    throw new PaymentError(503, 'Your test payment is recorded, but adding it to the CRM needs attention. Please contact support; do not pay again.');
  }
  return { order_status: data.order_status, provider_activated: data.provider_activated };
}

export function paidOrderSnapshot(rows) {
  if (!Array.isArray(rows) || rows.length > 50) throw new Error('invalid_orders');
  return rows.map(row => {
    const plan = getPlan(row?.tier, row?.connections);
    const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
    if (!/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(row.sessionId || '')
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.userId || '')
      || row.testMode !== true || row.websiteActivated !== false || row.orderStatus !== 'awaiting_activation'
      || row.amountCents !== plan.cents || row.currency !== 'usd' || row.receiptDurationDays !== plan.days
      || !validDate(row.recordedAt) || !validDate(row.queuedAt)) throw new Error('invalid_orders');
    return {
      sessionId: row.sessionId, userId: row.userId, testMode: true, orderStatus: 'awaiting_activation',
      tier: plan.tier, connections: plan.connections, amountCents: plan.cents, currency: 'usd',
      interval: plan.interval, recordedAt: row.recordedAt, queuedAt: row.queuedAt,
      accountLabel: typeof row.accountLabel === 'string' && row.accountLabel.length <= 200
        ? row.accountLabel.replace(/[\x00-\x1f\x7f]/g, '').trim() || 'Website account' : 'Website account',
      providerActivated: false,
    };
  });
}

export function createPreviewPaidOrdersHandler({ createClient, env = process.env } = {}) {
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    if (env.VERCEL_ENV !== 'preview') return res.status(404).json({ error: 'This order queue is available in Preview only.' });
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed.' }); }
    const token = typeof req.headers?.authorization === 'string' && /^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];
    if (!token) return res.status(401).json({ error: 'Please sign in to your admin account.' });
    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({ error: 'The CRM order queue is unavailable.' });
    try {
      const auth = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, options);
      const { data, error } = await auth.auth.getUser(token);
      const user = data?.user;
      if (error || !user?.id) return res.status(401).json({ error: 'Please sign in again to your admin account.' });
      if (user.is_anonymous || !user.email_confirmed_at || user.email?.trim().toLowerCase() !== 'djudge47@gmail.com') return res.status(403).json({ error: 'Only the Kristal Streams administrator can view this queue.' });
      const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options);
      const { data: rows, error: readError } = await admin.rpc('ks_list_preview_paid_orders');
      if (readError) throw new Error('storage_unavailable');
      return res.status(200).json({ orders: paidOrderSnapshot(rows).map(order => ({ ...order, canReviewTrial: order.userId === user.id })), mode: 'read-only', providerActivated: false });
    } catch {
      return res.status(503).json({ error: 'The saved payment orders could not be checked. No provider action was sent.' });
    }
  };
}
