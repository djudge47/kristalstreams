import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {StaticRouter} from 'react-router-dom/server.js';
const directory=await mkdtemp(join(process.cwd(),'node_modules','.ks-customer-crm-ui-'));
const originalFetch=globalThis.fetch,originalWindow=globalThis.window;
const id=n=>`66666666-6666-4666-8666-${String(n).padStart(12,'0')}`;
const owner=id(1),other=id(2),customer=id(10);
const reactPath=import.meta.resolve('react');
const hookSource=`import React from ${JSON.stringify(reactPath)};export default React;
 export const useState=initial=>{const h=globalThis.__portalHooks,i=h.index++;if(!(i in h.values))h.values[i]=typeof initial==='function'?initial():initial;return[h.values[i],v=>{h.values[i]=typeof v==='function'?v(h.values[i]):v;}];};
 export const useRef=initial=>{const h=globalThis.__portalHooks,i=h.refIndex++;return h.refs[i]??(h.refs[i]={current:initial});};
 const same=(a,b)=>a&&a.length===b.length&&a.every((x,i)=>x===b[i]);
 export const useCallback=(f,deps)=>{const h=globalThis.__portalHooks,i=h.memoIndex++;if(!same(h.memos[i]?.deps,deps))h.memos[i]={f,deps};return h.memos[i].f;};
 export const useEffect=(f,deps)=>{const h=globalThis.__portalHooks,i=h.effectIndex++;if(!same(h.effects[i]?.deps,deps)){const old=h.effects[i];h.effects[i]={deps};h.pending.push(()=>{old?.cleanup?.();h.effects[i].cleanup=f();});}};`;
