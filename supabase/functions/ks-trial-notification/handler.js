export async function authorizeTrialBackend(req, { serviceKey, supabaseUrl, createClient }) {
  const header = req.headers.get('authorization') || '';
  if (serviceKey && header === `Bearer ${serviceKey}`) return true;
  const token = header.match(/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/)?.[1];
  if (!token || token.length > 8192 || !supabaseUrl) return false;
  try {
    const caller = createClient(supabaseUrl, token, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await caller.from('ks_trial_requests').select('id', { head: true }).limit(1);
    return !error;
  } catch { return false; }
}

export async function handleTrialNotification(req, options) {
  const { admin, serviceKey, resendKey, fetchImpl = fetch, now = Date.now } = options;
  const reply = (status, body) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  if (req.method !== 'POST') return reply(405, { success: false, error: 'Method not allowed' });
  if (!serviceKey || !resendKey) return reply(503, { success: false, error: 'Trial email is not configured' });
  if (!(await options.authorize(req))) return reply(401, { success: false, error: 'Unauthorized' });
  let trialId;
  try {
    const text = await req.text();
    if (text.length > 4096) return reply(413, { success: false, error: 'Request too large' });
    trialId = JSON.parse(text)?.trialId;
  } catch { return reply(400, { success: false, error: 'Invalid request' }); }
  if (typeof trialId !== 'string' || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(trialId)) {
    return reply(400, { success: false, error: 'Invalid trial request' });
  }
  try {
    const { data: trial, error } = await admin.from('ks_trial_requests')
      .select('user_id,customer_email,livemode,activated').eq('id', trialId).maybeSingle();
    if (error) throw new Error('request_lookup_failed');
    if (!trial) return reply(404, { success: false, error: 'Saved trial request not found' });
    if (trial.livemode && !trial.activated) return reply(409, { success: false, error: 'Trial setup is pending' });
    const { data: authData, error: authError } = await admin.auth.admin.getUserById(trial.user_id);
    const owner = authData?.user;
    if (authError || !owner?.email_confirmed_at || owner.email?.toLowerCase() !== trial.customer_email) {
      return reply(409, { success: false, error: 'The trial email address needs verification' });
    }
    for (const kind of ['support', 'customer']) {
      const { data: notification, error: prepareError } = await admin.rpc('ks_prepare_trial_email', { p_trial_id: trialId, p_kind: kind });
      if (prepareError || !notification?.send_payload) throw new Error('prepare_failed');
      if (notification.sent_at) continue;
      const started = Date.parse(notification.first_attempt_at);
      if (!Number.isFinite(started) || now() - started >= 23 * 60 * 60 * 1000) {
        return reply(503, { success: false, error: 'Trial email needs manual reconciliation' });
      }
      const expectedRecipient = kind === 'support' ? 'support@kristalstream.com' : trial.customer_email;
      const payload = notification.send_payload;
      if (!Array.isArray(payload.to) || payload.to.length !== 1 || payload.to[0] !== expectedRecipient
          || payload.from !== 'Kristal Streams <noreply@kristalstream.com>'
          || notification.idempotency_key !== `ks-trial-email/v1/${trialId}/${kind}`) throw new Error('invalid_prepared_email');
      const response = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST', headers: {
          Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json',
          'Idempotency-Key': notification.idempotency_key,
        }, body: JSON.stringify(payload), signal: AbortSignal.timeout(8000),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || typeof result.id !== 'string' || !result.id) throw new Error('provider_failed');
      const { data: saved, error: saveError } = await admin.from('ks_trial_email_state')
        .update({ sent_at: new Date(now()).toISOString(), resend_email_id: result.id })
        .eq('trial_id', trialId).eq('kind', kind).select('sent_at').single();
      if (saveError || !saved?.sent_at) throw new Error('record_failed');
    }
    return reply(200, { success: true, test_mode: !trial.livemode });
  } catch {
    console.error('Trial notification requires retry.', { trialId });
    return reply(503, { success: false, error: 'Trial request is saved; retry its email notification' });
  }
}
