import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { StaticRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { createClient } from '@supabase/supabase-js';

const dir = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-dashboard-'));
const originalWindow = globalThis.window, originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
const id = n => `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, '0')}`;
const accountId = id(1), other = id(2), clock = new Map(), events = new Map(), authEvents = new Set();
let mode, auth, requests, records, profile, hooks, release, serial = 0, timerId = 0, standalone = false;
const user = (patch = {}) => ({ id: accountId, email: 'ordinary@example.invalid', is_anonymous: false, email_confirmed_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', ...patch });
const verified = u => ({ data: { user: u }, error: null });
const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
const frames = {
  useState(initial) { const i = hooks.si++; if (!(i in hooks.states)) hooks.states[i] = typeof initial === 'function' ? initial() : initial; const frame = hooks; return [frame.states[i], v => { assert.equal(frame.dead, false, 'State written after unmount'); frame.states[i] = typeof v === 'function' ? v(frame.states[i]) : v; }]; },
  useRef(initial) { const i = hooks.ri++; return hooks.refs[i] ?? (hooks.refs[i] = { current: initial }); },
  useCallback(fn, deps) { const i = hooks.mi++; if (!same(hooks.memos[i]?.deps, deps)) hooks.memos[i] = { fn, deps }; return hooks.memos[i].fn; },
  useEffect(effect, deps) { const i = hooks.ei++; if (!same(hooks.effects[i]?.deps, deps)) { const old = hooks.effects[i]; hooks.effects[i] = { deps }; hooks.pending.push(() => { old?.cleanup?.(); hooks.effects[i].cleanup = effect(); }); } },
};
globalThis.__dashboardHooks = frames;
const sdk = createClient('https://fictional.supabase.co', 'fictional-key', { accessToken: async () => 'fictional', global: { fetch: async (input, options) => {
  const url = new URL(input), q = url.searchParams, table = url.pathname.split('/').at(-1), method = options.method ?? 'GET';
  assert.equal(url.origin, 'https://fictional.supabase.co'); assert.ok(['GET', 'HEAD'].includes(method), 'Dashboard is SELECT-only'); requests.push({ table, q, method });
  if (table === 'profiles') { assert.equal(method, 'GET'); assert.equal(q.get('select'), 'id,full_name,updated_at'); assert.equal(q.get('id'), 'eq.' + accountId); return Response.json(profile ? [profile] : []); }
  assert.equal(table, 'support_tickets'); assert.equal(q.get('user_id'), 'eq.' + accountId);
  if (method === 'HEAD') {
    assert.equal(q.get('select'), 'id'); assert.deepEqual(q.getAll('status'), ['not.ilike.closed', 'not.ilike.resolved']); assert.equal(new Headers(options.headers).get('prefer'), 'count=exact');
    if (mode === 'countFailure') return new Response(null, { status: 403 });
    return new Response(null, { status: 200, headers: mode === 'missingCount' ? {} : { 'content-range': `*/${records.filter(r => !['closed', 'resolved'].includes(r.status.toLowerCase())).length}` } });
  }
  assert.equal(q.get('select'), 'id,user_id,subject,status,priority,created_at'); assert.equal(q.get('order'), 'created_at.desc,id.desc'); assert.equal(q.get('limit'), '5');
  if (mode === 'listFailure') return Response.json({ message: 'PRIVATE-ERROR' }, { status: 403 });
  let data = records.slice(0, 5); if (mode === 'foreign') data = data.map(r => ({ ...r, user_id: other })); if (mode === 'duplicate') data[1] = data[0];
  if (mode === 'pending') return new Promise(resolve => { release = () => resolve(Response.json(data)); });
  return Response.json(data);
} } });
globalThis.__dashboardClient = { from: sdk.from.bind(sdk), auth: { getUser: () => auth(), onAuthStateChange: fn => { authEvents.add(fn); return { data: { subscription: { unsubscribe() { authEvents.delete(fn); } } } }; } } };
const hookSource = `import React from ${JSON.stringify(import.meta.resolve('react'))};export default React;export const {useState,useRef,useCallback,useEffect}=globalThis.__dashboardHooks;`;
async function compile(entry, page = false) {
  const result = await build({ entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external', plugins: [{ name: 'offline-dashboard', setup(b) {
    b.onResolve({ filter: /^file:/ }, a => ({ path: a.path, external: true })); b.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'fixture' }));
    b.onResolve({ filter: /(?:^|\/)lib\/supabase$|^\.\/supabase$/ }, () => ({ path: 'client', namespace: 'fixture' }));
    if (page) { b.onResolve({ filter: /\/useVerifiedWebsiteAccount$/ }, () => ({ path: 'account', namespace: 'fixture' })); b.onResolve({ filter: /\/DashboardWorkspace$/ }, () => ({ path: 'workspace', namespace: 'fixture' })); }
    b.onResolve({ filter: /(?:^|\/)(CustomerSetupStatus|CustomerCrmService|StreamingLoginHandoff|AdminShortcuts|PwaInstallBanner|InstallPrompt)$/ }, a => ({ path: a.path.split('/').at(-1), namespace: 'child' }));
    b.onLoad({ filter: /.*/, namespace: 'child' }, a => ({ contents: `import React from ${JSON.stringify(import.meta.resolve('react'))};export default function ChildFixture(props){return React.createElement('div',{'data-fixture':${JSON.stringify(a.path)},'data-owner':props.accountId});}` }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ contents: a.path === 'hooks' ? hookSource : a.path === 'client' ? 'export const supabase=globalThis.__dashboardClient;' : a.path === 'account' ? 'export const useVerifiedWebsiteAccount=()=>globalThis.__dashboardAccount;' : 'export default function WorkspaceFixture(){return null;}' }));
  } }] }); const path = join(dir, `${++serial}.mjs`); await writeFile(path, result.outputFiles[0].text); return import(pathToFileURL(path));
}
function unmount() { for (const e of hooks?.effects ?? []) e?.cleanup?.(); if (hooks) hooks.dead = true; }
function reset() { unmount(); assert.equal(clock.size, 0); hooks = { states: [], refs: [], memos: [], effects: [], pending: [], si: 0, ri: 0, mi: 0, ei: 0, dead: false }; mode = 'normal'; auth = async () => verified(user()); profile = { id: accountId, full_name: '<img src=x>', updated_at: '2026-10-24T10:00:00Z' }; requests = []; records = Array.from({ length: 1205 }, (_, i) => ({ id: id(2000 - i), user_id: accountId, subject: `Fictional ticket ${i}`, status: i % 3 === 0 ? 'CLOSED' : i % 3 === 1 ? 'resolved' : 'open', priority: 'normal', created_at: '2026-10-24T09:00:00Z' })); standalone = false; }
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
  globalThis.window = { setTimeout(fn, ms) { assert.equal(ms, 20000); const key = ++timerId; clock.set(key, fn); return key; }, clearTimeout(key) { clock.delete(key); }, scrollTo() {}, matchMedia() { return { matches: standalone }; }, addEventListener(name, fn) { if (!events.has(name)) events.set(name, new Set()); events.get(name).add(fn); }, removeEventListener(name, fn) { events.get(name)?.delete(fn); } };
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Fictional Android' }, configurable: true });
  const { readDashboardTickets } = await compile('src/lib/support-tickets.ts');
  reset(); let result = await readDashboardTickets(globalThis.__dashboardClient, accountId, scope()); assert.equal(result.tickets.length, 5); assert.equal(result.activeCount, 401); assert.equal(requests.length, 2);
  for (const m of ['listFailure', 'countFailure', 'missingCount', 'foreign', 'duplicate']) { reset(); mode = m; await assert.rejects(readDashboardTickets(globalThis.__dashboardClient, accountId, scope()), { code: 'unavailable' }); }
  reset(); auth = async () => verified(user({ id: other })); await assert.rejects(readDashboardTickets(globalThis.__dashboardClient, accountId, scope()), { code: 'changed' }); assert.equal(requests.length, 0);
  reset(); records = []; result = await readDashboardTickets(globalThis.__dashboardClient, accountId, scope()); assert.deepEqual(result, { tickets: [], activeCount: 0 });
  console.log('PASS: installed SDK uses a bounded five-ticket projection and independent exact owner-filtered HEAD count across 1,205 rows, excludes closed/resolved case-insensitively and rejects foreign/duplicate/failed/missing-count results.');
  const components = await compile('src/components/DashboardWorkspace.tsx'), Summary = components.DashboardTicketSummary, Workspace = components.default;
  reset(); render(Summary); await drain(); let tree = render(Summary); assert.equal(nodes(tree).filter(n => n.type === 'li').length, 5); assert.match(html(tree), />401<\/strong>/);
  const link = nodes(tree).find(n => n.props.state?.ticketId); assert.equal(link.props.state.ticketId, id(2000)); assert.equal(link.props.to, '/client/support'); assert.doesNotMatch(html(tree), /description|<table|Active Devices|Unread/);
  reset(); mode = 'listFailure'; render(Summary); await drain(); tree = render(Summary); assert.match(html(tree), /could not be loaded/); assert.doesNotMatch(html(tree), /No support tickets|Active support tickets:|PRIVATE-/); mode = 'normal'; button(tree, 'Refresh tickets').props.onClick(); await drain(); assert.match(html(render(Summary)), />401<\/strong>/);
  reset(); mode = 'pending'; render(Summary); await drain(); expire(); assert.match(html(render(Summary)), /could not be loaded/); release(); await drain(); assert.doesNotMatch(html(render(Summary)), /Fictional ticket/);
  console.log('PASS: actual dashboard summary shows only five accessible exact-ticket links, distinguishes empty/error, discards timed-out results and recovers without falsely reporting zero activity.');
  reset(); render(Workspace); await drain(); tree = render(Workspace); let markup = html(tree); assert.match(markup, /&lt;img/); assert.doesNotMatch(markup, /<img|AdminShortcuts|Website plan:|simultaneous connection/);
  const children = nodes(tree).filter(n => n.props.accountId === accountId); assert.equal(children.length, 4); assert.ok(children.some(n => n.key === '.$crm-' + accountId));
  reset(); auth = async () => verified(user({ email: 'djudge47@gmail.com' })); render(Workspace); await drain(); assert.match(html(render(Workspace)), /AdminShortcuts/);
  reset(); profile = null; render(Workspace); await drain(); markup = html(render(Workspace)); assert.match(markup, /profile was not found/); assert.match(markup, /CustomerCrmService/); assert.match(markup, /Manage my account/); assert.doesNotMatch(markup, /AdminShortcuts/); assert.ok(requests.every(r => ['GET', 'HEAD'].includes(r.method)));
  const Page = (await compile('src/pages/Dashboard.tsx', true)).default;
  for (const status of ['loading', 'unavailable', 'signed_out', 'unconfirmed', 'ready']) { reset(); globalThis.__dashboardAccount = { status, accountId: status === 'ready' ? accountId : null, retry() {} }; tree = render(Page); const workspace = nodes(tree).find(n => n.type?.name === 'WorkspaceFixture'); assert.equal(Boolean(workspace), status === 'ready'); if (workspace) assert.equal(workspace.key, '.$' + accountId); }
  console.log('PASS: profile failures do not hide linked-service/help sections or create records; Auth email controls shortcuts; the page keys all private workspace state to the verified owner and removes conflicting website-plan counters.');
  const { useVerifiedWebsiteAccount: useAccount } = await compile('src/lib/useVerifiedWebsiteAccount.ts');
  reset(); let late; auth = () => new Promise(resolve => { late = resolve; }); render(useAccount); expire(); assert.equal(render(useAccount).status, 'unavailable'); late(verified(user())); await drain(); assert.equal(render(useAccount).status, 'unavailable'); auth = async () => verified(user()); await render(useAccount).retry(); assert.equal(render(useAccount).accountId, accountId); unmount(); assert.equal(authEvents.size, 0);
  console.log('PASS: the shared verified-account hook leaves a stalled check after twenty seconds, ignores its late result, retries safely and removes its listener/timer.');
  const Banner = (await compile('src/components/PwaInstallBanner.tsx')).default;
  const offer = (prompt, userChoice) => { const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt, userChoice }); emit('beforeinstallprompt', event); return event; };
  reset(); render(Banner); let calls = 0, choice; offer(async () => { calls++; }, new Promise(resolve => { choice = resolve; })); tree = render(Banner); button(tree, 'Add Website').props.onClick(); button(tree, 'Add Website').props.onClick(); assert.equal(calls, 1); choice({ outcome: 'accepted' }); await drain(); tree = render(Banner); assert.match(html(tree), /installation requested/); assert.notEqual(tree, null); assert.equal(nodes(tree).filter(n => n.props.to).length, 3); for (const link of nodes(tree).filter(n => n.props.to)) assert.match(link.props.className, /min-h-14/); emit('appinstalled'); assert.equal(render(Banner), null);
  reset(); render(Banner); offer(async () => { throw Error('PRIVATE-PROMPT'); }, Promise.resolve({ outcome: 'accepted' })); button(render(Banner), 'Add Website').props.onClick(); await drain(); assert.match(html(render(Banner)), /could not be confirmed/); assert.doesNotMatch(html(render(Banner)), /PRIVATE-/);
  reset(); render(Banner); let finish; offer(() => new Promise(resolve => { finish = resolve; }), Promise.resolve({ outcome: 'accepted' })); button(render(Banner), 'Add Website').props.onClick(); unmount(); finish(); await drain();
  reset(); standalone = true; render(Banner); assert.equal(render(Banner), null); unmount(); assert.ok([...events.values()].every(set => set.size === 0));
  const source = await readFile('src/pages/Dashboard.tsx', 'utf8'); assert.ok(!/subscribeToTickets|unreadCount|\.insert\(|console\./.test(source));
  console.log('PASS: the actual shortcut card preserves three spaced links, coalesces prompts, treats acceptance as a request, waits for installation evidence and safely handles failure/unmount. No connected write or notification occurred.');
} finally { unmount(); await drain(); if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow; if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator); else delete globalThis.navigator; for (const name of ['__dashboardHooks', '__dashboardClient', '__dashboardAccount']) delete globalThis[name]; await rm(dir, { recursive: true, force: true }); }
