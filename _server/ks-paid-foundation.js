import { loginEncryptionKey } from './ks-login-envelope.js';

export function createPaidFoundationHandler({ createClient, env = process.env } = {}) {
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('Vary', 'Authorization');
    if (env.VERCEL_ENV !== 'preview') return res.status(404).json({ error: 'Foundation review is available in Preview only.' });
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Provider activation remains disabled.' }); }
    const token = typeof req.headers?.authorization === 'string' && /^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];
    if (!token) return res.status(401).json({ error: 'Please sign in to your admin account.' });
    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({ error: 'Foundation review is unavailable.' });
    try {
      const { data, error } = await createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, options).auth.getUser(token); const user = data?.user;
      if (error || !user?.id) return res.status(401).json({ error: 'Please sign in again.' });
      if (user.is_anonymous || !user.email_confirmed_at || user.email?.trim().toLowerCase() !== 'djudge47@gmail.com') return res.status(403).json({ error: 'Administrator access is required.' });
      const { data: status, error: dbError } = await createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options).rpc('ks_preview_provisioning_foundation_status');
      if (dbError || status?.version !== 1 || status.durableAttempts !== true || status.encryptedLoginTable !== true || status.browserAccessRevoked !== true) throw new Error('foundation_unavailable');
      let encryptionConfigured = false;
      try { loginEncryptionKey(env); encryptionConfigured = true; } catch { /* Configuration only; never return key material. */ }
      return res.status(200).json({ foundation: { version: 1, durableAttempts: true, browserAccessRevoked: true,
        encryptedLoginTable: true, encryptionConfigured, ownerOnlyHandoffImplemented: true, providerExecutionEnabled: false,
        liveTestReady: false, note: 'Live provider execution, fresh execution checks and separate credit approval are still required.' } });
    } catch { return res.status(503).json({ error: 'The setup foundation could not be verified. No account or provider state was changed.' }); }
  };
}
