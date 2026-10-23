import type { SupabaseClient } from '@supabase/supabase-js';

export type CustomerFilter = 'all' | 'active' | 'due3' | 'due7' | 'due30' | 'unpaid' | 'overdue';
export type CustomerSort = 'name' | 'renewal' | 'panel';
export type CustomerListState = { search: string; filter: CustomerFilter; sort: CustomerSort; page: number };

export function customerListState(value: unknown): CustomerListState {
  const v = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    search: typeof v.search === 'string' ? v.search.slice(0, 200) : '',
    filter: typeof v.filter === 'string' && ['all', 'active', 'due3', 'due7', 'due30', 'unpaid', 'overdue'].includes(v.filter) ? v.filter as CustomerFilter : 'all',
    sort: typeof v.sort === 'string' && ['name', 'renewal', 'panel'].includes(v.sort) ? v.sort as CustomerSort : 'name',
    page: typeof v.page === 'number' && Number.isSafeInteger(v.page) && v.page > 0 ? Math.min(v.page, 100000) : 1,
  };
}

export function customerPage<T>(rows: readonly T[], requested: number, size: number) {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const page = Math.min(pages, Math.max(1, Number.isSafeInteger(requested) ? requested : 1));
  const start = (page - 1) * size;
  return { rows: rows.slice(start, start + size), page, pages, start: rows.length ? start + 1 : 0, end: Math.min(start + size, rows.length) };
}

// The directory, search and existing totals must include every database page.
// Stable UUID keysets avoid the default 1,000-row cap and offset duplicates.
export async function loadCrmCustomers<T extends { id: string }>(client: SupabaseClient): Promise<{ data: T[] | null; error: { message: string } | null }> {
  const rows: T[] = [];
  let after: string | undefined;
  try {
    for (;;) {
      let query = client.from('iptv_customers').select('*').order('id', { ascending: true }).limit(200);
      if (after) query = query.gt('id', after);
      const result = await query;
      if (result.error || !Array.isArray(result.data) || result.data.length > 200) throw Error('read_failed');
      let previous = after;
      for (const row of result.data) {
        if (typeof row?.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(row.id)
          || (previous && row.id <= previous)) throw Error('invalid_page');
        previous = row.id;
      }
      rows.push(...result.data as T[]);
      if (result.data.length < 200) return { data: rows, error: null };
      after = previous;
    }
  } catch {
    return { data: null, error: { message: 'Customer records could not be loaded completely. Refresh to try again.' } };
  }
}
