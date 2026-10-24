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
let serviceMode = 'linked';
const id = n => `55555555-5555-4555-8555-${String(n).padStart(12, '0')}`;
const rows = Array.from({ length: 12 }, (_, i) => ({
  id: id(i + 1), external_id: i + 1, username: `user_${i + 1}`,
  customer_name: `Fictional Customer ${String(i + 1).padStart(2, '0')}`,
  email: `fixture${i + 1}@example.invalid`, source: 'manual',
  iptv_password: 'FICTIONAL-NOT-FOR-LIST', account_status: 'active',
  payment_status: 'paid', monthly_price: 10, trial: false, connections_allowed: 3,
  expiration_at: '2030-10-28T12:00:00Z', package_name: '6 Months + 3 Connections',
}));
const methods = [], profileWrites = [], replyWrites = [], pageErrors = [], blocked = [];
let profile = { id: id(100), full_name: 'Fictional account name', updated_at: '2026-10-24T08:00:00.123456+00:00' };
const supportTickets = Array.from({ length: 12 }, (_, i) => ({ id: id(400 + i), user_id: id(100), subject: `Fictional support ${String(i + 1).padStart(2, '0')}`, description: 'Fictional support problem', category: 'Technical Issue', priority: 'normal', status: 'open', created_at: '2026-10-24T08:00:00Z' }));
const supportReplies = Array.from({ length: 45 }, (_, i) => ({ id: id(645 - i), ticket_id: id(400), user_id: i % 2 ? id(200) : id(100), message: `Fictional conversation reply ${45 - i}`, is_staff: Boolean(i % 2), delivery_status: i % 2 ? 'sent' : 'not_requested', created_at: '2026-10-24T09:00:00Z' }));
try {
  // This build uses only fictional service configuration and copies no APK/assets.
  await build({ publicDir: false, logLevel: 'silent', define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://fictional.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('fictional-publishable-key'),
  }, build: { outDir: directory, emptyOutDir: true } });
  server = createServer(async (req, res) => {
    if (req.method !== 'GET') { methods.push(req.method); res.writeHead(405); res.end(); return; }
    if (req.url === '/api/ks-customer-setup?view=crm-service') {
      methods.push(req.method);
      assert.ok(req.headers.authorization?.startsWith('Bearer '));
      res.writeHead(serviceMode === 'failure' ? 503 : 200, { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' });
      res.end(JSON.stringify(serviceMode === 'failure' ? { error: 'PRIVATE-FIXTURE-ERROR' } : {
        accountId: id(100), checkedAt: '2026-10-22T12:00:00Z', payments: serviceMode === 'unlinked' ? [] : [{ id: id(300), customerId: id(1), amountCents: 9500, method: 'manual_paypal', paidAt: '2026-08-03T20:17:00Z', months: 6, connections: 3 }], nextCursor: null,
        services: serviceMode === 'unlinked' ? [] : [{ customerId: id(1), username: 'user_1', name: 'Fictional Customer 01', packageName: '6 Months + 3 Connections', connections: 3, expiresAt: '2030-10-28T12:00:00Z', savedStatus: 'active', legacyPaid: false, updatedAt: '2026-10-22T12:00:00Z' }],
      }));
      return;
    }
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
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, apikey, x-client-info, content-type, x-supabase-api-version', 'access-control-allow-methods': 'GET, PATCH, POST, OPTIONS', 'content-type': 'application/json' };
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      methods.push(request.method());
      if (url.pathname === '/rest/v1/profiles') {
        assert.equal(url.searchParams.get('id'), 'eq.' + user.id);
        assert.equal(url.searchParams.get('select'), 'id,full_name,updated_at');
        if (request.method() === 'PATCH') {
          assert.deepEqual([...url.searchParams.keys()].sort(), ['id', 'select', 'updated_at']);
          const body = request.postDataJSON(); assert.deepEqual(Object.keys(body), ['full_name']);
          assert.equal(body.full_name, 'Fictional revised name');
          assert.equal(url.searchParams.get('updated_at'), 'eq.' + profile.updated_at);
          assert.equal(request.headers().prefer, 'return=representation');
          profileWrites.push(body); profile = { ...profile, ...body, updated_at: '2026-10-24T08:01:00.123456+00:00' };
        } else { assert.equal(request.method(), 'GET'); assert.deepEqual([...url.searchParams.keys()].sort(), ['id', 'select']); }
        return route.fulfill({ status: 200, headers, body: JSON.stringify([profile]) });
      }
      if (['/rest/v1/support_tickets', '/rest/v1/ticket_replies'].includes(url.pathname)) {
        const tickets = url.pathname.endsWith('/support_tickets'), q = url.searchParams;
        assert.equal(q.get('select'), tickets ? 'id,user_id,subject,description,status,priority,category,created_at' : 'id,ticket_id,user_id,message,is_staff,delivery_status,created_at');
        let data;
        if (request.method() === 'POST') {
          assert.equal(tickets, false); const body = request.postDataJSON();
          assert.deepEqual(body, { ticket_id: id(400), user_id: user.id, message: 'Fictional customer reply', is_staff: false });
          replyWrites.push(body); const saved = { ...supportReplies[0], ...body, id: id(999), delivery_status: 'not_requested', created_at: '2026-10-24T09:01:00Z' }; supportReplies.unshift(saved); data = [saved];
        } else {
          assert.equal(request.method(), 'GET');
          if (tickets) { assert.equal(q.get('user_id'), 'eq.' + user.id); data = q.has('id') ? supportTickets.filter(t => q.get('id') === 'eq.' + t.id) : supportTickets; }
          else { assert.equal(q.get('ticket_id'), 'eq.' + id(400)); data = supportReplies; }
          if (!q.has('id')) { assert.equal(q.get('order'), 'created_at.desc,id.desc'); const limit = tickets ? 6 : 21; assert.equal(Number(q.get('limit')), limit); const offset = Number(q.get('offset') ?? 0); data = data.slice(offset, offset + limit); }
        }
        const body = request.headers().accept?.includes('object') ? data[0] ?? null : data;
        return route.fulfill({ status: 200, headers, body: JSON.stringify(body) });
      }
      assert.equal(request.method(), 'GET', 'Only the separately validated fictional profile-name PATCH and customer-reply POST are allowed');
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
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto(origin + '/client/devices');
  await page.getByRole('heading', { name: 'Your connection allowance', exact: true }).waitFor();
  await page.getByText('6 Months + 3 Connections', { exact: true }).waitFor();
  assert.equal(await page.getByText('Connections allowed', { exact: true }).count(), 1);
  assert.equal(await page.getByText('$95.00', { exact: false }).count(), 0);
  assert.equal(await page.getByRole('button', { name: 'End session', exact: true }).count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  serviceMode = 'unlinked';
  await page.getByRole('button', { name: 'Refresh service details', exact: true }).click();
  await page.getByText('Your streaming account has not been linked', { exact: false }).waitFor();
  assert.equal(await page.getByText('Connections allowed', { exact: true }).count(), 0);
  serviceMode = 'failure';
  await page.getByRole('button', { name: 'Refresh service details', exact: true }).click();
  await page.getByRole('alert').waitFor();
  assert.equal(await page.getByText('PRIVATE-FIXTURE-ERROR', { exact: false }).count(), 0);
  serviceMode = 'linked';
  await page.getByRole('button', { name: 'Refresh service details', exact: true }).click();
  await page.getByText('6 Months + 3 Connections', { exact: true }).waitFor();
  await page.goto(origin + '/client/history');
  await page.getByRole('heading', { name: 'Viewing history is unavailable here', exact: true }).waitFor();
  assert.equal(await page.getByRole('link', { name: 'View service & payment records', exact: true }).getAttribute('href'), '/client/subscription');
  assert.equal(await page.getByText("You haven't watched any content yet.", { exact: false }).count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  await page.goto(origin + '/client/account');
  await page.getByRole('region', { name: 'Your website account', exact: true }).waitFor();
  await page.getByText('Fictional account name', { exact: true }).waitFor();
  assert.equal(await page.getByText('djudge47@gmail.com', { exact: true }).count(), 1);
  await page.getByRole('button', { name: 'Edit full name', exact: true }).click();
  await page.getByLabel('Full name', { exact: true }).fill('Discard fictional draft');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByText('Fictional account name', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Edit full name', exact: true }).click();
  await page.getByLabel('Full name', { exact: true }).fill('Fictional revised name');
  for (const label of ['Save name', 'Cancel']) { const box = await page.getByRole('button', { name: label, exact: true }).boundingBox(); assert.ok(box.height >= 48); }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  await page.getByRole('button', { name: 'Save name', exact: true }).click();
  await page.getByText('Your name has been saved.', { exact: true }).waitFor();
  await page.getByText('Fictional revised name', { exact: true }).waitFor();
  assert.equal(profileWrites.length, 1);
  await page.getByRole('button', { name: 'Reload profile', exact: true }).click();
  await page.getByText('Fictional revised name', { exact: true }).waitFor();
  await page.goto(origin + '/client/support');
  const ticketDirectory = page.getByRole('list', { name: 'Ticket directory', exact: true });
  await ticketDirectory.waitFor(); assert.equal(await ticketDirectory.getByRole('listitem').count(), 5);
  await page.getByRole('navigation', { name: 'Ticket pages', exact: true }).getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByText('Fictional support 06', { exact: true }).waitFor();
  await page.getByRole('navigation', { name: 'Ticket pages', exact: true }).getByRole('button', { name: 'Previous', exact: true }).click();
  await ticketDirectory.getByRole('button').first().click();
  await page.getByRole('heading', { name: 'Fictional support 01', exact: true }).waitFor();
  const conversation = page.getByRole('list', { name: 'Ticket replies', exact: true });
  assert.equal(await conversation.getByRole('listitem').count(), 20);
  assert.ok((await conversation.boundingBox()).height <= 320);
  assert.equal(await conversation.getAttribute('tabindex'), '0');
  assert.equal(await conversation.evaluate(element => element.scrollHeight > element.clientHeight), true);
  await page.getByRole('button', { name: 'Earlier replies', exact: true }).click();
  await page.getByText('Fictional conversation reply 6', { exact: true }).waitFor();
  assert.equal(await conversation.getByRole('listitem').count(), 20);
  assert.equal(await page.getByText('Fictional conversation reply 45', { exact: true }).count(), 0);
  await page.getByRole('button', { name: 'Newer replies', exact: true }).click();
  await page.getByText('Fictional conversation reply 45', { exact: true }).waitFor();
  await page.getByLabel('Your reply', { exact: true }).fill('Fictional customer reply');
  const replyButton = page.getByRole('button', { name: 'Save reply', exact: true });
  assert.ok((await replyButton.boundingBox()).height >= 48);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  if (process.env.KS_BROWSER_SCREENSHOT_DIR) await page.screenshot({ path: resolve(process.env.KS_BROWSER_SCREENSHOT_DIR, 'ks-support-phone.png'), fullPage: true });
  await replyButton.click();
  await page.getByText('Reply saved in your ticket. This does not confirm email delivery.', { exact: true }).waitFor();
  await page.getByText('Fictional customer reply', { exact: true }).waitFor(); assert.equal(replyWrites.length, 1);
  await page.getByRole('button', { name: 'Back to tickets', exact: true }).click(); await ticketDirectory.waitFor();
  assert.equal(await ticketDirectory.getByRole('listitem').count(), 5);
  await context.close();
  const ordinary = await contextFor('ordinary@example.invalid');
  const denied = await ordinary.newPage(); denied.on('pageerror', error => pageErrors.push(error.message));
  await denied.goto(origin + '/admin/crm'); await denied.waitForURL('**/login');
  assert.equal(await denied.getByRole('list', { name: 'Customer directory' }).count(), 0);
  await ordinary.close();
  const beforeSignedOut = methods.length;
  const signedOut = await browser.newContext({ viewport: { width: 320, height: 760 } });
  await signedOut.addInitScript(() => { if (location.protocol === 'http:') localStorage.setItem('installPromptDismissed9506', String(Date.now())); });
  await signedOut.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  const noSession = await signedOut.newPage(); noSession.on('pageerror', error => pageErrors.push(error.message));
  await noSession.goto(origin + '/client/devices');
  await noSession.getByRole('link', { name: 'Sign in to your website account', exact: true }).waitFor();
  assert.equal(await noSession.getByRole('heading', { name: 'Your connection allowance', exact: true }).count(), 0);
  assert.equal(methods.length, beforeSignedOut, 'Signed-out Devices must not request private service data');
  await noSession.goto(origin + '/client/account');
  await noSession.getByRole('link', { name: 'Sign in to your website account', exact: true }).waitFor();
  assert.equal(await noSession.getByRole('region', { name: 'Your website account', exact: true }).count(), 0);
  assert.equal(methods.length, beforeSignedOut, 'Signed-out Account must not request or write a profile');
  await noSession.goto(origin + '/client/support');
  await noSession.getByRole('link', { name: 'Sign in to your website account', exact: true }).waitFor();
  assert.equal(await noSession.getByRole('list', { name: 'Ticket directory', exact: true }).count(), 0);
  assert.equal(methods.length, beforeSignedOut, 'Signed-out Support must not request or write tickets/replies');
  await signedOut.close();
  assert.deepEqual(pageErrors, []); assert.ok(methods.length > 0 && methods.filter(method => method !== 'GET').length === 2 && profileWrites.length === 1 && replyWrites.length === 1 && methods.includes('PATCH') && methods.includes('POST'));
  console.log('PASS: real Chromium/production-code fixture preserves phone paging, selected/Edit identity, browser Back, Back link search state, 320px touch layout, six-panel desktop view and ordinary-user denial.');
  console.log('PASS: customer Devices shows verified allowance without session controls/receipts, separates missing links and failed reads, recovers on refresh, and History discloses unavailable activity at 320px.');
  console.log('PASS: customer Account at 320px supports Cancel, an owner/revision-bound name save, confirmed returned details and reload; signed-out users make no private profile request.');
  console.log('PASS: 320px Support uses five-ticket pages and one selected thread, pages twenty replies without mixing them, confirms one fictional reply and returns to the directory; signed-out Support makes no private request.');
  console.log('Offline fictional Auth/data only; external network blocked; one strictly allowlisted fictional name PATCH and customer-reply POST, no real record/Auth write, provider, payment or email operation.');
} finally {
  await browser?.close(); if (server) await new Promise(resolve => server.close(resolve));
  await rm(directory, { recursive: true, force: true });
}
