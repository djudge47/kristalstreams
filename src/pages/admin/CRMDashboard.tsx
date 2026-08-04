import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Ban,
  BellRing,
  CheckCircle2,
  Clock3,
  CreditCard,
  Gauge,
  Headphones,
  Mail,
  Monitor,
  RefreshCcw,
  Search,
  ShieldCheck,
  Smartphone,
  TimerReset,
  TrendingUp,
  UserCheck,
  Users,
  Wifi,
  XCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type CustomerProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  connections_allowed: number | null;
  active_connections: number | null;
  subscription_expires_at: string | null;
  updated_at: string | null;
};

type Ticket = {
  id: string;
  customer_email?: string | null;
  status?: string | null;
  priority?: string | null;
  created_at?: string | null;
};

type FilterKey = 'all' | 'active' | 'demo' | 'paid' | 'expiring' | 'expired' | 'inactive' | 'overlimit';

const paidTiers = ['bronze', 'silver', 'gold', 'platinum'];
const tierOrder = ['demo', 'bronze', 'silver', 'gold', 'platinum'];

const formatDate = (value?: string | null) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const timeRemaining = (value?: string | null) => {
  if (!value) return { label: 'No expiry', hours: null, expired: false };
  const expires = new Date(value).getTime();
  if (Number.isNaN(expires)) return { label: 'No expiry', hours: null, expired: false };
  const diff = expires - Date.now();
  if (diff <= 0) return { label: 'Expired', hours: 0, expired: true };
  const hours = Math.ceil(diff / 3_600_000);
  const days = Math.floor(hours / 24);
  return {
    label: days > 0 ? `${days}d ${hours % 24}h` : `${hours}h`,
    hours,
    expired: false,
  };
};

const tierLabel = (tier?: string | null) => {
  if (!tier) return 'No package';
  if (tier === 'demo') return '36-Hour Demo';
  return tier.charAt(0).toUpperCase() + tier.slice(1);
};

const tierBadge = (tier?: string | null) => {
  switch (tier) {
    case 'demo': return 'border-violet-500/30 bg-violet-500/10 text-violet-300';
    case 'bronze': return 'border-orange-500/30 bg-orange-500/10 text-orange-300';
    case 'silver': return 'border-slate-300/30 bg-slate-300/10 text-slate-200';
    case 'gold': return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
    case 'platinum': return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';
    default: return 'border-gray-600 bg-gray-700/40 text-gray-300';
  }
};

const statusBadge = (status?: string | null, expired?: boolean) => {
  if (expired) return 'border-red-500/30 bg-red-500/10 text-red-300';
  if (status === 'active') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  if (status === 'past_due') return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  return 'border-gray-600 bg-gray-700/40 text-gray-300';
};

