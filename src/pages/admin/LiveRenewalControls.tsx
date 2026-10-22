import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Props { customerId: string; panelId: number; username: string; hasSourceReview?: boolean }
interface Review {
  token: string; operationId: string; consentId: string; expiresAt: string; customerId: string;
  username: string; lineId: string; months: number; connections: number; currentGroupIds: number[];
  previousExpiresAt: string; costUnits: string; balanceUnits: string;
}
const uuid = (value: unknown): value is string => typeof value === 'string'
  && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);
const valid = (r: Review, customerId: string) => r?.customerId === customerId && uuid(r.operationId) && uuid(r.consentId)
  && typeof r.token === 'string' && r.token.length <= 1100 && Number.isFinite(Date.parse(r.expiresAt))
  && /^[1-9]\d{0,14}$/.test(r.lineId) && /^[A-Za-z0-9_.-]{3,64}$/.test(r.username)
  && [1,3,6,12].includes(r.months) && Number.isInteger(r.connections) && r.connections >= 1 && r.connections <= 5
  && Number.isFinite(Date.parse(r.previousExpiresAt)) && typeof r.costUnits === 'string' && /^[1-9]\d{0,12}$/.test(r.costUnits)
  && typeof r.balanceUnits === 'string' && /^\d{1,13}$/.test(r.balanceUnits) && BigInt(r.balanceUnits) >= BigInt(r.costUnits)
  && Array.isArray(r.currentGroupIds) && r.currentGroupIds.length > 0 && r.currentGroupIds.length <= 2000
  && r.currentGroupIds.every((v, i, a) => Number.isSafeInteger(v) && v > 0 && v <= 2147483647 && (i === 0 || v > a[i - 1]));
const credits = (units: string) => (Number(units) / 1000000).toLocaleString(undefined, { maximumFractionDigits: 6 });
const messages: Record<string,string> = {
  disabled: 'Live renewal is off.',
  unavailable: 'Live renewal is not ready. Installation and connection checks are still required.',
  ready_for_review: 'Renewal controls are enabled. Prepare a fresh review to check XUI.',
  review_required: 'The reviewed details changed or expired. Check this same attempt before loading another review.',
  check_status: 'The result is uncertain. Check this same attempt before starting another renewal.',
  reconciliation_required: 'This renewal needs reconciliation. It will not be sent again automatically.',
  reserved: 'This attempt is saved and needs reconciliation. Do not start another renewal.',
  dispatching: 'A dispatch decision is saved. Check this same attempt; do not send another renewal.',
  provider_verified: 'The provider result is verified. Only the CRM update remains.',
  crm_pending: 'The CRM update is pending. Check this attempt to finish without sending another renewal.',
  complete: 'Renewal verified and CRM expiration saved. This does not confirm playback.',
  not_found: 'No saved attempt was found. Keep this reference until its status can be resolved.',
};
const buttonClass = 'min-h-11 rounded-lg border border-cyan-500/30 px-3 py-2 text-xs font-semibold text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-50';

