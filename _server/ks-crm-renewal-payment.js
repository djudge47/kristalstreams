import {getRetailPrice} from '../_shared/ks-retail-pricing.js';
import {paymentUuid,validPaymentInput,validateRenewalPayment} from '../_shared/ks-crm-renewal-payment.js';
const project='https://wftfxerblhlsxiijtfbo.supabase.co',options={auth:{persistSession:false,autoRefreshToken:false}};
const keys=(v,list)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...list].sort().join(',');
const inputKeys=['customerId','months','connections','amountCents','paidAt','method','reference','adjustmentReason'];
export function createRenewalPaymentHandler({createClient,env=process.env}={}){
 return async(req,res)=>{
  res.setHeader('Cache-Control','private, no-store');const reply=(status,value)=>res.status(status).json(value);
  if(env.VERCEL_ENV!=='preview')return reply(404,{error:'Renewal payment entry is available in Preview only.'});
  if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return reply(405,{error:'Method not allowed.'});}
  const status=req.method==='GET';let receiptId,input;
  if(status){if(!keys(req.query,['view','receiptId'])||!paymentUuid(req.query.receiptId))return reply(400,{error:'Choose a saved payment reference.'});receiptId=req.query.receiptId;}
  else{
   let origin;try{origin=new URL(req.headers?.origin);}catch{/* Reject below. */}
   if(!origin||origin.protocol!=='https:'||origin.origin!==req.headers.origin||origin.host!==req.headers.host)return reply(403,{error:'Use the payment form on the CRM page.'});
   if(!keys(req.query,['view'])||!/^application\/json(?:;\s*charset=utf-8)?$/i.test(req.headers?.['content-type']||'')
    ||!keys(req.body,['receiptId','input','confirmed'])||Buffer.byteLength(JSON.stringify(req.body))>2048
    ||req.body.confirmed!==true||!paymentUuid(req.body.receiptId)||!keys(req.body.input,inputKeys)||!validPaymentInput(req.body.input))
     return reply(400,{error:'Enter the received amount and date, then confirm the payment.'});
   receiptId=req.body.receiptId;input=req.body.input;
  }
  if(env.VITE_SUPABASE_URL!==project||!env.VITE_SUPABASE_ANON_KEY||!env.SUPABASE_SERVICE_ROLE_KEY)return reply(503,{error:'The Kristal Streams payment connection is unavailable.'});
  const token=typeof req.headers?.authorization==='string'&&/^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];if(!token)return reply(401,{error:'Sign in to your admin account.'});
  let admin,actor;
  try{
   const {data,error}=await createClient(project,env.VITE_SUPABASE_ANON_KEY,options).auth.getUser(token),user=data?.user;
   if(error||!paymentUuid(user?.id))return reply(401,{error:'Sign in to your admin account again.'});
   if(user.is_anonymous||!user.email_confirmed_at||user.email?.trim().toLowerCase()!=='djudge47@gmail.com')return reply(403,{error:'Only the Kristal Streams administrator can record payments.'});
   actor=user.id;admin=createClient(project,env.SUPABASE_SERVICE_ROLE_KEY,options);
  }catch{return reply(503,{error:'Administrator access could not be verified.'});}
  try{
   const {data,error}=await admin.rpc(status?'ks_crm_renewal_payment_status':'ks_crm_renewal_payment_record',{
    p_receipt:receiptId,p_actor:actor,...(status?{}:{p_input:{...input,catalogCents:getRetailPrice(input.months,input.connections).totalCents}})});
   if(error)throw error;
   if(status&&!data)return reply(404,{code:'payment_not_found',error:'No saved receipt was found for this reference. Retry the same saved payment; do not start another one.'});
   const receipt=validateRenewalPayment(data);if(receipt.receiptId!==receiptId||(!status&&receipt.customerId!==input.customerId))throw Error('invalid_receipt');
   return reply(200,{mode:'crm-renewal-payment',providerWrites:false,creditsSpent:false,receipt});
  }catch(error){const code=['payment_reference_conflict','payment_customer_excluded','payment_price_changed','payment_input_invalid'].includes(error?.message)?error.message:'payment_unverified';
   const messages={payment_reference_conflict:'This reference already belongs to different payment details. Check its saved result.',payment_customer_excluded:'This account is not eligible for customer renewal payments.',payment_price_changed:'The website price changed. Reopen the form before saving.',payment_input_invalid:'The payment details could not be verified.'};
   return reply(409,{code,error:messages[code]||'The payment result is uncertain. Check the saved reference before trying again.'});}
 };
}
