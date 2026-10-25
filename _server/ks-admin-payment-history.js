import {readAdminWebsitePayments,websiteReceiptId} from '../_shared/ks-admin-payment-history.js';
const project='https://wftfxerblhlsxiijtfbo.supabase.co';
const options={auth:{persistSession:false,autoRefreshToken:false}};
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
export function createAdminPaymentHistoryHandler({createClient,env=process.env}={}){
  return async(req,res)=>{
    res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Authorization');res.setHeader('Pragma','no-cache');
    const reply=(status,body)=>res.status(status).json(body);
    if(!['preview','production'].includes(env.VERCEL_ENV))return reply(404,{error:'Payment history is unavailable here.'});
    if(req.method!=='GET'){res.setHeader('Allow','GET');return reply(405,{error:'Method not allowed.'});}
    const q=req.query??{},keys=Object.keys(q).sort().join(',');
    if(!['view','beforeAt,beforeId,view'].includes(keys)||q.view!=='admin-website-payments'
      ||q.beforeAt!==undefined&&(typeof q.beforeAt!=='string'||q.beforeAt.length>40||!Number.isFinite(Date.parse(q.beforeAt))||!websiteReceiptId(q.beforeId)))return reply(400,{error:'Reload payment history.'});
    if(env.VITE_SUPABASE_URL!==project||!env.VITE_SUPABASE_ANON_KEY||!env.SUPABASE_SERVICE_ROLE_KEY)return reply(503,{error:'Payment details could not be loaded. Refresh to try again.'});
    const token=typeof req.headers?.authorization==='string'&&/^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];if(!token)return reply(401,{error:'Sign in to your administrator account.'});
    try{
      const {data,error}=await createClient(project,env.VITE_SUPABASE_ANON_KEY,options).auth.getUser(token),u=data?.user;
      if(error||!uuid(u?.id))return reply(401,{error:'Sign in to your administrator account again.'});
      if(u.is_anonymous||!u.email_confirmed_at||u.email?.trim().toLowerCase()!=='djudge47@gmail.com')return reply(403,{error:'Only the Kristal Streams administrator can view this payment history.'});
      const admin=createClient(project,env.SUPABASE_SERVICE_ROLE_KEY,options);
      const r=await admin.rpc('ks_admin_website_payment_history',{p_actor:u.id,p_before_at:q.beforeAt??null,p_before_id:q.beforeId??null});if(r.error)throw Error('unavailable');
      const result=readAdminWebsitePayments(r.data,u.id,true),payments=result.payments.slice(0,200),last=payments.at(-1);
      return reply(200,{...result,payments,nextCursor:result.payments.length>200?{paidAt:last.paid_at,id:last.id}:null});
    }catch{return reply(503,{error:'Payment details could not be loaded. Refresh to try again.'});}
  };
}
