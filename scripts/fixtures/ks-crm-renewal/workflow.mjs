import assert from 'node:assert/strict';
import { createSimulatedCrmRenewal } from '../../../_server/ks-crm-renewal-simulation.js';
import { normalizeProviderLine } from '../../../_server/ks-roomba-line-snapshot.js';
import { json, literal } from '../ks-reviewed-handoff/fixtures.mjs';
import { renewalFixture, reserve, begin, verify, complete, stop, summary } from './scenarios.mjs';

// Fixtures only: database statements contain controlled synthetic IDs/values,
// escaped by literal(). There is no network or live provider implementation.
function workflow(worker,f,fault='') {
  const state={calls:0,balance:100,failed:false,raw:{status:'STATUS_SUCCESS',data:{id:f.line,username:f.username,
    member_id:f.reseller,package_id:'19',exp_date:String(Date.parse(f.old)/1000),max_connections:'1',
    is_trial:'0',enabled:'1',admin_enabled:'1',bouquet:'[2,13,18,40]'}}};
  const ledger={kind:'simulation',
    async reserve(operation,plan){
      assert.equal(operation,f.operation);assert.equal(plan.fingerprint,f.plan.fingerprint);
      const saved=await json(worker,reserve(f));
      const row=await json(worker,`(select jsonb_build_object('state',state,'expiry',result_expiry)
        from public.ks_proto_renewal_operations where operation_id=${literal(f.operation)})`);
      return {fresh:!saved.replayed,fingerprint:plan.fingerprint,record:{state:row.state,
        result:row.expiry?{...f.result,expiresAt:new Date(row.expiry).toISOString()}:null}};
    },
    async begin(){return json(worker,begin(f));},
    async stop(){await worker.request(`select ${stop(f)}`);},
    async verified(record,result){
      if(fault==='result_not_saved')throw Error('fictional storage failure');
      await json(worker,verify(f,{result,returned:result.expiresAt,balance:state.balance*1000000}));
      if(fault==='result_reply_lost'&&!state.failed){state.failed=true;throw Error('fictional lost verification reply');}
      record.state='provider_verified';record.result=result;
    },
    async complete(){assert.equal(await json(worker,`(select state from public.ks_proto_renewal_operations where operation_id=${literal(f.operation)})`),'complete');},
  };
  const provider={kind:'simulation',
    async snapshot(){return {line:normalizeProviderLine(state.raw),account:{id:f.reseller,credits:state.balance},
      packages:[{id:'19',name:'12 Months + 1 Connection',maxConnections:1,trial:null,
        paid:{count:12,unit:'months',credits:12},bouquets:Array.from({length:107},(_,i)=>i+1),issues:[]}],checkedAt:new Date().toISOString()};},
    async renew(){state.calls++;state.balance-=12;state.raw.data.exp_date=String(Date.parse(f.renewed)/1000);
      if(fault==='accepted_timeout')throw Error('fictional accepted timeout');return structuredClone(state.raw);},
    async read(){return structuredClone(state.raw);},async account(){return {id:f.reseller,credits:state.balance};},
  };
  const crm={kind:'simulation',
    async current(){return json(worker,`(select jsonb_build_object('id',id,'external_id',external_id,'username',username,'expiration_at',expiration_at)
      from public.iptv_customers where id=${literal(f.customer)})`);},
    async commit(){await json(worker,complete(f));
      if(fault==='completion_reply_lost'&&!state.failed){state.failed=true;throw Error('fictional lost completion reply');}},
  };
  const make=()=>createSimulatedCrmRenewal({ledger,provider,crm,now:()=>Date.now()});
  return {state,run:()=>make()({operationId:f.operation,plan:structuredClone(f.plan),preserveCurrentSelectionConfirmed:true})};
}

export async function runWorkflowChecks({admin,worker,check}) {
  for(const fault of ['', 'accepted_timeout','result_not_saved','result_reply_lost','completion_reply_lost']) {
    await check(`actual simulation worker uses durable SQL recovery (${fault||'success'})`,async()=>{
      const f=await renewalFixture(admin,worker,{reserveNow:false});
      // The first runner reservation returns the claim; subsequent calls reuse
      // that immutable binding. SQL owns all state and local completion writes.
      const w=workflow({async request(sql){
        const result=await worker.request(sql);
        if(!f.claim&&sql.includes('ks_proto_reserve_renewal'))f.claim=JSON.parse(result).claimToken;
        return result;
      }},f,fault);
      const first=await w.run(),second=await w.run();
      assert.equal(w.state.calls,1);assert.equal(w.state.balance,88);assert.deepEqual(JSON.parse(w.state.raw.data.bouquet),[2,13,18,40]);
      const saved=await summary(admin,f);
      if(['accepted_timeout','result_not_saved'].includes(fault)){
        assert.equal(first.state,'reconciliation_required');assert.equal(second.state,'reconciliation_required');
        assert.equal(saved.completions,0);assert.equal(saved.slots,1);assert.equal(Date.parse(saved.expiry),Date.parse(f.old));
      }else{
        assert.equal(second.state,'complete');assert.equal(saved.completions,1);assert.equal(saved.slots,0);
        assert.equal(Date.parse(saved.expiry),Date.parse(f.renewed));
        if(fault==='result_reply_lost')assert.equal(first.state,'reconciliation_required');
        else if(fault==='completion_reply_lost')assert.equal(first.state,'crm_pending');
        else assert.equal(first.state,'complete');
      }
    });
  }
}
