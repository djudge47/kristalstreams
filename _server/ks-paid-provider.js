import { fetch } from 'undici';
import { createFixieDispatcher, fixieProxyUrl } from './ks-fixie-proxy.js';
import { readLineJson } from './ks-roomba-account-reader.js';
import { normalizeProviderLine } from './ks-roomba-line-snapshot.js';
import { createPaidReadAdapter } from './ks-paid-provider-read.js';
import { buildPaidCreationForm } from './ks-paid-create-form.js';

const endpoint = 'https://cdn.rooomba.tv/WDXTMHmN/';
// Internal adapter only. No API route or webhook imports this module.
export function createPaidProviderAdapter({ env = process.env, fetchImpl = fetch, dispatcherFactory = createFixieDispatcher, now = Date.now } = {}) {
  if (env.VERCEL_ENV !== 'preview' || env.ROOMBA_API_URL !== endpoint || typeof env.ROOMBA_API_KEY !== 'string'
    || !env.ROOMBA_API_KEY || /\s/.test(env.ROOMBA_API_KEY) || !env.ROOMBA_PREVIEW_SECRET) throw new Error('paid_provider_unavailable');
  const proxy = fixieProxyUrl(env.FIXIE_URL).href;
  const reads = createPaidReadAdapter({ env, fetchImpl, dispatcherFactory, now });
  return {
    ...reads,
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
