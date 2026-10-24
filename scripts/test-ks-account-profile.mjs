import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { StaticRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { createClient } from '@supabase/supabase-js';

// Actual source + installed SDK. All identities, Auth results and HTTP responses are fictional.
const directory = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-profile-'));
const originalWindow = globalThis.window;
const id = n => `88888888-8888-4888-8888-${String(n).padStart(12, '0')}`;
const accountId = id(1), other = id(2), initialRevision = '2026-10-24T08:00:00.123456+00:00';
let row, mode, requests, auth, pendingTransport, serial = 0, hooks;
const timers = new Map(); let timerId = 0;
const user = (patch = {}) => ({ id: accountId, email: 'current@example.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', is_anonymous: false, ...patch });
const verified = u => ({ data: { user: u }, error: null });
const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
const frames = {
  useState(initial) { const i = hooks.si++; if (!(i in hooks.states)) hooks.states[i] = typeof initial === 'function' ? initial() : initial; const frame = hooks; return [frame.states[i], v => { assert.equal(frame.dead, false, 'State written after unmount'); frame.states[i] = typeof v === 'function' ? v(frame.states[i]) : v; }]; },
  useRef(initial) { const i = hooks.ri++; return hooks.refs[i] ?? (hooks.refs[i] = { current: initial }); },
  useCallback(fn, deps) { const i = hooks.mi++; if (!same(hooks.memos[i]?.deps, deps)) hooks.memos[i] = { fn, deps }; return hooks.memos[i].fn; },
  useEffect(effect, deps) { const i = hooks.ei++; if (!same(hooks.effects[i]?.deps, deps)) { const old = hooks.effects[i]; hooks.effects[i] = { deps }; hooks.pending.push(() => { old?.cleanup?.(); hooks.effects[i].cleanup = effect(); }); } },
};
const sdk = createClient('https://fictional.supabase.co', 'fictional-key', { accessToken: async () => 'fictional-token', global: { fetch: async (input, options) => {
  const url = new URL(input), method = options.method ?? 'GET';
  assert.equal(url.origin, 'https://fictional.supabase.co'); assert.equal(url.pathname, '/rest/v1/profiles');
  assert.equal(url.searchParams.get('select'), 'id,full_name,updated_at'); assert.equal(url.searchParams.get('id'), 'eq.' + accountId);
  const body = options.body ? JSON.parse(options.body) : null; requests.push({ method, body, url });
  const response = data => Response.json(data);
  if (method === 'GET') {
    assert.deepEqual([...url.searchParams.keys()].sort(), ['id', 'select']);
    if (mode === 'readFailure') return Response.json({ message: 'PRIVATE-DB-ERROR' }, { status: 503 });
    if (mode === 'readPending') return new Promise(resolve => { pendingTransport = () => resolve(response(row ? [row] : [])); });
    return response(row ? [mode === 'wrongOwner' ? { ...row, id: other } : row] : []);
  }
  assert.equal(method, 'PATCH'); assert.deepEqual(Object.keys(body), ['full_name']);
  assert.equal(typeof body.full_name === 'string' || body.full_name === null, true);
  assert.equal(new Headers(options.headers).get('prefer'), 'return=representation');
  assert.deepEqual([...url.searchParams.keys()].sort(), ['id', 'select', 'updated_at']);
  if (mode === 'zero' || url.searchParams.get('updated_at') !== 'eq.' + row.updated_at) return response([]);
  row = { ...row, full_name: body.full_name, updated_at: '2026-10-24T08:01:' + String(++serial).padStart(2, '0') + '.123456+00:00' };
  if (mode === 'lost') throw Error('PRIVATE-NETWORK-ERROR after fictional commit');
  const saved = mode === 'wrongReturn' ? { ...row, id: other } : mode === 'wrongValue' ? { ...row, full_name: 'Wrong name' } : mode === 'badRevision' ? { ...row, updated_at: null } : row;
  if (mode === 'writePending') return new Promise(resolve => { pendingTransport = () => resolve(response([saved])); });
  return response([saved]);
} } });
globalThis.__profileClient = { from: sdk.from.bind(sdk), auth: { getUser: () => auth() } };
globalThis.__profileHooks = frames;
const hookSource = `import React from ${JSON.stringify(import.meta.resolve('react'))};export default React;export const {useState,useRef,useCallback,useEffect}=globalThis.__profileHooks;`;
async function compile(entry, page = false) {
  const output = await build({ entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external', plugins: [{ name: 'offline-profile', setup(b) {
    b.onResolve({ filter: /^file:/ }, a => ({ path: a.path, external: true }));
    b.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'fixture' }));
    b.onResolve({ filter: /(?:^|\/)lib\/supabase$/ }, () => ({ path: 'client', namespace: 'fixture' }));
    if (page) { b.onResolve({ filter: /\/useVerifiedWebsiteAccount$/ }, () => ({ path: 'account', namespace: 'fixture' })); b.onResolve({ filter: /\/AccountProfileEditor$/ }, () => ({ path: 'editor', namespace: 'fixture' })); }
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ contents: a.path === 'hooks' ? hookSource : a.path === 'client' ? 'export const supabase=globalThis.__profileClient;' : a.path === 'account' ? 'export const useVerifiedWebsiteAccount=()=>globalThis.__profileAccount;' : 'export default function ProfileFixture(){return null;}' }));
  } }] });
  const path = join(directory, `${++serial}.mjs`); await writeFile(path, output.outputFiles[0].text); return import(pathToFileURL(path));
}
function unmount() { for (const e of hooks?.effects ?? []) e?.cleanup?.(); if (hooks) hooks.dead = true; }
function reset() { unmount(); assert.equal(timers.size, 0, 'Timers leaked'); hooks = { states: [], refs: [], memos: [], effects: [], pending: [], si: 0, ri: 0, mi: 0, ei: 0, dead: false }; row = { id: accountId, full_name: 'Original name', updated_at: initialRevision }; mode = 'normal'; requests = []; auth = async () => verified(user()); pendingTransport = null; }
function render(fn, props = { accountId }) { hooks.si = hooks.ri = hooks.mi = hooks.ei = 0; const tree = fn(props); for (const e of hooks.pending.splice(0)) e(); return tree; }
const drain = async () => { for (let i = 0; i < 12; i++) await new Promise(resolve => setImmediate(resolve)); };
const scope = () => ({ signal: new AbortController().signal, isCurrent: () => true });
const nodes = e => !React.isValidElement(e) ? [] : [e, ...React.Children.toArray(e.props.children).flatMap(nodes)];
const content = e => typeof e === 'string' ? e : React.isValidElement(e) ? React.Children.toArray(e.props.children).map(content).join('') : '';
const button = (tree, label) => nodes(tree).find(n => n.type === 'button' && (n.props['aria-label'] === label || content(n) === label));
const html = tree => renderToStaticMarkup(React.createElement(StaticRouter, {}, tree));
const submit = tree => nodes(tree).find(n => n.type === 'form').props.onSubmit({ preventDefault() {} });
try {
  globalThis.window = { setTimeout(fn, delay) { assert.equal(delay, 20000); const key = ++timerId; timers.set(key, fn); return key; }, clearTimeout(key) { timers.delete(key); } };
  const { loadAccountProfile, saveAccountName } = await compile('src/lib/account-profile.ts');
  reset(); let profile = await loadAccountProfile(globalThis.__profileClient, accountId, scope());
  assert.equal(profile.email, 'current@example.invalid'); assert.equal(profile.createdAt, user().created_at); assert.equal(profile.revision, initialRevision);
  let saved = await saveAccountName(globalThis.__profileClient, profile, '  New name  ', scope()); assert.equal(saved.fullName, 'New name'); assert.equal(row.full_name, 'New name');
  saved = await saveAccountName(globalThis.__profileClient, saved, '   ', scope()); assert.equal(saved.fullName, null);
  const before = requests.length; await assert.rejects(saveAccountName(globalThis.__profileClient, saved, 'a'.repeat(201), scope()), { code: 'invalid_name' }); assert.equal(requests.length, before);
  for (const [fixtureMode, code] of [['zero', 'not_saved'], ['wrongReturn', 'uncertain'], ['wrongValue', 'uncertain'], ['badRevision', 'uncertain'], ['lost', 'uncertain']]) {
    reset(); mode = fixtureMode; await assert.rejects(saveAccountName(globalThis.__profileClient, { accountId, revision: initialRevision }, 'Changed', scope()), { code }); assert.equal(requests.length, 1);
  }
  reset(); row.updated_at = '2026-10-24T08:00:01Z'; await assert.rejects(saveAccountName(globalThis.__profileClient, { accountId, revision: initialRevision }, 'Stale', scope()), { code: 'not_saved' }); assert.equal(row.full_name, 'Original name');
  console.log('PASS: real SDK name-only PATCH uses owner + server revision, normalizes names, requires the exact returned row and detects zero matches, concurrent edits and lost/malformed replies without replay.');
  for (const [u, code] of [[user({ id: other }), 'changed'], [user({ is_anonymous: true }), 'changed'], [user({ email_confirmed_at: null }), 'changed'], [null, 'changed']]) {
    reset(); auth = async () => verified(u); await assert.rejects(saveAccountName(globalThis.__profileClient, { accountId, revision: initialRevision }, 'No write', scope()), { code }); assert.equal(requests.length, 0);
  }
  reset(); let releaseAuth; auth = () => new Promise(resolve => { releaseAuth = resolve; }); const controller = new AbortController(); const pending = saveAccountName(globalThis.__profileClient, { accountId, revision: initialRevision }, 'No stale write', { signal: controller.signal, isCurrent: () => true }); controller.abort(); releaseAuth(verified(user())); await assert.rejects(pending, { code: 'changed' }); assert.equal(requests.length, 0);
  for (const [m, code] of [['readFailure', 'unavailable'], ['wrongOwner', 'unavailable'], ['missing', 'missing']]) { reset(); mode = m; if (m === 'missing') row = null; await assert.rejects(loadAccountProfile(globalThis.__profileClient, accountId, scope()), { code }); }
  reset(); auth = async () => verified(user({ created_at: 'invalid' })); assert.equal((await loadAccountProfile(globalThis.__profileClient, accountId, scope())).createdAt, null);
  console.log('PASS: verified Auth supplies email/date; missing, failed and wrong-owner profiles stay distinct; unconfirmed, changed or aborted owners cannot dispatch a name write.');
  const Editor = (await compile('src/components/AccountProfileEditor.tsx')).default;
  const ready = async () => { render(Editor); await drain(); return render(Editor); };
  const edit = value => { let tree = render(Editor); button(tree, 'Edit full name').props.onClick(); tree = render(Editor); nodes(tree).find(n => n.type === 'input').props.onChange({ target: { value } }); return render(Editor); };
  reset(); let tree = await ready(); assert.match(html(tree), /current@example.invalid/); assert.equal(button(tree, 'Edit full name').props.className.includes('min-h-11'), true);
  tree = edit('Discard'); button(tree, 'Cancel').props.onClick(); assert.match(html(render(Editor)), /Original name/);
  tree = edit('Saved name'); mode = 'writePending'; submit(tree); submit(tree); await drain(); tree = render(Editor); assert.equal(requests.filter(r => r.method === 'PATCH').length, 1); assert.equal(nodes(tree).find(n => n.type === 'input').props.disabled, true); assert.equal(button(tree, 'Cancel').props.disabled, true); pendingTransport(); await drain(); assert.match(html(render(Editor)), /Your name has been saved/);
  reset(); await ready(); tree = edit('Lost response'); mode = 'lost'; submit(tree); await drain(); tree = render(Editor); assert.match(html(tree), /could not be confirmed/); assert.equal(button(tree, 'Save name').props.disabled, true); submit(tree); await drain(); assert.equal(requests.filter(r => r.method === 'PATCH').length, 1); mode = 'normal'; await button(tree, 'Reload profile').props.onClick(); await drain(); assert.match(html(render(Editor)), /Lost response/); assert.doesNotMatch(html(render(Editor)), /has been saved/);
  reset(); await ready(); tree = edit('Zero'); mode = 'zero'; submit(tree); await drain(); tree = render(Editor); assert.match(html(tree), /No profile was updated/); assert.equal(button(tree, 'Save name').props.disabled, true);
  console.log('PASS: actual editor cancels drafts, coalesces duplicate submits, disables controls while pending and requires a fresh read after zero matches or an uncertain save.');
  reset(); await ready(); tree = edit('Timed out'); mode = 'writePending'; submit(tree); await drain(); assert.equal(timers.size, 1); [...timers.values()][0](); tree = render(Editor); assert.match(html(tree), /could not be confirmed/); assert.equal(button(tree, 'Save name').props.disabled, true); const finish = pendingTransport; mode = 'normal'; button(tree, 'Reload profile').props.onClick(); await drain(); assert.match(html(render(Editor)), /Timed out/); finish(); await drain(); assert.doesNotMatch(html(render(Editor)), /has been saved/);
  reset(); mode = 'readPending'; render(Editor); await drain(); [...timers.values()][0](); assert.match(html(render(Editor)), /could not be loaded/); pendingTransport(); await drain(); assert.doesNotMatch(html(render(Editor)), /Original name/);
  reset(); mode = 'readPending'; render(Editor); await drain(); unmount(); pendingTransport(); await drain(); assert.equal(timers.size, 0);
  reset(); await ready(); tree = edit('Late'); mode = 'writePending'; submit(tree); await drain(); unmount(); pendingTransport(); await drain(); assert.equal(timers.size, 0);
  reset(); await ready(); assert.doesNotMatch(html(render(Editor, { accountId: other })), /Original name|current@example/); await drain(); assert.doesNotMatch(html(render(Editor, { accountId: other })), /Original name|current@example/);
  console.log('PASS: bounded read/write deadlines, late responses, account changes and unmounts cannot restore old private details or trigger retries.');
  const Page = (await compile('src/pages/client/ClientAccount.tsx', true)).default;
  for (const status of ['loading', 'unavailable', 'signed_out', 'unconfirmed', 'ready']) {
    reset(); globalThis.__profileAccount = { status, accountId: status === 'ready' ? accountId : null, retry() {} }; tree = render(Page);
    const editor = nodes(tree).find(n => n.type?.name === 'ProfileFixture'); assert.equal(Boolean(editor), status === 'ready'); if (editor) { assert.equal(editor.props.accountId, accountId); assert.equal(editor.key, '.$' + accountId); }
    assert.match(html(tree), /href="\/support"/); assert.doesNotMatch(html(tree), /PRIVATE-/);
  }
  console.log('PASS: Account page mounts a keyed editor only for the current verified owner and offers explicit sign-in, confirmation and recovery states. No real account or provider was accessed.');
} finally {
  unmount(); if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
  for (const name of ['__profileClient', '__profileHooks', '__profileAccount']) delete globalThis[name]; await rm(directory, { recursive: true, force: true });
}
