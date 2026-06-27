import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Tv, TicketCheck, TrendingUp } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ channels: 0, tickets: 0, users: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [channels, tickets] = await Promise.all([
        supabase.from('channels').select('*', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        channels: channels.count || 0,
        tickets: tickets.count || 0,
        users: 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Channels', value: stats.channels, icon: Tv, color: 'text-blue-500' },
    { label: 'Support Tickets', value: stats.tickets, icon: TicketCheck, color: 'text-yellow-500' },
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-green-500' },
    { label: 'Revenue', value: '$0', icon: TrendingUp, color: 'text-red-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Icon className={`w-8 h-8 ${card.color}`} />
              </div>
              <p className="text-3xl font-bold text-white">{card.value}</p>
              <p className="text-gray-400 text-sm mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <p className="text-gray-400">No recent activity to show.</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a href="/admin/channels" className="block bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors">
              Manage Channels
            </a>
            <a href="/admin/customers" className="block bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors">
              View Customers
            </a>
            <a href="/admin/tickets" className="block bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors">
              Support Tickets
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
