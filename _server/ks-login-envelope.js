import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function loginEncryptionKey(env = process.env) {
  const encoded = env.KS_LOGIN_ENCRYPTION_KEY;
  if (typeof encoded !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(encoded)) throw new Error('login_key_unavailable');
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32 || key.toString('base64') !== encoded) throw new Error('login_key_unavailable');
  const keyId = env.KS_LOGIN_KEY_ID || 'v1';
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(keyId)) throw new Error('login_key_unavailable');
  return { key, keyId };
}
function aad(context, keyId) {
  if (context?.environment !== 'preview' || !uuid(context.ownerId) || !uuid(context.attemptId)
    || typeof context.sessionId !== 'string' || context.sessionId.length > 200 || !/^cs_(test_)?[A-Za-z0-9]+$/.test(context.sessionId)) throw new Error('invalid_login_binding');
  return Buffer.from(JSON.stringify({ version: 1, purpose: 'new-paid-login', environment: 'preview', keyId,
    ownerId: context.ownerId, sessionId: context.sessionId, attemptId: context.attemptId }));
}
function safeLogin(value) {
  if (!value || Object.keys(value).sort().join(',') !== 'password,username' || !/^[A-Za-z0-9_.-]{8,64}$/.test(value.username || '')
    || typeof value.password !== 'string' || !/^[A-Za-z0-9_-]{24,64}$/.test(value.password)) throw new Error('invalid_login');
  return { username: value.username, password: value.password };
}
export function generateStreamingLogin() {
  return { username: `ks_${randomBytes(12).toString('hex')}`, password: randomBytes(24).toString('base64url') };
}
export function sealStreamingLogin(login, context, env = process.env) {
  const { key, keyId } = loginEncryptionKey(env), iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(aad(context, keyId));
  const plaintext = Buffer.from(JSON.stringify(safeLogin(login)));
  try {
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return { version: 1, keyId, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') };
  } finally { plaintext.fill(0); }
}
export function openStreamingLogin(envelope, context, env = process.env) {
  try {
    const { key, keyId } = loginEncryptionKey(env);
    if (!envelope || Object.keys(envelope).sort().join(',') !== 'ciphertext,iv,keyId,tag,version'
      || envelope.version !== 1 || envelope.keyId !== keyId) throw new Error('invalid_envelope');
    const decode = (value, length) => {
      if (typeof value !== 'string' || value.length > 2048 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new Error('invalid_envelope');
      const bytes = Buffer.from(value, 'base64');
      if (bytes.toString('base64') !== value || (length && bytes.length !== length)) throw new Error('invalid_envelope');
      return bytes;
    };
    const decipher = createDecipheriv('aes-256-gcm', key, decode(envelope.iv, 12));
    decipher.setAAD(aad(context, keyId)); decipher.setAuthTag(decode(envelope.tag, 16));
    const plaintext = Buffer.concat([decipher.update(decode(envelope.ciphertext)), decipher.final()]);
    try { return safeLogin(JSON.parse(plaintext.toString('utf8'))); } finally { plaintext.fill(0); }
  } catch { throw new Error('login_unavailable'); }
}
