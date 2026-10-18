// A line read may contain a password. Retain only fields needed for verification.
const id = (value, max = 15) => {
  const text = String(value ?? '');
  if (!new RegExp(`^[1-9]\\d{0,${max - 1}}$`).test(text)) throw new Error('invalid_line');
  return text;
};
const flag = value => {
  if ([true, 1, '1'].includes(value)) return true;
  if ([false, 0, '0'].includes(value)) return false;
  throw new Error('invalid_line');
};

export function normalizeProviderLine(payload, secrets = []) {
  const raw = payload?.data;
  if (payload?.status !== 'STATUS_SUCCESS' || payload?.error || !raw || Array.isArray(raw)) throw new Error('invalid_line');
  if (typeof raw.username !== 'string' || !/^[A-Za-z0-9_.-]{3,64}$/.test(raw.username)
    || secrets.some(secret => secret && raw.username.includes(secret))) throw new Error('invalid_line');
  if (!/^[1-9]\d{0,11}$/.test(String(raw.exp_date)) || Number(raw.exp_date) > 253402300799) throw new Error('invalid_line');
  if (!/^[1-9]\d?$/.test(String(raw.max_connections)) || Number(raw.max_connections) > 32) throw new Error('invalid_line');
  let bouquets;
  try { bouquets = typeof raw.bouquet === 'string' ? JSON.parse(raw.bouquet) : null; } catch { throw new Error('invalid_line'); }
  if (!Array.isArray(bouquets) || bouquets.length === 0 || bouquets.length > 2000
    || !bouquets.every(value => ['string', 'number'].includes(typeof value) && /^[1-9]\d{0,9}$/.test(String(value)) && Number(value) <= 2147483647)) throw new Error('invalid_line');
  const bouquetIds = [...new Set(bouquets.map(Number))].sort((a, b) => a - b);
  if (bouquetIds.length !== bouquets.length) throw new Error('invalid_line');
  return {
    id: id(raw.id), username: raw.username, resellerId: id(raw.member_id), packageId: id(raw.package_id, 12),
    expiresAt: new Date(Number(raw.exp_date) * 1000).toISOString(), connections: Number(raw.max_connections),
    trial: flag(raw.is_trial), enabled: flag(raw.enabled), adminEnabled: flag(raw.admin_enabled), bouquetIds,
  };
}

export function verifyCurrentTrial(review, account, line, packages, checkedAt, now = Date.now()) {
  const resellerId = id(account?.id);
  if (typeof account?.username !== 'string' || !/^[A-Za-z0-9_.-]{3,64}$/.test(account.username)
    || !['string', 'number'].includes(typeof account.credits) || !/^\d+(?:\.\d+)?$/.test(String(account.credits))
    || !Number.isFinite(Number(account.credits)) || Number(account.credits) > 1000000) throw new Error('reseller_unverified');
  if (resellerId !== review.existing.resellerId || line?.id !== review.existing.lineId || line.username !== review.existing.username || line.resellerId !== resellerId
    || line.packageId !== '1' || line.trial !== true || line.connections !== 1
    || line.enabled !== true || line.adminEnabled !== true
    || Date.parse(line.expiresAt) !== Date.parse(review.existing.savedExpiresAt)) throw new Error('trial_changed');
  if (Date.parse(line.expiresAt) <= now) throw new Error('trial_expired');
  const trialPackage = packages.find(item => item.id === '1');
  const paidPackage = packages.find(item => item.id === review.proposed.packageId);
  const groups = value => Array.isArray(value) && value.length > 0 ? [...new Set(value)].sort((a, b) => a - b) : null;
  const actual = groups(line.bouquetIds);
  if (!actual || JSON.stringify(actual) !== JSON.stringify(groups(trialPackage?.bouquets))
    || JSON.stringify(actual) !== JSON.stringify(groups(paidPackage?.bouquets))) throw new Error('channel_groups_changed');
  if (Number(account.credits) < review.proposed.credits) throw new Error('insufficient_credits');
  if (!Number.isFinite(Date.parse(checkedAt)) || Math.abs(Date.parse(checkedAt) - now) > 60000) throw new Error('stale_line_check');
  return {
    checkedAt, lineId: line.id, resellerVerified: true, identityVerified: true,
    trial: true, enabled: true, expiresAt: line.expiresAt, connections: line.connections,
    bouquetCount: actual.length, channelGroupsUnchanged: true,
    creditsAvailable: Number(account.credits), sufficientCredits: true,
  };
}
