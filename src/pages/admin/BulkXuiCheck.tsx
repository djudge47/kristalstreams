import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { bulkCustomerSnapshot, runBulkXuiCheck } from '../../../_shared/ks-crm-bulk-check.js';
import type { BulkCustomer, BulkProgress } from '../../../_shared/ks-crm-bulk-check.js';

const display = (name: string, value: string | number | boolean | null) => {
  if (value === null || value === undefined || value === '') return 'Not verified';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (name === 'Expiration' && typeof value === 'string') return new Date(value).toLocaleString('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', timeZoneName: 'short',
  });
  return String(value);
};

const BulkXuiCheck: React.FC<{ customers: BulkCustomer[]; loading: boolean }> = ({ customers, loading }) => {
  const selection = useMemo(() => {
    try { const accounts = bulkCustomerSnapshot(customers); return { accounts, key: JSON.stringify(accounts), error: '' }; }
    catch { return { accounts: [], key: '', error: customers.length ? 'Review duplicate or incomplete Panel IDs and usernames before checking.' : 'Load your CRM accounts before checking.' }; }
  }, [customers]);
  const [progress, setProgress] = useState<BulkProgress | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const active = useRef<AbortController | null>(null);
  useEffect(() => {
    active.current?.abort(); active.current = null;
    setProgress(null); setRunning(false); setError('');
    return () => { active.current?.abort(); active.current = null; };
  }, [selection.key, loading]);

  const start = async () => {
    if (active.current || loading || !selection.accounts.length) return;
    const controller = new AbortController(); active.current = controller;
    setRunning(true); setProgress(null); setError('');
    try {
      await runBulkXuiCheck({ customers: selection.accounts, signal: controller.signal,
        getToken: async () => {
          const { data, error: authError } = await supabase.auth.getSession();
          return authError ? null : data.session?.access_token ?? null;
        },
        onProgress: next => { if (active.current === controller) { setProgress(next); if (next.error) setError(next.error); } },
      });
    } catch { if (active.current === controller) setError('The comparison could not finish. Completed results are shown below.'); }
    finally { if (active.current === controller) { active.current = null; setRunning(false); } }
  };
  const rows = progress?.rows ?? [];
  const matched = rows.filter(row => row.status === 'match').length;
  const review = rows.filter(row => row.status === 'review').length;
  const failed = rows.filter(row => row.status === 'failed').length;
  return <section className="rounded-2xl border border-cyan-500/25 bg-gray-900 p-5 sm:p-6" aria-labelledby="bulk-xui-title">
    <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">XUI comparison · Private Preview</p>
        <h2 id="bulk-xui-title" className="mt-2 text-xl font-bold text-white">Check all saved accounts</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">Compare packages, connection limits, expiration dates and service status with XUI. This checks the {customers.length} accounts already in your CRM; it does not discover additional XUI accounts.</p>
        <p className="mt-2 text-sm text-cyan-200">Results are for review. No CRM records, payments or XUI services are changed, and no credits are spent.</p>
        <p className="mt-2 text-xs text-gray-400">Checks run about 30 seconds apart. Allow roughly {Math.max(1, Math.ceil(customers.length / 2))} minutes and keep this tab open. Results clear if you refresh the page.</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button type="button" onClick={() => void start()} disabled={running || loading || !selection.accounts.length}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-50">
          {running ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
          {running ? 'Checking accounts…' : 'Check all XUI accounts'}
        </button>
        {running && <button type="button" onClick={() => active.current?.abort()} className="min-h-12 rounded-xl border border-gray-600 px-4 py-3 text-sm font-semibold text-gray-200">Stop check</button>}
      </div>
    </div>
    {!loading && selection.error && <p className="mt-4 text-sm text-amber-200">{selection.error}</p>}
    {error && <p role="alert" className="mt-4 rounded-lg border border-amber-500/30 p-3 text-sm text-amber-200">{error}</p>}
    {progress && <div role="status" aria-live="polite" className="mt-5 text-sm text-gray-200">
      <p>{progress.state === 'complete' ? 'Comparison finished' : progress.state === 'stopped' ? 'Comparison stopped' : 'Comparison in progress'} · {progress.completed} of {progress.total} accounts checked.</p>
      {running && <p className="mt-1 text-xs text-gray-400">{progress.state === 'waiting' ? `Waiting before checking ${progress.username}.` : `Checking ${progress.username}…`}</p>}
      {rows.length > 0 && <p className="mt-2">{matched} match · {review} need review · {failed} could not be verified</p>}
    </div>}
    {rows.length > 0 && <div className="mt-4 max-h-[36rem] space-y-2 overflow-y-auto">{rows.map(row => <details key={row.customerId} className="rounded-xl border border-gray-700 bg-gray-950/70 p-3">
      <summary className="cursor-pointer text-sm text-white"><span className="font-semibold">{row.username}</span><span className="ml-2 text-gray-400">Panel {row.panelId}</span><span className={`ml-3 ${row.status === 'match' ? 'text-green-300' : 'text-amber-200'}`}>{row.status === 'match' ? 'Matches' : row.status === 'review' ? 'Needs review' : 'Could not verify'}</span></summary>
      {row.checkedAt && <p className="mt-3 text-xs text-gray-400">Checked {display('Expiration', row.checkedAt)}</p>}
      {row.error && <p className="mt-3 text-sm text-amber-200">{row.error}</p>}
      {row.fields.length > 0 && <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><caption className="sr-only">Saved CRM and verified XUI details for {row.username}</caption>
        <thead><tr className="text-gray-400"><th scope="col" className="p-2">Detail</th><th scope="col" className="p-2">Saved CRM</th><th scope="col" className="p-2">XUI</th><th scope="col" className="p-2">Comparison</th></tr></thead>
        <tbody>{row.fields.map(field => <tr key={field.name} className="border-t border-gray-800 text-gray-200"><th scope="row" className="p-2 font-medium">{field.name}</th><td className="p-2">{display(field.name, field.saved)}</td><td className="p-2">{display(field.name, field.provider)}</td><td className={`p-2 ${field.status === 'match' ? 'text-green-300' : 'text-amber-200'}`}>{field.status === 'match' ? 'Match' : field.status === 'different' ? 'Different' : 'Not verified'}</td></tr>)}</tbody>
      </table></div>}
    </details>)}</div>}
  </section>;
};
export default BulkXuiCheck;
