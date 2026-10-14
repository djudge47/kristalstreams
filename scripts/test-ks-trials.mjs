import assert from 'node:assert/strict';
import { createTrialHandler } from '../_server/ks-trials.js';
import trialEndpoint from '../api/start-demo.js';
import { handleTrialNotification, authorizeTrialBackend } from '../supabase/functions/ks-trial-notification/handler.js';

const userId = '11111111-1111-4111-8111-111111111111';
const trialId = '22222222-2222-4222-8222-222222222222';
const clock = Date.parse('2026-10-14T20:00:00Z');
let passed = 0;
async function check(name, fn) { await fn(); passed++; console.log(`PASS: ${name}`); }

function apiFixture(overrides = {}) {
  const state = { rpcs: [], invokes: [], clientKeys: [] };
  const user = { id: userId, email: 'owner@example.test', email_confirmed_at: new Date(clock).toISOString(), ...overrides.user };
  const admin = {
    auth: { admin: new Proxy({}, { get() { throw new Error('Signup must never use admin password or account operations'); } }) },
    rpc: async (name, args) => { state.rpcs.push({ name, args }); return overrides.rpcError ? { error: { message: overrides.rpcError } } : { data: { id: trialId, expires_at: new Date(clock + 129600000).toISOString(), already_requested: !!overrides.existing } }; },
    functions: { invoke: async (name, options) => { state.invokes.push({ name, options }); return overrides.emailError ? { error: new Error('provider-secret-do-not-disclose') } : { data: { success: true } }; } },
  };
  const env = { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'public-key', SUPABASE_SERVICE_ROLE_KEY: 'private-key', VERCEL_ENV: 'preview', ...overrides.env };
  const createClient = (_url, key) => {
    state.clientKeys.push(key);
    return key === 'public-key' ? { auth: { getUser: async token => {
      assert.equal(token, 'verified-access-token'); return overrides.invalidAuth ? { error: new Error('invalid') } : { data: { user } };
    } } } : admin;
  };
  const handler = createTrialHandler({ createClient, env });
  const call = async (req = {}) => {
    const res = { headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(s) { this.code=s;return this; }, json(b) { this.body=b;return this; } };
    await handler({ method: 'POST', headers: { authorization: 'Bearer verified-access-token' }, body: { fullName: 'Test Owner' }, ...req }, res);
    assert.equal(res.headers['Cache-Control'], 'no-store');
    return res;
  };
  return { state, call };
}

function mailFixture(overrides = {}) {
  const state = { sends: [], saved: {}, frozen: {}, prepares: [], dbReads: 0, failSave: !!overrides.failSave, failCustomer: !!overrides.failCustomer };
  const trial = { user_id: userId, customer_email: 'owner@example.test', livemode: false, activated: false, ...overrides.trial };
  const owner = { email: 'owner@example.test', email_confirmed_at: new Date(clock).toISOString(), ...overrides.owner };
  const admin = {
    auth: { admin: { getUserById: async id => { assert.equal(id,userId);return { data: { user: owner } }; } } },
    from(table) {
      if (table === 'ks_trial_requests') return { select: () => ({ eq: () => ({ maybeSingle: async () => { state.dbReads++;return { data: overrides.missing ? null : trial }; } }) }) };
      assert.equal(table, 'ks_trial_email_state');
      return { update: body => ({ eq: (key,id) => { assert.equal(key,'trial_id');assert.equal(id,trialId);return { eq: (_kind,kind) => ({ select: () => ({ single: async () => {
        if (state.failSave) return { error: new Error('database failure') };
        state.saved[kind]=body.sent_at;return { data: { sent_at: body.sent_at } };
      } }) }) }; } }) };
    },
    rpc: async (name,args) => {
      assert.equal(name,'ks_prepare_trial_email');assert.equal(args.p_trial_id,trialId);
      const kind=args.p_kind;state.prepares.push(kind);
      state.frozen[kind] ||= {
        send_payload: { from: 'Kristal Streams <noreply@kristalstream.com>', to: [overrides.badRecipient || (kind==='support' ? 'support@kristalstream.com' : trial.customer_email)],
          subject: trial.livemode ? 'Trial request' : 'TEST TRIAL REQUEST', text: 'Streaming setup requires separate instructions. No password is included.' },
        first_attempt_at: new Date(overrides.startedAt ?? clock).toISOString(), idempotency_key: `ks-trial-email/v1/${trialId}/${kind}`,
      };
      return { data: { ...state.frozen[kind], sent_at: state.saved[kind] || null } };
    },
  };
  const options = { admin, serviceKey: 'server-key', resendKey: overrides.noKey ? '' : 'fake-resend-key', now: () => clock,
    authorize: async req => req.headers.get('authorization') === 'Bearer server-key',
    fetchImpl: async (url,request) => {
      assert.equal(url,'https://api.resend.com/emails');state.sends.push(request);
      const isCustomer=JSON.parse(request.body).to[0]===trial.customer_email;
      return isCustomer && state.failCustomer ? Response.json({ error: 'retry' },{status:503}) : Response.json({id:'email-confirmed'});
    },
  };
  return { state, options };
}
const request = (extra = {}, token = 'server-key') => new Request('https://example.test/notification', {
  method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({trialId,...extra}),
});

