import assert from 'node:assert/strict';
import { FormData } from 'undici';
import { createLiveRenewalProvider } from '../_server/ks-crm-renewal-live-provider.js';
import { createLiveRenewalHttpHandler } from '../_server/ks-crm-renewal-live-http.js';

globalThis.fetch = () => { throw Error('External transport forbidden'); };
let checks = 0;
const check = async (name, fn) => { await fn(); checks++; console.log(`PASS: ${name}`); };
const env = { VERCEL_ENV: 'preview', ROOMBA_API_URL: 'https://cdn.rooomba.tv/WDXTMHmN/',
  ROOMBA_API_KEY: 'fictional-api-key', FIXIE_URL: 'http://fixture:fictional-proxy-secret@synthetic.usefixie.com:80',
  KS_CRM_LIVE_RENEWAL_ENABLED: 'true' };
const line = { id: '99999', username: 'fixture_customer', member_id: '88', package_id: '19', exp_date: '1897387200',
  max_connections: '1', is_trial: '0', enabled: '1', admin_enabled: '1', bouquet: '[2,13,18,40]', password: 'do-not-retain-password' };
const form = () => {
  const value = new FormData();
  for (const [k,v] of [['trial','0'],['package','19'],['package_duration','12 months'],['max_connections','1'],
    ['bouquets_selected[]','2'],['bouquets_selected[]','13'],['bouquets_selected[]','18'],['bouquets_selected[]','40']]) value.append(k,v);
  return value;
};
await check('real renewal transport sends exactly one documented edit through TLS Fixie and strips secrets', async () => {
  let calls = 0, closes = 0;
  const provider = createLiveRenewalProvider({ env, dispatcherFactory: target => {
    assert.ok(target.startsWith('https:')); return { dispatch() {}, async close() { closes++; } };
  }, fetchImpl: async (url, options) => {
    calls++; assert.equal(url.origin + url.pathname, env.ROOMBA_API_URL);
    assert.equal(url.searchParams.get('action'), 'edit_line'); assert.equal(url.searchParams.get('id'), line.id);
    assert.equal(options.method, 'POST'); assert.equal(options.redirect, 'manual'); assert.ok(options.signal); assert.ok(options.dispatcher);
    assert.deepEqual([...options.body], [...form()]);
    return new Response(JSON.stringify({ status: 'STATUS_SUCCESS', data: line, api_key: env.ROOMBA_API_KEY }));
  } });
  const result = await provider.renew(line.id, form()); assert.equal(result.id, line.id);
  assert.equal(calls, 1); assert.equal(closes, 1); assert.ok(!JSON.stringify(result).includes(line.password)); assert.ok(!JSON.stringify(result).includes(env.ROOMBA_API_KEY));
});
await check('redirects, HTTP failures, malformed replies, wrong lines and accepted timeouts never retry', async () => {
  for (const fault of ['redirect','failure','html','invalid','wrong_line','timeout']) {
    let calls = 0;
    const provider = createLiveRenewalProvider({ env, dispatcherFactory: () => ({ dispatch() {}, async close() {} }), fetchImpl: async () => {
      calls++; if (fault === 'timeout') throw Error('private-error-with-secret');
      if (fault === 'redirect' || fault === 'failure') return new Response('', { status: fault === 'redirect' ? 307 : 500 });
      return new Response(fault === 'html' ? '<html>private</html>' : fault === 'invalid' ? '{' : JSON.stringify({ status: 'STATUS_SUCCESS', data: { ...line,id:'88888' } }));
    } });
    await assert.rejects(() => provider.renew(line.id, form()), error => error.message === 'live_renewal_result_uncertain'); assert.equal(calls, 1);
  }
});
await check('write switch, malformed forms, IDs and destinations stop before any transport', async () => {
  let calls = 0;
  const settings = { env, fetchImpl: async () => { calls++; throw Error('forbidden'); }, dispatcherFactory: () => ({ dispatch() {} }) };
  const provider = createLiveRenewalProvider(settings);
  for (const field of ['password','username','exp_date','member_id','package_cost','reseller_notes']) {
    const changed = form(); changed.append(field, 'override'); await assert.rejects(() => provider.renew(line.id,changed));
  }
  for (const [field,value] of [['trial','1'],['package_duration','365 days'],['bouquets_selected[]','2']]) {
    const changed = form(); changed.append(field,value); await assert.rejects(() => provider.renew(line.id,changed));
  }
  await assert.rejects(() => provider.renew('1&action=create_line',form()));
  const off = createLiveRenewalProvider({ ...settings, env:{ ...env,KS_CRM_LIVE_RENEWAL_ENABLED:'false' } });
  await assert.rejects(() => off.renew(line.id,form()), /sending_disabled/);
  for (const patch of [{ VERCEL_ENV:'production' },{ ROOMBA_API_URL:'http://cdn.rooomba.tv/WDXTMHmN/' },{ FIXIE_URL:'' },{ ROOMBA_API_KEY:'bad\nkey' }])
    assert.throws(() => createLiveRenewalProvider({ ...settings, env:{ ...env,...patch } }));
  assert.equal(calls, 0);
});
await check('fresh snapshot uses only the three documented reads and retains no provider password or API key', async () => {
  const actions = [];
  const provider = createLiveRenewalProvider({ env, dispatcherFactory: () => ({ dispatch() {}, async close() {} }), fetchImpl: async (url, options) => {
    assert.equal(options.method, 'GET'); const action = url.searchParams.get('action'); actions.push(action);
    const data = action === 'get_line' ? line : action === 'user_info' ? { id: '88',username:'fictional_reseller',credits:'100',api_key:env.ROOMBA_API_KEY }
      : [{ id:'19',package_name:'12 Months + 1 Connection',max_connections:'1',is_official:'1',is_trial:'0',official_duration:'12',official_duration_in:'months',official_credits:'12',bouquets:'[2,13,18,40]' }];
    return new Response(JSON.stringify({ status:'STATUS_SUCCESS',data }));
  } });
  const snapshot = await provider.snapshot({ external_id:line.id }); assert.deepEqual(actions.sort(),['get_line','packages','user_info']);
  assert.equal(snapshot.line.id,line.id); assert.equal(snapshot.packages.length,1); assert.equal(snapshot.account.credits,'100');
  assert.ok(!JSON.stringify(snapshot).includes(line.password)); assert.ok(!JSON.stringify(snapshot).includes(env.ROOMBA_API_KEY));
});
await check('a stale total request budget cannot begin a new provider call', async () => {
  let at = Date.now(), calls = 0;
  const provider = createLiveRenewalProvider({ env, now: () => at, dispatcherFactory: () => { calls++; throw Error('forbidden'); } });
  at += 48000; await assert.rejects(() => provider.renew(line.id,form()), /request_expired/); assert.equal(calls,0);
});

