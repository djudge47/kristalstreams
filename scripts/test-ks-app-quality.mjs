import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { ESLint } from 'eslint';
import React from 'react';

// All data, timers and browser services below are fictional and local.
const directory = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-quality-'));
const originals = new Map();
function replaceGlobal(name, value) {
  if (!originals.has(name)) originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
}
const sameDeps = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
let hooks;
replaceGlobal('__ksQualityHooks', {
  useState(initial) {
    const i = hooks.index++;
    if (!(i in hooks.slots)) hooks.slots[i] = typeof initial === 'function' ? initial() : initial;
    return [hooks.slots[i], v => { hooks.slots[i] = typeof v === 'function' ? v(hooks.slots[i]) : v; }];
  },
  useCallback(fn, deps) {
    const i = hooks.index++;
    if (!sameDeps(hooks.slots[i]?.deps, deps)) hooks.slots[i] = { fn, deps };
    return hooks.slots[i].fn;
  },
  useEffect(fn, deps) {
    const i = hooks.index++;
    if (!sameDeps(hooks.slots[i]?.deps, deps)) {
      const previous = hooks.slots[i];
      hooks.slots[i] = { deps };
      hooks.pending.push(() => { previous?.cleanup?.(); hooks.slots[i].cleanup = fn(); });
    }
  },
});
function resetHooks() { hooks = { slots: [], pending: [], index: 0 }; }
function render(fn) {
  hooks.index = 0;
  const value = fn();
  for (const effect of hooks.pending.splice(0)) effect();
  return value;
}
function unmount() { for (const slot of hooks.slots) slot?.cleanup?.(); }
const nodes = e => !React.isValidElement(e) ? [] : [e, ...React.Children.toArray(e.props.children).flatMap(nodes)];
const hookSource = `import React from ${JSON.stringify(import.meta.resolve('react'))};
export default React;
export const {useState,useCallback,useEffect}=globalThis.__ksQualityHooks;`;
let fileNumber = 0;
async function compile(entry, fixtures = {}) {
  const result = await build({
    entryPoints: [entry], bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic',
    external: ['react/jsx-runtime', 'lucide-react', 'zustand'],
    plugins: [{ name: 'offline-fixtures', setup(b) {
      b.onResolve({ filter: /^file:/ }, a => ({ path: a.path, external: true }));
      b.onResolve({ filter: /.*/ }, a => Object.hasOwn(fixtures, a.path) ? { path: a.path, namespace: 'fixture' } : undefined);
      b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ loader: 'js', contents: fixtures[a.path] }));
    } }],
  });
  const file = join(directory, `${++fileNumber}.mjs`);
  await writeFile(file, result.outputFiles[0].text);
  return import(pathToFileURL(file));
}

