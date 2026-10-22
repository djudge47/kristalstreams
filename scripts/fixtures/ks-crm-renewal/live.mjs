import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createLiveRenewalConsent } from '../../../_server/ks-crm-renewal-live-consent.js';
import { createLiveRenewalLedger } from '../../../_server/ks-crm-renewal-live-ledger.js';
import { createLiveRenewalExecutor } from '../../../_server/ks-crm-renewal-live-execution.js';
import { buildLiveRenewalEvidence } from '../../../_server/ks-crm-renewal-live-plan.js';
import { createRoombaCrmRoute } from '../../../_server/ks-roomba-crm-route.js';
import { adminId, json, literal, fixture as setupFixture, prepareAttempt, reserveReview, begin as setupBegin } from '../ks-reviewed-handoff/fixtures.mjs';
import { renewalFixture, begin as testBegin } from './scenarios.mjs';

const project = 'https://wftfxerblhlsxiijtfbo.supabase.co';
// This parameter-to-SQL bridge is fixtures only. Runtime uses parameterized
// Supabase RPC; no SQL strings or arbitrary function names come from a client.
const rpcArguments = {
  ks_crm_live_lookup_renewal: ['p_operation','p_approval','p_approver','p_customer','p_fingerprint','p_approval_hash'],
  ks_crm_live_reserve_renewal: ['p_operation','p_approval','p_approver','p_plan','p_expires','p_approval_hash'],
  ks_crm_live_begin_renewal: ['p_operation','p_claim'],
  ks_crm_live_stop_renewal: ['p_operation','p_claim'],
  ks_crm_live_verify_renewal: ['p_operation','p_claim','p_result','p_returned_expiry','p_balance'],
  ks_crm_live_complete_renewal: ['p_operation','p_claim','p_current_expiry'],
};
const expression = (name, args) => {
  const keys = rpcArguments[name]; assert.ok(keys); assert.deepEqual(Object.keys(args).sort(), [...keys].sort());
  return `public.${name}(${keys.map(key => key === 'p_plan' || key === 'p_result'
    ? `${literal(JSON.stringify(args[key]))}::jsonb` : literal(args[key])).join(',')})`;
};
export const liveBegin = f => expression('ks_crm_live_begin_renewal', { p_operation: f.receipt.operationId, p_claim: f.record.claimToken });

