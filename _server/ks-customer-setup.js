import { getPlan } from './ks-payment-validation.js';
import { loadPreviewCompletions } from './ks-preview-completion-status.js';

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const date = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const columns = 'checkout_session_id,fulfillment_status,queued_at,receipt:ks_payment_receipts!inner(checkout_session_id,user_id,livemode,tier,connections,duration_days,amount_cents,currency,activated,expires_at,recorded_at)';

// Never read a global admin list and filter it in the browser. Scope the query
// to getUser's identity and independently verify every returned row's owner.
export function customerSetupSnapshot(rows, userId, live = false, completions = new Map()) {
  if (!uuid(userId) || !Array.isArray(rows) || rows.length > 5) throw new Error('invalid_orders');
  const seen = new Set();
  return rows.map(row => {
    const receipt = row?.receipt;
    const plan = getPlan(receipt?.tier, receipt?.connections);
    const sessionId = receipt.checkout_session_id;
    const completed = !live && row.fulfillment_status === 'setup_complete';
    const review = live && ['requires_review', 'setup_complete'].includes(row.fulfillment_status);
    const completion = completed ? completions.get(sessionId) : null;
    if (receipt.user_id !== userId || receipt.livemode !== live
      || typeof receipt.activated !== 'boolean' || (receipt.expires_at !== null && !date(receipt.expires_at))
      || (!review && (receipt.activated !== false || receipt.expires_at !== null))
      || (!review && !completed && row.fulfillment_status !== 'awaiting_activation')
      || (completed && !completion)
      || receipt.amount_cents !== plan.cents || receipt.duration_days !== plan.days || receipt.currency !== 'usd'
      || typeof sessionId !== 'string' || !/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId)
      || (live ? sessionId.startsWith('cs_test_') : sessionId.startsWith('cs_live_'))
      || row.checkout_session_id !== sessionId || seen.has(sessionId)
      || !date(receipt.recorded_at) || !date(row.queued_at)) throw new Error('invalid_orders');
    seen.add(sessionId);
    return {
      reference: sessionId, tier: plan.tier, interval: plan.interval, connections: plan.connections,
      amountCents: plan.cents, currency: 'usd', recordedAt: receipt.recorded_at,
      status: review ? 'requires_review' : completed ? completion.status : row.fulfillment_status,
      testMode: !live, providerActivated: completed ? completion.providerActivated : false,
      ...(completed ? { expiresAt: completion.expiresAt } : {}),
    };
  });
}

export function createCustomerSetupHandler({ createClient, env = process.env, now = Date.now } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Vary', 'Authorization');
    // Reading an already accepted order must survive disabling the new-order
    // rollout flag. This endpoint never creates or activates anything.
    const live = env.VERCEL_ENV === 'production';
    if (env.VERCEL_ENV !== 'preview' && !live) return res.status(404).json({ error: 'This order status preview is unavailable.' });
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed.' }); }
    const token = typeof req.headers?.authorization === 'string' && /^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];
    if (!token) return res.status(401).json({ error: 'Please sign in to the account used for your order.' });
    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({ error: 'Your saved order status is temporarily unavailable.' });
    try {
      const auth = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, options);
      const { data, error } = await auth.auth.getUser(token);
      const user = data?.user;
      if (error || !uuid(user?.id)) return res.status(401).json({ error: 'Please sign in again to the account used for your order.' });
      if (user.is_anonymous || !user.email_confirmed_at) return res.status(403).json({ error: 'Confirm your account email before checking order status.' });
      const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options);
      let query = admin.from(live ? 'ks_setup_order_queue' : 'ks_preview_paid_orders').select(columns)
        .eq('receipt.user_id', user.id).eq('receipt.livemode', live);
      query = live ? query.in('fulfillment_status', ['awaiting_activation', 'requires_review', 'setup_complete'])
        : query.eq('receipt.activated', false).is('receipt.expires_at', null).in('fulfillment_status', ['awaiting_activation', 'setup_complete']);
      const { data: rows, error: readError } = await query
        .order('queued_at', { ascending: false }).order('checkout_session_id', { ascending: true }).limit(5);
      if (readError) throw new Error('storage_unavailable');
      if (!Array.isArray(rows) || rows.length > 5) throw new Error('invalid_orders');
      const checkedAt = now();
      const completed = !live ? rows.filter(row => row?.fulfillment_status === 'setup_complete') : [];
      const completions = completed.length ? await loadPreviewCompletions(admin, user.id, completed.map(row => row.receipt), checkedAt) : new Map();
      const orders = customerSetupSnapshot(rows, user.id, live, completions);
      return res.status(200).json({ accountId: user.id, mode: 'read-only', testMode: !live, orders, checkedAt: new Date(checkedAt).toISOString() });
    } catch {
      // No raw database/provider error or payment intent is exposed.
      return res.status(503).json({ error: 'Your saved order status could not be checked. If you already paid, do not pay again; contact support for help.' });
    }
  };
}
