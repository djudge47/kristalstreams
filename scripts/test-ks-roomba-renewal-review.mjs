import assert from 'node:assert/strict';
import { buildRenewalReview, compareChannelGroups } from '../_server/ks-roomba-renewal-review.js';
import { createRoombaCrmRoute } from '../_server/ks-roomba-crm-route.js';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { build } from 'esbuild';
import { renderToStaticMarkup } from 'react-dom/server';

const now = Date.parse('2026-10-21T16:30:00Z');
const checkedAt = new Date(now).toISOString();
const customerId = '11111111-1111-4111-8111-111111111111';
const line = { id: '123', username: 'fictional-customer', resellerId: '12', packageId: '9', expiresAt: '2027-08-04T21:46:37Z',
  connections: 1, trial: false, enabled: true, adminEnabled: true, bouquetIds: [10, 11] };
const pkg = { id: '9', name: '12 Months + 1 Connection', maxConnections: 1, bouquets: [10, 11],
  trial: null, paid: { count: 12, unit: 'months', credits: 2.75 }, issues: [] };
const base = { line, account: { credits: '68' }, packages: [pkg], checkedAt };
let count = 0;
async function test(name, run) { await run(); console.log(`PASS: ${name}`); count++; }
const review = patch => buildRenewalReview({ ...base, ...patch }, now);
await test('same active paid package uses provider calendar months and exact credits, without execution capability', () => {
  const r = review();
  assert.equal(r.status, 'review_ready'); assert.equal(r.durationMonths, 12); assert.equal(r.estimatedCredits, 2.75);
  assert.equal(r.creditsAvailable, 68); assert.equal(r.executionEnabled, false); assert.equal(r.sent, false);
  assert.ok(!Object.hasOwn(r, 'expiresAt')); assert.ok(!Object.hasOwn(r, 'fields')); assert.ok(!Object.hasOwn(r, 'approvalToken'));
});
await test('trial conversion, expired lines, boundary expiry and disabled flags require manual review', () => {
  for (const patch of [{ trial: true }, { expiresAt: checkedAt }, { expiresAt: '2026-01-01Z' }, { enabled: false }, { adminEnabled: false }]) {
    const r = review({ line: { ...line, ...patch } }); assert.equal(r.status, 'manual_review'); assert.ok(r.blockers.length); assert.equal(r.executionEnabled, false);
  }
});
await test('unreadable and insufficient credit balances never become a ready review', () => {
  for (const credits of [null, '', '-1', 'not-a-number', Infinity, 1000001, {}, '2.74']) {
    const r = review({ account: { credits } }); assert.equal(r.status, 'manual_review');
  }
  assert.equal(review({ account: { credits: '2.75' } }).status, 'review_ready');
});
await test('missing current package cannot fall back to an alternative or cheaper plan', () => {
  const alternative = { ...pkg, id: '88', name: '1 Month + 1 Connection', paid: { count: 1, unit: 'months', credits: 1 } };
  const r = review({ packages: [alternative] }); assert.equal(r.status, 'manual_review'); assert.equal(r.estimatedCredits, null);
  const same = review({ packages: [alternative, pkg] }); assert.equal(same.durationMonths, 12); assert.equal(same.estimatedCredits, 2.75);
});
await test('same-package group and allowance changes block readiness, while group order is harmless', () => {
  for (const patch of [{ bouquetIds: [10, 12] }, { bouquetIds: [] }, { bouquetIds: [10, 10, 11] }, { connections: 2 }]) {
    assert.equal(review({ line: { ...line, ...patch } }).status, 'manual_review');
  }
  assert.equal(review({ line: { ...line, bouquetIds: [11, 10] } }).status, 'review_ready');
});
await test('comparison identifies exact sorted differences without changing either selection', () => {
  const actual = [30, 10, 20]; const expected = [40, 10, 50];
  assert.deepEqual(compareChannelGroups(actual, expected), { status: 'different', lineCount: 3, packageCount: 3, lineOnly: [20, 30], packageOnly: [40, 50] });
  assert.deepEqual(actual, [30, 10, 20]); assert.deepEqual(expected, [40, 10, 50]);
  assert.deepEqual(compareChannelGroups([10, 20], [20, 10]), { status: 'match', lineCount: 2, packageCount: 2, lineOnly: [], packageOnly: [] });
});
await test('unverified or duplicate selections never appear as an empty successful match', () => {
  for (const invalid of [null, [], ['10'], [0], [-1], [10, 10], [2147483648], ['sensitive-text']]) {
    const result = compareChannelGroups(invalid, [10]); assert.equal(result.status, 'unverified'); assert.equal(result.lineCount, null);
    assert.deepEqual(result.lineOnly, []); assert.deepEqual(result.packageOnly, []); assert.ok(!JSON.stringify(result).includes('sensitive-text'));
  }
});
await test('comparison includes every differing group at the supported limit without truncation', () => {
  const actual = Array.from({ length: 2000 }, (_, i) => i + 1);
  const expected = Array.from({ length: 2000 }, (_, i) => i + 2001);
  const r = compareChannelGroups(actual, expected); assert.equal(r.lineOnly.length, 2000); assert.equal(r.packageOnly.length, 2000);
  assert.deepEqual(r.lineOnly, actual); assert.deepEqual(r.packageOnly, expected);
  assert.equal(compareChannelGroups([...actual, 4001], expected).status, 'unverified');
});
await test('incomplete, alternative, inconsistent and trial packages cannot become ready', () => {
  for (const patch of [{ name: 'VIP package' }, { name: `${pkg.name} (Without Adults)` }, { issues: ['Incomplete'] },
    { maxConnections: 2 }, { trial: { count: 36, unit: 'hours', credits: 0 } }, { bouquets: null },
    { paid: { count: 365, unit: 'days', credits: 2.75 } }, { paid: { ...pkg.paid, credits: 0 } }, { paid: { ...pkg.paid, count: 1 } }]) {
    const r = review({ packages: [{ ...pkg, ...patch }] }); assert.equal(r.status, 'manual_review');
  }
});
await test('malformed or ambiguous catalogs fail verification without rendering provider text', () => {
  for (const packages of [[], [pkg, pkg], [{ ...pkg, paid: { ...pkg.paid, credits: -1 } }]]) assert.throws(() => review({ packages }));
  const r = review({ packages: [{ ...pkg, name: '<script>sensitive-text</script>' }] });
  assert.ok(!JSON.stringify(r).includes('sensitive-text')); assert.equal(r.packageName, null);
});
await test('one-minute freshness and expiry are recalculated for cached reviews', () => {
  assert.equal(buildRenewalReview(base, now + 60001).status, 'manual_review');
  assert.throws(() => review({ checkedAt: new Date(now + 2000).toISOString() }));
  assert.throws(() => review({ checkedAt: 'invalid' }));
  const nearExpiry = { ...base, line: { ...line, expiresAt: new Date(now + 1000).toISOString() } };
  assert.equal(buildRenewalReview(nearExpiry, now).status, 'review_ready');
  assert.equal(buildRenewalReview(nearExpiry, now + 1000).status, 'manual_review');
});
await test('review construction does not mutate inputs or make any network request', () => {
  const before = JSON.stringify(base); const original = globalThis.fetch;
  globalThis.fetch = () => { throw Error('Network forbidden'); };
  try { review(); assert.equal(JSON.stringify(base), before); } finally { globalThis.fetch = original; }
});