const customerId = '00000000-0000-4000-8000-000000000091';
function http(overrides = {}) {
  const config = { ...env, VITE_SUPABASE_URL:'https://wftfxerblhlsxiijtfbo.supabase.co', VITE_SUPABASE_ANON_KEY:'fictional-anon',
    SUPABASE_SERVICE_ROLE_KEY:'fictional-service',ROOMBA_PREVIEW_SECRET:'old-preview-secret',...overrides };
  const state = { clients:0, reads:0, provider:0, enabled:false, testEnabled:false,
    user:{ id:customerId,email:'djudge47@gmail.com',email_confirmed_at:'2026-10-21T00:00:00Z' } };
  const handler = createLiveRenewalHttpHandler({ env:config, liveProviderFactory: () => { state.provider++; throw Error('forbidden'); },
    createClient() { state.clients++; return { supabaseUrl:config.VITE_SUPABASE_URL,
      auth:{ async getUser() { return { data:{ user:state.user },error:null }; } }, rpc() { throw Error('forbidden'); },
      from(table) { state.reads++; return { select() { return this; },eq() { return this; },async maybeSingle() {
        if (state.readFailure) return { data:null,error:{ code:'42P01' } };
        return { data:{ execution_enabled:table === 'ks_crm_renewal_control' ? state.testEnabled : state.enabled },error:null };
      } }; } }; } });
  return { state, config, async request({ method='POST',view='renewal-live-review',body={ customerId,preserveCurrentSelectionConfirmed:true,creditSpendConfirmed:true },headers={} }={}) {
    const res = { setHeader() {},status(code) { this.code=code;return this; },json(value) { this.body=value;return this; } };
    await handler({ method,query:{ view,customerId },body,headers:{ authorization:'Bearer fictional',origin:'https://fixture.invalid',host:'fixture.invalid','content-type':'application/json',...headers } },res);
    return res;
  } };
}
await check('production, unsupported methods, wrong projects and malformed origin/media/body stop before dependencies', async () => {
  for (const config of [{ VERCEL_ENV:'production' },{ VITE_SUPABASE_URL:'https://other.supabase.co' }]) {
    const f=http(config); assert.ok((await f.request()).code >= 400); assert.equal(f.state.clients,0);
  }
  for (const request of [{ method:'DELETE' },{ headers:{ origin:'https://other.invalid' } },{ headers:{ 'content-type':'text/plain' } },
    { body:{ customerId,preserveCurrentSelectionConfirmed:true,creditSpendConfirmed:false } },
    { body:{ customerId,preserveCurrentSelectionConfirmed:true,creditSpendConfirmed:true,package:'1' } },
    { headers:{ authorization:'' } }]) {
    const f=http(); assert.ok((await f.request(request)).code >= 400); assert.equal(f.state.clients,0);
  }
});
await check('ordinary, anonymous and unconfirmed Auth users cannot read renewal controls or construct a provider', async () => {
  for (const user of [{ email:'other@example.invalid' },{ is_anonymous:true },{ email_confirmed_at:null }]) {
    const f=http(); Object.assign(f.state.user,user); assert.equal((await f.request()).code,403); assert.equal(f.state.reads,0); assert.equal(f.state.provider,0);
  }
});
await check('disabled, missing and conflicting database switches and absent live signing key remain blocked', async () => {
  const off=http(); assert.equal((await off.request()).body.state,'disabled'); assert.equal(off.state.provider,0);
  const missing=http(); missing.state.readFailure=true; assert.equal((await missing.request({ method:'GET',view:'renewal-live-readiness' })).body.state,'unavailable');
  const conflict=http(); conflict.state.enabled=true; conflict.state.testEnabled=true; assert.equal((await conflict.request()).code,503);
  const noKey=http(); noKey.state.enabled=true; assert.equal((await noKey.request()).code,503);
  assert.equal(noKey.state.provider,0);
});
console.log(`${checks} live renewal transport and HTTP boundary checks passed. Fictional transport only; no connected writes or credits.`);
