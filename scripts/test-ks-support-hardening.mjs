import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createSupportEmailHandler} from '../supabase/functions/resend-email/handler.js';
const {PGlite}=await import(pathToFileURL(process.env.KS_PGLITE_MODULE));
const db=new PGlite();
const id=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const owner=id(1),other=id(2),actor=id(3),date='2026-01-01T00:00:00Z';
await db.exec(await readFile(new URL('./fixtures/ks-support-hardening.sql',import.meta.url),'utf8'));
for(const [uid,email,confirmed] of [[owner,'owner@example.invalid',date],[other,'other@example.invalid',date],[actor,'djudge47@gmail.com',date],[id(4),'unconfirmed@example.invalid',null]]){
 await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,$3)',[uid,email,confirmed]);
 await db.query('insert into public.profiles(id,email) values($1,$2)',[uid,email]);
}
const before=(await db.query('select to_jsonb(p) v from public.profiles p order by id')).rows;
const source=await readFile(new URL('./ks-support-profile-hardening-schema.sql',import.meta.url),'utf8');
assert.equal(source,await readFile(new URL('../supabase/migrations/20261022211913_ks_support_and_profile_hardening.sql',import.meta.url),'utf8'));
await db.exec(source);
assert.deepEqual((await db.query('select to_jsonb(p) v from public.profiles p order by id')).rows,before);
assert.deepEqual((await db.query('select * from public.unrelated_service')).rows,[{id:1,enabled:false}]);
let count=0;const check=async(name,fn)=>{await fn();console.log('PASS: '+name);count++;};
async function role(name,uid,email,fn){await db.query("select set_config('request.user',$1,false),set_config('request.email',$2,false)",[uid||'',email||'']);await db.exec(`set role ${name}`);try{return await fn();}finally{await db.exec('reset role');}}
const order=['p_id','p_kind','p_actor','p_ticket','p_email','p_name','p_subject','p_message'];
async function rpc(name,args){return role('service_role',null,null,async()=>{
 const names=name==='ks_support_ready'?[]:name==='ks_support_reserve'?order:['p_id','p_state','p_provider'];
 return (await db.query(`select public.${name}(${names.map((_,i)=>'$'+(i+1)).join(',')}) v`,names.map(k=>args[k]??null))).rows[0].v;
});}
const contact=n=>({p_id:id(n),p_kind:'contact',p_actor:null,p_ticket:null,p_email:'visitor@example.invalid',p_name:'Fictional Visitor',p_subject:'Fictional question',p_message:'Fictional message'});
await check('migration preserves existing data; browser edits cannot change entitlements, email or payment identity',async()=>{
 await role('authenticated',owner,'owner@example.invalid',async()=>{
  await db.query("update public.profiles set full_name='Fictional Owner',notifications_enabled=true where id=$1",[owner]);
  for(const field of ['subscription_tier','subscription_status','connections_allowed','active_connections','subscription_expires_at','stripe_checkout_session_id','stripe_payment_intent_id','email','id'])
   assert.equal((await db.query("select has_column_privilege('authenticated','public.profiles',$1,'UPDATE') allowed",[field])).rows[0].allowed,false);
  await assert.rejects(db.exec("update public.profiles set subscription_tier='platinum'"),/permission denied/);
  assert.equal((await db.query("update public.profiles set full_name='wrong' where id=$1 returning id",[other])).rows.length,0);
  await assert.rejects(db.exec('delete from public.profiles'),/permission denied/);
 });
 await role('service_role',null,null,()=>db.query("update public.profiles set subscription_tier='gold' where id=$1",[owner]));
});
await check('missing-profile recovery can insert only own identity and receives inactive defaults',async()=>{
 await db.query('delete from public.profiles where id=$1',[other]);
 await role('authenticated',other,'other@example.invalid',async()=>{
  await assert.rejects(db.query("insert into public.profiles(id,email,subscription_status) values($1,$2,'active')",[other,'other@example.invalid']),/row-level security/);
  await assert.rejects(db.query('insert into public.profiles(id,email) values($1,$2)',[other,'wrong@example.invalid']),/row-level security/);
  const p=(await db.query('insert into public.profiles(id,email,full_name) values($1,$2,null) returning subscription_status,subscription_tier,connections_allowed',[other,'other@example.invalid'])).rows[0];
  assert.deepEqual(p,{subscription_status:'inactive',subscription_tier:'basic',connections_allowed:1});
 });
});
await check('older dashboard recovery accepts only the same inactive baseline, never a paid or expired entitlement',async()=>{
 await db.query('delete from public.profiles where id=$1',[other]);
 await role('authenticated',other,'other@example.invalid',async()=>{
  await assert.rejects(db.query("insert into public.profiles(id,email,subscription_tier,subscription_status,connections_allowed,active_connections) values($1,$2,'gold','active',3,0)",[other,'other@example.invalid']),/row-level security/);
  await db.query("insert into public.profiles(id,email,subscription_tier,subscription_status,connections_allowed,active_connections) values($1,$2,'basic','inactive',1,0)",[other,'other@example.invalid']);
 });
});
await check('public contact creates one durable ticket; exact replay never reserves another send or changes an owner',async()=>{
 const first=await rpc('ks_support_reserve',contact(10));assert.equal(first.dispatch,true);assert.equal(first.recipient,null);
 assert.equal((await rpc('ks_support_reserve',contact(10))).dispatch,false);
 await assert.rejects(rpc('ks_support_reserve',{...contact(10),p_message:'changed'}),/support_request_changed/);
 const t=(await db.query('select user_id,customer_email,description from public.support_tickets where id=$1',[id(10)])).rows[0];assert.equal(t.user_id,null);assert.equal(t.customer_email,'visitor@example.invalid');assert.equal(t.description,'Fictional message');
});
await check('private functions/ledger are browser-inaccessible and client columns cannot forge recipients or delivery',async()=>{
 for(const name of ['anon','authenticated'])await role(name,owner,'owner@example.invalid',async()=>{
  await assert.rejects(db.exec('select request_id from public.ks_support_dispatches'),/permission denied/);
  await assert.rejects(db.exec("select public.ks_support_finish('10000000-0000-4000-8000-000000000010','sent',null)"),/permission denied/);
 });
 await role('authenticated',owner,'owner@example.invalid',async()=>{
  await assert.rejects(db.exec("update public.support_tickets set customer_email='wrong@example.invalid'"),/permission denied/);
  await assert.rejects(db.exec("update public.ticket_replies set delivery_status='sent'"),/permission denied/);
 });
});
await db.query("insert into public.support_tickets(id,user_id,subject,description,customer_email) values($1,$2,'Fixture subject','Fixture body','wrong@example.invalid')",[id(20),owner]);
const staff=n=>({p_id:id(n),p_kind:'ticket_reply',p_actor:actor,p_ticket:id(20),p_email:null,p_name:null,p_subject:null,p_message:'A fictional staff answer <script>'});
await check('staff reply resolves confirmed ticket owner instead of spoofed contact fields; non-admin and unconfirmed identities are rejected',async()=>{
 await assert.rejects(rpc('ks_support_reserve',{...staff(21),p_actor:other}),/support_admin_required/);
 await assert.rejects(rpc('ks_support_reserve',{...staff(21),p_actor:id(4)}),/support_confirmed_account_required/);
 const v=await rpc('ks_support_reserve',staff(21));assert.equal(v.recipient,'owner@example.invalid');
 await rpc('ks_support_finish',{p_id:id(21),p_state:'sent',p_provider:'fictional-provider-id'});
 assert.equal((await rpc('ks_support_reserve',staff(21))).state,'sent');
 await role('authenticated',owner,'owner@example.invalid',async()=>assert.equal((await db.query('select message,delivery_status,is_staff from public.ticket_replies where id=$1',[id(21)])).rows[0].delivery_status,'sent'));
 await assert.rejects(rpc('ks_support_finish',{p_id:id(21),p_state:'failed'}),/support_result_conflict/);
});
await check('per-email contact limits are durable and reject the next request',async()=>{
 await rpc('ks_support_reserve',contact(11));await rpc('ks_support_reserve',contact(12));
 await assert.rejects(rpc('ks_support_reserve',contact(13)),/support_rate_limited/);
});
const env={SUPABASE_URL:'https://wftfxerblhlsxiijtfbo.supabase.co',SUPABASE_ANON_KEY:'fictional-anon',SUPABASE_SERVICE_ROLE_KEY:'fictional-service',RESEND_API_KEY:'fictional-mail'};
let identity={id:actor,email:'djudge47@gmail.com',email_confirmed_at:date,is_anonymous:false},authError=false,dbFailure=false,provider='sent',finishFailure=false;const sends=[];
const createClient=(_url,key)=>key==='fictional-anon'?{auth:{getUser:async()=>({data:{user:identity},error:authError?{}:null})}}:{rpc:async(name,args)=>{
 if(dbFailure||finishFailure&&name==='ks_support_finish')return{error:{message:'fictional private failure'}};
 try{return{data:await rpc(name,args)}}catch(error){return{error:{message:error.message}};}
}};
const handler=createSupportEmailHandler({env,createClient,fetchImpl:async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');sends.push({body:JSON.parse(options.body),headers:options.headers});if(provider==='timeout')throw Error('fictional timeout');if(provider==='reject')return Response.json({message:'fictional rejection'},{status:400});return Response.json({id:'fictional-delivery'});}});
const message=n=>({type:'ticket_reply',requestId:id(n),ticketId:id(20),message:'Fictional answer <script>'});
const request=async(body,patch={})=>{const r=await handler(new Request('https://fictional.invalid/function',{method:'POST',headers:{origin:'https://kristalstream.com','content-type':'application/json',authorization:'Bearer fictional-user'},body:JSON.stringify(body),...patch}));return{status:r.status,body:await r.json()};};
await check('HTTP auth, origin, body limits, project and recipient injection fail before a mail attempt',async()=>{
 const start=sends.length;
 for(const body of [{...message(30),to:'wrong@example.invalid'},{...message(30),message:'x'.repeat(17000)},{...message(30),requestId:'bad'}])assert.equal((await request(body)).status,400);
 assert.equal((await request(message(30),{headers:{origin:'https://wrong.invalid','content-type':'application/json'}})).status,403);
 assert.equal((await request(message(30),{headers:{origin:'https://kristalstream.com','content-type':'application/json'}})).status,401);
 identity={...identity,email:'other@example.invalid'};assert.equal((await request(message(30))).status,403);identity={...identity,email:'djudge47@gmail.com'};
 authError=true;assert.equal((await request(message(30))).status,401);authError=false;
 const old=env.SUPABASE_URL;env.SUPABASE_URL='https://wrong.supabase.co';assert.equal((await request(message(30))).status,503);env.SUPABASE_URL=old;
 dbFailure=true;assert.equal((await request(message(30))).status,503);dbFailure=false;assert.equal(sends.length,start);
});
await check('one verified reply is persisted and HTML-escaped; duplicate calls cannot send twice',async()=>{
 const start=sends.length;const first=await request(message(31));assert.equal(first.status,200);assert.equal(first.body.state,'sent');
 const again=await request(message(31));assert.equal(again.status,200);assert.equal(sends.length,start+1);
 assert.equal(sends.at(-1).body.to[0],'owner@example.invalid');assert.ok(sends.at(-1).body.html.includes('&lt;script&gt;'));assert.equal(sends.at(-1).headers['Idempotency-Key'],`ks-support/v1/${id(31)}`);
 assert.ok(!JSON.stringify(first.body).includes('owner@example.invalid'));
});
await check('timeout, provider rejection and finish-write failure stay saved without automatic resend',async()=>{
 for(const [n,mode,finish] of [[32,'timeout',false],[33,'reject',false],[34,'sent',true]]){
  provider=mode;finishFailure=finish;const start=sends.length;const r=await request(message(n));assert.equal(r.status,202);assert.equal(r.body.success,false);
  finishFailure=false;await request(message(n));assert.equal(sends.length,start+1);
 }
 provider='sent';
});
await check('unauthenticated newsletter/welcome cannot send; a confirmed account can only request its own fixed template',async()=>{
 const b={type:'newsletter',requestId:id(40),to:'wrong@example.invalid',data:{user_name:'Fictional'}};
 assert.equal((await request(b,{headers:{origin:'https://kristalstream.com','content-type':'application/json'}})).status,401);
 assert.equal((await request(b)).status,403);
 b.to='djudge47@gmail.com';const r=await request(b);assert.equal(r.status,200);assert.equal(sends.at(-1).body.subject,'Kristal Streams newsletter request');
});
await check('readiness is a read-only contract; a legacy public contact stays inbox-only and deduplicated',async()=>{
 const start=sends.length;
 const ready=await handler(new Request('https://fictional.invalid/function',{headers:{origin:'https://kristalstream.com'}}));assert.equal(ready.status,200);assert.equal((await ready.json()).ready,true);assert.equal(sends.length,start);
 const b={type:'contact',to:'support@kristalstream.com',data:{from_name:'Legacy Fixture',from_email:'legacy@example.invalid',subject:'Legacy question',message:'Fictional legacy message'}};
 assert.equal((await request(b)).status,200);assert.equal((await request(b)).status,200);assert.equal(sends.length,start+1);assert.equal(sends.at(-1).body.to[0],'support@kristalstream.com');
 assert.equal((await request({...b,to:'wrong@example.invalid'})).status,400);
 assert.ok(!JSON.stringify(sends.at(-1).body).includes('subscription is ready'));
});
console.log(`${count} support/profile hardening checks passed with fictional data and a stubbed mail provider. No connected write, email, XUI operation or credit spend.`);
await db.close();
