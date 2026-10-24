import type { SupabaseClient } from '@supabase/supabase-js';
import { portalUuid } from '../../_shared/ks-customer-crm.js';
import { SupportFailure, type SupportScope } from './support-tickets';

export const WEBSITE_PLAN_COLUMNS = 'id,subscription_tier,subscription_status,connections_allowed,subscription_expires_at,updated_at';
export type WebsitePlan = { accountId: string; tier: string | null; status: string | null; connections: number | null; expiresAt: string | null; updatedAt: string | null };
const current = (scope: SupportScope) => { if (scope.signal.aborted || !scope.isCurrent()) throw new SupportFailure('changed'); };
const optionalText = (value: unknown) => { if (value === null || (typeof value === 'string' && value.length <= 100)) return value; throw new SupportFailure('unavailable'); };
const optionalDate = (value: unknown) => { if (value === null) return null; if (typeof value === 'string' && value.length <= 40 && Number.isFinite(Date.parse(value))) return value; throw new SupportFailure('unavailable'); };
export async function readWebsitePlan(client: SupabaseClient, accountId: string, scope: SupportScope): Promise<WebsitePlan> {
  current(scope); if (!portalUuid(accountId)) throw new SupportFailure('changed');
  const { data, error } = await client.auth.getUser(); current(scope);
  if (error) throw new SupportFailure(error.name === 'AuthSessionMissingError' ? 'changed' : 'unavailable');
  if (!data.user || data.user.id !== accountId || data.user.is_anonymous || !data.user.email_confirmed_at) throw new SupportFailure('changed');
  const result = await client.from('profiles').select(WEBSITE_PLAN_COLUMNS).eq('id', accountId).abortSignal(scope.signal).maybeSingle(); current(scope);
  if (result.error) throw new SupportFailure('unavailable'); if (!result.data) throw new SupportFailure('missing');
  const row = result.data as Record<string, unknown>;
  if (row.id !== accountId || !(row.connections_allowed === null || (Number.isInteger(row.connections_allowed) && Number(row.connections_allowed) >= 0 && Number(row.connections_allowed) <= 1000))) throw new SupportFailure('unavailable');
  return { accountId, tier: optionalText(row.subscription_tier), status: optionalText(row.subscription_status), connections: row.connections_allowed as number | null, expiresAt: optionalDate(row.subscription_expires_at), updatedAt: optionalDate(row.updated_at) };
}