function fixture(settings = {}) {
  const state = { now, user: { id: customerId, email: 'djudge47@gmail.com', email_confirmed_at: checkedAt }, ...settings };
  const calls = { auth: 0, crm: 0, actions: [] };
  const env = { VERCEL_ENV: 'preview', VITE_SUPABASE_URL: 'https://wftfxerblhlsxiijtfbo.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'fictional-anon', SUPABASE_SERVICE_ROLE_KEY: 'fictional-service', ROOMBA_PREVIEW_SECRET: 'fictional-preview', ...settings.env };
  const createClient = (_url, key) => key === 'fictional-anon' ? { auth: { async getUser() { calls.auth++; return { data: { user: state.user } }; } } }
    : { from(table) { assert.equal(table, 'iptv_customers'); return {
      select(columns) { assert.equal(columns, 'id,external_id,username'); calls.crm++; return this; },
      eq(field, id) { assert.equal(field, 'id'); assert.equal(id, customerId); return this; },
      async maybeSingle() { return { data: { id: customerId, external_id: 123, username: line.username } }; },
    }; } };
  const readFactory = settings => async (req, res) => {
    assert.equal(req.method, 'GET'); calls.actions.push(settings.readAction);
    if (state.wait) await state.wait;
    const common = { mode: 'read-only', databaseWrites: false, transport: 'fixie' };
    if (settings.readAction === 'user_info') return res.status(200).json({ ...common, status: 'connected', account: { id: '12', credits: 68 } });
    if (settings.readAction === 'get_line') {
      assert.equal(settings.lineId, '123'); return res.status(200).json({ ...common, status: 'line_ready', line: { ...line, ...state.line, password: 'sensitive-password' } });
    }
    assert.equal(settings.readAction, 'packages');
    if (state.packageFails) throw Error('sensitive-provider-error');
    state.now += state.packageDelay || 0;
    return res.status(200).json({ ...common, status: 'packages_ready', packages: [pkg] });
  };
  const handler = createRoombaCrmRoute({ env, createClient, readFactory, now: () => state.now });
  return { state, calls, async request({ method = 'GET', query = {}, token = 'fictional-token' } = {}) {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await handler({ method, headers: { authorization: token ? `Bearer ${token}` : '' }, query: { view: 'customer-renewal', customerId,
      packageId: '88', action: 'edit_line', confirmed: 'true', ...query } }, res);
    const output = JSON.stringify(res.body);
    for (const secret of ['sensitive-', 'fictional-token', 'fictional-service', 'fictional-preview', 'renewalContext', 'bouquetIds', 'resellerId']) assert.ok(!output.includes(secret));
    return res;
  } };
}
await test('shared route verifies current line and catalog with documented GETs, ignores mutation overrides', async () => {
  const f = fixture(); const r = await f.request(); assert.equal(r.code, 200); assert.equal(r.body.renewal.status, 'review_ready');
  assert.deepEqual(f.calls.actions, ['user_info', 'get_line', 'packages']); assert.equal(r.body.databaseWrites, false);
  assert.equal(r.body.renewal.durationMonths, 12); assert.equal(r.body.line.lineId, '123'); assert.equal(f.calls.crm, 1);
});
await test('write methods, Production, missing login and ordinary users never contact CRM/provider', async () => {
  for (const method of ['POST', 'PUT', 'DELETE']) { const f = fixture(); assert.equal((await f.request({ method })).code, 405); assert.equal(f.calls.crm, 0); }
  const prod = fixture({ env: { VERCEL_ENV: 'production' } }); assert.equal((await prod.request()).code, 404); assert.equal(prod.calls.auth, 0);
  const missing = fixture(); assert.equal((await missing.request({ token: '' })).code, 401); assert.equal(missing.calls.crm, 0);
  const ordinary = fixture({ user: { id: customerId, email: 'customer@example.invalid', email_confirmed_at: checkedAt } });
  assert.equal((await ordinary.request()).code, 403); assert.equal(ordinary.calls.crm, 0); assert.equal(ordinary.calls.actions.length, 0);
});
await test('identity mismatch stops before reading packages; package failures do not return partial success', async () => {
  const wrong = fixture({ line: { resellerId: '99' } }); assert.equal((await wrong.request()).code, 502); assert.equal(wrong.calls.actions.length, 2);
  const failure = fixture({ packageFails: true }); const r = await failure.request(); assert.equal(r.code, 502); assert.equal(r.body.renewal, undefined);
  assert.equal((await failure.request()).code, 429);
});
await test('cache revalidates identity and auth and expires readiness as reads age', async () => {
  const f = fixture({ packageDelay: 45000 }); const first = await f.request(); assert.equal(first.body.renewal.status, 'review_ready');
  f.state.now += 16000; const second = await f.request(); assert.equal(second.body.cached, true); assert.equal(second.body.renewal.status, 'manual_review');
  assert.equal(f.calls.auth, 2); assert.equal(f.calls.crm, 2); assert.equal(f.calls.actions.length, 3);
  f.state.user = null; assert.equal((await f.request()).code, 401);
});
await test('simultaneous renewal reviews coalesce without creating execution capability', async () => {
  let release; const wait = new Promise(resolve => { release = resolve; }); const f = fixture({ wait });
  const a = f.request(); const b = f.request(); await new Promise(resolve => setImmediate(resolve)); assert.equal(f.calls.actions.length, 1);
  release(); const results = await Promise.all([a, b]); assert.ok(results.every(r => r.body.renewal.executionEnabled === false));
  assert.deepEqual(f.calls.actions, ['user_info', 'get_line', 'packages']);
});
// Execute the actual component's click/fetch/state path against the real shared
// route with synthetic external dependencies. This is not a deployed browser.
const require = createRequire(import.meta.url);
const reactPath = require.resolve('react');
const directory = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-renewal-view-'));
const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
try {
  const built = await build({ entryPoints: ['src/pages/admin/RoombaCustomerStatus.tsx'], bundle: true, write: false,
    platform: 'node', format: 'esm', jsx: 'automatic', external: ['react/jsx-runtime', 'react-dom', 'lucide-react'],
    plugins: [{ name: 'renewal-fixture', setup(builder) {
      builder.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'fixture' }));
      builder.onResolve({ filter: /\/lib\/supabase$/ }, () => ({ path: 'auth', namespace: 'fixture' }));
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ loader: 'js', contents: args.path === 'hooks'
        ? `import React from ${JSON.stringify(reactPath)}; export default React;
           export const useState=initial=>{const s=globalThis.__ksRenewalHooks;const i=s.cursor++;if(!(i in s.values))s.values[i]=initial;return[s.values[i],v=>{s.values[i]=typeof v==='function'?v(s.values[i]):v;}];};
           export const useRef=initial=>{const s=globalThis.__ksRenewalHooks;const i=s.cursor++;if(!(i in s.values))s.values[i]={current:initial};return s.values[i];};
           export const useEffect=()=>{};`
        : 'export const supabase={auth:{getSession:async()=>({data:{session:{access_token:"fictional-token"}}})}};' }));
      builder.onResolve({ filter: new RegExp('^' + reactPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }, () => ({ path: reactPath, external: true }));
    } }] });
  const path = join(directory, 'component.mjs'); await writeFile(path, built.outputFiles[0].text);
  const { default: Component } = await import(pathToFileURL(path).href);
  globalThis.window = { setTimeout, clearTimeout };
  const render = () => { globalThis.__ksRenewalHooks.cursor = 0; return Component({ customerId, panelId: 123, username: line.username }); };
  const findButton = (node, label) => {
    if (!node || typeof node !== 'object') return null;
    if (Array.isArray(node)) return node.map(child => findButton(child, label)).find(Boolean);
    if (node.type === 'button' && JSON.stringify(node.props.children).includes(label)) return node;
    return findButton(node.props?.children, label);
  };
  const connect = f => {
    globalThis.__ksRenewalHooks = { cursor: 0, values: [] };
    globalThis.fetch = async (url, options) => {
      const parsed = new URL(url, 'https://fictional.example.invalid');
      assert.equal(parsed.pathname, '/api/ks-roomba-crm'); assert.equal(parsed.searchParams.get('view'), 'customer-renewal');
      assert.equal(parsed.searchParams.get('customerId'), customerId); assert.equal([...parsed.searchParams.keys()].length, 2);
      assert.equal(options.method, 'GET'); assert.equal(options.headers.Authorization, 'Bearer fictional-token');
      const r = await f.request({ method: options.method, query: Object.fromEntries(parsed.searchParams) });
      return new Response(JSON.stringify(r.body), { status: r.code, headers: { 'content-type': 'application/json' } });
    };
  };
  const click = async () => { const button = findButton(render(), 'Review renewal'); assert.ok(button); button.props.onClick(); await new Promise(resolve => setImmediate(resolve)); };
  await test('actual customer component renders both check controls with no automatic read or submit button', () => {
    const f = fixture(); connect(f); const markup = renderToStaticMarkup(render());
    assert.ok(markup.includes('Check XUI status')); assert.ok(markup.includes('Review renewal')); assert.ok(!markup.includes('type="submit"')); assert.equal(f.calls.auth, 0);
  });
  await test('actual Review renewal click crosses client, shared route, provider reads and rendered review', async () => {
    const f = fixture(); connect(f); await click(); const markup = renderToStaticMarkup(render());
    assert.ok(markup.includes('Current package reviewed')); assert.ok(markup.includes('12 calendar months')); assert.ok(markup.includes('2.75 credits'));
    assert.ok(markup.includes('68 credits')); assert.ok(markup.includes('Submission is not enabled')); assert.ok(!markup.includes('sensitive-'));
    assert.ok(markup.includes('The channel selections match.'));
    assert.deepEqual(f.calls.actions, ['user_info', 'get_line', 'packages']);
  });
  await test('actual component renders fixed manual-review reasons for changed groups', async () => {
    const f = fixture({ line: { bouquetIds: [10, 99] } }); connect(f); await click(); const markup = renderToStaticMarkup(render());
    assert.ok(markup.includes('Renewal needs manual review')); assert.ok(markup.includes('channel groups do not match')); assert.ok(!markup.includes('Current package reviewed'));
    assert.ok(markup.includes('Channel group comparison')); assert.ok(markup.includes('View differing group IDs'));
    assert.ok(markup.includes('<code class="break-all">99</code>')); assert.ok(markup.includes('<code class="break-all">11</code>'));
  });
  await test('failed refresh removes a previous ready review and shows an alert instead', async () => {
    const f = fixture(); connect(f); await click(); assert.ok(renderToStaticMarkup(render()).includes('Current package reviewed'));
    f.state.now += 61000; f.state.packageFails = true; await click(); const markup = renderToStaticMarkup(render());
    assert.ok(markup.includes('role="alert"')); assert.ok(markup.includes('could not be verified')); assert.ok(!markup.includes('Current package reviewed'));
  });
} finally {
  globalThis.fetch = originalFetch;
  if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
  delete globalThis.__ksRenewalHooks;
  await rm(directory, { recursive: true, force: true });
}
console.log(`${count} renewal review checks passed. Synthetic data only; no provider writes, credits or customer changes.`);
