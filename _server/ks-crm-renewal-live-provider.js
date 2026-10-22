import { fetch, FormData } from 'undici';
import { createFixieDispatcher, fixieProxyUrl } from './ks-fixie-proxy.js';
import { readAccountJson, readPackageJson, readLineJson } from './ks-roomba-account-reader.js';
import { normalizeProviderLine } from './ks-roomba-line-snapshot.js';
import { normalizePackages } from '../_shared/ks-roomba-setup.js';

const endpoint = 'https://cdn.rooomba.tv/WDXTMHmN/';
const id = value => typeof value === 'string' && /^[1-9]\d{0,14}$/.test(value);
// The trusted executor owns approval and the committed durable decision. The
// changed-order bridge must explicitly select its separate server release gate.
// Neither transport option is authorization, and clients cannot select one.
export function createLiveRenewalProvider({ env = process.env, fetchImpl = fetch,
  dispatcherFactory = createFixieDispatcher, now = Date.now, writePolicy = 'same-package' } = {}) {
  if (!['same-package','changed-order'].includes(writePolicy)) throw Error('renewal_write_policy_required');
  const releaseGate = writePolicy === 'changed-order' ? 'KS_CRM_ORDER_RENEWAL_ENABLED' : 'KS_CRM_LIVE_RENEWAL_ENABLED';
  if (env.VERCEL_ENV !== 'preview' || env.ROOMBA_API_URL !== endpoint
    || typeof env.ROOMBA_API_KEY !== 'string' || !env.ROOMBA_API_KEY || /\s/.test(env.ROOMBA_API_KEY)) throw Error('live_renewal_provider_unavailable');
  const proxy = fixieProxyUrl(env.FIXIE_URL);
  const secrets = [env.ROOMBA_API_KEY, env.FIXIE_URL, decodeURIComponent(proxy.password)];
  const deadline = now() + 48000;
  const request = async (action, lineId, form) => {
    const writing = action === 'edit_line';
    if (!['user_info','packages','get_line','edit_line'].includes(action)
      || (['get_line','edit_line'].includes(action) && !id(lineId))) throw Error('live_renewal_request_invalid');
    if (writing && env[releaseGate] !== 'true') throw Error('live_renewal_sending_disabled');
    const remaining = deadline - now();
    if (!Number.isSafeInteger(remaining) || remaining <= 0) throw Error('live_renewal_request_expired');
    let dispatcher;
    try {
      dispatcher = dispatcherFactory(proxy.href);
      if (typeof dispatcher?.dispatch !== 'function') throw Error('proxy_required');
      const url = new URL(endpoint);
      url.searchParams.set('api_key', env.ROOMBA_API_KEY); url.searchParams.set('action', action);
      if (lineId) url.searchParams.set('id', lineId);
      // Exactly one call: no retry agent, redirect following, direct fallback or
      // error-body logging. Any write failure is uncertain to the executor.
      const response = await fetchImpl(url, { method: writing ? 'POST' : 'GET', redirect: 'manual',
        ...(writing ? { body: form } : {}), dispatcher, headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(Math.min(10000, remaining)) });
      if (!response.ok) { await response.body?.cancel().catch(() => {}); throw Error('provider_rejected'); }
      if (writing || action === 'get_line') {
        const line = normalizeProviderLine(await readLineJson(response), secrets);
        if (line.id !== lineId) throw Error('wrong_provider_line');
        return line;
      }
      const payload = await (action === 'packages' ? readPackageJson(response) : readAccountJson(response));
      if (payload?.error || payload?.status !== 'STATUS_SUCCESS') throw Error('provider_rejected');
      if (action === 'packages') {
        if (!Array.isArray(payload.data)) throw Error('invalid_catalog');
        return normalizePackages(payload.data, secrets);
      }
      const a = payload.data;
      if (!id(String(a?.id)) || typeof a.username !== 'string' || !/^[A-Za-z0-9_.-]{3,64}$/.test(a.username)
        || secrets.some(secret => secret && a.username.includes(secret))
        || !['string','number'].includes(typeof a.credits) || !/^\d{1,7}(?:\.\d{1,6})?$/.test(String(a.credits))
        || Number(a.credits) > 1000000) throw Error('invalid_account');
      return { id: String(a.id), credits: a.credits };
    } catch { throw Error(writing ? 'live_renewal_result_uncertain' : 'live_renewal_read_unavailable'); }
    finally { if (dispatcher?.close) void Promise.resolve(dispatcher.close()).catch(() => {}); }
  };
  return Object.freeze({
    async snapshot(customer) {
      if (!id(String(customer?.external_id))) throw Error('saved_renewal_customer_required');
      const started = now();
      const [account,line,packages] = await Promise.all([request('user_info'), request('get_line', String(customer.external_id)), request('packages')]);
      if (now() < started || now() - started > 30000) throw Error('live_renewal_evidence_expired');
      return { account, line, packages, checkedAt: new Date(started).toISOString() };
    },
    read: lineId => request('get_line', lineId),
    account: () => request('user_info'),
    async renew(lineId, form) {
      // Validate and copy an exact documented form. Reject credentials, notes,
      // expiry/credit overrides, duplicate scalars and malformed group values.
      if (!(form instanceof FormData)) throw Error('live_renewal_form_invalid');
      const entries = [...form], scalars = ['trial','package','package_duration','max_connections'];
      if (entries.length < 5 || entries.length > 2004 || scalars.some((name, i) => entries[i]?.[0] !== name)
        || entries[0][1] !== '0' || !/^[1-9]\d{0,11}$/.test(entries[1][1])
        || !/^(1|3|6|12) months$/.test(entries[2][1]) || !/^[1-5]$/.test(entries[3][1])
        || entries.slice(4).some(([name,value], i, groups) => name !== 'bouquets_selected[]'
          || !/^[1-9]\d{0,9}$/.test(value) || Number(value) > 2147483647 || (i > 0 && Number(value) <= Number(groups[i - 1][1])))) throw Error('live_renewal_form_invalid');
      const copy = new FormData(); for (const [name,value] of entries) copy.append(name,value);
      return request('edit_line', lineId, copy);
    },
  });
}
