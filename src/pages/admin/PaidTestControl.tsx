import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCreditUnits, type PaidReviewExpected } from '../../../_shared/ks-paid-review-response.js';
import { parsePaidTestControl, type PaidTestControl as Control } from '../../../_shared/ks-paid-test-control.js';

const labels: Record<Control['state'], string> = {
  disabled: 'The one-credit test is not enabled. This control cannot activate service yet.',
  not_started: 'This order is approved for a bounded test. Prepare a fresh final review before any creation.',
  reserved: 'A saved reservation exists. A fresh approval is required before its one allowed creation.',
  processing: 'The saved attempt is processing or needs reconciliation. Do not create another line; check status later.',
  completion_pending: 'The provider result is saved. Complete the saved CRM and login setup below; this does not create another line.',
  complete: 'The test streaming login and CRM setup are saved. The customer can check their dashboard for the login.',
  reconciliation_required: 'The provider outcome needs manual reconciliation. Another creation is blocked. Do not pay again.',
  review_ready: 'Review the real credit cost, confirm this is a new streaming customer, then approve one creation.',
};
const PaidTestControl: React.FC<PaidReviewExpected> = expected => {
  const [control, setControl] = useState<Control | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [attested, setAttested] = useState(false), [confirmation, setConfirmation] = useState('');
  const request = useRef<AbortController | null>(null), owner = useRef<string | null>(null);
  const clearApproval = useCallback(() => { setAttested(false); setConfirmation(''); setControl(value => value?.state === 'review_ready' ? null : value); }, []);
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (owner.current && owner.current !== session?.user.id) {
        request.current?.abort(); request.current = null; owner.current = null; setControl(null); setError(''); setBusy(false); setAttested(false); setConfirmation('');
      }
    });
    const hidden = () => { if (document.hidden) clearApproval(); };
    document.addEventListener('visibilitychange', hidden);
    return () => { subscription.unsubscribe(); document.removeEventListener('visibilitychange', hidden); request.current?.abort(); request.current = null; };
  }, [clearApproval]);
  useEffect(() => {
    if (!control?.expiresAt) return;
    const timeout = window.setTimeout(() => { clearApproval(); setError('The final review expired. Check status and prepare it again.'); }, Math.max(0, Date.parse(control.expiresAt) - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [control?.expiresAt, clearApproval]);

  const send = async (action: 'status' | 'prepare' | 'execute' | 'complete') => {
    if (request.current) return;
    const approval = control;
    if (action === 'execute' && (!approval?.canExecute || !approval.approvalToken || !approval.expiresAt || Date.parse(approval.expiresAt) <= Date.now() || !attested || confirmation !== 'SPEND 1 CREDIT')) return;
    const controller = new AbortController(); request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), action === 'execute' || action === 'complete' ? 270000 : 55000);
    setBusy(true); setError(''); clearApproval();
    setProgress(action === 'execute' ? 'Creating the approved test line...' : action === 'complete' ? 'Completing saved setup...' : action === 'prepare' ? 'Checking payment and credits...' : 'Checking the saved status...');
    try {
      const { data, error: authError } = await supabase.auth.getSession();
      if (controller.signal.aborted || request.current !== controller) return;
      if (authError || !data.session?.access_token) throw new Error('Please sign in again to your administrator account.');
      owner.current = data.session.user.id;
      const status = action === 'status';
      const response = await fetch(`/api/ks-preview-paid-orders?view=paid-test-control${status ? `&sessionId=${encodeURIComponent(expected.reference)}` : ''}`, {
        method: status ? 'GET' : 'POST', cache: 'no-store', signal: controller.signal,
        headers: { Authorization: `Bearer ${data.session.access_token}`, Accept: 'application/json', ...(!status ? { 'Content-Type': 'application/json' } : {}) },
        ...(!status ? { body: JSON.stringify({ action, sessionId: expected.reference,
          ...(action === 'execute' ? { approvalToken: approval?.approvalToken, newCustomerConfirmed: true, confirmation, creditUnits: '1000000' } : {}) }) } : {}),
      });
      const payload = await response.json().catch(() => null);
      if (controller.signal.aborted || request.current !== controller) return;
      if (!response.ok) throw new Error(payload?.error || 'The test result needs a status check. Do not create another line or pay again.');
      if (action === 'prepare' && document.hidden) return;
      setControl(parsePaidTestControl(payload, expected, owner.current));
    } catch (failure) {
      if (request.current === controller) {
        setControl(null);
        setError(controller.signal.aborted ? 'The request ended without a confirmed result. Use Check activation status; do not submit another creation or payment.' : failure instanceof Error ? failure.message : 'Check the saved activation status before any further action.');
      }
    } finally { window.clearTimeout(timeout); if (request.current === controller) { request.current = null; setBusy(false); } }
  };
  return <div className="mt-5 border-t border-white/10 pt-4">
    <h5 className="font-semibold text-white">One-credit activation control</h5>
    <p className="mt-2 text-xs leading-5 text-gray-400">Only a separately approved Bronze test order can be enabled. Creating its Roomba line would spend one real credit; Stripe remains in test mode.</p>
    <button type="button" onClick={() => void send('status')} disabled={busy} className="mt-3 min-h-12 w-full rounded-xl border border-gray-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{progress}</span> : 'Check activation status'}</button>
    {error && <p role="alert" className="mt-3 rounded-xl border border-amber-400/20 p-3 text-sm text-amber-200">{error}</p>}
    {control && <p role="status" className="mt-3 text-sm leading-6 text-gray-300">{labels[control.state]}</p>}
    {control?.canPrepare && <button type="button" disabled={busy} onClick={() => void send('prepare')} className="mt-3 min-h-12 w-full rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 font-semibold text-amber-200 disabled:opacity-50">Prepare final approval</button>}
    {control?.state === 'review_ready' && control.review && <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/5 p-4">
      <p className="break-all font-semibold text-white">{control.review.customerEmail}</p>
      <p className="mt-2 text-sm text-gray-300">One provider month · One connection</p>
      <p className="mt-2 text-sm text-amber-200">Real cost: {formatCreditUnits(control.review.creditCostUnits)} credit. Balance: {formatCreditUnits(control.review.balanceUnits)} → {formatCreditUnits(control.review.projectedBalanceUnits || '0')}.</p>
      <p className="mt-2 text-xs leading-5 text-gray-400">This approval expires after two minutes. The credit balance is checked again before creation. The earlier trial stays intact. No new Stripe payment or customer message is sent by this action.</p>
      <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-gray-200"><input type="checkbox" checked={attested} onChange={event => setAttested(event.target.checked)} className="mt-1 h-5 w-5 shrink-0" />I confirm this is a new streaming customer with no existing Roomba line. Create a separate test line; do not convert or replace existing service.</label>
      <label className="mt-4 block text-sm text-gray-300">Type <strong className="text-white">SPEND 1 CREDIT</strong> to approve<input value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" spellCheck={false} className="mt-2 min-h-12 w-full rounded-lg border border-gray-600 bg-gray-950 px-3 py-2 text-white" /></label>
      <button type="button" disabled={busy || !attested || confirmation !== 'SPEND 1 CREDIT'} onClick={() => void send('execute')} className="mt-4 min-h-12 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Create one-month test line — spend 1 credit</button>
    </div>}
    {control?.canComplete && <button type="button" disabled={busy} onClick={() => void send('complete')} className="mt-3 min-h-12 w-full rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 font-semibold text-emerald-200 disabled:opacity-50">Complete saved setup — no new line</button>}
  </div>;
};
export default PaidTestControl;
