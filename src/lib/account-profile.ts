import type { SupabaseClient, User } from '@supabase/supabase-js';
import { portalEmail, portalUuid } from '../../_shared/ks-customer-crm.js';

export type AccountProfile = { accountId: string; email: string; fullName: string | null; createdAt: string | null; revision: string };
export type ProfileFailureCode = 'changed' | 'unavailable' | 'missing' | 'invalid_name' | 'not_saved' | 'uncertain';
export class ProfileFailure extends Error {
  constructor(public code: ProfileFailureCode) { super(code); }
}
type Scope = { signal: AbortSignal; isCurrent: () => boolean };
const current = (scope: Scope) => { if (scope.signal.aborted || !scope.isCurrent()) throw new ProfileFailure('changed'); };
async function owner(client: SupabaseClient, accountId: string, scope: Scope): Promise<User> {
  current(scope);
  if (!portalUuid(accountId)) throw new ProfileFailure('changed');
  const result = await client.auth.getUser();
  current(scope);
  if (result.error) throw new ProfileFailure(result.error.name === 'AuthSessionMissingError' ? 'changed' : 'unavailable');
  const user = result.data.user;
  if (!user || user.id !== accountId || user.is_anonymous || !user.email_confirmed_at || !portalEmail(user.email)) throw new ProfileFailure('changed');
  return user;
}
function profile(row: unknown, user: User): AccountProfile {
  if (!row || typeof row !== 'object' || Array.isArray(row)) throw new ProfileFailure('unavailable');
  const v = row as Record<string, unknown>;
  if (v.id !== user.id || !(v.full_name === null || (typeof v.full_name === 'string' && v.full_name.length <= 1000)) || !(typeof v.updated_at === 'string' && v.updated_at.length <= 40 && Number.isFinite(Date.parse(v.updated_at)))) throw new ProfileFailure('unavailable');
  const createdAt = typeof user.created_at === 'string' && user.created_at.length <= 40 && Number.isFinite(Date.parse(user.created_at)) ? user.created_at : null;
  return { accountId: user.id, email: user.email!, fullName: v.full_name as string | null, createdAt, revision: v.updated_at as string };
}
export async function loadAccountProfile(client: SupabaseClient, accountId: string, scope: Scope): Promise<AccountProfile> {
  const user = await owner(client, accountId, scope);
  current(scope);
  const result = await client.from('profiles').select('id,full_name,updated_at').eq('id', accountId).abortSignal(scope.signal).maybeSingle();
  current(scope);
  if (result.error) throw new ProfileFailure('unavailable');
  if (!result.data) throw new ProfileFailure('missing');
  return profile(result.data, user);
}
export async function saveAccountName(client: SupabaseClient, expected: Pick<AccountProfile, 'accountId' | 'revision'>, value: string, scope: Scope): Promise<AccountProfile> {
  if (typeof value !== 'string' || value.trim().length > 200) throw new ProfileFailure('invalid_name');
  const { accountId, revision } = expected;
  if (!(typeof revision === 'string' && revision.length <= 40 && Number.isFinite(Date.parse(revision)))) throw new ProfileFailure('changed');
  const fullName = value.trim() || null;
  const user = await owner(client, accountId, scope);
  current(scope);
  let result;
  try {
    let query = client.from('profiles').update({ full_name: fullName }).eq('id', accountId);
    query = query.eq('updated_at', revision);
    result = await query.select('id,full_name,updated_at').abortSignal(scope.signal).retry(false).maybeSingle();
  } catch { throw new ProfileFailure('uncertain'); }
  current(scope);
  // A lost response may follow a committed update. Require a fresh read, not a retry.
  if (result.error) throw new ProfileFailure('uncertain');
  if (!result.data) throw new ProfileFailure('not_saved');
  let saved;
  try { saved = profile(result.data, user); } catch { throw new ProfileFailure('uncertain'); }
  if (saved.fullName !== fullName) throw new ProfileFailure('uncertain');
  return saved;
}