const authSource=`export const supabase={auth:{getSession:async()=>({data:{session:{access_token:'fictional-token',user:{id:globalThis.__portalAccount}}}}),onAuthStateChange:callback=>{globalThis.__portalAuthChange=callback;return{data:{subscription:{unsubscribe(){}}}};}}};`;
async function compile(entry,name){const built=await build({entryPoints:[entry],bundle:true,write:false,format:'esm',platform:'node',jsx:'automatic',external:['react/jsx-runtime','react-router-dom','lucide-react'],plugins:[{name:'portal-fixture',setup(b){
 b.onResolve({filter:/^file:/},a=>({path:a.path,external:true}));b.onResolve({filter:/^react$/},()=>({path:'hooks',namespace:'fixture'}));b.onResolve({filter:/\/lib\/supabase$/},()=>({path:'auth',namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},a=>({loader:'js',contents:a.path==='auth'?authSource:hookSource}));
 }}]});const file=join(directory,name+'.mjs');await writeFile(file,built.outputFiles[0].text);return(await import(pathToFileURL(file))).default;}
const reset=()=>{globalThis.__portalHooks={values:[],refs:[],memos:[],effects:[],pending:[],index:0,refIndex:0,memoIndex:0,effectIndex:0};};
const render=(Component,props)=>{const h=globalThis.__portalHooks;h.index=0;h.refIndex=0;h.memoIndex=0;h.effectIndex=0;const tree=Component(props);for(const f of h.pending.splice(0))f();return tree;};
const nodes=e=>!React.isValidElement(e)?[]:[e,...React.Children.toArray(e.props.children).flatMap(nodes)];
const text=e=>typeof e==='string'||typeof e==='number'?String(e):React.isValidElement(e)?React.Children.toArray(e.props.children).map(text).join(''):'';
const button=(tree,label)=>nodes(tree).find(e=>e.type==='button'&&text(e)===label);
const html=tree=>renderToStaticMarkup(React.createElement(StaticRouter,{},tree));
const drain=async()=>{for(let n=0;n<25;n++)await new Promise(r=>setImmediate(r));};
const service={customerId:customer,username:'Fictional.Customer',name:'Fictional Customer',packageName:'12 Months + 1 Connection',connections:1,expiresAt:'2027-08-04T21:46:37Z',savedStatus:'active',legacyPaid:true,updatedAt:'2026-10-22T12:00:00Z'};
const payment={id:id(100),customerId:customer,amountCents:9500,method:'manual_paypal',paidAt:'2026-08-03T20:17:00Z',months:12,connections:1};
const snapshot={accountId:owner,checkedAt:'2026-10-22T18:00:00Z',services:[service],payments:[payment],nextCursor:{paidAt:payment.paidAt,id:payment.id}};
try{
 globalThis.window={setTimeout,clearTimeout};globalThis.__portalAccount=owner;
 const Customer=await compile('src/components/CustomerCrmService.tsx','customer');
 const Admin=await compile('src/pages/admin/CustomerPortalLink.tsx','admin');
 reset();const requests=[];globalThis.fetch=async(url,options)=>{requests.push({url,options});return Response.json(requests.length===1?snapshot:{...snapshot,payments:[{...payment,id:id(99),paidAt:'2026-07-03T20:17:00Z'}],nextCursor:null});};
 let tree=render(Customer,{accountId:owner});await drain();tree=render(Customer,{accountId:owner});let markup=html(tree);
 assert.ok(markup.includes('$95.00 · PayPal'));assert.ok(markup.includes('Aug 3, 2026'));assert.ok(markup.includes('4:17 PM EDT'));assert.ok(markup.includes('Payment history'));assert.ok(markup.includes('This receipt alone does not confirm a service extension'));assert.ok(!markup.includes('0 / 1'));
 assert.equal(requests[0].options.method,'GET');assert.ok(!requests[0].url.includes(customer));assert.ok(!requests[0].url.includes(owner));
 button(tree,'Load older payments').props.onClick();await drain();tree=render(Customer,{accountId:owner});markup=html(tree);
 assert.ok(requests[1].url.includes('beforeId='+payment.id));assert.equal((markup.match(/\$95\.00/g)||[]).length,2);assert.equal(button(tree,'Load older payments'),undefined);
 console.log('PASS: actual customer view shows amount/method/New York received date, separates saved service from receipt, and loads older payments');
 let release;globalThis.fetch=async()=>new Promise(resolve=>{release=resolve;});button(tree,'Refresh service details').props.onClick();await drain();
 globalThis.__portalAccount=other;globalThis.__portalAuthChange('SIGNED_IN',{user:{id:other}});tree=render(Customer,{accountId:owner});assert.ok(!html(tree).includes('$95.00'));assert.ok(html(tree).includes('session changed'));
 release(Response.json(snapshot));await drain();tree=render(Customer,{accountId:owner});assert.ok(!html(tree).includes('$95.00'));
 console.log('PASS: account switch immediately clears private records and discards an old account’s delayed response');
 for(const mode of ['unlinked','failure','hidden']){
  reset();globalThis.__portalAccount=owner;globalThis.fetch=async()=>mode==='failure'?Response.json({error:'internal database details'},{status:503}):mode==='hidden'?Response.json({}, {status:404}):Response.json({...snapshot,services:[],payments:[],nextCursor:null});
  render(Customer,{accountId:owner});await drain();tree=render(Customer,{accountId:owner});markup=html(tree);
  if(mode==='unlinked'){assert.ok(markup.includes('has not been linked'));assert.ok(markup.includes('does not mean your service is inactive'));}
  if(mode==='failure'){assert.ok(markup.includes('do not pay again'));assert.ok(!markup.includes('internal database'));assert.ok(!markup.includes('$95.00'));}
  if(mode==='hidden')assert.equal(tree,null);
 }
 console.log('PASS: missing links and read failures are distinct from unpaid/inactive service; unavailable rollout stays hidden');
 reset();globalThis.__portalAccount=id(3);let linked=false;const adminRequests=[];
 const review={customerId:customer,panelId:1001,username:service.username,customerName:service.name,userId:owner,email:'owner@example.invalid',emailConfirmedAt:'2026-01-01T00:00:00Z',linked:false};
 globalThis.fetch=async(url,options)=>{const body=JSON.parse(options.body);adminRequests.push(body);if(body.action==='link')linked=true;return Response.json({review:{...review,linked}});};
 const props={customer:{id:customer,external_id:1001,username:service.username,customer_name:service.name},onClose(){}};
 tree=render(Admin,props);const emailInput=()=>nodes(tree).find(e=>e.type==='input'&&e.props.type==='email');emailInput().props.onChange({target:{value:review.email}});tree=render(Admin,props);
 nodes(tree).find(e=>e.type==='form').props.onSubmit({preventDefault(){}});await drain();tree=render(Admin,props);
 assert.equal(adminRequests.length,1);assert.equal(adminRequests[0].action,'review');assert.equal(linked,false);assert.equal(button(tree,'Save verified account link').props.disabled,true);
 nodes(tree).find(e=>e.type==='input'&&e.props.type==='checkbox').props.onChange({target:{checked:true}});tree=render(Admin,props);const save=button(tree,'Save verified account link');assert.equal(save.props.disabled,false);save.props.onClick();save.props.onClick();await drain();tree=render(Admin,props);
 assert.equal(adminRequests.filter(r=>r.action==='link').length,1);assert.equal(adminRequests[1].review.userId,owner);assert.ok(html(tree).includes('Website account linked'));assert.ok(html(tree).includes('Service and payments have not been changed'));
 emailInput().props.onChange({target:{value:'different@example.invalid'}});tree=render(Admin,props);assert.equal(button(tree,'Save verified account link'),undefined);
 console.log('PASS: actual admin form requires exact email review plus explicit ownership confirmation; repeated clicks save once; edited identity invalidates review');
}finally{globalThis.fetch=originalFetch;if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;delete globalThis.__portalHooks;delete globalThis.__portalAccount;delete globalThis.__portalAuthChange;await rm(directory,{recursive:true,force:true});}
