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
    <div className="min-w-0 space-y-5 sm:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary sm:text-sm sm:tracking-[0.24em]">Kristal Streams IPTV CRM</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl">IPTV Subscriber Operations Center</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400 sm:text-base">
            Track panel customers, usernames, connection limits, online sessions, expirations, account health, and renewal follow-ups.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchCustomers}
          className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-950/20 transition hover:bg-red-700 sm:w-auto"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </button>
      </div>

      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-4 shadow-lg shadow-black/10 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/20">
            <ShieldCheck className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <h2 className="font-semibold text-white">IPTV Standards View</h2>
            <p className="mt-1 text-sm text-cyan-100/80">
              This CRM is focused on IPTV service operations: account status, online state, active connections, allowed connections, expiration, and last watched channel/session.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button key={card.label} type="button" onClick={() => setFilter(card.filter)} className="h-full text-left">
              <div className="h-full rounded-2xl border border-gray-700/90 bg-gradient-to-br from-gray-800 to-gray-800/70 p-4 shadow-lg shadow-black/10 transition hover:border-gray-600 sm:p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900/80 ring-1 ring-white/5 sm:h-10 sm:w-10">
                  <Icon className={`h-5 w-5 ${card.tone} sm:h-6 sm:w-6`} />
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight text-white sm:mt-4 sm:text-3xl">{card.value}</p>
                <p className="mt-1 text-[11px] font-medium leading-4 text-gray-400 sm:text-sm">{card.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="min-w-0 rounded-2xl border border-gray-700 bg-gray-800/90 p-3 shadow-xl shadow-black/10 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Subscriber Management</h2>
            <p className="mt-1 text-sm text-gray-400">Imported IPTV panel accounts from your customer list.</p>
          </div>
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
            {(['all', 'online', 'active', 'expired', 'expiring', 'over-limit'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === item ? 'bg-primary text-white shadow-md shadow-red-950/20' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
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
            placeholder="Search accounts, IDs, owners or channels..."
            className="w-full rounded-xl border border-gray-700 bg-gray-900 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary/30"
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
          <>
            <div className="space-y-3 lg:hidden">
              {filteredCustomers.map((customer) => {
                const health = getHealth(customer);
                return (
                  <article key={`mobile-${customer.id}`} className="overflow-hidden rounded-2xl border border-gray-700/90 bg-gray-900/80 shadow-lg shadow-black/15">
                    <div className="flex items-start justify-between gap-3 border-b border-gray-800 bg-gradient-to-r from-gray-800/90 to-gray-900/70 p-4">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-white">{customer.username}</h3>
                          {customer.trial && (
                            <span className="shrink-0 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-300 ring-1 ring-purple-500/20">Trial</span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Customer ID {customer.external_id}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${health.className}`}>
                        {health.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-4">
                      <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Status</p>
                        <div className="mt-1.5">
                          {customer.online ? (
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-300"><Wifi className="h-4 w-4" /> Online</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400"><WifiOff className="h-4 w-4" /> Offline</span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Connections</p>
                        <p className="mt-1 text-lg font-bold text-white">
                          {customer.active_connections}<span className="mx-1 text-sm font-normal text-gray-600">/</span>{customer.connections_allowed}
                        </p>
                      </div>

                      <div className="col-span-2 rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Expiration</p>
                            <p className="mt-1 text-sm font-medium text-gray-200">{formatDateTime(customer.expiration_at)}</p>
                          </div>
                          <span className="shrink-0 rounded-lg bg-gray-800 px-2 py-1 text-xs font-semibold text-gray-300">{getTimeRemaining(customer.expiration_at)}</span>
                        </div>
                      </div>

                      <div className="col-span-2 rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                        <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Password</p>
                            <span className="mt-1 inline-flex max-w-full items-center gap-1.5 font-mono text-xs text-gray-300">
                              <KeyRound className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                              <span className="break-all">{customer.iptv_password || '—'}</span>
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Owner</p>
                            <p className="mt-1 break-words text-xs text-gray-300">{customer.owner || '—'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Last Activity</p>
                        <div className="mt-1.5 flex min-w-0 items-start gap-1.5 text-sm text-gray-300">
                          <Signal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
                          <span className="min-w-0 break-words">{customer.last_channel || customer.last_connection_label || 'Never connected'}</span>
                        </div>
                        {customer.last_channel && customer.last_connection_label && (
                          <p className="mt-1 pl-5 text-xs text-gray-500">{customer.last_connection_label}</p>
                        )}
                        {!customer.last_channel && customer.last_connection_at && (
                          <p className="mt-1 pl-5 text-xs text-gray-500">{formatDateTime(customer.last_connection_at)}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 border-t border-gray-800 bg-gray-950/40 px-4 py-3">
                      <Activity className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Recommended Action</p>
                        <p className="mt-0.5 text-sm font-medium text-gray-200">{getAction(customer)}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto lg:block">
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
          </>
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
