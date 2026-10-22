import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createClient } from '@supabase/supabase-js';
import { isReceivedPayment, latestReceivedPayments, loadCrmPayments, receivedPaymentDate, receivedPaymentDateTime } from '../_shared/ks-crm-payment-summary.js';

const id = n => `33333333-3333-4333-8333-${String(n).padStart(12, '0')}`;
const payment = (n, customer, amount, date, status = 'paid') => ({
  id: id(n), customer_id: id(customer), amount,
  payment_method: 'manual_paypal', payment_status: status, paid_at: date,
});
const target = payment(501, 1, 95, '2026-08-03T20:17:00Z');
const rows = [
  ...Array.from({ length: 300 }, (_, i) => payment(i + 1, i + 100, 20, '2026-10-01T12:00:00Z')),
  payment(502, 1, 0, '2026-10-20T12:00:00Z'),
  payment(503, 1, 100, '2026-10-19T12:00:00Z', 'refunded'),
  payment(504, 1, 120, '2026-10-18T12:00:00Z', 'pending'),
  payment(505, 2, 0, '2026-10-17T12:00:00Z'), target,
].sort((a, b) => Date.parse(b.paid_at) - Date.parse(a.paid_at) || b.id.localeCompare(a.id));
const original = structuredClone(rows);
const requests = [];
let failSecondPage = false;
const client = createClient('https://fictional.supabase.co', 'fictional-publishable-key', {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: async (input, options) => {
    const url = new URL(input);
    assert.equal(url.origin, 'https://fictional.supabase.co');
    assert.equal(url.pathname, '/rest/v1/iptv_payments');
    assert.equal(options.method, 'GET');
    assert.equal(url.searchParams.get('select'), 'id,customer_id,amount,payment_method,payment_status,paid_at');
    assert.equal(url.searchParams.get('order'), 'paid_at.desc,id.desc');
    const offset = Number(url.searchParams.get('offset'));
    const size = Number(url.searchParams.get('limit'));
    assert.equal(size, 200);
    requests.push(offset);
    if (failSecondPage && offset > 0) return new Response(JSON.stringify({ message: 'fictional failure' }), { status: 400 });
    return new Response(JSON.stringify(rows.slice(offset, offset + size)), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } },
});
const result = await loadCrmPayments(client);
assert.equal(result.error, null);
assert.deepEqual(requests, [0, 200]);
assert.equal(result.data.length, rows.length);
const latest = latestReceivedPayments(result.data);
assert.deepEqual(latest.get(id(1)), target);
assert.equal(latest.has(id(2)), false);
assert.deepEqual(rows, original);
assert.equal(receivedPaymentDate(target.paid_at), 'Aug 3, 2026');
assert.equal(receivedPaymentDate('2026-08-04T02:00:00Z'), 'Aug 3, 2026');
assert.equal(receivedPaymentDateTime(target.paid_at), 'Aug 3, 2026, 4:17 PM EDT');
assert.equal(isReceivedPayment({ ...target, amount: '95.00' }), true);
for (const patch of [{amount:0},{amount:-1},{amount:NaN},{paid_at:'invalid'},{payment_status:'pending'},{payment_status:'refunded'}]) assert.equal(isReceivedPayment({...target,...patch}),false);
const tie = { ...target, id: id(999) };
assert.equal(latestReceivedPayments([tie, target]).get(id(1)).id, tie.id);
assert.equal(latestReceivedPayments([{ ...target, amount: NaN }, { ...target, paid_at: 'invalid' }]).size, 0);
console.log('PASS: actual Supabase client reads both pages using safe SELECT fields; latest paid positive receipt survives newer zero/refunded/pending entries and New York date boundaries');

failSecondPage = true;
const failed = await loadCrmPayments(client);
assert.equal(failed.data, null);
assert.match(failed.error.message, /could not be loaded/);
assert.doesNotMatch(failed.error.message, /fictional failure/);
console.log('PASS: a failed later page discards partial results and reports unavailable payment details');

