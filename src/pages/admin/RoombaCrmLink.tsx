import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Link2, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Setup {
  status: 'linked' | 'unlinked' | 'conflict' | 'needs_review';
  username?: string; lineId?: string; packageName?: string; duration?: string; connections?: number;
  expiresAt?: string; recordedAt?: string; customerId?: string | null; linkedAt?: string | null;
  access?: 'expired' | 'within_trial_period';
}
interface Props { onLinked: () => Promise<void>; onShowCustomer: (username: string) => void }

const RoombaCrmLink: React.FC<Props> = ({ onLinked, onShowCustomer }) => {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [creationEnabled, setCreationEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const running = useRef(false);
  useEffect(() => () => { const pending = controller.current; controller.current = null; pending?.abort(); }, []);

  const check = async (link = false) => {
    if (running.current) return;
    if (link && (!setup?.username || !window.confirm(`Add the verified trial ${setup.username}, Roomba line ${setup.lineId}, to the CRM? This records the existing trial only; it does not create or renew service or record a payment.`))) return;
    running.current = true; setBusy(true); setError(null);
    const pending = new AbortController(); controller.current = pending;
    const timeout = window.setTimeout(() => pending.abort(), 20000);
    try {
      const { data, error: authError } = await supabase.auth.getSession();
      if (authError || !data.session?.access_token) throw new Error('Please sign in again to your admin account.');
      const response = await fetch('/api/ks-roomba-crm', {
        method: link ? 'POST' : 'GET', cache: 'no-store', signal: pending.signal,
        headers: { Authorization: `Bearer ${data.session.access_token}`, Accept: 'application/json', ...(link ? { 'Content-Type': 'application/json' } : {}) },
        ...(link ? { body: JSON.stringify({ confirmed: true }) } : {}),
      });
      const payload = await response.json().catch(() => null);
      if (pending.signal.aborted || controller.current !== pending) return;
      if (!response.ok) throw new Error(payload?.error || 'Saved setup could not be checked.');
      if (!payload || !Object.prototype.hasOwnProperty.call(payload, 'setup') || typeof payload.trialCreationEnabled !== 'boolean'
        || (payload.setup && !['linked', 'unlinked', 'conflict', 'needs_review'].includes(payload.setup.status))) throw new Error('The setup result could not be verified.');
      setSetup(payload.setup); setCreationEnabled(payload.trialCreationEnabled); setChecked(true);
      if (link) await onLinked();
    } catch (failure) {
      if (controller.current === pending) setError(pending.signal.aborted
        ? 'The check was interrupted. Check saved setup again; a repeated CRM link will not duplicate the customer.'
        : failure instanceof Error ? failure.message : 'Saved setup could not be checked.');
    } finally {
      window.clearTimeout(timeout); running.current = false;
      if (controller.current === pending) { controller.current = null; setBusy(false); }
    }
  };
  const buttonStyle = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:opacity-60';
  return (
    <section className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/25 to-gray-900 p-4 sm:p-6" aria-labelledby="saved-roomba-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-400">Private Preview</p><h2 id="saved-roomba-title" className="mt-2 flex items-center gap-2 text-xl font-semibold text-white"><Link2 className="h-5 w-5 text-red-400" aria-hidden="true" />Saved Roomba setup</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">Connect the verified trial to its CRM customer record. Checking here reads the saved result without contacting Roomba.</p></div>
        <button type="button" disabled={busy} onClick={() => void check()} className={`${buttonStyle} shrink-0 border border-gray-600 bg-gray-800 text-white hover:border-red-400`}>{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}Check saved setup</button>
      </div>
      <div role="status" aria-live="polite">{busy && <p className="mt-4 text-sm text-gray-300">Checking the saved setup...</p>}{checked && !setup && <p className="mt-4 text-sm text-gray-300">No saved trial was found.</p>}</div>
      {error && <p role="alert" className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">{error}</p>}
      {setup && ['linked', 'unlinked'].includes(setup.status) && <div className="mt-5 rounded-2xl border border-white/10 bg-gray-950/60 p-4 sm:p-5">
        <p className={`flex items-center gap-2 font-semibold ${setup.status === 'linked' ? 'text-emerald-300' : 'text-amber-200'}`}><CheckCircle2 className="h-5 w-5" aria-hidden="true" />{setup.status === 'linked' ? 'Trial linked to CRM' : 'Verified trial ready to link'}</p>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">{[
          ['Streaming username', setup.username], ['Roomba line ID', setup.lineId], ['Package', `${setup.packageName} · ${setup.duration}`],
          ['Expires', setup.expiresAt ? new Date(setup.expiresAt).toLocaleString() : 'Unknown'], ['Connections', String(setup.connections)],
          ['Setup status', setup.access === 'expired' ? 'Created · trial period ended' : 'Created · within trial period'],
        ].map(([label, value]) => <div key={label}><dt className="text-gray-400">{label}</dt><dd className="mt-1 break-words font-medium text-white">{value}</dd></div>)}</dl>
        <p className="mt-5 text-xs leading-5 text-gray-400">Provider result recorded {setup.recordedAt ? new Date(setup.recordedAt).toLocaleString() : 'at an unknown time'}. This is a saved setup result, not a live online-status check. Passwords are not copied into the CRM.</p>
        {setup.status === 'linked' ? <button type="button" onClick={() => setup.username && onShowCustomer(setup.username)} className={`${buttonStyle} mt-4 bg-red-600 text-white hover:bg-red-500`}>Show customer record</button>
          : <button type="button" disabled={busy} onClick={() => void check(true)} className={`${buttonStyle} mt-4 bg-red-600 text-white hover:bg-red-500`}>Add verified trial to CRM</button>}
      </div>}
      {setup?.status === 'conflict' && <p role="alert" className="mt-4 text-sm leading-6 text-amber-200">The linked customer identity changed. Review the CRM record before continuing; nothing will be overwritten.</p>}
      {setup?.status === 'needs_review' && <p role="alert" className="mt-4 text-sm leading-6 text-amber-200">The provider attempt needs review. It cannot be added as a verified customer.</p>}
      {creationEnabled !== null && <p className="mt-4 text-xs text-gray-400">Trial creation is {creationEnabled ? 'enabled in this Preview deployment' : 'disabled'}. CRM linking does not change that setting.</p>}
    </section>
  );
};

export default RoombaCrmLink;
