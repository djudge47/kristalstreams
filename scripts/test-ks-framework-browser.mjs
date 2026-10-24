import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { build } from 'vite';

assert.ok(process.env.KS_PLAYWRIGHT_MODULE, 'Set KS_PLAYWRIGHT_MODULE to the isolated playwright-core module');
const { chromium } = await import(pathToFileURL(process.env.KS_PLAYWRIGHT_MODULE));
const require = createRequire(import.meta.url);
const provided = process.env.KS_CHROMIUM_MODULE ? require(process.env.KS_CHROMIUM_MODULE) : null;
const bundled = provided?.default ?? provided;
const executablePath = process.env.KS_BROWSER_EXECUTABLE ?? await bundled?.executablePath();
assert.ok(executablePath, 'Supply an isolated Chromium executable');
const directory = await mkdtemp(resolve(tmpdir(), 'ks-framework-browser-app-'));
let server, browser;
const id = n => `55555555-5555-4555-8555-${String(n).padStart(12, '0')}`;
const rows = Array.from({ length: 12 }, (_, i) => ({
  id: id(i + 1), external_id: i + 1, username: `user_${i + 1}`,
  customer_name: `Fictional Customer ${String(i + 1).padStart(2, '0')}`,
  email: `fixture${i + 1}@example.invalid`, source: 'manual',
  iptv_password: 'FICTIONAL-NOT-FOR-LIST', account_status: 'active',
  payment_status: 'paid', monthly_price: 10, trial: false, connections_allowed: 3,
  expiration_at: '2030-10-28T12:00:00Z', package_name: '6 Months + 3 Connections',
}));
const methods = [], pageErrors = [], blocked = [];
try {
  // This build uses only fictional service configuration and copies no APK/assets.
  await build({ publicDir: false, logLevel: 'silent', define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://fictional.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('fictional-publishable-key'),
  }, build: { outDir: directory, emptyOutDir: true } });
  server = createServer(async (req, res) => {
    if (req.method !== 'GET') { methods.push(req.method); res.writeHead(405); res.end(); return; }
    if (req.url.startsWith('/api/')) { res.writeHead(503, { 'Content-Type': 'application/json' }); res.end('{"error":"Offline fixture: provider operations unavailable"}'); return; }
    let file = resolve(directory, '.' + new URL(req.url, 'http://fixture.invalid').pathname);
    if (!file.startsWith(directory + sep)) file = resolve(directory, 'index.html');
    try {
      let bytes;
      try { bytes = await readFile(file); } catch { file = resolve(directory, 'index.html'); bytes = await readFile(file); }
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
      res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' }); res.end(bytes);
    } catch { res.writeHead(500); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ executablePath, args: (bundled?.args ?? ['--no-sandbox', '--disable-dev-shm-usage']).filter(arg => !['--single-process', '--disable-web-security', '--allow-running-insecure-content'].includes(arg)), headless: true });
  async function contextFor(email) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const user = { id: id(100), email, email_confirmed_at: '2026-01-01T00:00:00Z', is_anonymous: false, app_metadata: {}, user_metadata: {}, aud: 'authenticated', role: 'authenticated', created_at: '2026-01-01T00:00:00Z' };
    await context.addInitScript(({ user }) => {
      if (location.protocol !== 'http:') return;
      localStorage.setItem('installPromptDismissed9506', String(Date.now()));
      const token = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) + '.' + btoa(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })) + '.fictional-signature';
      localStorage.setItem('supabase.auth.token', JSON.stringify({ access_token: token, refresh_token: 'fictional-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user }));
    }, { user });
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.origin === origin) return route.continue();
      if (url.origin !== 'https://fictional.supabase.co') { blocked.push(url.origin); return route.abort(); }
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, apikey, x-client-info, content-type, x-supabase-api-version', 'access-control-allow-methods': 'GET, OPTIONS', 'content-type': 'application/json' };
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      methods.push(request.method());
      assert.equal(request.method(), 'GET', 'Fixture forbids all database/Auth writes');
      if (url.pathname === '/auth/v1/user') return route.fulfill({ status: 200, headers, body: JSON.stringify(user) });
      const table = url.pathname.split('/').at(-1);
      assert.ok(['iptv_customers', 'iptv_payments', 'iptv_customer_activity', 'iptv_reminder_queue'].includes(table), `Unexpected fixture read: ${table}`);
      return route.fulfill({ status: 200, headers, body: JSON.stringify(table === 'iptv_customers' ? rows : []) });
    });
    return context;
  }
  const context = await contextFor('djudge47@gmail.com');
  const page = await context.newPage(); page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(origin + '/admin/crm');
  const list = page.getByRole('list', { name: 'Customer directory' });
  await list.waitFor(); assert.equal(await list.getByRole('listitem').count(), 5);
  assert.equal(await page.locator('article').count(), 0);
  assert.equal(await page.locator('#crm-workspace-tools').count(), 0);
  assert.equal(await page.getByText('FICTIONAL-NOT-FOR-LIST', { exact: true }).count(), 0);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await list.getByRole('link', { name: 'Open Fictional Customer 06, Panel ID 6', exact: true }).waitFor();
  await list.getByRole('link').first().click();
  await page.getByRole('link', { name: 'Back to customers', exact: true }).waitFor();
  assert.ok(page.url().endsWith('/admin/crm/customer/' + id(6)));
  assert.equal(await page.locator('article').count(), 1);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByRole('heading', { name: 'Edit IPTV Customer', exact: true }).waitFor();
  assert.equal(await page.getByLabel('IPTV username', { exact: true }).inputValue(), 'user_6');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.goBack(); await list.waitFor();
  assert.ok((await page.getByRole('navigation', { name: 'Customer list pages' }).innerText()).includes('Page 2 of 3'));
  await page.getByLabel('Find a customer', { exact: true }).fill('user_12');
  await list.getByRole('link', { name: 'Open Fictional Customer 12, Panel ID 12', exact: true }).waitFor();
  await list.getByRole('link').click();
  await page.getByRole('link', { name: 'Back to customers', exact: true }).click();
  await list.waitFor(); assert.equal(await page.getByLabel('Find a customer', { exact: true }).inputValue(), 'user_12');
  assert.equal(await list.getByRole('listitem').count(), 1);
  assert.equal(new URL(page.url()).search, '');
  await page.getByRole('button', { name: 'Clear customer search', exact: true }).click();
  await page.setViewportSize({ width: 320, height: 760 });
  assert.equal(await list.getByRole('listitem').count(), 5);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  const box = await list.getByRole('link').first().boundingBox(); assert.ok(box.height >= 80);
  if (process.env.KS_BROWSER_SCREENSHOT_DIR) await page.screenshot({ path: resolve(process.env.KS_BROWSER_SCREENSHOT_DIR, 'ks-framework-phone.png') });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('article').first().waitFor(); assert.equal(await page.locator('article').count(), 6);
  assert.equal(await page.getByRole('list', { name: 'Customer directory' }).count(), 0);
  await page.getByRole('button', { name: 'Expand admin navigation', exact: true }).click();
  await page.waitForFunction(() => { const box = document.querySelector('aside').getBoundingClientRect(); return Math.abs(box.width - 256) < 1 && Math.abs(box.x) < 1; });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  if (process.env.KS_BROWSER_SCREENSHOT_DIR) await page.screenshot({ path: resolve(process.env.KS_BROWSER_SCREENSHOT_DIR, 'ks-framework-desktop.png') });
  await context.close();
  const ordinary = await contextFor('ordinary@example.invalid');
  const denied = await ordinary.newPage(); denied.on('pageerror', error => pageErrors.push(error.message));
  await denied.goto(origin + '/admin/crm'); await denied.waitForURL('**/login');
  assert.equal(await denied.getByRole('list', { name: 'Customer directory' }).count(), 0);
  await ordinary.close();
  assert.deepEqual(pageErrors, []); assert.ok(methods.length > 0 && methods.every(method => method === 'GET'));
  console.log('PASS: real Chromium/production-code fixture preserves phone paging, selected/Edit identity, browser Back, Back link search state, 320px touch layout, six-panel desktop view and ordinary-user denial.');
  console.log('Offline fictional Auth/data only; external network blocked; no database/Auth write, provider, payment or email operation.');
} finally {
  await browser?.close(); if (server) await new Promise(resolve => server.close(resolve));
  await rm(directory, { recursive: true, force: true });
}
