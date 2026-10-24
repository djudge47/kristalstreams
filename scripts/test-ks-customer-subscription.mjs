import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { StaticRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { createClient } from '@supabase/supabase-js';

const dir = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-subscription-'));
const originalWindow = globalThis.window;
const id = n => `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, '0')}`;
const accountId = id(1), other = id(2), clock = new Map(), events = new Map(), authEvents = new Set();
let mode, auth, requests, profile, hooks, release, serial = 0, timerId = 0, restoreCalls, restore;
const user = (patch = {}) => ({ id: accountId, email: 'ordinary@example.invalid', is_anonymous: false, email_confirmed_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', ...patch });
const verified = u => ({ data: { user: u }, error: null });
const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
const frames = {
  useState(initial) { const i = hooks.si++; if (!(i in hooks.states)) hooks.states[i] = typeof initial === 'function' ? initial() : initial; const frame = hooks; return [frame.states[i], v => { assert.equal(frame.dead, false, 'State written after unmount'); frame.states[i] = typeof v === 'function' ? v(frame.states[i]) : v; }]; },
  useRef(initial) { const i = hooks.ri++; return hooks.refs[i] ?? (hooks.refs[i] = { current: initial }); },
  useCallback(fn, deps) { const i = hooks.mi++; if (!same(hooks.memos[i]?.deps, deps)) hooks.memos[i] = { fn, deps }; return hooks.memos[i].fn; },
  useEffect(effect, deps) { const i = hooks.ei++; if (!same(hooks.effects[i]?.deps, deps)) { const old = hooks.effects[i]; hooks.effects[i] = { deps }; hooks.pending.push(() => { old?.cleanup?.(); hooks.effects[i].cleanup = effect(); }); } },
};
globalThis.__subscriptionHooks = frames;
const sdk = createClient('https://fictional.supabase.co', 'fictional-key', { accessToken: async () => 'fictional', global: { fetch: async (input, options) => {
  const url = new URL(input), q = url.searchParams, table = url.pathname.split('/').at(-1), method = options.method ?? 'GET';
  assert.equal(url.origin, 'https://fictional.supabase.co'); assert.equal(method, 'GET', 'Subscription is SELECT-only'); assert.equal(table, 'profiles');
  assert.equal(q.get('select'), 'id,subscription_tier,subscription_status,connections_allowed,subscription_expires_at,updated_at'); assert.equal(q.get('id'), 'eq.' + accountId); assert.deepEqual([...q.keys()].sort(), ['id', 'select']); requests.push({ table, q, method });
  if (mode === 'failure') return Response.json({ message: 'PRIVATE-ERROR' }, { status: 403 });
  const data = profile ? [mode === 'foreign' ? { ...profile, id: other } : profile] : [];
  if (mode === 'pending') return new Promise(resolve => { release = () => resolve(Response.json(data)); });
  return Response.json(data);
} } });
globalThis.__subscriptionClient = { from: sdk.from.bind(sdk), auth: { getUser: () => auth(), onAuthStateChange: fn => { authEvents.add(fn); return { data: { subscription: { unsubscribe() { authEvents.delete(fn); } } } }; } } };
const hookSource = `import React from ${JSON.stringify(import.meta.resolve('react'))};export default React;export const {useState,useRef,useCallback,useEffect}=globalThis.__subscriptionHooks;`;
async function compile(entry, page = false) {
  const result = await build({ entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external', plugins: [{ name: 'offline-dashboard', setup(b) {
    b.onResolve({ filter: /^file:/ }, a => ({ path: a.path, external: true })); b.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'fixture' }));
    b.onResolve({ filter: /\/lib\/stripe$/ }, () => ({ path: 'stripe', namespace: 'fixture' }));
    b.onResolve({ filter: /(?:^|\/)lib\/supabase$|^\.\/supabase$/ }, () => ({ path: 'client', namespace: 'fixture' }));
    if (page) { b.onResolve({ filter: /\/useVerifiedWebsiteAccount$/ }, () => ({ path: 'account', namespace: 'fixture' })); b.onResolve({ filter: /\/SubscriptionWorkspace$/ }, () => ({ path: 'workspace', namespace: 'fixture' })); }
    b.onResolve({ filter: /(?:^|\/)(CustomerSetupStatus|CustomerCrmService|StreamingLoginHandoff|AdminShortcuts|PwaInstallBanner|InstallPrompt)$/ }, a => ({ path: a.path.split('/').at(-1), namespace: 'child' }));
    b.onLoad({ filter: /.*/, namespace: 'child' }, a => ({ contents: `import React from ${JSON.stringify(import.meta.resolve('react'))};export default function ChildFixture(props){return React.createElement('div',{'data-fixture':${JSON.stringify(a.path)},'data-owner':props.accountId});}` }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ contents: a.path === 'stripe' ? 'export const restoreSessionAfterStripe=()=>globalThis.__subscriptionRestore();' : a.path === 'hooks' ? hookSource : a.path === 'client' ? 'export const supabase=globalThis.__subscriptionClient;' : a.path === 'account' ? 'export const useVerifiedWebsiteAccount=()=>globalThis.__subscriptionAccount;' : 'export default function WorkspaceFixture(){return null;}' }));
  } }] }); const path = join(dir, `${++serial}.mjs`); await writeFile(path, result.outputFiles[0].text); return import(pathToFileURL(path));
}
function unmount() { for (const e of hooks?.effects ?? []) e?.cleanup?.(); if (hooks) hooks.dead = true; }
function reset() { unmount(); assert.equal(clock.size, 0); hooks = { states: [], refs: [], memos: [], effects: [], pending: [], si: 0, ri: 0, mi: 0, ei: 0, dead: false }; mode = 'normal'; auth = async () => verified(user()); profile = { id: accountId, subscription_tier: 'bronze', subscription_status: 'active', connections_allowed: 1, subscription_expires_at: '2026-11-12T22:45:08Z', updated_at: '2026-10-24T10:00:00Z' }; requests = []; restoreCalls = 0; restore = async () => { restoreCalls++; return true; }; globalThis.__subscriptionRestore = () => restore(); window.location = { search: '' }; }
function render(fn, props = { accountId }) { hooks.si = hooks.ri = hooks.mi = hooks.ei = 0; const tree = fn(props); for (const e of hooks.pending.splice(0)) e(); return tree; }
const drain = async () => { for (let i = 0; i < 12; i++) await new Promise(resolve => setImmediate(resolve)); };
const scope = () => ({ signal: new AbortController().signal, isCurrent: () => true });
const nodes = e => !React.isValidElement(e) ? [] : [e, ...React.Children.toArray(e.props.children).flatMap(nodes)];
const text = e => typeof e === 'string' ? e : React.isValidElement(e) ? React.Children.toArray(e.props.children).map(text).join('') : '';
const html = tree => renderToStaticMarkup(React.createElement(StaticRouter, {}, tree));
const button = (tree, label) => nodes(tree).find(n => n.type === 'button' && text(n) === label);
const emit = (name, event = {}) => { for (const fn of events.get(name) ?? []) fn(event); };
const expire = () => { for (const [key, fn] of [...clock]) { clock.delete(key); fn(); } };
try {
  globalThis.window = { setTimeout(fn, ms) { assert.equal(ms, 20000); const key = ++timerId; clock.set(key, fn); return key; }, clearTimeout(key) { clock.delete(key); }, scrollTo() {} };
  const { readWebsitePlan } = await compile('src/lib/website-plan.ts');
  reset(); let result = await readWebsitePlan(globalThis.__subscriptionClient, accountId, scope()); assert.equal(result.accountId, accountId); assert.equal(result.connections, 1);
  for (const u of [null, user({ id: other }), user({ is_anonymous: true }), user({ email_confirmed_at: null })]) { reset(); auth = async () => verified(u); await assert.rejects(readWebsitePlan(globalThis.__subscriptionClient, accountId, scope()), { code: 'changed' }); assert.equal(requests.length, 0); }
  for (const m of ['failure', 'foreign']) { reset(); mode = m; await assert.rejects(readWebsitePlan(globalThis.__subscriptionClient, accountId, scope()), { code: 'unavailable' }); }
  reset(); profile = null; await assert.rejects(readWebsitePlan(globalThis.__subscriptionClient, accountId, scope()), { code: 'missing' });
  for (const patch of [{ connections_allowed: '1' }, { subscription_expires_at: 'invalid' }, { updated_at: 'invalid' }]) { reset(); Object.assign(profile, patch); await assert.rejects(readWebsitePlan(globalThis.__subscriptionClient, accountId, scope()), { code: 'unavailable' }); }
  reset(); Object.assign(profile, { connections_allowed: null, subscription_expires_at: null, updated_at: null, subscription_status: null, subscription_tier: null }); result = await readWebsitePlan(globalThis.__subscriptionClient, accountId, scope()); assert.equal(result.connections, null); assert.equal(result.expiresAt, null);
  console.log('PASS: installed SDK uses only the six website-plan fields, exact current owner and SELECT; missing/failed/foreign/invalid rows stay distinct and unknown values never become one connection or an expiration.');
  const Workspace = (await compile('src/components/SubscriptionWorkspace.tsx')).default;
  const ready = async () => { render(Workspace); await drain(); return render(Workspace); };
  const service = tree => nodes(tree).find(n => n.props.onServiceStateChange);
  reset(); let tree = await ready(); assert.equal(service(tree).props.accountId, accountId); assert.doesNotMatch(html(tree), /Website Plan Access Period/);
  for (const status of ['loading', 'linked', 'unavailable', 'signed_out']) { service(tree).props.onServiceStateChange({ accountId, status }); tree = render(Workspace); assert.doesNotMatch(html(tree), /Website Plan Access Period/); }
  service(tree).props.onServiceStateChange({ accountId: other, status: 'unlinked' }); assert.doesNotMatch(html(render(Workspace)), /Website Plan Access Period/);
  service(tree).props.onServiceStateChange({ accountId, status: 'unlinked' }); tree = render(Workspace); assert.match(html(tree), /Website Plan Access Period/); assert.match(html(tree), /Website record updated/); assert.doesNotMatch(html(tree), /Started \/ Updated|Time Remaining|<table|No Active Website Plan/);
  reset(); profile = null; tree = await ready(); assert.ok(service(tree)); service(tree).props.onServiceStateChange({ accountId, status: 'linked' }); tree = render(Workspace); assert.ok(service(tree)); assert.doesNotMatch(html(tree), /record was not found|No Active Website Plan/); service(tree).props.onServiceStateChange({ accountId, status: 'unlinked' }); assert.match(html(render(Workspace)), /record was not found/);
  reset(); mode = 'failure'; tree = await ready(); service(tree).props.onServiceStateChange({ accountId, status: 'unlinked' }); assert.match(html(render(Workspace)), /could not be checked/); assert.doesNotMatch(html(render(Workspace)), /PRIVATE-|No Active Website Plan/);
  console.log('PASS: actual workspace checks streaming service without a profile; only confirmed unlinked/hidden service states expose clearly scoped website data, never a failed service/profile read or a foreign callback.');
  reset(); tree = await ready(); const old = service(tree); old.props.onServiceStateChange({ accountId, status: 'hidden' }); tree = render(Workspace); assert.match(html(tree), /Website Plan Access Period/); button(tree, 'Refresh subscription').props.onClick(); tree = render(Workspace); assert.notEqual(service(tree).key, old.key); old.props.onServiceStateChange({ accountId, status: 'hidden' }); assert.doesNotMatch(html(render(Workspace)), /Website Plan Access Period/); await drain();
  tree = render(Workspace); service(tree).props.onServiceStateChange({ accountId, status: 'unlinked' }); assert.match(html(render(Workspace)), /Website Plan Access Period/);
  tree = render(Workspace, { accountId: other }); assert.doesNotMatch(html(tree), /Website Plan Access Period/); await drain();
  console.log('PASS: refresh resets service/profile checks, remounts the captured owner and ignores callbacks from the previous check; changed-owner snapshots cannot render.');
  reset(); mode = 'pending'; render(Workspace); await drain(); expire(); tree = render(Workspace); service(tree).props.onServiceStateChange({ accountId, status: 'unlinked' }); assert.match(html(render(Workspace)), /could not be checked/); release(); await drain(); assert.doesNotMatch(html(render(Workspace)), /Website record updated/);
  reset(); mode = 'pending'; render(Workspace); await drain(); unmount(); release(); await drain();
  reset(); window.location.search = '?success=true'; let finish; restore = () => { restoreCalls++; return new Promise(resolve => { finish = resolve; }); }; render(Workspace); assert.equal(restoreCalls, 1); unmount(); finish(true); await drain(); assert.equal(requests.length, 0);
  reset(); window.location.search = '?success=true'; await ready(); assert.equal(restoreCalls, 1); assert.equal(requests.length, 1);
  console.log('PASS: profile deadlines, unmounts and delayed checkout restoration cannot revive an old read; the existing checkout-return helper remains scoped to success=true and reverified ownership.');
  const Page = (await compile('src/pages/client/ClientSubscription.tsx', true)).default;
  for (const status of ['loading', 'unavailable', 'signed_out', 'unconfirmed', 'ready']) { reset(); globalThis.__subscriptionAccount = { status, accountId: status === 'ready' ? accountId : null, retry() {} }; tree = render(Page); assert.equal(tree.type?.name === 'WorkspaceFixture', status === 'ready'); if (status === 'ready') assert.equal(tree.key, accountId); assert.equal(requests.length, 0); }
  console.log('PASS: only a verified confirmed owner mounts the keyed Subscription workspace; other states offer recovery without private reads. All identities, transport and records were fictional.');
} finally { unmount(); await drain(); if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow; for (const name of ['__subscriptionHooks', '__subscriptionClient', '__subscriptionAccount', '__subscriptionRestore']) delete globalThis[name]; await rm(dir, { recursive: true, force: true }); }
