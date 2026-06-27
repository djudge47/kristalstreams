import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Users, Mail, Calendar } from 'lucide-react';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data } = await supabase.from('stripe_customers').select('*').order('created_at', { ascending: false });
        setCustomers(data || []);
      } catch { setCustomers([]); }
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  const filtered = customers.filter(c =>
    JSON.stringify(c).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="text-gray-400">{customers.length} total</p>
      </div>
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white" />
      </div>
      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
          <Users size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No customers found</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-700">
              <th className="text-left text-gray-400 text-sm px-4 py-3">Customer</th>
              <th className="text-left text-gray-400 text-sm px-4 py-3">Email</th>
              <th className="text-left text-gray-400 text-sm px-4 py-3">Status</th>
              <th className="text-left text-gray-400 text-sm px-4 py-3">Joined</th>
            </tr></thead>
            <tbody>{filtered.map((c, i) => (
              <tr key={c.id || i} className="border-b border-gray-700/50 hover:bg-gray-750">
                <td className="px-4 py-3 text-white text-sm">{c.name || c.customer_id || '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-sm flex items-center gap-2"><Mail size={14} />{c.email || '—'}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-green-900/50 text-green-400">{c.status || 'Active'}</span></td>
                <td className="px-4 py-3 text-gray-400 text-sm flex items-center gap-2"><Calendar size={14} />{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default Customers;
