import { getRetailPrice, retailPlans } from '../../../_shared/ks-retail-pricing.js';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { buildOrderRenewalEvidence, expectedChangedOrderExpiry } from '../../../_server/ks-crm-renewal-order-plan.js';
import { createOrderRenewalConsent } from '../../../_server/ks-crm-renewal-order-consent.js';
import { createOrderRenewalLedger } from '../../../_server/ks-crm-renewal-order-ledger.js';
import { createOrderRenewalExecutor } from '../../../_server/ks-crm-renewal-order-execution.js';
import { createLiveRenewalConsent } from '../../../_server/ks-crm-renewal-live-consent.js';
import { createRoombaCrmRoute } from '../../../_server/ks-roomba-crm-route.js';
import { adminId, json, literal, fixture as setupFixture, prepareAttempt, begin as setupBegin, reserveReview } from '../ks-reviewed-handoff/fixtures.mjs';
import { renewalFixture, begin as testBegin } from './scenarios.mjs';
import { liveFixture, liveBegin } from './live.mjs';

const project='https://wftfxerblhlsxiijtfbo.supabase.co';
const confirmations={preserveCurrentSelectionConfirmed:true,creditSpendConfirmed:true,unusedTimeLossConfirmed:true,providerTestConfirmed:true};
const rpcArguments={
  ks_crm_order_lookup_renewal:['p_operation','p_approval','p_approver','p_customer','p_fingerprint','p_approval_hash'],
  ks_crm_order_reserve_renewal:['p_operation','p_approval','p_approver','p_plan','p_expires','p_approval_hash'],
  ks_crm_order_begin_renewal:['p_operation','p_claim'],ks_crm_order_stop_renewal:['p_operation','p_claim'],
  ks_crm_order_verify_renewal:['p_operation','p_claim','p_result','p_returned_expiry','p_balance'],
  ks_crm_order_complete_renewal:['p_operation','p_claim','p_current_expiry'],
};
const expression=(name,args)=>{
  const keys=rpcArguments[name];assert.ok(keys);assert.deepEqual(Object.keys(args).sort(),[...keys].sort());
  return `public.${name}(${keys.map(key=>key==='p_plan'||key==='p_result'?`${literal(JSON.stringify(args[key]))}::jsonb`:literal(args[key])).join(',')})`;
};
export const orderBegin=f=>expression('ks_crm_order_begin_renewal',{p_operation:f.receipt.operationId,p_claim:f.record.claimToken});
let sequence=0;
export async function orderFixture(admin,worker,{fault='',base,reseller}={}){
  const n=++sequence,customer=base?.customer||randomUUID(),line=base?.line||String(96000000+n),username=base?.username||`fictional_changed_${n}`;
  reseller=base?.reseller||reseller||String(880000+n);
  const at=Number(await json(admin,'floor(extract(epoch from clock_timestamp())*1000)'));
  const old=base?.old||new Date(Math.floor((at+7*86400000)/1000)*1000).toISOString();
  if(!base)await admin.request(`insert into public.iptv_customers(id,external_id,username,expiration_at,connections_allowed,package_name,payment_status,monthly_price,source)
    values(${literal(customer)},${literal(line)},${literal(username)},${literal(old)},4,null,'unpaid',29.50,'fictional_fixture')`);
  const state={now:at,calls:0,reads:0,snapshots:0,balance:'68',failed:false,user:{},
    line:{id:line,username,resellerId:reseller,packageId:'76',expiresAt:old,connections:4,trial:false,enabled:true,adminEnabled:true,bouquetIds:[1,60,63]},
    packages:[{id:'76',name:'6 Months + 4 Connections',maxConnections:4,trial:null,paid:{count:6,unit:'months',credits:19},bouquets:[1,60,63,100],issues:[]},
      {id:'77',name:'6 Months + 3 Connections',maxConnections:3,trial:null,paid:{count:6,unit:'months',credits:15},bouquets:[1,60,63,100],issues:[]} ]};
  const captured=[];
  const client={supabaseUrl:project,from(table){
    assert.ok(['ks_crm_renewal_control','ks_crm_live_renewal_control','ks_crm_order_renewal_control','iptv_customers'].includes(table));
    let selected,field,match;
    return {select(columns){selected=columns;assert.equal(columns,table==='iptv_customers'?'id,external_id,username,expiration_at,connections_allowed,package_name':'execution_enabled');return this;},
      eq(key,value){field=key;match=value;assert.equal(key,table==='iptv_customers'?'id':'singleton');return this;},
      async maybeSingle(){return{data:await json(worker,`coalesce((select to_jsonb(c) from (select ${selected} from public.${table} where ${field}=${typeof match==='boolean'?match:literal(match)}) c),'null'::jsonb)`),error:null};}};},
    async rpc(name,args){
      captured.push({name,args:structuredClone(args)});const action=name.replace('ks_crm_order_','').replace('_renewal','');
      if(fault===`${action}_not_saved`&&!state.failed){state.failed=true;throw Error('fictional SQL failure');}
      const data=await json(worker,`coalesce(to_jsonb(${expression(name,args)}),'null'::jsonb)`);
      if(fault===`${action}_reply_lost`&&!state.failed){state.failed=true;throw Error('fictional SQL reply lost');}
      if(action==='begin'&&fault==='deadline_after_commit')state.now+=31000;
      if(action==='begin'&&fault==='disabled_after_commit')await admin.request('update public.ks_crm_order_renewal_control set execution_enabled=false');
      if(action==='complete'&&fault==='complete_reply_lost')throw Error('fictional SQL reply lost');
      return{data,error:null};
    }};
  const crm={async current(){return(await client.from('iptv_customers').select('id,external_id,username,expiration_at,connections_allowed,package_name').eq('id',customer).maybeSingle()).data;}};
  const context=()=>({line:structuredClone(state.line),account:{id:reseller,credits:state.balance},packages:structuredClone(state.packages),checkedAt:new Date(state.now).toISOString()});
  const key=randomBytes(32),consent=createOrderRenewalConsent({key,now:()=>state.now});
  const input=async()=>({...confirmations,actorId:adminId,customer:await crm.current(),context:context(),requested:{months:6,connections:3}});
  const receipt=consent.issue(await input()),args={...confirmations,actorId:adminId,customerId:customer,token:receipt.token};
  const ledger=createOrderRenewalLedger({client,projectUrl:project});
  const provider={async snapshot(){state.snapshots++;return context();},async renew(lineId,form){
    assert.equal(lineId,line);assert.deepEqual([...form],[['trial','0'],['package','77'],['package_duration','6 months'],['max_connections','3'],
      ['bouquets_selected[]','1'],['bouquets_selected[]','60'],['bouquets_selected[]','63']]);
    state.calls++;state.balance='53';state.line={...state.line,packageId:'77',connections:3,expiresAt:new Date(expectedChangedOrderExpiry(state.now,6)).toISOString()};
    if(fault==='accepted_timeout')throw Error('fictional accepted timeout');
    if(fault==='carryover')state.line.expiresAt=new Date(Date.parse(state.line.expiresAt)+7*86400000).toISOString();
    if(fault==='short_term')state.line.expiresAt=new Date(Date.parse(state.line.expiresAt)-10*86400000).toISOString();
    const result=structuredClone(state.line);if(fault==='returned_mismatch')result.connections=4;return result;
  },async read(){state.reads++;const result=structuredClone(state.line);if(fault==='readback_mismatch')result.bouquetIds=[1,60,63,100];return result;},
  async account(){return{id:fault==='wrong_account'?'99999':reseller,credits:fault==='wrong_debit'?'52':state.balance};}};
  const env={VERCEL_ENV:'preview',VITE_SUPABASE_URL:project,VITE_SUPABASE_ANON_KEY:'fictional-anon',SUPABASE_SERVICE_ROLE_KEY:'fictional-service',
    ROOMBA_PREVIEW_SECRET:'fictional-preview',KS_CRM_ORDER_RENEWAL_CUSTOMER_ID:customer,KS_CRM_ORDER_RENEWAL_ENABLED:'true',KS_CRM_ORDER_RENEWAL_CONSENT_KEY:key.toString('hex')};
  const route=createRoombaCrmRoute({env,now:()=>state.now,orderProviderFactory:()=>provider,createClient(url,access){
    assert.equal(url,project);if(access==='fictional-anon')return{auth:{async getUser(){return{data:{user:{id:adminId,email:'djudge47@gmail.com',email_confirmed_at:new Date(state.now).toISOString(),...state.user}}};}}};
    assert.equal(access,'fictional-service');return client;}});
  const f={customer,line,username,reseller,old,state,consent,receipt,args,ledger,provider,crm,captured,env,context,input,
    run(patch={}){return createOrderRenewalExecutor({consent,ledger,provider,crm,now:()=>state.now})({...args,...patch});},
    async reserve(){const{plan}=buildOrderRenewalEvidence(await input(),state.now);this.record=await ledger.reserve(receipt,receipt.token,plan,new Date(state.now+30000).toISOString());return this.record;},
    async request(view,body,headers={},query={}){const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(value){this.body=value;return this;}};
      await route({method:body?'POST':'GET',query:{view,...(!body?{customerId:customer}:{}),...query},body,headers:{host:'fictional.example.invalid',origin:'https://fictional.example.invalid','content-type':'application/json',authorization:'Bearer fictional-admin',...headers}},res);
      assert.equal(res.headers['Cache-Control'],'private, no-store');for(const forbidden of ['fictional-service','fictional-admin','claimToken','planFingerprint'])assert.ok(!JSON.stringify(res.body).includes(forbidden));return res;},
    summary(){return json(admin,`jsonb_build_object('state',(select state from public.ks_crm_order_renewal_operations where operation_id=${literal(receipt.operationId)}),
      'slots',(select count(*) from public.ks_crm_order_renewal_reseller_slots where operation_id=${literal(receipt.operationId)}),
      'versions',(select count(*) from public.ks_crm_order_renewal_line_versions where operation_id=${literal(receipt.operationId)}),
      'completions',(select count(*) from public.ks_crm_order_renewal_completions where operation_id=${literal(receipt.operationId)}),
      'customer',(select to_jsonb(c) from public.iptv_customers c where id=${literal(customer)}))`);}};
  return f;
}

