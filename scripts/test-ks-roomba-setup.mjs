import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { normalizePackages, buildSetupDraft } from '../_shared/ks-roomba-setup.js';
import { readPackageJson } from '../_server/ks-roomba-account-reader.js';
import { createRoombaPreviewHandler } from '../_server/ks-roomba-preview.js';
import { createAdminRoombaHandler } from '../_server/ks-roomba-admin.js';

const raw = { id: '17', package_name: 'Synthetic package', is_trial: '1', is_official: '1', trial_credits: '0', official_credits: '1.5', trial_duration: '36', trial_duration_in: 'hours', official_duration: '1', official_duration_in: 'months', max_connections: '2', bouquets: '[13,14]' };
const input = { packageId: '17', mode: 'trial', username: 'synthetic_customer', password: 'fake-customer-password', connections: 2, notes: 'Synthetic draft only' };
const env = { VERCEL_ENV: 'preview', VITE_SUPABASE_URL: 'https://fake.supabase.co', VITE_SUPABASE_ANON_KEY: 'fake-anon', ROOMBA_API_URL: 'https://cdn.rooomba.tv/WDXTMHmN/', ROOMBA_API_KEY: 'fake-provider-secret', ROOMBA_PREVIEW_SECRET: 'fake-preview-secret', FIXIE_URL: 'https://fixie:fake-proxy-password@synthetic.usefixie.com/' };
let checks = 0;
async function check(name, fn) { await fn(); checks++; console.log(`PASS: ${name}`); }
const response = () => ({ headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });

