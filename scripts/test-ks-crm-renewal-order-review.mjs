import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildRequestedRenewalReview } from '../_server/ks-crm-renewal-order-review.js';
import { createRoombaCrmRoute } from '../_server/ks-roomba-crm-route.js';

const now = Date.parse('2026-10-22T03:20:00Z');
const customerId = '11111111-1111-4111-8111-111111111111';
const expiresAt = '2027-11-20T16:30:00.000Z';
const customer = { id: customerId, external_id: 9999001, username: 'fictional_order', expiration_at: expiresAt };
const line = { id: String(customer.external_id), username: customer.username, resellerId: '888', packageId: '901',
  expiresAt, connections: 4, trial: false, enabled: true, adminEnabled: true, bouquetIds: [12,10,11] };
const groups = Array.from({ length: 107 }, (_, i) => i + 1);
const current = { id: '901', name: '6 Months + 4 Connections', maxConnections: 4, paid: { count: 6, unit: 'months', credits: 18 },
  trial: null, bouquets: groups, issues: [] };
const target = { ...current, id: '902', name: '12 Months + 3 Connections', maxConnections: 3, paid: { count: 12, unit: 'months', credits: 27.125 } };
const input = { customer, line, account: { id: '888', credits: '68.25' }, packages: [current, target], checkedAt: new Date(now).toISOString() };
const order = { months: 12, connections: 3 };
const review = (patch = {}, requested = order, at = now) => buildRequestedRenewalReview({ ...input, ...patch }, requested, at);
let checks = 0;
const test = async (name, run) => { await run(); checks++; console.log(`PASS: ${name}`); };
await test('requested order quotes exact catalog cost and preserves only the selected subset without authority to submit', () => {
  const before = JSON.stringify(input), r = review();
  assert.equal(r.status, 'catalog_compatible'); assert.equal(r.currentMonths, 6); assert.equal(r.currentConnections, 4);
  assert.equal(r.requestedMonths, 12); assert.equal(r.requestedConnections, 3); assert.equal(r.packageId, target.id);
  assert.equal(r.credits, 27.125); assert.equal(r.creditsAvailable, 68.25); assert.deepEqual(r.currentGroupIds, [10,11,12]);
  assert.equal(r.packageGroupCount, 107); assert.equal(r.sent, false); assert.equal(r.executionEnabled, false); assert.equal(r.providerChangeVerified, false);
  for (const field of ['token','fingerprint','form','approvalId','operationId','newExpiresAt','resellerId']) assert.ok(!Object.hasOwn(r, field));
  assert.equal(JSON.stringify(input), before);
});
await test('every supported term and allowance resolves from the supplied package rather than estimating a price', () => {
  for (const months of [1,3,6,12]) for (const connections of [1,2,3,4,5]) {
    const pkg = { ...target, id: '999', name: `${months} Months + ${connections} Connections`, maxConnections: connections,
      paid: { count: months, unit: 'months', credits: 7.987654 } };
    const r = review({ packages: [current, ...(months === 6 && connections === 4 ? [] : [pkg])] }, { months, connections });
    assert.equal(r.status, 'catalog_compatible'); assert.equal(r.credits, months === 6 && connections === 4 ? 18 : 7.987654);
  }
  assert.equal(review({ account: { ...input.account, credits: 30 }, packages: [{ ...current, paid: { ...current.paid, credits: 1000 } }, target] }).status, 'catalog_compatible');
});
await test('ambiguous, missing, incomplete or alternative-family targets never fall back to a different package', () => {
  for (const packages of [[current], [current,target,{ ...target,id:'903' }],
    [current,{ ...target,name:target.name+' (Without Adults)' }], [current,{ ...target,maxConnections:4 }],
    [current,{ ...target,paid:{ ...target.paid,count:6 } }], [current,{ ...target,issues:['Incomplete'] }],
    [current,{ ...target,trial:{ count:36,unit:'hours',credits:0 } }]]) {
    const r = review({ packages }); assert.equal(r.status,'needs_review'); assert.equal(r.packageId,null); assert.equal(r.credits,null);
  }
  assert.throws(()=>review({packages:[current,target,target]}));
});
await test('line selection must be valid in both packages and cannot expand to the full catalog', () => {
  for (const patch of [{line:{...line,bouquetIds:[10,200]}},{line:{...line,bouquetIds:[10,10]}},
    {packages:[current,{...target,bouquets:[10,11]}]},{packages:[{...current,bouquets:[10,11]},target]}]) {
    const r=review(patch);assert.equal(r.status,'needs_review');assert.deepEqual(r.currentGroupIds,[]);
  }
});
await test('expired, disabled and trial lines stay blocked, and identity mismatches throw before quoting', () => {
  for(const patch of [{trial:true},{enabled:false},{adminEnabled:false},{expiresAt:new Date(now).toISOString()},{connections:3}]) {
    assert.equal(review({line:{...line,...patch}}).status,'needs_review');
  }
  for(const patch of [{id:'9'},{username:'another_customer'},{resellerId:'99'},{expiresAt:'not-a-date'}]) assert.throws(()=>review({line:{...line,...patch}}));
  assert.equal(review({packages:[{...current,name:current.name+' (Without Adults)'},target]}).status,'needs_review');
});
await test('expiry equality uses instants, and stale evidence cannot appear compatible', () => {
  assert.equal(review({customer:{...customer,expiration_at:'2027-11-20T12:30:00-04:00'}}).status,'catalog_compatible');
  for(const expiration_at of [null,'2027-11-20T16:30:00','2027-11-20T16:30:01.000Z']) assert.equal(review({customer:{...customer,expiration_at}}).status,'needs_review');
  assert.equal(review({},order,now+30000).status,'needs_review');
  assert.throws(()=>review({checkedAt:new Date(now+1).toISOString()}));
});
await test('invalid order values, insufficient balances and inexact or zero costs cannot become compatible', () => {
  for(const patch of [{months:0},{months:2},{months:'12'},{connections:0},{connections:6},{connections:3.5}]) assert.throws(()=>review({}, {...order,...patch}));
  for(const credits of [null,true,'1e2','invalid',-1,'27.124999']) assert.equal(review({account:{...input.account,credits}}).status,'needs_review');
  for(const credits of [0,0.0000001]) assert.equal(review({packages:[current,{...target,paid:{...target.paid,credits}}]}).status,'needs_review');
});

