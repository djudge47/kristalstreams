import {supabase} from './supabase';

export type SupportMailResult={success:boolean;state?:'sending'|'sent'|'failed'|'unknown';error?:string;requestId?:string;ticketId?:string|null};
type Intake={type:'contact'|'support'|'welcome'|'newsletter';to:string;data:Record<string,string>};
type Reply={type:'ticket_reply';ticketId:string;message:string};
const inFlight=new Map<string,Promise<SupportMailResult>>();
const uuid=(value:string|null)=>Boolean(value&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));

export async function requestSupportMail(input:Intake|Reply):Promise<SupportMailResult>{
 const {data,error}=await supabase.auth.getSession();
 if(input.type!=='contact'&&(error||!data.session?.access_token))return{success:false,error:'Sign in to your confirmed website account first.'};
 const owner=data.session?.user.id||'public';
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([owner,input])));
 const key='ks-support-request/v1/'+Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
 const existing=inFlight.get(key);if(existing)return existing;
 const pending=(async()=>{
  // Retain only a random request ID under a content hash, never message text or email.
  // Reopening the same pending request checks its saved state without resending.
  let stored=sessionStorage.getItem(key);if(!uuid(stored)){stored=crypto.randomUUID();sessionStorage.setItem(key,stored);}
  const requestId=stored!;
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
   const timeout=new Promise<never>((_resolve,reject)=>{timer=setTimeout(()=>reject(new Error('request_timeout')),20000);});
   const {data:capability,error:capabilityError}=await Promise.race([supabase.functions.invoke('resend-email',{method:'GET'}),timeout]);
   if(capabilityError||capability?.capability!=='ks-support/v1'||capability.ready!==true)return{success:false,error:'The support update is not ready on this site yet. No message was sent. Please try again later.'};
   const {data:beforeSend}=await supabase.auth.getSession();
   if((beforeSend.session?.user.id||'public')!==owner)return{success:false,error:'Your sign-in changed. Return to support from your current account.'};
   const {data:result,error:invokeError}=await Promise.race([supabase.functions.invoke('resend-email',{
    body:{...input,requestId},...(input.type!=='contact'?{headers:{Authorization:`Bearer ${data.session!.access_token}`}}:{}),
   }),timeout]);
   if(invokeError){
    let body: {error?:unknown}|null=null;
    if(invokeError.context instanceof Response)body=await invokeError.context.clone().json().catch(()=>null);
    // Keep the same request ID even when the network outcome is unknown.
    return{success:false,error:typeof body?.error==='string'?body.error:'The result could not be checked. Check the same request again before sending another message.'};
   }
   const {data:current}=await supabase.auth.getSession();
   if((current.session?.user.id||'public')!==owner)return{success:false,error:'Your sign-in changed. Return to support from your current account.'};
   if(!result||result.requestId!==requestId||!['sending','sent','failed','unknown'].includes(result.state)||result.success!==(result.state==='sent')||result.ticketId&&!uuid(result.ticketId)||input.type==='ticket_reply'&&result.ticketId!==input.ticketId)
    return{success:false,error:'The result could not be verified. Check the same request again.'};
   const safe:SupportMailResult={success:result.success,state:result.state,requestId,ticketId:result.ticketId||null};
   if(result.state==='sent')sessionStorage.removeItem(key);
   else safe.error=result.state==='failed'?'Your message was saved, but the email was rejected. Contact support before sending it again.':'Your message was saved. Email delivery is not confirmed; check this same request again instead of sending another copy.';
   return safe;
  }catch{return{success:false,error:'The request outcome is unknown. Check the same request again before sending another message.'};}
  finally{if(timer!==undefined)clearTimeout(timer);}
 })();
 inFlight.set(key,pending);try{return await pending;}finally{inFlight.delete(key);}
}