try {
  const [lint] = await new ESLint().lintText('const value: any = 1; value;', { filePath: 'src/quality-fixture.ts' });
  assert.ok(lint.messages.some(m => m.ruleId === '@typescript-eslint/no-explicit-any'));
  assert.ok(lint.messages.some(m => m.ruleId === '@typescript-eslint/no-unused-expressions'));
  console.log('PASS: the real lint configuration rejects loose types and unused expressions without crashing');

  let execute;
  const queries = [];
  replaceGlobal('__ksQualityDB', {
    from(table) {
      const q = { table, filters: [] };
      for (const name of ['select', 'order', 'returns', 'single']) q[name] = () => q;
      q.eq = (...args) => { q.filters.push(args); return q; };
      // Deliberately PromiseLike, without Promise.catch or Promise.finally.
      q.then = (resolve, reject) => { queries.push(q); return Promise.resolve().then(() => execute(q)).then(resolve, reject); };
      return q;
    },
    rpc(name) { return { then: (resolve, reject) => Promise.resolve().then(() => execute({ rpc: name })).then(resolve, reject) }; },
  });
  const api = await compile('src/lib/api.ts', { './supabase': 'export const supabase=globalThis.__ksQualityDB;' });
  const article = { id: 'fictional-article', title: 'Fictional help', content: 'Local fixture' };
  execute = q => { assert.equal(q.table, 'support_articles'); return { data: article, error: null }; };
  const originalNow = Date.now;
  let now = originalNow();
  Date.now = () => now;
  try {
    assert.deepEqual(await api.getSupportArticle('fictional-help'), article);
    assert.deepEqual(await api.getSupportArticle('fictional-help'), article);
    assert.equal(queries.length, 1, 'A matching cached article should not issue a second request');
    now += 5 * 60 * 1000 + 1;
    await api.getSupportArticle('fictional-help');
    assert.equal(queries.length, 2, 'Expired cache must refresh through the thenable');
  } finally { Date.now = originalNow; }
  const originalError = console.error;
  const originalWarn = console.warn;
  console.error = () => {};
  console.warn = () => {};
  try {
    const problem = new Error('Fictional database failure');
    execute = () => ({ data: null, error: problem });
    await assert.rejects(api.getSupportArticle('failed-article'), error => error === problem);
    execute = () => { throw new TypeError('Failed to fetch'); };
    assert.equal(await api.getSupportArticle('offline-article'), null);
    assert.deepEqual(await api.getSetupGuides(), []);
    execute = () => ({ data: article, error: null });
    assert.deepEqual(await api.getSupportArticle('failed-article'), article, 'An error must not poison the cache');
  } finally { console.error = originalError; console.warn = originalWarn; }
  console.log('PASS: real query helpers accept thenables, refresh expired cache and preserve database/network failure outcomes');

  for (const [entry, getter, metric] of [
    ['src/pages/support/Article.tsx', 'getSupportArticle', 'incrementArticleViews'],
    ['src/pages/support/Guide.tsx', 'getSetupGuide', 'incrementGuideViews'],
  ]) {
    let metricCalls = 0;
    replaceGlobal('__ksQualityMetric', () => metricCalls++);
    const Component = (await compile(entry, {
      react: hookSource,
      'react-router-dom': 'export const useParams=()=>({slug:"fictional"});',
      '../../lib/api': `export const ${getter}=async()=>null; export const ${metric}=()=>globalThis.__ksQualityMetric(); export const markArticleHelpful=()=>{};`,
    })).default;
    resetHooks();
    const savedError = console.error;
    console.error = () => {};
    try {
      render(Component);
      await new Promise(resolve => setImmediate(resolve));
      const tree = render(Component);
      assert.ok(nodes(tree).some(e => e.type === 'p' && e.props.children === (getter === 'getSupportArticle' ? 'Failed to load article' : 'Failed to load guide')));
      assert.equal(metricCalls, 0, 'Unavailable content must never increment a view counter');
    } finally { console.error = savedError; unmount(); }
  }
  console.log('PASS: actual article and guide screens show an error and skip metrics when their data is unavailable');

  const checkoutAdapter = (await compile('api/confirm-checkout.ts', {
    '../_server/ks-payments.js': `
      export class PaymentError extends Error { constructor(status,message){super(message);this.status=status;} }
      export const runtime=()=>{throw Error('Unexpected runtime or payment access');};
      export const authenticate=()=>{throw Error('Unexpected authentication access');};
      export const fulfill=()=>{throw Error('Unexpected fulfillment access');};
      export const respondError=(res,error)=>res.status(error.status).json({error:error.message});`,
  })).default;
  const response = () => ({
    code: 200, headers: {}, body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  });
  let res = response();
  await checkoutAdapter({ method: 'GET' }, res);
  assert.equal(res.code, 405);
  for (const sessionId of [null, {}, 'not-a-session', 'cs_test_bad;input']) {
    res = response();
    await checkoutAdapter({ method: 'POST', body: { sessionId } }, res);
    assert.equal(res.code, 400);
    assert.equal(res.headers['Cache-Control'], 'no-store');
  }
  console.log('PASS: the actual typed checkout adapter rejects invalid methods and sessions before any payment access');

  let handler, signatureCalls = 0, failure = new Error('Fictional invalid signature');
  replaceGlobal('Deno', { env: { get: () => 'fictional-fixture' }, serve: fn => { handler = fn; } });
  replaceGlobal('EdgeRuntime', { waitUntil() { throw Error('Unsigned event must not start fulfillment'); } });
  replaceGlobal('__ksQualityStripe', {
    webhooks: { async constructEventAsync(body, signature) {
      signatureCalls++;
      assert.equal(body, '{ "fictional": true }\n');
      assert.equal(signature, 'fictional-signature');
      throw failure;
    } },
  });
  const edgeFixtures = {
    'jsr:@supabase/functions-js/edge-runtime.d.ts': '',
    'npm:stripe@17.7.0': 'export default function Stripe(){return globalThis.__ksQualityStripe;}',
    'npm:@supabase/supabase-js@2.49.1': 'export const createClient=()=>({from(){throw Error("Unexpected database access");},auth:{getUser(){throw Error("Unexpected Auth access");}}});',
  };
  await compile('supabase/functions/stripe-checkout/index.ts', edgeFixtures);
  assert.equal((await handler(new Request('https://fixture.invalid', { method: 'GET' }))).status, 405);
  for (const mode of [null, 1, {}, 'not-a-mode']) {
    const result = await handler(new Request('https://fixture.invalid', { method: 'POST', body: JSON.stringify({ price_id: 'fixture', success_url: 'https://fixture.invalid/success', cancel_url: 'https://fixture.invalid/cancel', mode }) }));
    assert.equal(result.status, 400);
  }
  assert.equal((await handler(new Request('https://fixture.invalid', { method: 'POST', body: JSON.stringify({ price_id: 'fixture', success_url: 'https://fixture.invalid/success', cancel_url: 'https://fixture.invalid/cancel', mode: 'payment' }) }))).status, 401);
  console.log('PASS: the actual Edge checkout still rejects invalid modes and missing authentication before provider/database operations');
  await compile('supabase/functions/stripe-webhook/index.ts', edgeFixtures);
  assert.equal((await handler(new Request('https://fixture.invalid', { method: 'POST', body: '{}' }))).status, 400);
  assert.equal(signatureCalls, 0);
  const savedLogError = console.error;
  console.error = () => {};
  try {
    for (const thrown of [failure, 'fictional non-Error rejection']) {
      failure = thrown;
      const result = await handler(new Request('https://fixture.invalid', { method: 'POST', headers: { 'stripe-signature': 'fictional-signature' }, body: '{ "fictional": true }\n' }));
      assert.equal(result.status, 400);
      assert.ok((await result.text()).includes(thrown instanceof Error ? thrown.message : 'Unknown error'));
    }
  } finally { console.error = savedLogError; }
  assert.equal(signatureCalls, 2);
  console.log('PASS: the actual Edge webhook preserves raw-body signature validation and rejects errors without fulfillment');

  let notify, observed, disconnected = 0;
  replaceGlobal('IntersectionObserver', class {
    constructor(callback) { notify = callback; }
    observe(element) { observed = element; }
    disconnect() { disconnected++; }
  });
  const perf = await compile('src/lib/performance.ts', { react: hookSource });
  resetHooks();
  const ref = { current: {} };
  assert.equal(render(() => perf.useIntersectionObserver(ref)), false);
  assert.equal(observed, ref.current);
  notify([{ isIntersecting: true }]);
  assert.equal(render(() => perf.useIntersectionObserver(ref)), true);
  unmount();
  assert.equal(disconnected, 1);
  console.log('PASS: the actual intersection hook updates visibility and disconnects its observer');

  const intervals = new Map(), timeouts = new Map();
  let timerId = 0;
  replaceGlobal('setInterval', fn => { intervals.set(++timerId, fn); return timerId; });
  replaceGlobal('clearInterval', id => intervals.delete(id));
  replaceGlobal('setTimeout', fn => { timeouts.set(++timerId, fn); return timerId; });
  replaceGlobal('clearTimeout', id => timeouts.delete(id));
  const Hero = (await compile('src/components/Hero.tsx', {
    react: hookSource, 'react-router-dom': 'export const useNavigate=()=>()=>{};',
  })).default;
  resetHooks();
  let tree = render(Hero);
  const imageTitle = () => nodes(tree).find(e => e.type === 'img').props.alt;
  const initial = imageTitle();
  [...intervals.values()][0](); tree = render(Hero);
  const next = imageTitle();
  assert.notEqual(next, initial);
  [...intervals.values()][0](); tree = render(Hero);
  assert.equal(imageTitle(), next, 'Auto-advance must respect the current transition guard');
  for (const [id, fn] of [...timeouts]) { timeouts.delete(id); fn(); }
  tree = render(Hero);
  [...intervals.values()][0](); tree = render(Hero);
  assert.notEqual(imageTitle(), next);
  unmount();
  assert.equal(intervals.size, 0);
  console.log('PASS: the actual hero advances, blocks overlapping transitions and clears its interval on unmount');
  console.log('9 application-quality regression scenarios passed. No connected service was called.');
} finally {
  for (const [name, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
  await rm(directory, { recursive: true, force: true });
}
