import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRoombaTrialHandler, createTrialStore } from '../_server/ks-roomba-trial.js';
import { normalizePackages } from '../_shared/ks-roomba-setup.js';
import { readLineJson } from '../_server/ks-roomba-account-reader.js';

const timestamp = Date.parse('2026-10-17T04:00:00Z');
const admin = { id: '00000000-0000-4000-8000-000000000001', email: 'djudge47@gmail.com', email_confirmed_at: '2026-01-01' };
const env = { VERCEL_ENV: 'preview', VITE_SUPABASE_URL: 'https://fake.supabase.co', VITE_SUPABASE_ANON_KEY: 'fake-anon', SUPABASE_SERVICE_ROLE_KEY: 'fake-service', ROOMBA_PREVIEW_SECRET: 'fake-approval-secret', ROOMBA_API_KEY: 'fake-provider-secret', ROOMBA_API_URL: 'https://cdn.rooomba.tv/WDXTMHmN/', FIXIE_URL: 'http://fake:fake-proxy-password@synthetic.usefixie.com:80', ROOMBA_TRIAL_CREATE_ENABLED: 'true' };
const input = { packageId: '1', mode: 'trial', username: 'synthetic_trial', password: 'fake-trial-password', connections: 1, notes: 'Synthetic test' };
const raw = { id: '1', package_name: 'Synthetic Trial', is_trial: '1', trial_credits: '0', trial_duration: '36', trial_duration_in: 'hours', max_connections: '1', bouquets: '[13,14]' };
const line = { id: '123', username: input.username, password: input.password, is_trial: '1', max_connections: '1', member_id: '12', exp_date: String(timestamp / 1000 + 36 * 3600), api_key: env.ROOMBA_API_KEY };
function fixture(settings = {}) {
  let row = null, time = timestamp;
  const calls = { auth: 0, reads: 0, writes: 0, claims: 0 };
  const store = {
    async get() { if (settings.storageFails) throw new Error('secret storage failure'); return row; },
    async claim(value) { calls.claims++; if (settings.claimFails) throw new Error('private database detail'); if (row) return false; row = structuredClone(value); return true; },
    async finish(hash, state, result) { if (settings.finishFails) throw new Error('private database detail'); assert.equal(row.request_hash, hash); assert.equal(row.state, 'submitting'); row = { ...row, state, result }; },
  };
  const accountHandler = async (_req, res) => { calls.reads++; return res.status(200).json({ status: 'connected', transport: 'fixie', mode: 'read-only', databaseWrites: false, account: { id: settings.resellerId || '12', username: 'synthetic_reseller', credits: 7 } }); };
  let pkg = { ...raw, ...settings.package };
  const packagesHandler = async (_req, res) => { calls.reads++; return res.status(200).json({ status: 'packages_ready', transport: 'fixie', mode: 'read-only', databaseWrites: false, packages: normalizePackages([pkg]) }); };
  const dispatcher = { dispatch() {}, async close() {} };
  const handler = createRoombaTrialHandler({ env: { ...env, ...settings.env }, now: () => time,
    createClient: (_url, key) => { if (key === env.SUPABASE_SERVICE_ROLE_KEY) return {}; return { auth: { async getUser(token) { calls.auth++; return { data: { user: settings.user === undefined ? admin : settings.user }, error: token === 'expired' ? {} : null }; } } }; },
    storeFactory: () => store, accountHandler, packagesHandler, dispatcherFactory: url => { assert.ok(url.startsWith('https:')); return dispatcher; },
    fetchImpl: async (url, options) => {
      calls.writes++;
      assert.equal(url.origin + url.pathname, env.ROOMBA_API_URL); assert.equal(url.searchParams.get('action'), 'create_line');
      assert.equal(options.method, 'POST'); assert.equal(options.redirect, 'manual'); assert.equal(options.dispatcher, dispatcher);
      assert.equal(options.headers['Content-Type'], undefined);
      const values = [...options.body.entries()];
      assert.deepEqual(values.filter(([k]) => k === 'bouquets_selected[]').map(([,v]) => v), ['13', '14']);
      assert.equal(options.body.get('trial'), '1'); assert.equal(options.body.get('package_duration'), '36 hours');
      assert.equal(options.body.get('member_id'), null); assert.equal(options.body.get('package_cost'), null);
      if (settings.wait) await settings.wait;
      if (settings.transportFails) throw new Error('sensitive URL and credentials');
      return settings.response ? settings.response() : Response.json({ status: 'STATUS_SUCCESS', data: { ...line, ...settings.line } });
    },
  });
  return { calls, row: () => row, advance: ms => { time += ms; }, changePackage: change => { pkg = { ...pkg, ...change }; },
    async request(body, { method = 'POST', token = 'synthetic-token' } = {}) {
      const res = { setHeader() {}, status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } };
      await handler({ method, headers: { authorization: token ? `Bearer ${token}` : '' }, body }, res);
      const text = JSON.stringify(res.body);
      for (const secret of [input.password, env.ROOMBA_API_KEY, env.SUPABASE_SERVICE_ROLE_KEY, env.ROOMBA_PREVIEW_SECRET, 'sensitive URL', 'private database detail']) assert.ok(!text.includes(secret));
      return res;
    },
  };
}
const review = async (f, details = input) => {
  const res = await f.request({ operation: 'review', input: details });
  assert.equal(res.code, 200); assert.equal(res.body.status, 'review_ready'); return res.body.approvalToken;
};
const create = (f, approvalToken, changes = {}) => f.request({ operation: 'create', input, approvalToken, confirmed: true, ...changes });
let checks = 0;
async function check(name, fn) { await fn(); checks++; console.log(`PASS: ${name}`); }

