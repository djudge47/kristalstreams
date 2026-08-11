import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  History,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Customer = {
  id: string;
  external_id: number;
  customer_name: string | null;
  username: string;
  iptv_password: string | null;
  owner: string | null;
  email: string | null;
  phone: string | null;
  package_name: string | null;
  monthly_price: number | null;
  payment_status: string | null;
  last_payment_at: string | null;
  renewal_at: string | null;
  expiration_at: string | null;
  account_status: string;
  online: boolean;
  trial: boolean;
  active_connections: number;
  connections_allowed: number;
  device_name: string | null;
  device_type: string | null;
  device_notes: string | null;
  notes: string | null;
  xui_line_url: string | null;
};

type Payment = {
  id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  paid_at: string;
  period_start: string | null;
  period_end: string | null;
  reference: string | null;
  notes: string | null;
};

type ActivityRow = {
  id: string;
  customer_id: string;
  activity_type: string;
  title: string;
  details: string | null;
  created_at: string;
};

type Reminder = {
  id: string;
  customer_id: string;
  channel: string;
  reminder_type: string;
  scheduled_for: string;
  status: string;
  sent_at?: string | null;
};

type Filter = 'all' | 'active' | 'due3' | 'due7' | 'due30' | 'unpaid' | 'overdue';

type FormState = {
  external_id: string;
  customer_name: string;
  username: string;
  iptv_password: string;
  owner: string;
  email: string;
  phone: string;
  package_name: string;
  monthly_price: string;
  payment_status: string;
  last_payment_at: string;
  renewal_at: string;
  expiration_at: string;
  account_status: string;
  online: boolean;
  trial: boolean;
  active_connections: string;
  connections_allowed: string;
  device_name: string;
  device_type: string;
  device_notes: string;
  notes: string;
  xui_line_url: string;
};

const DAY = 86_400_000;
const emptyForm: FormState = {
  external_id: '', customer_name: '', username: '', iptv_password: '', owner: '', email: '', phone: '',
  package_name: '', monthly_price: '', payment_status: 'unpaid', last_payment_at: '', renewal_at: '', expiration_at: '',
  account_status: 'active', online: false, trial: false, active_connections: '0', connections_allowed: '1',
  device_name: '', device_type: '', device_notes: '', notes: '', xui_line_url: '',
};

const ts = (value?: string | null) => {
  if (!value) return 0;
  const n = new Date(value).getTime();
  return Number.isNaN(n) ? 0 : n;
};

const money = (value?: number | null) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD',
}).format(Number(value || 0));

const dateOnly = (value?: string | null) => value
  ? new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
  : 'Not set';

const dateTime = (value?: string | null) => value
  ? new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  : 'Not set';

const inputDate = (value?: string | null) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

const addMonthsSafe = (start: Date, months: number) => {
  const next = new Date(start);
  const originalDay = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(originalDay, lastDay));
  return next;
};

