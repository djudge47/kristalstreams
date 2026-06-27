import React from 'react';
import { BarChart3, Users, Eye, TrendingUp } from 'lucide-react';

const Analytics: React.FC = () => {
  const stats = [
    { label: 'Page Views', value: '—', icon: Eye, color: 'text-blue-500' },
    { label: 'Unique Visitors', value: '—', icon: Users, color: 'text-green-500' },
    { label: 'Conversion Rate', value: '—', icon: TrendingUp, color: 'text-yellow-500' },
    { label: 'Revenue', value: '—', icon: BarChart3, color: 'text-red-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <Icon className={`w-8 h-8 ${s.color} mb-4`} />
              <p className="text-3xl font-bold text-white">{s.value}</p>
              <p className="text-gray-400 text-sm mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>
      <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
        <BarChart3 size={48} className="mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400">Connect Vercel Analytics or Stripe for detailed metrics</p>
      </div>
    </div>
  );
};
export default Analytics;