await check('production, unsupported methods and unverified identities never reach provider or storage claims', async () => {
  for (const settings of [{ env: { VERCEL_ENV: 'production' } }, { user: null }, { user: { ...admin, email: 'customer@example.invalid', user_metadata: { role: 'admin' } } }, { user: { ...admin, is_anonymous: true } }, { user: { ...admin, email_confirmed_at: null } }]) {
    const f = fixture(settings); assert.ok((await f.request({ operation: 'review', input })).code >= 400); assert.equal(f.calls.reads, 0); assert.equal(f.calls.writes, 0); assert.equal(f.calls.claims, 0);
  }
  const f = fixture(); assert.equal((await f.request({}, { method: 'DELETE' })).code, 405); assert.equal((await f.request({}, { token: '' })).code, 401); assert.equal((await f.request({}, { token: 'expired' })).code, 401);
});
await check('review works while creation is disabled and cannot claim or create', async () => {
  const f = fixture({ env: { ROOMBA_TRIAL_CREATE_ENABLED: undefined } });
  const res = await f.request({ operation: 'review', input }); assert.equal(res.code, 200); assert.equal(res.body.enabled, false);
  assert.equal((await create(f, res.body.approvalToken)).code, 403); assert.equal(f.calls.claims, 0); assert.equal(f.calls.writes, 0);
});
await check('paid, costly, longer and multi-connection packages are rejected before creation', async () => {
  for (const change of [{ trial_credits: '1' }, { trial_duration: '48' }, { max_connections: '2' }, { id: '17' }, { is_trial: '0' }]) {
    const f = fixture({ package: change }); assert.ok((await f.request({ operation: 'review', input })).code >= 400); assert.equal(f.calls.writes, 0); assert.equal(f.calls.claims, 0);
  }
  const f = fixture(); assert.equal((await f.request({ operation: 'review', input: { ...input, mode: 'paid' } })).code, 400);
});
await check('confirmation, signed review, expiry and unchanged details are mandatory', async () => {
  for (const change of [{ confirmed: false }, { approvalToken: 'tampered' }, { input: { ...input, username: 'changed_name' } }, { input: { ...input, password: 'changed-password' } }]) {
    const f = fixture(); const token = await review(f); assert.ok((await create(f, token, change)).code >= 400); assert.equal(f.calls.writes, 0); assert.equal(f.calls.claims, 0);
  }
  const f = fixture(); const token = await review(f); f.advance(300001); assert.equal((await create(f, token)).code, 400); assert.equal(f.calls.writes, 0);
});
await check('changed provider selections invalidate the previous review', async () => {
  const f = fixture(); const token = await review(f); f.changePackage({ bouquets: '[13,15]' }); assert.equal((await create(f, token)).code, 400); assert.equal(f.calls.writes, 0);
});
await check('a confirmed trial uses documented multipart fields and stores only a verified receipt', async () => {
  const f = fixture(); const token = await review(f); const res = await create(f, token);
  assert.equal(res.code, 200); assert.equal(res.body.status, 'created'); assert.equal(res.body.result.lineId, '123'); assert.equal(f.row().state, 'succeeded');
  assert.equal(f.calls.writes, 1); assert.ok(!JSON.stringify(f.row()).includes(input.password));
  const status = await f.request(null, { method: 'GET' }); assert.equal(status.body.attempt.state, 'succeeded');
});
await check('a successful replay returns the saved receipt without another provider request', async () => {
  const f = fixture(); const token = await review(f); await create(f, token); const replay = await create(f, token); assert.equal(replay.code, 200); assert.equal(replay.body.replayed, true); assert.equal(f.calls.writes, 1);
  assert.equal((await create(f, token, { input: { ...input, username: 'other_username' } })).code, 400); assert.equal(f.calls.writes, 1);
});
await check('concurrent confirmations have only one winner before the provider POST', async () => {
  let release; const wait = new Promise(resolve => { release = resolve; });
  const f = fixture({ wait }); const token = await review(f); const a = create(f, token); const b = create(f, token); release();
  const responses = await Promise.all([a, b]); assert.deepEqual(responses.map(r => r.code).sort(), [200, 409]); assert.equal(f.calls.writes, 1);
});
await check('database unavailability fails closed before a provider write', async () => {
  const f = fixture({ storageFails: true }); assert.equal((await f.request({ operation: 'review', input })).code, 503); assert.equal(f.calls.reads, 0); assert.equal(f.calls.writes, 0);
  const g = fixture({ claimFails: true }); const token = await review(g); assert.equal((await create(g, token)).code, 503); assert.equal(g.calls.writes, 0);
});
await check('timeouts, redirects, malformed responses and unverifiable lines permanently lock retries', async () => {
  for (const settings of [{ transportFails: true }, { response: () => new Response('', { status: 302 }) }, { response: () => new Response('{bad') }, { line: { member_id: '99' } }, { line: { exp_date: '1' } }, { line: { is_trial: '0' } }, { line: { username: 'other_user' } }]) {
    const f = fixture(settings); const token = await review(f); const res = await create(f, token); assert.equal(res.code, 502); assert.equal(res.body.needsReview, true); assert.equal(f.row().state, 'unknown');
    assert.equal((await create(f, token)).code, 409); assert.equal(f.calls.writes, 1);
  }
});
await check('a final receipt storage failure leaves the attempt locked without false success', async () => {
  const f = fixture({ finishFails: true }); const token = await review(f); assert.equal((await create(f, token)).code, 502); assert.equal(f.row().state, 'submitting'); assert.equal((await create(f, token)).code, 409); assert.equal(f.calls.writes, 1);
});
await check('line reader drops passwords and validates the whole JSON response', async () => {
  const parsed = await readLineJson(Response.json({ status: 'STATUS_SUCCESS', data: { ...line, permissions: 'x'.repeat(1024 * 1024) } }));
  assert.equal(parsed.data.id, '123'); assert.equal(parsed.data.password, undefined); assert.equal(parsed.data.api_key, undefined);
  await assert.rejects(readLineJson(new Response('{"data":' + JSON.stringify(line) + ',"truncated":[')));
});
await check('the database adapter claims with INSERT and never resets or deletes a slot', async () => {
  const calls = [];
  const client = { from(name) { assert.equal(name, 'ks_roomba_trial_attempts'); return {
    insert(row) { calls.push(row); return Promise.resolve({ error: { code: '23505' } }); },
  }; } };
  assert.equal(await createTrialStore(client).claim({ request_hash: 'synthetic' }), false); assert.equal(calls[0].slot, 'preview_trial_activation_v1');
  const sql = fs.readFileSync(new URL('./ks-roomba-trial-schema.sql', import.meta.url), 'utf8');
  assert.match(sql, /enable row level security/); assert.match(sql, /revoke all.*anon, authenticated, service_role/); assert.match(sql, /grant select, insert, update/); assert.ok(!sql.includes('grant delete'));
});
console.log(`${checks} controlled trial checks passed. Synthetic provider and storage only. No live lines or credits changed.`);
