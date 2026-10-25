import {paymentDateLabel,adminPaymentMethod,comparePaymentOrder} from '../../../_shared/ks-admin-payment-history.js';
import { paymentMethodLabel } from '../../../_shared/ks-crm-renewal-payment.js';
import { isReceivedPayment, loadCrmPayments, receivedPaymentDateTime, type CrmPaymentSummary } from '../../../_shared/ks-crm-payment-summary.js';
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CalendarDays, CreditCard, DollarSign, ExternalLink, RefreshCw, Sparkles, TrendingUp, Users, Wifi } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { billingRenewalAt, customerPaymentLabel, displayedAccountStatus, isBillingExcluded, isLegacyPaidCustomer, isUnpaidCustomer, isBillingOverdue, isDueWithin } from '../../../_shared/ks-crm-status.js';

type Customer = {
  id: string;
  customer_name: string | null;
  username: string;
  package_name: string | null;
  monthly_price: number | null;
  payment_status: string | null;
  renewal_at: string | null;
  expiration_at: string | null;
  source: string;
  account_status: string;
  online: boolean;
  trial: boolean;
  xui_line_url: string | null;
};

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set';

const CRMPremiumOverview: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<CrmPaymentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    setPaymentError(null);
    try {
      const [customerResult, paymentResult] = await Promise.all([
        supabase.from('iptv_customers').select('id,customer_name,username,package_name,monthly_price,payment_status,renewal_at,expiration_at,source,account_status,online,trial,xui_line_url').order('renewal_at', { ascending: true, nullsFirst: false }),
        loadCrmPayments(supabase,{website:true}),
      ]);
      if (customerResult.error) setError(customerResult.error.message);
      else setCustomers((customerResult.data || []) as Customer[]);
      setPayments(paymentResult.data || []);
      if (paymentResult.error) setPaymentError(paymentResult.error.message);
    } catch {
      setError('Operations data could not be loaded. Refresh to try again.');
      setPayments([]);
      setPaymentError('Payment details could not be loaded. Refresh to try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const receivedPayments = useMemo(() => payments.filter(isReceivedPayment)
    .sort(comparePaymentOrder)
    .slice(0, 8), [payments]);

  const stats = useMemo(() => {
    const now = Date.now();
    const active = customers.filter((c) => displayedAccountStatus(c, now) === 'active');
    const due = customers.filter((c) => isDueWithin(c, 7, now));
    const overdue = customers.filter((c) => isBillingOverdue(c, now));
    return {
      total: customers.length,
      active: active.length,
      trials: customers.filter((c) => c.trial).length,
      unpaid: customers.filter(isUnpaidCustomer).length,
      due: due.length,
      overdue: overdue.length,
      mrr: active.filter((c) => !isBillingExcluded(c) && !isLegacyPaidCustomer(c)).reduce((sum, c) => sum + Number(c.monthly_price || 0), 0),
    };
  }, [customers]);

  const priority = useMemo(() => customers.filter((c) => isUnpaidCustomer(c) || isBillingOverdue(c) || isDueWithin(c, 7)).slice(0, 8), [customers]);

  const maxPlan = Math.max(1, ...customers.map((c) => Number(c.monthly_price || 0)));
  const metrics: [string, string | number, React.ElementType][] = [
          ['MRR', money(stats.mrr), DollarSign], ['Customers', stats.total, Users], ['Active service', stats.active, TrendingUp], ['Online now', '—', Wifi], ['Due 7 Days', stats.due, CalendarDays], ['Unpaid', stats.unpaid, CreditCard], ['Overdue', stats.overdue, AlertTriangle],
        ];

  return (
    <div className="space-y-6 pb-10">
      <section className="overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-950/70 via-gray-900 to-gray-950 p-5 shadow-2xl shadow-black/30 sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-300"><Sparkles className="h-3.5 w-3.5" /> Premium operations</div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Kristal Streams Command Center</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-300 sm:text-base">Review saved customer service, recorded payments, renewals, payments, trials, and priority account actions.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button onClick={load} disabled={loading} className="inline-flex items-center justify-center rounded-xl border border-gray-700 bg-gray-900/80 px-4 py-2.5 text-sm font-semibold text-gray-200 disabled:cursor-not-allowed disabled:opacity-50"><RefreshCw className="mr-2 h-4 w-4" />Refresh</button>
            <Link to="/admin/crm" className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-950/40">Manage customers<ArrowRight className="ml-2 h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        {metrics.map(([label, value, Icon]) => { const I = Icon as React.ElementType; return <article key={String(label)} className="rounded-2xl border border-gray-700/80 bg-gray-800/80 p-4 shadow-lg shadow-black/10"><I className="h-5 w-5 text-red-400"/><p className="mt-3 text-xl font-bold text-white sm:text-2xl">{value}</p><p className="mt-1 text-xs text-gray-400">{label}</p></article>; })}
      </section>

      <p role="note" className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-200"><strong>Live activity unavailable.</strong> Online users, current streams, last connection and channel are not connected. Last activity check: not available.</p>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <article className="rounded-3xl border border-gray-700 bg-gray-800/80 p-4 sm:p-6">
          <div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold text-white">Priority follow-up</h2><p className="mt-1 text-sm text-gray-400">Accounts needing payment or renewal attention.</p></div><span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">{priority.length} shown</span></div>
          <div className="mt-5 space-y-3">
            {loading ? <p className="py-10 text-center text-gray-400">Loading operations data...</p> : priority.length === 0 ? <p className="rounded-2xl border border-gray-700 bg-gray-900/60 p-8 text-center text-gray-400">No priority accounts right now.</p> : priority.map((c) => <div key={c.id} className="flex flex-col gap-3 rounded-2xl border border-gray-700 bg-gray-900/70 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate font-semibold text-white">{c.customer_name || c.username}</p><p className="mt-1 text-xs text-gray-500">{c.package_name || 'No package'} · Renewal {date(billingRenewalAt(c))}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${['paid', 'legacy_paid'].includes(c.payment_status || '') ? 'bg-green-500/10 text-green-300' : 'bg-yellow-500/10 text-yellow-300'}`}>{customerPaymentLabel(c)}</span>{c.xui_line_url && <button onClick={() => window.open(c.xui_line_url!, '_blank', 'noopener,noreferrer')} className="rounded-lg bg-cyan-500/10 p-2 text-cyan-300" aria-label="Open XUI"><ExternalLink className="h-4 w-4" /></button>}</div></div>)}
          </div>
        </article>

        <article className="rounded-3xl border border-gray-700 bg-gray-800/80 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-white">Revenue mix</h2><p className="mt-1 text-sm text-gray-400">Recorded monthly value; unknown old-pricing amounts are excluded.</p>
          <div className="mt-5 space-y-4">{customers.filter((c) => displayedAccountStatus(c) === 'active' && !isBillingExcluded(c) && !isLegacyPaidCustomer(c)).slice(0, 8).map((c) => <div key={c.id}><div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="truncate text-gray-300">{c.customer_name || c.username}</span><span className="font-semibold text-white">{money(Number(c.monthly_price || 0))}</span></div><div className="h-2 overflow-hidden rounded-full bg-gray-950"><div className="h-full rounded-full bg-gradient-to-r from-red-600 to-orange-400" style={{ width: `${Math.max(6, (Number(c.monthly_price || 0) / maxPlan) * 100)}%` }} /></div></div>)}</div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-3xl border border-gray-700 bg-gray-800/80 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-white">Recent payments</h2>
          <p className="mt-1 text-sm text-gray-400">Recorded payment amounts. Old-pricing confirmations with unknown amounts are excluded.</p>
          <div aria-label="Recent received payments" className="mt-5 space-y-3">
            {loading ? <p className="py-8 text-center text-gray-400">Loading received payments...</p>
              : paymentError ? <p role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{paymentError}</p>
                : receivedPayments.length === 0 ? <p className="rounded-2xl border border-gray-700 bg-gray-900/60 p-8 text-center text-gray-400">No received payment amounts recorded yet.</p>
                  : receivedPayments.map((p) => <div key={p.id} className="flex items-center justify-between rounded-2xl border border-gray-700 bg-gray-900/70 p-4"><div><p className="font-semibold text-white">{money(p.amount)}</p><p className="mt-1 text-xs text-gray-500">{adminPaymentMethod(p)||paymentMethodLabel(p.payment_method)} · {paymentDateLabel(p)} <time dateTime={p.paid_at}>{receivedPaymentDateTime(p.paid_at)}</time></p></div><span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-300">{p.source==='website_checkout'?'Recorded':'Paid'}</span></div>)}
          </div>
          <p className="mt-3 text-xs leading-5 text-gray-400">Manual received payments and verified completed website renewal receipts are shown. These recorded amounts are not a net balance or recurring revenue. Older entries remain in customer History.</p>
        </article>
        <article className="rounded-3xl border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 p-4 sm:p-6"><h2 className="text-xl font-semibold text-white">Smart operating brief</h2><div className="mt-5 space-y-3 text-sm leading-6 text-gray-300"><p><strong className="text-white">Revenue:</strong> {money(stats.mrr)} in active monthly recurring revenue.</p><p><strong className="text-white">Retention risk:</strong> {stats.overdue} overdue and {stats.unpaid} unpaid accounts need attention.</p><p><strong className="text-white">Near-term workload:</strong> {stats.due} renewals are scheduled in the next seven days.</p><p><strong className="text-white">Conversion opportunity:</strong> {stats.trials} trial accounts can be followed up for paid conversion.</p></div><Link to="/admin/crm" className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-gray-950">Open customer workspace<ArrowRight className="ml-2 h-4 w-4" /></Link></article>
      </section>
    </div>
  );
};

export default CRMPremiumOverview;
