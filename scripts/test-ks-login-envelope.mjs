import assert from 'node:assert/strict';
import { generateStreamingLogin, loginEncryptionKey, openStreamingLogin, sealStreamingLogin } from '../_server/ks-login-envelope.js';
const env = { KS_LOGIN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'), KS_LOGIN_KEY_ID: 'synthetic' };
const context = { environment: 'preview', ownerId: '00000000-0000-4000-8000-000000000001', attemptId: '00000000-0000-4000-8000-000000000002', sessionId: 'cs_test_EncryptedFixture' };
const login = generateStreamingLogin(); let count = 0;
function check(name, fn) { fn(); count++; console.log(`PASS: ${name}`); }
check('streaming credentials use random values with bounded provider-safe characters', () => {
  const other = generateStreamingLogin(); assert.notDeepEqual(login, other);
  assert.match(login.username, /^ks_[a-f0-9]{24}$/); assert.match(login.password, /^[A-Za-z0-9_-]{32}$/);
});
const a = sealStreamingLogin(login, context, env), b = sealStreamingLogin(login, context, env);
check('AES-256-GCM round trip uses a fresh nonce and ciphertext for each envelope', () => {
  assert.deepEqual(openStreamingLogin(a, context, env), login); assert.deepEqual(openStreamingLogin(b, context, env), login);
  assert.notEqual(a.iv, b.iv); assert.notEqual(a.ciphertext, b.ciphertext);
});
check('stored envelope contains no plaintext password, username or encryption key', () => {
  const value = JSON.stringify(a); for (const secret of [login.username, login.password, env.KS_LOGIN_ENCRYPTION_KEY]) assert.ok(!value.includes(secret));
  assert.deepEqual(Object.keys(a).sort(), ['ciphertext', 'iv', 'keyId', 'tag', 'version']);
});
check('different owner, order, attempt or environment cannot decrypt the envelope', () => {
  for (const patch of [{ ownerId: context.attemptId }, { attemptId: context.ownerId }, { sessionId: 'cs_test_Other' }, { environment: 'production' }]) assert.throws(() => openStreamingLogin(a, { ...context, ...patch }, env), /login_unavailable/);
});
check('wrong key, key identifier, nonce, tag or ciphertext fails without exposing secrets', () => {
  assert.throws(() => openStreamingLogin(a, context, { ...env, KS_LOGIN_ENCRYPTION_KEY: Buffer.alloc(32, 8).toString('base64') }), /^Error: login_unavailable$/);
  for (const field of ['iv', 'tag', 'ciphertext']) assert.throws(() => openStreamingLogin({ ...a, [field]: (a[field][0] === 'A' ? 'B' : 'A') + a[field].slice(1) }, context, env), /login_unavailable/);
  assert.throws(() => openStreamingLogin({ ...a, keyId: 'other' }, context, env), /login_unavailable/);
});
check('missing, whitespace, malformed and wrong-sized keys fail closed', () => {
  for (const value of [undefined, '', env.KS_LOGIN_ENCRYPTION_KEY + '\n', 'not-a-key', Buffer.alloc(31).toString('base64')]) assert.throws(() => loginEncryptionKey({ KS_LOGIN_ENCRYPTION_KEY: value }));
});
check('malformed, oversized or extra envelope fields and invalid login fields are rejected', () => {
  for (const patch of [{ version: 2 }, { password: 'plaintext' }, { ciphertext: 'A'.repeat(5000) }, { iv: '!!!' }]) assert.throws(() => openStreamingLogin({ ...a, ...patch }, context, env), /login_unavailable/);
  for (const patch of [{ username: 'invalid user' }, { password: 'short' }, { apiKey: 'never-store' }]) assert.throws(() => sealStreamingLogin({ ...login, ...patch }, context, env));
});
console.log(`${count} encrypted-login checks passed. Only generated synthetic credentials and a synthetic local key were used.`);
