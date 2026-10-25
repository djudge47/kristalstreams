import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createClient } from '@supabase/supabase-js';

const id = n => `44444444-4444-4444-8444-${String(n).padStart(12, '0')}`;
const payment = (n, amount, paid_at, payment_status = 'paid') => ({
  id: id(n), customer_id: id(1), amount, payment_method: 'manual_paypal', payment_status, paid_at,
});
const oldRows = Array.from({ length: 210 }, (_, i) => payment(i + 1,
  i % 3 === 0 ? 0 : 999, '2026-10-20T12:00:00Z', ['paid', 'pending', 'refunded'][i % 3]));
const realReceipts = [
  payment(501, 95, '2026-08-04T02:00:00Z'),
  payment(502, 25, '2026-08-02T18:00:00Z'),
  payment(503, 70, '2026-09-03T16:00:00Z'),
];
let rows = [...oldRows, ...realReceipts];
const originalRows = structuredClone(rows);
const queries = [];
let failLaterPage = false;
const client = createClient('https://fictional.supabase.co', 'fictional-publishable-key', {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: async (input, options) => {
    const url = new URL(input);
    assert.equal(url.origin, 'https://fictional.supabase.co');
    assert.equal(options.method, 'GET', 'Overview must never write a payment or customer record');
    if (url.pathname === '/rest/v1/iptv_customers') {
      return Response.json([{ id: id(1), username: 'fictional', customer_name: 'Fictional Customer',
        payment_status: 'legacy_paid', monthly_price: 0, account_status: 'active',
        source: 'panel_screenshot_import', trial: false, expiration_at: '2027-08-01T12:00:00Z' }]);
    }
    assert.equal(url.pathname, '/rest/v1/iptv_payments');
    assert.equal(url.searchParams.get('select'), 'id,customer_id,amount,payment_method,payment_status,paid_at,period_end');
    assert.equal(url.searchParams.get('order'), 'paid_at.desc,id.desc');
    const offset = Number(url.searchParams.get('offset'));
    const size = Number(url.searchParams.get('limit'));
    assert.equal(size, 200, 'Filtering must not happen after an eight-row database limit');
    queries.push(offset);
    if (failLaterPage && offset > 0) return Response.json({ message: 'Fictional internal failure details' }, { status: 400 });
    const ordered = [...rows].sort((a, b) => Date.parse(b.paid_at) - Date.parse(a.paid_at) || b.id.localeCompare(a.id));
    return Response.json(ordered.slice(offset, offset + size));
  } },
});

const originalFetch=globalThis.fetch;let websiteRows=[];
client.auth.getSession=async()=>({data:{session:{access_token:'fictional-admin',user:{id:id(900)}}},error:null});
globalThis.fetch=async(url,options)=>{assert.ok(url.startsWith('/api/ks-preview-paid-orders?view=admin-website-payments'));assert.equal(options.method,'GET');return Response.json({accountId:id(900),checkedAt:new Date().toISOString(),payments:websiteRows,nextCursor:null});};
const directory = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-overview-payments-'));
const reactPath = import.meta.resolve('react');
let hooks;
globalThis.__overviewClient = client;
globalThis.__overviewHooks = {
  useState(initial) {
    const i = hooks.index++;
    if (!(i in hooks.values)) hooks.values[i] = typeof initial === 'function' ? initial() : initial;
    return [hooks.values[i], value => { hooks.values[i] = typeof value === 'function' ? value(hooks.values[i]) : value; }];
  },
  useEffect(effect) { const i = hooks.effectIndex++; if (!hooks.effects[i]) { hooks.effects[i] = true; hooks.pending.push(effect); } },
  useMemo: fn => fn(),
};
const reset = () => { hooks = { values: [], effects: [], pending: [], index: 0, effectIndex: 0 }; queries.length = 0; };
const nodes = e => !React.isValidElement(e) ? [] : [e, ...React.Children.toArray(e.props.children).flatMap(nodes)];
const text = e => typeof e === 'string' || typeof e === 'number' ? String(e)
  : React.isValidElement(e) ? React.Children.toArray(e.props.children).map(text).join('') : '';
const drain = async () => { for (let n = 0; n < 20; n++) await new Promise(resolve => setImmediate(resolve)); };

