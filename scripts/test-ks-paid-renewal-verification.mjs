import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { bootstrap, literal } from './fixtures/ks-reviewed-handoff/fixtures.mjs';
import { routingSupportSql } from './fixtures/ks-paid-order-routing.mjs';
import { preparePaidRenewalReview, verifyPaidRenewalReview } from '../_server/ks-paid-renewal-verification.js';
import { createPaidRenewalReviewHandler } from '../_server/ks-paid-renewal-review-http.js';

const {PGlite}=await import(process.env.KS_PGLITE_MODULE||'@electric-sql/pglite');
const db=new PGlite();let sequence=0,passed=0;
const query=async(sql,args=[])=> (await db.query(sql,args)).rows;
const project='https://wftfxerblhlsxiijtfbo.supabase.co';
const env={VERCEL_ENV:'production',VITE_SUPABASE_URL:project,VITE_SUPABASE_ANON_KEY:'fictional-anon',SUPABASE_SERVICE_ROLE_KEY:'fictional-service'};
async function check(name,fn){await fn();passed++;console.log(`PASS: ${name}`);}
async function fixture(){
  const owner=randomUUID(),customer=randomUUID(),request=randomUUID(),n=++sequence,reference=`cs_live_ReviewFixture${n}`;
  const now=Date.now(),expiresAt=new Date(Math.floor((now+7*86400000)/1000)*1000).toISOString(),username=`fictional_paid_review_${n}`,lineId=String(960000+n);
  await db.exec(`reset role;insert into auth.users(id,email,email_confirmed_at,is_anonymous) values('${owner}','${owner}@example.invalid','2026-01-01T00:00:00Z',false);
    insert into public.profiles(id,email) values('${owner}','${owner}@example.invalid');
    insert into public.iptv_customers(id,external_id,username,expiration_at,connections_allowed,package_name,account_status,trial,source,payment_status)
      values('${customer}',${lineId},'${username}','${expiresAt}',4,'6 Months + 4 Connections','active',false,'roomba','legacy_paid');
    insert into public.ks_crm_portal_links(customer_id,user_id,email_at_link,confirmed_at_link,external_id,linked_by)
      values('${customer}','${owner}','${owner}@example.invalid','2026-01-01T00:00:00Z',${lineId},'${owner}');set role service_role;`);
  await query("select public.ks_reserve_live_service_checkout_request($1,$2,'gold',3,'renewal','https://kristalstream.com',$3,$4)",[owner,request,`${owner}@example.invalid`,customer]);
  await query('select public.ks_bind_live_checkout_request($1,$2,$3)',[owner,request,reference]);
  await query("select public.ks_record_paid_checkout($1,$2,$3,true,'gold',3,180,15000,'usd')",[reference,`pi_ReviewFixture${n}`,owner]);
  await query('select public.ks_route_paid_order($1)',[reference]);
  const session={id:reference,livemode:true,mode:'payment',status:'complete',payment_status:'paid',currency:'usd',amount_total:15000,amount_subtotal:15000,payment_intent:`pi_ReviewFixture${n}`,
    metadata:{user_id:owner,plan:'gold',connections:'3',interval:'6 months',price:'150',duration_days:'180'}};
  const state={now,reads:0,rpcs:0,loseAck:false,readError:false,afterSnapshot:null,patch:{},user:{id:randomUUID(),email:'djudge47@gmail.com',email_confirmed_at:new Date(now).toISOString(),is_anonymous:false}};
  const admin={
    from(table){assert.equal(table,'ks_paid_renewal_review_bindings');const filters=[];return{select(v){assert.equal(v,'checkout_session_id,operation_id,user_id');return this;},eq(k,v){assert.ok(['checkout_session_id','operation_id'].includes(k));filters.push([k,v]);return this;},async maybeSingle(){return{data:(await query(`select checkout_session_id,operation_id,user_id from public.ks_paid_renewal_review_bindings where ${filters.map(([k],i)=>`${k}=$${i+1}`).join(' and ')}`,filters.map(([,v])=>v)))[0]??null,error:null};}};},
    async rpc(name,args){state.rpcs++;if(state.readError)return{data:null,error:{message:'fictional unavailable'}};
      let value;if(name==='ks_prepare_paid_renewal_review')value=(await query('select public.ks_prepare_paid_renewal_review($1,$2) as value',[args.p_session,args.p_user]))[0].value;
      else {assert.equal(name,'ks_check_paid_renewal_review');value=(await query('select public.ks_check_paid_renewal_review($1,$2,$3) as value',[args.p_session,args.p_user,args.p_operation]))[0].value;}
      if(state.loseAck){state.loseAck=false;return{data:null,error:{message:'fictional lost acknowledgement'}};}return{data:value,error:null};}
  };
  const provider={async snapshot(c){state.reads++;assert.equal(c.id,customer);assert.equal(c.external_id,lineId);
    if(state.afterSnapshot)await state.afterSnapshot();
    return {checkedAt:new Date(state.now).toISOString(),account:{id:'888',credits:'68'},line:{id:lineId,username,resellerId:'888',packageId:'76',expiresAt,connections:4,trial:false,enabled:true,adminEnabled:true,bouquetIds:[1,60,63],...state.patch},
      packages:[{id:'76',name:'6 Months + 4 Connections',maxConnections:4,trial:null,paid:{count:6,unit:'months',credits:19},bouquets:[1,60,63,100],issues:[]},
        {id:'77',name:'6 Months + 3 Connections',maxConnections:3,trial:null,paid:{count:6,unit:'months',credits:15},bouquets:[1,60,63,100],issues:[]}]};},renew(){assert.fail('review must not write to XUI');}};
  const prepare=()=>preparePaidRenewalReview(session,owner,admin);
  const verify=operationId=>verifyPaidRenewalReview({admin,provider,reference,ownerId:owner,operationId,now:()=>state.now});
  const http=createPaidRenewalReviewHandler({env,now:()=>state.now,providerFactory:()=>provider,createClient:(_url,key)=>key==='fictional-anon'?{auth:{getUser:async()=>({data:{user:state.user},error:null})}}:admin});
  const call=async(body={reference},patch={})=>{const res={code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
    await http({method:'POST',query:{view:'paid-renewal-verification'},headers:{origin:'https://fixture.vercel.app',host:'fixture.vercel.app','content-type':'application/json',authorization:'Bearer fictional-admin'},body,...patch},res);return res;};
  return{owner,customer,reference,session,admin,provider,state,prepare,verify,call};
}
try{
  await bootstrap({request:sql=>db.exec(sql)},{pglitePreflight:true});await db.exec(await routingSupportSql());
  for(const name of ['20261025033932_add_private_live_checkout_intent_binding.sql','20261025031536_add_private_paid_order_routing.sql','20261025040332_add_verified_checkout_service_selection.sql','20261025042823_add_private_paid_renewal_review_binding.sql'])await db.exec(await readFile(new URL(`../supabase/migrations/${name}`,import.meta.url),'utf8'));
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
  console.log(`${passed} paid-renewal verification SQL/handler/recovery checks passed. Fictional data and provider only.`);
}finally{await db.close();}
