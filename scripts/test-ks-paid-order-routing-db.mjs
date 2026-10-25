import { readFile } from 'node:fs/promises';
import { bootstrap } from './fixtures/ks-reviewed-handoff/fixtures.mjs';
import { routingCases, routingMigrationName, routingSupportSql } from './fixtures/ks-paid-order-routing.mjs';
const { PGlite } = await import(process.env.KS_PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite(); let passed = 0;
try {
  await bootstrap({ request: sql => db.exec(sql) }, { pglitePreflight: true });
  await db.exec(await routingSupportSql());
  await db.exec(await readFile(new URL(routingMigrationName, new URL('./fixtures/ks-paid-order-routing.mjs', import.meta.url)), 'utf8'));
  await routingCases(db, async (name, fn) => { await fn(); passed++; console.log(`PASS: ${name}`); });
  console.log(`${passed} isolated order-routing SQL checks passed. No connected service was contacted.`);
} finally { await db.close(); }
