import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CalendarDays, CreditCard, DollarSign, ExternalLink, RefreshCw, Sparkles, TrendingUp, Users, Wifi } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Customer = {
  id: string;
  customer_name: string | null;
  username: string;
  package_name: string | null;
  monthly_price: number | null;
  payment_status: string | null;
  renewal_at: string | null;
  account_status: string;
  online: boolean;
  trial: boolean;
  xui_line_url: string | null;
};

type Payment = {
  id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  paid_at: string;
};

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set';

const CRMPremiumOverview: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const [customerResult, paymentResult] = await Promise.all([
      supabase.from('iptv_customers').select('id,customer_name,username,package_name,monthly_price,payment_status,renewal_at,account_status,online,trial,xui_line_url').order('renewal_at', { ascending: true, nullsFirst: false }),
      supabase.from('iptv_payments').select('id,customer_id,amount,payment_method,paid_at').order('paid_at', { ascending: false }).limit(8),
    ]);
    if (customerResult.error) setError(customerResult.error.message);
    else setCustomers((customerResult.data || []) as Customer[]);
    if (!paymentResult.error) setPayments((paymentResult.data || []) as Payment[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const week = now + 7 * 86400000;
    const active = customers.filter((c) => c.account_status === 'active');
    const due = customers.filter((c) => { const t = c.renewal_at ? new Date(c.renewal_at).getTime() : 0; return t > now && t <= week; });
    const overdue = customers.filter((c) => { const t = c.renewal_at ? new Date(c.renewal_at).getTime() : 0; return t > 0 && t < now; });
    return {
      total: customers.length,
      active: active.length,
      online: customers.filter((c) => c.online).length,
      trials: customers.filter((c) => c.trial).length,
      unpaid: customers.filter((c) => c.payment_status !== 'paid').length,
      due: due.length,
      overdue: overdue.length,
      mrr: active.reduce((sum, c) => sum + Number(c.monthly_price || 0), 0),
    };
  }, [customers]);

  const priority = useMemo(() => customers.filter((c) => {
    const t = c.renewal_at ? new Date(c.renewal_at).getTime() : 0;
    return c.payment_status !== 'paid' || (t > 0 && t <= Date.now() + 7 * 86400000);
  }).slice(0, 8), [customers]);

  const maxPlan = Math.max(1, ...customers.map((c) => Number(c.monthly_price || 0)));

  return (
    <div className="space-y-6 pb-10">
      <section className="overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-950/70 via-gray-900 to-gray-950 p-5 shadow-2xl shadow-black/30 sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-300"><Sparkles className="h-3.5 w-3.5" /> Premium operations</div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Kristal Streams Command Center</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-300 sm:text-base">A finished, executive view of customers, revenue, renewals, payments, trials, and priority account actions.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button onClick={load} className="inline-flex items-center justify-center rounded-xl border border-gray-700 bg-gray-900/80 px-4 py-2.5 text-sm font-semibold text-gray-200"><RefreshCw className="mr-2 h-4 w-4" />Refresh</button>
            <Link to="/admin/crm" className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-950/40">Manage customers<ArrowRight className="ml-2 h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        {[
          ['MRR', money(stats.mrr), DollarSign], ['Customers', stats.total, Users], ['Active', stats.active, TrendingUp], ['Online', stats.online, Wifi], ['Due 7 Days', stats.due, CalendarDays], ['Unpaid', stats.unpaid, CreditCard], ['Overdue', stats.overdue, AlertTriangle],
        ].map(([label, value, Icon]) => { const I = Icon as React.ElementType; return <article key={String(label)} className="rounded-2xl border border-gray-700/80 bg-gray-800/80 p-4 shadow-lg shadow-black/10"><I className="h-5 w-5 text-red-400"/><p className="mt-3 text-xl font-bold text-white sm:text-2xl">{value}</p><p className="mt-1 text-xs text-gray-400">{label}</p></article>; })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <article className="rounded-3xl border border-gray-700 bg-gray-800/80 p-4 sm:p-6">
          <div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold text-white">Priority follow-up</h2><p className="mt-1 text-sm text-gray-400">Accounts needing payment or renewal attention.</p></div><span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">{priority.length} shown</span></div>
          <div className="mt-5 space-y-3">
            {loading ? <p className="py-10 text-center text-gray-400">Loading operations data...</p> : priority.length === 0 ? <p className="rounded-2xl border border-gray-700 bg-gray-900/60 p-8 text-center text-gray-400">No priority accounts right now.</p> : priority.map((c) => <div key={c.id} className="flex flex-col gap-3 rounded-2xl border border-gray-700 bg-gray-900/70 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate font-semibold text-white">{c.customer_name || c.username}</p><p className="mt-1 text-xs text-gray-500">{c.package_name || 'No package'} · Renewal {date(c.renewal_at)}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.payment_status === 'paid' ? 'bg-green-500/10 text-green-300' : 'bg-yellow-500/10 text-yellow-300'}`}>{c.payment_status || 'unpaid'}</span>{c.xui_line_url && <button onClick={() => window.open(c.xui_line_url!, '_blank', 'noopener,noreferrer')} className="rounded-lg bg-cyan-500/10 p-2 text-cyan-300" aria-label="Open XUI"><ExternalLink className="h-4 w-4" /></button>}</div></div>)}
          </div>
        </article>

        <article className="rounded-3xl border border-gray-700 bg-gray-800/80 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-white">Revenue mix</h2><p className="mt-1 text-sm text-gray-400">Monthly value by active account.</p>
          <div className="mt-5 space-y-4">{customers.filter((c) => c.account_status === 'active').slice(0, 8).map((c) => <div key={c.id}><div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="truncate text-gray-300">{c.customer_name || c.username}</span><span className="font-semibold text-white">{money(Number(c.monthly_price || 0))}</span></div><div className="h-2 overflow-hidden rounded-full bg-gray-950"><div className="h-full rounded-full bg-gradient-to-r from-red-600 to-orange-400" style={{ width: `${Math.max(6, (Number(c.monthly_price || 0) / maxPlan) * 100)}%` }} /></div></div>)}</div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-3xl border border-gray-700 bg-gray-800/80 p-4 sm:p-6"><h2 className="text-xl font-semibold text-white">Recent payments</h2><p className="mt-1 text-sm text-gray-400">Automatically recorded when accounts are marked paid.</p><div className="mt-5 space-y-3">{payments.length === 0 ? <p className="rounded-2xl border border-gray-700 bg-gray-900/60 p-8 text-center text-gray-400">Payment activity will appear here.</p> : payments.map((p) => <div key={p.id} className="flex items-center justify-between rounded-2xl border border-gray-700 bg-gray-900/70 p-4"><div><p className="font-semibold text-white">{money(Number(p.amount || 0))}</p><p className="mt-1 text-xs text-gray-500">{p.payment_method} · {date(p.paid_at)}</p></div><span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-300">Paid</span></div>)}</div></article>
        <article className="rounded-3xl border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 p-4 sm:p-6"><h2 className="text-xl font-semibold text-white">Smart operating brief</h2><div className="mt-5 space-y-3 text-sm leading-6 text-gray-300"><p><strong className="text-white">Revenue:</strong> {money(stats.mrr)} in active monthly recurring revenue.</p><p><strong className="text-white">Retention risk:</strong> {stats.overdue} overdue and {stats.unpaid} unpaid accounts need attention.</p><p><strong className="text-white">Near-term workload:</strong> {stats.due} renewals are scheduled in the next seven days.</p><p><strong className="text-white">Conversion opportunity:</strong> {stats.trials} trial accounts can be followed up for paid conversion.</p></div><Link to="/admin/crm" className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-gray-950">Open customer workspace<ArrowRight className="ml-2 h-4 w-4" /></Link></article>
      </section>
    </div>
  );
};

export default CRMPremiumOverview;
