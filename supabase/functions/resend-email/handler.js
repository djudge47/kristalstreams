const project='https://wftfxerblhlsxiijtfbo.supabase.co';
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const email=v=>typeof v==='string'&&v.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v,fields)=>object(v)&&Object.keys(v).sort().join(',')===[...fields].sort().join(',');
const clean=(v,max,required=true)=>typeof v==='string'&&v.length<=max&&(!required||v.trim().length>0);
const escape=v=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const supportOrigins=['https://kristalstream.com','https://www.kristalstream.com','https://kristalstreams-git-codex-crm-req-e19c93-djudge47-7683s-projects.vercel.app'];
async function readBody(req){
 if(!/^application\/json(?:;\s*charset=utf-8)?$/i.test(req.headers.get('content-type')||''))throw Error('invalid');
 const reader=req.body?.getReader();if(!reader)throw Error('invalid');const chunks=[];let size=0;
 try{while(true){const{done,value}=await reader.read();if(done)break;if((size+=value.byteLength)>16384)throw Error('invalid');chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 }finally{await reader.cancel().catch(()=>{});}
}
export function createSupportEmailHandler({createClient,env,fetchImpl=fetch,origins=supportOrigins}={}){
 return async req=>{
  const origin=req.headers.get('origin');
  const headers={'Content-Type':'application/json','Cache-Control':'private, no-store','Vary':'Origin, Authorization',...(origins.includes(origin)?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'GET, POST, OPTIONS'}:{})};
  const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
  if(!origins.includes(origin))return reply(403,{success:false,error:'Use the Kristal Streams support form.'});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(!['GET','POST'].includes(req.method))return reply(405,{success:false,error:'Method not allowed.'});
  const support=env.SUPPORT_EMAIL||'support@kristalstream.com';
  if(env.SUPABASE_URL!==project||!env.SUPABASE_ANON_KEY||!env.SUPABASE_SERVICE_ROLE_KEY||!env.RESEND_API_KEY||!email(support))return reply(503,{success:false,error:'Support is temporarily unavailable.'});
  if(req.method==='GET'){
   try{const admin=createClient(project,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});const{data,error}=await admin.rpc('ks_support_ready');return reply(!error&&data===true?200:503,{capability:'ks-support/v1',ready:!error&&data===true});}
   catch{return reply(503,{capability:'ks-support/v1',ready:false});}
  }
  let body;try{body=await readBody(req);}catch{return reply(400,{success:false,error:'Enter a valid support request.'});}
  if(exact(body,['type','to','data'])&&body.type==='contact'&&object(body.data)){
   // Compatibility for the current production contact form. No arbitrary recipient
   // or customer auto-response is permitted; matching retries share an hourly ID.
   const d=body.data,canonical=JSON.stringify(['contact',body.to,d.from_name,d.from_email||d.reply_to,d.subject,d.message,Math.floor(Date.now()/3600000)]);
   const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical)));
   const h=Array.from(bytes.slice(0,16),v=>v.toString(16).padStart(2,'0')).join('');
   body={...body,requestId:`${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-8${h.slice(17,20)}-${h.slice(20,32)}`};
  }
  const staff=body?.type==='ticket_reply';
  if(!uuid(body?.requestId)||(staff?!exact(body,['type','requestId','ticketId','message'])||!uuid(body.ticketId)||!clean(body.message,8000):!exact(body,['type','requestId','to','data'])||!['contact','support','welcome','newsletter'].includes(body.type)||!object(body.data)))return reply(400,{success:false,error:'Enter a valid support request.'});
  const input=body.data||{};
  if(!staff&&(Object.keys(input).length>10||Object.values(input).some(v=>!clean(v,8000,false))))return reply(400,{success:false,error:'Enter a valid support request.'});
  if(['contact','support'].includes(body.type)&&(body.to!==support||!clean(input.subject,196)||/[\r\n]/.test(input.subject)||!clean(input.message,8000)))return reply(400,{success:false,error:'Use the support inbox for incoming requests.'});
  let user=null;
  try{
   if(body.type!=='contact'){
    const token=/^Bearer ([^\s]+)$/i.exec(req.headers.get('authorization')||'')?.[1];
    if(!token)return reply(401,{success:false,error:'Sign in to your confirmed website account first.'});
    const{data,error}=await createClient(project,env.SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}}).auth.getUser(token);user=data?.user;
    if(error||!uuid(user?.id))return reply(401,{success:false,error:'Sign in to your website account again.'});
    if(!user.email_confirmed_at||user.is_anonymous||!email(user.email))return reply(403,{success:false,error:'Confirm your website email first.'});
    if(staff&&user.email.trim().toLowerCase()!=='djudge47@gmail.com')return reply(403,{success:false,error:'Only the administrator can send a staff reply.'});
    if(!staff&&body.type!=='support'&&body.to!==user.email.trim().toLowerCase())return reply(403,{success:false,error:'A confirmation can only be sent to your own verified website email.'});
   }
   const contactEmail=body.type==='contact'?input.from_email||input.reply_to:user?.email.trim().toLowerCase();
   if(!staff&&(!email(contactEmail)||(input.from_name&&!clean(input.from_name,120))))return reply(400,{success:false,error:'Enter a valid contact name and email.'});
   const admin=createClient(project,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
   const{data:reserved,error:reserveError}=await admin.rpc('ks_support_reserve',{p_id:body.requestId,p_kind:body.type,p_actor:user?.id||null,p_ticket:staff?body.ticketId:null,p_email:staff?null:contactEmail,p_name:body.type==='contact'?input.from_name||'Website Visitor':null,p_subject:staff?null:input.subject||null,p_message:staff?body.message.trim():input.message||null});
   if(reserveError){if(reserveError.message==='support_rate_limited')return reply(429,{success:false,error:'Too many requests. Please try later.'});return reply(reserveError.message==='support_request_changed'?409:503,{success:false,error:'The request could not be verified. Nothing was sent by this attempt.'});}
   if(!reserved||reserved.requestId!==body.requestId||typeof reserved.dispatch!=='boolean'||!['sending','sent','failed','unknown'].includes(reserved.state)||reserved.dispatch&&reserved.state!=='sending')throw Error('invalid_reservation');
   const result=state=>({success:state==='sent',state,requestId:body.requestId,ticketId:reserved.ticketId||null});
   if(!reserved.dispatch)return reply(reserved.state==='sent'?200:202,result(reserved.state));
   // Reserve before the single provider attempt. Replays cannot send after timeouts/crashes.
   const recipient=['contact','support'].includes(body.type)?support:reserved.recipient;
   if(!email(recipient)||!clean(reserved.subject,200)||/[\r\n]/.test(reserved.subject)||!clean(reserved.message,8000))throw Error('invalid_envelope');
   let state='unknown',providerId=null;
   try{
    const response=await fetchImpl('https://api.resend.com/emails',{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`ks-support/v1/${body.requestId}`},body:JSON.stringify({from:env.RESEND_FROM_EMAIL||'Kristal Streams <noreply@kristalstream.com>',to:[recipient],reply_to:['contact','support'].includes(body.type)?reserved.replyTo:support,subject:reserved.subject,html:`<div style="font-family:Arial,sans-serif"><h2>Kristal Streams</h2><p style="white-space:pre-wrap">${escape(reserved.message)}</p></div>`})});
    const payload=await response.json().catch(()=>null);
    if(response.ok&&typeof payload?.id==='string'&&/^[A-Za-z0-9_-]{1,200}$/.test(payload.id)){state='sent';providerId=payload.id;}else if(response.status>=400&&response.status<500&&![408,409,429].includes(response.status))state='failed';
   }catch{/* Unknown outcomes require review, never an automatic resend. */}
   const{error:finishError}=await admin.rpc('ks_support_finish',{p_id:body.requestId,p_state:state,p_provider:providerId});
   if(finishError)return reply(202,{...result('unknown'),error:'Your request was saved. Delivery could not be confirmed; do not send it again.'});
   return reply(state==='sent'?200:202,result(state));
  }catch{return reply(503,{success:false,error:'The result could not be confirmed. Check the same request again before sending another reply.'});}
 };
}
