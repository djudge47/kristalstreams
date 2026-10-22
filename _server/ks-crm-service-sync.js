import { createCustomerStatusHandler } from './ks-roomba-customer-status.js';

const project='https://wftfxerblhlsxiijtfbo.supabase.co';
const options={auth:{persistSession:false,autoRefreshToken:false}};
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const keys=(value,expected)=>value&&typeof value==='object'&&!Array.isArray(value)
  &&Object.keys(value).sort().join(',')===[...expected].sort().join(',');
const messages={sync_review_expired:'This review expired. Prepare a fresh bulk review.',
  sync_crm_conflict:'A reviewed CRM record changed. No updates were applied. Prepare a fresh bulk review.',
  sync_review_incomplete:'Finish checking all accounts before applying updates.',
  sync_batch_not_found:'The saved review could not be found for this admin account.',
  sync_manifest_conflict:'The saved review belongs to a different account selection.'};

export function createServiceSyncHandler(settings={}) {
  const {createClient,env=process.env}=settings;
  const comparison=createCustomerStatusHandler({...settings,comparePackage:true});
  return async(req,res)=>{
    res.setHeader('Cache-Control','private, no-store');
    const reply=(code,body)=>res.status(code).json(body);
    if(env.VERCEL_ENV!=='preview')return reply(404,{error:'Bulk CRM updates are available in Preview only.'});
    if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return reply(405,{error:'Method not allowed.'});}
    const statusOnly=req.method==='GET',body=req.body;
    let action='status',batchId;
    if(statusOnly){
      if(!keys(req.query,['view','batchId'])||!uuid(req.query.batchId))return reply(400,{error:'Choose a saved bulk review.'});
      batchId=req.query.batchId;
    }else{
      let origin;try{origin=new URL(req.headers?.origin);}catch{/* Reject below. */}
      if(!origin||origin.protocol!=='https:'||origin.origin!==req.headers.origin||origin.host!==req.headers.host)
        return reply(403,{error:'Use the bulk update controls on the CRM page.'});
      if(!keys(req.query,['view'])||!/^application\/json(?:;\s*charset=utf-8)?$/i.test(req.headers?.['content-type']||'')
        ||!body||Array.isArray(body)||typeof body!=='object'||Buffer.byteLength(JSON.stringify(body))>12000)
        return reply(400,{error:'Use the current bulk CRM review.'});
      action=body.action;batchId=body.batchId;
      const expected=action==='create'?['action','batchId','customerIds']:action==='review'?['action','batchId','customerId']:action==='apply'?['action','batchId','confirmed']:[];
      if(!expected.length||!keys(body,expected)||!uuid(batchId)
        ||(action==='create'&&(!Array.isArray(body.customerIds)||!body.customerIds.length||body.customerIds.length>200||!body.customerIds.every(uuid)||new Set(body.customerIds).size!==body.customerIds.length))
        ||(action==='review'&&!uuid(body.customerId))||(action==='apply'&&body.confirmed!==true))
        return reply(400,{error:'Choose a complete account selection and confirm the displayed service-only update.'});
    }
    if(env.VITE_SUPABASE_URL!==project||!env.VITE_SUPABASE_ANON_KEY||!env.SUPABASE_SERVICE_ROLE_KEY||!env.ROOMBA_PREVIEW_SECRET)
      return reply(503,{error:'The Kristal Streams bulk connection is unavailable.'});
    const token=typeof req.headers?.authorization==='string'&&/^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];
    if(!token)return reply(401,{error:'Please sign in to your admin account.'});
    let admin,actorId;
    try{
      const auth=createClient(project,env.VITE_SUPABASE_ANON_KEY,options);
      const {data,error}=await auth.auth.getUser(token),user=data?.user;
      if(error||!uuid(user?.id))return reply(401,{error:'Please sign in again to your admin account.'});
      if(user.is_anonymous||!user.email_confirmed_at||user.email?.trim().toLowerCase()!=='djudge47@gmail.com')
        return reply(403,{error:'Only the Kristal Streams administrator can update CRM service details.'});
      actorId=user.id;admin=createClient(project,env.SUPABASE_SERVICE_ROLE_KEY,options);
    }catch{return reply(503,{error:'Administrator access could not be verified.'});}
    const rpc=async(name,args)=>{
      const {data,error}=await admin.rpc(name,{p_batch:batchId,p_actor:actorId,...args});
      if(error)throw error;
      if(data?.batchId!==batchId||!Array.isArray(data.items)||data.items.length!==data.total||data.total<1||data.total>200)throw Error('invalid_sync_result');
      return data;
    };
    try{
      let batch;
      if(action==='create')batch=await rpc('ks_crm_service_sync_create',{p_customers:body.customerIds});
      else if(action==='apply')batch=await rpc('ks_crm_service_sync_apply',{});
      else if(action==='status')batch=await rpc('ks_crm_service_sync_status',{});
      else{
        // Verify membership before contacting XUI. A caller cannot probe another line.
        const current=await rpc('ks_crm_service_sync_status',{});
        const item=current.items.find(item=>item.customerId===body.customerId);
        if(!item)return reply(400,{error:'That customer is outside this saved review.'});
        if(current.state==='applied'||item.state!=='pending')batch=current;
        else{
          let code,result;const headers={};
          await comparison({method:'GET',headers:req.headers,query:{view:'customer-comparison',customerId:body.customerId}},
            {setHeader(k,v){headers[k]=v;},status(value){code=value;return this;},json(value){result=value;return this;}});
          if([401,403,429,503].includes(code)){
            if(code===429)res.setHeader('Retry-After',headers['Retry-After']||'30');
            return reply(code,{error:code===429?'Waiting for the XUI connection.':'The admin or XUI connection could not be verified.',retryAfterSeconds:30});
          }
          const line=result?.line;
          const values=code===200&&result?.mode==='read-only'&&result.databaseWrites===false&&line?.customerId===body.customerId
            ?{lineId:line.lineId,username:line.username,packageName:line.packageName,expiresAt:line.expiresAt,
              connectionsAllowed:line.connectionsAllowed,trial:line.trial,enabled:line.enabled,adminEnabled:line.adminEnabled,checkedAt:line.checkedAt}
            :{failure:'read_failed'};
          batch=await rpc('ks_crm_service_sync_review',{p_customer:body.customerId,p_values:values});
        }
      }
      return reply(200,{mode:'crm-service-sync',providerWrites:false,creditsSpent:false,batch});
    }catch(error){return reply(409,{code:Object.hasOwn(messages,error?.message)?error.message:'unverified',error:messages[error?.message]||'The bulk review could not be verified. Check its saved status before trying again.'});}
  };
}
