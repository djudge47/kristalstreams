import { openStreamingLogin } from './ks-login-envelope.js';

const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const sessionId = value => typeof value === 'string' && value.length <= 200 && /^cs_(test_)?[A-Za-z0-9]+$/.test(value);
const columns = 'attempt_id,checkout_session_id,user_id,created_at,attempt:ks_preview_provisioning_attempts!inner(attempt_id,checkout_session_id,user_id,state,login_envelope,provider_expires_at),receipt:ks_payment_receipts!inner(user_id,livemode)';
export function createStreamingLoginHandler({ createClient, env = process.env, reveal = false, now = Date.now } = {}) {
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('Vary', 'Authorization'); res.setHeader('Pragma', 'no-cache');
    if (env.VERCEL_ENV !== 'preview') return res.status(404).json({ error: 'Streaming login preview is unavailable.' });
    const method = reveal ? 'POST' : 'GET';
    if (req.method !== method) { res.setHeader('Allow', method); return res.status(405).json({ error: 'Method not allowed.' }); }
    const token = typeof req.headers?.authorization === 'string' && /^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];
    if (!token) return res.status(401).json({ error: 'Please sign in to your account.' });
    const reference = reveal ? req.body?.sessionId : null;
    if (reveal && !sessionId(reference)) return res.status(400).json({ error: 'Choose a saved streaming login.' });
    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({ error: 'Streaming login retrieval is unavailable.' });
    try {
      const auth = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, options);
      const { data, error } = await auth.auth.getUser(token); const user = data?.user;
      if (error || !uuid(user?.id)) return res.status(401).json({ error: 'Please sign in again.' });
      if (user.is_anonymous || !user.email_confirmed_at) return res.status(403).json({ error: 'Confirm your account email first.' });
      const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options);
      let query = admin.from('ks_preview_streaming_logins').select(columns).eq('user_id', user.id)
        .eq('attempt.user_id', user.id).eq('receipt.user_id', user.id).eq('receipt.livemode', false).eq('attempt.state', 'credentials_ready')
        .gt('attempt.provider_expires_at', new Date(now()).toISOString());
      if (reveal) query = query.eq('checkout_session_id', reference);
      const { data: rows, error: readError } = await query.order('created_at', { ascending: false }).limit(reveal ? 1 : 5);
      if (readError || !Array.isArray(rows) || rows.length > (reveal ? 1 : 5)) throw new Error('invalid_login_records');
      for (const row of rows) {
        const a = row?.attempt;
        if (!uuid(row?.attempt_id) || !sessionId(row.checkout_session_id) || row.user_id !== user.id
          || a?.attempt_id !== row.attempt_id || a.checkout_session_id !== row.checkout_session_id || a.user_id !== user.id
          || a.state !== 'credentials_ready' || row.receipt?.user_id !== user.id || row.receipt.livemode !== false
          || !Number.isFinite(Date.parse(row.created_at)) || !Number.isFinite(Date.parse(a.provider_expires_at))
          || Date.parse(a.provider_expires_at) <= now() || (reveal && row.checkout_session_id !== reference)) throw new Error('invalid_login_records');
      }
      if (!reveal) return res.status(200).json({ accountId: user.id, previewOnly: true, logins: rows.map(row => ({ reference: row.checkout_session_id, expiresAt: row.attempt.provider_expires_at })) });
      if (rows.length !== 1) return res.status(404).json({ error: 'A verified streaming login is not available for this order.' });
      const row = rows[0];
      const login = openStreamingLogin(row.attempt.login_envelope, { environment: 'preview', ownerId: user.id, sessionId: reference, attemptId: row.attempt_id }, env);
      return res.status(200).json({ accountId: user.id, previewOnly: true, reference, login, expiresAt: row.attempt.provider_expires_at });
    } catch { return res.status(503).json({ error: 'Your streaming login could not be retrieved securely. Contact support; do not pay again.' }); }
  };
}

export function createCustomerSetupRouter({ statusHandler, availabilityHandler, revealHandler, crmHandler }) {
  return (req, res) => {
    if (req.query?.view === undefined) return statusHandler(req, res);
    if (req.query.view === 'crm-service' && crmHandler) return crmHandler(req, res);
    if (req.query.view === 'login-availability') return availabilityHandler(req, res);
    if (req.query.view === 'streaming-login') return revealHandler(req, res);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(400).json({ error: 'Choose a supported account view.' });
  };
}
