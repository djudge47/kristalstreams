import assert from 'node:assert/strict';
import { mkdtemp,writeFile,rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { reviewServiceBatch,serviceSyncApi,validateSyncBatch } from '../_shared/ks-crm-service-sync-client.js';

const id=n=>`11111111-1111-4111-8111-${String(n).padStart(12,'0')}`;
const now=Date.now(),before={package_name:null,connections_allowed:3,expiration_at:'2027-04-22T12:00:00Z',account_status:'active',trial:false};
const original={batchId:id(1001),state:'reviewing',expiresAt:new Date(now+7200000).toISOString(),appliedAt:null,appliedCount:0,total:100,
  items:Array.from({length:100},(_,n)=>({customerId:id(n+1),panelId:String(900001+n),username:`fictional_${n+1}`,state:'pending',reason:null,checkedAt:null,
    before:{...before,unexpectedSecret:'fictional-secret'},after:null,unexpectedSecret:'fictional-secret'})),unexpectedSecret:'fictional-secret'};
const readyItem=i=>({...i,state:'ready',after:{...before,package_name:'12 Months + 3 Connections'},checkedAt:new Date(now).toISOString()});
const complete={...original,state:'review_ready',items:original.items.map(readyItem)};
let checks=0;const test=async(name,run)=>{await run();checks++;console.log(`PASS: ${name}`);};
await test('all 100 review requests run automatically with pacing and no apply request',async()=>{
  let clock=now,current=structuredClone(original);const calls=[],progress=[];
  const result=await reviewServiceBatch({batch:current,api:async(action,batchId,body)=>{
    calls.push({action,batchId,body,time:clock});assert.equal(action,'review');current.items=current.items.map(i=>i.customerId===body.customerId?readyItem(i):i);
    if(current.items.every(i=>i.state!=='pending'))current.state='review_ready';return current;
  },now:()=>clock,wait:async ms=>{clock+=ms;},onBatch:b=>progress.push(b)});
  assert.equal(calls.length,100);assert.equal(result.state,'review_ready');assert.equal(progress.length,100);
  for(let i=1;i<calls.length;i++)assert.ok(calls[i].time-calls[i-1].time>=30000);
  assert.ok(!JSON.stringify(result).includes('fictional-secret'));
});
await test('resuming a saved review reads only the remaining accounts',async()=>{
  const partial={...original,items:original.items.map((i,n)=>n<97?readyItem(i):i)};let current=structuredClone(partial),count=0,clock=now;
  const r=await reviewServiceBatch({batch:partial,api:async(action,batchId,body)=>{count++;current.items=current.items.map(i=>i.customerId===body.customerId?readyItem(i):i);if(count===3)current.state='review_ready';return current;},now:()=>clock,wait:async ms=>{clock+=ms;}});
  assert.equal(count,3);assert.equal(r.state,'review_ready');
});
await test('stop and bounded 429 retries leave a resumable review without applying',async()=>{
  const controller=new AbortController();let n=0;
  await assert.rejects(reviewServiceBatch({batch:original,signal:controller.signal,api:async()=>{n++;controller.abort();throw new DOMException('stopped','AbortError');}}),/stopped/);assert.equal(n,1);
  n=0;let clock=now;await assert.rejects(reviewServiceBatch({batch:original,api:async()=>{n++;const e=Error('rate limited');e.status=429;throw e;},now:()=>clock,wait:async ms=>{clock+=ms;}}),/rate limited/);assert.equal(n,3);
});
await test('malformed, incomplete and changed manifests are rejected before successful review',async()=>{
  for(const patch of[{total:99},{state:'review_ready'},{items:[...original.items.slice(1),original.items[1]]},{expiresAt:'not a date'}])assert.throws(()=>validateSyncBatch({...original,...patch}));
  await assert.rejects(reviewServiceBatch({batch:original,api:async()=>({...complete,batchId:id(9999)})}));
});
await test('apply and status calls carry only a batch reference and explicit confirmation',async()=>{
  const calls=[];const api=serviceSyncApi({getToken:async()=>'fictional-token',fetchImpl:async(url,options)=>{
    calls.push({url,options});return{ok:true,status:200,json:async()=>({mode:'crm-service-sync',providerWrites:false,creditsSpent:false,batch:complete})};
  }});
  await api('apply',original.batchId,{confirmed:true});await api('status',original.batchId);
  assert.deepEqual(JSON.parse(calls[0].options.body),{action:'apply',batchId:original.batchId,confirmed:true});
  assert.equal(calls[1].options.method,'GET');assert.equal(calls[1].options.body,undefined);assert.ok(!JSON.stringify(calls).includes('fictional-secret'));
});
await test('actual React checkbox and one apply click update all 100 in a single request',async()=>{
  const dir=await mkdtemp(join(process.cwd(),'node_modules','.ks-bulk-sync-view-'));const previousFetch=globalThis.fetch;
  try{
    const actualReact=import.meta.resolve('react');
    const built=await build({entryPoints:['src/pages/admin/BulkCrmServiceSync.tsx'],bundle:true,write:false,format:'esm',platform:'node',jsx:'automatic',external:['react/jsx-runtime','lucide-react'],plugins:[{name:'fixture',setup(b){
      b.onResolve({filter:/^file:/},args=>({path:args.path,external:true}));
      b.onResolve({filter:/^react$/},()=>({path:'hooks',namespace:'fixture'}));
      b.onResolve({filter:/\/lib\/supabase$/},()=>({path:'auth',namespace:'fixture'}));
      b.onLoad({filter:/.*/,namespace:'fixture'},args=>({loader:'js',contents:args.path==='hooks'
        ?`import React from ${JSON.stringify(actualReact)};export default React;export const useMemo=f=>f();export const useEffect=()=>{};export const useState=initial=>{const h=globalThis.__syncHooks,i=h.cursor++;if(!(i in h.values))h.values[i]=typeof initial==='function'?initial():initial;return[h.values[i],v=>{h.values[i]=typeof v==='function'?v(h.values[i]):v;}];};export const useRef=initial=>{const h=globalThis.__syncHooks,i=h.refCursor++;return h.refs[i]??(h.refs[i]={current:initial});};`
        :`export const supabase={auth:{getSession:async()=>({data:{session:{access_token:'fictional-token'}},error:null})}};`}));
    }}]});
    const path=join(dir,'view.mjs');await writeFile(path,built.outputFiles[0].text);const{default:View}=await import(pathToFileURL(path));
    globalThis.__syncHooks={values:[validateSyncBatch(complete),original.batchId,'idle','','',false,false,now],refs:[],cursor:0,refCursor:0};
    let appliedRefresh=0,requests=0;const props={customerIds:original.items.map(i=>i.customerId),visibleCustomerIds:[id(1)],searchActive:true,loading:false,onApplied:async()=>{appliedRefresh++;}};
    const render=()=>{globalThis.__syncHooks.cursor=0;globalThis.__syncHooks.refCursor=0;return View(props);};
    const nodes=element=>!React.isValidElement(element)?[]:[element,...React.Children.toArray(element.props.children).flatMap(nodes)];
    const text=e=>typeof e==='string'||typeof e==='number'?String(e):React.isValidElement(e)?React.Children.toArray(e.props.children).map(text).join(''):'';
    let tree=render(),all=nodes(tree);const apply=()=>all.find(e=>e.type==='button'&&text(e).startsWith('Apply 100'));
    assert.equal(apply().props.disabled,true);assert.equal(requests,0);
    const searched=renderToStaticMarkup(tree);assert.equal((searched.match(/<details/g)||[]).length,1);assert.ok(searched.includes('Showing 1 of 100 review accounts'));assert.ok(searched.includes('entire saved review'));
    all.find(e=>e.type==='input'&&e.props.type==='checkbox').props.onChange({target:{checked:true}});
    tree=render();all=nodes(tree);assert.equal(apply().props.disabled,false);
    globalThis.fetch=async(url,options)=>{requests++;assert.equal(url,'/api/ks-roomba-crm?view=service-sync');assert.deepEqual(JSON.parse(options.body),{action:'apply',batchId:original.batchId,confirmed:true});
      return{ok:true,status:200,json:async()=>({mode:'crm-service-sync',providerWrites:false,creditsSpent:false,batch:{...complete,state:'applied',appliedAt:new Date(now).toISOString(),appliedCount:100}})};};
    apply().props.onClick();for(let n=0;n<30&&globalThis.__syncHooks.values[2]!=='idle';n++)await new Promise(resolve=>setImmediate(resolve));
    assert.equal(requests,1);assert.equal(appliedRefresh,1);tree=render();const markup=renderToStaticMarkup(tree);
    assert.ok(markup.includes('100 CRM records updated together'));assert.equal((markup.match(/<details/g)||[]).length,1);assert.ok(!markup.includes('fictional-secret'));assert.ok(!markup.includes('Apply 100 CRM updates'));
  }finally{globalThis.fetch=previousFetch;delete globalThis.__syncHooks;await rm(dir,{recursive:true,force:true});}
});
console.log(`${checks} bulk sync client/UI checks passed. No connected requests or customer changes.`);
