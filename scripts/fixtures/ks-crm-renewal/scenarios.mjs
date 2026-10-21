import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { buildPreservingRenewalPlan } from '../../../_server/ks-crm-renewal-plan.js';
import { createRenewalApprovalRehearsal } from '../../../_server/ks-crm-renewal-approval.js';
import { adminId, literal, json, fixture as setupFixture, prepareAttempt, reserveReview, begin as setupBegin } from '../ks-reviewed-handoff/fixtures.mjs';

let sequence=0;
export async function renewalFixture(admin,worker,{reseller,line,customer,oldExpiry,reserveNow=true}={}) {
  const serial=++sequence;
  const at=await json(admin,"jsonb_build_object('at',clock_timestamp(),'old',date_trunc('second',clock_timestamp()+interval '30 days'))");
  const f={operation:randomUUID(),customer:customer??randomUUID(),line:line??String(98000000+serial),reseller:reseller??String(88000+serial),old:oldExpiry??at.old,username:`fictional_renewal_${serial}`};
  if(customer) f.username=await json(admin,`(select username from public.iptv_customers where id=${literal(customer)})`);
  else await admin.request(`insert into public.iptv_customers(id,external_id,username,expiration_at,monthly_price,payment_status,renewal_at,source)
    values(${literal(f.customer)},${literal(f.line)}::bigint,${literal(f.username)},${literal(f.old)}::timestamptz,50,'paid',clock_timestamp()+interval '7 days','fictional_rehearsal')`);
  f.plan=buildPreservingRenewalPlan({customer:{id:f.customer,external_id:f.line,username:f.username},
    line:{id:f.line,username:f.username,resellerId:f.reseller,packageId:'19',expiresAt:f.old,connections:1,trial:false,enabled:true,adminEnabled:true,bouquetIds:[2,13,18,40]},
    account:{id:f.reseller,credits:100},packages:[{id:'19',name:'12 Months + 1 Connection',maxConnections:1,trial:null,
      paid:{count:12,unit:'months',credits:12},bouquets:Array.from({length:107},(_,i)=>i+1),issues:[]}],
    checkedAt:at.at,preserveCurrentSelectionConfirmed:true},Date.parse(at.at));
  const signer=createRenewalApprovalRehearsal({kind:'simulation',key:randomBytes(32),now:()=>Date.parse(at.at)});
  const input={operationId:f.operation,approverId:adminId,plan:f.plan,preserveCurrentSelectionConfirmed:true};
  const issued=signer.issue(input);const verified=signer.verify(issued.token,input);
  f.approval=verified.approvalId;f.expires=verified.expiresAt;f.hash=createHash('sha256').update(issued.token).digest('hex');
  f.renewed=new Date(Date.parse(f.old)+365*86400000).toISOString();
  f.result={customerId:f.customer,lineId:f.line,username:f.username,resellerId:f.reseller,packageId:'19',
    expiresAt:f.renewed,connections:1,bouquetIds:[2,13,18,40],enabled:true,adminEnabled:true,trial:false};
  if(reserveNow)f.claim=(await json(worker,reserve(f))).claimToken;
  return f;
}
export const reserve=(f,{plan=f.plan,approval=f.approval,hash=f.hash,expires=f.expires}={})=>`public.ks_proto_reserve_renewal(
  ${literal(f.operation)},${literal(approval)},${literal(adminId)},${literal(JSON.stringify(plan))}::jsonb,${literal(expires)}::timestamptz,${literal(hash)})`;
export const begin=f=>`public.ks_proto_begin_renewal(${literal(f.operation)},${literal(f.claim)})`;
export const verify=(f,{result=f.result,returned=f.renewed,balance=88000000}={})=>`public.ks_proto_verify_renewal(
  ${literal(f.operation)},${literal(f.claim)},${literal(JSON.stringify(result))}::jsonb,${literal(returned)}::timestamptz,${balance}::bigint)`;
export const complete=(f,expiry=f.renewed)=>`public.ks_proto_complete_renewal(${literal(f.operation)},${literal(f.claim)},${literal(expiry)}::timestamptz)`;
export const stop=f=>`public.ks_proto_stop_renewal(${literal(f.operation)},${literal(f.claim)})`;
export const summary=(admin,f)=>json(admin,`jsonb_build_object(
  'state',(select state from public.ks_proto_renewal_operations where operation_id=${literal(f.operation)}),
  'versions',(select count(*) from public.ks_proto_renewal_line_versions where operation_id=${literal(f.operation)}),
  'slots',(select count(*) from public.ks_proto_renewal_reseller_slots where operation_id=${literal(f.operation)}),
  'completions',(select count(*) from public.ks_proto_renewal_completions where operation_id=${literal(f.operation)}),
  'expiry',(select expiration_at from public.iptv_customers where id=${literal(f.customer)}))`);

