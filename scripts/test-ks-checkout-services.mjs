import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { bootstrap } from './fixtures/ks-reviewed-handoff/fixtures.mjs';
import { routingSupportSql, routingMigrationName } from './fixtures/ks-paid-order-routing.mjs';
import { createCustomerCrmHandler } from '../_server/ks-customer-crm.js';
import { readCheckoutServices } from '../_shared/ks-checkout-services.js';

const { PGlite }=await import(process.env.KS_PGLITE_MODULE||'@electric-sql/pglite');
const db=new PGlite(),owner=randomUUID(),other=randomUUID();let passed=0;
const query=async(sql,args=[])=> (await db.query(sql,args)).rows;
const env={VERCEL_ENV:process.env.KS_TEST_DEPLOYMENT_ENV||'production',VITE_SUPABASE_URL:'https://wftfxerblhlsxiijtfbo.supabase.co',VITE_SUPABASE_ANON_KEY:'fictional-anon',SUPABASE_SERVICE_ROLE_KEY:'fictional-service'};
const response=()=>({code:200,headers:{},body:null,setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(v){this.body=v;return this;}});
const request=(query={view:'checkout-services'})=>({method:'GET',headers:{authorization:'Bearer fictional-token'},query});
async function check(name,fn){await fn();passed++;console.log(`PASS: ${name}`);}
function handler({user=owner,failure=false,reply}={}){
  const calls=[];
  const createClient=(_url,key)=>key==='fictional-anon'?{auth:{getUser:async()=>({data:{user:{id:user,email:`${user}@example.invalid`,email_confirmed_at:'2026-01-01T00:00:00Z',is_anonymous:false}},error:null})}}
    :{rpc:async(name,args)=>{calls.push({name,args});assert.equal(name,'ks_checkout_services_snapshot');
      return failure?{data:null,error:{message:'fictional outage'}}:{data:reply??(await query('select public.ks_checkout_services_snapshot($1,$2,$3) as value',[args.p_user,args.p_email,args.p_after]))[0].value,error:null};}};
  return{calls,run:createCustomerCrmHandler({createClient,env,checkoutServices:true})};
}
try{
  await bootstrap({request:sql=>db.exec(sql)},{pglitePreflight:true});await db.exec(await routingSupportSql());
  for(const path of ['../supabase/migrations/20261025033932_add_private_live_checkout_intent_binding.sql',routingMigrationName.replace('../../','../'),'../supabase/migrations/20261025034741_add_verified_checkout_service_selection.sql']){
    await db.exec(await readFile(new URL(path,import.meta.url),'utf8'));
  }
  await db.exec(`insert into auth.users(id,email,email_confirmed_at,is_anonymous) values('${owner}','${owner}@example.invalid','2026-01-01T00:00:00Z',false),('${other}','${other}@example.invalid','2026-01-01T00:00:00Z',false);`);
  for(let n=0;n<54;n++){
    const id=randomUUID(),user=n===53?other:owner;
    await db.query("insert into public.iptv_customers(id,external_id,username,connections_allowed,source,trial,payment_status) values($1,$2,$3,3,$4,$5,'legacy_paid')",[id,950000+n,`fictional_service_${n}`,n===52?'roomba_preview_fixture':'roomba',n===51]);
    await db.query('insert into public.ks_crm_portal_links(customer_id,user_id,email_at_link,confirmed_at_link,external_id,linked_by) values($1,$2,$3,$4,$5,$2)',[id,user,`${user}@example.invalid`,'2026-01-01T00:00:00Z',950000+n]);
  }
  await db.exec('set role service_role');
  await check('owner listing reads only approved nontrial services and omits payment/line/credential fields',async()=>{
    const f=handler(),res=response();await f.run(request(),res);assert.equal(res.code,200);
    const page=readCheckoutServices(res.body,owner);assert.equal(page.services.length,50);assert.ok(page.nextCursor);
    for(const service of page.services){assert.deepEqual(Object.keys(service).sort(),['connections','customerId','expiresAt','username']);}
    assert.equal('payments' in res.body,false);assert.match(res.headers['Cache-Control'],/no-store/);assert.equal(res.headers.Vary,'Authorization');
  });
  await check('pagination returns every eligible service once with bounded pages and no foreign owner',async()=>{
    const seen=new Set();let after;do{const f=handler(),res=response();await f.run(request({view:'checkout-services',...(after?{afterId:after}:{})}),res);
      assert.equal(res.code,200);assert.ok(res.body.services.length<=50);for(const s of res.body.services){assert.ok(!seen.has(s.customerId));seen.add(s.customerId);}
      after=res.body.nextCursor;
    }while(after);assert.equal(seen.size,51);
    const f=handler({user:other}),res=response();await f.run(request(),res);assert.equal(res.body.services.length,1);assert.ok(!seen.has(res.body.services[0].customerId));
  });
  await check('caller-selected owners, invalid cursors, missing Auth and unsafe methods fail before reads',async()=>{
    for(const req of [request({view:'checkout-services',userId:other}),request({view:'checkout-services',afterId:'bad'}),{...request(),headers:{}},{...request(),method:'POST'}]){
      const f=handler(),res=response();await f.run(req,res);assert.ok([400,401,405].includes(res.code));assert.equal(f.calls.length,0);
    }
  });
  await check('stale confirmation identity removes services without falling back to email matching',async()=>{
    await db.exec(`reset role; update auth.users set email_confirmed_at='2026-01-02T00:00:00Z' where id='${owner}';set role service_role;`);
    const f=handler(),res=response();await f.run(request(),res);assert.equal(res.code,200);assert.deepEqual(res.body.services,[]);
    await db.exec(`reset role; update auth.users set email_confirmed_at='2026-01-01T00:00:00Z' where id='${owner}';set role service_role;`);
  });
  await check('database failures and foreign or malformed snapshots cannot return a successful empty list',async()=>{
    for(const options of [{failure:true},{reply:{accountId:other,checkedAt:new Date().toISOString(),services:[]}},{reply:{accountId:owner,checkedAt:'bad',services:[]}}]){
      const f=handler(options),res=response();await f.run(request(),res);assert.equal(res.code,503);assert.ok(!('services' in res.body));
    }
    const f=handler(),res=response();await f.run(request(),res);const bad=structuredClone(res.body);bad.services[1]=bad.services[0];assert.throws(()=>readCheckoutServices(bad,owner));
  });
  await check('database roles deny direct browser access and expose no new target-update privilege',async()=>{
    for(const role of ['anon','authenticated']){await db.exec(`reset role;set role ${role}`);await assert.rejects(()=>query('select public.ks_checkout_services_snapshot($1,$2,null)',[owner,`${owner}@example.invalid`]),/permission denied/);}
    await db.exec('reset role');
    const grants=(await query("select has_column_privilege('service_role','public.ks_live_checkout_requests','renewal_customer_id','UPDATE') as customer,has_column_privilege('service_role','public.ks_live_checkout_requests','renewal_external_id','UPDATE') as line"))[0];
    assert.deepEqual(grants,{customer:false,line:false});
  });
  console.log(`${passed} checkout service HTTP/SQL checks passed. All services are fictional; no project or provider was contacted.`);
}finally{await db.close();}
