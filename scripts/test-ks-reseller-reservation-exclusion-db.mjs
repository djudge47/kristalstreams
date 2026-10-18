import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(process.env.KS_PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const sql = await readFile(new URL('./ks-reseller-reservation-exclusion-schema.sql', import.meta.url), 'utf8');
const oldTable = 'public.ks_preview_reseller_dispatches', reviewTable = 'public.ks_setup_review_reseller_slots';
let checks = 0;
const rows = async (query, args = []) => (await db.query(query, args)).rows;
const insert = (table, reseller = '99999') => rows(`insert into ${table}(reseller_id) values($1)`, [reseller]);
const totals = async () => (await rows(`select (select count(*)::int from ${oldTable}) as old,
  (select count(*)::int from ${reviewTable}) as review`))[0];
async function rejected(fn, pattern) {
  await db.exec('savepoint expected');
  try { await assert.rejects(fn, pattern); }
  finally { await db.exec('rollback to savepoint expected; release savepoint expected'); }
}
async function check(label, fn, isolation = 'read committed') {
  await db.exec(`begin isolation level ${isolation}`);
  try { await fn(); checks++; console.log(`PASS: ${label}`); }
  finally { await db.exec('rollback'); }
}
try {
  // Minimal slot tables isolate the guard; the application-schema suite below
  // separately verifies real approval, claim, budget and completion integration.
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create table ${oldTable}(reseller_id text primary key);
    create table ${reviewTable}(reseller_id text primary key);
    alter table ${oldTable} enable row level security;alter table ${reviewTable} enable row level security;
    revoke all on ${oldTable},${reviewTable} from public,anon,authenticated;
    grant usage on schema public to service_role,anon,authenticated;
    grant select,insert on ${oldTable},${reviewTable} to service_role;`);
  for (const [seed,pattern] of [
    [`insert into ${oldTable} values('99999');insert into ${reviewTable} values('99999')`,/existing_reseller_reservations_require_reconciliation/],
    [`insert into ${oldTable} values('099999')`,/canonical_reseller_reservation_required/],
    [`insert into ${reviewTable} values('099999')`,/canonical_reseller_reservation_required/],
  ]) {
    await db.exec(seed);const before=await totals();
    await assert.rejects(()=>db.exec(sql),pattern);await db.exec('rollback');
    assert.deepEqual(await totals(),before);
    assert.equal((await rows("select to_regprocedure('public.ks_guard_reseller_reservation_exclusion()') as function"))[0].function,null);
    await db.exec(`truncate ${oldTable},${reviewTable}`);checks++;
    console.log('PASS: migration preflight rejects incompatible existing state without changing it');
  }
  await db.exec(sql);
  await check('installation seeds no reservation and preserves private role boundaries', async () => {
    assert.deepEqual(await totals(), { old: 0, review: 0 });
    const [definition] = await rows(`select prosecdef,provolatile,proconfig,
      has_function_privilege('service_role',oid,'execute') as service,
      has_function_privilege('anon',oid,'execute') as anon,
      has_function_privilege('authenticated',oid,'execute') as authenticated
      from pg_proc where proname='ks_guard_reseller_reservation_exclusion'`);
    assert.equal(definition.prosecdef, false); assert.equal(definition.provolatile, 'v');
    assert.ok(definition.proconfig.includes('search_path=""'));
    assert.equal(definition.service, true);assert.equal(definition.anon, false);assert.equal(definition.authenticated, false);
    for (const table of [oldTable, reviewTable]) {
      const [result] = await rows(`select relrowsecurity,
        has_table_privilege('anon',oid,'select') as anon,
        has_table_privilege('authenticated',oid,'insert') as authenticated
        from pg_class where oid=$1::regclass`, [table]);
      assert.equal(result.relrowsecurity, true);assert.equal(result.anon, false);assert.equal(result.authenticated, false);
    }
  });
  for (const [first, second, name] of [[oldTable,reviewTable,'Preview'],[reviewTable,oldTable,'review']]) {
    await check(`${name} reservation blocks the other protocol, including ON CONFLICT DO NOTHING`, async () => {
      await db.exec('set local role service_role');await insert(first);
      await rejected(() => insert(second), /reseller_reserved_for_/);
      await rejected(() => db.exec(`insert into ${second} values('99999') on conflict do nothing`), /reseller_reserved_for_/);
      assert.equal((await totals()).old + (await totals()).review, 1);
    });
    await check(`${name} retains same-table uniqueness and allows a different reseller`, async () => {
      await db.exec('set local role service_role');await insert(first);
      await rejected(() => insert(first), /duplicate key/);await insert(second,'88888');
      assert.deepEqual(await totals(), { old: 1, review: 1 });
    });
    await check(`${name} rejects non-canonical reseller aliases`, async () => {
      for (const id of [null,'','0','099999','+99999','99999 ',' 99999','-1','1e5','1000000000000000']) {
        await rejected(() => insert(first,id), /canonical_reseller_reservation_required/);
      }
      assert.deepEqual(await totals(), { old: 0, review: 0 });
    });
    await check(`${name} cannot be retargeted by an UPDATE, even by a table owner`, async () => {
      await insert(first);
      await rejected(() => db.exec(`update ${first} set reseller_id='88888'`), /reseller_reservation_is_immutable/);
      await rejected(() => db.exec(`update ${first} set reseller_id=reseller_id`), /reseller_reservation_is_immutable/);
    });
  }
  await check('same-statement cross-table reservations roll the entire statement back', async () => {
    await rejected(() => db.exec(`with a as (insert into ${oldTable} values('99999') returning reseller_id)
      insert into ${reviewTable} select reseller_id from a`), /reseller_reserved_for_preview_dispatch/);
    assert.deepEqual(await totals(), { old: 0, review: 0 });
    await rejected(() => db.exec(`with a as (insert into ${reviewTable} values('99999') returning reseller_id)
      insert into ${oldTable} select reseller_id from a`), /reseller_reserved_for_setup_review/);
    assert.deepEqual(await totals(), { old: 0, review: 0 });
  });
  for (const isolation of ['repeatable read','serializable','read uncommitted']) {
    await check(`${isolation} rejects both protocols before a reservation`, async () => {
      for (const table of [oldTable,reviewTable]) await rejected(() => insert(table), /reseller_reservation_requires_read_committed/);
      assert.deepEqual(await totals(), { old: 0, review: 0 });
    }, isolation);
  }
  await check('transaction-scoped advisory ownership disappears on rollback', async () => {
    await insert(oldTable);
    const lockQuery = "select count(*)::int as n from pg_locks where locktype='advisory' and pid=pg_backend_pid()";
    assert.equal((await rows(lockQuery))[0].n, 1);
    await db.exec('rollback;begin');assert.equal((await rows(lockQuery))[0].n, 0);
    await insert(reviewTable);assert.deepEqual(await totals(), { old: 0, review: 1 });
  });
  console.log(`${checks} reservation-exclusion checks passed in single-session isolated PostgreSQL. No provider, connected project, payment or credit was used.`);
} catch (error) { console.error('Reservation exclusion test failed', { message:error.message, code:error.code, where:error.where });process.exitCode=1; }
finally { await db.close(); }
