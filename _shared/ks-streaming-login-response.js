export function parseLoginAvailability(raw, accountId) {
  if (raw?.accountId !== accountId || raw.previewOnly !== true || !Array.isArray(raw.logins) || raw.logins.length > 5) throw new Error('Invalid login availability.');
  const seen = new Set();
  return raw.logins.map(row => {
    if (typeof row?.reference !== 'string' || row.reference.length > 200 || !/^cs_(test_)?[A-Za-z0-9]+$/.test(row.reference)
      || seen.has(row.reference) || typeof row.expiresAt !== 'string' || !Number.isFinite(Date.parse(row.expiresAt))) throw new Error('Invalid login availability.');
    seen.add(row.reference); return { reference: row.reference, expiresAt: row.expiresAt };
  });
}
export function parseStreamingLogin(raw, accountId, reference) {
  if (raw?.accountId !== accountId || raw.previewOnly !== true || raw.reference !== reference
    || typeof raw.expiresAt !== 'string' || !Number.isFinite(Date.parse(raw.expiresAt))
    || typeof raw.login?.username !== 'string' || !/^[A-Za-z0-9_.-]{8,64}$/.test(raw.login.username)
    || typeof raw.login?.password !== 'string' || !/^[A-Za-z0-9_-]{24,64}$/.test(raw.login.password)) throw new Error('Your streaming login could not be verified.');
  return { username: raw.login.username, password: raw.login.password };
}
