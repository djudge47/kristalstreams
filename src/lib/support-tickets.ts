import type { SupabaseClient } from '@supabase/supabase-js';
import { portalUuid } from '../../_shared/ks-customer-crm.js';

export const TICKET_COLUMNS = 'id,user_id,subject,description,status,priority,category,created_at';
export const REPLY_COLUMNS = 'id,ticket_id,user_id,message,is_staff,delivery_status,created_at';
export const TICKET_PAGE_SIZE = 5, REPLY_PAGE_SIZE = 20;
export type SupportTicket = { id: string; owner: string; subject: string; description: string; status: string; priority: string; category: string; createdAt: string };
export type SupportReply = { id: string; ticketId: string; owner: string; message: string; staff: boolean; delivery: string; createdAt: string };
export type SupportScope = { signal: AbortSignal; isCurrent: () => boolean };
export class SupportFailure extends Error {
  constructor(public code: 'changed' | 'unavailable' | 'missing' | 'invalid' | 'uncertain') { super(code); }
}
function current(scope: SupportScope) { if (scope.signal.aborted || !scope.isCurrent()) throw new SupportFailure('changed'); }
async function owner(client: SupabaseClient, accountId: string, scope: SupportScope) {
  current(scope);
  if (!portalUuid(accountId)) throw new SupportFailure('changed');
  const { data, error } = await client.auth.getUser(); current(scope);
  if (error) throw new SupportFailure(error.name === 'AuthSessionMissingError' ? 'changed' : 'unavailable');
  if (!data.user || data.user.id !== accountId || data.user.is_anonymous || !data.user.email_confirmed_at) throw new SupportFailure('changed');
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new SupportFailure('unavailable');
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number): string { if (typeof value !== 'string' || value.length > max) throw new SupportFailure('unavailable'); return value; }
function date(value: unknown): string { const result = text(value, 40); if (!Number.isFinite(Date.parse(result))) throw new SupportFailure('unavailable'); return result; }
function ticket(value: unknown, accountId: string): SupportTicket {
  const row = record(value);
  if (!portalUuid(row.id) || row.user_id !== accountId) throw new SupportFailure('unavailable');
  return { id: row.id as string, owner: accountId, subject: text(row.subject, 2000), description: text(row.description, 100000), status: text(row.status, 100), priority: text(row.priority, 100), category: text(row.category, 200), createdAt: date(row.created_at) };
}
function reply(value: unknown, accountId: string, ticketId: string): SupportReply {
  const row = record(value);
  if (!portalUuid(row.id) || !portalUuid(row.user_id) || row.ticket_id !== ticketId || typeof row.is_staff !== 'boolean' || (!row.is_staff && row.user_id !== accountId)) throw new SupportFailure('unavailable');
  return { id: row.id as string, ticketId, owner: row.user_id as string, message: text(row.message, 100000), staff: row.is_staff, delivery: text(row.delivery_status, 100), createdAt: date(row.created_at) };
}
function pageBounds(page: number, size: number) {
  if (!Number.isSafeInteger(page) || page < 0 || !Number.isSafeInteger((page + 1) * size)) throw new SupportFailure('invalid');
  return [page * size, (page + 1) * size] as const; // inclusive end: one look-ahead row
}
function pageRows<T extends { id: string }>(data: unknown, size: number, parse: (value: unknown) => T) {
  if (!Array.isArray(data) || data.length > size + 1) throw new SupportFailure('unavailable');
  const rows = data.map(parse); if (new Set(rows.map(row => row.id)).size !== rows.length) throw new SupportFailure('unavailable');
  return { items: rows.slice(0, size), hasMore: rows.length > size };
}
async function ownedTicket(client: SupabaseClient, accountId: string, ticketId: string, scope: SupportScope) {
  if (!portalUuid(ticketId)) throw new SupportFailure('invalid');
  const result = await client.from('support_tickets').select(TICKET_COLUMNS).eq('id', ticketId).eq('user_id', accountId).abortSignal(scope.signal).maybeSingle(); current(scope);
  if (result.error) throw new SupportFailure('unavailable'); if (!result.data) throw new SupportFailure('missing');
  const row = ticket(result.data, accountId); if (row.id !== ticketId) throw new SupportFailure('unavailable'); return row;
}
export async function readSupportTickets(client: SupabaseClient, accountId: string, page: number, scope: SupportScope) {
  const [start, end] = pageBounds(page, TICKET_PAGE_SIZE); await owner(client, accountId, scope);
  const result = await client.from('support_tickets').select(TICKET_COLUMNS).eq('user_id', accountId).order('created_at', { ascending: false }).order('id', { ascending: false }).range(start, end).abortSignal(scope.signal); current(scope);
  if (result.error) throw new SupportFailure('unavailable'); return pageRows(result.data, TICKET_PAGE_SIZE, row => ticket(row, accountId));
}
export async function readSupportThread(client: SupabaseClient, accountId: string, ticketId: string, page: number, scope: SupportScope) {
  const [start, end] = pageBounds(page, REPLY_PAGE_SIZE); await owner(client, accountId, scope);
  const selected = await ownedTicket(client, accountId, ticketId, scope);
  const result = await client.from('ticket_replies').select(REPLY_COLUMNS).eq('ticket_id', ticketId).order('created_at', { ascending: false }).order('id', { ascending: false }).range(start, end).abortSignal(scope.signal); current(scope);
  if (result.error) throw new SupportFailure('unavailable');
  const replies = pageRows(result.data, REPLY_PAGE_SIZE, row => reply(row, accountId, ticketId));
  return { ticket: selected, ...replies, items: replies.items.reverse() };
}
export async function saveSupportReply(client: SupabaseClient, accountId: string, ticketId: string, message: string, scope: SupportScope) {
  const normalized = message.trim(); if (!normalized || normalized.length > 4000) throw new SupportFailure('invalid');
  await owner(client, accountId, scope); await ownedTicket(client, accountId, ticketId, scope); current(scope);
  let result;
  try {
    result = await client.from('ticket_replies').insert({ ticket_id: ticketId, user_id: accountId, message: normalized, is_staff: false }).select(REPLY_COLUMNS).abortSignal(scope.signal).retry(false).maybeSingle();
  } catch { throw new SupportFailure('uncertain'); }
  current(scope);
  if (result.error || !result.data) throw new SupportFailure('uncertain');
  let saved; try { saved = reply(result.data, accountId, ticketId); } catch { throw new SupportFailure('uncertain'); }
  if (saved.staff || saved.owner !== accountId || saved.message !== normalized) throw new SupportFailure('uncertain');
  return saved;
}

