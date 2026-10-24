import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { StaticRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';

const directory=await mkdtemp(join(process.cwd(),'node_modules','.ks-activity-'));
const originalWindow=globalThis.window,originalFetch=globalThis.fetch;
const id=n=>`77777777-7777-4777-8777-${String(n).padStart(12,'0')}`;
const owner=id(1),other=id(2);let hooks,listeners=new Set(),authResult,account=owner,authReads=0;
const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
const frames={
 useState(initial){const i=hooks.si++;if(!(i in hooks.states))hooks.states[i]=typeof initial==='function'?initial():initial;const frame=hooks;return[frame.states[i],v=>{assert.equal(frame.dead,false,'State written after unmount');frame.states[i]=typeof v==='function'?v(frame.states[i]):v;}];},
 useRef(initial){const i=hooks.ri++;return hooks.refs[i]??(hooks.refs[i]={current:initial});},
 useCallback(fn,deps){const i=hooks.mi++;if(!same(hooks.memos[i]?.deps,deps))hooks.memos[i]={fn,deps};return hooks.memos[i].fn;},
 useEffect(effect,deps){const i=hooks.ei++;if(!same(hooks.effects[i]?.deps,deps)){const old=hooks.effects[i];hooks.effects[i]={deps};hooks.pending.push(()=>{old?.cleanup?.();hooks.effects[i].cleanup=effect();});}},
};
globalThis.__activityHooks=frames;
globalThis.__activityClient={auth:{getUser:()=>{authReads++;return authResult();},getSession:async()=>({data:{session:{access_token:'fictional',user:{id:account}}},error:null}),onAuthStateChange:fn=>{listeners.add(fn);return{data:{subscription:{unsubscribe(){listeners.delete(fn);}}}};}},from(){throw Error('Raw session/table access forbidden');}};
globalThis.__activityAccount={status:'loading',accountId:null,retry(){}};
const hookSource=`import React from ${JSON.stringify(import.meta.resolve('react'))};export default React;export const {useState,useRef,useCallback,useEffect}=globalThis.__activityHooks;`;
let serial=0;
async function compile(entry,page=false){
 const built=await build({entryPoints:[entry],bundle:true,write:false,platform:'node',format:'esm',jsx:'automatic',packages:'external',plugins:[{name:'activity-offline',setup(b){
  b.onResolve({filter:/^file:/},a=>({path:a.path,external:true}));
  b.onResolve({filter:/^react$/},()=>({path:'hooks',namespace:'fixture'}));
  b.onResolve({filter:/(?:^|\/)lib\/supabase$|^\.\/supabase$/},()=>({path:'client',namespace:'fixture'}));
  if(page){b.onResolve({filter:/\/useVerifiedWebsiteAccount$/},()=>({path:'account',namespace:'fixture'}));b.onResolve({filter:/\/CustomerCrmService$/},()=>({path:'service',namespace:'fixture'}));}
  b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:a.path==='hooks'?hookSource:a.path==='client'?'export const supabase=globalThis.__activityClient;':a.path==='account'?'export const useVerifiedWebsiteAccount=()=>globalThis.__activityAccount;':'export default function ConnectionFixture(){return null;}'}));
 }}]});const path=join(directory,`${++serial}.mjs`);await writeFile(path,built.outputFiles[0].text);return import(pathToFileURL(path));
}
function unmount(){for(const e of hooks?.effects??[])e?.cleanup?.();if(hooks)hooks.dead=true;}
function fresh(){unmount();listeners=new Set();hooks={states:[],refs:[],memos:[],effects:[],pending:[],si:0,ri:0,mi:0,ei:0,dead:false};}
function render(fn,props){hooks.si=hooks.ri=hooks.mi=hooks.ei=0;const value=fn(props);for(const e of hooks.pending.splice(0))e();return value;}
const drain=async()=>{for(let i=0;i<10;i++)await new Promise(resolve=>setImmediate(resolve));};
const user=(n,patch={})=>({id:id(n),is_anonymous:false,email_confirmed_at:'2026-01-01T00:00:00Z',...patch});
const result=u=>({data:{user:u},error:null});
const nodes=e=>!React.isValidElement(e)?[]:[e,...React.Children.toArray(e.props.children).flatMap(nodes)];
const html=tree=>renderToStaticMarkup(React.createElement(StaticRouter,{},tree));
const text=e=>typeof e==='string'||typeof e==='number'?String(e):React.isValidElement(e)?React.Children.toArray(e.props.children).map(text).join(''):'';
try{
 globalThis.window={setTimeout,clearTimeout};
 const {useVerifiedWebsiteAccount:useAccount}=await compile('src/lib/useVerifiedWebsiteAccount.ts');
 fresh();authResult=async()=>result(user(1));assert.equal(render(useAccount).status,'loading');await drain();assert.deepEqual({...render(useAccount),retry:undefined},{status:'ready',accountId:owner,retry:undefined});
 authResult=async()=>result(user(2));for(const fn of listeners)fn('SIGNED_IN',{user:user(2)});assert.equal(render(useAccount).accountId,null);await drain();assert.equal(render(useAccount).accountId,other);
 console.log('PASS: actual verified-account hook clears the previous owner before checking a changed account.');
 fresh();let old,newer;authResult=()=>new Promise(resolve=>{old=resolve;});render(useAccount);
 authResult=()=>new Promise(resolve=>{newer=resolve;});for(const fn of listeners)fn('SIGNED_IN',{user:user(2)});await drain();newer(result(user(2)));await drain();old(result(user(1)));await drain();assert.equal(render(useAccount).accountId,other);
 authResult=async()=>result(null);for(const fn of listeners)fn('SIGNED_OUT',null);assert.equal(render(useAccount).accountId,null);await drain();assert.equal(render(useAccount).status,'signed_out');
 for(const [u,status] of [[user(1,{is_anonymous:true}),'signed_out'],[user(1,{email_confirmed_at:null}),'unconfirmed'],[{id:'invalid',email_confirmed_at:'yes'},'signed_out']]){fresh();authResult=async()=>result(u);render(useAccount);await drain();const state=render(useAccount);assert.equal(state.status,status);assert.equal(state.accountId,null);}
 console.log('PASS: delayed prior-owner Auth results, sign-out, anonymous, unconfirmed and invalid identities cannot reveal a connection allowance.');
 fresh();authResult=async()=>{throw Error('PRIVATE-AUTH-ERROR');};render(useAccount);await drain();assert.equal(render(useAccount).status,'unavailable');authResult=async()=>result(user(1));await render(useAccount).retry();assert.equal(render(useAccount).accountId,owner);
 fresh();let late;authResult=()=>new Promise(resolve=>{late=resolve;});render(useAccount);const before=authReads;unmount();late(result(user(1)));await drain();assert.equal(listeners.size,0);assert.equal(authReads,before);
 console.log('PASS: Auth failures have a recoverable unavailable state; unmount removes the listener and ignores late results.');
 const Devices=(await compile('src/pages/client/ClientDevices.tsx',true)).default;
 for(const status of ['loading','signed_out','unconfirmed','unavailable','ready']){
  fresh();globalThis.__activityAccount={status,accountId:status==='ready'?owner:null,retry(){}};const tree=render(Devices),markup=html(tree);
  assert.match(markup,/Live device activity is unavailable/);assert.doesNotMatch(markup,/No Active Devices|End session|No user found/);
  const service=nodes(tree).find(n=>n.type?.name==='ConnectionFixture');assert.equal(Boolean(service),status==='ready');if(service){assert.equal(service.props.accountId,owner);assert.equal(service.props.view,'connections');assert.equal(service.key,'.$'+owner);}
  assert.ok(markup.includes('href="/support/devices"'));assert.ok(markup.includes('href="/client/support/new"'));
 }
 const History=(await compile('src/pages/client/ClientHistory.tsx',true)).default;
 const history=html(History());assert.match(history,/Viewing history is unavailable here/);assert.doesNotMatch(history,/You haven.t watched|No Streaming History|<table|<button/);assert.ok(history.includes('href="/client/subscription"'));
 console.log('PASS: actual Devices/History pages distinguish unavailable activity from no viewing and offer real recovery/help destinations.');
 const Service=(await compile('src/components/CustomerCrmService.tsx')).default;
 const service={customerId:id(10),username:'fictional',name:'Fictional service',packageName:'6 Months + 3 Connections',connections:3,expiresAt:'2030-08-04T12:00:00Z',savedStatus:'active',legacyPaid:false,updatedAt:'2026-10-22T12:00:00Z'};
 const payment={id:id(100),customerId:id(10),amountCents:9500,method:'manual_paypal',paidAt:'2026-08-03T20:17:00Z',months:6,connections:3};
 const snapshot={accountId:owner,checkedAt:'2026-10-22T12:00:00Z',services:[service,{...service,customerId:id(11),name:'Second fictional service',connections:1}],payments:[payment],nextCursor:{paidAt:payment.paidAt,id:payment.id}};
 fresh();account=owner;const requests=[];globalThis.fetch=async(url,options)=>{requests.push({url,options});return Response.json(snapshot);};
 const props={accountId:owner,view:'connections'};render(Service,props);await drain();let tree=render(Service,props),markup=html(tree);
 assert.match(markup,/Your connection allowance/);assert.match(markup,/simultaneous streams/);assert.equal((markup.match(/Connections allowed/g)||[]).length,2);assert.match(markup,/>3<\/dd>/);assert.match(markup,/>1<\/dd>/);assert.doesNotMatch(markup,/\$95|Payment history|Load older payments|active streaming sessions|Current streams/);
 assert.equal(requests[0].url,'/api/ks-customer-setup?view=crm-service');assert.equal(requests[0].options.method,'GET');assert.ok(!requests[0].url.includes(owner));
 tree=render(Service,{accountId:other,view:'connections'});assert.doesNotMatch(html(tree),/Fictional service/);
 console.log('PASS: connections view uses the owner-bound service endpoint, shows each saved allowance separately and omits receipts/live-use claims; a new owner cannot render an old snapshot.');
 for(const mode of ['empty','failure','hidden']){
  fresh();account=owner;globalThis.fetch=async()=>mode==='empty'?Response.json({...snapshot,services:[],payments:[],nextCursor:null}):Response.json({error:'PRIVATE-DATABASE-ERROR'},{status:mode==='hidden'?404:503});render(Service,props);await drain();markup=html(render(Service,props));
  if(mode==='empty')assert.match(markup,/has not been linked/);else assert.match(markup,/could not be checked|unavailable here/);
  assert.doesNotMatch(markup,/PRIVATE-DATABASE|No Active Devices|0 \/|Fictional service/);
 }
 const sources=await Promise.all(['src/pages/client/ClientDevices.tsx','src/pages/client/ClientHistory.tsx'].map(p=>readFile(p,'utf8')));assert.ok(sources.every(s=>!s.includes('streaming_sessions')&&!s.includes('.update(')));
 console.log('PASS: missing links, failed service reads and unavailable rollout stay distinct; the former table-only disconnect and unverified history reads are removed without any stored-record write.');
}finally{
 unmount();globalThis.fetch=originalFetch;if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;
 for(const name of ['__activityHooks','__activityClient','__activityAccount'])delete globalThis[name];await rm(directory,{recursive:true,force:true});
}