await check('the deployed API entrypoint blocks unsigned password-reset attempts', async () => {
  const res = { setHeader() {}, status(code) { this.code=code;return this; }, json(body) { this.body=body;return this; } };
  await trialEndpoint({method:'POST',headers:{},body:{email:'victim@example.test',password:'attempted-reset'}},res);
  assert.equal(res.code,401);
});

await check('anonymous trial calls cannot create accounts or reset passwords', async () => {
  const f=apiFixture();assert.equal((await f.call({headers:{},body:{email:'victim@example.test',password:'takeover-attempt'}})).code,401);
  assert.equal(f.state.clientKeys.length,0);assert.equal(f.state.rpcs.length,0);
});
await check('invalid sessions and unconfirmed addresses cannot request trials', async () => {
  for (const options of [{invalidAuth:true},{user:{email_confirmed_at:null}}]) {
    const f=apiFixture(options);assert.ok([401,403].includes((await f.call()).code));assert.equal(f.state.rpcs.length,0);
  }
});
await check('owner identity and environment come from trusted server inputs', async () => {
  const f=apiFixture();const r=await f.call({body:{fullName:'Owner',email:'victim@example.test',user_id:'victim',password:'not-used',livemode:true}});
  assert.equal(r.code,200);assert.deepEqual(f.state.rpcs[0],{name:'ks_request_trial',args:{p_user_id:userId,p_customer_email:'owner@example.test',p_full_name:'Owner',p_livemode:false}});
  assert.deepEqual(f.state.invokes[0].options.body,{trialId});
});
await check('production requests use the production trial record', async () => {
  const f=apiFixture({env:{VERCEL_ENV:'production'}});const r=await f.call();assert.equal(r.body.test_mode,false);assert.equal(f.state.rpcs[0].args.p_livemode,true);
});
await check('paid accounts and used trials are rejected without sending email', async () => {
  for (const rpcError of ['paid_account','trial_already_used']) {
    const f=apiFixture({rpcError});assert.equal((await f.call()).code,409);assert.equal(f.state.invokes.length,0);
  }
});
await check('database failure never reports a saved request', async () => {
  const f=apiFixture({rpcError:'private database error'});const r=await f.call();assert.equal(r.code,503);assert.ok(!r.body.error.includes('private database'));assert.equal(f.state.invokes.length,0);
});
await check('an email failure honestly reports saved request with pending notification', async () => {
  const f=apiFixture({emailError:true,existing:true});const r=await f.call();assert.equal(r.code,200);assert.equal(r.body.notification_status,'pending');assert.equal(r.body.trial.already_requested,true);assert.ok(!JSON.stringify(r.body).includes('provider-secret'));
});
await check('oversized names and unsupported methods cannot write a request', async () => {
  const f=apiFixture();assert.equal((await f.call({body:{fullName:'x'.repeat(121)}})).code,400);assert.equal((await f.call({method:'GET'})).code,405);assert.equal(f.state.rpcs.length,0);
});
await check('unauthorized notification callers cannot read trials or send mail', async () => {
  const f=mailFixture();assert.equal((await handleTrialNotification(request({},'wrong'),f.options)).status,401);assert.equal(f.state.dbReads,0);assert.equal(f.state.sends.length,0);
});
await check('unknown requests and unactivated live trials cannot send notifications', async () => {
  for (const options of [{missing:true},{trial:{livemode:true,activated:false}}]) {
    const f=mailFixture(options);assert.ok([404,409].includes((await handleTrialNotification(request(),f.options)).status));assert.equal(f.state.sends.length,0);
  }
});
await check('only the saved verified customer address is eligible for acknowledgment', async () => {
  for (const owner of [{email:'different@example.test'},{email_confirmed_at:null}]) {
    const f=mailFixture({owner});assert.equal((await handleTrialNotification(request(),f.options)).status,409);assert.equal(f.state.sends.length,0);
  }
});
await check('Preview sends clearly marked support and customer tests to fixed recipients', async () => {
  const f=mailFixture();assert.equal((await handleTrialNotification(request({to:'attacker@example.test',livemode:true}),f.options)).status,200);
  assert.deepEqual(f.state.sends.map(s=>JSON.parse(s.body).to[0]),['support@kristalstream.com','owner@example.test']);
  for (const send of f.state.sends) assert.match(JSON.parse(send.body).subject,/^TEST/);
});
await check('repeated notifications skip both already sent messages', async () => {
  const f=mailFixture();await handleTrialNotification(request(),f.options);await handleTrialNotification(request(),f.options);assert.equal(f.state.sends.length,2);
});
await check('partial failure retries only the unfinished message with the same body and key', async () => {
  const f=mailFixture({failCustomer:true});assert.equal((await handleTrialNotification(request(),f.options)).status,503);
  f.state.failCustomer=false;assert.equal((await handleTrialNotification(request(),f.options)).status,200);assert.equal(f.state.sends.length,3);
  assert.equal(f.state.sends[1].body,f.state.sends[2].body);assert.equal(f.state.sends[1].headers['Idempotency-Key'],f.state.sends[2].headers['Idempotency-Key']);
});
await check('database failure after sending preserves provider deduplication on retry', async () => {
  const f=mailFixture({failSave:true});assert.equal((await handleTrialNotification(request(),f.options)).status,503);f.state.failSave=false;
  assert.equal((await handleTrialNotification(request(),f.options)).status,200);assert.equal(f.state.sends[0].body,f.state.sends[1].body);assert.equal(f.state.sends[0].headers['Idempotency-Key'],f.state.sends[1].headers['Idempotency-Key']);
});
await check('ambiguous retries stop before the provider deduplication window expires', async () => {
  const f=mailFixture({startedAt:clock-23*60*60*1000});assert.equal((await handleTrialNotification(request(),f.options)).status,503);assert.equal(f.state.sends.length,0);
});
await check('missing mail configuration and a tampered recipient cannot send mail', async () => {
  for(const options of [{noKey:true},{badRecipient:'attacker@example.test'}]) {const f=mailFixture(options);assert.equal((await handleTrialNotification(request(),f.options)).status,503);assert.equal(f.state.sends.length,0);}
});
await check('alternate server JWT uses its own private-table permissions', async () => {
  let probes=0;const options={serviceKey:'runtime-key',supabaseUrl:'https://example.supabase.co',createClient:(_url,key)=>{
    assert.equal(key,'alternate.server.jwt');return{from:table=>{assert.equal(table,'ks_trial_requests');return{select:(_cols,opts)=>{assert.equal(opts.head,true);return{limit:async()=>{probes++;return{error:null};}};}};}};
  }};
  assert.equal(await authorizeTrialBackend(request({},'alternate.server.jwt'),options),true);assert.equal(probes,1);
  options.createClient=()=>({from:()=>({select:()=>({limit:async()=>({error:{code:'42501'}})})})});
  for(const token of ['anon.jwt.signature','customer.jwt.signature','invalid']) assert.equal(await authorizeTrialBackend(request({},token),options),false);
});
console.log(`${passed} trial checks passed. No real emails, accounts, payments, or Roomba lines were created.`);
