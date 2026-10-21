import { buildPackageSummary } from '../_shared/ks-roomba-package-summary.js';

const standardName = /^(1|3|6|12)\s+months?\s*\+\s*([1-5])\s+connections?$/i;
const groups = value => Array.isArray(value) && value.length > 0 && value.length <= 2000
  && value.every(id => Number.isSafeInteger(id) && id > 0 && id <= 2147483647)
  && new Set(value).size === value.length ? [...value].sort((a, b) => a - b) : null;
const amount = value => ['string', 'number'].includes(typeof value) && /^\d+(?:\.\d+)?$/.test(String(value))
  && Number.isFinite(Number(value)) && Number(value) <= 1000000 ? Number(value) : null;

export function compareChannelGroups(lineGroups, packageGroups) {
  const actual = groups(lineGroups);
  const expected = groups(packageGroups);
  if (!actual || !expected) return { status: 'unverified', lineCount: actual?.length ?? null,
    packageCount: expected?.length ?? null, lineOnly: [], packageOnly: [] };
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const lineOnly = actual.filter(id => !expectedSet.has(id));
  const packageOnly = expected.filter(id => !actualSet.has(id));
  return { status: lineOnly.length || packageOnly.length ? 'different' : 'match',
    lineCount: actual.length, packageCount: expected.length, lineOnly, packageOnly };
}

// Review only: no form, dispatch token, provider mutation or database access.
// Only same-package renewal of an active paid line is documented as verified.
export function buildRenewalReview({ line, account, packages, checkedAt }, now = Date.now()) {
  const checked = Date.parse(checkedAt);
  if (!Number.isFinite(checked) || checked > now + 1000 || !Number.isFinite(Date.parse(line?.expiresAt))) throw new Error('invalid_review');
  const catalog = buildPackageSummary(packages, checkedAt);
  const pkg = catalog.packages.find(item => item.id === line.packageId);
  const blockers = [];
  if (now - checked > 60000) blockers.push('This review is over one minute old. Reload it before continuing.');
  if (line.trial !== false) blockers.push('Trial conversion requires a separate review.');
  if (Date.parse(line.expiresAt) <= now) blockers.push('Renewal of an expired line has not been verified with this provider.');
  if (line.enabled !== true || line.adminEnabled !== true) blockers.push('The line must be enabled before its renewal can be reviewed.');
  const name = pkg && standardName.exec(pkg.name);
  const validPackage = pkg && name && !pkg.issues.length && pkg.trial === null && pkg.paid?.unit === 'months'
    && [1, 3, 6, 12].includes(pkg.paid.count) && pkg.paid.count === Number(name[1])
    && pkg.maxConnections === Number(name[2]) && pkg.paid.credits > 0;
  if (!validPackage) blockers.push('The current line package needs review. No alternative package was selected.');
  const channelGroups = compareChannelGroups(line.bouquetIds, pkg?.bouquets);
  if (channelGroups.status === 'different') blockers.push('The line and package channel groups do not match.');
  else if (channelGroups.status === 'unverified') blockers.push('The line or package channel groups could not be verified.');
  if (!pkg || line.connections !== pkg.maxConnections) blockers.push('The package connection allowance does not match the line.');
  const creditsAvailable = amount(account?.credits);
  const estimatedCredits = validPackage ? pkg.paid.credits : null;
  if (creditsAvailable === null) blockers.push('The reseller credit balance could not be verified.');
  else if (estimatedCredits !== null && creditsAvailable < estimatedCredits) blockers.push('The reseller credit balance is below the estimated renewal cost.');
  return {
    status: blockers.length ? 'manual_review' : 'review_ready', executionEnabled: false, sent: false,
    checkedAt: new Date(checked).toISOString(),
    packageName: validPackage ? `${pkg.paid.count} month${pkg.paid.count === 1 ? '' : 's'} · ${pkg.maxConnections} connection${pkg.maxConnections === 1 ? '' : 's'}` : null,
    durationMonths: validPackage ? pkg.paid.count : null, estimatedCredits, creditsAvailable, blockers, channelGroups,
  };
}
