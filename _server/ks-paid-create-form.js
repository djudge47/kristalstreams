import { FormData } from 'undici';

// Documented paid create_line fields only. This function does not send a request.
export function buildPaidCreationForm(provider, credentials) {
  if (!provider || !/^[1-9]\d{0,11}$/.test(provider.id) || provider.duration?.unit !== 'months'
    || ![1, 3, 6, 12].includes(provider.duration.count) || !Number.isInteger(provider.maxConnections)
    || provider.maxConnections < 1 || provider.maxConnections > 5 || !Array.isArray(provider.bouquetIds)
    || provider.bouquetIds.length === 0 || provider.bouquetIds.length > 2000
    || new Set(provider.bouquetIds).size !== provider.bouquetIds.length
    || !provider.bouquetIds.every(id => Number.isSafeInteger(id) && id > 0 && id <= 2147483647)
    || typeof credentials?.username !== 'string' || !/^[A-Za-z0-9_.-]{8,64}$/.test(credentials.username)
    || typeof credentials.password !== 'string' || !/^[A-Za-z0-9_-]{24,64}$/.test(credentials.password)) throw new Error('invalid_creation');
  const form = new FormData();
  for (const [key, value] of Object.entries({ trial: '0', username: credentials.username, password: credentials.password,
    package: provider.id, package_duration: `${provider.duration.count} months`, max_connections: String(provider.maxConnections) })) form.append(key, value);
  for (const id of provider.bouquetIds) form.append('bouquets_selected[]', String(id));
  return form;
}
