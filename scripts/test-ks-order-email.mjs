import assert from 'node:assert/strict';
import { handleOrderNotification, authorizeOrderBackend } from '../supabase/functions/ks-order-notification/handler.js';

const sessionId = 'cs_test_example123';
const clock = Date.parse('2026-10-14T04:00:00Z');
function fixture(overrides = {}) {
  const state = { sentAt: null, sends: [], prepares: 0, failSave: false, providerStatus: 200, ...overrides };
  const payload = { from: 'Kristal Streams <noreply@kristalstream.com>', to: ['support@kristalstream.com'], subject: 'TEST ORDER - No customer setup needed', text: 'Test receipt', reply_to: 'customer@example.com' };
  const admin = {
    auth: { admin: { getUserById: async () => ({ data: { user: { email: 'customer@example.com' } }, error: null }) } },
    rpc: async (name,args) => { assert.equal(name,'ks_prepare_order_email'); assert.equal(args.p_session_id,sessionId); state.prepares++;
      return { data: { send_payload: payload, first_attempt_at: new Date(state.startedAt ?? clock).toISOString(), sent_at: state.sentAt, test_mode: !state.live }, error: null }; },
    from: table => ({
      select() { return this; },
      eq() { return this; },
      maybeSingle: async () => ({ data: state.noReceipt ? null : { user_id: 'customer-id', livemode: !!state.live, activated: state.active !== false }, error: null }),
      update(values) { assert.equal(table,'ks_order_email_state'); this.values = values; return this; },
      async single() { if (state.failSave) return {data:null,error:{message:'offline'}}; state.sentAt = this.values.sent_at; return {data:{sent_at:state.sentAt},error:null}; },
    }),
  };
  const options = { admin, serviceKey:'test-server-credential', resendKey:'test-provider-credential', now: () => state.now ?? clock,
    fetchImpl: async (url,config) => { assert.equal(url,'https://api.resend.com/emails'); state.sends.push(config);
      return Response.json(state.providerStatus===200 ? {id:'mail-example'} : {error:'temporary'}, {status:state.providerStatus}); },
  };
  return { state, options };
}
const request = (body={sessionId}, token='test-server-credential') => new Request('https://example.invalid', {method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)});
let passed = 0;
async function check(name,run) { await run(); passed++; console.log(`PASS: ${name}`); }
await check('unauthorized callers cannot send order email', async () => {const f=fixture(); const r=await handleOrderNotification(request(undefined,'customer-token'),f.options); assert.equal(r.status,401);assert.equal(f.state.prepares,0);assert.equal(f.state.sends.length,0);});
await check('unknown payment receipts never send', async () => {const f=fixture({noReceipt:true});assert.equal((await handleOrderNotification(request(),f.options)).status,404);assert.equal(f.state.sends.length,0);});
await check('unactivated live orders never send a ready notification', async () => {const f=fixture({live:true,active:false});assert.equal((await handleOrderNotification(request(),f.options)).status,409);assert.equal(f.state.sends.length,0);});
await check('confirmed sandbox orders send a clearly marked test alert', async () => {const f=fixture();const r=await handleOrderNotification(request(),f.options);assert.equal(r.status,200);assert.equal((await r.json()).test_mode,true);assert.ok(JSON.parse(f.state.sends[0].body).subject.startsWith('TEST'));});
await check('caller cannot override the support recipient', async () => {const f=fixture();await handleOrderNotification(request({sessionId,to:'attacker@example.com'}),f.options);assert.deepEqual(JSON.parse(f.state.sends[0].body).to,['support@kristalstream.com']);});
await check('already sent payments do not send a second email', async () => {const f=fixture();await handleOrderNotification(request(),f.options);const r=await handleOrderNotification(request(),f.options);assert.equal((await r.json()).already_sent,true);assert.equal(f.state.sends.length,1);});
await check('provider failures return a retriable failure', async () => {const f=fixture({providerStatus:503});assert.equal((await handleOrderNotification(request(),f.options)).status,503);assert.equal(f.state.sentAt,null);});
await check('database failures after sending preserve the same provider deduplication key and body', async () => {const f=fixture({failSave:true});assert.equal((await handleOrderNotification(request(),f.options)).status,503);f.state.failSave=false;assert.equal((await handleOrderNotification(request(),f.options)).status,200);assert.equal(f.state.sends[0].headers['Idempotency-Key'],f.state.sends[1].headers['Idempotency-Key']);assert.equal(f.state.sends[0].body,f.state.sends[1].body);});
await check('ambiguous retries stop before provider deduplication expires', async () => {const f=fixture({startedAt:clock-24*60*60*1000});assert.equal((await handleOrderNotification(request(),f.options)).status,503);assert.equal(f.state.sends.length,0);});
await check('missing provider configuration fails before accessing receipts', async () => {const f=fixture();f.options.resendKey='';assert.equal((await handleOrderNotification(request(),f.options)).status,503);assert.equal(f.state.prepares,0);});
await check('alternate server credential is checked with its own database authorization', async () => {
  let probes = 0;
  const authOptions = { serviceKey: 'runtime-server-key', supabaseUrl: 'https://example.supabase.co', createClient: (url, key, config) => {
    assert.equal(key, 'valid.server.signature'); assert.equal(config.auth.persistSession, false);
    return { from: (table) => { assert.equal(table, 'ks_payment_receipts'); return { select: (columns, opts) => {
      assert.equal(columns, 'checkout_session_id'); assert.equal(opts.head, true);
      return { limit: async (n) => { assert.equal(n, 1); probes++; return { error: null }; } };
    } }; } };
  } };
  assert.equal(await authorizeOrderBackend(request(undefined, 'valid.server.signature'), authOptions), true);
  assert.equal(probes, 1);
  const f = fixture(); f.options.authorize = req => authorizeOrderBackend(req, authOptions);
  assert.equal((await handleOrderNotification(request(undefined, 'valid.server.signature'), f.options)).status, 200);
});
await check('customer and invalid credentials cannot use the private notification service', async () => {
  const authOptions = { serviceKey: 'runtime-server-key', supabaseUrl: 'https://example.supabase.co', createClient: () => ({
    from: () => ({ select: () => ({ limit: async () => ({ error: { code: '42501' } }) }) }),
  }) };
  for (const token of ['anon.jwt.signature', 'customer.jwt.signature', 'bad-key', '']) {
    const f = fixture(); f.options.authorize = req => authorizeOrderBackend(req, authOptions);
    assert.equal((await handleOrderNotification(request(undefined, token), f.options)).status, 401);
    assert.equal(f.state.sends.length, 0); assert.equal(f.state.prepares, 0);
  }
  assert.equal(await authorizeOrderBackend(request(undefined, 'broken.jwt.signature'), {
    ...authOptions, createClient: () => { throw new Error('network failure'); },
  }), false);
});
console.log(`${passed} order-email checks passed. No real emails or payments were sent.`);
