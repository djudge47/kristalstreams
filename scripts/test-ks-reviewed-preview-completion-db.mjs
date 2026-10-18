import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGuardedWorkerFixture } from '../_server/ks-guarded-paid-fixtures.js';
import { completeReviewedPreviewSetup } from '../_server/ks-reviewed-preview-completion.js';
const { PGlite }=await import(process.env.KS_PGLITE_MODULE||'@electric-sql/pglite');
const db=new PGlite();
const f=createGuardedWorkerFixture(),owner=f.input.ownerId,admin=f.input.approverId;
const other='00000000-0000-4000-8000-000000000099',policy='00000000-0000-4000-8000-000000000091';
const read=name=>readFile(new URL(name,import.meta.url),'utf8');
const rows=async(sql,args=[])=>(await db.query(sql,args)).rows;
let checks=0;
async function check(label,fn){await db.exec('begin');try{await fn();await db.exec('set constraints all immediate');checks++;console.log(`PASS: ${label}`);}finally{await db.exec('rollback');}}
async function rejected(fn,pattern){await db.exec('savepoint expected');try{await assert.rejects(fn,pattern);}finally{await db.exec('rollback to savepoint expected;release savepoint expected');}}
async function snapshot(){return (await rows(`select jsonb_build_object(
  'crm',(select count(*) from public.iptv_customers),'fulfillments',(select count(*) from public.ks_preview_paid_fulfillments),
  'logins',(select count(*) from public.ks_preview_streaming_logins),'audits',(select count(*) from public.ks_setup_review_completions),
  'spent',(select spent_units::text from public.ks_setup_review_budgets),'reserved',(select reserved_units::text from public.ks_setup_review_budgets),
  'oldSlots',(select count(*) from public.ks_preview_reseller_dispatches),'reviewSlots',(select count(*) from public.ks_setup_review_reseller_slots),
  'state',(select state from public.ks_preview_provisioning_attempts),'queue',(select fulfillment_status from public.ks_setup_order_queue)) as value`))[0].value;}
async function fixture({state='provider_verified',cost='1.5',approvedBalance='100500000',fingerprint=f.review.entry.provider.fingerprint,withReview=true}={}){
  await db.exec('reset role');
  await rows(`insert into public.ks_setup_review_policies(policy_id,environment,reseller_id,mode,policy_hash,starts_at,expires_at,per_order_units,daily_limit_units,min_reserve_units)
    values($1,'preview','99999','review-only',$2,clock_timestamp()-interval '2 minutes',clock_timestamp()+interval '1 hour',2000000,10000000,5000000)`,[policy,'a'.repeat(64)]);
  await rows("insert into public.ks_setup_review_packages values($1,'bronze',1,'1000',$2,1500000)",[policy,fingerprint]);
  await db.exec('set role service_role');
  await rows("select public.ks_record_paid_checkout($1,$2,$3,false,'bronze',1,30,2000,'usd')",[f.session.id,f.row.payment_intent_id,owner]);
  await rows("insert into public.ks_setup_purchase_intents select $1,$2,'new_service',true,'authenticated_checkout',recorded_at-interval '1 millisecond' from public.ks_payment_receipts where checkout_session_id=$1",[f.session.id,owner]);
  const [clock]=await rows("select clock_timestamp() as at,(clock_timestamp() at time zone 'UTC')::date as day");
  const reserved=withReview ? (await rows('select public.ks_reserve_setup_review($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) as value',
    [f.session.id,owner,policy,'a'.repeat(64),'preview','99999','1000',fingerprint,'1500000','100500000',clock.day,clock.at,'c'.repeat(64)]))[0] : null;
  await rows('select public.ks_queue_preview_paid_order($1,$2)',[f.session.id,owner]);
  const [attempt]=await rows('select public.ks_reserve_preview_provisioning($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true) as value',
    [f.row.attempt_id,f.session.id,owner,f.row.binding_hash,'99999','1000',1,1,cost,[13,14],JSON.stringify(f.row.login_envelope),f.row.username_hash]);
  const token=attempt.value.claimToken;
  if(state!=='reserved'){
    await rows("select public.ks_begin_approved_preview_provisioning($1,$2,$3,$4,clock_timestamp()+interval '1 minute',$5,$6)",
      [f.row.attempt_id,token,admin,'d'.repeat(64),String(Number(cost)*1000000),approvedBalance]);
    if(state==='provider_verified')await rows("select public.ks_record_preview_provider_result($1,$2,'9999901','99999','1000',$3,1,array[13,14],clock_timestamp()+interval '31 days')",[f.row.attempt_id,token,f.row.username_hash]);
    if(state==='reconciliation_required')await rows('select public.ks_reconcile_preview_provisioning($1,$2)',[f.row.attempt_id,token]);
  }
  return {claimId:reserved?.value.claim_id,attemptId:f.row.attempt_id,token,ownerId:owner,username:f.login.username};
}
async function complete(input){return (await rows('select public.ks_complete_reviewed_preview_setup($1,$2,$3,$4,$5) as value',[input.claimId,input.attemptId,input.token,input.ownerId,input.username]))[0].value;}