export async function runOrderChecks({admin,worker,check}){
  const source=await readFile(new URL('../../ks-crm-order-renewal-installation-schema.sql',import.meta.url),'utf8');
  await check('changed-order installation rejects enabled old execution and leaves no partial namespace',async()=>{
    await admin.request('update public.ks_crm_live_renewal_control set execution_enabled=true');
    await assert.rejects(()=>admin.request(source),/existing_execution_switches_must_be_off/);await admin.request('rollback');
    await admin.request('update public.ks_crm_live_renewal_control set execution_enabled=false');
    assert.equal(await json(admin,"to_regclass('public.ks_crm_order_renewal_control') is null"),true);
  });
  await admin.request(source);
  await check('exact changed-order installation verifier confirms the disabled private five-protocol foundation',async()=>{
    const sql=await readFile(new URL('../../ks-crm-order-renewal-installation-verify.sql',import.meta.url),'utf8');
    const query=sql.slice(sql.indexOf('select')).trim().replace(/;$/,'');
    const result=await json(admin,`(select to_jsonb(v) from (${query}) v)`);
    assert.equal(Object.keys(result).length,7);assert.ok(Object.values(result).every(v=>v===true));
  });
  await check('changed-order installation preserves customer data and all three controls stay disabled',async()=>{
    for(const table of ['ks_crm_renewal_control','ks_crm_live_renewal_control','ks_crm_order_renewal_control'])assert.equal(await json(worker,`(select execution_enabled from public.${table})`),false);
    await assert.rejects(()=>worker.request('update public.ks_crm_order_renewal_control set execution_enabled=true'),/permission denied/);
    await assert.rejects(()=>admin.request(source),/changed_order_installation_already_present/);await admin.request('rollback');
    const f=await orderFixture(admin,worker);assert.equal((await f.run()).state,'disabled');assert.equal(f.state.calls,0);assert.equal(f.state.snapshots,0);
  });
  await check('changed-order tables and invoker functions deny browser roles',async()=>{
    for(const role of ['anon','authenticated']){
      const rows=await json(admin,`(select jsonb_agg(jsonb_build_object('rls',relrowsecurity,'read',has_table_privilege('${role}',c.oid,'select'),'write',has_table_privilege('${role}',c.oid,'insert'))) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname like 'ks_crm_order_renewal_%' and relkind='r')`);
      assert.equal(rows.length,6);for(const row of rows)assert.deepEqual(row,{rls:true,read:false,write:false});
      const functions=await json(admin,`(select jsonb_agg(jsonb_build_object('definer',prosecdef,'config',proconfig,'allowed',has_function_privilege('${role}',p.oid,'execute'))) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'ks_crm_order_%renewal%')`);
      for(const fn of functions){assert.equal(fn.definer,false);assert.equal(fn.allowed,false);assert.ok(fn.config.includes('search_path=""'));}
    }
  });
  assert.equal(await json(admin,'current_database()'),'ks_disposable_crm_renewal_test');
  await admin.request(await readFile(new URL('../../ks-crm-renewal-retail-pricing-schema.sql',import.meta.url),'utf8'));
  await admin.request(await readFile(new URL('../../ks-crm-personal-credit-accounts-schema.sql',import.meta.url),'utf8'));
  await check('all 20 completed-renewal prices match the shared website and checkout catalog',async()=>{
    for(const plan of Object.values(retailPlans)) for(let connections=1;connections<=5;connections++){
      const price=getRetailPrice(plan.months,connections);
      assert.equal(Number(await json(worker,`public.ks_crm_retail_monthly_price('${plan.months} Months + ${connections} Connections',${connections})`)),price.monthlyCents/100);
    }
    for(const [name,count] of [['6 Months + 3 Connections',4],['not a catalog package',3],['0 Months + 3 Connections',3]])
      assert.equal(await json(worker,`coalesce(to_jsonb(public.ks_crm_retail_monthly_price(${literal(name)},${count})),'null'::jsonb)`),null);
    for(const role of ['anon','authenticated']){
      assert.equal(await json(admin,`has_function_privilege('${role}','public.ks_crm_retail_monthly_price(text,integer)','execute')`),false);
      assert.equal(await json(admin,`has_function_privilege('${role}','public.ks_crm_sync_completed_renewal_pricing()','execute')`),false);
    }
  });
  await admin.request('update public.ks_crm_order_renewal_control set execution_enabled=true');
  await check('calendar expectation covers DST and month ends without extending the previous expiry',()=>{
    for(const [from,months,to] of [['2026-10-22T03:56:00Z',6,'2027-04-22T03:56:00Z'],['2026-10-28T17:36:18Z',6,'2027-04-28T17:36:18Z'],
      ['2026-11-02T15:00:00Z',6,'2027-05-02T14:00:00Z'],['2027-01-31T17:00:00Z',1,'2027-02-28T17:00:00Z']])assert.equal(new Date(expectedChangedOrderExpiry(Date.parse(from),months)).toISOString(),new Date(to).toISOString());
  });
  await check('purpose separated quote binds exact changed terms, cost, saved fields and group subset; no password field',async()=>{
    const f=await orderFixture(admin,worker),input=await f.input(),{plan,form}=buildOrderRenewalEvidence(input,f.state.now);
    assert.equal(plan.currentConnections,4);assert.equal(plan.connections,3);assert.equal(plan.months,6);assert.equal(plan.costUnits,'15000000');
    assert.deepEqual(plan.bouquetIds,[1,60,63]);assert.equal(plan.savedPackageName,null);assert.equal(plan.executionEnabled,false);
    assert.ok(![...form()].some(([name])=>['password','username','exp_date','member_id'].includes(name)));
    for(const flag of Object.keys(confirmations))assert.throws(()=>buildOrderRenewalEvidence({...input,[flag]:false},f.state.now));
    const before=JSON.stringify(input);buildOrderRenewalEvidence(input,f.state.now);assert.equal(JSON.stringify(input),before);
    const same={...input,requested:{months:6,connections:4}};assert.throws(()=>buildOrderRenewalEvidence(same,f.state.now),/same_package/);
    for(const patch of [{connections_allowed:3},{package_name:'Another Package'}])assert.throws(()=>buildOrderRenewalEvidence({...input,customer:{...input.customer,...patch}},f.state.now));
    const old=createLiveRenewalConsent({key:Buffer.from(f.env.KS_CRM_ORDER_RENEWAL_CONSENT_KEY,'hex'),now:()=>f.state.now});
    assert.throws(()=>old.identify(f.receipt.token,{actorId:adminId,customerId:f.customer}));
    const oldReceipt=old.issue(input);assert.throws(()=>f.consent.identify(oldReceipt.token,{actorId:adminId,customerId:f.customer}));
  });
  await check('changed or expired quote rejects before reservation and before any provider purchase',async()=>{
    const capped=await orderFixture(admin,worker);capped.state.packages[1].paid.credits=15.000001;
    const cappedInput=await capped.input();
    assert.throws(()=>buildOrderRenewalEvidence(cappedInput,capped.state.now),/credit_limit_exceeded/);
    for(const change of [f=>f.state.packages[1].paid.credits=16,f=>f.state.line.bouquetIds=[1,60],f=>f.state.balance='67',f=>f.state.now+=300001]){
      const f=await orderFixture(admin,worker);change(f);assert.equal((await f.run()).state,'review_required');assert.equal(f.state.calls,0);assert.equal((await f.summary()).state,null);
    }
    for(const flag of Object.keys(confirmations)){const f=await orderFixture(admin,worker);assert.equal((await f.run({[flag]:false})).state,'review_required');assert.equal(f.state.snapshots,0);}
  });
  await check('SQL independently rejects changed plan shapes, stale dates and duplicate group selections',async()=>{
    for(const patch of [{password:'forbidden'},{currentPackageId:null},{currentConnections:3},{months:12},{unusedTimeLossConfirmed:false},
      {checkedAt:'2026-10-22T04:00:00'},{bouquetIds:[1,1]}, {savedPackageName:'Different saved order'}]){
      const f=await orderFixture(admin,worker),{plan}=buildOrderRenewalEvidence(await f.input(),f.state.now);
      await assert.rejects(()=>f.ledger.reserve(f.receipt,f.receipt.token,{...plan,...patch},new Date(f.state.now+30000).toISOString()));
      assert.equal((await f.summary()).state,null);
    }
  });
  await check('SQL independently rejects wrong provider fields, reset dates and credit debits; unresolved slots cannot be released',async()=>{
    const f=await orderFixture(admin,worker);await f.reserve();assert.equal(await json(worker,orderBegin(f)),true);
    const record=await f.ledger.lookup(f.receipt,f.receipt.token);
    const result={customerId:f.customer,lineId:f.line,username:f.username,resellerId:f.reseller,packageId:'77',connections:3,
      bouquetIds:[1,60,63],expiresAt:new Date(expectedChangedOrderExpiry(Date.parse(record.dispatchedAt),6)).toISOString(),enabled:true,adminEnabled:true,trial:false};
    for(const patch of [{connections:4},{bouquetIds:[1,60,63,100]},{packageId:'76'},{expiresAt:new Date(Date.parse(result.expiresAt)+7*86400000).toISOString()}])
      await assert.rejects(()=>f.ledger.verified(f.receipt,record,{...result,...patch},'53000000'),/reconciliation/);
    await assert.rejects(()=>f.ledger.verified(f.receipt,record,result,'52000000'),/reconciliation/);
    await assert.rejects(()=>worker.request(`delete from public.ks_crm_order_renewal_reseller_slots where operation_id=${literal(f.receipt.operationId)}`),/unresolved_renewal_remains_locked/);
    assert.equal((await f.summary()).completions,0);assert.equal((await f.summary()).slots,1);
  });
  await check('one verified changed-order purchase atomically saves service, catalog price and renewal date without inventing payment',async()=>{
    const f=await orderFixture(admin,worker),before=(await f.summary()).customer;
    assert.equal((await f.run()).state,'complete');assert.equal((await f.run()).state,'complete');assert.equal(f.state.calls,1);
    const s=await f.summary();assert.equal(s.completions,1);assert.equal(s.versions,1);assert.equal(s.slots,0);
    assert.equal(s.customer.connections_allowed,3);assert.equal(s.customer.package_name,'6 Months + 3 Connections');
    assert.equal(s.customer.monthly_price,25);assert.equal(s.customer.renewal_at,s.customer.expiration_at);
    for(const key of Object.keys(before).filter(k=>!['expiration_at','connections_allowed','package_name','monthly_price','renewal_at'].includes(k)))assert.deepEqual(s.customer[key],before[key],key);
  });
  await check('a personal account keeps zero customer revenue through a verified renewal',async()=>{
    const f=await orderFixture(admin,worker);
    await admin.request(`update public.iptv_customers set payment_status='personal',monthly_price=0 where id=${literal(f.customer)}`);
    const before=(await f.summary()).customer;assert.equal((await f.run()).state,'complete');
    const s=await f.summary();assert.equal(s.customer.monthly_price,0);assert.equal(s.customer.payment_status,'personal');
    assert.equal(s.customer.last_payment_at,before.last_payment_at);assert.equal(s.customer.renewal_at,s.customer.expiration_at);
    assert.equal(s.completions,1);assert.equal(f.state.calls,1);assert.equal(s.slots,0);
  });
  await check('retail persistence failure rolls back completion and recovers without another provider purchase',async()=>{
    const f=await orderFixture(admin,worker),before=(await f.summary()).customer;
    await admin.request('revoke update(monthly_price,renewal_at) on public.iptv_customers from service_role');
    try{await f.run();const s=await f.summary();assert.equal(s.state,'provider_verified');assert.equal(s.completions,0);assert.equal(s.slots,1);assert.deepEqual(s.customer,before);assert.equal(f.state.calls,1);}
    finally{await admin.request('grant update(monthly_price,renewal_at) on public.iptv_customers to service_role');}
    assert.equal((await f.run()).state,'complete');const s=await f.summary();assert.equal(s.customer.monthly_price,25);assert.equal(s.customer.renewal_at,s.customer.expiration_at);assert.equal(f.state.calls,1);
  });
  for(const fault of ['accepted_timeout','returned_mismatch','readback_mismatch','wrong_debit','wrong_account','carryover','short_term',
    'reserve_reply_lost','begin_reply_lost','verify_reply_lost','complete_not_saved','complete_reply_lost','deadline_after_commit','disabled_after_commit']){
    await check(`changed-order ${fault} never repeats a provider purchase`,async()=>{
      const f=await orderFixture(admin,worker,{fault}),before=(await f.summary()).customer;const first=await f.run();
      if(fault==='disabled_after_commit')await admin.request('update public.ks_crm_order_renewal_control set execution_enabled=true');
      f.state.now+=360001;const second=await f.run(),s=await f.summary();
      assert.ok(f.state.calls<=1);assert.ok(first.state!=='complete');
      if(['verify_reply_lost','complete_not_saved','complete_reply_lost'].includes(fault)){assert.equal(second.state,'complete');assert.equal(f.state.calls,1);assert.equal(s.completions,1);}
      else {assert.notEqual(second.state,'complete');assert.deepEqual(s.customer,before);if(!['reserve_reply_lost'].includes(fault))assert.equal(s.slots,1);}
    });
  }
  await check('CRM connection/package drift blocks all three field updates atomically',async()=>{
    for(const [column,value] of [['connections_allowed','5'],['package_name',"'Changed by administrator'"]]){
      const f=await orderFixture(admin,worker,{fault:'complete_not_saved'});assert.equal((await f.run()).state,'crm_pending');
      await admin.request(`update public.iptv_customers set ${column}=${value} where id=${literal(f.customer)}`);const before=(await f.summary()).customer;
      assert.equal((await f.run()).state,'crm_pending');const after=await f.summary();assert.deepEqual(after.customer,before);assert.equal(after.slots,1);assert.equal(after.completions,0);
    }
  });
  await check('real changed-order HTTP authenticates owner, exact request and four confirmations',async()=>{
    const f=await orderFixture(admin,worker),body={...confirmations,customerId:f.customer,months:6,connections:3};
    for(const user of [{email:'other@example.invalid'},{is_anonymous:true},{email_confirmed_at:null}]){f.state.user=user;assert.equal((await f.request('renewal-order-review',body)).code,403);}f.state.user={};
    assert.equal((await f.request('renewal-order-review',body,{origin:'https://other.invalid'})).code,403);
    assert.equal((await f.request('renewal-order-review',body,{authorization:''})).code,401);
    for(const patch of [{packageId:'77'},{costUnits:'0'},{months:'6'},{connections:0},...Object.keys(confirmations).map(key=>({[key]:false}))])assert.equal((await f.request('renewal-order-review',{...body,...patch})).code,400);
    assert.equal((await f.request('renewal-order-readiness',undefined,{}, {price:'15'})).code,400);assert.equal(f.state.calls,0);
    const reviewed=await f.request('renewal-order-review',body);assert.equal(reviewed.body.state,'review_ready');assert.equal(reviewed.body.review.costUnits,'15000000');
    const execute={...confirmations,customerId:f.customer,token:reviewed.body.review.token};
    assert.equal((await f.request('renewal-order-execute',execute)).body.state,'complete');assert.equal((await f.request('renewal-order-execute',execute)).body.state,'complete');assert.equal(f.state.calls,1);
    f.env.KS_CRM_ORDER_RENEWAL_ENABLED='false';assert.equal((await f.request('renewal-order-readiness')).body.state,'disabled');
    assert.equal((await f.request('renewal-order-status',{customerId:f.customer,token:execute.token})).body.state,'complete');
  });
  await check('old live/test execution cannot be used as changed-order authority',async()=>{
    for(const table of ['ks_crm_renewal_control','ks_crm_live_renewal_control']){
      const f=await orderFixture(admin,worker);await admin.request(`update public.${table} set execution_enabled=true`);
      try{assert.equal((await f.request('renewal-order-readiness')).body.state,'unavailable');await assert.rejects(()=>f.reserve(),/must_be_disabled/);assert.equal(f.state.calls,0);}
      finally{await admin.request(`update public.${table} set execution_enabled=false`);}
    }
    const f=await orderFixture(admin,worker);f.env.KS_CRM_LIVE_RENEWAL_CONSENT_KEY=f.env.KS_CRM_ORDER_RENEWAL_CONSENT_KEY;
    assert.equal((await f.request('renewal-order-readiness')).body.state,'unavailable');
  });
  await check('release is limited to one explicitly configured customer and only the reviewed order',async()=>{
    const f=await orderFixture(admin,worker);
    for(const scope of ['',randomUUID()]){f.env.KS_CRM_ORDER_RENEWAL_CUSTOMER_ID=scope;assert.equal((await f.request('renewal-order-readiness')).body.state,'disabled');}
    f.env.KS_CRM_ORDER_RENEWAL_CUSTOMER_ID=f.customer;
    assert.equal((await f.request('renewal-order-review',{...confirmations,customerId:f.customer,months:12,connections:3})).code,400);
    const input=await f.input();input.context.packages[1].name='12 Months + 3 Connections';input.context.packages[1].paid.count=12;input.requested.months=12;
    assert.throws(()=>buildOrderRenewalEvidence(input,f.state.now),/provider_policy_not_reviewed/);assert.equal(f.state.calls,0);
  });
  await check('changed-order HTTP rejects production, wrong project and altered consent without provider work',async()=>{
    const f=await orderFixture(admin,worker);
    f.env.VERCEL_ENV='production';assert.equal((await f.request('renewal-order-readiness')).code,404);f.env.VERCEL_ENV='preview';
    f.env.VITE_SUPABASE_URL='https://wrong-project.invalid';assert.equal((await f.request('renewal-order-readiness')).code,503);f.env.VITE_SUPABASE_URL=project;
    assert.equal((await f.request('renewal-order-execute',{...confirmations,customerId:f.customer,token:f.receipt.token+'x'})).body.state,'review_required');
    assert.equal(f.state.calls,0);assert.equal(f.state.snapshots,0);assert.equal((await f.summary()).state,null);
  });
  for(const protocol of ['preview','review','test','live'])for(const orderFirst of [false,true])await check(`five-way exclusion: ${protocol}, ${orderFirst?'changed-order first':'existing first'}`,async()=>{
    let other,reseller;
    if(['preview','review'].includes(protocol)){const setup=await setupFixture(admin);reseller=setup.reseller;if(protocol==='preview'){await prepareAttempt(admin,setup);other=setupBegin(setup);}else other=reserveReview(setup);}
    else if(protocol==='test'){await admin.request('update public.ks_crm_renewal_control set execution_enabled=true');const f=await renewalFixture(admin,worker);reseller=f.reseller;other=testBegin(f);await admin.request('update public.ks_crm_renewal_control set execution_enabled=false');}
    else{await admin.request('update public.ks_crm_live_renewal_control set execution_enabled=true');const f=await liveFixture(admin,worker);await f.reserve();reseller=f.reseller;other=liveBegin(f);await admin.request('update public.ks_crm_live_renewal_control set execution_enabled=false');}
    const f=await orderFixture(admin,worker,{reseller});await f.reserve();
    const oldGate=protocol==='test'?'ks_crm_renewal_control':protocol==='live'?'ks_crm_live_renewal_control':null;
    const runOther=async()=>{if(oldGate)await admin.request(`update public.${oldGate} set execution_enabled=true`);try{return await json(worker,other);}finally{if(oldGate)await admin.request(`update public.${oldGate} set execution_enabled=false`);}};
    if(orderFirst){assert.equal(await json(worker,orderBegin(f)),true);await assert.rejects(runOther,/reseller_reserved_for_other_work/);}
    else{assert.ok(await runOther());await assert.rejects(()=>json(worker,orderBegin(f)),/reseller_reserved_for_other_work/);}
  });
  const{runOrderUiChecks}=await import('./order-ui.mjs');await runOrderUiChecks({admin,worker,check,orderFixture});
  await admin.request('update public.ks_crm_order_renewal_control set execution_enabled=false');
}