await check('provider package values are retained without inventing IDs, costs or durations', async () => {
  const [pkg] = normalizePackages([raw]);
  assert.equal(pkg.id, '17'); assert.equal(pkg.name, raw.package_name);
  assert.deepEqual(pkg.trial, { count: 36, unit: 'hours', credits: 0 });
  assert.deepEqual(pkg.paid, { count: 1, unit: 'months', credits: 1.5 });
  assert.deepEqual(pkg.bouquets, [13, 14]); assert.equal(pkg.maxConnections, 2); assert.deepEqual(pkg.issues, []);
});
await check('trial and paid drafts include only documented fields and never convert months to days', async () => {
  const packages = normalizePackages([raw]);
  const trial = buildSetupDraft(input, packages);
  assert.equal(trial.draftOnly, true); assert.equal(trial.sent, false);
  assert.equal(trial.fields.trial, '1'); assert.equal(trial.fields.package_duration, '36 hours');
  assert.deepEqual(trial.fields['bouquets_selected[]'], ['13', '14']);
  assert.deepEqual(Object.keys(trial.fields).sort(), ['trial', 'username', 'password', 'package', 'package_duration', 'max_connections', 'bouquets_selected[]', 'reseller_notes'].sort());
  const paid = buildSetupDraft({ ...input, mode: 'paid' }, packages);
  assert.equal(paid.fields.trial, '0'); assert.equal(paid.fields.package_duration, '1 months'); assert.equal(paid.estimatedCredits, 1.5);
});
await check('missing, contradictory or unsafe package details prevent request preparation', async () => {
  for (const change of [{ max_connections: '' }, { bouquets: 'not JSON' }, { bouquets: '[]' }, { bouquets: '[13,"bad"]' }, { trial_duration_in: '__proto__', is_official: '0' }, { trial_credits: ' ', official_credits: null }, { is_trial: '0', is_official: '0' }, { package_name: '' }]) {
    const packages = normalizePackages([{ ...raw, ...change }]);
    assert.throws(() => buildSetupDraft(input, packages));
  }
  assert.throws(() => normalizePackages([raw, raw]));
  assert.throws(() => normalizePackages([{ ...raw, id: 'evil' }]));
  assert.throws(() => buildSetupDraft({ ...input, packageId: '99' }, normalizePackages([raw])));
});
await check('connection limits, access flags, credentials and notes are validated before review', async () => {
  const packages = normalizePackages([raw]);
  for (const change of [{ connections: 0 }, { connections: 3 }, { connections: 1.5 }, { mode: 'other' }, { username: 'bad username' }, { password: 'short' }, { password: 'contains\na-newline' }, { notes: 'x'.repeat(1001) }]) {
    assert.throws(() => buildSetupDraft({ ...input, ...change }, packages));
  }
  assert.throws(() => buildSetupDraft({ ...input, mode: 'paid' }, normalizePackages([{ ...raw, is_official: '0' }])));
});
await check('provider secrets and arbitrary package fields cannot enter the catalog or draft', async () => {
  const catalog = normalizePackages([{ ...raw, package_name: env.ROOMBA_API_KEY, api_key: env.ROOMBA_API_KEY }], [env.ROOMBA_API_KEY]);
  assert.ok(!JSON.stringify(catalog).includes(env.ROOMBA_API_KEY)); assert.ok(catalog[0].issues.length);
  const draft = buildSetupDraft({ ...input, api_key: env.ROOMBA_API_KEY, action: 'delete_line', member_id: 99 }, normalizePackages([raw]));
  assert.ok(!JSON.stringify(draft).includes(env.ROOMBA_API_KEY)); assert.equal(draft.fields.member_id, undefined);
});
await check('package streaming keeps documented fields and validates trailing JSON', async () => {
  const parsed = await readPackageJson(Response.json({ status: 'STATUS_SUCCESS', data: [{ ...raw, api_key: env.ROOMBA_API_KEY, ignored: 'x'.repeat(2 * 1024 * 1024) }] }));
  assert.deepEqual(parsed.data, [raw]); assert.ok(!JSON.stringify(parsed).includes(env.ROOMBA_API_KEY));
  await assert.rejects(readPackageJson(new Response('{"data":[' + JSON.stringify(raw) + '],"tail":[')), error => error.code === 'KS_INVALID_JSON');
  await assert.rejects(readPackageJson(Response.json({ data: Array.from({ length: 129 }, (_, i) => ({ ...raw, id: i + 1 })) })), error => error.code === 'KS_RESPONSE_COMPLEXITY');
  await assert.rejects(readPackageJson(Response.json({ data: [null] })));
});
await check('the packages endpoint sends only the fixed documented GET through Fixie', async () => {
  const calls = [];
  const dispatcher = { dispatch() {}, async close() {} };
  const handler = createRoombaPreviewHandler({ env, readAction: 'packages', dispatcherFactory: () => dispatcher, fetchImpl: async (url, options) => {
    calls.push({ url: new URL(url), options });
    return Response.json({ status: 'STATUS_SUCCESS', data: [raw] });
  } });
  const res = response();
  await handler({ method: 'GET', headers: { authorization: `Bearer ${env.ROOMBA_PREVIEW_SECRET}` }, query: { action: 'create_line', url: 'https://evil.invalid' } }, res);
  assert.equal(res.code, 200); assert.equal(res.body.status, 'packages_ready'); assert.equal(res.body.databaseWrites, false);
  assert.equal(calls.length, 1); assert.equal(calls[0].url.origin, 'https://cdn.rooomba.tv');
  assert.equal(calls[0].url.searchParams.get('action'), 'packages'); assert.equal(calls[0].options.method, 'GET');
  assert.equal(calls[0].options.redirect, 'manual'); assert.equal(calls[0].options.dispatcher, dispatcher);
  assert.throws(() => createRoombaPreviewHandler({ readAction: 'create_line' }));
  assert.ok(!JSON.stringify(res.body).includes(env.ROOMBA_API_KEY));
});
await check('signed-in admin is required for package reads; writes and Production remain blocked', async () => {
  let providerCalls = 0;
  const provider = async (req, res) => { providerCalls++; return res.status(200).json({ status: 'packages_ready', mode: 'read-only', databaseWrites: false, transport: 'fixie', packages: normalizePackages([raw]) }); };
  const factory = (email, settings = env) => createAdminRoombaHandler({ env: settings, dataKind: 'packages', accountHandler: provider, createClient: () => ({ auth: { async getUser() { return { data: { user: { id: 'fake-user', email, email_confirmed_at: '2026-01-01' } } }; } } }) });
  const request = { method: 'GET', headers: { authorization: 'Bearer synthetic-token' } };
  const ordinary = response(); await factory('customer@example.invalid')(request, ordinary); assert.equal(ordinary.code, 403);
  const unauthorized = response(); await factory('djudge47@gmail.com')({ method: 'GET', headers: {} }, unauthorized); assert.equal(unauthorized.code, 401);
  const production = response(); await factory('djudge47@gmail.com', { ...env, VERCEL_ENV: 'production' })(request, production); assert.equal(production.code, 404);
  const write = response(); await factory('djudge47@gmail.com')({ ...request, method: 'POST' }, write); assert.equal(write.code, 405);
  assert.equal(providerCalls, 0);
  const ok = response(); await factory('djudge47@gmail.com')(request, ok); assert.equal(ok.body.status, 'packages_ready'); assert.equal(providerCalls, 1);
});
await check('preparing a draft performs no network call, mutation or customer-line creation', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = () => { calls++; throw new Error('unexpected network'); };
  try { assert.equal(buildSetupDraft(input, normalizePackages([raw])).sent, false); assert.equal(calls, 0); }
  finally { globalThis.fetch = original; }
});
await check('the setup screen fetches only the read-only packages URL and never stores credentials', async () => {
  const text = fs.readFileSync(new URL('../src/pages/admin/PrepareSetup.tsx', import.meta.url), 'utf8');
  const source = ts.createSourceFile('PrepareSetup.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const fetches = [];
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'fetch') fetches.push(node);
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.equal(fetches.length, 1); assert.equal(fetches[0].arguments[0].text, '/api/ks-roomba-packages');
  const method = fetches[0].arguments[1].properties.find(item => item.name?.getText(source) === 'method');
  assert.equal(method.initializer.text, 'GET');
  assert.ok(!text.includes('localStorage')); assert.ok(!text.includes('sessionStorage'));
  assert.ok(!text.includes('ROOMBA_API_KEY')); assert.ok(!text.includes('FIXIE_URL'));
});
console.log(`${checks} setup preparation checks passed. No real provider calls, database writes, client lines or credit debits.`);
