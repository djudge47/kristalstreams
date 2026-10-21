import React, { useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LineStatus {
  customerId: string; lineId: string; username: string; checkedAt: string; expiresAt: string;
  connectionsAllowed: number; trial: boolean; enabled: boolean; adminEnabled: boolean;
  access: 'expired' | 'disabled' | 'within_service_period';
}
interface Props { customerId: string; panelId: number; username: string }
interface RenewalReview {
  status: 'manual_review' | 'review_ready'; executionEnabled: false; sent: false; checkedAt: string;
  packageName: string | null; durationMonths: number | null; estimatedCredits: number | null;
  creditsAvailable: number | null; blockers: string[];
  channelGroups: { status: 'match' | 'different' | 'unverified'; lineCount: number | null;
    packageCount: number | null; lineOnly: number[]; packageOnly: number[] };
}

const RoombaCustomerStatus: React.FC<Props> = ({ customerId, panelId, username }) => {
  const [line, setLine] = useState<LineStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renewal, setRenewal] = useState<RenewalReview | null>(null);
  const [checkingRenewal, setCheckingRenewal] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    setLine(null); setRenewal(null); setError(null); setBusy(false);
    return () => { const request = controller.current; controller.current = null; request?.abort(); };
  }, [customerId, panelId, username]);

  const check = async (review = false) => {
    if (controller.current) return;
    const request = new AbortController(); controller.current = request;
    setBusy(true); setCheckingRenewal(review); setError(null); setLine(null); setRenewal(null);
    const timeout = window.setTimeout(() => request.abort(), review ? 55000 : 45000);
    try {
      const { data, error: authError } = await supabase.auth.getSession();
      if (authError || !data.session?.access_token) throw new Error('Please sign in again to your admin account.');
      const endpoint = review ? '/api/ks-roomba-crm?view=customer-renewal&customerId=' : '/api/ks-roomba-crm?view=customer-status&customerId=';
      const response = await fetch(`${endpoint}${encodeURIComponent(customerId)}`, {
        method: 'GET', cache: 'no-store', signal: request.signal,
        headers: { Authorization: `Bearer ${data.session.access_token}`, Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => null);
      if (controller.current !== request || request.signal.aborted) return;
      if (!response.ok) throw new Error(payload?.error || 'XUI status could not be checked.');
      const result = payload?.line;
      if (payload?.mode !== 'read-only' || payload.databaseWrites !== false || result?.customerId !== customerId
        || result.lineId !== String(panelId) || result.username !== username || !Number.isFinite(Date.parse(result.checkedAt))
        || !Number.isFinite(Date.parse(result.expiresAt)) || !Number.isInteger(result.connectionsAllowed)
        || ![result.trial, result.enabled, result.adminEnabled].every(value => typeof value === 'boolean')
        || !['expired', 'disabled', 'within_service_period'].includes(result.access)) throw new Error('The matching XUI status could not be verified.');
      if (review) {
        const r = payload.renewal;
        const g = r?.channelGroups;
        if (!r || !['manual_review', 'review_ready'].includes(r.status) || r.executionEnabled !== false || r.sent !== false
          || !Number.isFinite(Date.parse(r.checkedAt)) || (r.packageName !== null && typeof r.packageName !== 'string')
          || (r.durationMonths !== null && ![1, 3, 6, 12].includes(r.durationMonths))
          || ![r.estimatedCredits, r.creditsAvailable].every(value => value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0))
          || !Array.isArray(r.blockers) || r.blockers.length > 10 || !r.blockers.every((value: unknown) => typeof value === 'string' && value.length <= 200)
          || !g || !['match', 'different', 'unverified'].includes(g.status)
          || ![g.lineCount, g.packageCount].every(value => value === null || (Number.isInteger(value) && value >= 1 && value <= 2000))
          || ![g.lineOnly, g.packageOnly].every(value => Array.isArray(value) && value.length <= 2000
            && value.every(id => Number.isSafeInteger(id) && id > 0 && id <= 2147483647))
          || (r.status === 'review_ready' && (r.blockers.length !== 0 || !r.packageName || !r.durationMonths || !r.estimatedCredits || r.creditsAvailable === null))) {
          throw new Error('The renewal review could not be verified.');
        }
        setRenewal(r);
      }
      setLine(result);
    } catch (failure) {
      if (controller.current === request) setError(request.signal.aborted ? 'The status check timed out. Try again shortly.'
        : failure instanceof Error ? failure.message : 'XUI status could not be checked.');
    } finally {
      window.clearTimeout(timeout);
      if (controller.current === request) { controller.current = null; setBusy(false); }
    }
  };
  const expired = line && Date.parse(line.expiresAt) <= Date.now();
  return <div className="border-t border-gray-800 px-4 py-3">
    <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => void check()}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-cyan-500/30 px-3 py-2 text-xs font-semibold text-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-50">
      {busy && !checkingRenewal ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
      {busy && !checkingRenewal ? 'Checking XUI…' : 'Check XUI status'}
    </button><button type="button" disabled={busy} onClick={() => void check(true)}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-amber-500/30 px-3 py-2 text-xs font-semibold text-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300 disabled:opacity-50">
      {busy && checkingRenewal && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {busy && checkingRenewal ? 'Reviewing renewal…' : 'Review renewal'}
    </button></div>
    <div aria-live="polite" role="status">{line && <div className="mt-3 space-y-1 text-xs leading-5 text-gray-300">
      <p className="font-semibold text-cyan-300">{expired ? 'Expired' : line.access === 'disabled' ? 'Disabled' : 'Enabled · within service period'}{line.trial ? ' · Trial' : ''}</p>
      <p>Provider expires: {new Date(line.expiresAt).toLocaleString()}</p>
      <p>Connections allowed: {line.connectionsAllowed} · Line {line.enabled ? 'enabled' : 'disabled'} · Provider {line.adminEnabled ? 'enabled' : 'disabled'}</p>
      <p className="text-gray-400">Checked {new Date(line.checkedAt).toLocaleString()}. This does not confirm playback or whether the customer is online.</p>
    </div>}</div>
    {renewal && <section className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5" aria-label="Renewal review">
      <h3 className="font-semibold text-amber-200">{renewal.status === 'review_ready' ? 'Current package reviewed' : 'Renewal needs manual review'}</h3>
      <dl className="mt-2 space-y-1 text-gray-300">
        <div><dt className="inline text-gray-400">Current package: </dt><dd className="inline">{renewal.packageName || 'Needs review'}</dd></div>
        <div><dt className="inline text-gray-400">Renewal term: </dt><dd className="inline">{renewal.durationMonths ? `${renewal.durationMonths} calendar month${renewal.durationMonths === 1 ? '' : 's'}` : 'Needs review'}</dd></div>
        <div><dt className="inline text-gray-400">Estimated provider cost: </dt><dd className="inline">{renewal.estimatedCredits === null ? 'Unknown' : `${renewal.estimatedCredits} credits`}</dd></div>
        <div><dt className="inline text-gray-400">Reseller balance at check: </dt><dd className="inline">{renewal.creditsAvailable === null ? 'Unknown' : `${renewal.creditsAvailable} credits`}</dd></div>
      </dl>
      {renewal.blockers.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-4 text-amber-200">{renewal.blockers.map(reason => <li key={reason}>{reason}</li>)}</ul>}
      <div className="mt-3 border-t border-amber-500/20 pt-2 text-gray-300">
        <p className="font-semibold">Channel group comparison</p>
        <p>Groups on this line: {renewal.channelGroups.lineCount ?? 'Unverified'} · Groups in current package: {renewal.channelGroups.packageCount ?? 'Unverified'}</p>
        {renewal.channelGroups.status === 'different' ? <>
          <p>Only on this line: {renewal.channelGroups.lineOnly.length} · Only in current package: {renewal.channelGroups.packageOnly.length}</p>
          <details className="mt-2"><summary className="cursor-pointer text-amber-200">View differing group IDs</summary>
            <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg bg-gray-950/50 p-2">
              <p>Only on this line: <code className="break-all">{renewal.channelGroups.lineOnly.join(', ') || 'None'}</code></p>
              <p>Only in current package: <code className="break-all">{renewal.channelGroups.packageOnly.join(', ') || 'None'}</code></p>
              <p className="text-gray-400">These IDs identify provider channel groups. Their names and contents have not been verified.</p>
            </div>
          </details>
        </> : <p>{renewal.channelGroups.status === 'match' ? 'The channel selections match.' : 'The channel selections could not be fully verified.'}</p>}
      </div>
      <p className="mt-2 text-gray-400">Reviewed {new Date(renewal.checkedAt).toLocaleString()}. Same package only; a new expiration date must come from XUI after an approved renewal. Submission is not enabled, and this review spends no credits or charges the customer.</p>
    </section>}
    {error && <p role="alert" className="mt-3 text-xs leading-5 text-amber-200">{error}</p>}
  </div>;
};

export default RoombaCustomerStatus;
