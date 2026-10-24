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
let serviceMode = 'linked', profileMode = 'normal', dashboardTicketMode = 'normal';
let activityReads = 0;
const id = n => `55555555-5555-4555-8555-${String(n).padStart(12, '0')}`;
const rows = Array.from({ length: 12 }, (_, i) => ({
  id: id(i + 1), external_id: i + 1, username: `user_${i + 1}`,
  customer_name: `Fictional Customer ${String(i + 1).padStart(2, '0')}`,
  email: `fixture${i + 1}@example.invalid`, source: 'manual',
  iptv_password: 'FICTIONAL-NOT-FOR-LIST', account_status: 'active',
  payment_status: 'paid', monthly_price: 10, trial: false, connections_allowed: 3,
  expiration_at: '2030-10-28T12:00:00Z', package_name: '6 Months + 3 Connections',
}));
const methods = [], profileWrites = [], replyWrites = [], ticketWrites = [], pageErrors = [], blocked = [];
const recoveryExchanges = [], recoveryWrites = [];
const resetRequests = [];
let releasePasswordUpdate;
let releaseResetRequest;
let profile = { id: id(100), full_name: 'Fictional account name', updated_at: '2026-10-24T08:00:00.123456+00:00' };
const websiteProfile = { id: id(100), subscription_tier: 'bronze', subscription_status: 'active', connections_allowed: 1, subscription_expires_at: '2026-11-12T22:45:08Z', updated_at: '2026-10-24T08:00:00Z' };
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
      res.writeHead(serviceMode === 'hidden' ? 404 : serviceMode === 'failure' ? 503 : 200, { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' });
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
  async function contextFor(email, recovery = false, resetRequest = false) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const user = { id: id(100), email, email_confirmed_at: '2026-01-01T00:00:00Z', is_anonymous: false, app_metadata: {}, user_metadata: {}, aud: 'authenticated', role: 'authenticated', created_at: '2026-01-01T00:00:00Z' };
    await context.addInitScript(({ user, recovery }) => {
      if (location.protocol !== 'http:') return;
      localStorage.setItem('installPromptDismissed9506', String(Date.now()));
      if (recovery) {
        localStorage.setItem('supabase.auth.token-code-verifier', JSON.stringify('fictional-verifier-for-offline-recovery/recovery'));
        return;
      }
      const token = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) + '.' + btoa(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })) + '.fictional-signature';
      localStorage.setItem('supabase.auth.token', JSON.stringify({ access_token: token, refresh_token: 'fictional-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user }));
    }, { user, recovery });
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.origin === origin && url.pathname === '/api/ks-roomba-account') {
        assert.equal(request.method(), 'GET'); assert.equal(url.search, '?view=activity-support');
        assert.match(request.headers().authorization, /^Bearer /); activityReads++;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
          status: activityReads === 1 ? 'activity_response_received' : 'activity_unverified', checkedAt: new Date().toISOString(),
          message: 'PRIVATE-UNTRUSTED-MESSAGE', mode: 'read-only', databaseWrites: false }) });
      }
      if (url.origin === origin) return route.continue();
      if (url.origin !== 'https://fictional.supabase.co') { blocked.push(url.origin); return route.abort(); }
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, apikey, x-client-info, content-type, x-supabase-api-version', 'access-control-allow-methods': 'GET, HEAD, PATCH, POST, PUT, OPTIONS', 'content-type': 'application/json' };
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      methods.push(request.method());
      if (url.pathname === '/auth/v1/recover') {
        assert.equal(resetRequest, true); assert.equal(request.method(), 'POST');
        assert.deepEqual([...url.searchParams.keys()], ['redirect_to']);
        assert.equal(url.searchParams.get('redirect_to'), origin + '/reset-password');
        const body = request.postDataJSON();
        assert.deepEqual(Object.keys(body).sort(), ['code_challenge', 'code_challenge_method', 'email', 'gotrue_meta_security']);
        assert.equal(body.email, 'reset-request@example.invalid'); assert.match(body.code_challenge, /^[A-Za-z0-9_-]{43}$/); assert.equal(body.code_challenge_method, 's256'); assert.deepEqual(body.gotrue_meta_security, {});
        resetRequests.push(true); assert.equal(resetRequests.length, 1);
        await new Promise(resolve => { releaseResetRequest = resolve; });
        return route.fulfill({ status: 200, headers, body: '{}' });
      }
      if (url.pathname === '/auth/v1/token') {
        assert.equal(recovery, true); assert.equal(request.method(), 'POST');
        assert.equal(url.search, '?grant_type=pkce');
        assert.deepEqual(request.postDataJSON(), { auth_code: 'fictional-recovery-code', code_verifier: 'fictional-verifier-for-offline-recovery' });
        recoveryExchanges.push(true); assert.equal(recoveryExchanges.length, 1);
        const token = Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url') + '.' + Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url') + '.fictional-signature';
        return route.fulfill({ status: 200, headers, body: JSON.stringify({ access_token: token, refresh_token: 'fictional-recovery-refresh', token_type: 'bearer', expires_in: 3600, user }) });
      }
      if (url.pathname === '/auth/v1/user' && request.method() === 'PUT') {
        assert.equal(recovery, true); assert.equal(url.search, '');
        assert.deepEqual(request.postDataJSON(), { password: 'fictional recovery password', code_challenge: null, code_challenge_method: null });
        const jwt = request.headers().authorization.split(' ')[1];
        assert.equal(JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url')).sub, user.id);
        recoveryWrites.push(true); assert.equal(recoveryWrites.length, 1);
        await new Promise(resolve => { releasePasswordUpdate = resolve; });
        return route.fulfill({ status: 200, headers, body: JSON.stringify(user) });
      }
      if (url.pathname === '/rest/v1/profiles') {
        assert.equal(url.searchParams.get('id'), 'eq.' + user.id);
        if (url.searchParams.get('select') === 'id,subscription_tier,subscription_status,connections_allowed,subscription_expires_at,updated_at') {
          assert.equal(request.method(), 'GET'); assert.deepEqual([...url.searchParams.keys()].sort(), ['id', 'select']);
          return route.fulfill({ status: profileMode === 'failure' ? 403 : 200, headers, body: JSON.stringify(profileMode === 'failure' ? { message: 'PRIVATE-PLAN-ERROR' } : profileMode === 'missing' ? [] : [websiteProfile]) });
        }
        assert.equal(url.searchParams.get('select'), 'id,full_name,updated_at');
        if (request.method() === 'PATCH') {
          assert.deepEqual([...url.searchParams.keys()].sort(), ['id', 'select', 'updated_at']);
          const body = request.postDataJSON(); assert.deepEqual(Object.keys(body), ['full_name']);
          assert.equal(body.full_name, 'Fictional revised name');
          assert.equal(url.searchParams.get('updated_at'), 'eq.' + profile.updated_at);
          assert.equal(request.headers().prefer, 'return=representation');
          profileWrites.push(body); profile = { ...profile, ...body, updated_at: '2026-10-24T08:01:00.123456+00:00' };
        } else { assert.equal(request.method(), 'GET'); assert.deepEqual([...url.searchParams.keys()].sort(), ['id', 'select']); }
        if (request.method() === 'GET' && profileMode === 'missing') return route.fulfill({ status: 200, headers, body: '[]' });
        return route.fulfill({ status: 200, headers, body: JSON.stringify([profile]) });
      }
      if (['/rest/v1/support_tickets', '/rest/v1/ticket_replies'].includes(url.pathname)) {
        const tickets = url.pathname.endsWith('/support_tickets'), q = url.searchParams;
        if (tickets && request.method() === 'HEAD') {
          assert.equal(q.get('select'), 'id'); assert.equal(q.get('user_id'), 'eq.' + user.id); assert.deepEqual(q.getAll('status'), ['not.ilike.closed', 'not.ilike.resolved']);
          assert.equal(request.headers().prefer, 'count=exact');
          return route.fulfill({ status: dashboardTicketMode === 'failure' ? 403 : 200, headers: { ...headers, 'content-range': `*/${supportTickets.filter(t => !['closed', 'resolved'].includes(t.status.toLowerCase())).length}`, 'access-control-expose-headers': 'content-range' }, body: '' });
        }
        if (tickets && q.get('select') === 'id,user_id,subject,status,priority,created_at') {
          assert.equal(request.method(), 'GET'); assert.equal(q.get('user_id'), 'eq.' + user.id); assert.equal(q.get('order'), 'created_at.desc,id.desc'); assert.equal(q.get('limit'), '5');
          return route.fulfill({ status: 200, headers, body: JSON.stringify(supportTickets.slice(0, 5).map(({ id, user_id, subject, status, priority, created_at }) => ({ id, user_id, subject, status, priority, created_at }))) });
        }
        assert.equal(q.get('select'), tickets ? 'id,user_id,subject,description,status,priority,category,created_at' : 'id,ticket_id,user_id,message,is_staff,delivery_status,created_at');
        let data;
        if (request.method() === 'POST') {
          const body = request.postDataJSON();
          if (tickets) {
            assert.deepEqual(body, { user_id: user.id, subject: 'Fictional new support request', description: 'Fictional new support description', category: 'Billing', priority: 'normal', status: 'open' });
            ticketWrites.push(body); const saved = { id: id(1000), ...body, created_at: '2026-10-24T10:00:00Z' }; supportTickets.unshift(saved);
            return route.fulfill({ status: 200, headers, body: JSON.stringify(request.headers().accept?.includes('object') ? saved : [saved]) });
          }
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
      assert.equal(request.method(), 'GET', 'Only separately validated fictional writes are allowed');
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
  await page.goto(origin + '/dashboard');
  await page.getByRole('heading', { name: 'Dashboard', exact: true }).waitFor();
  const recentTickets = page.getByRole('list', { name: 'Recent support tickets', exact: true });
  await recentTickets.waitFor(); assert.equal(await recentTickets.getByRole('listitem').count(), 5);
  await page.getByText('Active support tickets: 12', { exact: true }).waitFor();
  await page.getByText('6 Months + 3 Connections', { exact: true }).waitFor();
  assert.equal(await page.getByText('Website plan:', { exact: false }).count(), 0);
  assert.equal(await page.locator('table').count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  if (process.env.KS_BROWSER_SCREENSHOT_DIR) await page.screenshot({ path: resolve(process.env.KS_BROWSER_SCREENSHOT_DIR, 'ks-dashboard-phone.png'), fullPage: true });
  profileMode = 'missing'; await page.getByRole('button', { name: 'Refresh account', exact: true }).click();
  await page.getByText('Your website profile was not found. Contact support for help.', { exact: true }).waitFor();
  assert.equal(await recentTickets.getByRole('listitem').count(), 5);
  assert.equal(await page.getByText('6 Months + 3 Connections', { exact: true }).count(), 1);
  profileMode = 'normal'; await page.getByRole('button', { name: 'Refresh account', exact: true }).click();
  await page.getByText('Fictional revised name', { exact: true }).waitFor();
  dashboardTicketMode = 'failure'; await page.getByRole('button', { name: 'Refresh tickets', exact: true }).click();
  await page.getByText('Your support summary could not be loaded.', { exact: false }).waitFor();
  assert.equal(await page.getByText('No support tickets yet.', { exact: true }).count(), 0);
  assert.equal(await page.getByText('6 Months + 3 Connections', { exact: true }).count(), 1);
  dashboardTicketMode = 'normal'; await page.getByRole('button', { name: 'Refresh tickets', exact: true }).click(); await recentTickets.waitFor();
  await page.setViewportSize({ width: 1440, height: 1000 });
  assert.equal(await recentTickets.getByRole('listitem').count(), 5);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  if (process.env.KS_BROWSER_SCREENSHOT_DIR) await page.screenshot({ path: resolve(process.env.KS_BROWSER_SCREENSHOT_DIR, 'ks-dashboard-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 320, height: 760 });
  await recentTickets.getByRole('link').first().click();
  await page.getByRole('heading', { name: 'Fictional support 01', exact: true }).waitFor();
  await page.waitForFunction(() => window.scrollY <= 1);
  await page.getByRole('button', { name: 'Back to tickets', exact: true }).click();
  await page.goto(origin + '/client/subscription');
  await page.getByRole('heading', { name: 'Subscription Details', exact: true }).waitFor();
  await page.getByText('6 Months + 3 Connections', { exact: true }).waitFor();
  assert.equal(await page.getByRole('region', { name: 'Saved website plan', exact: true }).count(), 0);
  profileMode = 'missing'; await page.getByRole('button', { name: 'Refresh subscription', exact: true }).click();
  await page.getByText('6 Months + 3 Connections', { exact: true }).waitFor();
  assert.equal(await page.getByText('No Active Website Plan', { exact: true }).count(), 0);
  serviceMode = 'unlinked'; await page.getByRole('button', { name: 'Refresh subscription', exact: true }).click();
  await page.getByText('Your website plan record was not found.', { exact: false }).waitFor();
  profileMode = 'normal'; await page.getByRole('button', { name: 'Refresh subscription', exact: true }).click();
  await page.getByRole('heading', { name: 'Website Plan Access Period', exact: true }).waitFor();
  assert.equal(await page.getByText('Website record updated', { exact: true }).count(), 1);
  assert.equal(await page.locator('table').count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  if (process.env.KS_BROWSER_SCREENSHOT_DIR) await page.screenshot({ path: resolve(process.env.KS_BROWSER_SCREENSHOT_DIR, 'ks-subscription-phone.png'), fullPage: true });
  serviceMode = 'failure'; await page.getByRole('button', { name: 'Refresh subscription', exact: true }).click();
  await page.getByText('Your saved service and payment details could not be checked.', { exact: false }).waitFor();
  assert.equal(await page.getByRole('region', { name: 'Saved website plan', exact: true }).count(), 0);
  serviceMode = 'hidden'; await page.getByRole('button', { name: 'Refresh subscription', exact: true }).click();
  await page.getByRole('heading', { name: 'Website Plan Access Period', exact: true }).waitFor();
  serviceMode = 'linked'; await page.getByRole('button', { name: 'Refresh subscription', exact: true }).click();
  await page.getByText('6 Months + 3 Connections', { exact: true }).waitFor();
  assert.equal(await page.getByRole('region', { name: 'Saved website plan', exact: true }).count(), 0);
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
  await page.getByRole('link', { name: 'New ticket', exact: true }).click();
  await page.getByRole('heading', { name: 'New Support Ticket', exact: true }).waitFor();
  await page.getByLabel('Subject', { exact: true }).fill('Fictional new support request');
  await page.getByLabel('Description', { exact: true }).fill('Fictional new support description');
  await page.getByLabel('Category', { exact: true }).selectOption('Billing');
  const createButton = page.getByRole('button', { name: 'Create Ticket', exact: true });
  assert.ok((await createButton.boundingBox()).height >= 48);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  await createButton.click(); await page.waitForURL('**/client/support');
  await page.getByText('Fictional new support request', { exact: true }).waitFor(); assert.equal(ticketWrites.length, 1);
  await context.close();
  const activityContext = await contextFor('djudge47@gmail.com');
  const activityPage = await activityContext.newPage(); activityPage.on('pageerror', error => pageErrors.push(error.message));
  await activityPage.setViewportSize({ width: 320, height: 760 }); await activityPage.clock.install();
  await activityPage.goto(origin + '/admin/roomba');
  const activityButton = activityPage.getByRole('button', { name: 'Check activity connection', exact: true });
  await activityButton.waitFor(); assert.equal(activityReads, 0);
  assert.ok((await activityButton.boundingBox()).height >= 48);
  await activityButton.click();
  await activityPage.getByText(/Roomba returned an activity list/).waitFor();
  assert.equal(activityReads, 1); assert.equal(await activityPage.getByText('PRIVATE-UNTRUSTED-MESSAGE').count(), 0);
  assert.equal(await activityPage.getByRole('button', { name: 'Available in 60s', exact: true }).isDisabled(), true);
  await activityPage.clock.fastForward(60_001); assert.equal(activityReads, 1);
  await activityPage.reload(); await activityButton.waitFor(); assert.equal(activityReads, 1);
  await activityButton.click(); await activityPage.getByText(/Activity support is still unverified/).waitFor();
  assert.equal(activityReads, 2); assert.equal(await activityPage.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await activityContext.close();
  const ordinary = await contextFor('ordinary@example.invalid');
  const denied = await ordinary.newPage(); denied.on('pageerror', error => pageErrors.push(error.message));
  await denied.goto(origin + '/admin/crm'); await denied.waitForURL('**/login');
  assert.equal(await denied.getByRole('list', { name: 'Customer directory' }).count(), 0);
  await denied.goto(origin + '/reset-password?type=recovery');
  await denied.getByRole('link', { name: 'Open website Security', exact: true }).waitFor();
  assert.equal(await denied.getByLabel('New website password', { exact: true }).count(), 0, 'An ordinary session and URL flag are not a recovery event');
  await ordinary.close();
  const recoveryContext = await contextFor('recovery@example.invalid', true);
  const recoveryPage = await recoveryContext.newPage(); recoveryPage.on('pageerror', error => pageErrors.push(error.message));
  await recoveryPage.setViewportSize({ width: 320, height: 760 });
  await recoveryPage.goto(origin + '/reset-password?code=fictional-recovery-code');
  await recoveryPage.getByLabel('New website password', { exact: true }).waitFor();
  assert.equal(recoveryExchanges.length, 1, 'Actual SDK must exchange the fictional PKCE recovery code before enabling the lazy route');
  await recoveryPage.getByLabel('New website password', { exact: true }).fill('fictional recovery password');
  await recoveryPage.getByLabel('Confirm website password', { exact: true }).fill('fictional recovery password');
  await recoveryPage.getByRole('button', { name: 'Update website password', exact: true }).click();
  await recoveryPage.getByRole('button', { name: 'Updating website password...', exact: true }).waitFor();
  await recoveryPage.waitForFunction(() => document.querySelector('fieldset')?.disabled === true);
  assert.equal(await recoveryPage.getByLabel('New website password', { exact: true }).inputValue(), '');
  for (let i = 0; i < 1000 && !releasePasswordUpdate; i++) await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(typeof releasePasswordUpdate, 'function', 'The bounded fixture must receive exactly one password update');
  releasePasswordUpdate();
  await recoveryPage.getByText('Website password updated. Use your new password the next time you sign in.', { exact: true }).waitFor();
  assert.equal(await recoveryPage.getByLabel('New website password', { exact: true }).count(), 0);
  assert.equal(await recoveryPage.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await recoveryPage.reload();
  await recoveryPage.getByRole('link', { name: 'Open website Security', exact: true }).waitFor();
  assert.equal(await recoveryPage.getByLabel('New website password', { exact: true }).count(), 0, 'Reload cannot manufacture a new recovery grant from the persisted normal session');
  await recoveryContext.close();
  const requestContext = await contextFor('ordinary@example.invalid', false, true);
  const requestPage = await requestContext.newPage(); requestPage.on('pageerror', error => pageErrors.push(error.message));
  await requestPage.setViewportSize({ width: 320, height: 760 });
  await requestPage.clock.install();
  await requestPage.goto(origin + '/login');
  const forgot = requestPage.getByRole('link', { name: 'Forgot your password?', exact: true }); await forgot.waitFor();
  assert.ok((await forgot.boundingBox()).height >= 48);
  await forgot.click();
  await requestPage.getByRole('heading', { name: 'Reset your website password', exact: true }).waitFor();
  assert.equal(await requestPage.getByLabel('Website account email', { exact: true }).evaluate(element => element === document.activeElement), true);
  assert.equal(await requestPage.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  if (process.env.KS_BROWSER_SCREENSHOT_DIR) await requestPage.screenshot({ path: resolve(process.env.KS_BROWSER_SCREENSHOT_DIR, 'forgot-password-320.png'), fullPage: true });
  await requestPage.getByLabel('Website account email', { exact: true }).fill('reset-request@example.invalid');
  await requestPage.getByRole('button', { name: 'Request reset link', exact: true }).click();
  await requestPage.getByRole('button', { name: 'Requesting reset link...', exact: true }).waitFor();
  assert.equal(await requestPage.locator('fieldset').evaluate(element => element.disabled), true);
  assert.equal(await requestPage.getByLabel('Website account email', { exact: true }).inputValue(), '');
  await requestPage.getByRole('link', { name: 'Back to website sign in', exact: true }).click();
  await requestPage.getByRole('link', { name: 'Forgot your password?', exact: true }).click();
  await requestPage.getByRole('button', { name: 'Requesting reset link...', exact: true }).waitFor();
  for (let i = 0; i < 1000 && !releaseResetRequest; i++) await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(typeof releaseResetRequest, 'function'); assert.equal(resetRequests.length, 1);
  releaseResetRequest();
  await requestPage.getByText('If this address is eligible for website password recovery, check its inbox and spam folder for a reset link. This response does not confirm email delivery.', { exact: true }).waitFor();
  assert.equal(await requestPage.getByLabel('Website account email', { exact: true }).count(), 0);
  assert.equal(await requestPage.getByRole('button', { name: 'Start another reset request', exact: true }).isDisabled(), true);
  await requestPage.clock.fastForward(60_001);
  await requestPage.getByRole('button', { name: 'Start another reset request', exact: true }).click();
  assert.equal(await requestPage.getByLabel('Website account email', { exact: true }).inputValue(), '');
  assert.equal(await requestPage.getByLabel('Website account email', { exact: true }).evaluate(element => element === document.activeElement), true);
  assert.equal(resetRequests.length, 1, 'A new draft/cooldown never sends another email automatically');
  assert.equal(await requestPage.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await requestContext.close();
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
  await noSession.goto(origin + '/dashboard');
  await noSession.getByRole('link', { name: 'Sign in to your website account', exact: true }).waitFor();
  assert.equal(await noSession.getByRole('list', { name: 'Recent support tickets', exact: true }).count(), 0);
  assert.equal(methods.length, beforeSignedOut, 'Signed-out Dashboard must not request private data');
  await noSession.goto(origin + '/client/subscription');
  await noSession.getByRole('link', { name: 'Sign in to your website account', exact: true }).waitFor();
  assert.equal(await noSession.getByRole('heading', { name: 'Your streaming service', exact: true }).count(), 0);
  assert.equal(methods.length, beforeSignedOut, 'Signed-out Subscription makes no private request');
  await noSession.goto(origin + '/client/support/new');
  await noSession.getByRole('link', { name: 'Sign in to your website account', exact: true }).waitFor();
  assert.equal(await noSession.getByLabel('Subject', { exact: true }).count(), 0);
  assert.equal(methods.length, beforeSignedOut, 'Signed-out new-ticket route must not read or write private records');
  await noSession.goto(origin + '/reset-password');
  await noSession.getByRole('link', { name: 'Request another password reset', exact: true }).waitFor();
  assert.equal(await noSession.getByLabel('New website password', { exact: true }).count(), 0);
  assert.equal(methods.length, beforeSignedOut, 'A signed-out recovery visit cannot send email or change a password');
  await noSession.getByRole('link', { name: 'Request another password reset', exact: true }).click();
  await noSession.getByRole('heading', { name: 'Reset your website password', exact: true }).waitFor();
  assert.equal(await noSession.getByLabel('Website account email', { exact: true }).inputValue(), '');
  assert.equal(methods.length, beforeSignedOut, 'Opening the public reset-request page makes no private/account/email request');
  await signedOut.close();
  assert.deepEqual(pageErrors, []); assert.ok(methods.length > 0 && methods.filter(method => !['GET', 'HEAD'].includes(method)).length === 6 && profileWrites.length === 1 && replyWrites.length === 1 && ticketWrites.length === 1 && recoveryExchanges.length === 1 && recoveryWrites.length === 1 && resetRequests.length === 1 && methods.includes('PATCH') && methods.includes('POST') && methods.includes('PUT'));
  console.log('PASS: real Chromium/production-code fixture preserves phone paging, selected/Edit identity, browser Back, Back link search state, 320px touch layout, six-panel desktop view and ordinary-user denial.');
  console.log('PASS: customer Devices shows verified allowance without session controls/receipts, separates missing links and failed reads, recovers on refresh, and History discloses unavailable activity at 320px.');
  console.log('PASS: customer Account at 320px supports Cancel, an owner/revision-bound name save, confirmed returned details and reload; signed-out users make no private profile request.');
  console.log('PASS: 320px Support uses five-ticket pages and one selected thread, pages twenty replies without mixing them, confirms one fictional reply and returns to the directory; signed-out Support makes no private request.');
  console.log('PASS: 320px verified new-ticket creation validates the exact fictional insert and return-to-list result; signed-out creation offers sign-in without a form or private requests.');
  console.log('PASS: Dashboard at 320px and desktop bounds recent tickets to five, counts all active tickets independently, isolates profile/count failures, refreshes safely and opens the exact owned thread; signed-out Dashboard makes no private request.');
  console.log('PASS: 320px Subscription retains linked service without a profile, labels unlinked website data separately, distinguishes missing/error, suppresses website fallback during service failure and recovers hidden checks by refreshing.');
  console.log('PASS: 320px recovery uses an actual SDK PKCE exchange before the lazy form mounts, clears/disables password inputs during one pinned update, verifies completion and denies normal/signed-out sessions and reload-based recovery without overflow.');
  console.log('PASS: 320px Login/reset-link recovery opens the dedicated request page, focuses 48px controls, retains a pending request across SPA navigation, clears the address, reports eligibility without delivery claims, and opens a blank draft only after settlement/cooldown without an automatic resend.');
  console.log('Offline fictional Auth/data only; external network blocked; exactly six separately validated fictional writes (profile, reply, ticket, PKCE exchange, password update and recovery request), no real record/Auth write, provider, payment or email operation.');
} finally {
  await browser?.close(); if (server) await new Promise(resolve => server.close(resolve));
  await rm(directory, { recursive: true, force: true });
}
