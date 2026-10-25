import assert from 'node:assert/strict';
import { readActivityProbeJson } from '../_server/ks-roomba-activity-probe-reader.js';
import { createActivityProbeHandler } from '../_server/ks-roomba-activity-probe.js';
import { createRoombaPreviewHandler } from '../_server/ks-roomba-preview.js';

const secret = 'fictional-secret-must-not-appear';
const parse = value => readActivityProbeJson(new Response(JSON.stringify(value)));
assert.deepEqual(await parse({ data: [{ username: secret, password: secret, stream_id: 5, stream_name: secret, ip: secret }] }),
  { recognized: true, samplePresent: true, fields: ['stream_id', 'stream_name', 'username'] });
assert.equal((await parse({ data: [] })).recognized, true);
for (const value of [null, { status: 'STATUS_NO_PERMISSIONS' }, { status: null, data: [] }, { error: true, data: [] }, { data: {} }])
  assert.equal((await parse(value)).recognized, false);
for (const value of [{ data: [null] }, { data: [{}, {}] }]) await assert.rejects(() => parse(value));
for (const text of ['{"data":[]}garbage', '{"data":[],"data":[]}', '<html>login</html>', ' '.repeat(1048577)])
  await assert.rejects(() => readActivityProbeJson(new Response(text)));
console.log('PASS: bounded streaming diagnostic discards customer values and rejects invalid/error responses');

const env = { VERCEL_ENV: 'preview', ROOMBA_PREVIEW_SECRET: secret, ROOMBA_API_KEY: 'fictional-key',
  ROOMBA_API_URL: 'https://cdn.rooomba.tv/WDXTMHmN/', FIXIE_URL: 'https://fiction:fiction@test-proxy.usefixie.com:443' };
let requests = 0;
const transport = createRoombaPreviewHandler({ env, readAction: 'live_connections', dispatcherFactory: () => ({ dispatch() {} }),
  fetchImpl: async (url, options) => {
    requests++;
    assert.equal(url.origin + url.pathname, env.ROOMBA_API_URL);
    assert.equal(url.searchParams.get('action'), 'live_connections');
    assert.equal(url.searchParams.get('limit'), '1'); assert.equal(url.searchParams.get('start'), '0');
    assert.equal(options.method, 'GET'); assert.equal(options.redirect, 'manual');
    return new Response(JSON.stringify({ data: [{ password: secret, stream_name: secret }] }));
  } });
const response = () => ({ headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(code) { this.code=code; return this; }, json(body) { this.body=body; return this; } });
let res = response();
await transport({ method:'GET', headers: { authorization:`Bearer ${secret}` } }, res);
assert.equal(res.body.status, 'activity_probe_complete'); assert.ok(!JSON.stringify(res.body).includes(secret)); assert.equal(requests,1);
console.log('PASS: diagnostic uses exactly one fixed HTTPS read with limit 1 and no redirect or write');

let authCount=0, probeCount=0, time=Date.now(), release;
let gate;
const handler = createActivityProbeHandler({ env, now:()=>time,
  authorize: async(req,res) => { authCount++; return req.headers.authorization==='Bearer admin'
    ? res.status(200).json({ status:'connected', account:{id:12} }) : res.status(403).json({}); },
  probe: async(req,res) => { probeCount++; assert.equal(req.headers.authorization, `Bearer ${secret}`);
    if(gate) await gate;
    return res.status(200).json({ status:'activity_probe_complete',probe:{recognized:true,secret},password:secret }); } });
