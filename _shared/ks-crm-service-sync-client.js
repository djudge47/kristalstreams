export const syncUuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const stamp=value=>typeof value==='string'&&/\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)&&Number.isFinite(Date.parse(value));
const fail=()=>{throw Error('The saved bulk review could not be verified.');};
const values=v=>{
  if(!v||typeof v!=='object'||(v.package_name!==null&&(typeof v.package_name!=='string'||v.package_name.length>160))
    ||!Number.isInteger(v.connections_allowed)||v.connections_allowed<1||v.connections_allowed>32
    ||(v.expiration_at!==null&&!stamp(v.expiration_at))||typeof v.account_status!=='string'||v.account_status.length>32||typeof v.trial!=='boolean')return fail();
  return{package_name:v.package_name,connections_allowed:v.connections_allowed,expiration_at:v.expiration_at,account_status:v.account_status,trial:v.trial};
};
export function validateSyncBatch(b){
  if(!b||!syncUuid(b.batchId)||!['reviewing','review_ready','applied'].includes(b.state)||!stamp(b.expiresAt)
    ||(b.appliedAt!==null&&!stamp(b.appliedAt))||!Number.isInteger(b.total)||b.total<1||b.total>200
    ||!Number.isInteger(b.appliedCount)||b.appliedCount<0||b.appliedCount>b.total||!Array.isArray(b.items)||b.items.length!==b.total)return fail();
  const ids=new Set();const items=b.items.map(i=>{
    if(!syncUuid(i.customerId)||ids.has(i.customerId)||typeof i.panelId!=='string'||!/^\d{1,15}$/.test(i.panelId)
      ||typeof i.username!=='string'||!/^[A-Za-z0-9_.-]{3,64}$/.test(i.username)
      ||!['pending','ready','matched','blocked','failed'].includes(i.state)||(i.checkedAt!==null&&!stamp(i.checkedAt)))return fail();
    ids.add(i.customerId);
    return{customerId:i.customerId,panelId:i.panelId,username:i.username,state:i.state,checkedAt:i.checkedAt,
      reason:typeof i.reason==='string'&&/^[a-z_]{1,64}$/.test(i.reason)?i.reason:null,
      before:values(i.before),after:i.after===null?null:values(i.after)};
  });
  if(b.state!=='reviewing'&&items.some(i=>i.state==='pending'))return fail();
  if(items.some(i=>['ready','matched'].includes(i.state)&&(!i.after||!i.checkedAt)))return fail();
  return{batchId:b.batchId,state:b.state,expiresAt:b.expiresAt,appliedAt:b.appliedAt,appliedCount:b.appliedCount,total:b.total,items};
}
export function serviceSyncApi({getToken,fetchImpl=fetch,signal}){
  return async(action,batchId,extra={})=>{
    if(!syncUuid(batchId))return fail();
    const token=await getToken();if(!token)throw Error('Please sign in again to your admin account.');
    if(signal?.aborted)throw new DOMException('Review stopped.','AbortError');
    const controller=new AbortController(),stop=()=>controller.abort();signal?.addEventListener('abort',stop,{once:true});
    const timeout=setTimeout(stop,55000);
    try{
      const read=action==='status';
      const response=await fetchImpl(read?`/api/ks-roomba-crm?view=service-sync&batchId=${encodeURIComponent(batchId)}`:'/api/ks-roomba-crm?view=service-sync',{
        method:read?'GET':'POST',cache:'no-store',signal:controller.signal,
        headers:{Authorization:`Bearer ${token}`,Accept:'application/json',...(read?{}:{'Content-Type':'application/json'})},
        ...(read?{}:{body:JSON.stringify({action,batchId,...extra})}),
      });
      const payload=await response.json().catch(()=>null);
      if(!response.ok){
        const known={sync_crm_conflict:'A CRM record changed after review. No updates were applied. Prepare a fresh bulk review.',sync_review_expired:'This review expired. Prepare a fresh bulk review.',sync_review_incomplete:'Finish all account checks before applying updates.'};
        const code=Object.hasOwn(known,payload?.code)?payload.code:null;
        const error=new Error(code?known[code]:response.status===429?'Waiting for XUI. Load the saved review to resume.':response.status===401||response.status===403?'Please sign in again to your admin account.':'The request could not be verified. Load the saved review before continuing.');error.status=response.status;error.code=code;throw error;
      }
      if(payload?.mode!=='crm-service-sync'||payload.providerWrites!==false||payload.creditsSpent!==false)return fail();
      const batch=validateSyncBatch(payload.batch);if(batch.batchId!==batchId)return fail();return batch;
    }finally{clearTimeout(timeout);signal?.removeEventListener('abort',stop);}
  };
}
function waitFor(ms,signal){return new Promise((resolve,reject)=>{
  if(signal?.aborted)return reject(new DOMException('Review stopped.','AbortError'));
  const stop=()=>{clearTimeout(timer);signal?.removeEventListener('abort',stop);reject(new DOMException('Review stopped.','AbortError'));};
  const timer=setTimeout(()=>{signal?.removeEventListener('abort',stop);resolve();},ms);signal?.addEventListener('abort',stop,{once:true});
});}
export async function reviewServiceBatch({batch,api,signal,onBatch=()=>{},onProgress=()=>{},wait=waitFor,now=Date.now}){
  let current=validateSyncBatch(batch),nextAt=0;
  for(const item of current.items.filter(i=>i.state==='pending')){
    for(let attempt=0;attempt<3;attempt++){
      if(signal?.aborted)throw new DOMException('Review stopped.','AbortError');
      const delay=Math.max(0,nextAt-now());if(delay){onProgress(`Waiting before checking ${item.username}.`);await wait(delay,signal);}
      if(signal?.aborted)throw new DOMException('Review stopped.','AbortError');
      onProgress(`Checking ${item.username}…`);nextAt=now()+30000;
      try{
        const next=validateSyncBatch(await api('review',current.batchId,{customerId:item.customerId}));
        if(next.batchId!==current.batchId||next.total!==current.total||next.items.map(i=>i.customerId).sort().join(',')!==current.items.map(i=>i.customerId).sort().join(','))return fail();
        current=next;onBatch(current);if(current.state==='applied'){onProgress('This saved batch was already applied.');return current;}break;
      }catch(error){if(error?.status!==429||attempt===2)throw error;nextAt=Math.max(nextAt,now()+30000);}
    }
  }
  onProgress(current.state==='review_ready'?'Review ready. Check the proposed changes below.':current.state==='applied'?'This saved batch was already applied.':'The review is incomplete. Load the saved review to resume.');
  return current;
}
