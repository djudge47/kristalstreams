// The receipt-only protocol sends a support alert about a saved pending order,
// never a streaming-ready message. It requires the separately reviewed SQL.
const reply = (status, body) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
const email = value => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
function safePayload(payload, testMode) {
  return payload && Object.keys(payload).sort().join(',') === 'from,reply_to,subject,text,to'
    && payload.from === 'Kristal Streams <noreply@kristalstream.com>'
    && Array.isArray(payload.to) && payload.to.length === 1 && payload.to[0] === 'support@kristalstream.com'
    && email(payload.reply_to) && typeof payload.subject === 'string' && payload.subject.length <= 200
    && !/[\r\n]/.test(payload.subject) && payload.subject.startsWith(testMode ? 'TEST PAYMENT - Setup pending' : 'PAID ORDER - Setup pending')
    && typeof payload.text === 'string' && payload.text.length > 0 && payload.text.length <= 8192;
}
export async function handlePendingOrderNotification(req, options) {
  const { admin, serviceKey, resendKey, fetchImpl = fetch, now = Date.now } = options;
  if (req.method !== 'POST') return reply(405, { success: false, error: 'Method not allowed' });
  if (!serviceKey || !resendKey) return reply(503, { success: false, error: 'Pending order email is not configured' });
  let authorized = false;
  try { authorized = await (options.authorize || (request => request.headers.get('authorization') === `Bearer ${serviceKey}`))(req); } catch { /* fail closed */ }
  if (!authorized) return reply(401, { success: false, error: 'Unauthorized' });
  let sessionId;
  try {
    const raw = await req.text();
    if (raw.length > 4096) return reply(413, { success: false, error: 'Request too large' });
    const body = JSON.parse(raw);
    if (!body || Object.keys(body).join(',') !== 'sessionId') throw new Error('invalid_request');
    sessionId = body.sessionId;
    if (typeof sessionId !== 'string' || sessionId.length > 200 || !/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) throw new Error('invalid_request');
  } catch { return reply(400, { success: false, error: 'Invalid request' }); }
  try {
    const { data: receipt, error: lookupError } = await admin.from('ks_payment_receipts')
      .select('user_id,livemode').eq('checkout_session_id', sessionId).maybeSingle();
    if (lookupError) throw new Error('receipt_lookup_failed');
    if (!receipt) return reply(404, { success: false, error: 'Recorded payment not found' });
    if (!/^[0-9a-f-]{36}$/i.test(receipt.user_id || '') || typeof receipt.livemode !== 'boolean') throw new Error('invalid_receipt');
    const { data: account, error: accountError } = await admin.auth.admin.getUserById(receipt.user_id);
    if (accountError || account?.user?.id !== receipt.user_id || !email(account.user.email)) throw new Error('customer_unavailable');
    const { data: alert, error: prepareError } = await admin.rpc('ks_prepare_pending_order_alert', {
      p_session_id: sessionId, p_user_id: receipt.user_id, p_customer_email: account.user.email,
    });
    if (prepareError || alert?.ok !== true || alert.reference !== sessionId || alert.test_mode !== !receipt.livemode) throw new Error('pending_alert_unavailable');
    if (['already_sent', 'legacy_already_sent'].includes(alert.status)) {
      return reply(200, { success: true, already_sent: true, test_mode: alert.test_mode });
    }
    if (alert.status === 'requires_review') return reply(409, { success: false, error: 'Pending order alert requires manual review' });
    if (alert.status !== 'prepared' || !safePayload(alert.send_payload, alert.test_mode)) throw new Error('invalid_pending_alert');
    const started = Date.parse(alert.first_attempt_at);
    // Resend deduplicates for 24h. Stop earlier if an accepted send may not have
    // been recorded; never generate a fresh key or modify the frozen body.
    if (!Number.isFinite(started) || started > now() + 60000 || now() - started >= 23 * 60 * 60 * 1000) {
      return reply(503, { success: false, error: 'Pending order alert requires manual reconciliation' });
    }
    const response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json',
        'Idempotency-Key': `ks-setup-pending/v1/${sessionId}` },
      body: JSON.stringify(alert.send_payload),
    });
    const sent = await response.json().catch(() => ({}));
    if (!response.ok || typeof sent.id !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(sent.id)) throw new Error('email_not_confirmed');
    const { data: saved, error: saveError } = await admin.rpc('ks_complete_pending_order_alert', {
      p_session_id: sessionId, p_email_id: sent.id,
    });
    if (saveError || saved?.ok !== true || saved.reference !== sessionId || saved.status !== 'sent') throw new Error('email_receipt_not_saved');
    return reply(200, { success: true, test_mode: alert.test_mode });
  } catch {
    return reply(503, { success: false, error: 'Pending order email could not be confirmed; retry only this notification' });
  }
}