const directory = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-payment-summary-'));
try {
  const reactPath = import.meta.resolve('react');
  const bundle = await build({
    entryPoints: ['src/pages/admin/CRMOperationsCenter.tsx'], bundle: true, write: false,
    platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external',
    plugins: [{ name: 'offline-card', setup(b) {
      b.onResolve({ filter: /^file:/ }, a => ({ path: a.path, external: true }));
      b.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'fixture' }));
      b.onResolve({ filter: /\/lib\/supabase$/ }, () => ({ path: 'auth', namespace: 'fixture' }));
      b.onResolve({ filter: /^\.\/(RoombaCrmLink|RoombaCustomerStatus|BulkXuiCheck|BulkCrmServiceSync|PreviewPaidOrders|RenewalPaymentForm|PaidRenewalReview|CustomerPortalLink)$/ }, () => ({ path: 'child', namespace: 'fixture' }));
      b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ loader: 'js', contents: a.path === 'hooks'
        ? `import React from ${JSON.stringify(reactPath)};export default React;export const useEffect=()=>{};export const useMemo=f=>f();export const useState=initial=>{const i=globalThis.__cardIndex++;return[i===0?globalThis.__cardCustomers:i===1?globalThis.__cardPayments:initial===true?false:initial,()=>{}];};`
        : a.path === 'auth' ? `export const supabase=new Proxy({}, {get(){throw Error('Connected reads and writes forbidden');}});` : 'export default ()=>null;' }));
    } }],
  });
  const file = join(directory, 'card.mjs');
  await writeFile(file, bundle.outputFiles[0].text);
  const { default: CRM } = await import(pathToFileURL(file));
  globalThis.__cardIndex = 0;
  globalThis.__cardPayments = result.data;
  globalThis.__cardCustomers = [1, 2].map(n => ({
    id: id(n), external_id: n, username: `fictional_${n}`, customer_name: `Fictional ${n}`,
    source: 'panel_screenshot_import', trial: false, payment_status: 'legacy_paid', monthly_price: 0,
    package_name: '12 Months + 1 Connection', connections_allowed: 1, account_status: 'active',
    expiration_at: '2027-08-04T12:00:00Z', renewal_at: null,
  }));
  const originalCustomers = structuredClone(globalThis.__cardCustomers);
  const html = renderToStaticMarkup(React.createElement(CRM));
  assert.equal((html.match(/aria-label="Last recorded payment"/g) || []).length, 1);
  assert.ok(html.includes('$95.00 · PayPal'));
  assert.ok(html.includes('Received <time dateTime="2026-08-03T20:17:00Z">Aug 3, 2026</time>'));
  assert.ok(html.includes('Aug 4, 2027'));
  assert.ok(html.includes('Paid under old pricing'));
  assert.ok(html.includes('See History for recorded payment details'));
  assert.ok(!html.includes('Old amount and payment date are not recorded'));
  assert.deepEqual(globalThis.__cardCustomers, originalCustomers);
  console.log('PASS: actual customer cards show the recorded amount/method/date, retain service date and legacy status, and do not invent a payment for a zero-only account');
  const nodes = element => !React.isValidElement(element) ? [] : [element, ...React.Children.toArray(element.props.children).flatMap(nodes)];
  const text = element => typeof element === 'string' || typeof element === 'number' ? String(element) : React.isValidElement(element) ? React.Children.toArray(element.props.children).map(text).join('') : '';
  const recent = entries => {
    globalThis.__cardIndex = 0; globalThis.__cardPayments = entries;
    const tree = CRM();
    const panel = nodes(tree).find(n => n.props['aria-label'] === 'Recent received payments');
    assert.ok(panel);
    return { tree, markup: renderToStaticMarkup(panel) };
  };
  const zeros = [payment(701,1,0,'2026-08-05T14:41:52Z'),payment(702,1,0,'2026-08-05T14:41:36Z'),payment(703,2,0,'2026-08-05T14:42:07Z')];
  const savedRows = [...zeros, target]; const savedBefore = structuredClone(savedRows);
  const corrected = recent(savedRows).markup;
  assert.equal((corrected.match(/Fictional 1/g)||[]).length,1);
  assert.ok(corrected.includes('$95.00')); assert.ok(corrected.includes('Received Aug 3, 2026, 4:17 PM EDT'));
  assert.ok(!corrected.includes('$0.00')); assert.ok(!corrected.includes('Aug 5'));
  assert.deepEqual(savedRows,savedBefore);
  console.log('PASS: actual Recent Payments panel shows one received payment instead of two old zero entries plus the same customer’s real receipt; stored history stays unchanged');
  const another = payment(704,1,25,'2026-09-03T20:17:00Z');
  const multiple = recent([another,...zeros,target]).markup;
  assert.equal((multiple.match(/Fictional 1/g)||[]).length,2); assert.ok(multiple.includes('$25.00')); assert.ok(multiple.includes('$95.00'));
  assert.ok(recent(zeros).markup.includes('No received payment amounts recorded yet.'));
  console.log('PASS: two legitimate payments from one customer remain separate and a zero-only history gets an accurate empty received-payments message');
  const thisMonth = new Date(); thisMonth.setUTCDate(15); thisMonth.setUTCHours(12,0,0,0);
  const monthly = recent([payment(705,1,42.37,thisMonth.toISOString()),payment(706,1,100,thisMonth.toISOString(),'pending'),payment(707,1,50,thisMonth.toISOString(),'refunded'),...zeros]);
  const metric = nodes(monthly.tree).find(n => n.type==='div' && n.props.className?.includes('bg-gray-800/90 p-4') && text(n).includes('Paid This Month'));
  assert.ok(metric); assert.ok(text(metric).includes('$42.37')); assert.ok(!text(metric).includes('$192.37'));
  console.log('PASS: Paid This Month uses the same positive received-payment rule and excludes pending/refunded amounts');
} finally {
  delete globalThis.__cardIndex;
  delete globalThis.__cardCustomers;
  delete globalThis.__cardPayments;
  await rm(directory, { recursive: true, force: true });
}
console.log('6 payment-summary scenarios passed. No connected writes, charges or provider access.');
