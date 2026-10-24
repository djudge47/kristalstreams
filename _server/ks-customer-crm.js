import {portalUuid,portalEmail,readPortalLink,readCustomerCrm} from '../_shared/ks-customer-crm.js';
const project='https://wftfxerblhlsxiijtfbo.supabase.co';
const options={auth:{persistSession:false,autoRefreshToken:false}};
const keys=(v,list)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...list].sort().join(',');
const errors={portal_account_unavailable:'No confirmed website account was found for that email.',portal_customer_unavailable:'This service account cannot be linked.',
  portal_link_conflict:'This service account already has a different verified link. Contact support before changing ownership.',portal_review_changed:'The account details changed. Load a new review.'};
export function createCustomerCrmHandler({createClient,env=process.env,adminLink=false}={}) {
  return async(req,res)=>{
    res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Authorization');res.setHeader('Pragma','no-cache');
    const reply=(status,body)=>res.status(status).json(body);
    if(!['preview','production'].includes(env.VERCEL_ENV))return reply(404,{error:'This account view is not available.'});
    const method=adminLink?'POST':'GET';
    if(req.method!==method){res.setHeader('Allow',method);return reply(405,{error:'Method not allowed.'});}
    if(env.VITE_SUPABASE_URL!==project||!env.VITE_SUPABASE_ANON_KEY||!env.SUPABASE_SERVICE_ROLE_KEY)return reply(503,{error:'Your service details are temporarily unavailable.'});
    let cursor=null;
    if(adminLink){
      let origin;try{origin=new URL(req.headers?.origin);}catch{/* Checked below. */}
      if(!origin||origin.protocol!=='https:'||origin.origin!==req.headers.origin||origin.host!==req.headers.host)return reply(403,{error:'Use the account linking form on the CRM page.'});
      if(!keys(req.query,['view'])||!/^application\/json(?:;\s*charset=utf-8)?$/i.test(req.headers?.['content-type']||'')
        ||!req.body||Buffer.byteLength(JSON.stringify(req.body))>2048)return reply(400,{error:'Review the website account before linking.'});
      const b=req.body;
      if(b.action==='review'){
        if(!keys(b,['action','customerId','email'])||!portalUuid(b.customerId)||!portalEmail(b.email)||b.email!==b.email.trim().toLowerCase())return reply(400,{error:'Enter the exact website account email.'});
      }else if(b.action==='link'){
        if(!keys(b,['action','review','confirmed'])||b.confirmed!==true)return reply(400,{error:'Confirm account ownership before linking.'});
        try{readPortalLink(b.review,b.review?.customerId);}catch{return reply(400,{error:'Load a new account review.'});}
      }else return reply(400,{error:'Choose an account linking action.'});
    }else{
      if(!keys(req.query,['view'])&&!keys(req.query,['view','beforeAt','beforeId']))return reply(400,{error:'Choose your account view.'});
      if(req.query.beforeAt!==undefined){
        if(typeof req.query.beforeAt!=='string'||req.query.beforeAt.length>40||!Number.isFinite(Date.parse(req.query.beforeAt))||!portalUuid(req.query.beforeId))return reply(400,{error:'Load payment history again.'});
        cursor={paidAt:req.query.beforeAt,id:req.query.beforeId};
      }
    }
    const token=typeof req.headers?.authorization==='string'&&/^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];
    if(!token)return reply(401,{error:'Sign in to your website account.'});
    try{
      const {data,error}=await createClient(project,env.VITE_SUPABASE_ANON_KEY,options).auth.getUser(token);const user=data?.user;
      if(error||!portalUuid(user?.id))return reply(401,{error:'Sign in to your website account again.'});
      if(user.is_anonymous||!user.email_confirmed_at||!portalEmail(user.email))return reply(403,{error:'Confirm your website account email first.'});
      const email=user.email.trim().toLowerCase();
      if(adminLink&&email!=='djudge47@gmail.com')return reply(403,{error:'Only the Kristal Streams administrator can link accounts.'});
      const admin=createClient(project,env.SUPABASE_SERVICE_ROLE_KEY,options);
      if(adminLink){
        const b=req.body,r=b.review;
        const result=await admin.rpc(b.action==='review'?'ks_crm_portal_link_review':'ks_crm_portal_link_save',b.action==='review'
          ?{p_customer:b.customerId,p_email:b.email,p_actor:user.id}
          :{p_customer:r.customerId,p_user:r.userId,p_email:r.email,p_confirmed_at:r.emailConfirmedAt,p_panel:r.panelId,p_actor:user.id});
        if(result.error)return reply(409,{error:errors[result.error.message]||'The account link could not be verified. Review it again before saving.'});
        const review=readPortalLink(result.data,b.action==='review'?b.customerId:r.customerId);
        if(b.action==='link'&&(!review.linked||review.userId!==r.userId||review.email!==r.email||review.panelId!==r.panelId))throw Error('invalid_link');
        return reply(200,{review});
      }
      const {data:snapshot,error:readError}=await admin.rpc('ks_client_crm_snapshot',{p_user:user.id,p_email:email,p_before_at:cursor?.paidAt??null,p_before_id:cursor?.id??null});
      if(readError)throw Error('storage_unavailable');
      const result=readCustomerCrm(snapshot,user.id,true);
      const payments=result.payments.slice(0,200),last=payments.at(-1);
      return reply(200,{...result,payments,nextCursor:result.payments.length>200?{paidAt:last.paidAt,id:last.id}:null});
    }catch{return reply(503,{error:adminLink?'The account link could not be verified. Review it again before saving.':'Your saved service and payment details could not be checked. If you already paid, do not pay again; contact support.'});}
  };
}
