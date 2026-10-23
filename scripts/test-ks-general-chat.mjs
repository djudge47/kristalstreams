import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FunctionsClient } from '@supabase/functions-js';

const directory = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-chat-'));
const originals = new Map();
function replace(name, value) { originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name)); Object.defineProperty(globalThis, name, { value, writable: true, configurable: true }); }
const a = '99999999-9999-4999-8999-999999999901', b = '99999999-9999-4999-8999-999999999902';
const session = id => id ? { user: { id }, access_token: `fictional-token-${id}` } : null;
let current = a, readSession = async () => ({ data: { session: session(current) }, error: null });
let calls = [], respond = async () => Response.json({ message: 'Fictional helpful answer' });
const callbacks = new Set(), timers = new Map();
let timerSequence = 0;
replace('setTimeout', (callback, delay) => { assert.equal(delay, 20000); const id = ++timerSequence; timers.set(id, callback); return id; });
replace('clearTimeout', id => timers.delete(id));
replace('window', { localStorage: new Proxy({}, { get() { throw Error('Chat must not touch transcript storage'); } }), setTimeout() {}, dispatchEvent() {} });
const client = new FunctionsClient('https://fictional-chat.invalid/functions/v1', {
  headers: { Authorization: 'Bearer fictional-next-account-default' },
  customFetch: async (url, options) => {
    assert.equal(url, 'https://fictional-chat.invalid/functions/v1/ai-chat');
    assert.equal(options.method, 'POST');
    const call = { body: JSON.parse(options.body), authorization: new Headers(options.headers).get('Authorization') };
    calls.push(call); return respond(call);
  },
});
replace('__chatMain', { auth: {
  getSession: () => readSession(),
  onAuthStateChange(callback) { callbacks.add(callback); return { data: { subscription: { unsubscribe() { callbacks.delete(callback); } } } }; },
}, functions: client, from() { throw Error('Chat must not read or write database tables'); } });
let hooks;
const same = (x, y) => x && y && x.length === y.length && x.every((value, i) => Object.is(value, y[i]));
replace('__chatHooks', {
  useState(initial) { const i = hooks.stateIndex++; if (!(i in hooks.states)) hooks.states[i] = typeof initial === 'function' ? initial() : initial; return [hooks.states[i], value => { hooks.states[i] = typeof value === 'function' ? value(hooks.states[i]) : value; }]; },
  useRef(initial) { const i = hooks.refIndex++; return hooks.refs[i] ?? (hooks.refs[i] = { current: initial }); },
  useEffect(effect, deps) { const i = hooks.effectIndex++; if (!same(hooks.effects[i]?.deps, deps)) { const old = hooks.effects[i]; hooks.effects[i] = { deps }; hooks.pending.push(() => { old?.cleanup?.(); hooks.effects[i].cleanup = effect(); }); } },
});
const hookSource = `import React from ${JSON.stringify(import.meta.resolve('react'))};export default React;export const {useState,useRef,useEffect}=globalThis.__chatHooks;`;
let fileNumber = 0;
async function compile(entry, ui = false) {
  const built = await build({ entryPoints: [entry], bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', external: ['react/jsx-runtime', 'lucide-react'],
    define: { 'import.meta.env': JSON.stringify({ DEV: false, VITE_SUPABASE_URL: 'https://fictional-chat.invalid', VITE_SUPABASE_ANON_KEY: 'fictional-anon-key' }) },
    plugins: [{ name: 'offline-chat', setup(build) {
      build.onResolve({ filter: /^file:/ }, args => ({ path: args.path, external: true }));
      build.onResolve({ filter: /^@supabase\/supabase-js$/ }, () => ({ path: 'sdk', namespace: 'fixture' }));
      if (ui) {
        build.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'fixture' }));
        build.onResolve({ filter: /^react-router-dom$/ }, () => ({ path: 'router', namespace: 'fixture' }));
      }
      build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: args.path === 'sdk' ? 'export const createClient=()=>globalThis.__chatMain;' : args.path === 'hooks' ? hookSource : `import React from ${JSON.stringify(import.meta.resolve('react'))};export const Link=({to,children,...props})=>React.createElement('a',{href:to,...props},children);` }));
    } }] });
  const file = join(directory, `${++fileNumber}.mjs`); await writeFile(file, built.outputFiles[0].text); return import(pathToFileURL(file));
}
const drain = async () => { for (let i = 0; i < 6; i++) await new Promise(resolve => setImmediate(resolve)); };
const emit = (id, event = id ? 'SIGNED_IN' : 'SIGNED_OUT') => { current = id; for (const callback of [...callbacks]) callback(event, session(id)); };
const nodes = element => !React.isValidElement(element) ? [] : [element, ...React.Children.toArray(element.props.children).flatMap(nodes)];
const text = element => typeof element === 'string' ? element : React.isValidElement(element) ? React.Children.toArray(element.props.children).map(text).join('') : '';
function unmount() { for (const effect of hooks?.effects ?? []) effect?.cleanup?.(); }
function fresh() { unmount(); hooks = { states: [], refs: [], effects: [], pending: [], stateIndex: 0, refIndex: 0, effectIndex: 0 }; }
function render(Component) { hooks.stateIndex = 0; hooks.refIndex = 0; hooks.effectIndex = 0; const tree = Component(); for (const effect of hooks.pending.splice(0)) effect(); return tree; }
const submit = tree => nodes(tree).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
const clear = tree => nodes(tree).find(node => node.type === 'button' && text(node) === 'Clear This Chat').props.onClick();
let tree, Component;
function question(value) { nodes(tree).find(node => node.type === 'textarea').props.onChange({ target: { value } }); tree = render(Component); }
const ok = async () => Response.json({ message: 'Fictional helpful answer' });
try {
  const api = await compile('src/lib/general-chat.ts');
  const signal = () => new AbortController().signal;
  for (const value of ['', ' ', 'x'.repeat(2001)]) await assert.rejects(api.requestGeneralReply(value, [], a, signal()), /1–2,000/);
  assert.equal(calls.length, 0);
  const history = Array.from({ length: 15 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `Fictional context ${i}`, privateExtra: 'must not be forwarded' }));
  history.push({ role: 'system', content: 'not user context' }, { role: 'assistant', content: '' }, { role: 'user', content: 'x'.repeat(12001) });
  assert.equal(await api.requestGeneralReply('  Fictional question  ', history, a, signal()), 'Fictional helpful answer');
  assert.equal(calls[0].authorization, `Bearer fictional-token-${a}`);
  assert.equal(calls[0].body.message, 'Fictional question');
  assert.deepEqual(calls[0].body.conversationHistory, history.slice(5, 15).map(({ role, content }) => ({ role, content })));
  current = null; await api.requestGeneralReply('Public question', [], null, signal());
  assert.equal(calls.at(-1).authorization, 'Bearer fictional-anon-key');
  const count = calls.length;
  current = b; await assert.rejects(api.requestGeneralReply('Old owner question', [], a, signal())); assert.equal(calls.length, count);
  const stopped = new AbortController(); stopped.abort(); await assert.rejects(api.requestGeneralReply('Cancelled question', [], b, stopped.signal)); assert.equal(calls.length, count);
  assert.equal(timers.size, 0);
  console.log('PASS: bounded input and context, role allowlist, actual SDK header precedence, public identity pinning and mismatched-owner rejection');

  current = a;
  for (const value of [{}, { message: '' }, { message: 12 }, { message: 'x'.repeat(12001) }]) {
    respond = async () => Response.json(value);
    await assert.rejects(api.requestGeneralReply('Malformed reply', [], a, signal()), /valid reply could not be confirmed/);
  }
  respond = async () => Response.json({ message: 'Fictional private raw error' }, { status: 503 });
  await assert.rejects(api.requestGeneralReply('HTTP error', [], a, signal()), error => /valid reply/.test(error.message) && !error.message.includes('private raw'));
  let release;
  respond = () => new Promise(resolve => { release = resolve; });
  let before = calls.length;
  const slow = api.requestGeneralReply('Slow question', [], a, signal()); await drain();
  const failed = assert.rejects(slow, /No automatic retry/); [...timers.values()][0](); await failed;
  release(Response.json({ message: 'Late after timeout' })); await drain();
  assert.equal(calls.length, before + 1); assert.equal(timers.size, 0);
  const controller = new AbortController();
  const cancelled = api.requestGeneralReply('Clear while waiting', [], a, controller.signal); await drain();
  const discarded = assert.rejects(cancelled, /cleared or the account changed/); controller.abort(); await discarded;
  release(Response.json({ message: 'Late after clear' })); await drain(); assert.equal(timers.size, 0);
  console.log('PASS: malformed and HTTP failures, deterministic timeout and local cancellation settle once, discard late results and never auto-retry');

  respond = () => new Promise(resolve => { release = resolve; });
  Component = (await compile('src/pages/support/AIChat.tsx', true)).default;
  fresh(); tree = render(Component);
  assert.equal(nodes(tree).find(node => node.type === 'textarea').props.disabled, true);
  emit(a, 'INITIAL_SESSION'); tree = render(Component); question('First UI question');
  before = calls.length; const first = submit(tree), duplicate = submit(tree); await drain();
  assert.equal(calls.length, before + 1); assert.deepEqual(calls.at(-1).body.conversationHistory, []);
  tree = render(Component); assert.equal(nodes(tree).find(node => node.type === 'textarea').props.disabled, true);
  release(Response.json({ message: '<script>fictional unsafe markup</script>' })); await Promise.all([first, duplicate]);
  tree = render(Component);
  const html = renderToStaticMarkup(tree); assert.ok(html.includes('&lt;script&gt;fictional unsafe markup&lt;/script&gt;')); assert.ok(!html.includes('<script>'));
  assert.equal(nodes(tree).find(node => node.type === 'textarea').props.maxLength, 2000);
  assert.ok(nodes(tree).some(node => node.type === 'label' && node.props.htmlFor === 'general-chat-question'));
  assert.match(nodes(tree).find(node => node.props.role === 'log').props.className, /overflow-y-auto/);
  console.log('PASS: actual chat form waits for initial Auth, coalesces duplicate sends, disables busy inputs and renders replies as escaped text');

  question('Old pending question'); const old = submit(tree); await drain(); const oldRelease = release;
  assert.equal(calls.at(-1).body.conversationHistory.length, 2);
  clear(tree); tree = render(Component); assert.doesNotMatch(text(tree), /First UI question|fictional unsafe markup/);
  question('New cleared question'); const newer = submit(tree); await drain(); const newRelease = release;
  assert.deepEqual(calls.at(-1).body.conversationHistory, []);
  oldRelease(Response.json({ message: 'Must not appear after Clear Chat' })); await old; await drain(); tree = render(Component);
  assert.equal(nodes(tree).find(node => node.type === 'textarea').props.disabled, true, 'An old finally must not release the newer request gate');
  assert.doesNotMatch(text(tree), /Must not appear/);
  newRelease(Response.json({ message: 'New page answer' })); await newer; tree = render(Component); assert.match(text(tree), /New page answer/);
  question('Pending account A'); const priorOwner = submit(tree); await drain(); const ownerRelease = release;
  emit(b); tree = render(Component); assert.doesNotMatch(text(tree), /New page answer|Pending account A/);
  question('Question from account B'); const nextOwner = submit(tree); await drain(); const bRelease = release;
  assert.equal(calls.at(-1).authorization, `Bearer fictional-token-${b}`); assert.deepEqual(calls.at(-1).body.conversationHistory, []);
  ownerRelease(Response.json({ message: 'Account A private answer' })); await priorOwner; await drain(); tree = render(Component);
  assert.doesNotMatch(text(tree), /Account A private answer/); assert.equal(nodes(tree).find(node => node.type === 'textarea').props.disabled, true);
  bRelease(Response.json({ message: 'Account B answer' })); await nextOwner;
  tree = render(Component); emit(null); tree = render(Component); assert.doesNotMatch(text(tree), /Account B answer/);
  console.log('PASS: Clear Chat, account switches and sign-out clear context; stale replies and stale finally blocks cannot replace the new conversation');

  emit(a); tree = render(Component); respond = async () => Response.json({ message: null });
  question('Failed question excluded'); await submit(tree); tree = render(Component); assert.match(text(tree), /Reply unavailable/); assert.match(text(tree), /valid reply could not be confirmed/);
  respond = ok; question('Successful next question'); await submit(tree); tree = render(Component);
  assert.deepEqual(calls.at(-1).body.conversationHistory, []);
  for (let i = 0; i < 22; i++) { question(`Visible bound ${i}`); await submit(tree); tree = render(Component); }
  assert.equal(nodes(tree).find(node => node.props.role === 'log').props.children[0].length, 40);
  assert.ok(calls.at(-1).body.conversationHistory.length <= 10);
  assert.doesNotMatch(text(tree), /Failed question excluded|Successful next question/);
  console.log('PASS: failures stay out of future context, visible messages are bounded to 40 and transmitted context remains bounded to 10');

  respond = () => new Promise(resolve => { release = resolve; }); question('Unmounted request'); const leaving = submit(tree); await drain();
  const late = release, oldStates = [...hooks.states];
  unmount(); assert.equal(callbacks.size, 2, 'Only module-level diagnostic subscribers remain; UI subscriber is removed');
  late(Response.json({ message: 'Must not render after unmount' })); await leaving; await drain();
  assert.deepEqual(hooks.states, oldStates); assert.equal(timers.size, 0);
  let sessionRelease;
  readSession = () => new Promise(resolve => { sessionRelease = resolve; });
  const waitingController = new AbortController(); before = calls.length;
  const waiting = api.requestGeneralReply('Delayed session read', [], a, waitingController.signal); await drain();
  const stoppedWaiting = assert.rejects(waiting); waitingController.abort(); sessionRelease({ data: { session: session(a) }, error: null }); await stoppedWaiting; await drain();
  assert.equal(calls.length, before);
  console.log('PASS: unmount unsubscribes/discards results, and cancellation during a delayed Auth read prevents invocation');
  console.log('6 general-chat regression scenarios passed. All messages, identities and service traffic were fictional and offline; no real AI request or database operation was made.');
} finally {
  unmount();
  for (const [name, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; }
  await rm(directory, { recursive: true, force: true });
}
