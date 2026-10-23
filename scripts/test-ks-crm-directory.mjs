import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createClient } from '@supabase/supabase-js';

const id = n => `44444444-4444-4444-8444-${String(n).padStart(12, '0')}`;
const customers = Array.from({length:1205}, (_, i) => ({id:id(i+1),external_id:i+1,customer_name:`Fictional ${String(i+1).padStart(4,'0')}`,username:`user_${i+1}`,email:`fictional${i+1}@example.invalid`,iptv_password:'NEVER-IN-DIRECTORY',notes:'PRIVATE-NOTE',source:'manual',account_status:'active',payment_status:'paid',trial:false,connections_allowed:3,expiration_at:'2030-10-28T12:00:00Z',monthly_price:10}));
let mode = 'ok', requests=[];
const client=createClient('https://fictional.supabase.co','fictional-publishable-key',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:async(input,options)=>{
  assert.equal(options.method,'GET','Directory fixture forbids writes');
  const url=new URL(input); assert.equal(url.origin,'https://fictional.supabase.co');
  const table=url.pathname.split('/').at(-1);
  if(table!=='iptv_customers') { assert.ok(['iptv_payments','iptv_customer_activity','iptv_reminder_queue'].includes(table)); return Response.json([]); }
  assert.equal(url.searchParams.get('select'),'*'); assert.equal(url.searchParams.get('order'),'id.asc'); assert.equal(url.searchParams.get('limit'),'200');
  const after=url.searchParams.get('id')?.replace(/^gt\./,''); requests.push(after??null);
  if(mode==='failure'&&after) return Response.json({message:'private backend error'},{status:400});
  if(mode==='repeat'&&after) return Response.json(customers.slice(0,200));
  return Response.json(customers.filter(c=>!after||c.id>after).slice(0,200));
}}});
const dir=await mkdtemp(join(process.cwd(),'node_modules','.ks-directory-'));
let hooks, route={pathname:'/admin/crm',state:null}, params={}, navigation=[], mediaListener, mediaQuery, mediaRemoved=false;
const originalWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
const same=(a,b)=>a&&b&&a.length===b.length&&a.every((x,i)=>Object.is(x,b[i]));
const frames={
  useState(initial){const n=hooks.si++;if(!(n in hooks.states))hooks.states[n]=typeof initial==='function'?initial():initial;return[hooks.states[n],v=>{hooks.states[n]=typeof v==='function'?v(hooks.states[n]):v;}];},
  useRef(initial){const n=hooks.ri++;return hooks.refs[n]??(hooks.refs[n]={current:initial});},
  useMemo:fn=>fn(),
  useEffect(effect,deps){const n=hooks.ei++;if(!same(hooks.effects[n]?.deps,deps)){const old=hooks.effects[n];hooks.effects[n]={deps};hooks.pending.push(()=>{old?.cleanup?.();hooks.effects[n].cleanup=effect();});}}
};
globalThis.__directoryHooks=frames;globalThis.__directoryClient=client;
globalThis.__directoryRoute={useParams:()=>params,useLocation:()=>route,useNavigate:()=>navigate};
function navigate(path,options){navigation.push([path,options]);route={pathname:path,state:options?.state};}
function fresh(width=390,state=null,customerId){for(const e of hooks?.effects??[])e?.cleanup?.();hooks={states:[],refs:[],effects:[],pending:[],si:0,ri:0,ei:0};route={pathname:customerId?`/admin/crm/customer/${customerId}`:'/admin/crm',state};params=customerId?{customerId}:{};navigation=[];mediaQuery={matches:width<1024,addEventListener:(_,fn)=>{mediaListener=fn;},removeEventListener:()=>{mediaRemoved=true;}};Object.defineProperty(globalThis,'window',{configurable:true,value:{innerWidth:width,matchMedia:()=>mediaQuery}});}
const nodes=e=>!React.isValidElement(e)?[]:[e,...React.Children.toArray(e.props.children).flatMap(nodes)];
const text=e=>typeof e==='string'||typeof e==='number'?String(e):React.isValidElement(e)?React.Children.toArray(e.props.children).map(text).join(''):'';
const drain=async()=>{for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve));};
async function compile(entry,fixture=false){
 const built=await build({entryPoints:[entry],bundle:true,write:false,platform:'node',format:'esm',jsx:'automatic',packages:'external',plugins:[{name:'offline-directory',setup(b){
 b.onResolve({filter:/^file:/},a=>({path:a.path,external:true}));
 if(fixture){
 b.onResolve({filter:/^react$/},()=>({path:'hooks',namespace:'fixture'}));
 b.onResolve({filter:/^react-router-dom$/},()=>({path:'router',namespace:'fixture'}));
 b.onResolve({filter:/\/lib\/supabase$/},()=>({path:'client',namespace:'fixture'}));
 b.onResolve({filter:/^\.\/(RoombaCrmLink|RoombaCustomerStatus|BulkXuiCheck|BulkCrmServiceSync|PreviewPaidOrders|RenewalPaymentForm|PaidRenewalReview|CustomerPortalLink)$/},()=>({path:'child',namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:a.path==='hooks'?`import React from ${JSON.stringify(import.meta.resolve('react'))};export default React;export const {useState,useRef,useMemo,useEffect}=globalThis.__directoryHooks;`:a.path==='router'?`import React from ${JSON.stringify(import.meta.resolve('react'))};export const {useParams,useLocation,useNavigate}=globalThis.__directoryRoute;export const Link=({to,state,children,...props})=>React.createElement('a',{href:to,...props},children);`:a.path==='client'?'export const supabase=globalThis.__directoryClient;':'export default ()=>null;'}));
 }
 }}]});const path=join(dir,`${entry.replaceAll('/','_')}.mjs`);await writeFile(path,built.outputFiles[0].text);return import(pathToFileURL(path));
}
try{
 const {loadCrmCustomers,customerPage,customerListState}=await compile('src/lib/crm-directory.ts');
 const all=await loadCrmCustomers(client);assert.equal(all.error,null);assert.equal(all.data.length,1205);assert.equal(new Set(all.data.map(c=>c.id)).size,1205);assert.deepEqual(requests,[null,...[200,400,600,800,1000,1200].map(id)]);
 for(const failure of ['failure','repeat']){mode=failure;const result=await loadCrmCustomers(client);assert.equal(result.data,null);assert.match(result.error.message,/could not be loaded completely/);assert.doesNotMatch(result.error.message,/private backend/);}mode='ok';
 assert.equal(customerPage(customers,9999,5).page,241);assert.equal(customerPage([],8,5).start,0);assert.deepEqual(customerListState({page:-1,sort:'injected',filter:'bad'}),{search:'',filter:'all',sort:'name',page:1});
 console.log('PASS: actual Supabase SDK loads all 1,205 fictional customers in seven stable SELECT pages; later failures/repeated pages discard partial lists.');
 const CRM=(await compile('src/pages/admin/CRMOperationsCenter.tsx',true)).default;
 const render=()=>{hooks.si=hooks.ri=hooks.ei=0;const tree=CRM();for(const e of hooks.pending.splice(0))e();return tree;};
 const loaded=async()=>{render();await drain();return render();};
 const directory=tree=>nodes(tree).find(n=>n.type?.name==='CrmCustomerDirectory');
 const pager=tree=>nodes(tree).find(n=>n.type?.name==='CustomerPager');
 fresh();let tree=await loaded();assert.equal(directory(tree).props.rows.length,5);assert.equal(nodes(tree).filter(n=>n.type==='article').length,0);assert.ok(!nodes(tree).some(n=>n.props.id==='crm-workspace-tools'));
 let html=renderToStaticMarkup(tree);assert.doesNotMatch(html,/NEVER-IN-DIRECTORY|PRIVATE-NOTE|fictional1@example.invalid/);assert.match(html,/1–5 of 1205/);assert.match(html,new RegExp(`/admin/crm/customer/${id(1)}`));
 pager(tree).props.onChange(2);tree=render();assert.equal(directory(tree).props.rows[0].id,id(6));assert.equal(navigation.at(-1)[1].state.crmList.page,2);
 const carried=directory(tree).props.listState;
 nodes(tree).find(n=>n.props.id==='crm-user-search').props.onChange({target:{value:'user_1205'}});tree=render();assert.deepEqual(directory(tree).props.rows.map(c=>c.id),[id(1205)]);assert.equal(pager(tree).props.page,1);
 nodes(tree).find(n=>n.props['aria-label']==='Sort customers').props.onChange({target:{value:'panel'}});tree=render();assert.equal(directory(tree).props.listState.sort,'panel');
 assert.ok(navigation.every(([path])=>!path.includes('user_1205')));
 nodes(tree).find(n=>n.props['aria-controls']==='crm-workspace-tools').props.onClick();tree=render();assert.ok(nodes(tree).some(n=>n.props.id==='crm-workspace-tools'));
 console.log('PASS: actual phone workspace renders five compact links, searches beyond row 1,000, resets pagination, saves list state privately and mounts summaries only on request.');
 fresh(390,{crmList:carried},id(6));tree=await loaded();assert.equal(nodes(tree).filter(n=>n.type==='article').length,1);assert.ok(text(tree).includes('Fictional 0006'));assert.ok(!text(tree).includes('Fictional 0001'));
 const back=nodes(tree).find(n=>n.type?.name==='Link'&&n.props.to==='/admin/crm');assert.deepEqual(back.props.state.crmList,carried);
 nodes(tree).find(n=>n.type==='button'&&text(n)==='Edit').props.onClick();tree=render();assert.match(renderToStaticMarkup(tree),/Edit IPTV Customer/);assert.equal(hooks.states[12].id,id(6));
 fresh(390,back.props.state);tree=await loaded();assert.equal(directory(tree).props.rows[0].id,id(6));
 fresh(390,null,id(9999));tree=await loaded();assert.equal(nodes(tree).filter(n=>n.type==='article').length,0);assert.match(text(tree),/record is not available/);
 fresh(1280);tree=await loaded();assert.equal(nodes(tree).filter(n=>n.type==='article').length,6);assert.equal(directory(tree),undefined);assert.ok(nodes(tree).some(n=>n.props.id==='crm-workspace-tools'));
 mediaQuery.matches=true;mediaListener();tree=render();assert.equal(directory(tree).props.rows.length,5);assert.equal(nodes(tree).filter(n=>n.type==='article').length,0);
 for(const e of hooks.effects)e?.cleanup?.();assert.equal(mediaRemoved,true);
 const app=await readFile('src/App.tsx','utf8');assert.match(app,/<Route path="admin" element={<A.Layout\s*\/>}>[\s\S]*?<Route path="crm\/customer\/:customerId" element={<A.CRM\s*\/>}/);
 fresh();mode='failure';tree=await loaded();assert.equal(directory(tree),undefined);assert.match(text(tree),/could not be loaded completely/);assert.doesNotMatch(text(tree),/No customers match/);mode='ok';
 console.log('PASS: selected record and Edit bind to the correct customer; Back restores page two, missing records stay empty, desktop keeps six full panels, and detail route remains inside the admin guard.');
}finally{
 for(const e of hooks?.effects??[])e?.cleanup?.();
 if(originalWindow)Object.defineProperty(globalThis,'window',originalWindow);else delete globalThis.window;
 for(const key of ['__directoryHooks','__directoryClient','__directoryRoute'])delete globalThis[key];
 await rm(dir,{recursive:true,force:true});
}
