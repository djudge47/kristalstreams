import { createHmac, timingSafeEqual } from 'node:crypto';
import { fetch, FormData } from 'undici';
import { createRoombaPreviewHandler } from './ks-roomba-preview.js';
import { createFixieDispatcher, fixieProxyUrl } from './ks-fixie-proxy.js';
import { readLineJson } from './ks-roomba-account-reader.js';
import { buildSetupDraft } from '../_shared/ks-roomba-setup.js';

const endpoint = 'https://cdn.rooomba.tv/WDXTMHmN/';
// One durable slot for the first operator trial, across deployments and users.
// No reset/delete API: an ambiguous result requires manual provider review.
const slot = 'preview_trial_activation_v1';
const options = { auth: { persistSession: false, autoRefreshToken: false } };
class TrialError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const reject = (code, message) => { throw new TrialError(code, message); };
const equal = (a, b) => typeof a === 'string' && typeof b === 'string'
  && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const mac = (secret, purpose, value) => createHmac('sha256', secret).update(`${purpose}\0${value}`).digest('hex');
const fieldsToHash = (draft, account) => JSON.stringify({ fields: draft.fields, resellerId: String(account.id), reseller: account.username });

export function createTrialStore(client) {
  const table = () => client.from('ks_roomba_trial_attempts');
  const columns = 'request_hash,admin_id,state,result';
  return {
    async get() {
      const { data, error } = await table().select(columns).eq('slot', slot).maybeSingle();
      if (error) throw new Error('storage_unavailable');
      return data;
    },
    async claim(row) {
      const { error } = await table().insert({ slot, ...row });
      if (error?.code === '23505') return false;
      if (error) throw new Error('storage_unavailable');
      return true;
    },
    async finish(hash, state, result) {
      const { data, error } = await table().update({ state, result, updated_at: new Date().toISOString() })
        .eq('slot', slot).eq('request_hash', hash).eq('state', 'submitting').select('slot');
      if (error || data?.length !== 1) throw new Error('storage_unavailable');
    },
  };
}

