import React, { useEffect, useRef, useState } from 'react';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { parsePaidActivationReview, formatCreditUnits, paidReviewBlockers, type PaidActivationReview as Review, type PaidReviewExpected } from '../../../_shared/ks-paid-review-response.js';

const PaidActivationReview: React.FC<PaidReviewExpected> = ({ reference, customerId, tier, connections, interval, amountCents }) => {
  const [review, setReview] = useState<Review | null>(null), [loading, setLoading] = useState(false), [error, setError] = useState('');
  const request = useRef<AbortController | null>(null), owner = useRef<string | null>(null);
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if ((owner.current || request.current) && session?.user.id !== owner.current) {
        request.current?.abort(); request.current = null; owner.current = null; setReview(null); setError(''); setLoading(false);
      }
    });
    return () => { subscription.unsubscribe(); request.current?.abort(); request.current = null; };
  }, []);
  const check = async () => {
    if (request.current) return;
    const controller = new AbortController(); request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 55000);
    setLoading(true); setError(''); setReview(null);
    try {
      const { data, error: authError } = await supabase.auth.getSession();
      if (controller.signal.aborted || request.current !== controller) return;
      if (authError || !data.session?.access_token) throw new Error('Please sign in again to your administrator account.');
      owner.current = data.session.user.id;
      const response = await fetch(`/api/ks-preview-paid-orders?view=activation-review&sessionId=${encodeURIComponent(reference)}`, {
        cache: 'no-store', signal: controller.signal, headers: { Authorization: `Bearer ${data.session.access_token}`, Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => null);
      if (controller.signal.aborted || request.current !== controller) return;
      if (!response.ok) throw new Error(payload?.error || 'The paid test review is unavailable.');
      setReview(parsePaidActivationReview(payload?.review, { reference, customerId, tier, connections, interval, amountCents }, owner.current));
    } catch (failure) { if (request.current === controller) setError(controller.signal.aborted ? 'The review took too long. Nothing was activated. Try again.' : failure instanceof Error ? failure.message : 'The paid test review is unavailable.'); }
    finally { window.clearTimeout(timeout); if (request.current === controller) { request.current = null; setLoading(false); } }
  };
  return <div className="mt-5 border-t border-white/10 pt-4">
    <button type="button" onClick={check} disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-60">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ClipboardCheck className="h-4 w-4" aria-hidden="true" />}{loading ? 'Verifying payment and package...' : 'Review paid activation'}
    </button>
    {error && <p role="alert" className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm leading-6 text-amber-200">{error}</p>}
    {review && <div role="status" className="mt-4 rounded-xl border border-amber-400/20 bg-gray-900 p-4 text-sm leading-6 text-gray-300">
      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Private Preview · Review only</p>
      <h4 className="mt-2 text-lg font-semibold text-white">{review.status === 'blocked' ? 'New-customer test needs attention' : 'Paid test details verified for review'}</h4>
      <p className="mt-3 break-all"><span className="text-gray-500">Test customer: </span>{review.customerEmail}</p>
      <p className="mt-1">{review.providerMonths} provider month{review.providerMonths > 1 ? 's' : ''} · {review.connections} connection{review.connections > 1 ? 's' : ''}</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 p-3"><dt className="text-xs text-gray-500">Real credit cost</dt><dd className="mt-1 font-semibold text-amber-200">{formatCreditUnits(review.creditCostUnits)}</dd></div>
        <div className="rounded-lg border border-white/10 p-3"><dt className="text-xs text-gray-500">Current balance</dt><dd className="mt-1 font-semibold text-white">{formatCreditUnits(review.balanceUnits)}</dd></div>
        <div className="rounded-lg border border-white/10 p-3"><dt className="text-xs text-gray-500">Balance after one creation</dt><dd className="mt-1 font-semibold text-white">{review.projectedBalanceUnits === null ? 'Insufficient credits' : formatCreditUnits(review.projectedBalanceUnits)}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-gray-400">The Stripe payment is a test. A future paid activation would spend real Roomba credits. The balance shown is an estimate, not a reservation.</p>
      {review.blockers.length > 0 && <ul className="mt-4 list-disc space-y-2 pl-5 text-amber-200">{review.blockers.map(reason => <li key={reason}>{paidReviewBlockers[reason]}</li>)}</ul>}
      <p className="mt-4 font-semibold text-amber-200">Activation is disabled. No spending approval has been recorded.</p>
      <p className="mt-2 text-gray-400">This review did not reserve an attempt, create or modify a line, change a customer, or send a message.</p>
      <p className="mt-3 text-xs text-gray-500">Checked {new Date(review.checkedAt).toLocaleString()}. Payment, customer and provider details must be rechecked before any separately approved activation.</p>
    </div>}
  </div>;
};
export default PaidActivationReview;
