import assert from 'node:assert/strict';
import { httpFixture } from './http.mjs';
import { renewalFixture } from './scenarios.mjs';
import { json, literal } from '../ks-reviewed-handoff/fixtures.mjs';

// Only the hard-named disposable database is allowed. These fixtures adapt the
// actual HTTP handler to the unchanged installed SQL with synthetic identities.
export async function runHttpSqlChecks({ admin, worker, check }) {
  assert.equal(await json(admin, 'current_database()'), 'ks_disposable_crm_renewal_test');
  assert.equal(await json(worker, '(select execution_enabled from public.ks_crm_renewal_control)'), false);
  for (const lostReply of [false, true]) await check(`authenticated test-approval HTTP route uses disabled real SQL (${lostReply ? 'lost reply' : 'success'})`, async () => {
    const f = await renewalFixture(admin, worker, { reserveNow: false });
    let writes = 0;
    const fixture = httpFixture({ customer: { id: f.customer, external_id: Number(f.line), username: f.username, expiration_at: f.old },
      line: { id: f.line, username: f.username, resellerId: f.reseller, expiresAt: f.old }, account: { id: f.reseller },
      async storage({ table, columns, field, value }) {
        assert.ok(['ks_crm_renewal_control','ks_crm_renewal_approvals','ks_crm_renewal_operations','iptv_customers'].includes(table));
        assert.ok(['singleton','operation_id','id'].includes(field));
        assert.ok(columns.split(',').every(c => ['id','external_id','username','expiration_at','execution_enabled',
          'approval_id','operation_id','approver_id','customer_id','approval_hash','plan_fingerprint','state'].includes(c)));
        // psql prints SQL NULL as an empty field; return JSON null explicitly so
        // a missing row matches Supabase maybeSingle in both database runners.
        const result = await json(worker, `coalesce((select to_jsonb(selected) from (select ${columns} from public.${table} where ${field}=${typeof value === 'boolean' ? value : literal(value)}) selected),'null'::jsonb)`);
        return { data: result, error: null };
      },
      async persist(a) {
        writes++;
        const result = await json(worker, `public.ks_crm_reserve_renewal(${literal(a.p_operation)},${literal(a.p_approval)},
          ${literal(a.p_approver)},${literal(JSON.stringify(a.p_plan))}::jsonb,${literal(a.p_expires)}::timestamptz,${literal(a.p_approval_hash)})`);
        if (lostReply) throw Error('fictional lost SQL reply');
        return { data: result, error: null };
      },
    });
    const review = await fixture.review(); assert.equal(review.available, true);
    const first = await fixture.save(review); assert.equal(first.code, 200); assert.equal(first.body.replayed, lostReply);
    fixture.state.now += 60000;
    const second = await fixture.save(review); assert.equal(second.code, 200); assert.equal(second.body.replayed, true);
    assert.equal(first.body.operationId, second.body.operationId); assert.equal(writes, 1);
    const saved = await json(worker, `(select jsonb_build_object('groups',a.groups,'kind_state',o.state,'approver',a.approver_id,
      'approvals',(select count(*) from public.ks_crm_renewal_approvals where operation_id=o.operation_id),
      'slots',(select count(*) from public.ks_crm_renewal_reseller_slots where operation_id=o.operation_id),
      'versions',(select count(*) from public.ks_crm_renewal_line_versions where operation_id=o.operation_id),
      'completions',(select count(*) from public.ks_crm_renewal_completions where operation_id=o.operation_id))
      from public.ks_crm_renewal_operations o join public.ks_crm_renewal_approvals a using(approval_id)
      where o.operation_id=${literal(review.operationId)})`);
    assert.deepEqual(saved.groups, [2,13,18,40]); assert.equal(saved.kind_state, 'reserved'); assert.equal(saved.approver, fixture.state.user.id);
    assert.equal(saved.approvals, 1); assert.equal(saved.slots, 0); assert.equal(saved.versions, 0); assert.equal(saved.completions, 0);
    const expiry = await json(worker, `(select expiration_at from public.iptv_customers where id=${literal(f.customer)})`);
    assert.equal(Date.parse(expiry), Date.parse(f.old));
    assert.equal(await json(worker, '(select execution_enabled from public.ks_crm_renewal_control)'), false);
    await assert.rejects(() => worker.request('select public.ks_crm_begin_renewal(null,null)'), /renewal_execution_disabled/);
  });
}
