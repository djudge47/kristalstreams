import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { json } from '../ks-reviewed-handoff/fixtures.mjs';
import { renewalFixture, begin, verify, complete, summary } from './scenarios.mjs';

// Test statements use a fixed namespace mapping, never customer text. The
// installation SQL itself is executed unchanged, under its real object names.
export const installationSql = sql => sql.replaceAll('ks_proto_', 'ks_crm_');

export async function installationPreflight({admin,source,check}) {
  for(const [alter,restore,reason,label] of [
    ['alter function public.ks_guard_reseller_reservation_exclusion() stable',
      'alter function public.ks_guard_reseller_reservation_exclusion() volatile',
      /reviewed_reseller_guard_required/,'unreviewed shared-guard change'],
    ['alter table public.ks_preview_reseller_dispatches disable trigger ks_reseller_reservation_exclusion',
      'alter table public.ks_preview_reseller_dispatches enable trigger ks_reseller_reservation_exclusion',
      /reviewed_reseller_triggers_required/,'disabled existing exclusion trigger'],
    ['alter table public.iptv_customers rename column external_id to fictional_renamed_external_id',
      'alter table public.iptv_customers rename column fictional_renamed_external_id to external_id',
      /reviewed_renewal_columns_required/,'changed customer identity column'],
  ])await check(`installation rejects ${label} before creating objects`,async()=>{
    await admin.request(alter);
    try{await assert.rejects(()=>admin.request(source),reason);await admin.request('rollback');
      assert.equal(await json(admin,"to_regclass('public.ks_crm_renewal_control') is null"),true);
    }finally{await admin.request('rollback');await admin.request(restore);}
  });
}

export async function installationDisabledChecks({admin,worker,check}) {
  await check('installation seeds exactly one disabled switch and no operation, reservation or completion',async()=>{
    assert.equal(await json(admin,'(select count(*) from public.ks_crm_renewal_control)'),1);
    assert.equal(await json(worker,'(select execution_enabled from public.ks_crm_renewal_control)'),false);
    for(const table of ['operations','line_versions','reseller_slots','completions'])
      assert.equal(await json(admin,`(select count(*) from public.ks_crm_renewal_${table})`),0);
  });
  await check('the exact read-only post-install verification confirms privileges, shared exclusion and empty disabled state',async()=>{
    const sql=await readFile(new URL('../../ks-crm-renewal-installation-verify.sql',import.meta.url),'utf8');
    const query=sql.slice(sql.indexOf('select')).trim().replace(/;$/,'');
    const result=await json(admin,`(select to_jsonb(verified) from (${query}) verified)`);
    assert.deepEqual(result,{execution_disabled:true,service_cannot_enable_execution:true,
      private_rls_tables:true,private_invoker_functions:true,shared_exclusion_attached:true,no_new_work:true});
  });
  await check('service role cannot enable or delete the execution switch',async()=>{
    await assert.rejects(()=>worker.request('update public.ks_crm_renewal_control set execution_enabled=true'),/permission denied/);
    await assert.rejects(()=>worker.request('delete from public.ks_crm_renewal_control'),/permission denied/);
    assert.equal(await json(worker,'(select execution_enabled from public.ks_crm_renewal_control)'),false);
  });
  await check('disabled execution blocks begin, result recording and CRM completion before touching records',async()=>{
    for(const call of ["ks_crm_begin_renewal(null,null)","ks_crm_verify_renewal(null,null,null,null,null)","ks_crm_complete_renewal(null,null,null)"])
      await assert.rejects(()=>worker.request(`select public.${call}`),/renewal_execution_disabled/);
    assert.equal(await json(admin,'(select count(*) from public.ks_crm_renewal_operations)'),0);
  });
  // Only the owner of this explicitly named disposable DB can turn on the
  // isolated behavioral tests. This statement is never installation SQL.
  assert.equal(await json(admin,'current_database()'),'ks_disposable_crm_renewal_test');
  await admin.request('update public.ks_crm_renewal_control set execution_enabled=true');
}

export async function installationStopCheck({admin,worker,check}) {
  await check('disabling execution retains an existing verified result and reservation without completing CRM',async()=>{
    const f=await renewalFixture(admin,worker);await json(worker,begin(f));await json(worker,verify(f));
    const before=await summary(admin,f);
    assert.equal(await json(admin,'current_database()'),'ks_disposable_crm_renewal_test');
    await admin.request('update public.ks_crm_renewal_control set execution_enabled=false');
    await assert.rejects(()=>json(worker,complete(f)),/renewal_execution_disabled/);
    assert.deepEqual(await summary(admin,f),before);
    assert.equal(await json(worker,'(select execution_enabled from public.ks_crm_renewal_control)'),false);
  });
}
