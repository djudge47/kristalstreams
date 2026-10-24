import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import type { SetupInput } from '../../../_shared/ks-roomba-setup.js';

interface TrialResult { lineId: string; username: string; expiresAt: string; connections: number; trial: boolean }
interface TrialReview {
  enabled: boolean;
  approvalToken: string;
  expiresAt: string;
  summary: { packageId: string; packageName: string; username: string; duration: string; credits: number; connections: number; channelGroups: number; reseller: string };
}
interface Attempt { state: 'submitting' | 'succeeded' | 'unknown'; result: TrialResult | null }
interface Props { input: SetupInput; onBusy: (value: boolean) => void; onCreated: (value: boolean) => void }

const TrialActivation: React.FC<Props> = ({ input, onBusy, onCreated }) => {
  const [review, setReview] = useState<TrialReview | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [createdHere, setCreatedHere] = useState(false);
  const running = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const confirmation = useRef<HTMLDivElement | null>(null);
  useEffect(() => () => { const request = controller.current; controller.current = null; request?.abort(); }, []);
  useEffect(() => {
    if (!review) return;
    confirmation.current?.focus();
    const timer = window.setTimeout(() => setExpired(true), Math.max(0, Date.parse(review.expiresAt) - Date.now()));
    return () => window.clearTimeout(timer);
  }, [review]);

  const request = async (operation: 'review' | 'create' | 'status') => {
    if (running.current) return;
    if (operation === 'create' && (!review?.enabled || !confirmed || expired || attempt)) return;
    running.current = true;
    setBusy(true); onBusy(true); setError(null); setNotice(null);
    const abort = new AbortController();
    controller.current = abort;
    const timeout = window.setTimeout(() => abort.abort(), 55000);
    try {
      const { data, error: authError } = await supabase.auth.getSession();
      if (authError || !data.session?.access_token) throw new Error('Please sign in again to your admin account.');
      const response = await fetch('/api/ks-roomba-trial', {
        method: operation === 'status' ? 'GET' : 'POST', cache: 'no-store', signal: abort.signal,
        headers: { Accept: 'application/json', Authorization: `Bearer ${data.session.access_token}`, ...(operation === 'status' ? {} : { 'Content-Type': 'application/json' }) },
        ...(operation === 'status' ? {} : { body: JSON.stringify({ operation, input, ...(operation === 'create' ? { approvalToken: review?.approvalToken, confirmed: true } : {}) }) }),
      });
      const payload = await response.json().catch(() => null);
      if (controller.current !== abort || abort.signal.aborted) return;
      if (!response.ok) {
        if (operation === 'create' || response.status === 409) { setReview(null); setConfirmed(false); }
        throw new Error(payload?.error || 'The trial request could not be checked. Use Check saved trial status before continuing.');
      }
      if (operation === 'status') {
        if (!payload || typeof payload.enabled !== 'boolean' || !Object.prototype.hasOwnProperty.call(payload, 'attempt')) throw new Error('Saved status could not be verified.');
        setAttempt(payload.attempt); setReview(null); setConfirmed(false);
        setCreatedHere(false); onCreated(payload.attempt?.state === 'succeeded');
        if (!payload.attempt) setNotice('No trial attempt is saved. You can check the trial details for review.');
      } else if (operation === 'review') {
        if (payload?.status !== 'review_ready' || typeof payload.approvalToken !== 'string' || !Number.isFinite(Date.parse(payload.expiresAt)) || !payload.summary) throw new Error('Trial details could not be verified.');
        setReview(payload); setConfirmed(false); setExpired(false); setAttempt(null);
      } else {
        if (payload?.status !== 'created' || !payload.result?.lineId) throw new Error('The result needs review. Check saved trial status before continuing.');
        setAttempt({ state: 'succeeded', result: payload.result }); setReview(null); setConfirmed(false);
        setCreatedHere(true); onCreated(true);
      }
    } catch (failure) {
      if (controller.current === abort) {
        if (operation === 'create') { setReview(null); setConfirmed(false); }
        setError(abort.signal.aborted
          ? operation === 'create' ? 'The response was interrupted. Do not create again. Check saved trial status and review the reseller panel.' : 'The check took too long. Please try the check again.'
          : failure instanceof Error ? failure.message : 'The trial request could not be checked.');
      }
    } finally {
      window.clearTimeout(timeout); running.current = false;
      if (controller.current === abort) { controller.current = null; setBusy(false); onBusy(false); }
    }
  };

  const buttonStyle = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:opacity-50';
  return (
    <section className="mt-7 border-t border-white/10 pt-6" aria-labelledby="trial-action-title">
      <h3 id="trial-action-title" className="flex items-center gap-2 text-lg font-semibold text-white"><ShieldCheck className="h-5 w-5 text-red-400" aria-hidden="true" />Controlled trial activation</h3>
      <p className="mt-2 text-sm leading-6 text-gray-300">The first test is limited to the 36-hour Trial package, one connection and zero reseller credits. Check the current details before reviewing the final action.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button type="button" disabled={busy || !!attempt} onClick={() => request('review')} className={`${buttonStyle} bg-red-600 text-white hover:bg-red-500`}>{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Check trial details</button>
        <button type="button" disabled={busy} onClick={() => request('status')} className={`${buttonStyle} border border-gray-600 text-gray-200 hover:border-red-400`}>Check saved trial status</button>
      </div>
      <div role="status" aria-live="polite">{busy && <p className="mt-4 text-sm text-gray-300">Checking the trial request. Please keep this page open.</p>}{notice && <p className="mt-4 text-sm text-gray-300">{notice}</p>}</div>
      {error && <p role="alert" className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">{error}</p>}
      {attempt && <div role="status" className="mt-5 rounded-2xl border border-white/10 bg-gray-950/50 p-5">
        {attempt.state === 'succeeded' && attempt.result ? <>
          <h4 className="flex items-center gap-2 font-semibold text-emerald-300"><CheckCircle2 className="h-5 w-5" aria-hidden="true" />Trial created and recorded</h4>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">{[['Line ID', attempt.result.lineId], ['Streaming username', attempt.result.username], ['Expires', new Date(attempt.result.expiresAt).toLocaleString()], ['Connections', String(attempt.result.connections)]].map(([label, value]) => <div key={label}><dt className="text-gray-400">{label}</dt><dd className="mt-1 break-words text-white">{value}</dd></div>)}</dl>
          <p className="mt-4 text-sm leading-6 text-gray-300">{createdHere ? 'Use the proposed password above for your app test.' : 'Saved status does not recover the password. Review the existing line in the Roomba reseller panel.'} No second trial will be created from this page.</p>
          <Link to="/admin/crm" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500">Open CRM setup record</Link>
        </> : <><h4 className="font-semibold text-amber-200">Saved request needs review</h4><p className="mt-2 text-sm leading-6 text-gray-300">A request is already recorded. Further creation is locked. Check the Roomba reseller panel before doing anything else.</p></>}
      </div>}
      {review && <div ref={confirmation} tabIndex={-1} className="mt-5 rounded-2xl border border-red-400/30 bg-gray-950/60 p-5 outline-none focus-visible:ring-2 focus-visible:ring-red-400">
        <h4 className="text-lg font-semibold text-white">Final trial review</h4>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">{[['Reseller', review.summary.reseller], ['Package', `${review.summary.packageName} (ID ${review.summary.packageId})`], ['Username', review.summary.username], ['Duration', review.summary.duration], ['Cost', `${review.summary.credits} reseller credits`], ['Connections', String(review.summary.connections)], ['Channel groups', String(review.summary.channelGroups)]].map(([label, value]) => <div key={label}><dt className="text-gray-400">{label}</dt><dd className="mt-1 break-words font-semibold text-white">{value}</dd></div>)}</dl>
        {!review.enabled ? <p role="status" className="mt-5 rounded-xl bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">Ready for review. Trial creation is disabled pending your approval. Nothing has been sent for creation.</p> : <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-gray-200"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} disabled={busy || expired} className="mt-1 h-5 w-5 shrink-0 accent-red-600" />I approve creating this one 36-hour trial in Roomba with the details shown above.</label>}
        {expired && <p role="status" className="mt-3 text-sm text-amber-200">This review expired. Check trial details again.</p>}
        <button type="button" disabled={!review.enabled || !confirmed || expired || busy} onClick={() => request('create')} className={`${buttonStyle} mt-5 w-full bg-red-600 text-white hover:bg-red-500 sm:w-auto`}>Create this trial</button>
      </div>}
    </section>
  );
};

export default TrialActivation;