function fixture(patch = {}) {
  const state = { now, customer:structuredClone(customer), line:structuredClone(line), packages:structuredClone([current,target]),
    account:{ id:'888',credits:'68.25' }, user:{id:customerId,email:'djudge47@gmail.com',email_confirmed_at:new Date(now).toISOString()}, ...patch };
  const calls={auth:0,crm:0,provider:[]};
  const env={VERCEL_ENV:'preview',VITE_SUPABASE_URL:'https://wftfxerblhlsxiijtfbo.supabase.co',VITE_SUPABASE_ANON_KEY:'fictional-anon',
    SUPABASE_SERVICE_ROLE_KEY:'fictional-service',ROOMBA_PREVIEW_SECRET:'fictional-preview',...patch.env};
  const createClient=(url,key)=>{
    assert.equal(url,'https://wftfxerblhlsxiijtfbo.supabase.co');
    if(key==='fictional-anon')return{auth:{async getUser(){calls.auth++;return{data:{user:state.user}};}}};
    assert.equal(key,'fictional-service');
    return{from(table){assert.equal(table,'iptv_customers');return{
      select(columns){assert.equal(columns,'id,external_id,username,expiration_at');calls.crm++;return this;},
      eq(field,value){assert.equal(field,'id');assert.equal(value,customerId);return this;},
      async maybeSingle(){return{data:state.customer};}
    };}};
  };
  const readFactory=settings=>async(req,res)=>{
    assert.equal(req.method,'GET');calls.provider.push(settings.readAction);
    if(state.wait)await state.wait;
    const common={mode:'read-only',databaseWrites:false,transport:'fixie'};
    if(state.fail===settings.readAction)return res.status(502).json({...common,status:'connection_failed',reason:'TIMEOUT',error:'sensitive-provider-error'});
    if(settings.readAction==='user_info')return res.status(200).json({...common,status:'connected',account:state.account});
    if(settings.readAction==='get_line'){assert.equal(settings.lineId,line.id);return res.status(200).json({...common,status:'line_ready',line:{...state.line,password:'sensitive-password'}});}
    assert.equal(settings.readAction,'packages');state.now+=state.packageDelay||0;
    return res.status(200).json({...common,status:'packages_ready',packages:state.packages});
  };
  const handler=createRoombaCrmRoute({env,createClient,readFactory,now:()=>state.now});
  return{state,calls,async request({method='GET',query={},token='fictional-token'}={}){
    const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
    await handler({method,headers:{authorization:token?`Bearer ${token}`:''},query:{view:'customer-renewal-order',customerId,months:'12',connections:'3',...query}},res);
    assert.equal(res.headers['Cache-Control'],'private, no-store');
    for(const secret of ['sensitive-','fictional-token','fictional-service','fictional-preview','renewalContext','resellerId','approvalToken'])assert.ok(!JSON.stringify(res.body).includes(secret));
    return res;
  }};
}
await test('authenticated route uses only three documented GETs and returns no current-plan test approval',async()=>{
  const f=fixture(),r=await f.request();assert.equal(r.code,200);assert.equal(r.body.requestedOrder.status,'catalog_compatible');
  assert.deepEqual(f.calls.provider,['user_info','get_line','packages']);
  assert.deepEqual(Object.keys(r.body).sort(),['cached','databaseWrites','line','mode','requestedOrder']);
  assert.equal(r.body.requestedOrder.packageId,target.id);assert.equal(r.body.testApproval,undefined);
});
await test('invalid query fields and order values stop before any authenticated or provider dependency',async()=>{
  for(const query of [{months:'2'},{months:['12']},{connections:'03'},{connections:['3']},{packageId:'902'},{cost:'0'},{confirmed:'true'}]){
    const f=fixture();assert.equal((await f.request({query})).code,400);assert.equal(f.calls.auth,0);assert.equal(f.calls.provider.length,0);
  }
});
await test('GET-only, Preview, active-project and confirmed-admin gates remain enforced',async()=>{
  for(const method of ['POST','PUT','DELETE']){const f=fixture();assert.equal((await f.request({method})).code,405);assert.equal(f.calls.auth,0);}
  for(const VERCEL_ENV of ['production','development']){const f=fixture({env:{VERCEL_ENV}});assert.equal((await f.request()).code,404);assert.equal(f.calls.auth,0);}
  const wrong=fixture({env:{VITE_SUPABASE_URL:'https://wrong.invalid'}});assert.equal((await wrong.request()).code,503);assert.equal(wrong.calls.auth,0);
  for(const user of [null,{id:customerId,email:'other@example.invalid',email_confirmed_at:input.checkedAt},{id:customerId,email:'djudge47@gmail.com',is_anonymous:true,email_confirmed_at:input.checkedAt}]){
    const f=fixture({user});assert.ok([401,403].includes((await f.request()).code));assert.equal(f.calls.crm,0);assert.equal(f.calls.provider.length,0);
  }
});
await test('cache binds requested dimensions, rereads saved CRM expiry, and preserves target ambiguity',async()=>{
  const f=fixture();await f.request();assert.equal((await f.request()).body.cached,true);assert.equal(f.calls.provider.length,3);
  f.state.customer.expiration_at='2027-11-20T16:30:01Z';assert.equal((await f.request()).body.requestedOrder.status,'needs_review');assert.equal(f.calls.provider.length,3);
  assert.equal((await f.request({query:{months:'1',connections:'2'}})).code,429);
  f.state.now+=30001;assert.equal((await f.request({query:{months:'1',connections:'2'}})).body.requestedOrder.packageId,null);
  const duplicate=fixture({packages:[current,target,{...target,id:'903'}]});
  assert.equal((await duplicate.request()).body.requestedOrder.packageId,null);assert.equal((await duplicate.request()).body.requestedOrder.packageId,null);
});
await test('slow and failed package reads cannot become a fresh compatible result',async()=>{
  const slow=fixture({packageDelay:30000});assert.equal((await slow.request()).body.requestedOrder.status,'needs_review');
  const failed=fixture({fail:'packages'}),r=await failed.request();assert.equal(r.code,502);assert.equal(r.body.requestedOrder,undefined);assert.ok(r.body.error.includes('package list check timed out'));
});
await test('concurrent same-order reads coalesce while another order cannot reuse the response',async()=>{
  let release;const wait=new Promise(resolve=>{release=resolve;}),f=fixture({wait});
  const a=f.request(),b=f.request();await new Promise(resolve=>setImmediate(resolve));
  assert.equal((await f.request({query:{connections:'2'}})).code,429);release();
  assert.ok((await Promise.all([a,b])).every(r=>r.body.requestedOrder.requestedConnections===3));assert.equal(f.calls.provider.length,3);
});