// Dependencies are injectable. Production is blocked before auth, storage or transport.
export function createRoombaTrialHandler({ createClient, env = process.env, now = Date.now,
  fetchImpl = fetch, dispatcherFactory = createFixieDispatcher, storeFactory = createTrialStore,
  accountHandler = createRoombaPreviewHandler({ env }),
  packagesHandler = createRoombaPreviewHandler({ env, readAction: 'packages' }) } = {}) {
  async function read(handler, status) {
    let code, body;
    await handler({ method: 'GET', headers: { authorization: `Bearer ${env.ROOMBA_PREVIEW_SECRET}` } }, {
      setHeader() {}, status(value) { code = value; return this; }, json(value) { body = value; return this; },
    });
    if (code !== 200 || body?.status !== status || body?.transport !== 'fixie'
      || body?.mode !== 'read-only' || body?.databaseWrites !== false) reject(502, 'Roomba details could not be verified. Nothing was created.');
    return body;
  }
  async function snapshot(input) {
    const { packages } = await read(packagesHandler, 'packages_ready');
    let draft;
    try { draft = buildSetupDraft(input, packages); }
    catch { reject(400, 'Check the proposed username, password and package details.'); }
    const selected = packages.find(item => item.id === draft.packageId);
    // This action is intentionally narrower than the general draft screen.
    if (draft.packageId !== '1' || draft.accessType !== 'trial' || draft.duration !== '36 hours'
      || draft.estimatedCredits !== 0 || draft.fields.max_connections !== '1' || selected?.maxConnections !== 1) {
      reject(400, 'Only the verified 36-hour, zero-credit, one-connection Trial package can be created here.');
    }
    const { account } = await read(accountHandler, 'connected');
    if (!/^[1-9]\d{0,11}$/.test(String(account?.id)) || typeof account?.username !== 'string' || !account.username) {
      reject(502, 'The reseller account could not be verified. Nothing was created.');
    }
    return { draft, account };
  }
  function verifyToken(token, userId) {
    if (typeof token !== 'string' || token.length > 2048) reject(400, 'Review the trial details again.');
    const [encoded, signature, extra] = token.split('.');
    if (extra !== undefined || !equal(signature, mac(env.ROOMBA_PREVIEW_SECRET, 'trial-approval-v1', encoded || ''))) reject(400, 'Review the trial details again.');
    let value;
    try { value = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')); } catch { reject(400, 'Review the trial details again.'); }
    if (value?.userId !== userId || !Number.isSafeInteger(value?.expires) || value.expires <= now() || value.expires > now() + 300000
      || !/^[a-f0-9]{64}$/.test(value.hash)) reject(400, 'The review expired or belongs to another session. Review the trial details again.');
    return value;
  }
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    const reply = (code, body) => res.status(code).json(body);
    if (env.VERCEL_ENV !== 'preview') return reply(404, { error: 'This trial action is available in Preview only.' });
    if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); return reply(405, { error: 'Method not allowed.' }); }
    let claimed = false, store, requestHash;
    try {
      const token = typeof req.headers?.authorization === 'string' && /^Bearer ([^\s]+)$/i.exec(req.headers.authorization)?.[1];
      if (!token) reject(401, 'Please sign in to your admin account.');
      if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY || !env.ROOMBA_PREVIEW_SECRET) {
        reject(503, 'Trial safeguards are not configured. Nothing was created.');
      }
      const auth = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, options);
      const { data, error } = await auth.auth.getUser(token);
      const user = data?.user;
      if (error || !user?.id) reject(401, 'Please sign in again to your admin account.');
      if (user.is_anonymous || !user.email_confirmed_at || user.email?.trim().toLowerCase() !== 'djudge47@gmail.com') reject(403, 'Only the Kristal Streams administrator can use this action.');
      store = storeFactory(createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options));
      const existing = await store.get();
      const enabled = env.ROOMBA_TRIAL_CREATE_ENABLED === 'true';
      if (req.method === 'GET') return reply(200, { enabled, attempt: existing ? { state: existing.state, result: existing.result } : null });
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)
        || Buffer.byteLength(JSON.stringify(req.body)) > 8192) reject(400, 'Invalid trial request.');
      const { operation, input, approvalToken, confirmed } = req.body;
      if (!['review', 'create'].includes(operation)) reject(400, 'Choose review or create.');
      if (operation === 'create' && (!enabled || confirmed !== true)) reject(403, enabled ? 'Confirm the reviewed trial before creating it.' : 'Trial creation is disabled pending approval. Nothing was created.');
      const approval = operation === 'create' ? verifyToken(approvalToken, user.id) : null;
      if (existing) {
        if (operation === 'create' && existing.state === 'succeeded' && existing.admin_id === user.id
          && equal(existing.request_hash, approval.hash)) {
          // A replay must include the same credentials/details, not only a token.
          const candidate = mac(env.ROOMBA_PREVIEW_SECRET, 'trial-input-v1', JSON.stringify(input));
          if (!equal(candidate, approval.inputHash)) reject(400, 'The setup details changed.');
          return reply(200, { status: 'created', result: existing.result, replayed: true });
        }
        reject(409, 'A trial attempt is already saved. Check its status before taking any further action.');
      }
      const { draft, account } = await snapshot(input);
      requestHash = mac(env.ROOMBA_PREVIEW_SECRET, 'trial-request-v1', fieldsToHash(draft, account));
      if (operation === 'review') {
        const value = { userId: user.id, hash: requestHash,
          inputHash: mac(env.ROOMBA_PREVIEW_SECRET, 'trial-input-v1', JSON.stringify(input)), expires: now() + 300000 };
        const encoded = Buffer.from(JSON.stringify(value)).toString('base64url');
        return reply(200, { status: 'review_ready', enabled,
          approvalToken: `${encoded}.${mac(env.ROOMBA_PREVIEW_SECRET, 'trial-approval-v1', encoded)}`,
          expiresAt: new Date(value.expires).toISOString(),
          summary: { packageId: draft.packageId, packageName: draft.packageName, username: draft.fields.username,
            duration: draft.duration, credits: draft.estimatedCredits, connections: 1,
            channelGroups: draft.fields['bouquets_selected[]'].length, reseller: account.username },
        });
      }
      if (!equal(approval.hash, requestHash) || !equal(approval.inputHash,
        mac(env.ROOMBA_PREVIEW_SECRET, 'trial-input-v1', JSON.stringify(input)))) reject(400, 'The setup or provider details changed. Review the trial again.');
      if (env.ROOMBA_API_URL !== endpoint || !env.ROOMBA_API_KEY?.trim() || /\s/.test(env.ROOMBA_API_KEY.trim())) reject(503, 'The provider connection is not configured. Nothing was created.');
      const dispatcher = dispatcherFactory(fixieProxyUrl(env.FIXIE_URL).href);
      try {
        if (!dispatcher || typeof dispatcher.dispatch !== 'function') reject(503, 'The provider connection is not configured. Nothing was created.');
        const body = new FormData();
        for (const [key, value] of Object.entries(draft.fields)) {
          for (const item of Array.isArray(value) ? value : [value]) body.append(key, item);
        }
        const url = new URL(endpoint);
        url.searchParams.set('api_key', env.ROOMBA_API_KEY.trim());
        url.searchParams.set('action', 'create_line');
        // The database unique key decides the winner before ANY provider write.
        claimed = await store.claim({ request_hash: requestHash, admin_id: user.id, state: 'submitting',
          reseller_id: String(account.id), package_id: draft.packageId, username: draft.fields.username });
        if (!claimed) reject(409, 'Another trial request is already saved. Check its status.');
        const started = now();
        const response = await fetchImpl(url, { method: 'POST', redirect: 'manual',
          headers: { Accept: 'application/json' }, body, dispatcher, signal: AbortSignal.timeout(15000) });
        if (!response.ok) { await response.body?.cancel().catch(() => {}); throw new Error('provider_failed'); }
        const payload = await readLineJson(response, { maxBytes: 64 * 1024 * 1024 });
        const line = payload?.data;
        const expiry = Number(line?.exp_date) * 1000;
        if (payload?.status !== 'STATUS_SUCCESS' || payload?.error || !/^[1-9]\d{0,15}$/.test(String(line?.id))
          || line?.username !== draft.fields.username || !['1', 1, true].includes(line?.is_trial)
          || String(line?.max_connections) !== '1' || String(line?.member_id) !== String(account.id)
          || !Number.isFinite(expiry) || Math.abs(expiry - (started + 36 * 3600000)) > 600000) throw new Error('unverified_line');
        const result = { lineId: String(line.id), username: draft.fields.username,
          expiresAt: new Date(expiry).toISOString(), connections: 1, trial: true };
        await store.finish(requestHash, 'succeeded', result);
        return reply(200, { status: 'created', result, replayed: false });
      } finally { if (dispatcher?.close) void Promise.resolve(dispatcher.close()).catch(() => {}); }
    } catch (error) {
      if (claimed) {
        // Includes lost responses and failed DB finalization. Never release the slot.
        try { await store.finish(requestHash, 'unknown', null); } catch { /* submitting remains locked */ }
        return reply(502, { error: 'Roomba may have received this request. Creation is locked to prevent a duplicate. Check the saved status and ask support to review the reseller panel.', needsReview: true });
      }
      return reply(error instanceof TrialError ? error.code : 503, {
        error: error instanceof TrialError ? error.message : 'Trial safeguards are unavailable. Nothing was created.',
      });
    }
  };
}
