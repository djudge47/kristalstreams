import assert from 'node:assert/strict';
import { handlePendingOrderNotification as handle } from '../supabase/functions/ks-order-notification/pending-handler.js';
const sessionId = 'cs_test_FictionalPendingEmail';
const owner = '00000000-0000-4000-8000-000000000001';
const clock = Date.parse('2026-10-18T04:00:00Z');
function fixture(change = {}) {
  const state = { calls: 0, sends: [], completions: 0, status: 'prepared', providerStatus: 200, ...change };
  const payload = { from: 'Kristal Streams <noreply@kristalstream.com>', to: ['support@kristalstream.com'],
    reply_to: 'fictional@example.invalid', subject: `${state.live ? 'PAID ORDER' : 'TEST PAYMENT'} - Setup pending - Kristal Streams`, text: 'Payment received. Setup is pending.' };
  const admin = {
    from: table => { assert.equal(table, 'ks_payment_receipts'); state.calls++; return {
      select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: state.noReceipt ? null : { user_id: owner, livemode: !!state.live }, error: null }),
    }; },
    auth: { admin: { getUserById: async id => { assert.equal(id, owner); return { data: { user: { id: state.wrongOwner ? 'wrong' : owner, email: state.email || 'fictional@example.invalid' } }, error: null }; } } },
    rpc: async (name, args) => {
      assert.equal(args.p_session_id, sessionId);
      if (name === 'ks_prepare_pending_order_alert') {
        assert.equal(args.p_user_id, owner);
        return { data: { ok: true, reference: sessionId, test_mode: !state.live, status: state.sent ? 'already_sent' : state.status,
          first_attempt_at: new Date(state.started ?? clock).toISOString(), send_payload: payload, ...state.alert }, error: state.prepareError || null };
      }
      assert.equal(name, 'ks_complete_pending_order_alert'); state.completions++;
      assert.equal(args.p_email_id, 'mail-fictional');
      if (state.failSave) return { data: null, error: { code: 'offline' } };
      state.sent = true; return { data: { ok: true, reference: sessionId, status: 'sent', ...state.saved }, error: null };
    },
  };
  const options = { admin, serviceKey: 'fixture-service-key', resendKey: 'fixture-email-key', now: () => clock,
    fetchImpl: async (url, config) => { assert.equal(url, 'https://api.resend.com/emails'); assert.equal(config.redirect, 'error');
      state.sends.push(config); if (state.networkError) throw new Error('timeout');
      return Response.json({ id: 'mail-fictional' }, { status: state.providerStatus }); },
  };
  return { state, options, payload };
}
const request = (body = { sessionId }, token = 'fixture-service-key') => new Request('https://example.invalid', {
  method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body),
});
let count = 0;
async function check(label, fn) { await fn(); count++; console.log(`PASS: ${label}`); }
await check('unauthorized or failed authorization cannot read a receipt or send', async () => {
  const f = fixture(); assert.equal((await handle(request(undefined, 'customer-token'), f.options)).status, 401);
  f.options.authorize = () => { throw new Error('unavailable'); };
  assert.equal((await handle(request(), f.options)).status, 401); assert.equal(f.state.calls, 0); assert.equal(f.state.sends.length, 0);
});
await check('missing email configuration stops before reading payments', async () => {
  const f = fixture(); f.options.resendKey = ''; assert.equal((await handle(request(), f.options)).status, 503); assert.equal(f.state.calls, 0);
});
await check('wrong methods, malformed bodies and recipient overrides are rejected', async () => {
  const f = fixture(); assert.equal((await handle(new Request('https://example.invalid'), f.options)).status, 405);
  for (const body of [null, {}, { sessionId: 'invalid' }, { sessionId, to: 'other@example.invalid' }]) assert.equal((await handle(request(body), f.options)).status, 400);
  assert.equal(f.state.calls, 0);
});
await check('unknown receipts and changed owner identity never send', async () => {
  const missing = fixture({ noReceipt: true }); assert.equal((await handle(request(), missing.options)).status, 404);
  const other = fixture({ wrongOwner: true }); assert.equal((await handle(request(), other.options)).status, 503); assert.equal(other.state.sends.length, 0);
});
await check('an unactivated live payment can send a pending alert to support', async () => {
  const f = fixture({ live: true }); const r = await handle(request(), f.options);
  assert.equal(r.status, 200); assert.equal((await r.json()).test_mode, false);
  assert.match(JSON.parse(f.state.sends[0].body).subject, /^PAID ORDER - Setup pending/);
  assert.deepEqual(JSON.parse(f.state.sends[0].body).to, ['support@kristalstream.com']);
});
await check('sandbox alerts are explicitly labelled as test payments', async () => {
  const f = fixture(); assert.equal((await handle(request(), f.options)).status, 200);
  assert.match(JSON.parse(f.state.sends[0].body).subject, /^TEST PAYMENT - Setup pending/);
});
await check('wrong saved reference, mode or failed preparation never sends', async () => {
  for (const change of [{ alert: { reference: 'cs_test_Other' } }, { alert: { test_mode: false } }, { prepareError: { code: 'offline' } }]) {
    const f = fixture(change); assert.equal((await handle(request(), f.options)).status, 503); assert.equal(f.state.sends.length, 0);
  }
});
await check('unsafe saved recipients, headers, payload keys and ready subjects are rejected', async () => {
  for (const change of [{ to: ['other@example.invalid'] }, { subject: 'Streaming ready' }, { subject: 'TEST PAYMENT - Setup pending\r\nBcc: other' },
    { reply_to: 'bad\r\nheader@example.invalid' }, { html: '<p>unexpected</p>' }]) {
    const f = fixture(); Object.assign(f.payload, change);
    assert.equal((await handle(request(), f.options)).status, 503); assert.equal(f.state.sends.length, 0);
  }
});
await check('confirmed deliveries and prior legacy deliveries suppress another email', async () => {
  for (const status of ['already_sent', 'legacy_already_sent']) {
    const f = fixture({ status }); const r = await handle(request(), f.options);
    assert.equal(r.status, 200); assert.equal((await r.json()).already_sent, true); assert.equal(f.state.sends.length, 0);
  }
});
await check('review-blocked orders never send or authorize setup', async () => {
  const f = fixture({ status: 'requires_review' }); assert.equal((await handle(request(), f.options)).status, 409); assert.equal(f.state.sends.length, 0);
});
await check('provider rejection and network uncertainty do not record a delivery', async () => {
  for (const change of [{ providerStatus: 503 }, { networkError: true }]) {
    const f = fixture(change); assert.equal((await handle(request(), f.options)).status, 503); assert.equal(f.state.completions, 0);
  }
});
await check('lost database acknowledgement keeps the same provider key and frozen body', async () => {
  const f = fixture({ failSave: true }); assert.equal((await handle(request(), f.options)).status, 503);
  f.state.failSave = false; f.state.email = 'changed@example.invalid';
  assert.equal((await handle(request(), f.options)).status, 200);
  assert.equal(f.state.sends[0].headers['Idempotency-Key'], f.state.sends[1].headers['Idempotency-Key']);
  assert.equal(f.state.sends[0].body, f.state.sends[1].body);
  assert.equal((await handle(request(), f.options)).status, 200); assert.equal(f.state.sends.length, 2);
});
await check('old ambiguous retries and invalid future timestamps stop before sending', async () => {
  for (const started of [clock - 23 * 3600000, clock + 61000]) {
    const f = fixture({ started }); assert.equal((await handle(request(), f.options)).status, 503); assert.equal(f.state.sends.length, 0);
  }
});
await check('concurrent requests reuse one provider deduplication identity', async () => {
  const f = fixture(); const deliveries = new Map();
  f.options.fetchImpl = async (url, config) => { const key = config.headers['Idempotency-Key'];
    if (deliveries.has(key)) assert.equal(deliveries.get(key), config.body); else deliveries.set(key, config.body);
    return Response.json({ id: 'mail-fictional' }); };
  const results = await Promise.all([handle(request(), f.options), handle(request(), f.options)]);
  assert.ok(results.every(r => r.status === 200)); assert.equal(deliveries.size, 1);
});
await check('a mismatched saved delivery reply cannot claim success', async () => {
  const f = fixture({ saved: { reference: 'cs_test_Other' } }); assert.equal((await handle(request(), f.options)).status, 503);
});
console.log(`${count} pending-order email checks passed. All requests were simulated; no real email, payment or provider call occurred.`);
