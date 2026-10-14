const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

export function createTrialHandler({ createClient, env = process.env }) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
    const token = typeof req.headers?.authorization === 'string'
      && /^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];
    if (!token) return res.status(401).json({ error: 'Please sign in before requesting your trial.' });
    const url = env.VITE_SUPABASE_URL;
    const anonKey = env.VITE_SUPABASE_ANON_KEY;
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anonKey || !serviceKey) return res.status(503).json({ error: 'Trial requests are temporarily unavailable. Please contact support.' });
    const fullName = req.body?.fullName;
    if (fullName !== undefined && (typeof fullName !== 'string' || fullName.trim().length > 120)) {
      return res.status(400).json({ error: 'Please enter a name of 120 characters or fewer.' });
    }
    try {
      const auth = createClient(url, anonKey, clientOptions);
      const { data, error } = await auth.auth.getUser(token);
      const user = data?.user;
      if (error || !user?.id || !user.email) return res.status(401).json({ error: 'Please sign in again before requesting your trial.' });
      if (!user.email_confirmed_at) return res.status(403).json({ error: 'Please confirm your email address before requesting a trial.' });
      const admin = createClient(url, serviceKey, clientOptions);
      const { data: trial, error: trialError } = await admin.rpc('ks_request_trial', {
        p_user_id: user.id, p_customer_email: user.email.trim().toLowerCase(),
        p_full_name: fullName?.trim() || null, p_livemode: env.VERCEL_ENV === 'production',
      });
      if (trialError) {
        if (trialError.message === 'trial_already_used') return res.status(409).json({ error: 'This account has already used its free trial. View our plans or contact support.' });
        if (trialError.message === 'paid_account') return res.status(409).json({ error: 'Your account already has a paid plan. Visit your dashboard or contact support.' });
        throw new Error('trial_record_failed');
      }
      if (!trial?.id) throw new Error('trial_record_missing');
      let notified = false;
      try {
        const { data: alert, error: alertError } = await admin.functions.invoke('ks-trial-notification', { body: { trialId: trial.id } });
        notified = !alertError && alert?.success === true;
      } catch { /* The saved request can be retried without restarting the trial. */ }
      return res.status(200).json({
        ok: true, test_mode: env.VERCEL_ENV !== 'production',
        trial: { id: trial.id, expires_at: trial.expires_at, already_requested: trial.already_requested === true },
        notification_status: notified ? 'sent' : 'pending',
        message: notified ? 'Your trial request has been received.' : 'Your trial request is saved, but its email confirmation is delayed. Please contact support if you need help.',
      });
    } catch {
      console.error('Trial request could not be recorded.');
      return res.status(503).json({ error: 'We could not confirm your trial request. Please try again or contact support.' });
    }
  };
}