export async function runOrderNativeChecks({admin,a,b,check,race}){
  await admin.request('update public.ks_crm_order_renewal_control set execution_enabled=true');
  try{
    for(const release of ['commit','rollback'])await check(`native changed-order same-attempt begin (${release})`,async()=>{
      const f=await orderFixture(admin,a);await f.reserve();assert.deepEqual(await race(orderBegin(f),orderBegin(f),release),[true,release==='rollback']);assert.equal((await f.summary()).versions,1);
    });
    await check('native changed-order distinct approvals cannot both use the same old line version',async()=>{
      const f=await orderFixture(admin,a);await f.reserve();const g=await orderFixture(admin,b,{base:f});await g.reserve();
      assert.deepEqual(await race(orderBegin(f),orderBegin(g)),[true,false]);assert.equal((await g.summary()).versions,0);
    });
    for(const release of ['commit','rollback'])await check(`native changed-order three-field completion is atomic (${release})`,async()=>{
      const f=await orderFixture(admin,a,{fault:'complete_not_saved'});assert.equal((await f.run()).state,'crm_pending');const record=await f.ledger.lookup(f.receipt,f.receipt.token);
      const call=expression('ks_crm_order_complete_renewal',{p_operation:f.receipt.operationId,p_claim:record.claimToken,p_current_expiry:f.state.line.expiresAt});
      const[first,second]=await race(call,call,release);assert.equal(first.replayed,false);assert.equal(second.replayed,release==='commit');
      const s=await f.summary();assert.equal(s.completions,1);assert.equal(s.slots,0);assert.equal(s.customer.connections_allowed,3);assert.equal(f.state.calls,1);
    });
    for(const protocol of ['preview','review'])for(const orderFirst of [true,false])await check(`native changed-order ${protocol} reservation contention (${orderFirst})`,async()=>{
      const setup=await setupFixture(admin);let other;if(protocol==='preview'){await prepareAttempt(admin,setup);other=setupBegin(setup);}else other=reserveReview(setup);
      const f=await orderFixture(admin,a,{reseller:setup.reseller});await f.reserve();const first=orderFirst?orderBegin(f):other,second=orderFirst?other:orderBegin(f);
      await a.request('begin');try{assert.ok(await json(a,first));await assert.rejects(()=>json(b,second),/reseller_reservation_busy/);await a.request('commit');}finally{await a.request('rollback');}
      await assert.rejects(()=>json(b,second),/reseller_reserved_for_other_work/);
    });
  }finally{await admin.request('update public.ks_crm_order_renewal_control set execution_enabled=false');}
}