export const SUPPORT_CATEGORIES = ['Technical Issue', 'Billing', 'Account', 'Streaming', 'Content', 'Other'] as const;
export type NewSupportTicket = { subject: string; description: string; category: string; priority: string };
export async function createSupportTicket(client: SupabaseClient, accountId: string, input: NewSupportTicket, scope: SupportScope) {
  const subject = input.subject.trim(), description = input.description.trim();
  if (!subject || subject.length > 200 || !description || description.length > 12000 || !SUPPORT_CATEGORIES.some(value => value === input.category) || !['low', 'normal', 'high'].includes(input.priority)) throw new SupportFailure('invalid');
  await owner(client, accountId, scope); current(scope);
  let result;
  try {
    result = await client.from('support_tickets').insert({ user_id: accountId, subject, description, category: input.category, priority: input.priority, status: 'open' }).select(TICKET_COLUMNS).abortSignal(scope.signal).retry(false).maybeSingle();
  } catch { throw new SupportFailure('uncertain'); }
  current(scope);
  if (result.error || !result.data) throw new SupportFailure('uncertain');
  let saved; try { saved = ticket(result.data, accountId); } catch { throw new SupportFailure('uncertain'); }
  if (saved.subject !== subject || saved.description !== description || saved.category !== input.category || saved.priority !== input.priority || saved.status !== 'open') throw new SupportFailure('uncertain');
  return saved;
}

export const DASHBOARD_TICKET_COLUMNS = 'id,user_id,subject,status,priority,created_at';
export async function readDashboardTickets(client: SupabaseClient, accountId: string, scope: SupportScope) {
  await owner(client, accountId, scope);
  const [recent, active] = await Promise.all([
    client.from('support_tickets').select(DASHBOARD_TICKET_COLUMNS).eq('user_id', accountId).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(5).abortSignal(scope.signal),
    client.from('support_tickets').select('id', { count: 'exact', head: true }).eq('user_id', accountId).not('status', 'ilike', 'closed').not('status', 'ilike', 'resolved').abortSignal(scope.signal),
  ]);
  current(scope);
  if (recent.error || active.error || !Array.isArray(recent.data) || recent.data.length > 5 || !Number.isSafeInteger(active.count) || active.count! < 0) throw new SupportFailure('unavailable');
  const tickets = recent.data.map(value => {
    const row = record(value); if (!portalUuid(row.id) || row.user_id !== accountId) throw new SupportFailure('unavailable');
    return { id: row.id as string, subject: text(row.subject, 2000), status: text(row.status, 100), priority: text(row.priority, 100), createdAt: date(row.created_at) };
  });
  if (new Set(tickets.map(row => row.id)).size !== tickets.length) throw new SupportFailure('unavailable');
  return { tickets, activeCount: active.count as number };
}
