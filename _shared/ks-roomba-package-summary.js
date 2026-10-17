// Export only the already-loaded package catalog, never a setup draft or credentials.
const fail = () => { throw new Error('Reload packages before downloading the summary.'); };
const whole = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;

function duration(value) {
  if (value === null) return null;
  if (!value || !whole(value.count, 1, 3650) || !['hours', 'days', 'months', 'years'].includes(value.unit)
    || !Number.isFinite(value.credits) || value.credits < 0 || value.credits > 1000000) return fail();
  return { count: value.count, unit: value.unit, credits: value.credits };
}

export function buildPackageSummary(packages, checkedAt) {
  if (!Array.isArray(packages) || packages.length === 0 || packages.length > 128
    || typeof checkedAt !== 'string' || !Number.isFinite(Date.parse(checkedAt))) return fail();
  const ids = new Set();
  const catalog = packages.map(item => {
    if (!item || typeof item.id !== 'string' || !/^[1-9]\d{0,11}$/.test(item.id) || ids.has(item.id)
      || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 160
      || (item.maxConnections !== null && !whole(item.maxConnections, 1, 32))
      || !Array.isArray(item.issues) || item.issues.length > 8
      || !item.issues.every(issue => typeof issue === 'string' && issue.length <= 200)
      || (item.bouquets !== null && (!Array.isArray(item.bouquets) || item.bouquets.length > 2000
        || !item.bouquets.every(id => whole(id, 1, 2147483647))))) return fail();
    ids.add(item.id);
    return {
      id: item.id, name: item.name, maxConnections: item.maxConnections,
      paid: duration(item.paid), trial: duration(item.trial),
      bouquets: item.bouquets === null ? null : [...item.bouquets], issues: [...item.issues],
    };
  });
  return { schemaVersion: 1, purpose: 'Kristal Streams package review', readOnly: true, checkedAt, packages: catalog };
}
