import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';

const directory = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-password-'));
const originals = new Map();
const set = (name, value) => { if (!originals.has(name)) originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name)); Object.defineProperty(globalThis, name, { value, writable: true, configurable: true }); };
const owner = '77777777-7777-4777-8777-777777777701', other = '77777777-7777-4777-8777-777777777702';
const user = id => ({ id, email: 'fictional-owner@example.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', is_anonymous: false, aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' });
const input = { currentPassword: 'fictional old password', newPassword: 'fictional new password', confirmPassword: 'fictional new password' };
let mode, mainReads, calls, mainUser, changed, unsubscribeCount;
function reset() { mode = 'success'; mainReads = 0; calls = []; mainUser = user(owner); changed = false; unsubscribeCount = 0; }
set('window', { localStorage: new Proxy({}, { get() { throw Error('Password workflow touched browser credential storage'); } }), setTimeout() {}, dispatchEvent() {} });
set('__ksPasswordMain', { auth: {
  async getUser() { mainReads++; if (mode === 'switch' && mainReads === 2) return { data: { user: user(other) }, error: null }; return { data: { user: mainUser }, error: null }; },
  onAuthStateChange(callback) { globalThis.__ksPasswordAuthChange = callback; return { data: { subscription: { unsubscribe() { unsubscribeCount++; } } } }; },
  updateUser() { throw Error('Main browser session must never change a password'); },
  signInWithPassword() { throw Error('Main browser session must never be replaced'); },
  signOut() { throw Error('Main browser session must never be signed out'); },
} });
set('__ksPasswordOptions', []);
set('__ksPasswordFetch', async (url, options) => {
  const parsed = new URL(url);
  assert.equal(parsed.origin, 'https://fictional-auth.invalid');
  const body = options.body ? JSON.parse(options.body) : null;
  calls.push({ path: parsed.pathname, search: parsed.search, method: options.method, body });
  const json = (value, status = 200) => Response.json(value, { status, headers: { 'X-Supabase-Api-Version': '2024-01-01' } });
  if (parsed.pathname === '/auth/v1/token') {
    assert.equal(parsed.searchParams.get('grant_type'), 'password');
    assert.equal(body.email, mainUser.email); assert.equal(body.password, input.currentPassword);
    if (mode === 'wrong-password') return json({ code: 'invalid_credentials', msg: 'Fictional raw secret detail' }, 400);
    if (mode === 'cancel') changed = true;
    const id = mode === 'wrong-identity' ? other : owner;
    const token = [Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'), Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600, aud: 'authenticated' })).toString('base64url'), 'fictional-signature'].join('.');
    return json({ access_token: token, refresh_token: 'fictional-refresh', token_type: 'bearer', expires_in: 3600, user: user(id) });
  }
  if (parsed.pathname === '/auth/v1/user') {
    assert.equal(options.method, 'PUT');
    const authorization = new Headers(options.headers).get('Authorization');
    assert.equal(JSON.parse(Buffer.from(authorization.split('.')[1], 'base64url').toString()).sub, owner);
    assert.equal(body.password, input.newPassword); assert.equal(body.current_password, input.currentPassword);
    assert.equal(mainReads, 2, 'The main owner must be checked before and after verification');
    if (mode === 'weak') return json({ code: 'weak_password', msg: 'Fictional raw secret detail' }, 422);
    if (mode === 'uncertain') return json({ msg: 'Fictional lost update result' }, 503);
    if (mode === 'late-switch') {
      mainUser = user(other);
      globalThis.__ksPasswordAuthChange('SIGNED_IN', { user: mainUser });
    }
    return json(user(owner));
  }
  if (parsed.pathname === '/auth/v1/logout') {
    assert.equal(parsed.searchParams.get('scope'), 'local');
    return mode === 'cleanup-failure' ? json({ msg: 'Fictional cleanup failure' }, 503) : new Response(null, { status: 204 });
  }
  throw Error('Unexpected Auth route');
});
const sdk = `import {createClient as actualCreateClient} from ${JSON.stringify(import.meta.resolve('@supabase/supabase-js'))};
let count=0;export const createClient=(url,key,options)=>{if(count++===0)return globalThis.__ksPasswordMain;globalThis.__ksPasswordOptions.push(options);return actualCreateClient(url,key,{...options,global:{fetch:(...args)=>globalThis.__ksPasswordFetch(...args)}});};`;
let hooks;
set('__ksPasswordHooks', {
  useState(initial) { const i = hooks.stateIndex++; if (!(i in hooks.states)) hooks.states[i] = initial; return [hooks.states[i], value => { hooks.states[i] = value; }]; },
  useRef(initial) { const i = hooks.refIndex++; return hooks.refs[i] ?? (hooks.refs[i] = { current: initial }); },
  useEffect(effect) { if (!hooks.effectMounted) { hooks.effectMounted = true; hooks.pending.push(() => { hooks.cleanup = effect(); }); } },
});
const hookSource = `import React from ${JSON.stringify(import.meta.resolve('react'))};export default React;export const {useState,useRef,useEffect}=globalThis.__ksPasswordHooks;`;
let fileNumber = 0;
async function compile(entry, ui = false) {
  const result = await build({ entryPoints: [entry], bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', external: ['react/jsx-runtime', 'lucide-react'],
    define: { 'import.meta.env': JSON.stringify({ DEV: false, VITE_SUPABASE_URL: 'https://fictional-auth.invalid', VITE_SUPABASE_ANON_KEY: 'fictional-anon-key' }) },
    plugins: [{ name: 'offline-password', setup(b) {
      b.onResolve({ filter: /^file:/ }, a => ({ path: a.path, external: true }));
      b.onResolve({ filter: /^@supabase\/supabase-js$/ }, () => ({ path: 'sdk', namespace: 'fixture' }));
      if (ui) {
        b.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'fixture' }));
        b.onResolve({ filter: /^react-router-dom$/ }, () => ({ path: 'router', namespace: 'fixture' }));
      }
      b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ contents: a.path === 'sdk' ? sdk : a.path === 'hooks' ? hookSource : 'export const Link=()=>null;' }));
    } }] });
  const file = join(directory, `${++fileNumber}.mjs`); await writeFile(file, result.outputFiles[0].text); return import(pathToFileURL(file));
}
const nodes = element => !React.isValidElement(element) ? [] : [element, ...React.Children.toArray(element.props.children).flatMap(nodes)];
const text = element => typeof element === 'string' ? element : React.isValidElement(element) ? React.Children.toArray(element.props.children).map(text).join('') : '';
const render = Component => { hooks.stateIndex = 0; hooks.refIndex = 0; const tree = Component(); for (const effect of hooks.pending.splice(0)) effect(); return tree; };
const fresh = () => { hooks = { states: [], refs: [], stateIndex: 0, refIndex: 0, pending: [], effectMounted: false }; };
try {
  reset();
  const api = await compile('src/lib/website-password.ts');
  for (const invalid of [{ ...input, currentPassword: '' }, { ...input, confirmPassword: 'different' }, { ...input, newPassword: 'short', confirmPassword: 'short' }]) await assert.rejects(api.changeWebsitePassword(invalid, () => true));
  assert.equal(mainReads, 0); assert.equal(calls.length, 0);
  for (const account of [null, { ...user(owner), is_anonymous: true }, { ...user(owner), email_confirmed_at: null }]) {
    reset(); mainUser = account;
    await assert.rejects(api.changeWebsitePassword(input, () => true), /confirmed website account/); assert.equal(calls.length, 0);
  }
  console.log('PASS: invalid inputs, signed-out, anonymous and unconfirmed accounts cannot start verification or update');
  reset(); await api.changeWebsitePassword(input, () => true);
  assert.deepEqual(calls.map(call => call.path), ['/auth/v1/token', '/auth/v1/user', '/auth/v1/logout']);
  const options = globalThis.__ksPasswordOptions.at(-1).auth;
  assert.deepEqual(options, { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'ks-password-verification' });
  console.log('PASS: actual SDK verifies the old password, checks owner twice, forwards both password fields and locally revokes only its memory-only session');
  for (const scenario of ['wrong-password', 'wrong-identity', 'switch', 'cancel']) {
    reset(); mode = scenario;
    await assert.rejects(api.changeWebsitePassword(input, () => !changed));
    assert.equal(calls.filter(call => call.path === '/auth/v1/user').length, 0);
    assert.ok(!calls.some(call => /recover|reauthenticate|signup/.test(call.path)));
  }
  console.log('PASS: wrong passwords, mismatched verified identity, changed main account and cancellation all prevent an update');
  for (const scenario of ['weak', 'uncertain']) {
    reset(); mode = scenario;
    const problem = await api.changeWebsitePassword(input, () => true).catch(error => error);
    assert.match(problem.message, scenario === 'weak' ? /stronger/ : /could not be confirmed/);
    assert.doesNotMatch(problem.message, /Fictional raw/);
    assert.equal(calls.filter(call => call.path === '/auth/v1/user').length, 1);
    assert.equal(calls.filter(call => call.path === '/auth/v1/logout').length, 1);
  }
  reset(); mode = 'cleanup-failure'; await api.changeWebsitePassword(input, () => true);
  assert.equal(calls.filter(call => call.path === '/auth/v1/user').length, 1);
  console.log('PASS: server rejection and uncertain results are distinct, never retried, never logged, and cleanup failure cannot repeat an update');
  reset();
  const Component = (await compile('src/pages/client/ClientSecurity.tsx', true)).default;
  fresh(); let tree = render(Component);
  globalThis.__ksPasswordAuthChange('INITIAL_SESSION', { user: user(owner) });
  const fill = () => { for (const [id, value] of [['current-website-password', input.currentPassword], ['new-website-password', input.newPassword], ['confirm-website-password', input.confirmPassword]]) nodes(tree).find(element => element.props.id === id).props.onChange({ target: { value } }); tree = render(Component); };
  fill(); const form = nodes(tree).find(element => element.type === 'form');
  const first = form.props.onSubmit({ preventDefault() {} }), second = form.props.onSubmit({ preventDefault() {} });
  tree = render(Component); assert.equal(nodes(tree).find(element => element.type === 'fieldset').props.disabled, true);
  await Promise.all([first, second]); tree = render(Component);
  assert.equal(calls.filter(call => call.path === '/auth/v1/user').length, 1);
  assert.match(text(tree), /Website password updated/);
  assert.ok(nodes(tree).filter(element => element.type === 'input').every(element => element.props.value === ''));
  assert.equal(nodes(tree).find(element => element.type === 'fieldset').props.disabled, false);
  console.log('PASS: actual form blocks duplicate submissions, disables inputs while busy, clears passwords and reports success only after the SDK update');
  fill(); globalThis.__ksPasswordAuthChange('SIGNED_IN', { user: user(other) }); tree = render(Component);
  assert.ok(nodes(tree).filter(element => element.type === 'input').every(element => element.props.value === ''));
  assert.doesNotMatch(text(tree), /Website password updated/); assert.match(text(tree), /session changed/);
  reset(); mode = 'late-switch';
  globalThis.__ksPasswordAuthChange('SIGNED_IN', { user: user(owner) }); tree = render(Component);
  fill(); await nodes(tree).find(element => element.type === 'form').props.onSubmit({ preventDefault() {} }); tree = render(Component);
  assert.doesNotMatch(text(tree), /Website password updated/);
  assert.match(text(tree), /session changed/);
  assert.equal(calls.filter(call => call.path === '/auth/v1/user').length, 1, 'An in-flight update remains bound to the verified owner, and its success cannot appear for the next account');
  fill(); let release;
  globalThis.__ksPasswordMain.auth.getUser = async () => new Promise(resolve => { release = () => resolve({ data: { user: user(owner) }, error: null }); });
  const pending = nodes(tree).find(element => element.type === 'form').props.onSubmit({ preventDefault() {} });
  hooks.cleanup(); release(); await pending;
  assert.equal(unsubscribeCount, 1);
  assert.equal(calls.filter(call => call.path === '/auth/v1/user').length, 1, 'Unmounted form cannot issue another update');
  console.log('PASS: account changes clear secrets and old success; unmount unsubscribes and cancels delayed pre-update work');
  console.log('6 website-password regression scenarios passed. All Auth traffic used fictional offline transport; no real password, email or customer record was changed.');
} finally {
  for (const [name, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; }
  delete globalThis.__ksPasswordAuthChange;
  await rm(directory, { recursive: true, force: true });
}