export async function liveFixture(admin, worker, { fault = '', base } = {}) {
  const f = base || await renewalFixture(admin, worker, { reserveNow: false });
  const state = { now: Date.now(), calls: 0, reads: 0, snapshots: 0, failed: false, balance: 100, gateReads: 0,
    line: { id: f.line, username: f.username, resellerId: f.reseller, packageId: '19', expiresAt: new Date(f.old).toISOString(),
      connections: 1, trial: false, enabled: true, adminEnabled: true, bouquetIds: [2,13,18,40] } };
  const customer = () => ({ id: f.customer, external_id: Number(f.line), username: f.username, expiration_at: f.old });
  const context = () => ({ line: structuredClone(state.line), account: { id: f.reseller, credits: state.balance },
    packages: [{ id: '19', name: '12 Months + 1 Connection', maxConnections: 1, trial: null,
      paid: { count: 12, unit: 'months', credits: 12 }, bouquets: Array.from({ length: 107 }, (_, i) => i + 1), issues: [] }],
    checkedAt: new Date(state.now).toISOString() });
  const key = randomBytes(32);
  const consent = createLiveRenewalConsent({ key, now: () => state.now });
  const consentInput = () => ({ actorId: adminId, customer: customer(), context: context(),
    preserveCurrentSelectionConfirmed: true, creditSpendConfirmed: true });
  const receipt = consent.issue(consentInput());
  const args = { token: receipt.token, actorId: adminId, customerId: f.customer,
    preserveCurrentSelectionConfirmed: true, creditSpendConfirmed: true };
  const captured = [];
  const client = { supabaseUrl: project,
    from(table) {
      assert.ok(['ks_crm_live_renewal_control','ks_crm_renewal_control','iptv_customers'].includes(table));
      let selected, field, match;
      return {
      select(columns) { selected = columns; assert.equal(columns, table === 'iptv_customers' ? 'id,external_id,username,expiration_at' : 'execution_enabled'); return this; },
      eq(key, value) { field = key; match = value; assert.equal(key, table === 'iptv_customers' ? 'id' : 'singleton'); return this; },
      async maybeSingle() {
        if (table === 'iptv_customers') return { data: await json(worker, `coalesce((select to_jsonb(selected)
          from (select ${selected} from public.iptv_customers where ${field}=${literal(match)}) selected),'null'::jsonb)`), error: null };
        assert.equal(match, true);
        state.gateReads++;
        if (fault === 'gate_read_failure') throw Error('fictional gate read lost');
        const enabled = await json(worker, `(select execution_enabled from public.${table})`);
        return { data: { execution_enabled: enabled }, error: null };
      } }; },
    async rpc(name, params) {
      captured.push({ name, params: structuredClone(params) });
      const at = name.replace('ks_crm_live_', '').replace('_renewal', '');
      if (fault === `${at}_not_saved` && !state.failed) { state.failed = true; throw Error('fictional storage failure'); }
      if (at === 'lookup' && fault === 'lookup_failure') throw Error('fictional lookup failure');
      if (at === 'complete' && fault === 'crm_changed') await admin.request(`update public.iptv_customers
        set expiration_at=${literal(f.renewed)} where id=${literal(f.customer)}`);
      const data = await json(worker, `coalesce(to_jsonb(${expression(name, params)}),'null'::jsonb)`);
      if (fault === `${at}_reply_lost` && !state.failed) { state.failed = true; throw Error('fictional reply lost'); }
      if (at === 'begin') {
        if (fault === 'deadline_after_commit') state.now += 31000;
        if (fault === 'disabled_after_commit') await admin.request('update public.ks_crm_live_renewal_control set execution_enabled=false');
      }
      return { data, error: null };
    },
  };
  const ledger = createLiveRenewalLedger({ client, projectUrl: project });
  const provider = {
    async snapshot() { state.snapshots++; return context(); },
    async renew(lineId, form) {
      assert.equal(lineId, f.line);
      assert.deepEqual([...form], [['trial','0'],['package','19'],['package_duration','12 months'],['max_connections','1'],
        ['bouquets_selected[]','2'],['bouquets_selected[]','13'],['bouquets_selected[]','18'],['bouquets_selected[]','40']]);
      state.calls++; state.balance -= 12; state.line.expiresAt = f.renewed;
      if (fault === 'accepted_timeout') throw Error('fictional accepted timeout');
      const line = structuredClone(state.line);
      if (fault === 'returned_mismatch') line.connections = 2;
      return line;
    },
    async read() { state.reads++; const line = structuredClone(state.line);
      if (fault === 'readback_mismatch') line.bouquetIds = [2]; return line; },
    async account() { return { id: fault === 'wrong_account' ? '999999' : f.reseller,
      credits: fault === 'wrong_debit' ? 87 : state.balance }; },
  };
  const crm = { async current() { return json(worker, `(select jsonb_build_object('id',id,'external_id',external_id,
    'username',username,'expiration_at',expiration_at) from public.iptv_customers where id=${literal(f.customer)})`); } };
  // Every invocation recreates the worker. Its process memory is not recovery
  // authority; only durable SQL and the original signed identity survive.
  const env = { VERCEL_ENV: 'preview', VITE_SUPABASE_URL: project, VITE_SUPABASE_ANON_KEY: 'fictional-anon',
    SUPABASE_SERVICE_ROLE_KEY: 'fictional-service', ROOMBA_PREVIEW_SECRET: 'fictional-test-secret-not-the-live-signing-key',
    KS_CRM_LIVE_RENEWAL_ENABLED: 'true', KS_CRM_LIVE_RENEWAL_CONSENT_KEY: key.toString('hex') };
  const handler = createRoombaCrmRoute({ env, now: () => state.now,
    createClient(url, accessKey) {
      assert.equal(url, project);
      if (accessKey === env.VITE_SUPABASE_ANON_KEY) return { auth: { async getUser(token) {
        assert.equal(token, 'fictional-admin'); return { data: { user: { id: adminId, email: 'djudge47@gmail.com', email_confirmed_at: new Date().toISOString(), ...state.user } }, error: null };
      } } };
      assert.equal(accessKey, env.SUPABASE_SERVICE_ROLE_KEY); return client;
    }, liveProviderFactory: () => provider });
  const request = async (view, body, headers = {}) => {
    const res = { headers: {}, setHeader(k,v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(data) { this.body = data; return this; } };
    await handler({ method: body ? 'POST' : 'GET', query: { view, ...(!body ? { customerId: f.customer } : {}) }, body,
      headers: { authorization: 'Bearer fictional-admin', origin: 'https://fictional.example.invalid', host: 'fictional.example.invalid', 'content-type': 'application/json', ...headers } }, res);
    assert.equal(res.headers['Cache-Control'], 'private, no-store');
    for (const secret of [env.SUPABASE_SERVICE_ROLE_KEY,env.KS_CRM_LIVE_RENEWAL_CONSENT_KEY,'claimToken','fingerprint','p_approval_hash'].filter(Boolean)) assert.ok(!JSON.stringify(res.body).includes(secret));
    return res;
  };
  return { ...f, receipt, args, client, ledger, consent, provider, crm, state, captured, env, request,
    input: consentInput,
    async reserve() {
      const { plan } = buildLiveRenewalEvidence(consentInput(), state.now);
      this.record = await ledger.reserve(receipt, receipt.token, plan, new Date(state.now + 30000).toISOString());
      return this.record;
    },
    run(patch = {}) { return createLiveRenewalExecutor({ consent, ledger, provider, crm, now: () => state.now })({ ...args, ...patch }); },
    summary() { return json(admin, `jsonb_build_object(
      'state',(select state from public.ks_crm_live_renewal_operations where operation_id=${literal(receipt.operationId)}),
      'versions',(select count(*) from public.ks_crm_live_renewal_line_versions where operation_id=${literal(receipt.operationId)}),
      'slots',(select count(*) from public.ks_crm_live_renewal_reseller_slots where operation_id=${literal(receipt.operationId)}),
      'completions',(select count(*) from public.ks_crm_live_renewal_completions where operation_id=${literal(receipt.operationId)}),
      'expiry',(select expiration_at from public.iptv_customers where id=${literal(f.customer)}))`); },
  };
}

export async function runLiveChecks({ admin, worker, check }) {
  assert.equal(await json(admin, 'current_database()'), 'ks_disposable_crm_renewal_test');
  const old = await json(admin, '(select jsonb_agg(to_jsonb(a) order by approval_id) from public.ks_crm_renewal_approvals a)');
  const source = await readFile(new URL('./live.sql', import.meta.url), 'utf8');
  await check('live draft refuses a changed installed guard and rolls back before creating objects', async () => {
    await admin.request('alter function public.ks_guard_reseller_reservation_exclusion() stable');
    try { await assert.rejects(() => admin.request(source), /reviewed_three_protocol_guard_required/); await admin.request('rollback');
      assert.equal(await json(admin, "to_regclass('public.ks_crm_live_renewal_control') is null"), true);
    } finally { await admin.request('rollback'); await admin.request('alter function public.ks_guard_reseller_reservation_exclusion() volatile'); }
  });
  await admin.request(source);
  await check('new live namespace is private, starts disabled and preserves every installed test approval', async () => {
    assert.equal(await json(worker, '(select execution_enabled from public.ks_crm_live_renewal_control)'), false);
    assert.equal(await json(worker, '(select execution_enabled from public.ks_crm_renewal_control)'), false);
    assert.deepEqual(await json(admin, '(select jsonb_agg(to_jsonb(a) order by approval_id) from public.ks_crm_renewal_approvals a)'), old);
    assert.equal(await json(admin, '(select count(*) from public.ks_crm_live_renewal_operations)'), 0);
    for (const role of ['anon','authenticated']) {
      const rows = await json(admin, `(select jsonb_agg(jsonb_build_object('rls',c.relrowsecurity,
        'read',has_table_privilege(${literal(role)},c.oid,'select'),'write',has_table_privilege(${literal(role)},c.oid,'insert')))
        from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname like 'ks_crm_live_renewal_%' and c.relkind='r')`);
      assert.equal(rows.length, 6); for (const row of rows) assert.deepEqual(row, { rls: true, read: false, write: false });
      const functions = await json(admin, `(select jsonb_agg(jsonb_build_object('definer',prosecdef,'config',proconfig,
        'execute',has_function_privilege(${literal(role)},p.oid,'execute'))) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
        where n.nspname='public' and p.proname like 'ks_crm_live_%renewal%')`);
      for (const fn of functions) { assert.equal(fn.definer, false); assert.equal(fn.execute, false); assert.ok(fn.config.includes('search_path=""')); }
    }
    await assert.rejects(() => worker.request('update public.ks_crm_live_renewal_control set execution_enabled=true'), /permission denied/);
  });
  await check('disabled gate blocks worker and every live mutation before provider reads or new work', async () => {
    const f = await liveFixture(admin, worker); assert.equal((await f.run()).state, 'disabled');
    assert.equal(f.state.snapshots, 0); assert.equal(f.state.calls, 0); assert.equal(f.captured.length, 0);
    for (const call of ['reserve_renewal(null,null,null,null,null,null)','begin_renewal(null,null)',
      'verify_renewal(null,null,null,null,null)','complete_renewal(null,null,null)'])
      await assert.rejects(() => worker.request(`select public.ks_crm_live_${call}`), /renewal_execution_disabled/);
  });
  // ONLY this explicitly named disposable database is enabled for fake-provider tests.
  await admin.request('update public.ks_crm_live_renewal_control set execution_enabled=true');
  await check('expired signed identity permits lookup only, never a new reservation, provider read or dispatch', async () => {
    const f = await liveFixture(admin, worker); f.state.now += 360000;
    assert.equal(f.consent.identify(f.receipt.token, f.args).mayDispatch, false);
    assert.throws(() => f.consent.verify(f.receipt.token, f.input()));
    assert.equal((await f.run()).state, 'review_required'); assert.equal(f.state.snapshots, 0);
    assert.equal((await f.summary()).state, null); assert.equal(f.state.calls, 0);
  });
  await check('tampered, test-purpose and different-actor/customer tokens stop before ledger access', async () => {
    const f = await liveFixture(admin, worker);
    for (const patch of [{ token: f.receipt.token + 'x' },{ actorId: randomUUID() },{ customerId: randomUUID() },{ token: 'test-review.token' }])
      assert.equal((await f.run(patch)).state, 'review_required');
    assert.equal(f.captured.length, 0); assert.equal(f.state.gateReads, 0);
    for (const patch of [{ preserveCurrentSelectionConfirmed: false },{ creditSpendConfirmed: false }]) assert.equal((await f.run(patch)).state, 'review_required');
    assert.equal(f.state.snapshots, 0);
  });
  await check('installed simulation plan cannot reserve a live attempt even with live execution enabled', async () => {
    const f = await liveFixture(admin, worker);
    await assert.rejects(() => json(worker, expression('ks_crm_live_reserve_renewal', { p_operation: f.receipt.operationId,
      p_approval: f.receipt.consentId, p_approver: adminId, p_plan: f.plan, p_expires: f.expires, p_approval_hash: f.hash })), /purpose_separated_live_renewal_plan_required/);
    assert.equal((await f.summary()).state, null);
    assert.throws(() => createLiveRenewalLedger({ client: f.client, projectUrl: 'https://other.supabase.co' }));
  });
  await check('lookup enforces every immutable binding and never returns a test-ledger operation', async () => {
    const f = await liveFixture(admin, worker); await f.reserve();
    for (const key of ['consentId','actorId','customerId','fingerprint']) {
      const value = key === 'fingerprint' ? 'f'.repeat(64) : randomUUID();
      await assert.rejects(() => f.ledger.lookup({ ...f.receipt, [key]: value }, f.receipt.token));
    }
    await assert.rejects(() => f.ledger.lookup(f.receipt, f.receipt.token + 'x'));
    const test = await renewalFixture(admin, worker);
    const different = { ...f.receipt, operationId: test.operation };
    assert.equal(await f.ledger.lookup(different, f.receipt.token), null);
  });
  await check('live approval, consumed version and completion evidence cannot be rewritten by the service worker', async () => {
    const f = await liveFixture(admin, worker); await f.run();
    for (const sql of [
      `update public.ks_crm_live_renewal_approvals set username='changed' where approval_id=${literal(f.receipt.consentId)}`,
      `delete from public.ks_crm_live_renewal_line_versions where operation_id=${literal(f.receipt.operationId)}`,
      `delete from public.ks_crm_live_renewal_completions where operation_id=${literal(f.receipt.operationId)}`,
    ]) await assert.rejects(() => worker.request(sql), /permission denied|renewal_evidence_is_immutable/);
    assert.equal((await f.summary()).completions, 1);
  });
  await check('live begin rejects wrong claims and non-read-committed isolation without consuming a line version', async () => {
    const f = await liveFixture(admin, worker); await f.reserve();
    await assert.rejects(() => json(worker, expression('ks_crm_live_begin_renewal', { p_operation: f.receipt.operationId, p_claim: randomUUID() })), /renewal_claim_required/);
    for (const isolation of ['repeatable read','serializable','read uncommitted']) {
      await worker.request(`begin isolation level ${isolation}`);
      try { await assert.rejects(() => json(worker, liveBegin(f)), /renewal_read_committed_required/); }
      finally { await worker.request('rollback'); }
    }
    assert.equal((await f.summary()).versions, 0);
  });
  await check('expired approval at live commit rolls back the decision and both reservations', async () => {
    const f = await liveFixture(admin, worker); await f.reserve();
    await admin.request(`alter table public.ks_crm_live_renewal_approvals disable trigger ks_crm_live_renewal_approval_immutable;
      update public.ks_crm_live_renewal_approvals set expires_at=clock_timestamp()+interval '1 second' where approval_id=${literal(f.receipt.consentId)};
      alter table public.ks_crm_live_renewal_approvals enable trigger ks_crm_live_renewal_approval_immutable`);
    await worker.request('begin');
    try { assert.equal(await json(worker, liveBegin(f)), true); await worker.request('select pg_sleep(1.1)');
      await assert.rejects(() => worker.request('commit'), /fresh_renewal_approval_required/);
    } finally { await worker.request('rollback'); }
    const row = await f.summary(); assert.equal(row.state, 'reserved'); assert.equal(row.slots, 0); assert.equal(row.versions, 0);
  });
  await check('live SQL rejects extra result fields, changed groups, mismatched expiry or debit before recording verification', async () => {
    const f = await liveFixture(admin, worker); await f.reserve(); await json(worker, liveBegin(f));
    for (const patch of [{ p_result: { ...f.result, unexpected: true } },{ p_result: { ...f.result, bouquetIds: [2] } },
      { p_returned_expiry: f.old },{ p_balance: '87000000' }]) {
      const args = { p_operation: f.receipt.operationId, p_claim: f.record.claimToken,
        p_result: f.result, p_returned_expiry: f.renewed, p_balance: '88000000', ...patch };
      await assert.rejects(() => json(worker, expression('ks_crm_live_verify_renewal', args)), /renewal_result_requires_reconciliation/);
    }
    assert.equal((await f.summary()).state, 'dispatching'); assert.equal((await f.summary()).slots, 1);
  });
  for (const fault of ['', 'gate_read_failure','lookup_failure','reserve_not_saved','reserve_reply_lost','begin_not_saved',
    'begin_reply_lost','deadline_after_commit','disabled_after_commit','accepted_timeout','returned_mismatch','readback_mismatch',
    'wrong_account','wrong_debit','verify_not_saved','verify_reply_lost','complete_not_saved','complete_reply_lost','crm_changed']) {
    await check(`protected executor uses durable recovery without a second provider send (${fault || 'success'})`, async () => {
      const f = await liveFixture(admin, worker, { fault });
      const before = await json(admin, `(select to_jsonb(c)-'expiration_at' from public.iptv_customers c where id=${literal(f.customer)})`);
      const first = await f.run();
      // A replacement process can read the same attempt after consent expires.
      f.state.now += 360000;
      const second = await f.run();
      const saved = await f.summary();
      const noDispatch = ['gate_read_failure','lookup_failure','reserve_not_saved','reserve_reply_lost','begin_not_saved',
        'begin_reply_lost','deadline_after_commit','disabled_after_commit'].includes(fault);
      assert.equal(f.state.calls, noDispatch ? 0 : 1);
      assert.equal(f.state.balance, noDispatch ? 100 : 88);
      const successful = ['', 'verify_reply_lost','complete_not_saved','complete_reply_lost'].includes(fault);
      assert.equal(saved.completions, successful ? 1 : 0);
      if (successful) { assert.equal(second.state, 'complete'); assert.equal(saved.slots, 0); assert.equal(Date.parse(saved.expiry), Date.parse(f.renewed)); }
      else if (!noDispatch) { assert.equal(saved.slots, 1); assert.ok(['reconciliation_required','provider_verified'].includes(saved.state)); }
      if (fault === 'begin_reply_lost') { assert.equal(first.state, 'check_status'); assert.equal(saved.state, 'dispatching'); assert.equal(saved.slots, 1); }
      if (fault === 'reserve_reply_lost' || fault === 'begin_not_saved') { assert.equal(saved.state, 'reserved'); assert.equal(saved.versions, 0); }
      if (fault === 'verify_reply_lost') assert.equal(first.state, 'reconciliation_required');
      if (fault === 'complete_reply_lost') { assert.equal(first.state, 'crm_pending'); assert.equal(f.state.reads, 2); }
      if (fault === 'disabled_after_commit') await admin.request('update public.ks_crm_live_renewal_control set execution_enabled=true');
      if (!successful && fault !== 'crm_changed') assert.equal(Date.parse(saved.expiry), Date.parse(f.old));
      const after = await json(admin, `(select to_jsonb(c)-'expiration_at' from public.iptv_customers c where id=${literal(f.customer)})`);
      assert.deepEqual(after, before);
      for (const body of [first,second]) assert.deepEqual(Object.keys(body).sort(), ['mayDispatch','operationId','replayed','state']);
    });
  }
  await check('replayed reserve race never begins, stops another worker or dispatches', async () => {
    const f = await liveFixture(admin, worker); await f.reserve();
    // Hide the first lookup to model a competing reservation committed after it.
    const lookup = f.ledger.lookup;
    const ledger = { ...f.ledger, lookup: async () => null };
    const run = createLiveRenewalExecutor({ consent: f.consent, ledger, provider: f.provider, crm: f.crm, now: () => f.state.now });
    assert.equal((await run(f.args)).state, 'check_status'); assert.equal(f.state.calls, 0);
    assert.equal((await f.summary()).state, 'reserved'); assert.equal(f.captured.some(r => r.name.endsWith('begin_renewal') || r.name.endsWith('stop_renewal')), false);
    assert.equal((await lookup(f.receipt, f.receipt.token)).state, 'reserved');
  });
  await check('uncertain live attempt blocks a new consent for the same line, retaining the first reservation', async () => {
    const f = await liveFixture(admin, worker, { fault: 'accepted_timeout' }); await f.run();
    const g = await liveFixture(admin, worker, { base: f });
    assert.equal((await g.run()).state, 'reconciliation_required'); assert.equal(g.state.calls, 0);
    assert.equal((await f.summary()).slots, 1); assert.equal((await g.summary()).versions, 0);
    await assert.rejects(() => worker.request(`delete from public.ks_crm_live_renewal_reseller_slots where operation_id=${literal(f.receipt.operationId)}`), /unresolved_renewal_remains_locked/);
  });
  await check('live renewal exclusion preserves both directions with installed tests and existing paid setup', async () => {
    await admin.request('update public.ks_crm_renewal_control set execution_enabled=true');
    try {
      for (const liveFirst of [true,false]) {
        const f = await liveFixture(admin, worker); await f.reserve();
        const test = await renewalFixture(admin, worker, { reseller: f.reseller });
        const first = liveFirst ? liveBegin(f) : testBegin(test), second = liveFirst ? testBegin(test) : liveBegin(f);
        assert.equal(await json(worker, first), true); await assert.rejects(() => json(worker, second), /reseller_reserved_for_other_work/);
        const oldSetup = await setupFixture(admin); await prepareAttempt(admin, oldSetup);
        const g = await liveFixture(admin, worker, { base: await renewalFixture(admin, worker, { reseller: oldSetup.reseller, reserveNow: false }) }); await g.reserve();
        const setupFirst = liveFirst ? liveBegin(g) : setupBegin(oldSetup), setupSecond = liveFirst ? setupBegin(oldSetup) : liveBegin(g);
        assert.equal(await json(worker, setupFirst), true); await assert.rejects(() => json(worker, setupSecond), /reseller_reserved_for_other_work/);
        const review = await setupFixture(admin);
        const h = await liveFixture(admin, worker, { base: await renewalFixture(admin, worker, { reseller: review.reseller, reserveNow: false }) }); await h.reserve();
        if (liveFirst) { assert.equal(await json(worker, liveBegin(h)), true); await assert.rejects(() => json(worker, reserveReview(review)), /reseller_reserved_for_other_work/); }
        else { await json(worker, reserveReview(review)); await assert.rejects(() => json(worker, liveBegin(h)), /reseller_reserved_for_other_work/); }
      }
    } finally { await admin.request('update public.ks_crm_renewal_control set execution_enabled=false'); }
  });
  await check('a verified result cannot complete while disabled or after readback drift and remains recoverable without another send', async () => {
    const f = await liveFixture(admin, worker, { fault: 'complete_not_saved' });
    assert.equal((await f.run()).state, 'crm_pending'); assert.equal((await f.summary()).state, 'provider_verified');
    f.state.now += 360000; f.state.line.connections = 2;
    assert.equal((await f.run()).state, 'crm_pending'); assert.equal((await f.summary()).slots, 1);
    f.state.line.connections = 1;
    await admin.request('update public.ks_crm_live_renewal_control set execution_enabled=false');
    assert.equal((await f.run()).state, 'disabled'); assert.equal((await f.summary()).completions, 0);
    await admin.request('update public.ks_crm_live_renewal_control set execution_enabled=true');
    assert.equal((await f.run()).state, 'complete'); assert.equal(f.state.calls, 1);
  });
  await runLiveHttpSqlChecks({ admin, worker, check });
  await admin.request('update public.ks_crm_live_renewal_control set execution_enabled=false');
  assert.equal(await json(worker, '(select execution_enabled from public.ks_crm_renewal_control)'), false);
}

async function runLiveHttpSqlChecks({ admin, worker, check }) {
  await check('real authenticated live HTTP route reviews, executes and replays through durable SQL once', async () => {
    const f = await liveFixture(admin, worker);
    assert.equal((await f.request('renewal-live-readiness')).body.state, 'ready_for_review');
    const reviewed = await f.request('renewal-live-review', { customerId: f.customer, preserveCurrentSelectionConfirmed: true, creditSpendConfirmed: true });
    assert.equal(reviewed.code, 200); assert.equal(reviewed.body.state, 'review_ready');
    assert.deepEqual(reviewed.body.review.currentGroupIds, [2,13,18,40]); assert.equal(reviewed.body.review.costUnits, '12000000');
    assert.equal(f.captured.some(r => r.name.endsWith('reserve_renewal')), false);
    const body = { customerId: f.customer, token: reviewed.body.review.token, preserveCurrentSelectionConfirmed: true, creditSpendConfirmed: true };
    assert.equal((await f.request('renewal-live-execute', body)).body.state, 'complete');
    f.state.now += 360000;
    assert.equal((await f.request('renewal-live-execute', body)).body.state, 'complete'); assert.equal(f.state.calls, 1);
    await admin.request('update public.ks_crm_live_renewal_control set execution_enabled=false');
    try {
      const status = await f.request('renewal-live-status', { customerId: f.customer, token: body.token });
      assert.equal(status.body.state, 'complete'); assert.equal(status.body.canStartNewReview, false);
      assert.equal((await f.request('renewal-live-execute', body)).body.state, 'disabled');
    } finally { await admin.request('update public.ks_crm_live_renewal_control set execution_enabled=true'); }
  });
  await check('live HTTP controls require owner Auth, both consent flags, same-origin and original signed customer', async () => {
    const f = await liveFixture(admin, worker);
    const body = { customerId: f.customer, preserveCurrentSelectionConfirmed: true, creditSpendConfirmed: true };
    for (const user of [{ email: 'ordinary@example.invalid' },{ is_anonymous: true },{ email_confirmed_at: null }]) {
      f.state.user = user; assert.equal((await f.request('renewal-live-review', body)).code, 403);
    }
    f.state.user = {};
    assert.equal((await f.request('renewal-live-review', body, { origin: 'https://other.invalid' })).code, 403);
    assert.equal((await f.request('renewal-live-review', body, { authorization: '' })).code, 401);
    assert.equal((await f.request('renewal-live-review', { ...body, creditSpendConfirmed: false })).code, 400);
    assert.equal((await f.request('renewal-live-review', { ...body, packageId: '1' })).code, 400);
    const review = (await f.request('renewal-live-review', body)).body.review;
    const result = await f.request('renewal-live-execute', { ...body, token: review.token + 'x' });
    assert.equal(result.body.state, 'review_required'); assert.equal(f.state.calls, 0);
  });
  await check('release flag and dedicated live key cannot be replaced with test settings; expired missing status is read-only', async () => {
    const f = await liveFixture(admin, worker);
    f.env.KS_CRM_LIVE_RENEWAL_ENABLED = 'false';
    assert.equal((await f.request('renewal-live-readiness')).body.state, 'disabled'); assert.equal(f.state.snapshots, 0);
    f.env.KS_CRM_LIVE_RENEWAL_ENABLED = 'true';
    const key = f.env.KS_CRM_LIVE_RENEWAL_CONSENT_KEY;
    for (const invalid of ['',f.env.ROOMBA_PREVIEW_SECRET,'0'.repeat(64)]) {
      f.env.KS_CRM_LIVE_RENEWAL_CONSENT_KEY = invalid;
      assert.equal((await f.request('renewal-live-readiness')).body.state, 'unavailable');
    }
    f.env.KS_CRM_LIVE_RENEWAL_CONSENT_KEY = key;
    const body = { customerId: f.customer, token: f.receipt.token };
    assert.equal((await f.request('renewal-live-status', body)).body.canStartNewReview, false);
    f.state.now += 360001;
    const status = await f.request('renewal-live-status', body);
    assert.equal(status.body.state, 'not_found'); assert.equal(status.body.canStartNewReview, true);
    assert.equal(f.state.calls, 0); assert.equal(f.captured.some(r => r.name.endsWith('reserve_renewal')), false);
  });
  const { runLiveUiChecks } = await import('./live-ui.mjs');
  await runLiveUiChecks({ admin, worker, check, liveFixture });
}

export async function runLiveNativeChecks({ admin, a, b, check, race }) {
  assert.equal(await json(admin, 'current_database()'), 'ks_disposable_crm_renewal_test');
  await admin.request('update public.ks_crm_live_renewal_control set execution_enabled=true');
  try {
    for (const release of ['commit','rollback']) await check(`native live same-attempt begin commits one decision (${release})`, async () => {
      const f = await liveFixture(admin, a); await f.reserve();
      assert.deepEqual(await race(liveBegin(f), liveBegin(f), release), [true,release === 'rollback']);
      assert.equal((await f.summary()).versions, 1);
    });
    await check('native separate live consents cannot both consume the same line version', async () => {
      const f = await liveFixture(admin, a); await f.reserve();
      const base = await renewalFixture(admin, a, { customer: f.customer, line: f.line, reseller: f.reseller, oldExpiry: f.old, reserveNow: false });
      const g = await liveFixture(admin, b, { base }); await g.reserve();
      assert.deepEqual(await race(liveBegin(f), liveBegin(g)), [true,false]);
      assert.equal((await g.summary()).versions, 0);
    });
    for (const liveFirst of [true,false]) await check(`native live renewal retains shared setup exclusion (${liveFirst ? 'live' : 'setup'} first)`, async () => {
      const setup = await setupFixture(admin); await prepareAttempt(admin, setup);
      const base = await renewalFixture(admin, a, { reseller: setup.reseller, reserveNow: false });
      const f = await liveFixture(admin, a, { base }); await f.reserve();
      const first = liveFirst ? liveBegin(f) : setupBegin(setup), second = liveFirst ? setupBegin(setup) : liveBegin(f);
      await a.request('begin');
      try { assert.equal(await json(a, first), true);
        await assert.rejects(() => json(b, second), /reseller_reservation_busy/); await a.request('commit');
      } finally { await a.request('rollback'); }
      await assert.rejects(() => json(b, second), /reseller_reserved_for_other_work/);
    });
    for (const protocol of ['test','review']) for (const liveFirst of [true,false]) await check(`native live renewal retains ${protocol} exclusion (${liveFirst ? 'live' : protocol} first)`, async () => {
      let other, reseller;
      if (protocol === 'review') { const setup = await setupFixture(admin); other = reserveReview(setup); reseller = setup.reseller; }
      else {
        await admin.request('update public.ks_crm_renewal_control set execution_enabled=true');
        const test = await renewalFixture(admin, a); other = testBegin(test); reseller = test.reseller;
      }
      const base = await renewalFixture(admin, a, { reseller, reserveNow: false });
      const f = await liveFixture(admin, a, { base }); await f.reserve();
      const first = liveFirst ? liveBegin(f) : other, second = liveFirst ? other : liveBegin(f);
      try {
        await a.request('begin');
        try { assert.ok(await json(a, first)); await assert.rejects(() => json(b, second), /reseller_reservation_busy/); await a.request('commit'); }
        finally { await a.request('rollback'); }
        await assert.rejects(() => json(b, second), /reseller_reserved_for_other_work/);
      } finally { await admin.request('update public.ks_crm_renewal_control set execution_enabled=false'); }
    });
    for (const release of ['commit','rollback']) await check(`native live CRM completion is atomic across competing workers (${release})`, async () => {
      const f = await liveFixture(admin, a, { fault: 'complete_not_saved' });
      assert.equal((await f.run()).state, 'crm_pending');
      const record = await f.ledger.lookup(f.receipt, f.receipt.token);
      const call = expression('ks_crm_live_complete_renewal', { p_operation: f.receipt.operationId, p_claim: record.claimToken, p_current_expiry: f.renewed });
      const [first, second] = await race(call, call, release);
      assert.equal(first.replayed, false); assert.equal(second.replayed, release === 'commit');
      assert.equal((await f.summary()).completions, 1); assert.equal((await f.summary()).slots, 0);
      assert.equal(f.state.calls, 1);
    });
  } finally { await admin.request('update public.ks_crm_live_renewal_control set execution_enabled=false'); }
}
