import { createHash } from 'node:crypto';
import { creditUnits } from './ks-paid-approval.js';
const project='https://wftfxerblhlsxiijtfbo.supabase.co';
const policy='controlled_6m4_to_6m3_reset_ny/v1';
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
function resultLine(line,ctx,now){
  const q=ctx.quote,expiry=Date.parse(line?.expiresAt),expected=Date.parse(ctx.expectation?.expected_expiry);
  if(!line||line.id!==q.lineId||line.username!==q.username||line.resellerId!==q.resellerId||line.packageId!==q.packageId
    ||line.connections!==q.connections||line.enabled!==true||line.adminEnabled!==true||line.trial!==false
    ||!Array.isArray(line.bouquetIds)||!line.bouquetIds.every(n=>Number.isInteger(n)&&n>0&&n<=2147483647)
    ||JSON.stringify([...line.bouquetIds].sort((a,b)=>a-b))!==JSON.stringify(q.bouquetIds)
    ||typeof line.expiresAt!=='string'||!/(?:Z|[+-]\d{2}:\d{2})$/.test(line.expiresAt)
    ||!Number.isFinite(expiry)||expiry%1000!==0||expiry<=now||!Number.isFinite(expected)||Math.abs(expiry-expected)>120000)throw Error('paid_renewal_result_unverified');
  return{customerId:q.customerId,lineId:q.lineId,username:q.username,resellerId:q.resellerId,packageId:q.packageId,
    connections:q.connections,bouquetIds:[...q.bouquetIds],expiresAt:new Date(expiry).toISOString(),enabled:true,adminEnabled:true,trial:false};
}
// Private future-worker adapter only. No transport write, authorization route,
// environment fallback, profile/billing mutation or general timing assumption.
export function createPaidRenewalCompletion({client,projectUrl,consent,provider,review,now}={}){
  if(projectUrl!==project||client?.supabaseUrl!==project||typeof client.rpc!=='function'||typeof now!=='function'
    ||typeof consent?.identify!=='function'||typeof consent.verify!=='function'||typeof review!=='function'
    ||typeof provider?.read!=='function'||typeof provider.account!=='function')throw Error('paid_renewal_completion_dependencies_required');
  const clock=()=>{const at=now();if(!Number.isSafeInteger(at))throw Error('paid_renewal_completion_clock_required');return at;};
  const rpc=async(name,args)=>{const{data,error}=await client.rpc(name,args);if(error)throw Error('paid_renewal_completion_storage_unavailable');return data;};
  const identity=(r,token)=>({p_operation:r.operationId,p_actor:r.actorId,p_consent:r.consentId,p_hash:createHash('sha256').update(token).digest('hex'),p_approval:r.approvalId,p_quote:r.quoteFingerprint,p_cost:r.costUnits});
  const context=async(input)=>{
    const r=consent.identify(input?.token,input),ctx=await rpc('ks_paid_renewal_completion_context',identity(r,input.token));
    if(!ctx||ctx.operationId!==r.operationId||ctx.reference!==r.reference||ctx.ownerId!==r.ownerId||!uuid(ctx.claimToken)
      ||!['reserved','send_started','reconciliation_required','provider_verified','complete'].includes(ctx.state)
      ||ctx.quote?.operationId!==r.operationId||ctx.quote.reference!==r.reference||ctx.quote.costUnits!==r.costUnits)throw Error('paid_renewal_completion_context_changed');
    return{r,ctx};
  };
  const answer=(state,id,replayed=false)=>({state,operationId:id??null,replayed,mayDispatch:false,providerActivated:false,renewalCompleted:state==='complete'});
  const claim=ctx=>({p_operation:ctx.operationId,p_claim:ctx.claimToken});
  return Object.freeze({
    async prepare(input){
      let ctx;try{
        const loaded=await context(input);ctx=loaded.ctx;consent.verify(input.token,input);
        if(input.policyReviewed!==true||input.unusedTimeLossConfirmed!==true||ctx.state!=='send_started')return answer('review_required',ctx.operationId);
        if(ctx.expectation)return{...answer('expectation_saved',ctx.operationId,true),expectedExpiresAt:ctx.expectation.expected_expiry};
        const evidence=await review(loaded.r);
        if(evidence?.result?.state!=='verified_for_review'||evidence.quote?.fingerprint!==loaded.r.quoteFingerprint||evidence.quote.costUnits!==loaded.r.costUnits)throw Error('paid_renewal_quote_changed');
        const row=await rpc('ks_prepare_paid_renewal_completion',{...claim(ctx),p_policy:policy,p_loss:true,p_balance:evidence.quote.balanceUnits,p_checked:evidence.quote.checkedAt});
        if(row?.operation_id!==ctx.operationId||row.policy!==policy||!Number.isFinite(Date.parse(row.expected_expiry)))throw Error('paid_renewal_expectation_unverified');
        return{...answer('expectation_saved',ctx.operationId),expectedExpiresAt:row.expected_expiry};
      }catch{return answer('review_required',ctx?.operationId);}
    },
    async verify(input,returnedLine){
      let ctx;try{
        ({ctx}=await context(input));
        if(['provider_verified','complete'].includes(ctx.state))return answer(ctx.state,ctx.operationId,true);
        if(ctx.state!=='send_started')return answer('reconciliation_required',ctx.operationId);
        if(!ctx.expectation)throw Error('paid_renewal_pre_send_expectation_required');
        const returned=resultLine(returnedLine,ctx,clock()),at=clock();
        const [line,account]=await Promise.all([provider.read(ctx.quote.lineId),provider.account()]);
        const current=resultLine(line,ctx,clock());
        if(clock()<at||clock()-at>=30000||JSON.stringify(current)!==JSON.stringify(returned)||String(account.id)!==ctx.quote.resellerId
          ||creditUnits(account.credits)!==BigInt(ctx.expectation.balance_before)-BigInt(ctx.quote.costUnits))throw Error('paid_renewal_independent_result_changed');
        await rpc('ks_verify_paid_renewal_completion',{...claim(ctx),p_result:current,p_balance:String(creditUnits(account.credits)),p_checked:new Date(at).toISOString()});
        return answer('provider_verified',ctx.operationId);
      }catch{
        if(ctx?.state==='send_started')try{await rpc('ks_stop_paid_renewal_send_guard',claim(ctx));}catch{/* Keep uncertainty locked. */}
        return answer('reconciliation_required',ctx?.operationId);
      }
    },
    async complete(input){
      let ctx;try{
        ({ctx}=await context(input));if(ctx.state==='complete')return answer('complete',ctx.operationId,true);
        if(ctx.state!=='provider_verified'||!ctx.expectation||!ctx.proof)return answer('reconciliation_required',ctx.operationId);
        const at=clock(),current=resultLine(await provider.read(ctx.quote.lineId),ctx,clock());
        const saved=resultLine({...ctx.proof.result,id:ctx.proof.result.lineId},ctx,clock());
        if(clock()<at||clock()-at>=30000||JSON.stringify(current)!==JSON.stringify(saved))throw Error('paid_renewal_current_result_changed');
        const result=await rpc('ks_complete_paid_renewal',{...claim(ctx),p_current:current,p_checked:new Date(at).toISOString()});
        if(result?.state!=='complete'||result.mayDispatch!==false||typeof result.replayed!=='boolean')throw Error('paid_renewal_completion_unverified');
        return answer('complete',ctx.operationId,result.replayed);
      }catch{return answer('crm_pending',ctx?.operationId);}
    }
  });
}
