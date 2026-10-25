import assert from 'node:assert/strict';
import { randomUUID,randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { bootstrap, literal } from './fixtures/ks-reviewed-handoff/fixtures.mjs';
import { routingSupportSql } from './fixtures/ks-paid-order-routing.mjs';
import { preparePaidRenewalReview, verifyPaidRenewalReview,inspectPaidRenewalReview } from '../_server/ks-paid-renewal-verification.js';
import { createPaidRenewalReviewHandler } from '../_server/ks-paid-renewal-review-http.js';
import { savePaidRenewalQuoteApproval } from '../_server/ks-paid-renewal-approval.js';
import { createPaidRenewalSendConsent } from '../_server/ks-paid-renewal-send-consent.js';
import { createPaidRenewalSendGuard,createPaidRenewalSendLedger } from '../_server/ks-paid-renewal-send-guard.js';
import { loadLiveRenewalCompletions } from '../_server/ks-live-renewal-status.js';
import { customerSetupSnapshot } from '../_server/ks-customer-setup.js';
import { readSetupHelpOrders, setupHelpDetails } from '../_shared/ks-setup-help.js';
import { createPaidRenewalCompletion } from '../_server/ks-paid-renewal-completion.js';

const {PGlite}=await import(process.env.KS_PGLITE_MODULE||'@electric-sql/pglite');
const db=new PGlite();let sequence=0,passed=0;
let lastSqlFailure;
const query=async(sql,args=[])=> {try{return(await db.query(sql,args)).rows;}catch(error){lastSqlFailure={message:error.message,where:error.where};throw error;}};
const project='https://wftfxerblhlsxiijtfbo.supabase.co';
const env={VERCEL_ENV:'production',VITE_SUPABASE_URL:project,VITE_SUPABASE_ANON_KEY:'fictional-anon',SUPABASE_SERVICE_ROLE_KEY:'fictional-service'};
async function check(name,fn){await fn();passed++;console.log(`PASS: ${name}`);}
async function fixture({currentMonths=6}={}){
  const owner=randomUUID(),customer=randomUUID(),request=randomUUID(),n=++sequence,reference=`cs_live_ReviewFixture${n}`;
  const now=Date.now(),expiresAt=new Date(Math.floor((now+7*86400000)/1000)*1000).toISOString(),username=`fictional_paid_review_${n}`,lineId=String(960000+n);
  await db.exec(`reset role;insert into auth.users(id,email,email_confirmed_at,is_anonymous) values('${owner}','${owner}@example.invalid','2026-01-01T00:00:00Z',false);
    insert into public.profiles(id,email) values('${owner}','${owner}@example.invalid');
    insert into public.iptv_customers(id,external_id,username,expiration_at,connections_allowed,package_name,account_status,trial,source,payment_status)
      values('${customer}',${lineId},'${username}','${expiresAt}',4,'${currentMonths} Months + 4 Connections','active',false,'roomba','legacy_paid');
    insert into public.ks_crm_portal_links(customer_id,user_id,email_at_link,confirmed_at_link,external_id,linked_by)
      values('${customer}','${owner}','${owner}@example.invalid','2026-01-01T00:00:00Z',${lineId},'${owner}');set role service_role;`);
  await query("select public.ks_reserve_live_service_checkout_request($1,$2,'gold',3,'renewal','https://kristalstream.com',$3,$4)",[owner,request,`${owner}@example.invalid`,customer]);
  await query('select public.ks_bind_live_checkout_request($1,$2,$3)',[owner,request,reference]);
  await query("select public.ks_record_paid_checkout($1,$2,$3,true,'gold',3,180,15000,'usd')",[reference,`pi_ReviewFixture${n}`,owner]);
  await query('select public.ks_route_paid_order($1)',[reference]);
  const session={id:reference,livemode:true,mode:'payment',status:'complete',payment_status:'paid',currency:'usd',amount_total:15000,amount_subtotal:15000,payment_intent:`pi_ReviewFixture${n}`,
    metadata:{user_id:owner,plan:'gold',connections:'3',interval:'6 months',price:'150',duration_days:'180'}};
  const state={now,reads:0,resultReads:0,rpcs:0,loseAck:false,loseApprovalAck:false,loseReserveAck:false,loseBeginAck:false,loseProofAck:false,loseCompleteAck:false,readError:false,afterSnapshot:null,patch:{},targetCost:15,resellerId:String(88000+n),providerLine:null,balanceAfter:'53',user:{id:randomUUID(),email:'djudge47@gmail.com',email_confirmed_at:new Date(now).toISOString(),is_anonymous:false}};
  await db.exec(`reset role;insert into auth.users(id,email,email_confirmed_at,is_anonymous) values('${state.user.id}','djudge47@gmail.com','2026-01-01T00:00:00Z',false);set role service_role;`);
  const admin={
    supabaseUrl:project,
    from(table){assert.equal(table,'ks_paid_renewal_review_bindings');const filters=[];return{select(v){assert.equal(v,'checkout_session_id,operation_id,user_id');return this;},eq(k,v){assert.ok(['checkout_session_id','operation_id'].includes(k));filters.push([k,v]);return this;},async maybeSingle(){return{data:(await query(`select checkout_session_id,operation_id,user_id from public.ks_paid_renewal_review_bindings where ${filters.map(([k],i)=>`${k}=$${i+1}`).join(' and ')}`,filters.map(([,v])=>v)))[0]??null,error:null};}};},
    async rpc(name,args){state.rpcs++;if(state.readError)return{data:null,error:{message:'fictional unavailable'}};
      let value;if(name==='ks_owner_paid_renewal_completions')value=(await query('select public.ks_owner_paid_renewal_completions($1,$2) as value',[args.p_user,args.p_sessions]))[0].value;
      else if(name==='ks_prepare_paid_renewal_review')value=(await query('select public.ks_prepare_paid_renewal_review($1,$2) as value',[args.p_session,args.p_user]))[0].value;
      else if(name==='ks_check_paid_renewal_review')value=(await query('select public.ks_check_paid_renewal_review($1,$2,$3) as value',[args.p_session,args.p_user,args.p_operation]))[0].value;
      else if(name==='ks_lookup_paid_renewal_quote_approval')value=(await query('select public.ks_lookup_paid_renewal_quote_approval($1,$2,$3,$4) as value',[args.p_session,args.p_user,args.p_operation,args.p_actor]))[0].value;
      else if(name==='ks_paid_renewal_send_enabled')value=(await query('select public.ks_paid_renewal_send_enabled() as value'))[0].value;
      else if(name==='ks_lookup_paid_renewal_send_guard'||name==='ks_reserve_paid_renewal_send_guard'||name==='ks_paid_renewal_completion_context'){
        const reserve=name==='ks_reserve_paid_renewal_send_guard';
        value=(await query(`select public.${name}($1,$2,$3,$4,$5,$6,$7${reserve?',$8,$9,$10':''}) as value`,[args.p_operation,args.p_actor,args.p_consent,args.p_hash,args.p_approval,args.p_quote,args.p_cost,...(reserve?[args.p_checked,args.p_issued,args.p_expires]:[])]))[0].value;
        if(reserve&&state.loseReserveAck){state.loseReserveAck=false;return{data:null,error:{message:'fictional lost reserve acknowledgement'}};}
      }else if(name==='ks_prepare_paid_renewal_completion')value=(await query('select public.ks_prepare_paid_renewal_completion($1,$2,$3,$4,$5,$6) as value',[args.p_operation,args.p_claim,args.p_policy,args.p_loss,args.p_balance,args.p_checked]))[0].value;
      else if(name==='ks_verify_paid_renewal_completion'){
        value=(await query('select public.ks_verify_paid_renewal_completion($1,$2,$3,$4,$5) as value',[args.p_operation,args.p_claim,args.p_result,args.p_balance,args.p_checked]))[0].value;
        if(state.loseProofAck){state.loseProofAck=false;return{data:null,error:{message:'fictional lost proof acknowledgement'}};}
      }else if(name==='ks_complete_paid_renewal'){
        value=(await query('select public.ks_complete_paid_renewal($1,$2,$3,$4) as value',[args.p_operation,args.p_claim,args.p_current,args.p_checked]))[0].value;
        if(state.loseCompleteAck){state.loseCompleteAck=false;return{data:null,error:{message:'fictional lost completion acknowledgement'}};}
      }else if(name==='ks_begin_paid_renewal_send_guard'||name==='ks_stop_paid_renewal_send_guard'){
        value=(await query(`select public.${name}($1,$2) as value`,[args.p_operation,args.p_claim]))[0].value;
        if(name==='ks_begin_paid_renewal_send_guard'&&state.loseBeginAck){state.loseBeginAck=false;return{data:null,error:{message:'fictional lost begin acknowledgement'}};}
      }else {assert.equal(name,'ks_save_paid_renewal_quote_approval');value=(await query('select public.ks_save_paid_renewal_quote_approval($1,$2,$3,$4,$5,$6,$7,$8,$9) as value',[args.p_session,args.p_user,args.p_operation,args.p_actor,args.p_canonical,args.p_fingerprint,args.p_cost,args.p_balance,args.p_checked]))[0].value;
        if(state.loseApprovalAck){state.loseApprovalAck=false;return{data:null,error:{message:'fictional lost approval acknowledgement'}};}}
      if(state.loseAck){state.loseAck=false;return{data:null,error:{message:'fictional lost acknowledgement'}};}return{data:value,error:null};}
  };
  const provider={async snapshot(c){state.reads++;assert.equal(c.id,customer);assert.equal(c.external_id,lineId);
    if(state.afterSnapshot)await state.afterSnapshot();
    return {checkedAt:new Date(state.now).toISOString(),account:{id:state.resellerId,credits:'68'},line:{id:lineId,username,resellerId:state.resellerId,packageId:'76',expiresAt,connections:4,trial:false,enabled:true,adminEnabled:true,bouquetIds:[1,60,63],...state.patch},
      packages:[{id:'76',name:`${currentMonths} Months + 4 Connections`,maxConnections:4,trial:null,paid:{count:currentMonths,unit:'months',credits:19},bouquets:[1,60,63,100],issues:[]},
        {id:'77',name:'6 Months + 3 Connections',maxConnections:3,trial:null,paid:{count:6,unit:'months',credits:state.targetCost},bouquets:[1,60,63,100],issues:[]}]};},
    async read(id){state.resultReads++;assert.equal(id,lineId);return state.providerLine;},async account(){return{id:state.resellerId,credits:state.balanceAfter};},
    renew(){assert.fail('review must not write to XUI');}};
  const prepare=()=>preparePaidRenewalReview(session,owner,admin);
  const verify=operationId=>verifyPaidRenewalReview({admin,provider,reference,ownerId:owner,operationId,now:()=>state.now});
  const approve=(operationId,quote,patch={})=>savePaidRenewalQuoteApproval({admin,provider,reference,ownerId:owner,operationId,actorId:state.user.id,now:()=>state.now,
    expectedQuoteFingerprint:quote.fingerprint,costCredits:quote.costCredits,approvalOnlyConfirmed:true,preserveChannelsConfirmed:true,serviceChangesConfirmed:true,...patch});
  const http=createPaidRenewalReviewHandler({env,now:()=>state.now,providerFactory:()=>provider,createClient:(_url,key)=>key==='fictional-anon'?{auth:{getUser:async()=>({data:{user:state.user},error:null})}}:admin});
  const call=async(body={reference},patch={})=>{const res={code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
    await http({method:'POST',query:{view:'paid-renewal-verification'},headers:{origin:'https://fixture.vercel.app',host:'fixture.vercel.app','content-type':'application/json',authorization:'Bearer fictional-admin'},body,...patch},res);return res;};
  return{owner,customer,reference,session,admin,provider,state,prepare,verify,call,approve};
}
try{
  await bootstrap({request:sql=>db.exec(sql)},{pglitePreflight:true});await db.exec(await routingSupportSql());
  for(const name of ['20261025033932_add_private_live_checkout_intent_binding.sql','20261025031536_add_private_paid_order_routing.sql','20261025040332_add_verified_checkout_service_selection.sql','20261025042823_add_private_paid_renewal_review_binding.sql','20261025082051_add_private_paid_renewal_quote_approval.sql'])await db.exec(await readFile(new URL(`../supabase/migrations/${name}`,import.meta.url),'utf8'));
  for(const name of ['ks-crm-renewal-installation-schema.sql','ks-crm-live-renewal-installation-schema.sql','ks-crm-order-renewal-installation-schema.sql'])await db.exec(await readFile(new URL(name,import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/20261025084505_add_disabled_paid_renewal_send_guard.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/20261025091959_add_private_paid_renewal_completion.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/20261025124926_add_private_owner_renewal_completion_status.sql',import.meta.url),'utf8'));
  async function sendFixture(options){
    const f=await fixture(options),p=await f.prepare(),review=await f.verify(p.operationId),approval=await f.approve(p.operationId,review.quote);
    const consent=createPaidRenewalSendConsent({key:randomBytes(32),now:()=>f.state.now});
    const input={actorId:f.state.user.id,ownerId:f.owner,reference:f.reference,operationId:p.operationId,approvalId:approval.approvalId,quoteFingerprint:review.quote.fingerprint,costUnits:'15000000',
      creditSpendConfirmed:true,preserveChannelsConfirmed:true,serviceChangesConfirmed:true,executionRequested:true};
    const issued=consent.issue(input);input.token=issued.token;
    const ledger=createPaidRenewalSendLedger({client:f.admin,projectUrl:project});
    const guard=createPaidRenewalSendGuard({consent,ledger,now:()=>f.state.now,review:r=>inspectPaidRenewalReview({admin:f.admin,provider:f.provider,reference:r.reference,ownerId:r.ownerId,operationId:r.operationId,now:()=>f.state.now})});
    const completion=createPaidRenewalCompletion({client:f.admin,projectUrl:project,consent,provider:f.provider,now:Date.now,
      review:r=>inspectPaidRenewalReview({admin:f.admin,provider:f.provider,reference:r.reference,ownerId:r.ownerId,operationId:r.operationId,now:()=>f.state.now})});
    return{...f,input,guard,ledger,consent,completion};
  }
  await check('paid renewal preparation creates one immutable review identity, never dispatch authority',async()=>{
    const f=await fixture(),first=await f.prepare(),second=await f.prepare();assert.equal(first.state,'awaiting_verification');assert.ok(first.operationId);
    assert.deepEqual(second,{...first,replayed:true});assert.equal(first.mayDispatch,false);assert.equal(first.providerActivated,false);
    for(const key of ['binding','fingerprint','customerId','lineId','paymentIntentId','ownerEmail'])assert.equal(key in first,false);
    assert.equal((await query('select count(*)::int as n from public.ks_paid_renewal_review_bindings where checkout_session_id=$1',[f.reference]))[0].n,1);
  });
  await check('a lost preparation acknowledgement recovers the same saved attempt without a replacement',async()=>{
    const f=await fixture();f.state.loseAck=true;await assert.rejects(()=>f.prepare(),/do not pay again/);
    const row=(await query('select operation_id from public.ks_paid_renewal_review_bindings where checkout_session_id=$1',[f.reference]))[0];
    assert.equal((await f.prepare()).operationId,row.operation_id);
  });
  await check('provider review checks the exact current line and requested catalog without renewing it',async()=>{
    const f=await fixture(),p=await f.prepare(),result=await f.verify(p.operationId);assert.equal(result.state,'verified_for_review');
    assert.equal(result.requestedMonths,6);assert.equal(result.requestedConnections,3);assert.equal(result.mayDispatch,false);assert.equal(result.providerActivated,false);
    const again=await f.verify(p.operationId);assert.equal(again.operationId,p.operationId);assert.equal(f.state.reads,2);
    for(const key of ['binding','lineId','ownerEmail','paymentIntentId','token','form','claimToken'])assert.equal(key in result,false);
  });
  await check('ownership and saved service drift force review while retaining the original operation',async()=>{
    for(const field of ['username','expiration_at','connections_allowed','package_name']){
      const f=await fixture(),p=await f.prepare();const value=field==='username'?"'changed_customer'":field==='expiration_at'?"expiration_at+interval '1 day'":field==='connections_allowed'?'5':"'Changed Package'";
      await db.exec(`reset role;update public.iptv_customers set ${field}=${value} where id=${literal(f.customer)};set role service_role;`);
      const replay=await f.prepare();assert.equal(replay.state,'review_required');assert.equal(replay.operationId,p.operationId);
      assert.equal((await query('select fulfillment_status from public.ks_setup_order_queue where checkout_session_id=$1',[f.reference]))[0].fulfillment_status,'requires_review');
      assert.equal((await f.verify(p.operationId)).state,'review_required');assert.equal(f.state.reads,0);
    }
  });
  await check('ownership changes during the independent provider read invalidate that same review',async()=>{
    const f=await fixture(),p=await f.prepare();f.state.afterSnapshot=async()=>db.exec(`reset role;update auth.users set email_confirmed_at='2026-01-02T00:00:00Z' where id='${f.owner}';set role service_role;`);
    assert.equal((await f.verify(p.operationId)).state,'review_required');assert.equal(f.state.reads,1);
  });
  await check('wrong line, reseller, allowance, expired evidence and disabled/trial lines cannot pass',async()=>{
    for(const patch of [{id:'99'},{resellerId:'99'},{connections:5},{trial:true},{enabled:false},{adminEnabled:false}]){
      const f=await fixture(),p=await f.prepare();f.state.patch=patch;
      if(patch.id || patch.resellerId)await assert.rejects(()=>f.verify(p.operationId),/unverified_requested_order/);
      else assert.equal((await f.verify(p.operationId)).state,'review_required');
    }
    const f=await fixture(),p=await f.prepare(),snapshot=f.provider.snapshot;
    f.provider.snapshot=async c=>({...await snapshot(c),checkedAt:new Date(f.state.now-31000).toISOString()});
    assert.equal((await f.verify(p.operationId)).state,'review_required');assert.equal(f.state.reads,1);
  });
  await check('unavailable binding storage stops before any provider read and retains saved work',async()=>{
    const f=await fixture(),p=await f.prepare();f.state.readError=true;await assert.rejects(()=>f.verify(p.operationId),/do not pay again/);assert.equal(f.state.reads,0);
  });
  await check('authenticated admin HTTP recovers by payment reference and emits only a verification result',async()=>{
    const f=await fixture(),p=await f.prepare(),res=await f.call();assert.equal(res.code,200);assert.equal(res.body.operationId,p.operationId);
    assert.equal(res.body.state,'verified_for_review');assert.equal(res.body.mayDispatch,false);assert.equal(res.headers['Cache-Control'],'private, no-store');
    assert.equal((await f.call({reference:f.reference,operationId:p.operationId})).body.operationId,p.operationId);
  });
  await check('foreign actors, new operation IDs, body overrides and hostile origins cannot reach XUI',async()=>{
    const f=await fixture();await f.prepare();
    assert.equal((await f.call({reference:f.reference,operationId:randomUUID()})).code,404);
    assert.equal((await f.call({reference:f.reference,customerId:f.customer})).code,400);
    assert.equal((await f.call(undefined,{headers:{origin:'https://wrong.invalid',host:'fixture.vercel.app'}})).code,403);
    f.state.user.email='other@example.invalid';assert.equal((await f.call()).code,403);assert.equal(f.state.reads,0);
  });
  await check('SQL roles and immutability guards prevent changing, deleting or impersonating a paid review',async()=>{
    const f=await fixture(),p=await f.prepare();await assert.rejects(()=>query('select public.ks_check_paid_renewal_review($1,$2,$3)',[f.reference,randomUUID(),p.operationId]),/paid_renewal_owner_required/);
    await assert.rejects(()=>query("update public.ks_paid_renewal_review_bindings set fingerprint=repeat('a',64) where checkout_session_id=$1",[f.reference]),/permission denied/);
    await db.exec('reset role');await assert.rejects(()=>query('delete from public.ks_paid_renewal_review_bindings where checkout_session_id=$1',[f.reference]),/paid_renewal_review_is_immutable/);
    await db.exec('set role authenticated');await assert.rejects(()=>query('select public.ks_prepare_paid_renewal_review($1,$2)',[f.reference,f.owner]),/permission denied/);
    await assert.rejects(()=>query('select * from public.ks_paid_renewal_review_bindings'),/permission denied/);await db.exec('reset role;set role service_role');
  });
  await check('an exact reviewed quote saves one approval with no private evidence or dispatch authority',async()=>{
    const f=await fixture(),p=await f.prepare(),review=await f.verify(p.operationId),before=(await query('select to_jsonb(c) as value from public.iptv_customers c where id=$1',[f.customer]))[0].value;
    assert.equal(review.quote.costCredits,'15');const first=await f.approve(p.operationId,review.quote);assert.equal(first.state,'approval_saved');assert.equal(first.replayed,false);
    const reads=f.state.reads,again=await f.approve(p.operationId,review.quote);assert.equal(again.approvalId,first.approvalId);assert.equal(again.replayed,true);assert.equal(f.state.reads,reads);
    assert.equal(first.mayDispatch,false);for(const k of ['quote_canonical','quote','lineId','customerId','balanceUnits','claimToken','token'])assert.equal(k in first,false);
    assert.deepEqual((await query('select to_jsonb(c) as value from public.iptv_customers c where id=$1',[f.customer]))[0].value,before);
  });
  await check('lost approval acknowledgement recovers the saved identity without another XUI read',async()=>{
    const f=await fixture(),p=await f.prepare(),review=await f.verify(p.operationId);f.state.loseApprovalAck=true;
    await assert.rejects(()=>f.approve(p.operationId,review.quote),/same attempt/);const reads=f.state.reads;
    const row=(await query('select approval_id from public.ks_paid_renewal_quote_approvals where operation_id=$1',[p.operationId]))[0];
    assert.equal((await f.approve(p.operationId,review.quote)).approvalId,row.approval_id);assert.equal(f.state.reads,reads);
  });
  await check('changed credit costs and channel choices cannot approve an earlier quote',async()=>{
    for(const drift of ['cost','channels']){const f=await fixture(),p=await f.prepare(),review=await f.verify(p.operationId);
      if(drift==='cost')f.state.targetCost=16;else f.state.patch={bouquetIds:[1,60]};
      await assert.rejects(()=>f.approve(p.operationId,review.quote),e=>e.status===409);
      assert.equal((await query('select count(*)::int as n from public.ks_paid_renewal_quote_approvals where operation_id=$1',[p.operationId]))[0].n,0);
    }
  });
  await check('an existing approval cannot be replaced, widened or used after service ownership changes',async()=>{
    const f=await fixture(),p=await f.prepare(),review=await f.verify(p.operationId),first=await f.approve(p.operationId,review.quote),reads=f.state.reads;
    await assert.rejects(()=>f.approve(p.operationId,review.quote,{costCredits:'16'}),e=>e.status===409);assert.equal(f.state.reads,reads);
    await db.exec(`reset role;update auth.users set email_confirmed_at='2026-01-02T00:00:00Z' where id='${f.owner}';set role service_role;`);
    const recovered=await f.approve(p.operationId,review.quote);assert.equal(recovered.state,'review_required');assert.equal(recovered.reason,'service_changed');assert.equal(recovered.approvalId,first.approvalId);assert.equal(f.state.reads,reads);
  });
  await check('HTTP requires every exact quote confirmation and rejects write or target overrides before XUI',async()=>{
    const f=await fixture(),p=await f.prepare(),review=await f.verify(p.operationId);
    const body={reference:f.reference,operationId:p.operationId,action:'save-quote-approval',expectedQuoteFingerprint:review.quote.fingerprint,costCredits:'15',approvalOnlyConfirmed:true,preserveChannelsConfirmed:true,serviceChangesConfirmed:true};
    for(const field of ['approvalOnlyConfirmed','preserveChannelsConfirmed','serviceChangesConfirmed'])assert.equal((await f.call({...body,[field]:false})).code,400);
    assert.equal((await f.call({...body,execute:true})).code,400);assert.equal(f.state.reads,1);
    const res=await f.call(body);assert.equal(res.code,200);assert.equal(res.body.state,'approval_saved');assert.equal(res.body.mayDispatch,false);
    assert.equal((await f.call(body)).body.approvalId,res.body.approvalId);assert.equal(f.state.reads,2);
  });
  await check('quote approvals are private and immutable even to accidental privileged updates',async()=>{
    const f=await fixture(),p=await f.prepare(),review=await f.verify(p.operationId);await f.approve(p.operationId,review.quote);
    await assert.rejects(()=>query('delete from public.ks_paid_renewal_quote_approvals where operation_id=$1',[p.operationId]),/permission denied/);
    await db.exec('reset role');await assert.rejects(()=>query('delete from public.ks_paid_renewal_quote_approvals where operation_id=$1',[p.operationId]),/paid_renewal_quote_is_immutable/);
    await db.exec('set role authenticated');await assert.rejects(()=>query('select * from public.ks_paid_renewal_quote_approvals'),/permission denied/);await db.exec('reset role;set role service_role');
  });
  await check('failed independent provider reads leave no approval and retry retains the same renewal',async()=>{
    const f=await fixture(),p=await f.prepare(),review=await f.verify(p.operationId),snapshot=f.provider.snapshot;
    f.provider.snapshot=async()=>{throw Error('fictional provider unavailable');};await assert.rejects(()=>f.approve(p.operationId,review.quote),/fictional provider unavailable/);
    assert.equal((await query('select count(*)::int as n from public.ks_paid_renewal_quote_approvals where operation_id=$1',[p.operationId]))[0].n,0);
    f.provider.snapshot=snapshot;const recovered=await f.approve(p.operationId,review.quote);assert.equal(recovered.operationId,p.operationId);assert.equal(recovered.state,'approval_saved');
  });
  await check('current database administrator confirmation is required before any approval provider read',async()=>{
    const f=await fixture(),p=await f.prepare(),review=await f.verify(p.operationId),reads=f.state.reads;
    await db.exec(`reset role;update auth.users set email_confirmed_at=null where id='${f.state.user.id}';set role service_role;`);
    await assert.rejects(()=>f.approve(p.operationId,review.quote),/paid_renewal_quote_admin_required/);assert.equal(f.state.reads,reads);
  });
  await check('the installed paid send guard defaults off and reads no XUI evidence when disabled',async()=>{
    const f=await sendFixture(),reads=f.state.reads,result=await f.guard(f.input);assert.equal(result.state,'disabled');assert.equal(result.claimAcquired,false);assert.equal(f.state.reads,reads);
    assert.equal((await query('select count(*)::int as n from public.ks_paid_renewal_send_operations'))[0].n,0);
  });
  await db.exec('reset role;update public.ks_paid_renewal_send_control set execution_enabled=true;set role service_role;');
  await check('one fresh explicit consent can claim once and retries cannot reacquire a send guard',async()=>{
    const f=await sendFixture(),first=await f.guard(f.input),reads=f.state.reads;assert.equal(first.state,'send_guard_claimed');assert.equal(first.claimAcquired,true);assert.equal(first.mayDispatch,false);
    const retry=await f.guard(f.input);assert.equal(retry.state,'reconciliation_required');assert.equal(retry.claimAcquired,false);assert.equal(f.state.reads,reads);
    for(const k of ['claimToken','token','lineId','resellerId','consentId'])assert.equal(k in first,false);
  });
  await check('lost reservation or begin acknowledgement never authorizes a replacement claim',async()=>{
    for(const field of ['loseReserveAck','loseBeginAck']){const f=await sendFixture();f.state[field]=true;const result=await f.guard(f.input);assert.equal(result.state,'check_status');assert.equal(result.claimAcquired,false);
      const reads=f.state.reads,retry=await f.guard(f.input);assert.equal(retry.claimAcquired,false);assert.equal(retry.state,'reconciliation_required');assert.equal(f.state.reads,reads);
    }
  });
  await check('quote-only data, altered actors and missing execution confirmations cannot claim',async()=>{
    const f=await sendFixture(),reads=f.state.reads;
    for(const patch of [{token:'quote-only-approval'},{actorId:randomUUID()},{creditSpendConfirmed:false},{executionRequested:false}])assert.equal((await f.guard({...f.input,...patch})).state,'review_required');
    assert.equal(f.state.reads,reads);assert.throws(()=>f.consent.issue({...f.input,creditSpendConfirmed:false}),/explicit_paid_renewal_send_consent_required/);
  });
  await check('expired or changed-service consent cannot reserve or acquire a send guard',async()=>{
    const f=await sendFixture(),reads=f.state.reads;f.state.now+=300001;assert.equal((await f.guard(f.input)).state,'review_required');assert.equal(f.state.reads,reads);
    const changed=await sendFixture();changed.state.afterSnapshot=async()=>db.exec(`reset role;update auth.users set email_confirmed_at='2026-01-02T00:00:00Z' where id='${changed.owner}';set role service_role;`);
    assert.equal((await changed.guard(changed.input)).claimAcquired,false);
  });
  await check('uncertain claims retain physical reservations after consent expiry and gate pause',async()=>{
    const f=await sendFixture();assert.equal((await f.guard(f.input)).claimAcquired,true);
    const r=f.consent.identify(f.input.token,f.input),saved=await f.ledger.lookup(r,f.input.token);await f.ledger.stop(r,saved);
    await db.exec('reset role;update public.ks_paid_renewal_send_control set execution_enabled=false;set role service_role;');f.state.now+=600000;
    assert.equal((await f.guard(f.input)).state,'reconciliation_required');
    assert.equal((await query('select count(*)::int as n from public.ks_paid_renewal_send_reseller_slots where operation_id=$1',[f.input.operationId]))[0].n,1);
    await assert.rejects(()=>query('delete from public.ks_paid_renewal_send_reseller_slots where operation_id=$1',[f.input.operationId]),/paid_renewal_complete_state_unverified/);
  });
  async function completionFixture(options){
    await db.exec('reset role;update public.ks_paid_renewal_send_control set execution_enabled=true;set role service_role;');
    const f=await sendFixture(options);assert.equal((await f.guard(f.input)).claimAcquired,true);f.state.now=Date.now();
    f.input.policyReviewed=true;f.input.unusedTimeLossConfirmed=true;
    const prepared=await f.completion.prepare(f.input);
    const q=JSON.parse((await query('select quote_canonical from public.ks_paid_renewal_quote_approvals where operation_id=$1',[f.input.operationId]))[0].quote_canonical);
    const line={id:q.lineId,username:q.username,resellerId:q.resellerId,packageId:q.packageId,connections:q.connections,bouquetIds:q.bouquetIds,
      expiresAt:prepared.expectedExpiresAt?new Date(prepared.expectedExpiresAt).toISOString():null,trial:false,enabled:true,adminEnabled:true};
    f.state.providerLine=line;f.state.now=Date.now();
    const customer=(await query('select to_jsonb(c) as value from public.iptv_customers c where id=$1',[f.customer]))[0].value;
    const profile=(await query('select to_jsonb(p) as value from public.profiles p where id=$1',[f.owner]))[0].value;
    return{...f,prepared,line,beforeCustomer:customer,beforeProfile:profile};
  }
  await check('a frozen pre-send expectation and matching independent proof complete exactly one CRM renewal',async()=>{
    const f=await completionFixture();assert.equal(f.prepared.state,'expectation_saved');
    assert.equal((await f.completion.verify(f.input,f.line)).state,'provider_verified');
    const done=await f.completion.complete(f.input);assert.equal(done.state,'complete',JSON.stringify(lastSqlFailure));assert.equal(done.renewalCompleted,true);assert.equal(done.providerActivated,false);
    const c=(await query('select to_jsonb(c) as value from public.iptv_customers c where id=$1',[f.customer]))[0].value;
    assert.equal(c.connections_allowed,3);assert.equal(c.package_name,'6 Months + 3 Connections');assert.equal(Date.parse(c.expiration_at),Date.parse(f.line.expiresAt));
    const omitService=({expiration_at:_e,connections_allowed:_c,package_name:_p,...rest})=>rest;
    assert.deepEqual(omitService(c),omitService(f.beforeCustomer));assert.deepEqual((await query('select to_jsonb(p) as value from public.profiles p where id=$1',[f.owner]))[0].value,f.beforeProfile);
    assert.equal((await query('select fulfillment_status from public.ks_setup_order_queue where checkout_session_id=$1',[f.reference]))[0].fulfillment_status,'setup_complete');
    assert.equal((await query('select count(*)::int as n from public.ks_paid_renewal_send_reseller_slots where operation_id=$1',[f.input.operationId]))[0].n,0);
    assert.equal((await f.guard(f.input)).state,'complete');assert.equal((await f.completion.complete(f.input)).replayed,true);
  });
  await check('unsupported timing policy and missing unused-time confirmation cannot prepare a provider expectation',async()=>{
    const f=await completionFixture({currentMonths:3});assert.equal(f.prepared.state,'review_required');
    assert.equal((await query('select count(*)::int as n from public.ks_paid_renewal_expectations where operation_id=$1',[f.input.operationId]))[0].n,0);
    assert.equal((await f.completion.prepare({...f.input,unusedTimeLossConfirmed:false})).state,'review_required');
  });
  await check('missing pre-send expectation cannot be manufactured after a provider result appears',async()=>{
    await db.exec('reset role;update public.ks_paid_renewal_send_control set execution_enabled=true;set role service_role;');
    const f=await sendFixture();assert.equal((await f.guard(f.input)).claimAcquired,true);
    assert.equal((await f.completion.verify(f.input,{})).state,'reconciliation_required');
    assert.equal((await f.completion.prepare({...f.input,policyReviewed:true,unusedTimeLossConfirmed:true})).state,'review_required');
  });
  await check('wrong line, expiration, independent state or credit debit keeps CRM unchanged and reservations locked',async()=>{
    for(const fault of ['line','expiry','independent','debit']){const f=await completionFixture();let returned=f.line;
      if(fault==='line')returned={...f.line,id:'99'};
      if(fault==='expiry')returned={...f.line,expiresAt:new Date(Date.parse(f.line.expiresAt)+86400000).toISOString()};
      if(fault==='independent')f.state.providerLine={...f.line,expiresAt:new Date(Date.parse(f.line.expiresAt)+1000).toISOString()};
      if(fault==='debit')f.state.balanceAfter='54';
      assert.equal((await f.completion.verify(f.input,returned)).state,'reconciliation_required');
      assert.deepEqual((await query('select to_jsonb(c) as value from public.iptv_customers c where id=$1',[f.customer]))[0].value,f.beforeCustomer);
      assert.equal((await query('select count(*)::int as n from public.ks_paid_renewal_send_reseller_slots where operation_id=$1',[f.input.operationId]))[0].n,1);
    }
  });
  await check('lost provider-proof acknowledgement recovers verified work after consent expiry and gate pause without a resend',async()=>{
    const f=await completionFixture();f.state.loseProofAck=true;assert.equal((await f.completion.verify(f.input,f.line)).state,'reconciliation_required');
    assert.equal((await f.ledger.lookup(f.consent.identify(f.input.token,f.input),f.input.token)).state,'provider_verified');
    await db.exec('reset role;update public.ks_paid_renewal_send_control set execution_enabled=false;set role service_role;');f.state.now+=600000;
    assert.equal((await f.completion.complete(f.input)).state,'complete');assert.equal((await f.completion.complete(f.input)).replayed,true);
  });
  await check('lost atomic-completion acknowledgement recovers one completion without another provider read or mutation',async()=>{
    const f=await completionFixture();assert.equal((await f.completion.verify(f.input,f.line)).state,'provider_verified');f.state.loseCompleteAck=true;
    assert.equal((await f.completion.complete(f.input)).state,'crm_pending');const reads=f.state.resultReads;
    assert.equal((await f.completion.complete(f.input)).state,'complete');assert.equal(f.state.resultReads,reads);
    assert.equal((await query('select count(*)::int as n from public.ks_paid_renewal_completions where operation_id=$1',[f.input.operationId]))[0].n,1);
  });
  await check('manual CRM drift after provider proof is not overwritten by completion recovery',async()=>{
    const f=await completionFixture();assert.equal((await f.completion.verify(f.input,f.line)).state,'provider_verified');
    await db.exec(`reset role;update public.iptv_customers set package_name='Manual change' where id='${f.customer}';set role service_role;`);
    assert.equal((await f.completion.complete(f.input)).state,'crm_pending');
    assert.equal((await query('select package_name from public.iptv_customers where id=$1',[f.customer]))[0].package_name,'Manual change');
    assert.equal((await query('select count(*)::int as n from public.ks_paid_renewal_send_reseller_slots where operation_id=$1',[f.input.operationId]))[0].n,1);
  });
  async function ownerFixture(){
    const f=await completionFixture();await f.completion.verify(f.input,f.line);assert.equal((await f.completion.complete(f.input)).state,'complete');
    const order=(await query('select checkout_session_id,user_id,livemode,tier,connections,duration_days,amount_cents,currency,activated,expires_at,recorded_at from public.ks_payment_receipts where checkout_session_id=$1',[f.reference]))[0];
    order.recorded_at=new Date(order.recorded_at).toISOString();
    return {...f,order,load:()=>loadLiveRenewalCompletions(f.admin,f.owner,[order])};
  }
  await check('owner status projects the actual completed proof without credentials, provider readiness or customer identity',async()=>{
    const f=await ownerFixture(),proofs=await f.load(),proof=proofs.get(f.reference);assert.equal(proof.status,'renewal_complete');assert.equal(proof.providerActivated,false);assert.equal(proof.renewalCompleted,true);
    const orders=customerSetupSnapshot([{checkout_session_id:f.reference,fulfillment_status:'setup_complete',queued_at:f.order.recorded_at,receipt:f.order}],f.owner,true,proofs);
    const safe=readSetupHelpOrders({accountId:f.owner,mode:'read-only',testMode:false,orders,checkedAt:new Date().toISOString()},f.owner);
    assert.match(setupHelpDetails(safe.orders[0],safe.checkedAt),/renewal completed/);
    const text=JSON.stringify(safe);for(const hidden of[f.customer,f.input.operationId,f.line.username,'claimToken','balance_before','password'])assert.ok(!text.includes(hidden));
    assert.equal((await query('select public.ks_owner_paid_renewal_completions($1,$2) as value',[randomUUID(),[f.reference]]))[0].value.length,0);
  });
  await check('later CRM term edits preserve the historical renewal without announcing current service readiness',async()=>{
    const f=await ownerFixture(),before=(await f.load()).get(f.reference);
    await db.exec(`reset role;update public.iptv_customers set expiration_at=expiration_at+interval '1 year',connections_allowed=5,package_name='Later service term' where id='${f.customer}';set role service_role;`);
    assert.deepEqual((await f.load()).get(f.reference),before);
    const historical=await loadLiveRenewalCompletions(f.admin,f.owner,[f.order],Date.parse(before.expiresAt)+86400000);assert.equal(historical.get(f.reference).status,'renewal_complete');
  });
  await check('ownership confirmation drift or unverified completion fails closed without hiding payment',async()=>{
    const f=await ownerFixture();await db.exec(`reset role;update auth.users set email_confirmed_at='2026-01-02T00:00:00Z' where id='${f.owner}';set role service_role;`);
    assert.equal((await f.load()).size,0);assert.equal(customerSetupSnapshot([{checkout_session_id:f.reference,fulfillment_status:'setup_complete',queued_at:f.order.recorded_at,receipt:f.order}],f.owner,true,await f.load())[0].status,'requires_review');
    await assert.rejects(()=>loadLiveRenewalCompletions({rpc:async()=>({data:null,error:{message:'PRIVATE'}})},f.owner,[f.order]),/verified_owner_renewal_status_unavailable/);
    const pending=await fixture();assert.deepEqual((await query('select public.ks_owner_paid_renewal_completions($1,$2) as value',[pending.owner,[pending.reference]]))[0].value,[]);
  });
  await check('bounded private completion reads and malformed RPC results cannot widen owner access',async()=>{
    const f=await ownerFixture();
    for(const refs of[[],[f.reference,f.reference],Array(6).fill(f.reference),['cs_test_Wrong'],[null]])await assert.rejects(()=>query('select public.ks_owner_paid_renewal_completions($1,$2)',[f.owner,refs]),/bounded_owner_renewal_references_required/);
    const raw=(await query('select public.ks_owner_paid_renewal_completions($1,$2) as value',[f.owner,[f.reference]]))[0].value[0];
    for(const patch of[{accountId:randomUUID()},{reference:'cs_live_Foreign'},{connections:5},{amountCents:1},{providerActivated:true},{renewalCompleted:false},{completedAt:'2099-01-01T00:00:00Z'},{expiresAt:'2020-01-01T00:00:00Z'}])await assert.rejects(()=>loadLiveRenewalCompletions({rpc:async()=>({data:[{...raw,...patch}],error:null})},f.owner,[f.order]));
    const acl=(await query("select has_function_privilege('anon','public.ks_owner_paid_renewal_completions(uuid,text[])','execute') as anon,has_function_privilege('authenticated','public.ks_owner_paid_renewal_completions(uuid,text[])','execute') as browser,has_function_privilege('service_role','public.ks_owner_paid_renewal_completions(uuid,text[])','execute') as server"))[0];assert.deepEqual(acl,{anon:false,browser:false,server:true});
  });
  console.log(`${passed} paid-renewal verification SQL/handler/recovery checks passed. Fictional data and provider only.`);
}finally{await db.close();}