const CRMDashboard: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const fetchCRM = async (manual = false) => {
    manual ? setRefreshing(true) : setLoading(true);
    try {
      const [profilesResult, ticketsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, email, full_name, subscription_tier, subscription_status, connections_allowed, active_connections, subscription_expires_at, updated_at')
          .order('updated_at', { ascending: false }),
        supabase
          .from('support_tickets')
          .select('id, customer_email, status, priority, created_at')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (ticketsResult.error) console.warn('Support ticket metrics unavailable:', ticketsResult.error.message);

      setCustomers(profilesResult.data || []);
      setTickets(ticketsResult.data || []);
    } catch (error) {
      console.error('IPTV CRM load error:', error);
      setCustomers([]);
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCRM();
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const active = customers.filter(c => c.subscription_status === 'active' && (!c.subscription_expires_at || new Date(c.subscription_expires_at).getTime() > now));
    const demo = customers.filter(c => c.subscription_tier === 'demo');
    const paid = customers.filter(c => paidTiers.includes(c.subscription_tier || ''));
    const expiring24 = customers.filter(c => {
      if (!c.subscription_expires_at) return false;
      const expiry = new Date(c.subscription_expires_at).getTime();
      return expiry > now && expiry - now <= 24 * 60 * 60 * 1000;
    });
    const expiring72 = customers.filter(c => {
      if (!c.subscription_expires_at) return false;
      const expiry = new Date(c.subscription_expires_at).getTime();
      return expiry > now && expiry - now <= 72 * 60 * 60 * 1000;
    });
    const expired = customers.filter(c => c.subscription_expires_at && new Date(c.subscription_expires_at).getTime() <= now);
    const inactive = customers.filter(c => c.subscription_status !== 'active');
    const overLimit = customers.filter(c => (c.active_connections || 0) > (c.connections_allowed || 0));
    const totalAllowed = customers.reduce((sum, c) => sum + (c.connections_allowed || 0), 0);
    const totalActive = customers.reduce((sum, c) => sum + (c.active_connections || 0), 0);
    const openTickets = tickets.filter(t => !['closed', 'resolved'].includes((t.status || 'open').toLowerCase()));
    const urgentTickets = tickets.filter(t => (t.priority || '').toLowerCase() === 'high' && !['closed', 'resolved'].includes((t.status || 'open').toLowerCase()));

    return {
      total: customers.length,
      active: active.length,
      demo: demo.length,
      paid: paid.length,
      expiring24: expiring24.length,
      expiring72: expiring72.length,
      expired: expired.length,
      inactive: inactive.length,
      overLimit: overLimit.length,
      totalAllowed,
      totalActive,
      openTickets: openTickets.length,
      urgentTickets: urgentTickets.length,
      utilization: totalAllowed ? Math.round((totalActive / totalAllowed) * 100) : 0,
      demoConversionBase: demo.length,
    };
  }, [customers, tickets]);

  const tierCounts = useMemo(() => tierOrder.map(tier => ({
    tier,
    label: tierLabel(tier),
    count: customers.filter(c => c.subscription_tier === tier).length,
  })), [customers]);

  const filteredCustomers = useMemo(() => {
    const now = Date.now();
    return customers.filter(customer => {
      const searchable = `${customer.full_name || ''} ${customer.email || ''} ${customer.subscription_tier || ''} ${customer.subscription_status || ''}`.toLowerCase();
      if (!searchable.includes(search.toLowerCase())) return false;

      const expiry = customer.subscription_expires_at ? new Date(customer.subscription_expires_at).getTime() : null;
      const expired = Boolean(expiry && expiry <= now);
      const expiring = Boolean(expiry && expiry > now && expiry - now <= 72 * 60 * 60 * 1000);
      const overLimit = (customer.active_connections || 0) > (customer.connections_allowed || 0);

      switch (filter) {
        case 'active': return customer.subscription_status === 'active' && !expired;
        case 'demo': return customer.subscription_tier === 'demo';
        case 'paid': return paidTiers.includes(customer.subscription_tier || '');
        case 'expiring': return expiring;
        case 'expired': return expired;
        case 'inactive': return customer.subscription_status !== 'active';
        case 'overlimit': return overLimit;
        default: return true;
      }
    });
  }, [customers, search, filter]);

  const operationalCards = [
    { label: 'Active Lines', value: stats.active, helper: 'Currently entitled', icon: UserCheck, tone: 'text-emerald-300', filter: 'active' as FilterKey },
    { label: '36-Hour Trials', value: stats.demo, helper: 'Conversion queue', icon: Clock3, tone: 'text-violet-300', filter: 'demo' as FilterKey },
    { label: 'Paid Customers', value: stats.paid, helper: 'Bronze–Platinum', icon: CreditCard, tone: 'text-amber-300', filter: 'paid' as FilterKey },
    { label: 'Renewals ≤72h', value: stats.expiring72, helper: `${stats.expiring24} within 24h`, icon: TimerReset, tone: 'text-orange-300', filter: 'expiring' as FilterKey },
    { label: 'Expired Accounts', value: stats.expired, helper: 'Reactivation queue', icon: XCircle, tone: 'text-red-300', filter: 'expired' as FilterKey },
    { label: 'Connection Load', value: `${stats.totalActive}/${stats.totalAllowed}`, helper: `${stats.utilization}% utilization`, icon: Gauge, tone: 'text-cyan-300', filter: 'all' as FilterKey },
    { label: 'Open Tickets', value: stats.openTickets, helper: `${stats.urgentTickets} high priority`, icon: Headphones, tone: 'text-blue-300', path: '/admin/tickets' },
    { label: 'Over Limit', value: stats.overLimit, helper: 'Review immediately', icon: AlertTriangle, tone: 'text-red-400', filter: 'overlimit' as FilterKey },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Kristal Streams IPTV Operations</p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Subscriber Operations Center</h1>
          <p className="mt-2 max-w-3xl text-gray-400">
            Manage trials, paid subscribers, package access, concurrent connections, renewals, expirations, and support workload from one IPTV-focused dashboard.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => fetchCRM(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:border-gray-600 disabled:opacity-60"
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <Link to="/admin/customers" className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15">Customer Directory</Link>
          <Link to="/admin/tickets" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Support Queue</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {operationalCards.map(card => {
          const Icon = card.icon;
          const cardBody = (
            <div className="h-full rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 p-5 text-left transition hover:-translate-y-0.5 hover:border-gray-600">
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-white/5 p-3"><Icon className={`h-6 w-6 ${card.tone}`} /></div>
                <TrendingUp className="h-4 w-4 text-gray-600" />
              </div>
              <p className="mt-5 text-3xl font-bold text-white">{card.value}</p>
              <p className="mt-1 font-medium text-gray-200">{card.label}</p>
              <p className="mt-1 text-xs text-gray-500">{card.helper}</p>
            </div>
          );

          if ('path' in card && card.path) return <Link key={card.label} to={card.path}>{cardBody}</Link>;
          return <button key={card.label} type="button" onClick={() => setFilter(card.filter)}>{cardBody}</button>;
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-2xl border border-gray-700 bg-gray-800 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Package Distribution</h2>
              <p className="mt-1 text-sm text-gray-400">Trials and active subscription mix</p>
            </div>
            <Wifi className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-4">
            {tierCounts.map(item => {
              const percentage = stats.total ? Math.round((item.count / stats.total) * 100) : 0;
              return (
                <div key={item.tier}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${tierBadge(item.tier)}`}>{item.label}</span>
                    <span className="text-gray-300">{item.count} <span className="text-gray-500">({percentage}%)</span></span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-700">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-700 bg-gray-800 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Operations Health</h2>
              <p className="mt-1 text-sm text-gray-400">Items requiring staff attention</p>
            </div>
            <ShieldCheck className="h-6 w-6 text-emerald-300" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button onClick={() => setFilter('expiring')} className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-4 text-left">
              <BellRing className="h-5 w-5 text-orange-300" />
              <p className="mt-3 text-2xl font-bold text-white">{stats.expiring72}</p>
              <p className="text-sm text-orange-100/80">Renewal reminders due</p>
            </button>
            <button onClick={() => setFilter('expired')} className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-left">
              <Ban className="h-5 w-5 text-red-300" />
              <p className="mt-3 text-2xl font-bold text-white">{stats.expired}</p>
              <p className="text-sm text-red-100/80">Expired / reactivate</p>
            </button>
            <button onClick={() => setFilter('overlimit')} className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-left">
              <Monitor className="h-5 w-5 text-cyan-300" />
              <p className="mt-3 text-2xl font-bold text-white">{stats.overLimit}</p>
              <p className="text-sm text-cyan-100/80">Connection limit alerts</p>
            </button>
            <Link to="/admin/tickets" className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-left">
              <Activity className="h-5 w-5 text-blue-300" />
              <p className="mt-3 text-2xl font-bold text-white">{stats.openTickets}</p>
              <p className="text-sm text-blue-100/80">Open support cases</p>
            </Link>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-700 bg-gray-800 p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Subscriber Management</h2>
            <p className="mt-1 text-sm text-gray-400">Account health, package status, connection usage, and renewal priority</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'demo', 'paid', 'expiring', 'expired', 'inactive', 'overlimit'] as FilterKey[]).map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${filter === item ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {item === 'overlimit' ? 'Over Limit' : item}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search customer, email, package, or account status..."
            className="w-full rounded-xl border border-gray-700 bg-gray-900 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-primary"
          />
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400">Loading IPTV subscriber data...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="mt-5 rounded-xl border border-gray-700 bg-gray-900 p-10 text-center text-gray-400">No subscribers match this view.</div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 text-left">Subscriber</th>
                  <th className="px-4 py-3 text-left">Package</th>
                  <th className="px-4 py-3 text-left">Account</th>
                  <th className="px-4 py-3 text-left">Connections</th>
                  <th className="px-4 py-3 text-left">Expiration</th>
                  <th className="px-4 py-3 text-left">Health</th>
                  <th className="px-4 py-3 text-left">Next Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => {
                  const remaining = timeRemaining(customer.subscription_expires_at);
                  const active = customer.subscription_status === 'active' && !remaining.expired;
                  const overLimit = (customer.active_connections || 0) > (customer.connections_allowed || 0);
                  const utilization = customer.connections_allowed
                    ? Math.min(100, Math.round(((customer.active_connections || 0) / customer.connections_allowed) * 100))
                    : 0;
                  const expiringSoon = remaining.hours !== null && remaining.hours > 0 && remaining.hours <= 72;

                  let healthLabel = 'Healthy';
                  let healthClass = 'text-emerald-300';
                  let HealthIcon = CheckCircle2;
                  let nextAction = 'Monitor account';

                  if (overLimit) {
                    healthLabel = 'Over connection limit';
                    healthClass = 'text-red-300';
                    HealthIcon = AlertTriangle;
                    nextAction = 'Review active devices';
                  } else if (remaining.expired) {
                    healthLabel = 'Expired';
                    healthClass = 'text-red-300';
                    HealthIcon = XCircle;
                    nextAction = 'Send reactivation offer';
                  } else if (expiringSoon) {
                    healthLabel = 'Renewal due';
                    healthClass = 'text-orange-300';
                    HealthIcon = TimerReset;
                    nextAction = customer.subscription_tier === 'demo' ? 'Convert trial to paid' : 'Send renewal reminder';
                  } else if (!active) {
                    healthLabel = 'Inactive';
                    healthClass = 'text-gray-300';
                    HealthIcon = Ban;
                    nextAction = 'Contact customer';
                  } else if (customer.subscription_tier === 'demo') {
                    healthLabel = 'Trial active';
                    healthClass = 'text-violet-300';
                    HealthIcon = Clock3;
                    nextAction = 'Convert before expiry';
                  } else if (utilization >= 80) {
                    healthLabel = 'High usage';
                    healthClass = 'text-cyan-300';
                    HealthIcon = Gauge;
                    nextAction = 'Offer more connections';
                  }

                  return (
                    <tr key={customer.id} className="border-b border-gray-700/60 align-top hover:bg-gray-700/20">
                      <td className="px-4 py-4">
                        <div className="font-medium text-white">{customer.full_name || 'Name not set'}</div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-gray-400"><Mail className="h-3 w-3" />{customer.email || 'No email'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${tierBadge(customer.subscription_tier)}`}>{tierLabel(customer.subscription_tier)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusBadge(customer.subscription_status, remaining.expired)}`}>
                          {remaining.expired ? 'expired' : customer.subscription_status || 'inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-gray-200"><Smartphone className="h-4 w-4 text-cyan-300" />{customer.active_connections || 0} / {customer.connections_allowed || 0}</div>
                        <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-gray-700">
                          <div className={`h-full rounded-full ${overLimit ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${utilization}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-gray-200">{formatDate(customer.subscription_expires_at)}</div>
                        <div className={`mt-1 text-xs ${remaining.expired ? 'text-red-300' : expiringSoon ? 'text-orange-300' : 'text-gray-500'}`}>{remaining.label}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className={`flex items-center gap-2 font-medium ${healthClass}`}><HealthIcon className="h-4 w-4" />{healthLabel}</div>
                      </td>
                      <td className="px-4 py-4 text-gray-300">{nextAction}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-5">
          <Clock3 className="h-5 w-5 text-violet-300" />
          <h3 className="mt-3 font-semibold text-white">Trial Workflow</h3>
          <p className="mt-2 text-sm text-violet-100/75">Contact trial users before their 36-hour access expires and convert them to a paid package.</p>
        </div>
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-5">
          <TimerReset className="h-5 w-5 text-orange-300" />
          <h3 className="mt-3 font-semibold text-white">Renewal Workflow</h3>
          <p className="mt-2 text-sm text-orange-100/75">Prioritize accounts expiring within 72 hours, then reactivate expired subscribers.</p>
        </div>
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-5">
          <Monitor className="h-5 w-5 text-cyan-300" />
          <h3 className="mt-3 font-semibold text-white">Connection Workflow</h3>
          <p className="mt-2 text-sm text-cyan-100/75">Track concurrent device usage, flag over-limit accounts, and identify connection upsell opportunities.</p>
        </div>
      </div>
    </div>
  );
};

export default CRMDashboard;
