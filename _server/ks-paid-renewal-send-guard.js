import { createHash } from 'node:crypto';
const project='https://wftfxerblhlsxiijtfbo.supabase.co';
const states=['reserved','send_started','reconciliation_required','provider_verified','complete'];
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
export function createPaidRenewalSendLedger({client,projectUrl}={}){
  if(projectUrl!==project||client?.supabaseUrl!==project||typeof client.rpc!=='function')throw Error('active_paid_renewal_project_required');
  const rpc=async(name,args)=>{const{data,error}=await client.rpc(name,args);if(error)throw Error('paid_renewal_send_storage_unavailable');return data;};
  const args=(r,token)=>({p_operation:r.operationId,p_actor:r.actorId,p_consent:r.consentId,p_hash:createHash('sha256').update(token).digest('hex'),p_approval:r.approvalId,p_quote:r.quoteFingerprint,p_cost:r.costUnits});
  const record=r=>{if(!r||!states.includes(r.state)||!uuid(r.claimToken)||typeof r.replayed!=='boolean'||r.mayDispatch!==false
    ||(['send_started','provider_verified','complete'].includes(r.state)&&!Number.isFinite(Date.parse(r.startedAt))))throw Error('paid_renewal_send_record_unverified');return r;};
  return Object.freeze({
    async enabled(){const v=await rpc('ks_paid_renewal_send_enabled',{});if(typeof v!=='boolean')throw Error('paid_renewal_send_gate_unavailable');return v;},
    async lookup(r,token){const v=await rpc('ks_lookup_paid_renewal_send_guard',args(r,token));return v===null?null:record(v);},
    async reserve(r,token,checkedAt){return record(await rpc('ks_reserve_paid_renewal_send_guard',{...args(r,token),p_checked:checkedAt,p_issued:r.issuedAt,p_expires:r.expiresAt}));},
    begin:(r,record)=>rpc('ks_begin_paid_renewal_send_guard',{p_operation:r.operationId,p_claim:record.claimToken}),
    stop:(r,record)=>rpc('ks_stop_paid_renewal_send_guard',{p_operation:r.operationId,p_claim:record.claimToken})
  });
}
// No provider write is exposed. A one-time claim must be followed by a separate
// reviewed execution policy and fresh checks before any future transport. The
// winner cannot be recreated after timeout, lost acknowledgement or gate pause.
export function createPaidRenewalSendGuard({consent,ledger,review,now}={}){
  if(!consent||!ledger||typeof review!=='function'||typeof now!=='function'
    ||['identify','verify'].some(m=>typeof consent[m]!=='function')||['enabled','lookup','reserve','begin','stop'].some(m=>typeof ledger[m]!=='function'))throw Error('paid_renewal_send_guard_dependencies_required');
  return async input=>{
    const answer=(state,receipt,claimAcquired=false,replayed=false)=>({state,operationId:receipt?.operationId??null,claimAcquired,replayed,mayDispatch:false,providerActivated:false});
    let receipt;try{receipt=consent.identify(input?.token,input);}catch{return answer('review_required');}
    let held,reservationStarted=false;
    try{held=await ledger.lookup(receipt,input.token);if(held)return answer(held.state==='complete'?'complete':'reconciliation_required',receipt,false,true);
      if(!await ledger.enabled())return answer('disabled',receipt);
    }catch{return answer('check_status',receipt);}
    try{
      consent.verify(input.token,input);
      const evidence=await review(receipt);
      if(evidence?.result?.state!=='verified_for_review'||evidence.result.reference!==receipt.reference||evidence.result.operationId!==receipt.operationId
        ||evidence.quote?.fingerprint!==receipt.quoteFingerprint||evidence.quote.costUnits!==receipt.costUnits
        ||!Number.isSafeInteger(now())||Date.parse(evidence.quote.checkedAt)>now()||Date.parse(evidence.quote.validUntil)<=now())return answer('review_required',receipt);
      reservationStarted=true;held=await ledger.reserve(receipt,input.token,evidence.quote.checkedAt);
      if(held.replayed!==false||held.state!=='reserved')return answer('check_status',receipt,false,true);
      if(await ledger.begin(receipt,held)!==true)return answer('reconciliation_required',receipt);
      const committed=await ledger.lookup(receipt,input.token);
      if(!committed||committed.state!=='send_started'||committed.claimToken!==held.claimToken)return answer('check_status',receipt);
      if(!await ledger.enabled()||Date.parse(evidence.quote.validUntil)<=now()||Date.parse(receipt.expiresAt)<=now()){
        await ledger.stop(receipt,held);return answer('reconciliation_required',receipt);
      }
      return answer('send_guard_claimed',receipt,true);
    }catch{return answer(held||reservationStarted?'check_status':'review_required',receipt);}
  };
}
