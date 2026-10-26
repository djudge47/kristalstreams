import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
const { chromium } = await import(pathToFileURL(process.env.KS_PLAYWRIGHT_MODULE));
const require = createRequire(import.meta.url), provided = require(process.env.KS_CHROMIUM_MODULE), bundled = provided.default ?? provided;
const owner = '44444444-4444-4444-8444-000000000010';
const result = await build({ stdin: { contents: `import React from 'react';import{createRoot}from'react-dom/client';import Orders from 'orders-component';createRoot(document.getElementById('root')).render(<main className="mx-auto max-w-2xl p-4"><Orders/></main>);`,
  resolveDir: process.cwd(), loader: 'jsx' }, bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' }, plugins: [{ name: 'offline-orders', setup(b) {
    b.onResolve({ filter: /^orders-component$/ }, () => ({ path: resolve('src/pages/admin/NewServiceOrders.tsx') }));
    b.onResolve({ filter: /lib\/supabase$/ }, () => ({ path: 'fixture-auth', namespace: 'fixture' }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: `export const supabase={auth:{getSession:async()=>({data:{session:{access_token:'fictional-token',user:{id:globalThis.__actor||'${owner}'}}},error:null})}};`, loader: 'js' }));
  } }] });
const css = await readFile(`dist/assets/${(await readdir('dist/assets')).find(x => x.endsWith('.css'))}`, 'utf8');
const html = `<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><body class="bg-dark-300 text-white"><div id="root"></div><script>${result.outputFiles[0].text}</script></body></html>`;
const browser = await chromium.launch({ executablePath: process.env.KS_BROWSER_EXECUTABLE ?? await bundled.executablePath(), headless: true,
  args: bundled.args.filter(x => !['--single-process', '--disable-web-security', '--allow-running-insecure-content'].includes(x)) });
let passed = 0;
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: width === 390, hasTouch: width === 390 });
    const reference = 'cs_live_BrowserNewService', errors = [];
    let mode = 'success', calls = 0;
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== 'https://new-service-orders.invalid') return route.abort();
      if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: html });
      assert.equal(url.pathname, '/api/ks-preview-paid-orders'); assert.equal(url.searchParams.get('view'), 'paid-new-service-review');
      calls++; const post = route.request().method() === 'POST';
      assert.equal(route.request().headers().authorization, 'Bearer fictional-token');
      if (post) assert.deepEqual(route.request().postDataJSON(), { reference });
      if (mode === 'failure') return route.fulfill({ status: 503, json: { error: 'PRIVATE_BACKEND_ERROR' } });
      if (mode === 'throttle') return route.fulfill({ status: 429, json: {} });
      if (mode === 'switch') await page.evaluate(() => { globalThis.__actor = '44444444-4444-4444-8444-000000000099'; });
      const base = { mode: 'verification-only', mayDispatch: false, providerActivated: false };
      if (!post) return route.fulfill({ json: { ...base, orders: [{ reference, plan: 'gold', connections: 3, amountCents: 15000, queuedAt: new Date().toISOString() }] } });
      const now = Date.now();
      return route.fulfill({ json: { ...base, reference, state: mode === 'existing' ? 'review_required' : 'verified_for_review',
        reason: mode === 'existing' ? 'existing_or_uncertain_service' : 'new_service_checks_passed',
        checkedAt: new Date(now).toISOString(), validUntil: new Date(now + (mode === 'expired' ? -1000 : 30000)).toISOString(),
        months: 6, connections: 3, costCredits: '15', packageName: '6 Months + 3 Connections' } });
    });
    const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
    await page.goto('https://new-service-orders.invalid/'); assert.equal(calls, 0);
    await page.getByText('Paid new-service orders', { exact: true }).click();
    const load = page.getByRole('button', { name: 'Load new-service orders' }); await load.click();
    const check = page.getByRole('button', { name: 'Check new-service order', exact: true }); await check.waitFor();
    assert.equal(await page.locator('li').count(), 1); assert.ok((await check.boundingBox()).height >= 44);
    await check.click(); await page.getByText('Payment, account history and provider package checks passed.', { exact: true }).waitFor();
    assert.ok((await page.locator('body').innerText()).includes('Provider cost: 15 credits'));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    assert.equal(await page.getByRole('button', { name: /activate|create account|send/i }).count(), 0);
    passed++; console.log(`PASS: ${width}px actual CRM component loads and checks a saved purchase without an activation control`);
    mode = 'existing'; await check.click(); await page.getByText('Existing service, another order, or prior setup activity needs review.', { exact: true }).waitFor();
    assert.ok(!(await page.locator('body').innerText()).includes('Provider cost: 15 credits'));
    mode = 'expired'; await check.click(); await page.getByRole('alert').waitFor(); assert.equal(await page.getByRole('status').count(), 0);
    passed++; console.log(`PASS: ${width}px changed service and expired reviews clear the old quote`);
    mode = 'failure'; await load.click(); await page.getByRole('alert').waitFor(); assert.equal(await page.locator('li').count(), 0);
    assert.ok(!(await page.locator('body').innerText()).includes('PRIVATE_BACKEND_ERROR'));
    mode = 'success'; await load.click(); await check.waitFor();
    mode = 'throttle'; await check.click(); await page.getByText('Wait 30 seconds before checking again.', { exact: true }).waitFor();
    passed++; console.log(`PASS: ${width}px failed reloads clear stale orders and throttling leaves no usable quote`);
    mode = 'switch'; await check.click(); await page.getByRole('alert').waitFor(); assert.equal(await page.getByRole('status').count(), 0);
    assert.deepEqual(errors, []); passed++; console.log(`PASS: ${width}px account changes reject an in-flight review`);
    await context.close();
  }
  console.log(`${passed} actual new-service CRM browser journeys passed with all Auth/HTTP intercepted.`);
} finally { await browser.close(); }