const call = async(overrides={}) => { const res=response(); await handler({ method:'GET',query:{view:'activity-support'},headers:{authorization:'Bearer admin'},...overrides },res); return res; };
assert.equal((await call({method:'POST'})).code,405);
assert.equal((await call({query:{view:'activity-support',action:'create_line'}})).code,400);
assert.equal(authCount,0); assert.equal(probeCount,0);
assert.equal((await call({headers:{authorization:'Bearer customer'}})).code,403); assert.equal(probeCount,0);
gate=new Promise(resolve=>{release=resolve;});
const first=call(), second=call(); await new Promise(resolve=>setImmediate(resolve)); assert.equal(probeCount,1);
release(); const results=await Promise.all([first,second]);
assert.ok(results.every(r=>r.code===200&&r.body.status==='activity_response_received'));
assert.ok(results.every(r=>r.body.diagnostic==='activity_list_received'));
assert.ok(results.every(r=>!JSON.stringify(r.body).includes(secret)));
assert.equal((await call()).body.cached,true); assert.equal(probeCount,1);
assert.equal((await call({headers:{authorization:'Bearer customer'}})).code,403);
time+=61000; await call(); assert.equal(probeCount,2);
for(const VERCEL_ENV of ['production','development',undefined]) {
 const blocked=createActivityProbeHandler({env:{...env,VERCEL_ENV},authorize:()=>{throw Error('must not authenticate');},probe:()=>{throw Error('must not contact');}});
 const res=response();await blocked({method:'GET'},res);assert.equal(res.code,404);
}
console.log('PASS: admin preflight, query/method restrictions, reauthorization before cache, shared request and Preview gates');

const diagnosticCases = [
  [200, {status:'activity_probe_complete',probe:{recognized:false}}, 'response_unrecognized'],
  [502, {status:'connection_failed',upstreamStatus:401}, 'provider_denied'],
  [502, {status:'connection_failed',upstreamStatus:403}, 'provider_denied'],
  [502, {status:'connection_failed',upstreamStatus:429}, 'provider_rate_limited'],
  [502, {status:'connection_failed',upstreamStatus:302}, 'provider_redirect'],
  [502, {status:'connection_failed',upstreamStatus:503}, 'provider_http_error'],
  [502, {status:'connection_failed',upstreamStatus:200,stage:'response_body',reason:'NON_JSON_RESPONSE'}, 'response_unreadable'],
  [502, {status:'connection_failed',stage:'proxy_request',reason:'TIMEOUT'}, 'request_timeout'],
  [502, {status:'connection_failed',stage:'proxy_request',reason:'ENOTFOUND'}, 'transport_failed'],
  [503, {status:'not_configured',missing:[secret]}, 'configuration_unavailable'],
  [200, {status:secret}, 'diagnostic_failed'],
];
for (const [code, body, diagnostic] of diagnosticCases) {
  let upstreamCalls=0;
  const checked=createActivityProbeHandler({env, now:()=>time,
    authorize:async(req,res)=>res.status(200).json({status:'connected',account:{id:12}}),
    probe:async(req,res)=>{upstreamCalls++;return res.status(code).json({...body,error:secret,url:secret});}});
  const res=response(); await checked({method:'GET',query:{view:'activity-support'}},res);
  assert.equal(res.code,200); assert.equal(res.body.status,'activity_unverified');
  assert.equal(res.body.diagnostic,diagnostic); assert.equal(res.body.databaseWrites,false);
  assert.ok(!JSON.stringify(res.body).includes(secret)); assert.equal(upstreamCalls,1);
  const cachedResult=response(); await checked({method:'GET',query:{view:'activity-support'}},cachedResult);
  assert.equal(cachedResult.body.cached,true); assert.equal(cachedResult.body.diagnostic,diagnostic); assert.equal(upstreamCalls,1);
}
const throttled=createActivityProbeHandler({env,
  authorize:async(req,res)=>res.status(429).json({error:secret,retryAfterSeconds:secret}),
  probe:()=>{throw Error('must not contact');}});
res=response(); await throttled({method:'GET',query:{view:'activity-support'}},res);
assert.equal(res.code,429); assert.equal(res.headers['Retry-After'],'60'); assert.equal(res.body.retryAfterSeconds,60);
assert.ok(!JSON.stringify(res.body).includes(secret));
console.log('PASS: fixed failure categories distinguish denied, limited, redirect, HTTP, timeout, parse, format, transport and configuration without leaking upstream data');
console.log('Activity diagnostic checks passed. All transport and identities are fictional; no live request was made.');
