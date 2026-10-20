import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { bootstrap } from './fixtures/ks-reviewed-handoff/fixtures.mjs';
import { installPrototype } from './fixtures/ks-reviewed-handoff/handoff-fixtures.mjs';
import { runSignedHandoffChecks } from './fixtures/ks-reviewed-handoff/signed-scenarios.mjs';
import { runHandoffSequential } from './fixtures/ks-reviewed-handoff/handoff-scenarios.mjs';

const { PGlite } = await import(process.env.KS_PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const session = role => ({ async request(sql) {
  const results = await db.exec(`set role ${role};${sql}`);
  return results.flatMap(result => result.rows).map(row => {
    const [column, value] = Object.entries(row)[0];
    return column === 'to_jsonb' || typeof value === 'object' ? JSON.stringify(value) : String(value);
  }).join('\n');
} });
const admin = session('postgres'), worker = session('service_role');
let checks = 0;
const check = async (label, fn) => { await fn(); checks++; console.log(`PASS: ${label}`); };
try {
  await check('unmodified prototype refuses the wrong database before creating its tables', async () => {
    const sql = await readFile(new URL('./fixtures/ks-reviewed-handoff/prototype.sql', import.meta.url), 'utf8');
    await assert.rejects(() => db.exec(sql), /disposable_handoff_database_required/);
    assert.equal((await db.query("select to_regclass('public.ks_proto_execution_approvals') as target")).rows[0].target, null);
  });
  await bootstrap(admin, { pglitePreflight: true });
  await installPrototype(admin, { pglitePreflight: true });
  await runHandoffSequential({ admin, a: worker, b: worker, check });
  await runSignedHandoffChecks({admin,worker,check});
  console.log(`Passed ${checks} isolated SQL/signed-handoff checks. No network or provider-create adapter exists. PGlite is one session; this is not native contention evidence.`);
} finally { await db.close(); }
