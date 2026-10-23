import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, UserRound } from 'lucide-react';
import type { CustomerListState } from '../lib/crm-directory';

export type CustomerDirectoryRow = {
  id: string; name: string; username: string; panelId: number;
  status: string; renewal: string; badge: string; badgeClass: string;
};

export function CustomerPager({ page, pages, start, end, total, onChange }: {
  page: number; pages: number; start: number; end: number; total: number; onChange: (page: number) => void;
}) {
  return <nav aria-label="Customer list pages" className="mt-4 border-t border-gray-700 pt-4">
    <p role="status" className="mb-3 text-center text-sm text-gray-400">{start}–{end} of {total} customers · Page {page} of {pages}</p>
    <div className="grid grid-cols-2 gap-3">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gray-600 bg-gray-900 px-3 font-semibold text-gray-200 disabled:opacity-40"><ChevronLeft className="h-4 w-4" aria-hidden="true" />Previous</button>
      <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gray-600 bg-gray-900 px-3 font-semibold text-gray-200 disabled:opacity-40">Next<ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
    </div>
  </nav>;
}

export default function CrmCustomerDirectory({ rows, listState }: { rows: CustomerDirectoryRow[]; listState: CustomerListState }) {
  return <ul aria-label="Customer directory" className="mt-4 space-y-3">
    {rows.map(row => <li key={row.id}>
      <Link to={`/admin/crm/customer/${encodeURIComponent(row.id)}`} state={{ crmList: listState }} aria-label={`Open ${row.name}, Panel ID ${row.panelId}`} className="flex min-h-20 items-center gap-3 rounded-2xl border border-gray-700 bg-gray-950/70 p-3 text-left transition-colors hover:border-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-300"><UserRound className="h-5 w-5" aria-hidden="true" /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-white">{row.name}</span>
          <span className="mt-1 block truncate text-xs text-gray-400">{row.username} · ID {row.panelId}</span>
          <span className="mt-2 flex flex-wrap items-center gap-2 text-xs"><span className={`rounded-full px-2 py-1 font-semibold ${row.badgeClass}`}>{row.badge}</span><span className="text-gray-400">{row.status} · {row.renewal}</span></span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />
      </Link>
    </li>)}
  </ul>;
}
