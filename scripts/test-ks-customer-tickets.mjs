import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { StaticRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { createClient } from '@supabase/supabase-js';

const dir = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-tickets-'));
const originalWindow = globalThis.window, originalFetch = globalThis.fetch;
const id = n => `99999999-9999-4999-8999-${String(n).padStart(12, '0')}`;
const accountId = id(1), ticketId = id(100), other = id(2);
const user = (patch = {}) => ({ id: accountId, email_confirmed_at: '2026-01-01T00:00:00Z', is_anonymous: false, ...patch });
const verified = u => ({ data: { user: u }, error: null });
const ticket = n => ({ id: id(n), user_id: accountId, subject: `Fictional ticket ${n}`, description: 'Fictional problem <img src=x>', status: 'open', priority: 'normal', category: 'Technical Issue', created_at: '2026-10-24T08:00:00Z' });
const reply = n => ({ id: id(n), ticket_id: ticketId, user_id: n % 2 ? other : accountId, message: `Fictional reply ${n}`, is_staff: Boolean(n % 2), delivery_status: n % 2 ? 'sent' : 'not_requested', created_at: '2026-10-24T09:00:00Z' });
let mode, auth, requests, release, rows, messages, hooks, serial = 0;
let session, navigations; const listeners = new Set();
const timers = new Map(); let timerId = 0;
const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
const frames = {
  useState(initial) { const i = hooks.si++; if (!(i in hooks.states)) hooks.states[i] = typeof initial === 'function' ? initial() : initial; const frame = hooks; return [frame.states[i], v => { assert.equal(frame.dead, false, 'State written after unmount'); frame.states[i] = typeof v === 'function' ? v(frame.states[i]) : v; }]; },
  useRef(initial) { const i = hooks.ri++; return hooks.refs[i] ?? (hooks.refs[i] = { current: initial }); },
  useCallback(fn, deps) { const i = hooks.mi++; if (!same(hooks.memos[i]?.deps, deps)) hooks.memos[i] = { fn, deps }; return hooks.memos[i].fn; },
  useEffect(effect, deps) { const i = hooks.ei++; if (!same(hooks.effects[i]?.deps, deps)) { const old = hooks.effects[i]; hooks.effects[i] = { deps }; hooks.pending.push(() => { old?.cleanup?.(); hooks.effects[i].cleanup = effect(); }); } },
};
globalThis.__ticketHooks = frames;
const sdk = createClient('https://fictional.supabase.co', 'fictional-key', { accessToken: async () => 'fictional-token', global: { fetch: async (input, options) => {
  const url = new URL(input), method = options.method ?? 'GET', table = url.pathname.split('/').at(-1), query = url.searchParams;
  assert.equal(url.origin, 'https://fictional.supabase.co'); assert.ok(['support_tickets', 'ticket_replies'].includes(table));
  const body = options.body ? JSON.parse(options.body) : null; requests.push({ table, query, method, body });
  const projection = table === 'support_tickets' ? 'id,user_id,subject,description,status,priority,category,created_at' : 'id,ticket_id,user_id,message,is_staff,delivery_status,created_at'; assert.equal(query.get('select'), projection);
  const response = value => Response.json(new Headers(options.headers).get('accept')?.includes('object') ? value[0] ?? null : value);
  if (method === 'POST') {
    if (table === 'support_tickets') {
      assert.deepEqual(Object.keys(body).sort(), ['category', 'description', 'priority', 'status', 'subject', 'user_id']); assert.equal(body.user_id, accountId); assert.equal(body.status, 'open');
      const saved = { ...ticket(6000), ...body }; rows.unshift(saved);
      if (mode === 'lost') throw Error('PRIVATE-LOST-CREATE');
      if (mode === 'writePending') return new Promise(resolve => { release = () => resolve(response([saved])); });
      return response(mode === 'emptyInsert' ? [] : [mode === 'wrongReturn' ? { ...saved, user_id: other } : saved]);
    }
    assert.equal(table, 'ticket_replies'); assert.deepEqual(Object.keys(body).sort(), ['is_staff', 'message', 'ticket_id', 'user_id']); assert.equal(body.user_id, accountId); assert.equal(body.ticket_id, ticketId); assert.equal(body.is_staff, false);
    const saved = { ...reply(5000), ...body }; messages.unshift(saved);
    if (mode === 'lost') throw Error('PRIVATE-RESPONSE-LOST');
    if (mode === 'writePending') return new Promise(resolve => { release = () => resolve(response([saved])); });
    return response(mode === 'emptyInsert' ? [] : [mode === 'wrongReturn' ? { ...saved, ticket_id: id(101) } : saved]);
  }
  assert.equal(method, 'GET');
  let values;
  if (table === 'support_tickets') {
    assert.equal(query.get('user_id'), 'eq.' + accountId);
    values = query.has('id') ? rows.filter(t => query.get('id') === 'eq.' + t.id) : rows;
    if (mode === 'foreign') values = values.map(t => ({ ...t, user_id: other }));
  } else { assert.equal(query.get('ticket_id'), 'eq.' + ticketId); values = mode === 'wrongTicket' ? messages.map(r => ({ ...r, ticket_id: id(101) })) : messages; }
  if (!query.has('id')) {
    assert.equal(query.get('order'), 'created_at.desc,id.desc');
    const size = table === 'support_tickets' ? 5 : 20; assert.equal(query.get('limit'), String(size + 1));
    const offset = Number(query.get('offset') ?? 0); values = values.slice(offset, offset + size + 1);
  }
  if (mode === 'failure') return Response.json({ message: 'PRIVATE-FAILURE' }, { status: 403 });
  if (mode === 'readPending') return new Promise(resolve => { release = () => resolve(response(values)); });
  if (mode === 'duplicate' && values.length > 1) values[1] = values[0];
  return response(values);
} } });
globalThis.__ticketClient = { from: sdk.from.bind(sdk), auth: { getUser: () => auth(), getSession: () => session(), onAuthStateChange: fn => { listeners.add(fn); return { data: { subscription: { unsubscribe() { listeners.delete(fn); } } } }; } } };
const hookSource = `import React from ${JSON.stringify(import.meta.resolve('react'))};export default React;export const {useState,useRef,useCallback,useEffect}=globalThis.__ticketHooks;`;
async function compile(entry, page = false) {
  const output = await build({ entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external', plugins: [{ name: 'ticket-fixtures', setup(b) {
    if ((entry.endsWith('/NewTicket.tsx') || entry.endsWith('/ClientSupport.tsx'))) b.onResolve({ filter: /^react-router-dom$/ }, () => ({ path: 'router', namespace: 'fixture' }));
    b.onResolve({ filter: /^file:/ }, a => ({ path: a.path, external: true })); b.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'fixture' }));
    b.onResolve({ filter: /(?:^|\/)lib\/supabase$/ }, () => ({ path: 'client', namespace: 'fixture' }));
    if (page) { b.onResolve({ filter: /\/useVerifiedWebsiteAccount$/ }, () => ({ path: 'account', namespace: 'fixture' })); b.onResolve({ filter: /\/SupportTicketWorkspace$/ }, () => ({ path: 'workspace', namespace: 'fixture' })); }
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ contents: a.path === 'router' ? `import React from ${JSON.stringify(import.meta.resolve('react'))};export const Link=({to,state,...props})=>React.createElement('a',{...props,href:to});export const useLocation=()=>globalThis.__newTicketLocation;export const useNavigate=()=>globalThis.__newTicketNavigate;` : a.path === 'hooks' ? hookSource : a.path === 'client' ? 'export const supabase=globalThis.__ticketClient;' : a.path === 'account' ? 'export const useVerifiedWebsiteAccount=()=>globalThis.__ticketAccount;' : 'export default function WorkspaceFixture(){return null;}' }));
  } }] }); const path = join(dir, `${++serial}.mjs`); await writeFile(path, output.outputFiles[0].text); return import(pathToFileURL(path));
}
function unmount() { for (const e of hooks?.effects ?? []) e?.cleanup?.(); if (hooks) hooks.dead = true; }
function reset() { unmount(); assert.equal(timers.size, 0); hooks = { states: [], refs: [], memos: [], effects: [], pending: [], si: 0, ri: 0, mi: 0, ei: 0, dead: false }; mode = 'normal'; auth = async () => verified(user()); session = async () => ({ data: { session: { user: user(), access_token: 'fictional' } }, error: null }); navigations = []; globalThis.__newTicketLocation = { state: null }; globalThis.__newTicketNavigate = (...args) => navigations.push(args); requests = []; rows = Array.from({ length: 1205 }, (_, i) => ticket(100 + i)); messages = Array.from({ length: 45 }, (_, i) => reply(1000 - i)); release = null; }
function render(fn, props = { accountId }) { hooks.si = hooks.ri = hooks.mi = hooks.ei = 0; const tree = fn(props); for (const e of hooks.pending.splice(0)) e(); return tree; }
const drain = async () => { for (let i = 0; i < 12; i++) await new Promise(resolve => setImmediate(resolve)); };
const scope = () => ({ signal: new AbortController().signal, isCurrent: () => true });
const nodes = e => !React.isValidElement(e) ? [] : [e, ...React.Children.toArray(e.props.children).flatMap(nodes)];
const text = e => typeof e === 'string' ? e : React.isValidElement(e) ? React.Children.toArray(e.props.children).map(text).join('') : '';
const button = (tree, label) => nodes(tree).find(n => n.type === 'button' && text(n) === label);
const html = tree => renderToStaticMarkup(React.createElement(StaticRouter, {}, tree));
const submit = tree => nodes(tree).find(n => n.type === 'form').props.onSubmit({ preventDefault() {} });
try {
  globalThis.window = { setTimeout(fn, ms) { assert.equal(ms, 20000); const key = ++timerId; timers.set(key, fn); return key; }, clearTimeout(key) { timers.delete(key); } };
  const { readSupportTickets, readSupportThread, saveSupportReply, createSupportTicket } = await compile('src/lib/support-tickets.ts');
  reset(); let page = await readSupportTickets(globalThis.__ticketClient, accountId, 0, scope()); assert.equal(page.items.length, 5); assert.equal(page.hasMore, true);
  page = await readSupportTickets(globalThis.__ticketClient, accountId, 240, scope()); assert.equal(page.items[0].id, id(1300)); assert.equal(page.items.length, 5); assert.equal(page.hasMore, false);
  let thread = await readSupportThread(globalThis.__ticketClient, accountId, ticketId, 0, scope()); assert.equal(thread.items.length, 20); assert.equal(thread.items[0].id, id(981)); assert.equal(thread.items[19].id, id(1000)); assert.equal(thread.hasMore, true);
  thread = await readSupportThread(globalThis.__ticketClient, accountId, ticketId, 2, scope()); assert.equal(thread.items.length, 5); assert.equal(thread.hasMore, false);
  for (const m of ['failure', 'foreign', 'duplicate']) { reset(); mode = m; await assert.rejects(readSupportTickets(globalThis.__ticketClient, accountId, 0, scope()), { code: 'unavailable' }); }
  reset(); mode = 'wrongTicket'; await assert.rejects(readSupportThread(globalThis.__ticketClient, accountId, ticketId, 0, scope()), { code: 'unavailable' });
  reset(); rows = []; await assert.rejects(readSupportThread(globalThis.__ticketClient, accountId, ticketId, 0, scope()), { code: 'missing' }); assert.equal(requests.length, 1);
  console.log('PASS: installed SDK projects only ticket/thread fields, filters the owner and selected ticket, pages beyond 1,000 tickets and through all replies, and separates missing/failed/foreign/malformed results.');
  reset(); const saved = await saveSupportReply(globalThis.__ticketClient, accountId, ticketId, '  Fictional saved reply  ', scope()); assert.equal(saved.message, 'Fictional saved reply'); assert.equal(requests.filter(r => r.method === 'POST').length, 1);
  for (const m of ['lost', 'emptyInsert', 'wrongReturn']) { reset(); mode = m; await assert.rejects(saveSupportReply(globalThis.__ticketClient, accountId, ticketId, 'Fictional saved reply', scope()), { code: 'uncertain' }); assert.equal(requests.filter(r => r.method === 'POST').length, 1); }
  for (const u of [user({ id: other }), user({ is_anonymous: true }), user({ email_confirmed_at: null }), null]) { reset(); auth = async () => verified(u); await assert.rejects(saveSupportReply(globalThis.__ticketClient, accountId, ticketId, 'No write', scope()), { code: 'changed' }); assert.equal(requests.length, 0); }
  reset(); const before = requests.length; await assert.rejects(saveSupportReply(globalThis.__ticketClient, accountId, ticketId, 'x'.repeat(4001), scope()), { code: 'invalid' }); assert.equal(requests.length, before);
  reset(); let resolveAuth; auth = () => new Promise(resolve => { resolveAuth = resolve; }); const control = new AbortController(); const pending = saveSupportReply(globalThis.__ticketClient, accountId, ticketId, 'No stale write', { signal: control.signal, isCurrent: () => true }); control.abort(); resolveAuth(verified(user())); await assert.rejects(pending, { code: 'changed' }); assert.equal(requests.length, 0);
  console.log('PASS: replies reverify the confirmed owner and ticket before the four-field insert, require its exact returned row, bound messages and never retry an uncertain write.');
  const Workspace = (await compile('src/components/SupportTicketWorkspace.tsx')).default;
  reset(); render(Workspace); await drain(); let tree = render(Workspace); assert.equal(nodes(tree).filter(n => n.type === 'li').length, 5); button(tree, 'Next').props.onClick(); tree = render(Workspace); assert.doesNotMatch(html(tree), /Fictional ticket 100/); await drain(); tree = render(Workspace); assert.match(html(tree), /Fictional ticket 105/); assert.doesNotMatch(html(tree), /Fictional problem/);
  nodes(tree).find(n => n.type === 'button' && text(n).includes('Fictional ticket 105')).props.onClick(); tree = render(Workspace); const selected = nodes(tree).find(n => n.props.ticketId); assert.equal(selected.props.ticketId, id(105)); assert.equal(selected.key, accountId + ':' + id(105));
  reset(); mode = 'failure'; render(Workspace); await drain(); tree = render(Workspace); assert.match(html(tree), /could not be loaded/); assert.doesNotMatch(html(tree), /No support tickets|PRIVATE-/);
  console.log('PASS: actual directory renders five accessible ticket buttons, clears stale pages, opens the exact keyed thread and does not turn failures into an empty list.');
  const Thread = (await compile('src/components/SupportTicketThread.tsx')).default;
  const props = { accountId, ticketId, onBack() {} };
  const ready = async () => { render(Thread, props); await drain(); return render(Thread, props); };
  const edit = value => { let t = render(Thread, props); nodes(t).find(n => n.type === 'textarea').props.onChange({ target: { value } }); return render(Thread, props); };
  reset(); tree = await ready(); assert.equal(nodes(tree).filter(n => n.type === 'li').length, 20); assert.doesNotMatch(html(tree), /<img/); assert.match(html(tree), /&lt;img/); button(tree, 'Earlier replies').props.onClick(); tree = render(Thread, props); assert.doesNotMatch(html(tree), /Fictional reply 1000/); await drain(); tree = render(Thread, props); assert.equal(nodes(tree).filter(n => n.type === 'li').length, 20);
  reset(); await ready(); tree = edit('Fictional saved reply'); mode = 'writePending'; submit(tree); submit(tree); await drain(); tree = render(Thread, props); assert.equal(requests.filter(r => r.method === 'POST').length, 1); assert.equal(button(tree, 'Back to tickets').props.disabled, true); assert.equal(nodes(tree).find(n => n.type === 'textarea').props.disabled, true); release(); await drain(); assert.match(html(render(Thread, props)), /Reply saved in your ticket/); assert.equal(nodes(render(Thread, props)).find(n => n.type === 'textarea').props.value, '');
  reset(); await ready(); tree = edit('Fictional saved reply'); mode = 'lost'; submit(tree); await drain(); tree = render(Thread, props); assert.match(html(tree), /may have been saved/); assert.equal(button(tree, 'Save reply').props.disabled, true); submit(tree); await drain(); assert.equal(requests.filter(r => r.method === 'POST').length, 1); assert.equal(button(tree, 'I checked the conversation — start a new reply'), undefined); mode = 'normal'; button(tree, 'Refresh conversation').props.onClick(); await drain(); tree = render(Thread, props); assert.match(html(tree), /Fictional saved reply/); button(tree, 'I checked the conversation — start a new reply').props.onClick(); tree = render(Thread, props); assert.equal(nodes(tree).find(n => n.type === 'textarea').props.value, ''); assert.equal(button(tree, 'Save reply').props.disabled, true);
  console.log('PASS: actual thread pages without mixing messages, escapes text, coalesces duplicate saves and requires refreshed conversation plus explicit new-draft action after uncertainty.');
  reset(); await ready(); tree = edit('Timed out'); mode = 'writePending'; submit(tree); await drain(); [...timers.values()][0](); tree = render(Thread, props); assert.match(html(tree), /may have been saved/); release(); await drain(); assert.doesNotMatch(html(render(Thread, props)), /Reply saved in your ticket/);
  reset(); mode = 'readPending'; render(Thread, props); await drain(); [...timers.values()][0](); assert.match(html(render(Thread, props)), /could not be loaded/); release(); await drain(); assert.doesNotMatch(html(render(Thread, props)), /Fictional problem/);
  reset(); mode = 'readPending'; render(Thread, props); await drain(); unmount(); release(); await drain();
  reset(); await ready(); tree = edit('Late'); mode = 'writePending'; submit(tree); await drain(); unmount(); release(); await drain();
  reset(); await ready(); tree = edit('Changed'); auth = async () => verified(user({ id: other })); submit(tree); await drain(); assert.doesNotMatch(html(render(Thread, props)), /Fictional problem|Fictional reply/); assert.equal(requests.filter(r => r.method === 'POST').length, 0);
  const { useSupportRead } = await compile('src/lib/useSupportRead.ts');
  reset(); let lateRead; const oldLoader = () => new Promise(resolve => { lateRead = resolve; }), newLoader = async () => 'Current ticket';
  render(() => useSupportRead('old-ticket', oldLoader));
  assert.equal(render(() => useSupportRead('current-ticket', newLoader)).status, 'loading'); await drain();
  lateRead('Old ticket reply'); await drain(); assert.equal(render(() => useSupportRead('current-ticket', newLoader)).value, 'Current ticket');
  console.log('PASS: read/save deadlines, changed owners, unmounts and late responses cannot restore an old conversation or release a second write.');
  const Page = (await compile('src/pages/client/ClientSupport.tsx', true)).default;
  for (const status of ['loading', 'unavailable', 'signed_out', 'unconfirmed', 'ready']) { reset(); globalThis.__ticketAccount = { status, accountId: status === 'ready' ? accountId : null, retry() {} }; tree = render(Page); const workspace = nodes(tree).find(n => n.type?.name === 'WorkspaceFixture'); assert.equal(Boolean(workspace), status === 'ready'); if (workspace) assert.equal(workspace.key, '.$' + accountId); }
  console.log('PASS: only the current verified owner mounts a keyed workspace; sign-in/confirmation/failure states never query private tickets. All records and HTTP responses were fictional.');
  const input = { subject: '  Fictional new ticket  ', description: '  Fictional description  ', category: 'Billing', priority: 'normal' };
  reset(); const created = await createSupportTicket(globalThis.__ticketClient, accountId, input, scope()); assert.equal(created.subject, 'Fictional new ticket'); assert.equal(created.description, 'Fictional description');
  for (const m of ['lost', 'emptyInsert', 'wrongReturn']) { reset(); mode = m; await assert.rejects(createSupportTicket(globalThis.__ticketClient, accountId, input, scope()), { code: 'uncertain' }); assert.equal(requests.length, 1); }
  for (const patch of [{ subject: '' }, { subject: 'x'.repeat(201) }, { description: 'x'.repeat(12001) }, { category: 'unlisted' }, { priority: 'unlisted' }]) { reset(); await assert.rejects(createSupportTicket(globalThis.__ticketClient, accountId, { ...input, ...patch }, scope()), { code: 'invalid' }); assert.equal(requests.length, 0); }
  reset(); auth = async () => verified(user({ id: other })); await assert.rejects(createSupportTicket(globalThis.__ticketClient, accountId, input, scope()), { code: 'changed' }); assert.equal(requests.length, 0);
  const Creation = await compile('src/pages/client/NewTicket.tsx', true), Form = Creation.NewTicketForm;
  const fill = () => { let t = render(Form); for (const [field, value] of [['ticket-subject', 'Fictional new ticket'], ['ticket-description', 'Fictional description']]) { nodes(t).find(n => n.props.id === field).props.onChange({ target: { value } }); t = render(Form); } return t; };
  reset(); tree = fill(); mode = 'writePending'; submit(tree); submit(tree); await drain(); assert.equal(requests.length, 1); tree = render(Form); assert.equal(nodes(tree).find(n => n.type === 'fieldset').props.disabled, true); assert.equal(button(tree, 'Cancel').props.disabled, true); release(); await drain(); assert.deepEqual(navigations, [['/client/support', { replace: true }]]);
  reset(); tree = fill(); mode = 'lost'; submit(tree); await drain(); tree = render(Form); assert.match(html(tree), /may already have been created/); assert.match(html(tree), /Check my support tickets/); assert.equal(button(tree, 'Create Ticket').props.disabled, true); submit(tree); await drain(); assert.equal(requests.length, 1); assert.equal(navigations.length, 0);
  reset(); tree = fill(); mode = 'writePending'; submit(tree); await drain(); [...timers.values()][0](); assert.match(html(render(Form)), /may already have been created/); release(); await drain(); assert.equal(navigations.length, 0);
  reset(); tree = fill(); let lateAuth; auth = () => new Promise(resolve => { lateAuth = resolve; }); submit(tree); unmount(); lateAuth(verified(user())); await drain(); assert.equal(requests.length, 0); assert.equal(navigations.length, 0);
  reset(); tree = fill(); mode = 'writePending'; submit(tree); await drain(); unmount(); release(); await drain(); assert.equal(navigations.length, 0);
  reset(); globalThis.__newTicketLocation = { state: { setupHelp: true } }; let lateSession; session = () => new Promise(resolve => { lateSession = resolve; }); render(Form); assert.equal(timers.size, 1); [...timers.values()][0](); tree = render(Form); assert.match(html(tree), /could not be attached/); lateSession({ data: { session: { user: user(), access_token: 'fictional' } }, error: null }); await drain(); assert.equal(requests.length, 0);
  reset(); globalThis.__newTicketLocation = { state: { setupHelp: true } }; session = async () => ({ data: { session: { user: user({ id: other }), access_token: 'fictional' } }, error: null }); render(Form); await drain(); assert.match(html(render(Form)), /session changed/); assert.equal(requests.length, 0);
  reset(); globalThis.__newTicketLocation = { state: { setupHelp: true } };
  globalThis.fetch = async (url, options) => { assert.equal(url, '/api/ks-customer-setup'); assert.equal(options.method, 'GET'); assert.equal(options.headers.Authorization, 'Bearer fictional'); return Response.json({ accountId, mode: 'read-only', testMode: false, checkedAt: '2026-10-24T09:00:00Z', orders: [{ reference: 'cs_live_fictionalOrder', testMode: false, tier: 'gold', interval: '6 months', connections: 3, amountCents: 9500, currency: 'usd', recordedAt: '2026-10-24T08:00:00Z', status: 'requires_review', providerActivated: false }] }); };
  render(Form); await drain(); tree = render(Form); assert.match(html(tree), /cs_live_fictionalOrder/); submit(tree); await drain(); assert.match(requests[0].body.description, /Saved paid-order details for support/); assert.match(requests[0].body.description, /Order reference: cs_live_fictionalOrder/); assert.equal(requests[0].body.user_id, accountId); assert.equal(navigations.length, 1); globalThis.fetch = originalFetch;
  for (const status of ['loading', 'unavailable', 'signed_out', 'unconfirmed', 'ready']) { reset(); globalThis.__ticketAccount = { status, accountId: status === 'ready' ? accountId : null, retry() {} }; tree = render(Creation.default); assert.equal(tree.type === Form, status === 'ready'); if (status === 'ready') assert.equal(tree.key, accountId + ':general'); assert.equal(requests.length, 0); }
  console.log('PASS: actual ticket creation uses a verified owner, six-field insert and exact returned row; bounds input, blocks duplicates/uncertain replay, disables editing, bounds deadlines, ignores stale/unmounted saves and binds setup orders to the same owner.');

} finally { unmount(); await drain(); globalThis.fetch = originalFetch; if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow; for (const key of ['__ticketHooks', '__ticketClient', '__ticketAccount', '__newTicketLocation', '__newTicketNavigate']) delete globalThis[key]; await rm(dir, { recursive: true, force: true }); }
