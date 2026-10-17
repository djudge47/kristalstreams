import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ClipboardList, Download, Eye, EyeOff, KeyRound, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { buildSetupDraft, type RoombaPackage, type SetupDraft, type SetupInput } from '../../../_shared/ks-roomba-setup.js';
import TrialActivation from './TrialActivation';
import { buildPackageSummary } from '../../../_shared/ks-roomba-package-summary.js';

const fieldStyle = 'mt-2 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-red-400 focus:ring-2 focus:ring-red-400/20';
const initialInput: SetupInput = { packageId: '', mode: 'trial', username: '', password: '', connections: 1, notes: '' };

const PrepareSetup: React.FC = () => {
  const [packages, setPackages] = useState<RoombaPackage[] | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [input, setInput] = useState<SetupInput>(initialInput);
  const [draft, setDraft] = useState<SetupDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [trialBusy, setTrialBusy] = useState(false);
  const [trialCreated, setTrialCreated] = useState(false);
  const [summaryMessage, setSummaryMessage] = useState('');
  const controller = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const review = useRef<HTMLDivElement | null>(null);
  const selected = packages?.find(item => item.id === input.packageId);
  const selectedAccess = selected?.[input.mode];

  useEffect(() => () => { const request = controller.current; controller.current = null; request?.abort(); }, []);
  useEffect(() => {
    if (!cooldown) return;
    const timeout = window.setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timeout);
  }, [cooldown]);
  useEffect(() => { if (draft) review.current?.focus(); }, [draft]);

  const update = (patch: Partial<SetupInput>) => {
    setInput(previous => ({ ...previous, ...patch }));
    setDraft(null);
    setTrialCreated(false);
    setError(null);
  };

  const loadPackages = async () => {
    if (busy.current || cooldown || trialBusy) return;
    busy.current = true;
    const request = new AbortController();
    controller.current = request;
    const timeout = window.setTimeout(() => request.abort(), 25000);
    setLoading(true);
    setSummaryMessage('');
    setError(null);
    setDraft(null);
    setPackages(null);
    setCheckedAt(null);
    setInput(previous => ({ ...previous, packageId: '' }));
    try {
      const { data, error: authError } = await supabase.auth.getSession();
      if (authError || !data.session?.access_token) throw new Error('Please sign in again to your admin account.');
      const response = await fetch('/api/ks-roomba-packages', {
        method: 'GET', cache: 'no-store', signal: request.signal,
        headers: { Accept: 'application/json', Authorization: `Bearer ${data.session.access_token}` },
      });
      const payload = await response.json().catch(() => null);
      if (request.signal.aborted || controller.current !== request) return;
      if (!response.ok) {
        setCooldown(Math.min(60, Math.max(0, Number(payload?.retryAfterSeconds) || 0)));
        throw new Error(payload?.error || 'Packages could not be loaded. Please try again.');
      }
      if (payload?.status !== 'packages_ready' || !Array.isArray(payload.packages) || !Number.isFinite(Date.parse(payload.checkedAt))) {
        throw new Error('The package list could not be verified.');
      }
      setPackages(payload.packages as RoombaPackage[]);
      setCheckedAt(payload.checkedAt);
      setCooldown(Math.max(1, Math.ceil((60000 - Math.max(0, Date.now() - Date.parse(payload.checkedAt))) / 1000)));
    } catch (failure) {
      if (controller.current === request) setError(request.signal.aborted ? 'The package check took too long. Please try again.' : failure instanceof Error ? failure.message : 'Packages could not be loaded.');
    } finally {
      window.clearTimeout(timeout);
      busy.current = false;
      if (controller.current === request) { controller.current = null; setLoading(false); }
    }
  };

  const downloadPackageSummary = () => {
    setSummaryMessage('');
    try {
      const summary = buildPackageSummary(packages || [], checkedAt || '');
      const blob = new Blob([JSON.stringify(summary, null, 2) + '\n'], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      try {
        link.href = url;
        link.download = `KristalStreams-Roomba-Packages-${new Date(summary.checkedAt).toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        setSummaryMessage('Package summary downloaded. You can attach this JSON file for plan matching.');
      } finally {
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch {
      setSummaryMessage('The summary could not be downloaded. Reload packages and try again.');
    }
  };

  const generatePassword = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    const bytes = crypto.getRandomValues(new Uint8Array(20));
    update({ password: Array.from(bytes, value => alphabet[value & 63]).join('') });
  };

  const prepare = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setTrialCreated(false);
    try { setDraft(buildSetupDraft(input, packages || [])); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'The setup draft could not be prepared.'); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <Link to="/admin/roomba" className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Roomba connection</Link>
      <section className="rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-950/70 via-gray-900 to-gray-950 p-5 shadow-2xl shadow-black/30 sm:p-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-red-300"><ShieldCheck className="h-4 w-4" aria-hidden="true" />Private admin · Preview</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Prepare customer setup</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300 sm:text-base">Choose a provider package and review the customer details. Preparing this draft does not activate service or spend reseller credits.</p>
      </section>

      <section className="rounded-3xl border border-gray-700 bg-gray-800/60 p-5 sm:p-7" aria-labelledby="packages-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 id="packages-title" className="text-xl font-semibold text-white">1. Load your available packages</h2><p className="mt-2 text-sm leading-6 text-gray-400">Use the packages and settings returned for your Roomba account.</p></div>
          <button type="button" onClick={loadPackages} disabled={loading || cooldown > 0 || trialBusy} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}{loading ? 'Loading packages...' : cooldown ? `Refresh in ${cooldown}s` : packages ? 'Refresh packages' : 'Load packages'}
          </button>
        </div>
        {checkedAt && <p className="mt-4 text-xs text-gray-400">Package details checked {new Date(checkedAt).toLocaleString()}</p>}
        {packages && packages.length > 0 && checkedAt && <div className="mt-5 border-t border-white/10 pt-5">
          <button type="button" onClick={downloadPackageSummary} disabled={loading || trialBusy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gray-600 px-4 py-3 text-sm font-semibold text-gray-200 hover:border-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:opacity-60"><Download className="h-4 w-4" aria-hidden="true" />Download package summary</button>
          <p className="mt-2 text-xs leading-5 text-gray-400">Review all package IDs, durations, credit costs, connection limits and channel groups in one file. This uses the loaded list and includes no customer logins, passwords or API keys.</p>
        </div>}
        <p role="status" aria-live="polite" className="mt-3 text-sm text-gray-300">{summaryMessage}</p>
        {packages?.length === 0 && <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">Roomba returned no packages for this account.</p>}
      </section>
      <div role="status" aria-live="polite" className="sr-only">{loading ? 'Loading available Roomba packages.' : packages ? `${packages.length} packages loaded.` : 'Packages have not been loaded.'}</div>
      {error && <div role="alert" className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6 text-amber-200">{error}</div>}

      {packages && packages.length > 0 && (
        <form onSubmit={prepare} autoComplete="off" className="space-y-6 rounded-3xl border border-gray-700 bg-gray-800/60 p-5 sm:p-7">
          <fieldset disabled={trialBusy} className="space-y-6">
          <h2 className="text-xl font-semibold text-white">2. Enter the setup details</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-300">Provider package
              <select value={input.packageId} required className={fieldStyle} onChange={event => {
                const item = packages.find(value => value.id === event.target.value);
                update({ packageId: event.target.value, mode: item?.[input.mode] ? input.mode : item?.trial ? 'trial' : 'paid', connections: 1 });
              }}><option value="">Choose a package</option>{packages.map(item => <option key={item.id} value={item.id}>{item.name}{item.issues.length ? ' — details incomplete' : ''}</option>)}</select>
            </label>
            <label className="text-sm font-medium text-gray-300">Access type
              <select value={input.mode} disabled={!selected} className={fieldStyle} onChange={event => update({ mode: event.target.value as SetupInput['mode'] })}><option value="trial" disabled={!selected?.trial}>Trial</option><option value="paid" disabled={!selected?.paid}>Paid</option></select>
            </label>
          </div>
          {selected && selected.issues.length > 0 && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200"><p className="font-semibold">This package needs more provider information</p><ul className="mt-2 list-disc pl-5">{selected.issues.map(issue => <li key={issue}>{issue}</li>)}</ul></div>}
          {selectedAccess && <div className="grid gap-3 rounded-2xl border border-white/10 bg-gray-950/40 p-4 text-sm sm:grid-cols-3"><p className="text-gray-400">Duration <span className="ml-2 font-semibold text-white">{selectedAccess.count} {selectedAccess.unit}</span></p><p className="text-gray-400">Provider cost <span className="ml-2 font-semibold text-white">{selectedAccess.credits} credits</span></p><p className="text-gray-400">Package limit <span className="ml-2 font-semibold text-white">{selected?.maxConnections ?? 'Unknown'} connections</span></p></div>}
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-300">Customer streaming username
              <input value={input.username} onChange={event => update({ username: event.target.value })} required minLength={3} maxLength={64} autoComplete="off" spellCheck={false} placeholder="Choose a streaming username" className={fieldStyle} />
              <span className="mt-2 block text-xs font-normal leading-5 text-gray-400">A proposed streaming login. Availability has not been checked with Roomba.</span>
            </label>
            <label className="text-sm font-medium text-gray-300">Connections
              <select value={input.connections} disabled={!selected?.maxConnections} className={fieldStyle} onChange={event => update({ connections: Number(event.target.value) })}>{Array.from({ length: selected?.maxConnections || 1 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select>
            </label>
          </div>
          <div>
            <label htmlFor="setup-password" className="text-sm font-medium text-gray-300">Proposed streaming password</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1"><input id="setup-password" value={input.password} onChange={event => update({ password: event.target.value })} type={showPassword ? 'text' : 'password'} required minLength={12} maxLength={128} autoComplete="new-password" className={`${fieldStyle} mt-0 pr-14`} /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide proposed password' : 'Show proposed password'} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-gray-400 hover:text-white">{showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}</button></div>
              <button type="button" onClick={generatePassword} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gray-600 px-4 py-3 text-sm font-semibold text-gray-200 hover:border-red-400"><KeyRound className="h-4 w-4" aria-hidden="true" />Generate password</button>
            </div>
            <p className="mt-2 text-xs leading-5 text-gray-400">Credentials stay in this page’s memory. Leaving or reloading the page clears the draft.</p>
          </div>
          <label className="block text-sm font-medium text-gray-300">Reseller notes <span className="font-normal text-gray-400">(optional)</span><textarea value={input.notes} onChange={event => update({ notes: event.target.value })} maxLength={1000} rows={3} className={fieldStyle} placeholder="Notes for this proposed setup" /></label>
          <button type="submit" disabled={!selected || selected.issues.length > 0 || !selectedAccess || loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"><ClipboardList className="h-5 w-5" aria-hidden="true" />Review setup draft</button>
          </fieldset>
        </form>
      )}

      {draft && (
        <div ref={review} tabIndex={-1} className="rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-5 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:p-7" aria-labelledby="draft-title">
          <div className="flex items-start gap-3"><CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-emerald-400" aria-hidden="true" /><div><h2 id="draft-title" className="text-xl font-semibold text-white">{trialCreated ? '3. Trial setup details' : '3. Setup draft ready for review'}</h2><p className="mt-2 text-sm leading-6 text-emerald-200">{trialCreated ? 'The saved trial result is shown below.' : 'Draft prepared. No creation request is sent until the final trial action is confirmed.'}</p></div></div>
          <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
            {[
              ['Package', `${draft.packageName} (ID ${draft.packageId})`], ['Access type', draft.accessType === 'trial' ? 'Trial' : 'Paid'],
              ['Duration', draft.duration], ['Proposed credit cost', `${draft.estimatedCredits} reseller credits`],
              ['Streaming username', draft.fields.username], ['Connections', draft.fields.max_connections],
              ['Included channel groups', `${draft.fields['bouquets_selected[]'].length} groups from the selected package`], ['Password', showPassword ? draft.fields.password : 'Hidden — use Show proposed password above'],
            ].map(([label, value]) => <div key={label}><dt className="text-gray-400">{label}</dt><dd className="mt-1 break-words font-semibold text-white">{value}</dd></div>)}
          </dl>
          {draft.fields.reseller_notes && <div className="mt-5 text-sm"><p className="text-gray-400">Reseller notes</p><p className="mt-1 whitespace-pre-wrap break-words text-gray-200">{draft.fields.reseller_notes}</p></div>}
          <details className="mt-6 rounded-xl border border-white/10 bg-gray-950/40 p-4 text-xs leading-6 text-gray-400"><summary className="cursor-pointer font-medium text-gray-300">Included channel group IDs</summary><p className="mt-2 break-words">{draft.fields['bouquets_selected[]'].join(', ')}</p></details>
          {draft.accessType === 'trial' && draft.packageId === '1' && <TrialActivation input={input} onBusy={setTrialBusy} onCreated={setTrialCreated} />}
        </div>
      )}
    </div>
  );
};

export default PrepareSetup;
