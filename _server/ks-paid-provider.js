import { fetch } from 'undici';
import { createFixieDispatcher, fixieProxyUrl } from './ks-fixie-proxy.js';
import { normalizePackages } from '../_shared/ks-roomba-setup.js';
import { readAccountJson, readPackageJson, readLineJson } from './ks-roomba-account-reader.js';
import { normalizeProviderLine } from './ks-roomba-line-snapshot.js';
import { buildPaidCreationForm } from './ks-paid-create-form.js';

const endpoint = 'https://cdn.rooomba.tv/WDXTMHmN/';
// Internal adapter only. No API route or webhook imports this module.
export function createPaidProviderAdapter({ env = process.env, fetchImpl = fetch, dispatcherFactory = createFixieDispatcher, now = Date.now } = {}) {
  if (env.VERCEL_ENV !== 'preview' || env.ROOMBA_API_URL !== endpoint || typeof env.ROOMBA_API_KEY !== 'string'
    || !env.ROOMBA_API_KEY || /\s/.test(env.ROOMBA_API_KEY) || !env.ROOMBA_PREVIEW_SECRET) throw new Error('paid_provider_unavailable');
  const proxy = fixieProxyUrl(env.FIXIE_URL).href;
  const read = async (action, lineId, expectedLinePassword) => {
    if (!['user_info', 'packages', 'get_line'].includes(action) || (action === 'get_line' && !/^[1-9]\d{0,14}$/.test(lineId || ''))) throw new Error('invalid_paid_read');
    const dispatcher = dispatcherFactory(proxy);
    try {
      if (!dispatcher || typeof dispatcher.dispatch !== 'function') throw new Error('paid_provider_unavailable');
      const url = new URL(endpoint); url.searchParams.set('api_key', env.ROOMBA_API_KEY); url.searchParams.set('action', action);
      if (action === 'get_line') url.searchParams.set('id', lineId);
      const response = await fetchImpl(url, { method: 'GET', redirect: 'manual', dispatcher,
        headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) { await response.body?.cancel().catch(() => {}); throw new Error('paid_provider_read_failed'); }
      const secrets = [env.ROOMBA_API_KEY, env.FIXIE_URL];
      if (action === 'get_line') {
        const line = normalizeProviderLine(await readLineJson(response, { expectedLinePassword }), secrets);
        if (line.id !== lineId) throw new Error('wrong_paid_line');
        return { line };
      }
      const payload = await (action === 'packages' ? readPackageJson(response) : readAccountJson(response));
      if (payload?.error || (payload?.status !== undefined && ![true, 'STATUS_SUCCESS', 'success'].includes(payload.status))) throw new Error('paid_provider_read_failed');
      if (action === 'packages') {
        if (!Array.isArray(payload?.data)) throw new Error('paid_provider_read_failed');
        return { packages: normalizePackages(payload.data, secrets) };
      }
      const a = payload?.data;
      if (!/^[1-9]\d{0,14}$/.test(String(a?.id)) || typeof a.username !== 'string' || !/^[A-Za-z0-9_.-]{3,64}$/.test(a.username)
        || secrets.some(secret => a.username.includes(secret)) || !['number', 'string'].includes(typeof a.credits)
        || !/^\d{1,7}(?:\.\d{1,6})?$/.test(String(a.credits)) || Number(a.credits) > 1000000) throw new Error('paid_provider_read_failed');
      return { account: { id: String(a.id), username: a.username, credits: a.credits } };
    } catch { throw new Error('paid_provider_read_failed'); }
    finally { if (dispatcher?.close) void Promise.resolve(dispatcher.close()).catch(() => {}); }
  };
  return {
    async snapshot() {
      const started = now();
      const [account, catalog] = await Promise.all([read('user_info'), read('packages')]);
      if (now() - started > 30000) throw new Error('stale_provider_snapshot');
      return { account: account.account, packages: catalog.packages, checkedAt: started };
    },
    async account() { return (await read('user_info')).account; },
    async line(id, expectedPassword) {
      if (typeof expectedPassword !== 'string' || !/^[A-Za-z0-9_-]{24,64}$/.test(expectedPassword)) throw new Error('login_verification_required');
      return (await read('get_line', id, expectedPassword)).line;
    },
    async create(selected, login) {
      const form = buildPaidCreationForm(selected, login);
      const dispatcher = dispatcherFactory(proxy);
      try {
        if (!dispatcher || typeof dispatcher.dispatch !== 'function') throw new Error('paid_provider_unavailable');
        const url = new URL(endpoint); url.searchParams.set('api_key', env.ROOMBA_API_KEY); url.searchParams.set('action', 'create_line');
        const response = await fetchImpl(url, { method: 'POST', redirect: 'manual', body: form, dispatcher,
          headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
        if (!response.ok) { await response.body?.cancel().catch(() => {}); throw new Error('paid_provider_failed'); }
        return normalizeProviderLine(await readLineJson(response, { maxBytes: 64 * 1024 * 1024, expectedLinePassword: login.password }), [env.ROOMBA_API_KEY, env.FIXIE_URL]);
      } catch { throw new Error('paid_provider_result_uncertain'); }
      finally { if (dispatcher?.close) void Promise.resolve(dispatcher.close()).catch(() => {}); }
    },
  };
}
