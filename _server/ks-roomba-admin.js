import { createRoombaPreviewHandler } from './ks-roomba-preview.js';

const adminEmail = 'djudge47@gmail.com';
const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };
const safeScalar = value => (typeof value === 'number' && Number.isFinite(value))
  || (typeof value === 'string' && value.length <= 256) ? value : null;

// Uses the existing verified admin identity, never a browser-supplied role/email.
export function createAdminRoombaHandler({ createClient, env = process.env,
  accountHandler = createRoombaPreviewHandler({ env }), now = Date.now, dataKind = 'account' } = {}) {
  if (!['account', 'packages'].includes(dataKind)) throw new Error('Unsupported admin read');
  let cached;
  let pending;
  let retryAt = 0;

  async function checkAccount() {
    let code;
    let body;
    const internalResponse = {
      setHeader() {},
      status(value) { code = value; return this; },
      json(value) { body = value; return this; },
    };
    await accountHandler({ method: 'GET', headers: { authorization: `Bearer ${env.ROOMBA_PREVIEW_SECRET}` } }, internalResponse);
    if (code !== 200 || body?.transport !== 'fixie' || body?.mode !== 'read-only' || body?.databaseWrites !== false) {
      throw new Error('account_unavailable');
    }
    let content;
    if (dataKind === 'packages') {
      if (body.status !== 'packages_ready' || !Array.isArray(body.packages)) throw new Error('packages_unavailable');
      content = { status: 'packages_ready', packages: body.packages };
    } else {
      if (body.status !== 'connected' || !body.account) throw new Error('account_unavailable');
      const account = { id: safeScalar(body.account.id), username: safeScalar(body.account.username), credits: safeScalar(body.account.credits) };
      if (!Object.values(account).some(value => value !== null)) throw new Error('account_unavailable');
      content = { status: 'connected', account };
    }
    const checkedAt = now();
    cached = { checkedAt, body: {
      ...content, mode: 'read-only', databaseWrites: false,
      transport: 'fixie', checkedAt: new Date(checkedAt).toISOString(),
    } };
    return cached.body;
  }

  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    const reply = (code, body) => res.status(code).json(body);
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return reply(405, { error: 'Method not allowed.' });
    }
    if (env.VERCEL_ENV !== 'preview') return reply(404, { error: 'This connection panel is available in Preview only.' });
    const token = typeof req.headers?.authorization === 'string'
      && /^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];
    if (!token) return reply(401, { error: 'Please sign in to your admin account.' });
    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) return reply(503, { error: 'Admin sign-in verification is unavailable.' });
    try {
      const auth = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, clientOptions);
      const { data, error } = await auth.auth.getUser(token);
      const user = data?.user;
      if (error || !user?.id) return reply(401, { error: 'Please sign in again to your admin account.' });
      if (user.is_anonymous || !user.email_confirmed_at || user.email?.trim().toLowerCase() !== adminEmail) {
        return reply(403, { error: 'This connection is restricted to the Kristal Streams administrator.' });
      }
    } catch {
      return reply(503, { error: 'Admin sign-in verification is unavailable. Please try again.' });
    }
    if (!env.ROOMBA_PREVIEW_SECRET) return reply(503, { error: 'The Preview connection is not configured.' });

    // Authorization runs before every cache read. Only one large upstream read
    // is shared per warm instance; no automatic polling or database cache writes.
    if (cached && now() - cached.checkedAt < 60000) return reply(200, { ...cached.body, cached: true });
    if (!pending && now() < retryAt) {
      const seconds = Math.max(1, Math.ceil((retryAt - now()) / 1000));
      res.setHeader('Retry-After', String(seconds));
      return reply(429, { error: 'Please wait briefly before checking again.', retryAfterSeconds: seconds });
    }
    try {
      if (!pending) {
        retryAt = now() + 30000;
        pending = checkAccount().finally(() => { pending = null; });
      }
      return reply(200, { ...await pending, cached: false });
    } catch {
      return reply(502, { error: 'Roomba could not be checked. Please try again shortly.', retryAfterSeconds: 30 });
    }
  };
}
