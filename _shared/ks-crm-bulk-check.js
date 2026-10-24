const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const panelId = value => ['string', 'number'].includes(typeof value) && /^[1-9]\d{0,14}$/.test(String(value));
const username = value => typeof value === 'string' && /^[A-Za-z0-9_.-]{3,64}$/.test(value);
const instant = value => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}(?::?\d{2})?)$/.test(value)
  && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null;
const label = value => typeof value === 'string' && value.trim() && value.length <= 160 ? value.trim() : null;
const aborted = () => new DOMException('Check stopped.', 'AbortError');

export function bulkCustomerSnapshot(customers) {
  if (!Array.isArray(customers) || !customers.length || customers.length > 1000) throw new Error('Load between 1 and 1000 CRM accounts before checking.');
  const ids = new Set(), panels = new Set(), names = new Set();
  return customers.map(c => {
    if (!uuid(c?.id) || !panelId(c.external_id) || !username(c.username)
      || ids.has(c.id) || panels.has(String(c.external_id)) || names.has(c.username.toLowerCase())) {
      throw new Error('Review duplicate or incomplete CRM account identities before checking.');
    }
    ids.add(c.id); panels.add(String(c.external_id)); names.add(c.username.toLowerCase());
    // Never copy the entire CRM object: it can include legacy login fields.
    return { id: c.id, external_id: String(c.external_id), username: c.username,
      package_name: label(c.package_name), connections_allowed: c.connections_allowed,
      expiration_at: typeof c.expiration_at === 'string' ? c.expiration_at : null,
      account_status: c.account_status, trial: c.trial };
  });
}

export function compareBulkLine(customer, payload, now = Date.now()) {
  const line = payload?.line;
  if (payload?.mode !== 'read-only' || payload?.databaseWrites !== false || !line
    || line.customerId !== customer.id || line.lineId !== String(customer.external_id) || line.username !== customer.username
    || instant(line.checkedAt) === null || Date.parse(line.checkedAt) > now + 5000 || now - Date.parse(line.checkedAt) > 120000
    || instant(line.expiresAt) === null || !Number.isInteger(line.connectionsAllowed) || line.connectionsAllowed < 1 || line.connectionsAllowed > 32
    || ![line.trial, line.enabled, line.adminEnabled].every(value => typeof value === 'boolean')
    || typeof line.packageId !== 'string' || !/^[1-9]\d{0,11}$/.test(line.packageId)
    || !(line.packageName === null || label(line.packageName))) throw new Error('The matching XUI account could not be verified.');
  const expiry = instant(customer.expiration_at), providerExpiry = instant(line.expiresAt);
  const savedStatus = expiry !== null && expiry <= now ? 'expired' : customer.account_status;
  const providerStatus = providerExpiry <= now ? 'expired' : !line.enabled || !line.adminEnabled ? 'disabled' : 'active';
  const field = (name, saved, provider, known, equal = saved === provider) => ({ name, saved, provider,
    status: !known ? 'unverified' : equal ? 'match' : 'different' });
  const fields = [
    field('Package', customer.package_name, line.packageName, Boolean(customer.package_name && line.packageName),
      customer.package_name?.toLowerCase().replace(/\s+/g, ' ') === line.packageName?.trim().toLowerCase().replace(/\s+/g, ' ')),
    field('Connections', customer.connections_allowed, line.connectionsAllowed, Number.isInteger(customer.connections_allowed) && customer.connections_allowed > 0),
    field('Expiration', expiry === null ? null : new Date(expiry).toISOString(), new Date(providerExpiry).toISOString(), expiry !== null, expiry === providerExpiry),
    field('Service status', savedStatus, providerStatus, typeof savedStatus === 'string' && Boolean(savedStatus)),
    field('Trial', customer.trial, line.trial, typeof customer.trial === 'boolean'),
  ];
  return { customerId: customer.id, panelId: String(customer.external_id), username: customer.username,
    status: fields.every(item => item.status === 'match') ? 'match' : 'review', checkedAt: line.checkedAt, fields };
}

function waitFor(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(aborted());
    const stop = () => { clearTimeout(timer); signal?.removeEventListener('abort', stop); reject(aborted()); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', stop); resolve(); }, ms);
    signal?.addEventListener('abort', stop, { once: true });
  });
}

export async function runBulkXuiCheck({ customers, getToken, fetchImpl = fetch, signal, onProgress = () => {},
  wait = waitFor, now = Date.now, spacingMs = 30000 }) {
  const snapshot = bulkCustomerSnapshot(customers), rows = [];
  let nextAt = 0, stopped = false;
  const emit = (state, customer, extra = {}) => onProgress({ state, completed: rows.length, total: snapshot.length,
    username: customer?.username ?? '', rows: [...rows], ...extra });
  try {
    for (const customer of snapshot) {
      if (signal?.aborted) throw aborted();
      for (let attempt = 0; attempt < 3; attempt++) {
        const delay = Math.max(0, nextAt - now());
        if (delay) { emit('waiting', customer, { waitSeconds: Math.ceil(delay / 1000) }); await wait(delay, signal); }
        if (signal?.aborted) throw aborted();
        emit('checking', customer);
        let token;
        try { token = await getToken(); } catch { token = null; }
        if (signal?.aborted) throw aborted();
        if (!token || typeof token !== 'string') { emit('stopped', customer, { error: 'Sign in again to your admin account before continuing.' }); return { rows, complete: false }; }
        nextAt = now() + Math.max(30000, spacingMs);
        const request = new AbortController();
        const stop = () => request.abort();
        signal?.addEventListener('abort', stop, { once: true });
        const timeout = setTimeout(stop, 45000);
        let response, payload;
        try {
          response = await fetchImpl(`/api/ks-roomba-crm?view=customer-comparison&customerId=${encodeURIComponent(customer.id)}`, {
            method: 'GET', cache: 'no-store', signal: request.signal,
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          });
          payload = await response.json().catch(() => null);
        } catch { /* Report fixed text; never expose response or network details. */ }
        finally { clearTimeout(timeout); signal?.removeEventListener('abort', stop); }
        if (signal?.aborted) throw aborted();
        if ([401, 403, 503].includes(response?.status)) {
          emit('stopped', customer, { error: response.status === 503 ? 'The XUI connection is unavailable. Completed results are shown below.' : 'Admin access could not be verified. Sign in again before continuing.' });
          return { rows, complete: false };
        }
        if (response?.status === 429 && attempt < 2) {
          const seconds = Number(payload?.retryAfterSeconds);
          nextAt = Math.max(nextAt, now() + (Number.isFinite(seconds) ? Math.max(1, Math.min(60, seconds)) : 30) * 1000);
          continue;
        }
        let row;
        try { if (!response?.ok) throw new Error(); row = compareBulkLine(customer, payload, now()); }
        catch { row = { customerId: customer.id, panelId: String(customer.external_id), username: customer.username,
          status: 'failed', checkedAt: null, fields: [], error: 'XUI details could not be verified. No saved records changed.' }; }
        rows.push(row); emit('checked', customer); break;
      }
    }
  } catch (error) { if (error?.name !== 'AbortError') throw error; stopped = true; }
  const complete = !stopped && rows.length === snapshot.length;
  emit(complete ? 'complete' : 'stopped', null);
  return { rows, complete };
}