try {
  const result = await build({
    entryPoints: ['src/pages/admin/CRMPremiumOverview.tsx'], bundle: true, write: false,
    format: 'esm', platform: 'node', jsx: 'automatic', packages: 'external',
    plugins: [{ name: 'fictional-overview', setup(b) {
      b.onResolve({ filter: /^file:/ }, a => ({ path: a.path, external: true }));
      b.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'fixture' }));
      b.onResolve({ filter: /\/lib\/supabase$/ }, () => ({ path: 'client', namespace: 'fixture' }));
      b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ loader: 'js', contents: a.path === 'hooks'
        ? `import React from ${JSON.stringify(reactPath)};export default React;export const {useState,useEffect,useMemo}=globalThis.__overviewHooks;`
        : 'export const supabase=globalThis.__overviewClient;' }));
    } }],
  });
  const file = join(directory, 'overview.mjs');
  await writeFile(file, result.outputFiles[0].text);
  const { default: Overview } = await import(pathToFileURL(file));
  let tree;
  const render = () => {
    hooks.index = hooks.effectIndex = 0;
    tree = Overview();
    for (const effect of hooks.pending.splice(0)) effect();
    return tree;
  };
  const panel = () => nodes(tree).find(e => e.props['aria-label'] === 'Recent received payments');
  const markup = () => renderToStaticMarkup(panel());
  const refresh = () => nodes(tree).find(e => e.type === 'button' && text(e) === 'Refresh').props.onClick();

  reset(); render();
  assert.ok(markup().includes('Loading received payments'));
  assert.ok(!markup().includes('No received payment amounts'));
  console.log('PASS: actual overview shows loading rather than an empty payment history during the read');
  await drain(); render();
  assert.deepEqual(queries, [0, 200]);
  assert.equal(nodes(panel()).filter(e => e.type === 'time').length, 3);
  for (const amount of ['$95.00', '$25.00', '$70.00']) assert.ok(markup().includes(amount));
  assert.ok(!markup().includes('$0.00'));
  assert.ok(!markup().includes('$999.00'));
  assert.ok(markup().includes('Aug 3, 2026, 10:00 PM EDT'));
  assert.deepEqual(rows, originalRows);
  console.log('PASS: actual overview reads every page, excludes zero/pending/refunded entries and retains genuine repeated receipts with New York times');

  rows = [...oldRows, ...Array.from({ length: 10 }, (_, i) => payment(600 + i, 100 + i, '2026-08-04T02:00:00Z'))];
  await refresh(); render();
  const visible = nodes(panel()).filter(e => e.type === 'time');
  assert.equal(visible.length, 8);
  assert.ok(markup().includes('$109.00'));
  assert.ok(markup().includes('$102.00'));
  assert.ok(!markup().includes('$101.00'));
  assert.ok(!markup().includes('$100.00'));
  assert.ok(markup().indexOf('$109.00') < markup().indexOf('$102.00'));
  console.log('PASS: the eight-row display limit follows receipt filtering and deterministic date/ID ordering');

  rows = oldRows;
  await refresh(); render();
  assert.ok(markup().includes('No received payment amounts recorded yet.'));
  assert.equal(nodes(panel()).filter(e => e.type === 'time').length, 0);
  assert.deepEqual(oldRows, originalRows.slice(0, oldRows.length));
  console.log('PASS: old zero/unknown and non-received history has an accurate empty summary without changing stored history');

  rows = [...oldRows, ...realReceipts];
  await refresh(); render();
  assert.ok(markup().includes('$95.00'));
  failLaterPage = true;
  const failedRefresh = refresh(); render();
  assert.ok(!markup().includes('$95.00'), 'Refreshing must not present stale receipts as current');
  await failedRefresh; render();
  assert.ok(markup().includes('Payment details could not be loaded'));
  assert.ok(!markup().includes('No received payment amounts recorded yet'));
  assert.ok(!markup().includes('Fictional internal failure'));
  assert.equal(nodes(panel()).filter(e => e.type === 'time').length, 0);
  console.log('PASS: a failed later page clears previous/partial receipts and reports unavailable data instead of no payments');

  failLaterPage = false;
  await refresh(); render();
  assert.ok(markup().includes('$95.00'));
  assert.ok(!markup().includes('Payment details could not be loaded'));
  assert.deepEqual(rows, originalRows);
  console.log('PASS: Refresh recovers the same saved receipts after a read failure without inserting or resending anything');
  rows=[];websiteRows=[{id:'cs_live_OverviewWebsite',customer_id:id(1),amount_cents:12500,payment_method:'stripe_checkout',payment_status:'recorded',source:'website_checkout',paid_at:'2026-08-03T20:17:00Z',months:6,connections:3,renewal_completed_at:'2026-08-03T20:18:00Z',renewal_expires_at:'2027-02-03T20:18:00Z'}];
  await refresh();render();assert.ok(markup().includes('$125.00'));assert.ok(markup().includes('Website checkout'));assert.ok(markup().includes('Recorded'));assert.ok(!markup().includes('Received <time'));assert.ok(!markup().includes('>Paid</span>'));
  console.log('PASS: actual overview shows verified website money with its historical amount and recorded label, without changing recurring revenue');
  console.log('7 overview payment scenarios passed. Only fictional GET requests were handled.');
} finally {
  globalThis.fetch=originalFetch;
  delete globalThis.__overviewClient;
  delete globalThis.__overviewHooks;
  await rm(directory, { recursive: true, force: true });
}