const CRMOperationsCenter: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [extendCustomer, setExtendCustomer] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [historyPayments, setHistoryPayments] = useState<Payment[]>([]);
  const [historyActivities, setHistoryActivities] = useState<ActivityRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    const [c, p, a, r] = await Promise.all([
      supabase.from('iptv_customers').select('*').order('renewal_at', { ascending: true, nullsFirst: false }),
      supabase.from('iptv_payments').select('*').order('paid_at', { ascending: false }).limit(100),
      supabase.from('iptv_customer_activity').select('*').order('created_at', { ascending: false }).limit(30),
      supabase.from('iptv_reminder_queue').select('*').eq('status', 'pending').order('scheduled_for', { ascending: true }).limit(100),
    ]);
    const e = c.error || p.error || a.error || r.error;
    if (e) setError(e.message);
    setCustomers((c.data || []) as Customer[]);
    setPayments((p.data || []) as Payment[]);
    setActivities((a.data || []) as ActivityRow[]);
    setReminders((r.data || []) as Reminder[]);
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, []);

  const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const labelFor = (id: string) => {
    const c = customerMap.get(id);
    return c?.customer_name || c?.username || 'Customer';
  };

  const isOverdue = (c: Customer) => {
    const now = Date.now();
    return c.account_status === 'expired' || (ts(c.renewal_at) > 0 && ts(c.renewal_at) < now) || (ts(c.expiration_at) > 0 && ts(c.expiration_at) < now);
  };

  const dueWithin = (c: Customer, days: number) => {
    const now = Date.now();
    const d = ts(c.renewal_at);
    return d > now && d <= now + days * DAY;
  };

  const renewalBadge = (c: Customer) => {
    if (isOverdue(c)) return { label: 'Overdue', cls: 'bg-red-500/15 text-red-300' };
    if (dueWithin(c, 3)) return { label: 'Due ≤3d', cls: 'bg-orange-500/15 text-orange-300' };
    if (dueWithin(c, 7)) return { label: 'Due ≤7d', cls: 'bg-yellow-500/15 text-yellow-300' };
    if (dueWithin(c, 30)) return { label: 'Due ≤30d', cls: 'bg-blue-500/15 text-blue-300' };
    return { label: 'Current', cls: 'bg-green-500/10 text-green-300' };
  };

  const stats = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    return {
      total: customers.length,
      active: customers.filter((c) => c.account_status === 'active').length,
      online: customers.filter((c) => c.online).length,
      due3: customers.filter((c) => dueWithin(c, 3)).length,
      due7: customers.filter((c) => dueWithin(c, 7)).length,
      due30: customers.filter((c) => dueWithin(c, 30)).length,
      overdue: customers.filter(isOverdue).length,
      unpaid: customers.filter((c) => c.payment_status !== 'paid').length,
      mrr: customers.filter((c) => c.account_status === 'active').reduce((sum, c) => sum + Number(c.monthly_price || 0), 0),
      paidMonth: payments.filter((p) => ts(p.paid_at) >= monthStart.getTime()).reduce((sum, p) => sum + Number(p.amount || 0), 0),
      followups: reminders.length,
    };
  }, [customers, payments, reminders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      const haystack = [c.customer_name, c.username, c.external_id, c.email, c.phone, c.package_name, c.device_name].join(' ').toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (filter === 'active') return c.account_status === 'active';
      if (filter === 'due3') return dueWithin(c, 3);
      if (filter === 'due7') return dueWithin(c, 7);
      if (filter === 'due30') return dueWithin(c, 30);
      if (filter === 'unpaid') return c.payment_status !== 'paid';
      if (filter === 'overdue') return isOverdue(c);
      return true;
    });
  }, [customers, filter, search]);

  const attention = useMemo(() => customers
    .filter((c) => isOverdue(c) || dueWithin(c, 7) || c.payment_status !== 'paid')
    .sort((a, b) => (ts(a.renewal_at) || ts(a.expiration_at) || Number.MAX_SAFE_INTEGER) - (ts(b.renewal_at) || ts(b.expiration_at) || Number.MAX_SAFE_INTEGER))
    .slice(0, 8), [customers]);

  const pendingIds = useMemo(() => new Set(reminders.map((r) => r.customer_id)), [reminders]);

  const extensionBase = (c: Customer) => new Date(Math.max(Date.now(), ts(c.renewal_at), ts(c.expiration_at)));

  const recordPayment = async (c: Customer) => {
    if (!window.confirm(`Record ${money(c.monthly_price)} payment and extend ${c.customer_name || c.username} one month?`)) return;
    setBusy(`pay-${c.id}`);
    setError(null);
    const now = new Date();
    const next = addMonthsSafe(extensionBase(c), 1);
    const { error: e } = await supabase.from('iptv_customers').update({
      payment_status: 'paid',
      last_payment_at: now.toISOString(),
      renewal_at: next.toISOString(),
      expiration_at: next.toISOString(),
      account_status: 'active',
      updated_at: now.toISOString(),
    }).eq('id', c.id);
    if (e) setError(e.message);
    else {
      setMessage(`${c.customer_name || c.username}: payment recorded; service now runs through ${dateOnly(next.toISOString())}.`);
      await refresh();
    }
    setBusy(null);
  };

  const extendService = async (c: Customer, months: number) => {
    setBusy(`extend-${c.id}`);
    setError(null);
    const next = addMonthsSafe(extensionBase(c), months);
    const { error: e } = await supabase.from('iptv_customers').update({
      renewal_at: next.toISOString(), expiration_at: next.toISOString(), account_status: 'active', updated_at: new Date().toISOString(),
    }).eq('id', c.id);
    if (e) setError(e.message);
    else {
      setMessage(`${c.customer_name || c.username}: service extended ${months} month${months === 1 ? '' : 's'} through ${dateOnly(next.toISOString())}.`);
      setExtendCustomer(null);
      await refresh();
    }
    setBusy(null);
  };

  const queueFollowup = async (c: Customer) => {
    if (pendingIds.has(c.id)) {
      setMessage(`${c.customer_name || c.username} already has a pending follow-up.`);
      return;
    }
    setBusy(`follow-${c.id}`);
    setError(null);
    const { error: e } = await supabase.from('iptv_reminder_queue').insert({
      customer_id: c.id, channel: 'manual', reminder_type: 'renewal_follow_up', scheduled_for: new Date().toISOString(), status: 'pending',
    });
    if (e) setError(e.message);
    else {
      setMessage(`${c.customer_name || c.username} added to the renewal follow-up queue.`);
      await refresh();
    }
    setBusy(null);
  };

  const completeFollowup = async (r: Reminder) => {
    setBusy(`done-${r.id}`);
    const now = new Date().toISOString();
    const { error: e } = await supabase.from('iptv_reminder_queue').update({ status: 'sent', sent_at: now }).eq('id', r.id);
    if (e) setError(e.message);
    else {
      setMessage(`${labelFor(r.customer_id)} follow-up marked complete.`);
      await refresh();
    }
    setBusy(null);
  };

  const openHistory = async (c: Customer) => {
    setHistoryCustomer(c);
    setHistoryPayments([]);
    setHistoryActivities([]);
    setHistoryLoading(true);
    setError(null);
    const [p, a] = await Promise.all([
      supabase.from('iptv_payments').select('*').eq('customer_id', c.id).order('paid_at', { ascending: false }).limit(100),
      supabase.from('iptv_customer_activity').select('*').eq('customer_id', c.id).order('created_at', { ascending: false }).limit(100),
    ]);
    const e = p.error || a.error;
    if (e) setError(e.message);
    setHistoryPayments((p.data || []) as Payment[]);
    setHistoryActivities((a.data || []) as ActivityRow[]);
    setHistoryLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
    setError(null);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      external_id: String(c.external_id || ''), customer_name: c.customer_name || '', username: c.username || '', iptv_password: c.iptv_password || '',
      owner: c.owner || '', email: c.email || '', phone: c.phone || '', package_name: c.package_name || '', monthly_price: String(c.monthly_price || ''),
      payment_status: c.payment_status || 'unpaid', last_payment_at: inputDate(c.last_payment_at), renewal_at: inputDate(c.renewal_at), expiration_at: inputDate(c.expiration_at),
      account_status: c.account_status || 'active', online: Boolean(c.online), trial: Boolean(c.trial), active_connections: String(c.active_connections || 0),
      connections_allowed: String(c.connections_allowed || 1), device_name: c.device_name || '', device_type: c.device_type || '', device_notes: c.device_notes || '',
      notes: c.notes || '', xui_line_url: c.xui_line_url || '',
    });
    setShowForm(true);
    setError(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const saveCustomer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.external_id.trim() || !form.username.trim()) {
      setError('Panel ID and IPTV username are required.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      external_id: Number(form.external_id), customer_name: form.customer_name.trim() || null, username: form.username.trim(), iptv_password: form.iptv_password.trim() || null,
      owner: form.owner.trim() || null, email: form.email.trim() || null, phone: form.phone.trim() || null, package_name: form.package_name.trim() || null,
      monthly_price: Number(form.monthly_price || 0), payment_status: form.payment_status, last_payment_at: form.last_payment_at ? new Date(form.last_payment_at).toISOString() : null,
      renewal_at: form.renewal_at ? new Date(form.renewal_at).toISOString() : null, expiration_at: form.expiration_at ? new Date(form.expiration_at).toISOString() : null,
      account_status: form.account_status, online: form.online, trial: form.trial, active_connections: Number(form.active_connections || 0),
      connections_allowed: Number(form.connections_allowed || 1), device_name: form.device_name.trim() || null, device_type: form.device_type.trim() || null,
      device_notes: form.device_notes.trim() || null, notes: form.notes.trim() || null, xui_line_url: form.xui_line_url.trim() || null, updated_at: new Date().toISOString(),
    };
    const result = editing
      ? await supabase.from('iptv_customers').update(payload).eq('id', editing.id)
      : await supabase.from('iptv_customers').insert(payload);
    if (result.error) setError(result.error.message);
    else {
      setMessage(editing ? 'Customer account updated.' : 'Customer account added.');
      closeForm();
      await refresh();
    }
    setSaving(false);
  };

  const removeCustomer = async (c: Customer) => {
    if (!window.confirm(`Delete ${c.customer_name || c.username}? This cannot be undone.`)) return;
    const { error: e } = await supabase.from('iptv_customers').delete().eq('id', c.id);
    if (e) setError(e.message);
    else {
      setMessage('Customer removed.');
      closeForm();
      await refresh();
    }
  };

  const field = (key: keyof FormState, label: string, type = 'text', required = false) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <input
        type={type}
        step={type === 'number' ? 'any' : undefined}
        required={required}
        value={String(form[key])}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm text-white outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
      />
    </label>
  );

  const metricCards = [
    ['Customers', stats.total, Users, 'text-red-400'],
    ['Active', stats.active, CheckCircle2, 'text-green-400'],
    ['Online', stats.online, Wifi, 'text-cyan-400'],
    ['Due 3 Days', stats.due3, Clock3, 'text-orange-400'],
    ['Due 7 Days', stats.due7, AlertTriangle, 'text-yellow-400'],
    ['Due 30 Days', stats.due30, CalendarDays, 'text-blue-400'],
    ['Overdue', stats.overdue, AlertTriangle, 'text-red-400'],
    ['Unpaid', stats.unpaid, CreditCard, 'text-yellow-400'],
  ] as const;

  const filterLabels: Record<Filter, string> = { all: 'All', active: 'Active', due3: 'Due 3d', due7: 'Due 7d', due30: 'Due 30d', unpaid: 'Unpaid', overdue: 'Overdue' };

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-400">Kristal Streams CRM</p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">IPTV Subscriber Operations Center</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">See who needs attention, record payments, extend service, manage follow-ups, and review customer history without leaving the CRM.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void refresh()} className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-200 sm:flex-none"><RefreshCw className="mr-2 h-4 w-4" />Refresh</button>
          <button onClick={openCreate} className="inline-flex flex-1 items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white sm:flex-none"><Plus className="mr-2 h-4 w-4" />Add Customer</button>
        </div>
      </header>

      {message && <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">{message}</div>}
      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-8">
        {metricCards.map(([name, value, Icon, color]) => (
          <button key={name} onClick={() => {
            if (name === 'Active') setFilter('active');
            else if (name === 'Due 3 Days') setFilter('due3');
            else if (name === 'Due 7 Days') setFilter('due7');
            else if (name === 'Due 30 Days') setFilter('due30');
            else if (name === 'Overdue') setFilter('overdue');
            else if (name === 'Unpaid') setFilter('unpaid');
            else setFilter('all');
          }} className="rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 p-4 text-left hover:border-gray-600">
            <Icon className={`h-5 w-5 ${color}`} /><p className="mt-3 text-2xl font-bold text-white">{value}</p><p className="mt-1 text-xs text-gray-400">{name}</p>
          </button>
        ))}
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-700 bg-gray-800/90 p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active MRR</span><DollarSign className="h-5 w-5 text-green-400" /></div><p className="mt-3 text-2xl font-bold text-white">{money(stats.mrr)}</p><p className="mt-1 text-xs text-gray-500">Monthly value of active accounts</p></div>
        <div className="rounded-2xl border border-gray-700 bg-gray-800/90 p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Paid This Month</span><CreditCard className="h-5 w-5 text-cyan-400" /></div><p className="mt-3 text-2xl font-bold text-white">{money(stats.paidMonth)}</p><p className="mt-1 text-xs text-gray-500">From recorded payment history</p></div>
        <div className="rounded-2xl border border-gray-700 bg-gray-800/90 p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Follow-up Queue</span><Bell className="h-5 w-5 text-yellow-400" /></div><p className="mt-3 text-2xl font-bold text-white">{stats.followups}</p><p className="mt-1 text-xs text-gray-500">Pending manual renewal follow-ups</p></div>
      </section>

      <section className="grid gap-4 2xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-700 bg-gray-800/90 p-4 sm:p-5">
          <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-red-400">Priority</p><h2 className="mt-1 font-bold text-white">Attention Queue</h2></div><AlertTriangle className="h-5 w-5 text-yellow-400" /></div>
          <div className="mt-4 space-y-2">{attention.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">No accounts need immediate attention.</p> : attention.map((c) => { const badge = renewalBadge(c); return <button key={c.id} onClick={() => void openHistory(c)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-700 bg-gray-900/80 p-3 text-left hover:border-gray-600"><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{c.customer_name || c.username}</p><p className="mt-1 text-xs text-gray-500">{c.payment_status || 'unpaid'} · {money(c.monthly_price)}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${badge.cls}`}>{badge.label}</span></button>; })}</div>
        </div>

        <div className="rounded-2xl border border-gray-700 bg-gray-800/90 p-4 sm:p-5">
          <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-green-400">Billing</p><h2 className="mt-1 font-bold text-white">Recent Payments</h2></div><CreditCard className="h-5 w-5 text-green-400" /></div>
          <div className="mt-4 space-y-2">{payments.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">No payment history yet.</p> : payments.slice(0, 6).map((p) => <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-700 bg-gray-900/80 p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{labelFor(p.customer_id)}</p><p className="mt-1 text-xs text-gray-500">{dateTime(p.paid_at)} · {p.payment_method}</p></div><p className="shrink-0 text-sm font-bold text-green-300">{money(p.amount)}</p></div>)}</div>
        </div>

        <div className="rounded-2xl border border-gray-700 bg-gray-800/90 p-4 sm:p-5">
          <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Audit Trail</p><h2 className="mt-1 font-bold text-white">Recent Activity</h2></div><Activity className="h-5 w-5 text-cyan-400" /></div>
          <div className="mt-4 space-y-2">{activities.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">No activity recorded yet.</p> : activities.slice(0, 6).map((a) => <div key={a.id} className="rounded-xl border border-gray-700 bg-gray-900/80 p-3"><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-white">{a.title}</p><span className="shrink-0 text-[11px] text-gray-500">{dateTime(a.created_at)}</span></div><p className="mt-1 text-xs text-gray-400">{labelFor(a.customer_id)}{a.details ? ` · ${a.details}` : ''}</p></div>)}</div>
        </div>

        <div className="rounded-2xl border border-gray-700 bg-gray-800/90 p-4 sm:p-5">
          <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-yellow-400">Work Queue</p><h2 className="mt-1 font-bold text-white">Renewal Follow-ups</h2></div><Bell className="h-5 w-5 text-yellow-400" /></div>
          <div className="mt-4 space-y-2">{reminders.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">No follow-ups are pending.</p> : reminders.slice(0, 6).map((r) => <div key={r.id} className="rounded-xl border border-gray-700 bg-gray-900/80 p-3"><p className="truncate text-sm font-semibold text-white">{labelFor(r.customer_id)}</p><div className="mt-2 flex items-center justify-between gap-2"><span className="text-xs text-gray-500">{dateTime(r.scheduled_for)}</span><button disabled={busy === `done-${r.id}`} onClick={() => void completeFollowup(r)} className="rounded-lg bg-green-500/10 px-2.5 py-1.5 text-xs font-semibold text-green-300 disabled:opacity-50">Done</button></div></div>)}</div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-700 bg-gray-800/90 p-3 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer, username, phone, package or device..." className="w-full rounded-xl border border-gray-700 bg-gray-950 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-red-500" /></div>
          <div className="flex gap-2 overflow-x-auto pb-1">{(['all', 'active', 'due3', 'due7', 'due30', 'unpaid', 'overdue'] as Filter[]).map((f) => <button key={f} onClick={() => setFilter(f)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${filter === f ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}>{filterLabels[f]}</button>)}</div>
        </div>

        {loading ? <div className="py-14 text-center text-gray-400">Loading customer operations...</div> : filtered.length === 0 ? <div className="mt-5 py-14 text-center text-gray-400">No customers match this view.</div> : (
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {filtered.map((c) => { const badge = renewalBadge(c); return (
              <article key={c.id} className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-900/80">
                <div className="flex items-start justify-between gap-3 border-b border-gray-800 bg-gray-800/70 p-4"><div className="min-w-0"><h2 className="truncate font-semibold text-white">{c.customer_name || c.username}</h2><p className="mt-1 text-xs text-gray-500">Panel ID {c.external_id} · {c.username}</p></div><div className="flex flex-col items-end gap-1.5"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.account_status === 'active' ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>{c.account_status}</span><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${badge.cls}`}>{badge.label}</span></div></div>
                <div className="grid grid-cols-2 gap-3 p-4 text-sm sm:grid-cols-3"><div><p className="text-xs text-gray-500">Package</p><p className="mt-1 text-gray-200">{c.package_name || 'Not assigned'}</p></div><div><p className="text-xs text-gray-500">Monthly Price</p><p className="mt-1 text-gray-200">{money(c.monthly_price)}</p></div><div><p className="text-xs text-gray-500">Payment</p><p className={`mt-1 font-semibold ${c.payment_status === 'paid' ? 'text-green-300' : 'text-yellow-300'}`}>{c.payment_status || 'unpaid'}</p></div><div><p className="text-xs text-gray-500">Renewal</p><p className="mt-1 text-gray-200">{dateOnly(c.renewal_at)}</p></div><div><p className="text-xs text-gray-500">Connections</p><p className="mt-1 text-gray-200">{c.active_connections}/{c.connections_allowed}</p></div><div><p className="text-xs text-gray-500">Device</p><p className="mt-1 truncate text-gray-200">{c.device_name || c.device_type || 'Not recorded'}</p></div></div>
                <div className="border-t border-gray-800 px-4 py-3"><p className="text-xs text-gray-500">IPTV password</p><div className="mt-1 flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded-lg bg-gray-950 px-2.5 py-1.5 text-xs text-gray-300">{visiblePasswords[c.id] ? c.iptv_password || 'Not set' : '••••••••••'}</code><button onClick={() => setVisiblePasswords((v) => ({ ...v, [c.id]: !v[c.id] }))} className="rounded-lg p-2 text-gray-400">{visiblePasswords[c.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
                {pendingIds.has(c.id) && <div className="border-t border-gray-800 bg-yellow-500/5 px-4 py-2 text-xs font-medium text-yellow-300"><Bell className="mr-1.5 inline h-3.5 w-3.5" />Renewal follow-up queued</div>}
                <div className="grid grid-cols-2 gap-2 border-t border-gray-800 p-3 sm:grid-cols-3"><button onClick={() => openEdit(c)} className="inline-flex items-center justify-center rounded-lg bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-200"><Edit3 className="mr-1.5 h-3.5 w-3.5" />Edit</button><button disabled={busy === `pay-${c.id}`} onClick={() => void recordPayment(c)} className="inline-flex items-center justify-center rounded-lg bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-300 disabled:opacity-50"><CreditCard className="mr-1.5 h-3.5 w-3.5" />Record Payment</button><button onClick={() => setExtendCustomer(c)} className="inline-flex items-center justify-center rounded-lg bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300"><CalendarDays className="mr-1.5 h-3.5 w-3.5" />Extend Service</button><button disabled={busy === `follow-${c.id}`} onClick={() => void queueFollowup(c)} className="inline-flex items-center justify-center rounded-lg bg-yellow-500/10 px-3 py-2 text-xs font-semibold text-yellow-300 disabled:opacity-50"><Bell className="mr-1.5 h-3.5 w-3.5" />Follow Up</button><button onClick={() => void openHistory(c)} className="inline-flex items-center justify-center rounded-lg bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300"><History className="mr-1.5 h-3.5 w-3.5" />History</button><button disabled={!c.xui_line_url} onClick={() => c.xui_line_url && window.open(c.xui_line_url, '_blank', 'noopener,noreferrer')} className="inline-flex items-center justify-center rounded-lg bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 disabled:opacity-40"><ExternalLink className="mr-1.5 h-3.5 w-3.5" />XUI</button></div>
              </article>
            ); })}
          </div>
        )}
      </section>

      {showForm && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4"><div className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-gray-700 bg-gray-900 sm:max-w-4xl sm:rounded-3xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-900/95 px-4 py-4 sm:px-6"><div><p className="text-xs font-semibold uppercase tracking-widest text-red-400">Customer Record</p><h2 className="mt-1 text-xl font-bold text-white">{editing ? 'Edit IPTV Customer' : 'Add IPTV Customer'}</h2></div><button onClick={closeForm} className="rounded-xl bg-gray-800 p-2 text-gray-400"><X className="h-5 w-5" /></button></div><form onSubmit={saveCustomer} className="space-y-6 p-4 sm:p-6">
        <div><h3 className="mb-3 text-sm font-semibold text-white">Customer and panel account</h3><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{field('external_id', 'Panel ID', 'number', true)}{field('customer_name', 'Customer name')}{field('username', 'IPTV username', 'text', true)}{field('iptv_password', 'IPTV password', 'password')}{field('owner', 'Panel owner')}{field('email', 'Email', 'email')}{field('phone', 'Phone', 'tel')}{field('package_name', 'Package')}{field('monthly_price', 'Monthly price', 'number')}</div></div>
        <div><h3 className="mb-3 text-sm font-semibold text-white">Billing and renewal</h3><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><label><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">Payment status</span><select value={form.payment_status} onChange={(e) => setForm((f) => ({ ...f, payment_status: e.target.value }))} className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm text-white"><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="past_due">Past due</option><option value="refunded">Refunded</option></select></label>{field('last_payment_at', 'Last payment', 'datetime-local')}{field('renewal_at', 'Renewal date', 'datetime-local')}{field('expiration_at', 'Panel expiration', 'datetime-local')}<label><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">Account status</span><select value={form.account_status} onChange={(e) => setForm((f) => ({ ...f, account_status: e.target.value }))} className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm text-white"><option value="active">Active</option><option value="inactive">Inactive</option><option value="expired">Expired</option><option value="suspended">Suspended</option></select></label>{field('xui_line_url', 'Direct XUI line URL', 'url')}</div></div>
        <div><h3 className="mb-3 text-sm font-semibold text-white">Connections and device</h3><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{field('active_connections', 'Active connections', 'number')}{field('connections_allowed', 'Connections allowed', 'number')}{field('device_name', 'Device name')}{field('device_type', 'Device type')}<label className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-950 px-3 py-3 text-sm text-gray-200"><input type="checkbox" checked={form.online} onChange={(e) => setForm((f) => ({ ...f, online: e.target.checked }))} />Online now</label><label className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-950 px-3 py-3 text-sm text-gray-200"><input type="checkbox" checked={form.trial} onChange={(e) => setForm((f) => ({ ...f, trial: e.target.checked }))} />Trial account</label></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><label><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">Device notes</span><textarea value={form.device_notes} onChange={(e) => setForm((f) => ({ ...f, device_notes: e.target.value }))} rows={3} className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm text-white" /></label><label><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">Internal notes</span><textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm text-white" /></label></div></div>
        <div className="flex flex-col-reverse gap-2 border-t border-gray-800 pt-5 sm:flex-row sm:items-center sm:justify-between"><div>{editing && <button type="button" onClick={() => void removeCustomer(editing)} className="inline-flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300"><Trash2 className="mr-2 h-4 w-4" />Delete Customer</button>}</div><div className="flex flex-col-reverse gap-2 sm:flex-row"><button type="button" onClick={closeForm} className="rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-300">Cancel</button><button disabled={saving} type="submit" className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Customer'}</button></div></div>
      </form></div></div>}

      {extendCustomer && <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 sm:items-center sm:p-4"><div className="w-full rounded-t-3xl border border-gray-700 bg-gray-900 p-5 sm:max-w-md sm:rounded-3xl"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-blue-400">Extend Service</p><h2 className="mt-1 text-xl font-bold text-white">{extendCustomer.customer_name || extendCustomer.username}</h2><p className="mt-2 text-sm text-gray-400">Current renewal: {dateOnly(extendCustomer.renewal_at)}</p></div><button onClick={() => setExtendCustomer(null)} className="rounded-xl bg-gray-800 p-2 text-gray-400"><X className="h-5 w-5" /></button></div><div className="mt-5 grid grid-cols-2 gap-3">{[1, 3, 6, 12].map((months) => <button key={months} disabled={busy === `extend-${extendCustomer.id}`} onClick={() => void extendService(extendCustomer, months)} className="rounded-2xl border border-gray-700 bg-gray-800 px-4 py-4 text-left hover:border-blue-500/60 disabled:opacity-50"><p className="text-lg font-bold text-white">+{months} month{months === 1 ? '' : 's'}</p><p className="mt-1 text-xs text-gray-500">Extend renewal and expiration</p></button>)}</div></div></div>}

      {historyCustomer && <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 sm:items-center sm:p-4"><div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-gray-700 bg-gray-900 sm:max-w-2xl sm:rounded-3xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-900/95 px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-purple-400">Customer History</p><h2 className="mt-1 text-xl font-bold text-white">{historyCustomer.customer_name || historyCustomer.username}</h2></div><button onClick={() => { setHistoryCustomer(null); setHistoryPayments([]); setHistoryActivities([]); }} className="rounded-xl bg-gray-800 p-2 text-gray-400"><X className="h-5 w-5" /></button></div><div className="grid gap-5 p-5 md:grid-cols-2">
        <div><div className="mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4 text-green-400" /><h3 className="text-sm font-semibold text-white">Payment History</h3></div><div className="space-y-2">{historyLoading ? <p className="rounded-xl border border-gray-800 bg-gray-950 p-4 text-sm text-gray-500">Loading payment history...</p> : historyPayments.length === 0 ? <p className="rounded-xl border border-gray-800 bg-gray-950 p-4 text-sm text-gray-500">No payments recorded yet.</p> : historyPayments.map((p) => <div key={p.id} className="rounded-xl border border-gray-700 bg-gray-950 p-3"><div className="flex justify-between gap-3"><p className="font-semibold text-green-300">{money(p.amount)}</p><span className="text-xs text-gray-500">{dateTime(p.paid_at)}</span></div><p className="mt-1 text-xs text-gray-400">{p.payment_method} · {p.payment_status}</p>{p.period_end && <p className="mt-1 text-xs text-gray-500">Service through {dateOnly(p.period_end)}</p>}</div>)}</div></div>
        <div><div className="mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-cyan-400" /><h3 className="text-sm font-semibold text-white">Activity Timeline</h3></div><div className="space-y-2">{historyLoading ? <p className="rounded-xl border border-gray-800 bg-gray-950 p-4 text-sm text-gray-500">Loading activity history...</p> : historyActivities.length === 0 ? <p className="rounded-xl border border-gray-800 bg-gray-950 p-4 text-sm text-gray-500">No activity recorded yet.</p> : historyActivities.map((a) => <div key={a.id} className="rounded-xl border border-gray-700 bg-gray-950 p-3"><div className="flex justify-between gap-3"><p className="text-sm font-semibold text-white">{a.title}</p><span className="text-xs text-gray-500">{dateTime(a.created_at)}</span></div>{a.details && <p className="mt-1 text-xs leading-5 text-gray-400">{a.details}</p>}</div>)}</div></div>
      </div></div></div>}
    </div>
  );
};

export default CRMOperationsCenter;