export async function runSequential({admin,worker,check}) {
  await check('private invoker-only ledger seeds no work and exposes no table or function to browser roles',async()=>{
    assert.equal(await json(admin,'(select count(*) from public.ks_proto_renewal_operations)'),0);
    for(const role of ['anon','authenticated']) {
      const rows=await json(admin,`(select jsonb_agg(jsonb_build_object('table',c.relname,'rls',c.relrowsecurity,
        'read',has_table_privilege(${literal(role)},c.oid,'select'),'write',has_table_privilege(${literal(role)},c.oid,'insert')))
        from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname like 'ks_proto_renewal_%' and c.relkind='r')`);
      assert.equal(rows.length,5);for(const row of rows){assert.equal(row.rls,true);assert.equal(row.read,false);assert.equal(row.write,false);}
      const functions=await json(admin,`(select jsonb_agg(jsonb_build_object('definer',prosecdef,'config',proconfig,
        'execute',has_function_privilege(${literal(role)},p.oid,'execute'))) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
        where n.nspname='public' and p.proname like 'ks_proto_%renewal%')`);
      for(const fn of functions){assert.equal(fn.definer,false);assert.equal(fn.execute,false);assert.ok(fn.config.includes('search_path=""'));}
    }
  });
  await check('signed fictional approval survives lost reserve replies but cannot bind changed inputs',async()=>{
    const f=await renewalFixture(admin,worker);assert.equal((await json(worker,reserve(f))).replayed,true);
    for(const patch of [{hash:'f'.repeat(64)},{approval:randomUUID()},{plan:{...f.plan,bouquetIds:[2,13]}},{expires:new Date(Date.parse(f.expires)+1).toISOString()}])
      await assert.rejects(()=>json(worker,reserve(f,patch)),/renewal_operation_binding_changed/);
    assert.equal((await summary(admin,f)).state,'reserved');
  });
  await check('unknown fields, stale evidence, duplicate groups and unsupported identities are rejected',async()=>{
    const f=await renewalFixture(admin,worker);
    for(const plan of [{...f.plan,password:'must-not-store'},{...f.plan,checkedAt:new Date(Date.now()-60000).toISOString()},
      {...f.plan,bouquetIds:[2,2]},{...f.plan,resellerId:'088888'},{...f.plan,username:'wrong-identity'}, {...f.plan,costUnits:'0'}]) {
      const other={...f,operation:randomUUID(),approval:randomUUID(),hash:createHash('sha256').update(randomUUID()).digest('hex')};
      await assert.rejects(()=>json(worker,reserve(other,{plan})));
    }
    assert.equal((await summary(admin,f)).versions,0);
  });
  await check('begin consumes a persistent line version and cannot be replayed into a second decision',async()=>{
    const f=await renewalFixture(admin,worker);assert.equal(await json(worker,begin(f)),true);
    for(let i=0;i<3;i++)assert.equal(await json(worker,begin(f)),false);
    const s=await summary(admin,f);assert.equal(s.versions,1);assert.equal(s.slots,1);assert.equal(s.state,'dispatching');
  });
  await check('different operation IDs for the same line version cannot both begin',async()=>{
    const f=await renewalFixture(admin,worker),g=await renewalFixture(admin,worker,{customer:f.customer,line:f.line,reseller:f.reseller,oldExpiry:f.old});
    assert.equal(await json(worker,begin(f)),true);assert.equal(await json(worker,begin(g)),false);
    assert.equal((await summary(admin,g)).versions,0);
  });
  await check('uncertain dispatch remains reserved and cannot reset, release or accept a result automatically',async()=>{
    const f=await renewalFixture(admin,worker);await json(worker,begin(f));await worker.request(`select ${stop(f)}`);
    assert.equal(await json(worker,begin(f)),false);assert.equal((await summary(admin,f)).state,'reconciliation_required');
    await assert.rejects(()=>worker.request(`delete from public.ks_proto_renewal_reseller_slots where operation_id=${literal(f.operation)}`),/unresolved_renewal_remains_locked/);
    await assert.rejects(()=>json(worker,verify(f)),/renewal_dispatch_required/);
    assert.equal((await summary(admin,f)).slots,1);
  });
  await check('provider result must retain every identity, allowance and group plus matching expiry/debit',async()=>{
    const f=await renewalFixture(admin,worker);await json(worker,begin(f));
    for(const patch of [{result:{...f.result,bouquetIds:[2,13]}},{result:{...f.result,username:'different'}},
      {result:{...f.result,connections:2}},{result:{...f.result,trial:true}},{result:{...f.result,password:'discard'}},
      {returned:f.old},{balance:87000000},{result:{...f.result,expiresAt:f.old},returned:f.old}])
      await assert.rejects(()=>json(worker,verify(f,patch)),/renewal_result_requires_reconciliation/);
    assert.equal((await summary(admin,f)).state,'dispatching');assert.equal(await json(worker,verify(f)),true);
    assert.equal(await json(worker,verify(f)),false);
  });
  await check('completion atomically updates only CRM expiration and releases the slot once',async()=>{
    const f=await renewalFixture(admin,worker);
    const before=await json(admin,`(select to_jsonb(c)-'expiration_at' from public.iptv_customers c where id=${literal(f.customer)})`);
    await json(worker,begin(f));await json(worker,verify(f));
    assert.equal((await json(worker,complete(f))).replayed,false);
    for(let i=0;i<3;i++)assert.equal((await json(worker,complete(f))).replayed,true);
    assert.deepEqual(await json(admin,`(select to_jsonb(c)-'expiration_at' from public.iptv_customers c where id=${literal(f.customer)})`),before);
    const s=await summary(admin,f);assert.equal(s.completions,1);assert.equal(s.versions,1);assert.equal(s.slots,0);assert.equal(s.state,'complete');
    assert.equal(Date.parse(s.expiry),Date.parse(f.renewed));
  });
  await check('CRM identity or old-expiry drift stops completion and retains verified result and reseller slot',async()=>{
    for(const field of ['username','expiration_at']) {
      const f=await renewalFixture(admin,worker);await json(worker,begin(f));await json(worker,verify(f));
      await admin.request(`update public.iptv_customers set ${field}=${field==='username'?literal(f.username+'_changed'):literal(new Date(Date.parse(f.old)+1000).toISOString())+'::timestamptz'} where id=${literal(f.customer)}`);
      await assert.rejects(()=>json(worker,complete(f)),/renewal_crm_identity_changed/);
      const s=await summary(admin,f);assert.equal(s.state,'provider_verified');assert.equal(s.slots,1);assert.equal(s.completions,0);
    }
  });
  await check('unverified results, wrong claims and stale provider readback cannot complete',async()=>{
    const f=await renewalFixture(admin,worker);await assert.rejects(()=>json(worker,complete(f)),/verified_current_renewal_required/);
    await assert.rejects(()=>json(worker,begin({...f,claim:randomUUID()})),/renewal_claim_required/);
    await json(worker,begin(f));await json(worker,verify(f));
    await assert.rejects(()=>json(worker,complete(f,f.old)),/verified_current_renewal_required/);
    assert.equal((await summary(admin,f)).slots,1);
  });
  for(const protocol of ['preview','review']) {
    await check(`existing ${protocol} reservation blocks renewal using the unchanged setup functions`,async()=>{
      const old=await setupFixture(admin);if(protocol==='preview'){await prepareAttempt(admin,old);await json(worker,setupBegin(old));}
      else await json(worker,reserveReview(old));
      const f=await renewalFixture(admin,worker,{reseller:old.reseller});
      await assert.rejects(()=>json(worker,begin(f)),/reseller_reserved_for_other_work/);
      assert.equal((await summary(admin,f)).versions,0);
    });
    await check(`renewal reservation blocks existing ${protocol} protocol, with no change to existing credits or queues`,async()=>{
      const f=await renewalFixture(admin,worker);await json(worker,begin(f));
      const old=await setupFixture(admin,{reseller:f.reseller});
      if(protocol==='preview'){await prepareAttempt(admin,old);await assert.rejects(()=>json(worker,setupBegin(old)),/reseller_reserved_for_other_work/);}
      else await assert.rejects(()=>json(worker,reserveReview(old)),/reseller_reserved_for_other_work/);
      assert.equal((await summary(admin,f)).slots,1);
    });
  }
  await check('expiry at deferred commit rolls back the simulated decision and all reservations',async()=>{
    const f=await renewalFixture(admin,worker);
    // Shorten only this disposable approval as owner, temporarily disabling its
    // immutable trigger to exercise a real commit-time boundary deterministically.
    await admin.request(`alter table public.ks_proto_renewal_approvals disable trigger ks_proto_renewal_approval_immutable;
      update public.ks_proto_renewal_approvals set expires_at=clock_timestamp()+interval '1 second' where approval_id=${literal(f.approval)};
      alter table public.ks_proto_renewal_approvals enable trigger ks_proto_renewal_approval_immutable`);
    await worker.request('begin');try{assert.equal(await json(worker,begin(f)),true);await worker.request('select pg_sleep(1.1)');
      await assert.rejects(()=>worker.request('commit'),/fresh_renewal_approval_required/);}finally{await worker.request('rollback');}
    const s=await summary(admin,f);assert.equal(s.versions,0);assert.equal(s.slots,0);assert.equal(s.state,'reserved');
  });
  await check('non-read-committed transactions stop before any renewal reservation',async()=>{
    for(const isolation of ['repeatable read','serializable','read uncommitted']) {
      const f=await renewalFixture(admin,worker);await worker.request(`begin isolation level ${isolation}`);
      try{await assert.rejects(()=>json(worker,begin(f)),/renewal_read_committed_required/);}finally{await worker.request('rollback');}
      assert.equal((await summary(admin,f)).versions,0);
    }
  });
}