try{
  const payment=await read('./ks-payment-schema.sql');
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${owner}'),('${admin}'),('${other}');
    create schema extensions;
    -- The fixture uses PostgreSQL's native SHA-256 implementation in place of
    -- pgcrypto's identical text/SHA-256 overload; this is not installation SQL.
    create function extensions.digest(text,text) returns bytea language sql immutable as $$select pg_catalog.sha256(pg_catalog.convert_to($1,'UTF8'))$$;
    grant usage on schema public,extensions to service_role,anon,authenticated;
    create table public.profiles(id uuid primary key references auth.users,email text,full_name text,subscription_status text default 'inactive',active_connections int default 0,subscription_expires_at timestamptz,updated_at timestamptz default now());
    insert into public.profiles(id,email) values('${owner}','one@example.invalid'),('${admin}','admin@example.invalid'),('${other}','other@example.invalid');
    create table public.ks_roomba_trial_attempts(admin_id uuid);
    create table public.iptv_customers(id uuid primary key default gen_random_uuid(),external_id bigint unique,username text unique,customer_name text,package_name text,trial boolean,connections_allowed int,expiration_at timestamptz,renewal_at timestamptz,monthly_price numeric,payment_status text,account_status text,source text,iptv_password text,email text,phone text,last_payment_at timestamptz);
    create table public.iptv_customer_activity(id uuid primary key default gen_random_uuid(),customer_id uuid references public.iptv_customers,activity_type text,title text,details text);
    grant select,update on public.profiles to service_role;grant select on public.ks_roomba_trial_attempts to service_role;
    grant select,insert on public.iptv_customers,public.iptv_customer_activity to service_role;
    ${payment.slice(payment.indexOf('create table'),payment.indexOf('CREATE OR REPLACE FUNCTION'))}`);
  for(const name of ['./ks-preview-paid-orders-schema.sql','./ks-paid-foundation-schema.sql','./ks-guarded-paid-execution-schema.sql','./ks-receipt-only-schema.sql','./ks-setup-review-claim-schema.sql','./ks-reviewed-preview-completion-schema.sql'])await db.exec(await read(name));

  // Historical completion migration tests run first, in migration order. Their
  // dual-slot fixture is deliberately rejected by the new exclusion below.
  await check('actual guarded completion commits CRM, encrypted login, both queues and exact review credit settlement together',async()=>{
    const input=await fixture(),before=(await rows('select jsonb_agg(to_jsonb(p) order by id) as value from public.profiles p'))[0].value;
    const result=await complete(input);assert.equal(result.state,'credentials_ready');assert.equal(result.may_dispatch,false);assert.equal(result.replayed,false);
    assert.deepEqual(await snapshot(),{crm:1,fulfillments:1,logins:1,audits:1,spent:'1500000',reserved:'0',oldSlots:0,reviewSlots:0,state:'credentials_ready',queue:'setup_complete'});
    assert.deepEqual((await rows('select jsonb_agg(to_jsonb(p) order by id) as value from public.profiles p'))[0].value,before);
    assert.equal((await rows('select activated from public.ks_payment_receipts'))[0].activated,false);
    assert.equal((await rows('select state from public.ks_setup_review_claims'))[0].state,'reserved_for_review');
    assert.equal((await rows('select source from public.iptv_customers'))[0].source,'roomba_preview_paid');
  });
  await check('lost completion replies and repeated calls return the same audit without a second CRM row or debit',async()=>{
    const input=await fixture(),first=await complete(input),saved=await snapshot();
    for(let n=0;n<10;n++){const replay=await complete(input);assert.equal(replay.replayed,true);assert.equal(replay.expires_at,first.expires_at);}
    assert.deepEqual(await snapshot(),saved);
  });
  await check('the actual server adapter reaches the actual SQL bridge and recovers a lost function response',async()=>{
    const saved=await fixture();let loseReply=true;
    const input={...saved,claimToken:saved.token,sessionId:f.session.id};delete input.token;
    const options={env:{VERCEL_ENV:'preview',KS_REVIEWED_PREVIEW_COMPLETION:'enabled-v1'},now:Date.now(),
      stripe:{checkout:{sessions:{async retrieve(){return structuredClone(f.session);}}}},
      admin:{auth:{admin:{async getUserById(id){return {data:{user:{id,email:'one@example.invalid',is_anonymous:false,email_confirmed_at:'2020-01-01T00:00:00Z'}},error:null};}}},
        from(){return {select(){return this;},eq(){return this;},async maybeSingle(){return {data:{id:owner,email:'one@example.invalid'},error:null};}};},
        async rpc(name,args){assert.equal(name,'ks_complete_reviewed_preview_setup');const data=await complete({claimId:args.p_claim_id,attemptId:args.p_attempt_id,token:args.p_claim_token,ownerId:args.p_user_id,username:args.p_username});if(loseReply){loseReply=false;throw new Error('synthetic_lost_function_response');}return {data,error:null};}}};
    await assert.rejects(()=>completeReviewedPreviewSetup(input,options),/reviewed_preview_completion_unavailable/);
    const result=await completeReviewedPreviewSetup(input,options);assert.equal(result.replayed,true);assert.equal(result.mayDispatch,false);
    assert.equal((await snapshot()).crm,1);assert.equal((await snapshot()).spent,'1500000');
  });
  await check('reserved, dispatching and uncertain provider states cannot announce readiness or release review credits',async()=>{
    // Separate subtransactions preserve each fictional fixture's constraints.
    for(const state of ['reserved','dispatching','reconciliation_required']){
      await db.exec('savepoint state_case');const input=await fixture({state});
      await rejected(()=>complete(input),/saved_provider_verification_required/);assert.equal((await snapshot()).audits,0);assert.equal((await snapshot()).reserved,'1500000');
      await db.exec('rollback to savepoint state_case;release savepoint state_case');
    }
  });
  await check('wrong purchaser, attempt token and username stop before completion',async()=>{
    const input=await fixture();
    for(const [key,value,pattern] of [['ownerId',other,/preview_review_owner_required/],['token',other,/reviewed_attempt_binding_changed/],['username','ks_wrong_customer',/verified_paid_setup_required/]])await rejected(()=>complete({...input,[key]:value}),pattern);
    assert.equal((await snapshot()).crm,0);assert.equal((await snapshot()).spent,'0');
  });
  await check('a separately approved cost or observed balance that differs from the review claim rolls completion back',async()=>{
    for(const patch of [{cost:'2'},{approvedBalance:'100000000'}]){
      await db.exec('savepoint mismatch');const input=await fixture(patch),before=await snapshot();
      await rejected(()=>complete(input),/separately_verified_preview_completion_required/);assert.deepEqual(await snapshot(),before);
      await db.exec('rollback to savepoint mismatch;release savepoint mismatch');
    }
  });
  await check('the saved attempt must bind the exact reviewed package fingerprint and canonical payment terms',async()=>{
    const input=await fixture({fingerprint:'b'.repeat(64)}),before=await snapshot();
    await rejected(()=>complete(input),/separately_verified_preview_completion_required/);assert.deepEqual(await snapshot(),before);
  });
  await check('a queue already marked for review cannot be silently completed',async()=>{
    const input=await fixture();await rows("update public.ks_setup_order_queue set fulfillment_status='requires_review'");
    await rejected(()=>complete(input),/separately_verified_preview_completion_required/);assert.equal((await snapshot()).crm,0);
  });
  await check('completion still succeeds after review policy revocation because it dispatches nothing',async()=>{
    const input=await fixture();await rows('update public.ks_setup_review_policies set revoked_at=clock_timestamp() where policy_id=$1',[policy]);
    assert.equal((await complete(input)).state,'credentials_ready');
  });
  await check('a failure after real CRM/login completion rolls every local write back and the exact retry recovers',async()=>{
    const input=await fixture(),before=await snapshot();await db.exec(`reset role;
      create function public.ks_test_completion_failure() returns trigger language plpgsql as $$begin raise exception 'synthetic_after_crm_failure';end;$$;
      create trigger ks_test_completion_failure after insert on public.ks_setup_review_completions for each row execute function public.ks_test_completion_failure();set role service_role;`);
    await rejected(()=>complete(input),/synthetic_after_crm_failure/);assert.deepEqual(await snapshot(),before);
    await db.exec('reset role;drop trigger ks_test_completion_failure on public.ks_setup_review_completions;set role service_role');assert.equal((await complete(input)).state,'credentials_ready');
  });
  await check('a failure after budget settlement restores both dispatch slots, proof state and zero local completion',async()=>{
    const input=await fixture(),before=await snapshot();await db.exec(`reset role;
      create function public.ks_test_settlement_failure() returns trigger language plpgsql as $$begin if new.spent_units>old.spent_units then raise exception 'synthetic_after_budget_failure';end if;return new;end;$$;
      create trigger ks_test_settlement_failure after update on public.ks_setup_review_budgets for each row execute function public.ks_test_settlement_failure();set role service_role;`);
    await rejected(()=>complete(input),/synthetic_after_budget_failure/);assert.deepEqual(await snapshot(),before);
    await db.exec('reset role;drop trigger ks_test_settlement_failure on public.ks_setup_review_budgets;set role service_role');assert.equal((await complete(input)).state,'credentials_ready');
  });
  await check('raw budget changes, slot deletion and fake queue readiness require the verified settlement audit',async()=>{
    await fixture();
    await rejected(()=>db.exec('update public.ks_setup_review_budgets set reserved_units=0'),/verified_review_settlement_required/);
    await rejected(()=>db.exec('update public.ks_setup_review_budgets set spent_units=1500000,reserved_units=0'),/verified_review_settlement_required/);
    await rejected(()=>db.exec('delete from public.ks_setup_review_reseller_slots'),/setup_review_history_cannot_be_deleted/);
    await rejected(()=>db.exec("update public.ks_setup_order_queue set fulfillment_status='setup_complete'"),/review_completion_binding_required/);
  });
  await check('valid audit inserted without its settlement cannot commit a partial transaction',async()=>{
    const input=await fixture();await rows('select public.ks_commit_preview_paid_setup($1,$2,$3)',[input.attemptId,input.token,input.username]);
    await rows(`insert into public.ks_setup_review_completions(claim_id,attempt_id,user_id,checkout_session_id,reseller_id,utc_day,cost_units,before_spent,before_reserved,after_spent,after_reserved)
      select c.claim_id,$2,c.user_id,c.checkout_session_id,c.reseller_id,c.utc_day,c.cost_units,b.spent_units,b.reserved_units,b.spent_units+c.cost_units,b.reserved_units-c.cost_units
      from public.ks_setup_review_claims c join public.ks_setup_review_budgets b using(reseller_id,utc_day) where c.claim_id=$1`,[input.claimId,input.attemptId]);
    await rejected(()=>db.exec('set constraints all immediate'),/review_completion_transaction_incomplete/);
    // Remove the entire deliberately incomplete subtransaction before the
    // check wrapper's final constraint assertion.
    await db.exec('rollback;begin');
  });
  await check('completed audit, original claim, completed queue and spent budget cannot be reset or deleted',async()=>{
    const input=await fixture();await complete(input);
    await rejected(()=>db.exec('delete from public.ks_setup_review_completions'),/permission denied/);
    await rejected(()=>db.exec("update public.ks_setup_review_claims set state='reserved_for_review'"),/setup_review_claim_is_immutable/);
    await rejected(()=>db.exec("update public.ks_setup_order_queue set fulfillment_status='awaiting_activation'"),/setup_order_review_cannot_be_reset/);
    await rejected(()=>db.exec('update public.ks_setup_review_budgets set spent_units=0'),/verified_review_settlement_required/);
    await db.exec('reset role');await rejected(()=>db.exec('delete from public.ks_setup_review_completions'),/review_completion_is_immutable/);
  });
  await check('the audit is service-only RLS and all new functions retain invoker security and an empty search path',async()=>{
    const input=await fixture();await db.exec('reset role');
    const [table]=await rows("select relrowsecurity,has_table_privilege('authenticated',oid,'select') as readable from pg_class where oid='public.ks_setup_review_completions'::regclass");assert.equal(table.relrowsecurity,true);assert.equal(table.readable,false);
    const defs=await rows("select prosecdef,proconfig from pg_proc where proname in ('ks_guard_reviewed_preview_completion','ks_check_review_completion_committed','ks_complete_reviewed_preview_setup')");assert.equal(defs.length,3);assert.ok(defs.every(r=>!r.prosecdef&&r.proconfig.includes('search_path=""')));
    for(const role of ['anon','authenticated']){await db.exec(`set role ${role}`);await rejected(()=>complete(input),/permission denied/);await rejected(()=>db.exec('select * from public.ks_setup_review_completions'),/permission denied/);await db.exec('reset role');}
  });
  const historicalChecks=checks;
  await db.exec(await read('./ks-reseller-reservation-exclusion-schema.sql'));
  await check('current schema refuses the historical dual-slot completion fixture',async()=>{
    await rejected(()=>fixture(),/reseller_reserved_for_setup_review/);
    assert.equal((await rows('select count(*)::int as n from public.ks_preview_provisioning_attempts'))[0].n,0);
    assert.equal((await snapshot()).reviewSlots,0);assert.equal((await snapshot()).oldSlots,0);
  });
  await check('a review-only claim remains reserved and blocks the actual approved Preview begin RPC',async()=>{
    const input=await fixture({state:'reserved'}),before=await snapshot();
    await rejected(()=>rows("select public.ks_begin_approved_preview_provisioning($1,$2,$3,$4,clock_timestamp()+interval '1 minute',1500000,100500000)",
      [input.attemptId,input.token,admin,'d'.repeat(64)]),/reseller_reserved_for_setup_review/);
    assert.deepEqual(await snapshot(),before);assert.equal(before.state,'reserved');
    assert.equal(before.reserved,'1500000');assert.equal(before.oldSlots,0);assert.equal(before.reviewSlots,1);
    await rejected(()=>db.exec('delete from public.ks_setup_review_reseller_slots'),/setup_review_history_cannot_be_deleted/);
  });
  await check('a standalone approved Preview attempt blocks direct review-slot insertion',async()=>{
    await fixture({withReview:false});const before=await snapshot();
    await rejected(()=>rows('insert into public.ks_setup_review_reseller_slots(reseller_id,claim_id) values($1,$2)',
      ['99999',other]),/reseller_reserved_for_preview_dispatch/);
    assert.deepEqual(await snapshot(),before);assert.equal(before.oldSlots,1);assert.equal(before.reviewSlots,0);
    await rejected(()=>db.exec('delete from public.ks_preview_reseller_dispatches'),/unresolved_dispatch_remains_locked/);
  });
  await check('standalone verified Preview completion and its saved replay still work with the new guard',async()=>{
    const input=await fixture({withReview:false});
    const commit=()=>rows('select public.ks_commit_preview_paid_setup($1,$2,$3) as value',[input.attemptId,input.token,input.username]);
    assert.equal((await commit())[0].value.replayed,false);const before=await snapshot();
    assert.equal((await commit())[0].value.replayed,true);assert.deepEqual(await snapshot(),before);
    assert.equal(before.crm,1);assert.equal(before.logins,1);assert.equal(before.fulfillments,1);
    assert.equal(before.oldSlots,0);assert.equal(before.reviewSlots,0);assert.equal(before.audits,0);
    assert.equal((await rows('select activated from public.ks_payment_receipts'))[0].activated,false);
  });
  console.log(`${historicalChecks} historical completion checks and ${checks-historicalChecks} current exclusion integration checks passed in isolated PostgreSQL. No connected project, real credit, provider, payment or email was changed.`);
}catch(error){console.error('Reviewed Preview completion test failed',{message:error.message,code:error.code,where:error.where});process.exitCode=1;}
finally{await db.close();}
