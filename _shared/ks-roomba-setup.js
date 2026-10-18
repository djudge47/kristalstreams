// Browser-safe draft helpers. This module has no credentials, fetches or writes.
const integer = (value, max) => /^(?:0|[1-9]\d*)$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) <= max ? Number(value) : null;
const amount = value => ['string', 'number'].includes(typeof value) && /^\d+(?:\.\d+)?$/.test(String(value).trim()) && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 1000000 ? Number(value) : null;
const enabled = value => value === true || value === 1 || value === '1';
const units = { hour: 'hours', hours: 'hours', day: 'days', days: 'days', month: 'months', months: 'months', year: 'years', years: 'years' };

function duration(raw, prefix) {
  const count = integer(raw[`${prefix}_duration`], 3650);
  const label = typeof raw[`${prefix}_duration_in`] === 'string' ? raw[`${prefix}_duration_in`].toLowerCase() : '';
  const unit = Object.hasOwn(units, label) ? units[label] : null;
  const credits = amount(raw[`${prefix}_credits`]);
  return count && unit && credits !== null ? { count, unit, credits } : null;
}

export function normalizePackages(records, secrets = []) {
  if (!Array.isArray(records) || records.length > 128) throw new Error('Package list could not be verified.');
  const ids = new Set();
  return records.map(raw => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Package list could not be verified.');
    const id = String(raw.id ?? '');
    if (!/^[1-9]\d{0,11}$/.test(id) || ids.has(id)) throw new Error('Package identifiers could not be verified.');
    ids.add(id);
    const safeName = typeof raw.package_name === 'string' && raw.package_name.trim().length > 0 && raw.package_name.length <= 160
      && !secrets.some(secret => secret && raw.package_name.includes(secret));
    const name = safeName ? raw.package_name.trim() : `Package ${id}`;
    const maxConnections = integer(raw.max_connections, 32);
    let bouquets = null;
    try {
      const parsed = typeof raw.bouquets === 'string' ? JSON.parse(raw.bouquets) : null;
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.length <= 2000 && parsed.every(value => integer(value, 2147483647) > 0)) {
        bouquets = [...new Set(parsed.map(value => Number(value)))];
      }
    } catch { /* Missing package selections are displayed, never invented. */ }
    const trial = enabled(raw.is_trial) ? duration(raw, 'trial') : null;
    const paid = enabled(raw.is_official) ? duration(raw, 'official') : null;
    const issues = [];
    if (!safeName) issues.push('Package name is unavailable.');
    if (!maxConnections) issues.push('Connection allowance is unavailable.');
    if (!bouquets) issues.push('Included channel groups could not be verified.');
    if (!trial && !paid) issues.push('A supported duration and credit cost are unavailable.');
    return { id, name, maxConnections, bouquets, trial, paid, issues };
  });
}

export function buildSetupDraft(input, packages) {
  const selected = packages.find(item => item.id === input.packageId);
  if (!selected || selected.issues.length) throw new Error('Choose a package with complete provider details.');
  if (!['trial', 'paid'].includes(input.mode)) throw new Error('Choose trial or paid access.');
  const mode = selected[input.mode];
  if (!mode) throw new Error('This access type is not available for the selected package.');
  const username = String(input.username || '').trim();
  if (!/^[A-Za-z0-9_.-]{3,64}$/.test(username)) throw new Error('Use a username of 3 to 64 letters, numbers, periods, underscores or hyphens.');
  const password = input.password;
  if (typeof password !== 'string' || !/^[\x21-\x7e]{12,128}$/.test(password)) throw new Error('Use a password of 12 to 128 printable characters without spaces.');
  const connections = Number(input.connections);
  if (!Number.isInteger(connections) || connections < 1 || connections > selected.maxConnections) throw new Error('Choose a connection count within the package allowance.');
  const notes = String(input.notes || '').trim();
  if (notes.length > 1000) throw new Error('Keep reseller notes to 1,000 characters or fewer.');
  return {
    draftOnly: true, sent: false, packageId: selected.id, packageName: selected.name,
    accessType: input.mode, duration: `${mode.count} ${mode.unit}`, estimatedCredits: mode.credits,
    fields: {
      trial: input.mode === 'trial' ? '1' : '0', username, password,
      package: selected.id, package_duration: `${mode.count} ${mode.unit}`,
      max_connections: String(connections), 'bouquets_selected[]': selected.bouquets.map(String),
      reseller_notes: notes,
    },
  };
}
