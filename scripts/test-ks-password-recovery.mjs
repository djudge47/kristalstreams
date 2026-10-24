import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { createClient } from '@supabase/supabase-js';

const directory = await mkdtemp(join(process.cwd(), 'node_modules', '.ks-recovery-'));
const originalWindow = globalThis.window;
const owner = '77777777-7777-4777-8777-777777777701', other = '77777777-7777-4777-8777-777777777702';
const password = 'fictional recovery password';
const user = (id = owner, patch = {}) => ({ id, email: 'fictional@example.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', is_anonymous: false, aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z', ...patch });
const tokens = new Map();
const token = id => { if (tokens.has(id)) return tokens.get(id); const value = `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.fictional-signature`; tokens.set(id, value); return value; };
const session = (u = user()) => ({ user: u, access_token: token(u.id), refresh_token: 'fictional-refresh', expires_in: 3600, token_type: 'bearer' });
const verified = u => ({ data: { user: u }, error: null });
const clock = new Map(); let timer = 0, event, controller, currentUser, mainReads, requests, mode, finish, mounted, options;
const drain = async () => { for (let i = 0; i < 12; i++) await new Promise(resolve => setImmediate(resolve)); };
const expire = ms => { for (const [key, item] of [...clock]) if (item.ms === ms) { clock.delete(key); item.fn(); } };
const json = (body, status = 200) => Response.json(body, { status, headers: { 'X-Supabase-Api-Version': '2024-01-01' } });
try {
  globalThis.window = { setTimeout(fn, ms) { assert.ok([0, 20000].includes(ms)); const key = ++timer; clock.set(key, { fn, ms }); return key; }, clearTimeout(key) { clock.delete(key); } };
  const result = await build({ entryPoints: ['src/lib/password-recovery-controller.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
  const file = join(directory, 'controller.mjs'); await writeFile(file, result.outputFiles[0].text);
  const { createPasswordRecoveryController } = await import(pathToFileURL(file));
  function reset() {
    controller?.dispose(); assert.equal(clock.size, 0);
    currentUser = user(); mainReads = 0; requests = []; mode = 'normal'; mounted = true; finish = null; options = [];
    controller = createPasswordRecoveryController({
      onAuthStateChange(fn) { event = fn; return { data: { subscription: { unsubscribe() { event = null; } } } }; },
      async getUser() { mainReads++; if (mode === 'pending-owner' && mainReads === 1) return new Promise(resolve => { finish = () => resolve(verified(currentUser)); }); if (mode === 'switched' && mainReads === 2) return verified(user(other)); return verified(currentUser); },
    }, () => {
      const auth = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'ks-password-verification' }; options.push(auth);
      return createClient('https://fictional-recovery.invalid', 'fictional-key', { auth, global: { fetch: async (input, init) => {
        const url = new URL(input); assert.equal(url.origin, 'https://fictional-recovery.invalid'); assert.equal(url.pathname, '/auth/v1/user');
        assert.ok(['GET', 'PUT'].includes(init.method));
        const access = new Headers(init.headers).get('Authorization'); assert.equal(access, 'Bearer ' + token(owner), 'Every isolated read/update stays pinned to the original recovery identity');
        requests.push({ method: init.method, path: url.pathname });
        if (init.method === 'GET') { if (mode === 'wrong-isolated-owner') return json(user(other)); return json(user()); }
        assert.equal(mainReads, 2); assert.deepEqual(JSON.parse(init.body), { password, code_challenge: null, code_challenge_method: null });
        if (mode === 'pending-write') return new Promise(resolve => { finish = () => resolve(json(user())); });
        if (mode === 'weak') return json({ code: 'weak_password', msg: 'PRIVATE-ERROR' }, 422);
        if (mode === 'same') return json({ code: 'same_password', msg: 'PRIVATE-ERROR' }, 422);
        if (mode === 'failure') return json({ msg: 'PRIVATE-ERROR' }, 503);
        if (mode === 'wrong-result') return json(user(other));
        if (mode === 'late-switch') { currentUser = user(other); event('SIGNED_IN', session(currentUser)); }
        return json(user());
      } } }).auth;
    });
  }
  const recover = u => event('PASSWORD_RECOVERY', session(u));
  const submit = () => controller.submit(password, password, () => mounted);
  const writes = () => requests.filter(r => r.method === 'PUT').length;
  reset(); assert.equal(controller.getState().status, 'checking'); assert.equal(requests.length, 0);
  event('INITIAL_SESSION', session()); assert.equal(controller.getState().status, 'checking'); expire(0); assert.equal(controller.getState().status, 'unavailable');
  await submit(); assert.equal(mainReads, 0); assert.equal(writes(), 0);
  for (const name of ['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED']) { event(name, session()); await submit(); assert.equal(writes(), 0); assert.equal(controller.getState().status, 'unavailable'); }
  for (const u of [user(owner, { email_confirmed_at: null }), user(owner, { is_anonymous: true }), user(owner, { email: '' }), user('not-a-uuid')]) { reset(); recover(u); await submit(); assert.equal(controller.getState().status, 'unavailable'); assert.equal(mainReads, 0); }
  reset(); expire(20000); assert.equal(controller.getState().status, 'unavailable');
  console.log('PASS: initialization stays checking; ordinary, signed-out, anonymous, unconfirmed and malformed sessions cannot enable recovery or dispatch a write; the initialization wait is bounded.');

  reset(); recover(); const revision = controller.getState().revision; event('INITIAL_SESSION', session()); event('SIGNED_IN', session()); assert.equal(controller.getState().revision, revision); assert.equal(controller.getState().status, 'ready');
  const notices = []; const unsubscribe = controller.subscribe(() => notices.push(controller.getState().status));
  await controller.submit('short', 'short', () => mounted); assert.match(controller.getState().message, /at least 8/); await controller.submit(password, 'different', () => mounted); assert.match(controller.getState().message, /do not match/); assert.equal(mainReads, 0);
  await Promise.all([submit(), submit()]); assert.equal(writes(), 1); assert.equal(mainReads, 2); assert.equal(controller.getState().status, 'complete'); assert.equal(clock.size, 0);
  assert.deepEqual(options, [{ persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'ks-password-verification' }]);
  assert.ok(notices.includes('submitting') && notices.includes('complete')); unsubscribe(); await submit(); assert.equal(writes(), 1);
  assert.deepEqual(Object.keys(controller.getState()).sort(), ['message', 'revision', 'status']);
  console.log('PASS: recovery survives lazy-mount timing and same-session initial/focus events; actual installed SDK validates the captured owner and updates once through a memory-only client, with no main-session write, sign-out, email or credential export.');

  for (const scenario of ['switched', 'wrong-isolated-owner']) { reset(); recover(); mode = scenario; await submit(); assert.equal(writes(), 0); assert.equal(controller.getState().status, 'unavailable'); }
  for (const change of ['SIGNED_OUT', 'SIGNED_IN']) { reset(); recover(); const before = controller.getState().revision; event(change, change === 'SIGNED_OUT' ? null : session(user(other))); await submit(); assert.ok(controller.getState().revision > before); assert.equal(writes(), 0); }
  reset(); recover(); mode = 'pending-owner'; let pending = submit(); await drain(); event('SIGNED_OUT', null); finish(); await pending; assert.equal(writes(), 0);
  reset(); recover(); mode = 'pending-owner'; pending = submit(); await drain(); mounted = false; finish(); await pending; assert.equal(writes(), 0);
  reset(); recover(); mode = 'pending-owner'; pending = submit(); await drain(); expire(20000); await pending; assert.equal(controller.getState().status, 'unavailable'); finish(); await drain(); assert.equal(writes(), 0);
  console.log('PASS: changed main or isolated owners, sign-out, unmount and pre-update timeout prevent dispatch; late preflight results cannot restart work.');

  for (const scenario of ['weak', 'same']) { reset(); recover(); mode = scenario; await submit(); assert.equal(writes(), 1); assert.equal(controller.getState().status, 'ready'); assert.match(controller.getState().message, scenario === 'weak' ? /stronger/ : /different/); assert.doesNotMatch(controller.getState().message, /PRIVATE-/); }
  for (const scenario of ['failure', 'wrong-result']) { reset(); recover(); mode = scenario; await submit(); assert.equal(controller.getState().status, 'uncertain'); assert.match(controller.getState().message, /could not be confirmed/); assert.doesNotMatch(controller.getState().message, /PRIVATE-/); recover(); await submit(); assert.equal(writes(), 1); }
  reset(); recover(); mode = 'late-switch'; await submit(); assert.equal(writes(), 1); assert.equal(controller.getState().status, 'unavailable'); recover(); await submit(); assert.equal(writes(), 1);
  reset(); recover(); mode = 'pending-write'; pending = submit(); await drain(); assert.equal(writes(), 1); expire(20000); await pending; assert.equal(controller.getState().status, 'uncertain'); recover(); await submit(); finish(); await drain(); assert.equal(controller.getState().status, 'uncertain'); assert.equal(writes(), 1);
  console.log('PASS: definite password-policy errors allow explicit correction; failed, foreign, delayed or switched-account results never claim success or retry an uncertain dispatched update.');

  reset(); recover(); mode = 'pending-owner'; pending = submit(); await drain(); let notice = 0; controller.subscribe(() => notice++); controller.dispose(); const prior = notice; assert.equal(clock.size, 1, 'An in-flight operation retains only its bounded deadline'); finish(); await pending; assert.equal(notice, prior); assert.equal(clock.size, 0); assert.equal(event, null); assert.equal(writes(), 0);
  const main = await readFile('src/main.tsx', 'utf8'); assert.ok(main.indexOf("import './lib/password-recovery'") < main.indexOf("import App"), 'Recovery observer must load before the lazy application');
  const singleton = await readFile('src/lib/password-recovery.ts', 'utf8'); assert.match(singleton, /createPasswordVerificationClient\(\)\.auth/);
  console.log('PASS: disposal removes the Auth listener, suppresses late notifications and prevents delayed writes; application startup installs the observer before lazy routes. All Auth transport and credentials were fictional.');
} finally { controller?.dispose(); if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow; await rm(directory, { recursive: true, force: true }); }
