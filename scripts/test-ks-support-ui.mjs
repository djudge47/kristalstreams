import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
const directory=await mkdtemp(join(process.cwd(),'node_modules','.ks-support-ui-'));
const reactPath=import.meta.resolve('react');
const hookSource=`import React from ${JSON.stringify(reactPath)};export default React;
export const useState=initial=>{const h=globalThis.__supportHooks,i=h.index++;if(!(i in h.values))h.values[i]=typeof initial==='function'?initial():initial;return[h.values[i],v=>h.values[i]=typeof v==='function'?v(h.values[i]):v];};
export const useRef=initial=>{const h=globalThis.__supportHooks,i=h.refIndex++;return h.refs[i]??(h.refs[i]={current:initial});};
export const useMemo=f=>f();export const useCallback=f=>f;export const useEffect=f=>{const h=globalThis.__supportHooks,i=h.effectIndex++;if(!h.effects[i]){h.effects[i]=true;h.pending.push(f);}};export const memo=f=>f;`;
const authSource=`export const supabase={from:table=>{if(table!=='support_tickets')throw Error('Unexpected fixture table');const q={select:()=>q,order:async()=>({data:globalThis.__supportTickets,error:null})};return q;}};`;
const mailSource=`export const requestSupportMail=input=>globalThis.__supportMail(input);`;
async function compile(entry,name){const result=await build({entryPoints:[entry],bundle:true,write:false,format:'esm',platform:'node',jsx:'automatic',external:['react/jsx-runtime','lucide-react'],plugins:[{name:'support-fixtures',setup(b){
 b.onResolve({filter:/^file:/},a=>({path:a.path,external:true}));b.onResolve({filter:/^react$/},()=>({path:'hooks',namespace:'fixture'}));b.onResolve({filter:/\/lib\/supabase$/},()=>({path:'auth',namespace:'fixture'}));b.onResolve({filter:/\/lib\/support-mail$/},()=>({path:'mail',namespace:'fixture'}));
 b.onResolve({filter:/\/lib\/email-service$/},()=>({path:'newsletter',namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},a=>({loader:'js',contents:a.path==='auth'?authSource:a.path==='mail'?mailSource:a.path==='newsletter'?`export const validateEmail=()=>true;export const emailRateLimit={canSend:()=>true};export const sendNewsletterConfirmation=input=>globalThis.__supportMail(input);`:hookSource}));
}}]});const file=join(directory,name+'.mjs');await writeFile(file,result.outputFiles[0].text);return(await import(pathToFileURL(file))).default;}
const reset=()=>globalThis.__supportHooks={values:[],refs:[],effects:[],pending:[],index:0,refIndex:0,effectIndex:0};
const render=C=>{const h=globalThis.__supportHooks;h.index=h.refIndex=h.effectIndex=0;const tree=C({});for(const effect of h.pending.splice(0))effect();return tree;};
const nodes=e=>!React.isValidElement(e)?[]:[e,...React.Children.toArray(e.props.children).flatMap(nodes)];
const text=e=>typeof e==='string'?e:React.isValidElement(e)?React.Children.toArray(e.props.children).map(text).join(''):'';
const button=(tree,label)=>nodes(tree).find(e=>e.type==='button'&&text(e)===label);
const drain=async()=>{for(let n=0;n<15;n++)await new Promise(resolve=>setImmediate(resolve));};
try{
 const Admin=await compile('src/pages/admin/SupportTickets.tsx','admin');reset();
 const ticket={id:'10000000-0000-4000-8000-000000000020',subject:'Fictional support ticket',description:'Fictional problem',status:'open',user_id:'10000000-0000-4000-8000-000000000001'};
 globalThis.__supportTickets=[ticket];render(Admin);await drain();let tree=render(Admin);
 nodes(tree).find(e=>e.type==='div'&&e.props.onClick&&text(e).includes(ticket.subject)).props.onClick();tree=render(Admin);
 const textarea=()=>nodes(tree).find(e=>e.type==='textarea');textarea().props.onChange({target:{value:'Fictional answer'}});tree=render(Admin);
 assert.equal(button(tree,'Send Reply').props.disabled,false,'Tickets without a browser contact email must still use their server-resolved owner');
 let calls=0,release;globalThis.__supportMail=input=>{calls++;assert.deepEqual(input,{type:'ticket_reply',ticketId:ticket.id,message:'Fictional answer'});return new Promise(resolve=>release=resolve);};
 const send=button(tree,'Send Reply');send.props.onClick();send.props.onClick();assert.equal(calls,1);tree=render(Admin);assert.equal(textarea().props.disabled,true);
 release({success:false,state:'unknown',error:'Saved; delivery unknown. Check the same request.'});await drain();tree=render(Admin);assert.ok(text(tree).includes('Saved; delivery unknown'));assert.equal(textarea().props.value,'Fictional answer');
 globalThis.__supportMail=async()=>({success:true,state:'sent'});button(tree,'Send Reply').props.onClick();await drain();tree=render(Admin);assert.ok(text(tree).includes('accepted by the email provider'));assert.equal(textarea().props.value,'');
 console.log('PASS: actual admin form uses only ticket ID/message, works without a browser email, blocks double clicks and distinguishes unknown from sent');
 const Newsletter=await compile('src/components/NewsletterSignup.tsx','newsletter');reset();tree=render(Newsletter);
 globalThis.__supportMail=async()=>({success:false,error:'Confirm your website email first.'});nodes(tree).find(e=>e.type==='input'&&e.props.type==='email').props.onChange({target:{value:'fixture@example.invalid'}});tree=render(Newsletter);
 await nodes(tree).find(e=>e.type==='form').props.onSubmit({preventDefault(){}});tree=render(Newsletter);assert.ok(text(tree).includes('Confirm your website email first.'));assert.ok(!text(tree).includes('Newsletter request recorded.'));
 console.log('PASS: actual newsletter form reads result.success and cannot claim success merely because an error result is an object');
}finally{for(const name of ['__supportHooks','__supportTickets','__supportMail'])delete globalThis[name];await rm(directory,{recursive:true,force:true});}
