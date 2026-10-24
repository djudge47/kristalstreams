import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { createClient } from '@supabase/supabase-js';
const dir = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-reset-request-'));
const originalWindow = globalThis.window, clock = new Map(); let serial = 0, controller, calls, mode, finish, saved, storage;
const expire = ms => { for (const [id, timer] of [...clock]) if (timer.ms === ms) { clock.delete(id); timer.fn(); } };
const drain = async () => { for (let i = 0; i < 10; i++) await new Promise(resolve => setImmediate(resolve)); };
const waitForTransport = async () => { for (let i = 0; i < 2000 && !finish; i++) await new Promise(resolve => setTimeout(resolve, 1)); assert.equal(typeof finish, 'function', 'Fictional WebCrypto/SDK request did not reach its constrained transport'); };
try {
  globalThis.window = { setTimeout(fn, ms) { assert.ok([20000, 60000].includes(ms)); const id = ++serial; clock.set(id, { fn, ms }); return id; }, clearTimeout(id) { clock.delete(id); } };
  const compiled = await build({ entryPoints: ['src/lib/password-reset-request-controller.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
  const file = join(dir, 'request.mjs'); await writeFile(file, compiled.outputFiles[0].text); const { createPasswordResetRequestController } = await import(pathToFileURL(file));
  function reset(configured = true, origin = 'https://website.invalid') {
    controller?.dispose(); assert.equal(clock.size, 0); calls = []; mode = 'normal'; finish = null; saved = new Map(); storage = { getItem: k => saved.get(k) ?? null, setItem: (k, v) => saved.set(k, v), removeItem: k => saved.delete(k) };
    const sdk = createClient('https://fictional-reset.invalid', 'fictional-public-key', { auth: { persistSession: true, storage, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'fictional-auth', flowType: 'pkce' }, global: { fetch: async (input, init) => {
      const url = new URL(input); assert.equal(url.origin, 'https://fictional-reset.invalid'); assert.equal(url.pathname, '/auth/v1/recover'); assert.equal(init.method, 'POST');
      const body = JSON.parse(init.body), redirect = new URL(url.searchParams.get('redirect_to'));
      assert.equal(redirect.origin, origin); assert.equal(redirect.pathname, '/reset-password'); assert.deepEqual([...redirect.searchParams.keys()], [], 'Existing exact redirect allowlists must remain compatible; the optional flow-id redirect feature stays off');
      assert.deepEqual([...url.searchParams.keys()], ['redirect_to']); assert.equal(body.email, 'fictional@example.invalid'); assert.match(body.code_challenge, /^[A-Za-z0-9_-]{43}$/); assert.equal(body.code_challenge_method, 's256'); assert.deepEqual(body.gotrue_meta_security, {}); assert.deepEqual(Object.keys(body).sort(), ['code_challenge', 'code_challenge_method', 'email', 'gotrue_meta_security']);
      calls.push({ method: init.method }); const response = () => Response.json(mode === 'rate' || mode === 'reject' || mode === 'server' ? { msg: 'PRIVATE-RAW-ACCOUNT-DETAIL', code: 'fixture_error' } : {}, { status: mode === 'rate' ? 429 : mode === 'reject' ? 400 : mode === 'server' ? 503 : 200 });
      if (mode === 'pending') return new Promise(resolve => { finish = () => resolve(response()); });
      if (mode === 'network') throw new Error('PRIVATE-NETWORK-DETAIL');
      return response();
    } } });
    controller = createPasswordResetRequestController(configured, origin, (email, options) => sdk.auth.resetPasswordForEmail(email, options));
  }
  const submit = () => controller.submit('  fictional@example.invalid  ');
  reset(); for (const email of ['', 'not-an-email', 'one@@example.invalid', 'one\r\n@example.invalid', 'a'.repeat(255) + '@example.invalid']) { await controller.submit(email); assert.equal(controller.getState().status, 'idle'); assert.match(controller.getState().message, /valid website/); } assert.equal(calls.length, 0); assert.equal(clock.size, 0);
  for (const [config, origin] of [[false, 'https://website.invalid'], [true, 'javascript:alert(1)'], [true, 'https://website.invalid/other'], [true, 'https://website.invalid?redirect=other']]) { reset(config, origin); await submit(); assert.equal(controller.getState().status, 'unavailable'); assert.equal(calls.length, 0); }
  console.log('PASS: invalid/oversized emails, missing configuration and unsafe origins cannot dispatch; recovery never accepts a caller-selected redirect.');
  reset(); let notices = 0; const unsubscribe = controller.subscribe(() => notices++); let pending = submit(); await controller.submit('different@example.invalid'); await drain(); await pending;
  assert.equal(calls.length, 1); assert.equal(controller.getState().status, 'accepted'); assert.match(controller.getState().message, /If this address is eligible/); assert.match(controller.getState().message, /does not confirm email delivery/); assert.doesNotMatch(JSON.stringify(controller.getState()), /fictional@|PRIVATE-|token|verifier/); assert.equal(controller.getState().canStartAgain, false);
  assert.ok([...saved.keys()].some(k => /^fictional-auth-flow-[a-f0-9]{32}-code-verifier$/.test(k))); assert.ok(![...saved.keys()].includes('fictional-auth'), 'Request must not create an authenticated session');
  await submit(); controller.startAgain(); assert.equal(controller.getState().status, 'accepted'); assert.equal(calls.length, 1); expire(60000); assert.equal(controller.getState().canStartAgain, true); assert.equal(calls.length, 1); controller.startAgain(); assert.equal(controller.getState().status, 'idle'); assert.equal(controller.getState().message, null); assert.equal(calls.length, 1); unsubscribe(); const n = notices; await submit(); assert.equal(calls.length, 2); assert.equal(notices, n);
  console.log('PASS: actual installed SDK sends one exact fictional PKCE request, no sign-in/password/data write; duplicate submissions coalesce, success is eligibility-neutral, and a completed one-minute pause plus explicit blank-draft action is required before another request.');
  reset(); mode = 'pending'; pending = submit(); await waitForTransport(); assert.equal(calls.length, 1); assert.equal(controller.getState().status, 'pending'); expire(20000); await pending; assert.equal(controller.getState().status, 'uncertain'); assert.match(controller.getState().message, /Leaving this page does not cancel/); expire(60000); assert.equal(controller.getState().canStartAgain, false); controller.startAgain(); await submit(); assert.equal(calls.length, 1);
  finish(); await drain(); assert.equal(controller.getState().status, 'uncertain'); assert.equal(controller.getState().canStartAgain, true); assert.equal(calls.length, 1); controller.startAgain(); assert.equal(controller.getState().status, 'idle');
  console.log('PASS: twenty-second timeout ends local waiting without claiming cancellation; late success cannot replace uncertainty, cooldown cannot release an unsettled SDK call, and no automatic resend occurs.');
  for (const scenario of ['rate', 'reject', 'server', 'network']) { reset(); mode = scenario; await submit(); assert.equal(calls.length, 1); assert.equal(controller.getState().status, ['rate', 'reject'].includes(scenario) ? 'rejected' : 'uncertain'); assert.doesNotMatch(controller.getState().message, /PRIVATE-/); await submit(); assert.equal(calls.length, 1); expire(60000); assert.equal(controller.getState().canStartAgain, true); }
  reset(); mode = 'pending'; let changes = 0; const unsub = controller.subscribe(() => changes++); pending = submit(); await waitForTransport(); unsub(); const before = changes; finish(); await pending; assert.equal(changes, before); assert.equal(controller.getState().status, 'accepted'); controller.dispose(); assert.equal(clock.size, 0);
  controller = createPasswordResetRequestController(true, 'https://website.invalid', async () => ({})); await submit(); assert.equal(controller.getState().status, 'uncertain'); assert.equal(controller.getState().canStartAgain, false);
  console.log('PASS: rate limits, definite rejection, network/server failure and unmount use fixed safe outcomes, never retry automatically and retain runtime request state without calling removed subscribers.');
  const app = await readFile('src/App.tsx', 'utf8'), login = await readFile('src/pages/Login.tsx', 'utf8'), resetPage = await readFile('src/pages/ResetPassword.tsx', 'utf8');
  assert.match(app, /path="forgot-password" element=\{<P\.ForgotPassword/); assert.match(login, /to="\/forgot-password"/); assert.doesNotMatch(login, /resetPasswordForEmail|showForgotPassword/); assert.match(resetPage, /'\/forgot-password'/);
  console.log('PASS: Login and unavailable reset links reach the real public recovery route; the removed Login modal cannot send a second recovery request. Fictional transport only; no real email/account operation occurred.');
} finally { controller?.dispose(); if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow; await rm(dir, { recursive: true, force: true }); }