const directory=await mkdtemp(join(process.cwd(),'node_modules','.ks-order-view-'));
const originalFetch=globalThis.fetch,originalWindow=globalThis.window,originalNow=Date.now;
try{
  const built=await build({entryPoints:['src/pages/admin/RequestedRenewalReview.tsx'],bundle:true,write:false,platform:'node',format:'esm',jsx:'automatic',external:['react/jsx-runtime','react-dom'],plugins:[{name:'order-fixture',setup(builder){
    builder.onResolve({filter:/^\.\/OrderRenewalControls$/},()=>({path:'controls',namespace:'fixture'}));
    builder.onResolve({filter:/^react$/},()=>({path:'hooks',namespace:'fixture'}));
    builder.onResolve({filter:/\/lib\/supabase$/},()=>({path:'auth',namespace:'fixture'}));
    builder.onLoad({filter:/.*/,namespace:'fixture'},args=>({loader:'js',contents:args.path==='controls' ? 'export default function Controls(){return null;}' : args.path==='hooks'
      ?`export const useState=initial=>{const s=globalThis.__ksOrderHooks;const i=s.cursor++;if(!(i in s.values))s.values[i]=initial;return[s.values[i],v=>{s.values[i]=typeof v==='function'?v(s.values[i]):v;}];};export const useRef=initial=>{const s=globalThis.__ksOrderHooks;const i=s.cursor++;if(!(i in s.values))s.values[i]={current:initial};return s.values[i];};export const useEffect=()=>{};`
      :'export const supabase={auth:{getSession:async()=>({data:{session:{access_token:"fictional-token"}}})}};'}));
  }}]});
  const path=join(directory,'component.mjs');await writeFile(path,built.outputFiles[0].text);
  const{default:Component}=await import(pathToFileURL(path).href);
  globalThis.window={setTimeout,clearTimeout};
  const render=(patch={})=>{globalThis.__ksOrderHooks.cursor=0;return Component({customerId,panelId:customer.external_id,username:customer.username,currentConnections:4,...patch});};
  const find=(node,type,label)=>{if(!node||typeof node!=='object')return null;if(Array.isArray(node))return node.map(n=>find(n,type,label)).find(Boolean);if(node.type===type&&(node.props['aria-label']===label||JSON.stringify(node.props.children).includes(label)))return node;return find(node.props?.children,type,label);};
  const connect=f=>{Date.now=()=>f.state.now;globalThis.__ksOrderHooks={cursor:0,values:[]};globalThis.fetch=async(url,options)=>{
    assert.equal(options.method,'GET');assert.equal(options.headers.Authorization,'Bearer fictional-token');assert.equal(options.body,undefined);
    const parsed=new URL(url,'https://fictional.invalid');assert.equal(parsed.pathname,'/api/ks-roomba-crm');
    assert.equal(parsed.searchParams.get('view'),'customer-renewal-order');assert.equal([...parsed.searchParams].length,4);
    const r=await f.request({query:Object.fromEntries(parsed.searchParams)});return new Response(JSON.stringify(r.body),{status:r.code});
  };};
  const click=async()=>{find(render(),'button','Review requested order').props.onClick();await new Promise(resolve=>setImmediate(resolve));};
  await test('visible order choices and review cross the authenticated route without any write',async()=>{
    const f=fixture();connect(f);assert.equal(f.calls.auth,0);
    for(const label of ['1 month','3 months','6 months','12 months','1 connection','2 connections','3 connections','4 connections','5 connections']) {
      const choice=find(render(),'button',label);assert.ok(choice);assert.equal(choice.props.type,'button');assert.equal(choice.props.disabled,false);
    }
    assert.equal(find(render(),'button','12 months').props['aria-pressed'],true);
    assert.equal(find(render(),'button','4 connections').props['aria-pressed'],true);
    find(render(),'button','6 months').props.onClick();
    find(render(),'button','3 connections').props.onClick();
    assert.equal(find(render(),'button','6 months').props['aria-pressed'],true);
    assert.equal(find(render(),'button','12 months').props['aria-pressed'],false);
    assert.equal(find(render(),'button','3 connections').props['aria-pressed'],true);
    assert.equal(find(render(),'button','4 connections').props['aria-pressed'],false);
    assert.ok(renderToStaticMarkup(render()).includes('6 months · 3 connections'));
    assert.equal(f.calls.auth,0);assert.equal(f.calls.provider.length,0);
    find(render(),'button','12 months').props.onClick();await click();
    const markup=renderToStaticMarkup(render());
    for(const text of ['Package supports the current channel selection','27.125 credits','10, 11, 12','This requested-order check did not submit','provider verification',
      'Unused service time may not carry over','Check the expiration shown in XUI'])assert.ok(markup.includes(text));
    assert.ok(markup.includes('<td>6</td><td>12</td>'));assert.ok(markup.includes('<td>4</td><td>3</td>'));
    assert.ok(!markup.includes('type="submit"'));assert.ok(!markup.includes('Approve renewal'));assert.deepEqual(f.calls.provider,['user_info','get_line','packages']);
  });
  await test('changing order values or customer identity hides the previous result immediately',async()=>{
    const f=fixture();connect(f);find(render(),'button','3 connections').props.onClick();await click();
    assert.ok(!renderToStaticMarkup(render({username:'another_customer'})).includes('Requested order review ·'));
    find(render(),'button','6 months').props.onClick();
    assert.ok(!renderToStaticMarkup(render()).includes('27.125 credits'));assert.equal(f.calls.provider.length,3);
  });
  await test('expired or failed refresh removes compatible messaging and never enables a live action',async()=>{
    const f=fixture();connect(f);find(render(),'button','3 connections').props.onClick();await click();
    f.state.now+=30001;let markup=renderToStaticMarkup(render());assert.ok(markup.includes('snapshot has expired'));assert.ok(!markup.includes('Package supports the current channel selection'));
    f.state.fail='packages';await click();markup=renderToStaticMarkup(render());assert.ok(markup.includes('role="alert"'));assert.ok(!markup.includes('27.125 credits'));
  });
  await test('malformed, wrong-order and capability-bearing responses never become a successful quote',async()=>{
    for(const mutate of [p=>p.requestedOrder.requestedConnections=4,p=>p.line.lineId='9',p=>p.requestedOrder.currentGroupIds=[10,10],
      p=>p.requestedOrder.executionEnabled=true,p=>p.requestedOrder.providerChangeVerified=true,p=>p.testApproval={token:'forged'}]){
      const f=fixture();connect(f);find(render(),'button','3 connections').props.onClick();
      const fetch=globalThis.fetch;globalThis.fetch=async(...args)=>{const r=await fetch(...args),p=await r.json();mutate(p);return new Response(JSON.stringify(p),{status:200});};
      await click();const markup=renderToStaticMarkup(render());assert.ok(markup.includes('could not be verified'));assert.ok(!markup.includes('27.125 credits'));
    }
  });
}finally{globalThis.fetch=originalFetch;globalThis.window=originalWindow;Date.now=originalNow;delete globalThis.__ksOrderHooks;await rm(directory,{recursive:true,force:true});}
await test('no new deployment function or connection secret is introduced',async()=>{
  assert.equal((await readdir('api')).filter(f=>/\.(js|ts)$/.test(f)).length,12);
  const source=await readFile('src/pages/admin/RequestedRenewalReview.tsx','utf8');
  for(const text of ['SERVICE_ROLE','API_KEY','edit_line','renewal-live-execute','renewal-test-approval'])assert.ok(!source.includes(text));
});
console.log(`${checks} requested-order checks passed. Synthetic data only; no live provider calls, credits or database writes.`);
