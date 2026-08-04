import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity, AlertTriangle, Clock, Crown, Mail, Monitor, Search, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

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

const paidTiers = ['bronze', 'silver', 'gold', 'platinum'];

const formatDate = (value?: string | null) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const getTimeRemaining = (value?: string | null) => {
  if (!value) return 'No expiration';
  const expires = new Date(value).getTime();
  const diff = expires - Date.now();
  if (Number.isNaN(expires)) return 'No expiration';
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h left`;
  return `${hours}h left`;
};

const getTierLabel = (tier?: string | null) => {
  if (!tier) return 'No Plan';
  if (tier === 'demo') return '36-Hour Demo';
  return tier.charAt(0).toUpperCase() + tier.slice(1);
};

const getTierBadgeClass = (tier?: string | null) => {
  switch (tier) {
    case 'demo':
      return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30';
    case 'bronze':
      return 'bg-orange-500/10 text-orange-300 border-orange-500/30';
    case 'silver':
      return 'bg-slate-300/10 text-slate-200 border-slate-300/30';
    case 'gold':
      return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    case 'platinum':
      return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
    default:
      return 'bg-gray-500/10 text-gray-300 border-gray-500/30';
  }
};

const CRMDashboard: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'demo' | 'paid' | 'expired' | 'inactive'>('all');

  useEffect(() => {
    const fetchCRM = async () => {
      setLoading(true);
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
            .limit(50),
        ]);

        if (profilesResult.error) throw profilesResult.error;
        if (ticketsResult.error) console.warn('CRM tickets unavailable:', ticketsResult.error.message);

        setCustomers(profilesResult.data || []);
        setTickets(ticketsResult.data || []);
      } catch (error) {
        console.error('CRM dashboard load error:', error);
        setCustomers([]);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCRM();
  }, []);

  const now = Date.now();

  const stats = useMemo(() => {
    const active = customers.filter((customer) => customer.subscription_status === 'active');
    const demo = customers.filter((customer) => customer.subscription_tier === 'demo');
    const paid = customers.filter((customer) => paidTiers.includes(customer.subscription_tier || ''));
    const expired = customers.filter((customer) => {
      if (!customer.subscription_expires_at) return false;
      return new Date(customer.subscription_expires_at).getTime() < now;
    });
    const expiringSoon = customers.filter((customer) => {
      if (!customer.subscription_expires_at) return false;
      const expires = new Date(customer.subscription_expires_at).getTime();
      return expires > now && expires - now <= 3 * 24 * 60 * 60 * 1000;
    });
    const openTickets = tickets.filter((ticket) => (ticket.status || 'open') === 'open');

    return {
      total: customers.length,
      active: active.length,
      demo: demo.length,
      paid: paid.length,
      expired: expired.length,
      expiringSoon: expiringSoon.length,
      openTickets: openTickets.length,
      connections: customers.reduce((sum, customer) => sum + (customer.connections_allowed || 0), 0),
    };
  }, [customers, now, tickets]);

  const tierCounts = useMemo(() => {
    return ['demo', 'bronze', 'silver', 'gold', 'platinum'].map((tier) => ({
      tier,
      label: getTierLabel(tier),
      count: customers.filter((customer) => customer.subscription_tier === tier).length,
    }));
  }, [customers]);

  const filteredCustomers = customers.filter((customer) => {
    const text = `${customer.email || ''} ${customer.full_name || ''} ${customer.subscription_tier || ''} ${customer.subscription_status || ''}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const expiresAt = customer.subscription_expires_at ? new Date(customer.subscription_expires_at).getTime() : null;
    const isExpired = Boolean(expiresAt && expiresAt < now);
    const isPaid = paidTiers.includes(customer.subscription_tier || '');

    if (!matchesSearch) return false;
    if (filter === 'demo') return customer.subscription_tier === 'demo';
    if (filter === 'paid') return isPaid;
    if (filter === 'expired') return isExpired;
    if (filter === 'inactive') return customer.subscription_status !== 'active';
    return true;
  });

  const statCards = [
    { label: 'Total Customers', value: stats.total, icon: Users, tone: 'text-blue-400', filter: 'all' as const },
    { label: '36-Hour Demos', value: stats.demo, icon: Clock, tone: 'text-yellow-300', filter: 'demo' as const },
    { label: 'Paid Accounts', value: stats.paid, icon: Crown, tone: 'text-amber-300', filter: 'paid' as const },
    { label: 'Expiring Soon', value: stats.expiringSoon, icon: AlertTriangle, tone: 'text-red-300', filter: 'expired' as const },
    { label: 'Open Tickets', value: stats.openTickets, icon: Activity, tone: 'text-green-300', path: '/admin/tickets' },
    { label: 'Allowed Connections', value: stats.connections, icon: Monitor, tone: 'text-cyan-300', filter: 'all' as const },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Kristal Streams CRM</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Customer Command Center</h1>
          <p className="mt-2 max-w-3xl text-gray-400">
            Track demo users, paid subscribers, plan tiers, connection limits, expirations, and follow-up needs from one dashboard.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/customers" className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15">Customer List</Link>
          <Link to="/admin/tickets" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Support Tickets</Link>
        </div>
      </div>

      <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 h-5 w-5 text-yellow-300" />
          <div>
            <h2 className="font-semibold text-white">Demo vs Paid Access</h2>
            <p className="mt-1 text-sm text-yellow-100/80">
              The 36-hour demo is temporary trial access with 1 connection. Bronze, Silver, Gold, and Platinum are paid tiers with longer access periods and selectable connection counts.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          const content = (
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-5 transition hover:border-gray-600">
              <div className="flex items-center justify-between">
                <Icon className={`h-7 w-7 ${card.tone}`} />
                <TrendingUp className="h-4 w-4 text-gray-500" />
              </div>
              <p className="mt-4 text-3xl font-bold text-white">{card.value}</p>
              <p className="mt-1 text-sm text-gray-400">{card.label}</p>
            </div>
          );

          if ('path' in card && card.path) {
            return <Link key={card.label} to={card.path}>{content}</Link>;
          }

          return (
            <button key={card.label} type="button" onClick={() => setFilter(card.filter)} className="text-left">
              {content}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
          <h2 className="mb-5 text-xl font-semibold text-white">Tier Breakdown</h2>
          <div className="space-y-4">
            {tierCounts.map((item) => (
              <div key={item.tier}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-gray-300">{item.label}</span>
                  <span className="text-white">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${stats.total ? Math.max(4, (item.count / stats.total) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-xl font-semibold text-white">Customer Pipeline</h2>
            <div className="flex flex-wrap gap-2">
              {(['all', 'demo', 'paid', 'expired', 'inactive'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${filter === item ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, plan, or status..."
              className="w-full rounded-lg border border-gray-700 bg-gray-900 py-2 pl-10 pr-4 text-sm text-white outline-none focus:border-primary"
            />
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading CRM...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="rounded-lg border border-gray-700 bg-gray-900 p-8 text-center text-gray-400">No matching customers found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400">
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Access</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Connections</th>
                    <th className="px-4 py-3 text-left">Expires</th>
                    <th className="px-4 py-3 text-left">Follow-up</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.slice(0, 12).map((customer) => {
                    const isDemo = customer.subscription_tier === 'demo';
                    return (
                      <tr key={customer.id} className="border-b border-gray-700/60 hover:bg-gray-700/25">
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{customer.full_name || 'Name not set'}</div>
                          <div className="mt-1 flex items-center gap-1 text-xs text-gray-400"><Mail className="h-3 w-3" />{customer.email || 'No email'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getTierBadgeClass(customer.subscription_tier)}`}>
                            {getTierLabel(customer.subscription_tier)}
                          </span>
                        </td>
                        <td className="px-4 py-3 capitalize text-gray-300">{customer.subscription_status || 'inactive'}</td>
                        <td className="px-4 py-3 text-gray-300">{customer.active_connections || 0} / {customer.connections_allowed || 0}</td>
                        <td className="px-4 py-3">
                          <div className="text-gray-300">{formatDate(customer.subscription_expires_at)}</div>
                          <div className={`text-xs ${isDemo ? 'text-yellow-300' : 'text-gray-500'}`}>{getTimeRemaining(customer.subscription_expires_at)}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {isDemo ? 'Convert demo to paid plan' : customer.subscription_status === 'active' ? 'Maintain / upsell connections' : 'Reactivate customer'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CRMDashboard;
