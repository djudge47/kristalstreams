import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const directory=await mkdtemp(join(process.cwd(),'node_modules','.ks-renewal-payment-view-'));
const oldFetch=globalThis.fetch,oldStorage=globalThis.sessionStorage;
try{
 const reactPath=import.meta.resolve('react');const built=await build({entryPoints:['src/pages/admin/RenewalPaymentForm.tsx'],bundle:true,write:false,format:'esm',platform:'node',jsx:'automatic',external:['react/jsx-runtime','lucide-react'],plugins:[{name:'offline-hooks',setup(b){
 b.onResolve({filter:/^file:/},a=>({path:a.path,external:true}));b.onResolve({filter:/^react$/},()=>({path:'hooks',namespace:'fixture'}));b.onResolve({filter:/\/lib\/supabase$/},()=>({path:'auth',namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},a=>({loader:'js',contents:a.path==='auth'?`export const supabase={auth:{getSession:async()=>({data:{session:{access_token:'fictional-token'}}})}};`
 :`import React from ${JSON.stringify(reactPath)};export default React;export const useState=initial=>{const h=globalThis.__paymentHooks,i=h.index++;if(!(i in h.values))h.values[i]=typeof initial==='function'?initial():initial;return[h.values[i],v=>{h.values[i]=typeof v==='function'?v(h.values[i]):v;}];};export const useRef=initial=>{const h=globalThis.__paymentHooks,i=h.refIndex++;return h.refs[i]??(h.refs[i]={current:initial});};`}));
 }}]});
 const file=join(directory,'form.mjs');await writeFile(file,built.outputFiles[0].text);const{default:Form}=await import(pathToFileURL(file));
 const storage=new Map();globalThis.sessionStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
 const reset=()=>{globalThis.__paymentHooks={values:[],refs:[],index:0,refIndex:0};};reset();
 const customer={id:'44444444-4444-4444-8444-444444444444',username:'fictional_customer',customer_name:null,package_name:'6 Months + 3 Connections',connections_allowed:3};const original=structuredClone(customer);let refreshes=0,requests=[],saved;
 const props={customer,onClose(){},onSaved:async()=>{refreshes++;}};
 const render=()=>{const h=globalThis.__paymentHooks;h.index=0;h.refIndex=0;return Form(props);};
 const nodes=e=>!React.isValidElement(e)?[]:[e,...React.Children.toArray(e.props.children).flatMap(nodes)];
 const text=e=>typeof e==='string'||typeof e==='number'?String(e):React.isValidElement(e)?React.Children.toArray(e.props.children).map(text).join(''):'';
 const control=(tree,label)=>{const l=nodes(tree).find(e=>e.type==='label'&&text(e).startsWith(label));assert.ok(l,label);return nodes(l).find(e=>['select','input'].includes(e.type));};
 let tree=render();assert.ok(renderToStaticMarkup(tree).includes('$150.00'));assert.equal(control(tree,'Amount actually').props.value,'');assert.equal(control(tree,'Payment received').props.value,'');
 control(tree,'Requested months').props.onChange({target:{value:'12'}});tree=render();control(tree,'Requested connections').props.onChange({target:{value:'2'}});tree=render();assert.ok(renderToStaticMarkup(tree).includes('$165.00'));
 control(tree,'Requested months').props.onChange({target:{value:'6'}});tree=render();control(tree,'Requested connections').props.onChange({target:{value:'3'}});tree=render();
 for(const[label,value]of[['Amount actually','150.00'],['Payment received',new Date(Date.now()-3600000-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)],['Payment method','cash_app']]){control(tree,label).props.onChange({target:{value}});tree=render();}
 control(tree,'I confirm').props.onChange({target:{checked:true}});tree=render();
 globalThis.fetch=async(url,options)=>{requests.push({url,options});if(options.method==='POST'){saved=JSON.parse(options.body);throw Error('fictional lost response after commit');}
 return{ok:true,status:200,json:async()=>({mode:'crm-renewal-payment',providerWrites:false,creditsSpent:false,receipt:{...saved.input,receiptId:saved.receiptId,paymentId:'55555555-5555-4555-8555-555555555555',catalogCents:15000,recordedAt:new Date().toISOString(),serviceUpdated:false}})};};
 const submit=nodes(tree).find(e=>e.type==='form').props.onSubmit;submit({preventDefault(){}});submit({preventDefault(){}});
 for(let i=0;i<30&&globalThis.__paymentHooks.values[11];i++)await new Promise(r=>setImmediate(r));
 assert.equal(requests.length,1);assert.equal(saved.input.months,6);assert.equal(saved.input.connections,3);assert.equal(saved.input.amountCents,15000);assert.equal(JSON.parse([...storage.values()][0]).receiptId,saved.receiptId);
 console.log('PASS: actual month/connection controls show new price; actual amount/date required; duplicate submit issues one request/reference');
 tree=render();nodes(tree).find(e=>e.type==='button'&&text(e)==='Check saved result').props.onClick();
 for(let i=0;i<30&&globalThis.__paymentHooks.values[11];i++)await new Promise(r=>setImmediate(r));
 tree=render();assert.ok(renderToStaticMarkup(tree).includes('Payment saved once'));assert.equal(requests[1].options.method,'GET');assert.equal(refreshes,1);assert.deepEqual(customer,original);
 console.log('PASS: uncertain write blocks new entries and recovers the saved reference with no extra POST or service mutation');
 reset();tree=render();assert.ok(renderToStaticMarkup(tree).includes('Check saved result'));assert.equal(requests.length,2);
 nodes(tree).find(e=>e.type==='button'&&text(e)==='Check saved result').props.onClick();for(let i=0;i<30&&globalThis.__paymentHooks.values[11];i++)await new Promise(r=>setImmediate(r));tree=render();
 nodes(tree).find(e=>e.type==='button'&&text(e)==='Record another payment').props.onClick();tree=render();assert.equal(control(tree,'Amount actually').props.value,'');assert.equal(storage.size,0);assert.equal(requests.filter(r=>r.options.method==='POST').length,1);
 console.log('PASS: reopening retains recovery reference; a second entry requires an explicit new action and fresh actual payment details');
}finally{globalThis.fetch=oldFetch;if(oldStorage===undefined)delete globalThis.sessionStorage;else globalThis.sessionStorage=oldStorage;delete globalThis.__paymentHooks;await rm(directory,{recursive:true,force:true});}
