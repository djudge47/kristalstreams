import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  KeyRound,
  Mail,
  Monitor,
  RefreshCw,
  Search,
  ShieldCheck,
  Signal,
  TimerReset,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';

type IptvCustomer = {
  id: string;
  external_id: number;
  username: string;
  iptv_password: string | null;
  owner: string | null;
  account_status: string;
  online: boolean;
  trial: boolean;
  active_connections: number;
  connections_allowed: number;
  expiration_at: string | null;
  last_connection_at: string | null;
  last_connection_label: string | null;
  last_channel: string | null;
  updated_at: string | null;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getTimeRemaining = (value?: string | null) => {
  if (!value) return 'No expiration';
  const expires = new Date(value).getTime();
  if (Number.isNaN(expires)) return 'No expiration';

  const diff = expires - Date.now();
  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days}d ${hours % 24}h left`;
  return `${hours}h left`;
};

const getHealth = (customer: IptvCustomer) => {
  const expires = customer.expiration_at ? new Date(customer.expiration_at).getTime() : null;
  const expired = Boolean(expires && expires < Date.now());
  const expiringSoon = Boolean(expires && expires > Date.now() && expires - Date.now() <= 72 * 60 * 60 * 1000);
  const overLimit = customer.active_connections > customer.connections_allowed;

  if (expired || customer.account_status === 'expired') return { label: 'Expired', className: 'bg-red-500/10 text-red-300 border-red-500/30' };
  if (overLimit) return { label: 'Over Limit', className: 'bg-orange-500/10 text-orange-300 border-orange-500/30' };
  if (expiringSoon) return { label: 'Renewal Due', className: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' };
  if (customer.online) return { label: 'Online', className: 'bg-green-500/10 text-green-300 border-green-500/30' };
  if (customer.account_status === 'active') return { label: 'Active', className: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' };
  return { label: 'Inactive', className: 'bg-gray-500/10 text-gray-300 border-gray-500/30' };
};

const getAction = (customer: IptvCustomer) => {
  const expires = customer.expiration_at ? new Date(customer.expiration_at).getTime() : null;
  const expired = Boolean(expires && expires < Date.now());
  const expiringSoon = Boolean(expires && expires > Date.now() && expires - Date.now() <= 72 * 60 * 60 * 1000);

  if (expired || customer.account_status === 'expired') return 'Reactivate or remove access';
  if (customer.trial) return 'Convert trial to paid';
  if (customer.active_connections > customer.connections_allowed) return 'Review device limit';
  if (expiringSoon) return 'Send renewal reminder';
  if (customer.online) return 'Monitor live session';
  return 'Maintain account';
};

const CRMDashboard: React.FC = () => {
  const [customers, setCustomers] = useState<IptvCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'online' | 'active' | 'expired' | 'expiring' | 'over-limit'>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('iptv_customers')
        .select('*')
        .order('expiration_at', { ascending: true });

      if (queryError) throw queryError;
      setCustomers(data || []);
    } catch (err) {
      console.error('IPTV CRM load error:', err);
      setError(err instanceof Error ? err.message : 'Unable to load IPTV customers.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const now = Date.now();

  const stats = useMemo(() => {
    const online = customers.filter((customer) => customer.online);
    const active = customers.filter((customer) => customer.account_status === 'active');
    const expired = customers.filter((customer) => {
      const expires = customer.expiration_at ? new Date(customer.expiration_at).getTime() : null;
      return customer.account_status === 'expired' || Boolean(expires && expires < now);
    });
    const expiring = customers.filter((customer) => {
      const expires = customer.expiration_at ? new Date(customer.expiration_at).getTime() : null;
      return Boolean(expires && expires > now && expires - now <= 72 * 60 * 60 * 1000);
    });
    const overLimit = customers.filter((customer) => customer.active_connections > customer.connections_allowed);

    return {
      total: customers.length,
      online: online.length,
      active: active.length,
      expired: expired.length,
      expiring: expiring.length,
      overLimit: overLimit.length,
      liveConnections: customers.reduce((sum, customer) => sum + Number(customer.active_connections || 0), 0),
      allowedConnections: customers.reduce((sum, customer) => sum + Number(customer.connections_allowed || 0), 0),
    };
  }, [customers, now]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const expires = customer.expiration_at ? new Date(customer.expiration_at).getTime() : null;
      const expired = customer.account_status === 'expired' || Boolean(expires && expires < now);
      const expiring = Boolean(expires && expires > now && expires - now <= 72 * 60 * 60 * 1000);
      const overLimit = customer.active_connections > customer.connections_allowed;
      const haystack = `${customer.external_id} ${customer.username} ${customer.iptv_password || ''} ${customer.owner || ''} ${customer.account_status} ${customer.last_channel || ''}`.toLowerCase();

      if (!haystack.includes(search.toLowerCase())) return false;
      if (filter === 'online') return customer.online;
      if (filter === 'active') return customer.account_status === 'active' && !expired;
      if (filter === 'expired') return expired;
      if (filter === 'expiring') return expiring;
      if (filter === 'over-limit') return overLimit;
      return true;
    });
  }, [customers, filter, now, search]);

  const statCards = [
    { label: 'Total IPTV Accounts', value: stats.total, icon: Users, tone: 'text-blue-300', filter: 'all' as const },
    { label: 'Online Now', value: stats.online, icon: Wifi, tone: 'text-green-300', filter: 'online' as const },
    { label: 'Active Accounts', value: stats.active, icon: CheckCircle, tone: 'text-cyan-300', filter: 'active' as const },
    { label: 'Expired Accounts', value: stats.expired, icon: AlertTriangle, tone: 'text-red-300', filter: 'expired' as const },
    { label: 'Expiring 72h', value: stats.expiring, icon: TimerReset, tone: 'text-yellow-300', filter: 'expiring' as const },
    { label: 'Live / Allowed Connections', value: `${stats.liveConnections}/${stats.allowedConnections}`, icon: Monitor, tone: 'text-purple-300', filter: 'all' as const },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Kristal Streams IPTV CRM</p>
          <h1 className="mt-2 text-3xl font-bold text-white">IPTV Subscriber Operations Center</h1>
          <p className="mt-2 max-w-3xl text-gray-400">
            Track panel customers, usernames, connection limits, online sessions, expirations, account health, and renewal follow-ups.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchCustomers}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </button>
      </div>

      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 h-5 w-5 text-cyan-300" />
          <div>
            <h2 className="font-semibold text-white">IPTV Standards View</h2>
            <p className="mt-1 text-sm text-cyan-100/80">
              This CRM is focused on IPTV service operations: account status, online state, active connections, allowed connections, expiration, and last watched channel/session.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button key={card.label} type="button" onClick={() => setFilter(card.filter)} className="text-left">
              <div className="rounded-xl border border-gray-700 bg-gray-800 p-5 transition hover:border-gray-600">
                <Icon className={`h-7 w-7 ${card.tone}`} />
                <p className="mt-4 text-3xl font-bold text-white">{card.value}</p>
                <p className="mt-1 text-sm text-gray-400">{card.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Subscriber Management</h2>
            <p className="mt-1 text-sm text-gray-400">Imported IPTV panel accounts from your customer list.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'online', 'active', 'expired', 'expiring', 'over-limit'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${filter === item ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {item.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by ID, username, password, owner, status, or channel..."
            className="w-full rounded-lg border border-gray-700 bg-gray-900 py-2 pl-10 pr-4 text-sm text-white outline-none focus:border-primary"
          />
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading IPTV customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-8 text-center text-gray-400">No matching IPTV customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Username</th>
                  <th className="px-4 py-3 text-left">Password</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-left">Health</th>
                  <th className="px-4 py-3 text-left">Online</th>
                  <th className="px-4 py-3 text-left">Connections</th>
                  <th className="px-4 py-3 text-left">Expiration</th>
                  <th className="px-4 py-3 text-left">Last Connection</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => {
                  const health = getHealth(customer);
                  return (
                    <tr key={customer.id} className="border-b border-gray-700/60 hover:bg-gray-700/25">
                      <td className="px-4 py-3 text-gray-300">{customer.external_id}</td>
                      <td className="px-4 py-3 text-white">{customer.username}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded bg-gray-900 px-2 py-1 font-mono text-xs text-gray-300">
                          <KeyRound className="h-3 w-3" />
                          {customer.iptv_password || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{customer.owner || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${health.className}`}>
                          {health.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {customer.online ? (
                          <span className="inline-flex items-center gap-1 text-green-300"><Wifi className="h-4 w-4" /> Online</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-400"><WifiOff className="h-4 w-4" /> Offline</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        <span className="rounded bg-gray-700 px-2 py-1 text-white">{customer.active_connections}</span>
                        <span className="mx-1 text-gray-500">/</span>
                        <span className="rounded bg-gray-700 px-2 py-1 text-white">{customer.connections_allowed}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-300">{formatDateTime(customer.expiration_at)}</div>
                        <div className="text-xs text-gray-500">{getTimeRemaining(customer.expiration_at)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-gray-300"><Signal className="h-3 w-3" />{customer.last_channel || customer.last_connection_label || 'Never'}</div>
                        {customer.last_channel && <div className="mt-1 text-xs text-gray-500">{customer.last_connection_label}</div>}
                        {!customer.last_channel && customer.last_connection_at && <div className="mt-1 text-xs text-gray-500">{formatDateTime(customer.last_connection_at)}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-300">{getAction(customer)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
          <Clock className="mb-3 h-6 w-6 text-yellow-300" />
          <h3 className="font-semibold text-white">Renewal Workflow</h3>
          <p className="mt-2 text-sm text-gray-400">Use the expiring and expired filters to contact customers before access ends.</p>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
          <Monitor className="mb-3 h-6 w-6 text-cyan-300" />
          <h3 className="font-semibold text-white">Connection Management</h3>
          <p className="mt-2 text-sm text-gray-400">Review accounts using multiple connections and upsell additional device slots when needed.</p>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
          <Mail className="mb-3 h-6 w-6 text-green-300" />
          <h3 className="font-semibold text-white">Customer Follow-Up</h3>
          <p className="mt-2 text-sm text-gray-400">Use the action column to prioritize renewal, reactivation, and device-limit support.</p>
        </div>
      </div>
    </div>
  );
};

export default CRMDashboard;
