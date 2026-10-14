// Validate alternate server JWTs against the private receipt table, rather than
// requiring their encoded text to match the runtime's default service key.
// The deployed function also retains verify_jwt=true at the Supabase gateway.
export async function authorizeOrderBackend(req, { serviceKey, supabaseUrl, createClient }) {
  const header = req.headers.get('authorization') || '';
  if (serviceKey && header === `Bearer ${serviceKey}`) return true;
  const token = header.match(/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/)?.[1];
  if (!token || token.length > 8192 || !supabaseUrl) return false;
  try {
    const caller = createClient(supabaseUrl, token, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    // anon and authenticated have no SELECT grant on this table. The caller's
    // own key is used for both apikey and Authorization; no admin key is mixed in.
    const { error } = await caller.from('ks_payment_receipts')
      .select('checkout_session_id', { head: true }).limit(1);
    return !error;
  } catch { return false; }
}

// Called only by the payment backend after a confirmed receipt is stored.
export async function handleOrderNotification(req, options) {
  const { admin, serviceKey, resendKey, fetchImpl = fetch, now = Date.now } = options;
  const response = (status, body) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  if (req.method !== 'POST') return response(405, { success: false, error: 'Method not allowed' });
  if (!serviceKey || !resendKey) return response(503, { success: false, error: 'Order email is not configured' });
  if (!(await (options.authorize || ((request) => request.headers.get('authorization') === `Bearer ${serviceKey}`))(req))) {
    return response(401, { success: false, error: 'Unauthorized' });
  }
  let sessionId;
  try {
    const text = await req.text();
    if (text.length > 4096) return response(413, { success: false, error: 'Request too large' });
    sessionId = JSON.parse(text)?.sessionId;
  } catch { return response(400, { success: false, error: 'Invalid request' }); }
  if (typeof sessionId !== 'string' || !/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) {
    return response(400, { success: false, error: 'Invalid checkout session' });
  }

  try {
    const { data: receipt, error: receiptError } = await admin.from('ks_payment_receipts')
      .select('user_id,livemode,activated').eq('checkout_session_id', sessionId).maybeSingle();
    if (receiptError) throw new Error('receipt_lookup_failed');
    if (!receipt) return response(404, { success: false, error: 'Confirmed receipt not found' });
    if (receipt.livemode && !receipt.activated) return response(409, { success: false, error: 'Account activation is pending' });
    const { data: userData, error: userError } = await admin.auth.admin.getUserById(receipt.user_id);
    if (userError || !userData?.user?.email) throw new Error('customer_lookup_failed');
    const { data: notification, error: prepareError } = await admin.rpc('ks_prepare_order_email', {
      p_session_id: sessionId, p_customer_email: userData.user.email,
    });
    if (prepareError || !notification?.send_payload) throw new Error('notification_prepare_failed');
    if (notification.sent_at) return response(200, { success: true, already_sent: true, test_mode: notification.test_mode });
    const startedAt = Date.parse(notification.first_attempt_at);
    // Resend keeps idempotency keys for 24h. Stop ambiguous retries before that expires.
    if (!Number.isFinite(startedAt) || now() - startedAt >= 23 * 60 * 60 * 1000) {
      console.error('Order email requires manual reconciliation', { code: 'retry_window_expired', sessionId });
      return response(503, { success: false, error: 'Order email needs manual reconciliation' });
    }
    const emailResponse = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `ks-order-email/v1/${sessionId}`,
      },
      body: JSON.stringify(notification.send_payload),
      signal: AbortSignal.timeout(8000),
    });
    const emailResult = await emailResponse.json().catch(() => ({}));
    if (!emailResponse.ok || typeof emailResult.id !== 'string' || !emailResult.id) {
      console.error('Order email provider rejected request', { status: emailResponse.status });
      return response(503, { success: false, error: 'Email provider did not confirm the order alert' });
    }
    const { data: saved, error: saveError } = await admin.from('ks_order_email_state')
      .update({ sent_at: new Date(now()).toISOString(), resend_email_id: emailResult.id })
      .eq('checkout_session_id', sessionId).select('sent_at').single();
    if (saveError || !saved?.sent_at) throw new Error('notification_record_failed');
    return response(200, { success: true, test_mode: notification.test_mode });
  } catch {
    console.error('Order email attempt failed; payment receipt remains recorded', { sessionId });
    return response(503, { success: false, error: 'Unable to confirm the order email; retry this notification' });
  }
}