export default function LiveRenewalControls({ customerId, panelId, username, hasSourceReview = false }: Props) {
  const [ready, setReady] = useState(false), [review, setReview] = useState<Review | null>(null);
  const [pending, setPending] = useState(false), [preserve, setPreserve] = useState(false), [spend, setSpend] = useState(false);
  const [busy, setBusy] = useState(false), [state, setState] = useState(''), [error, setError] = useState('');
  const [canClear, setCanClear] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const key = `ks-live-renewal:v1:${customerId}`;
  useEffect(() => {
    setReady(false); setReview(null); setPending(false); setPreserve(false); setSpend(false); setState(''); setError(''); setCanClear(false);
    try { const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (saved && valid(saved, customerId)) { setReview(saved); setPending(true); setState('check_status'); }
    } catch { /* no new provider action on unavailable storage */ }
    return () => { requestRef.current?.abort(); requestRef.current = null; };
  }, [key, customerId, panelId, username]);
  useEffect(() => {
    if (!review || pending) return;
    const expire = () => { setReady(false); setPreserve(false); setSpend(false); setState('review_required'); };
    const remaining = Date.parse(review.expiresAt) - Date.now();
    if (remaining <= 0) { expire(); return; }
    const timer = window.setTimeout(expire, Math.min(remaining + 1, 300001));
    return () => window.clearTimeout(timer);
  }, [review, pending]);
  const send = async (view: string, body?: object) => {
    const request = new AbortController(); requestRef.current = request;
    const timer = window.setTimeout(() => request.abort(), 55000);
    try {
      const { data, error: authError } = await supabase.auth.getSession();
      if (authError || !data.session?.access_token) throw Error('Please sign in again to your admin account.');
      const response = await fetch(`/api/ks-roomba-crm?view=${view}${body ? '' : `&customerId=${encodeURIComponent(customerId)}`}`, {
        method: body ? 'POST' : 'GET', cache: 'no-store', signal: request.signal,
        headers: { Authorization: `Bearer ${data.session.access_token}`, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const payload = await response.json().catch(() => null);
      if (requestRef.current !== request || request.signal.aborted) throw Error('The response was interrupted. Check the saved attempt.');
      if (!response.ok) throw Error(payload?.error || 'The renewal status could not be checked.');
      if (payload?.mode !== 'live-renewal' || payload.mayDispatch !== false || typeof payload.state !== 'string') throw Error('The renewal response could not be verified.');
      return payload;
    } finally { window.clearTimeout(timer); if (requestRef.current === request) requestRef.current = null; }
  };
  const run = async (action: 'readiness' | 'review' | 'execute' | 'status') => {
    if (requestRef.current) return;
    setBusy(true); setError('');
    try {
      if (action === 'readiness') {
        const result = await send('renewal-live-readiness');
        if (!['ready_for_review','disabled','unavailable'].includes(result.state) || result.ready !== (result.state === 'ready_for_review')) throw Error('Readiness could not be verified.');
        setReady(result.ready); setState(result.state); return;
      }
      if (action === 'review') {
        if (!ready || !hasSourceReview || pending || !preserve || !spend) return;
        const result = await send('renewal-live-review', { customerId, preserveCurrentSelectionConfirmed: true, creditSpendConfirmed: true });
        if (result.state !== 'review_ready') { setState(result.state); setReady(false); return; }
        if (!valid(result.review, customerId) || result.review.lineId !== String(panelId) || result.review.username !== username
          || Date.parse(result.review.expiresAt) <= Date.now()) throw Error('The matching fresh renewal review could not be verified.');
        setReview(result.review); setState('review_ready'); setPreserve(false); setSpend(false); return;
      }
      if (!review) return;
      if (action === 'execute') {
        if (!preserve || !spend || (!pending && Date.parse(review.expiresAt) <= Date.now())) return;
        // Persist the original signed attempt BEFORE any execute request. A tab
        // reload restores status controls rather than creating a new attempt.
        sessionStorage.setItem(key, JSON.stringify(review)); setPending(true);
        const result = await send('renewal-live-execute', { customerId, token: review.token,
          preserveCurrentSelectionConfirmed: true, creditSpendConfirmed: true });
        if (!Object.hasOwn(messages, result.state) || (result.operationId !== undefined && result.operationId !== review.operationId)) throw Error('The saved renewal result could not be verified.');
        setState(result.state);
        if (result.state === 'complete') { sessionStorage.removeItem(key); setPending(false); setReview(null); setReady(false); }
      } else {
        const result = await send('renewal-live-status', { customerId, token: review.token });
        if (!['reserved','dispatching','provider_verified','reconciliation_required','complete','not_found'].includes(result.state)
          || result.operationId !== review.operationId || typeof result.canStartNewReview !== 'boolean') throw Error('The saved attempt status could not be verified.');
        setState(result.state); setCanClear(result.state === 'not_found' && result.canStartNewReview);
        if (result.state === 'complete') { sessionStorage.removeItem(key); setPending(false); setReview(null); setReady(false); }
      }
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'The renewal result is uncertain. Check this same attempt.'); }
    finally { setBusy(false); }
  };
  return <section className="mt-3 space-y-2 rounded-xl border border-gray-700 p-3" aria-label="Protected live renewal">
    <p className="text-xs font-semibold text-white">Protected live renewal</p>
    {!pending && <button type="button" className={buttonClass} disabled={busy || review !== null} onClick={() => void run('readiness')}>Check renewal readiness</button>}
    {state && state !== 'review_ready' && <p role="status" className="text-xs text-cyan-200">{messages[state]}</p>}
    {review && <div className="space-y-1 text-xs text-gray-300">
      <p>{review.username} · Line {review.lineId} · {review.months} calendar months · {review.connections} connection(s)</p>
      <p>Cost: {credits(review.costUnits)} provider credits · Balance at review: {credits(review.balanceUnits)} credits</p>
      <p>Current expiration: {new Date(review.previousExpiresAt).toLocaleString()}</p>
      <details><summary>Channel groups to preserve ({review.currentGroupIds.length})</summary><code className="break-words">{review.currentGroupIds.join(', ')}</code></details>
      <p>Reference: <code>{review.operationId}</code></p>
    </div>}
    {ready && !pending && !review && !hasSourceReview && <p className="text-xs text-gray-300">Select Review renewal above to inspect the customer, term and credit cost first.</p>}
    {((ready && !pending && (hasSourceReview || review !== null)) || (pending && ['provider_verified','crm_pending','not_found'].includes(state))) && <>
      <label className="flex min-h-11 items-center gap-2 text-xs text-gray-200"><input type="checkbox" checked={preserve} disabled={busy} onChange={e => setPreserve(e.target.checked)} />I confirm the same package, connections and current channel selection.</label>
      <label className="flex min-h-11 items-center gap-2 text-xs text-gray-200"><input type="checkbox" checked={spend} disabled={busy} onChange={e => setSpend(e.target.checked)} />{review ? `I authorize this one renewal at ${credits(review.costUnits)} provider credits.` : 'I have checked the renewal term and provider credit cost shown above.'}</label>
      <button type="button" className={buttonClass} disabled={busy || !preserve || !spend}
        onClick={() => void run(review ? 'execute' : 'review')}>{review ? pending && state !== 'not_found' ? 'Finish CRM update' : 'Confirm and send this renewal once' : 'Prepare fresh live renewal review'}</button>
    </>}
    {pending && <button type="button" className={buttonClass} disabled={busy} onClick={() => void run('status')}>Check this renewal attempt</button>}
    {!pending && review && state === 'review_required' && <button type="button" className={buttonClass} disabled={busy}
      onClick={() => { setReview(null); setReady(false); setState(''); }}>Close expired review</button>}
    {pending && canClear && <button type="button" className={buttonClass} disabled={busy} onClick={() => {
      sessionStorage.removeItem(key); setPending(false); setReview(null); setReady(false); setCanClear(false); setState('');
    }}>Close expired attempt with no saved record</button>}
    {busy && <p role="status" className="text-xs text-gray-400">Checking renewal…</p>}
    {error && <p role="alert" className="text-xs text-amber-200">{error}</p>}
  </section>;
}
