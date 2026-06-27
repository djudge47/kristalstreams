import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Building2, Handshake, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const CRMDashboard: React.FC = () => {
  const [stats, setStats] = useState({ contacts: 0, companies: 0, deals: 0, activities: 0 });

  useEffect(() => {
    const fetch = async () => {
      const [c, co, d, a] = await Promise.all([
        supabase.from('crm_contacts').select('*', { count: 'exact', head: true }),
        supabase.from('crm_companies').select('*', { count: 'exact', head: true }),
        supabase.from('crm_deals').select('*', { count: 'exact', head: true }),
        supabase.from('crm_activities').select('*', { count: 'exact', head: true }),
      ]);
      setStats({ contacts: c.count || 0, companies: co.count || 0, deals: d.count || 0, activities: a.count || 0 });
    };
    fetch();
  }, []);

  const cards = [
    { label: 'Contacts', value: stats.contacts, icon: Users, color: 'text-blue-500', path: '/admin/crm/contacts' },
    { label: 'Companies', value: stats.companies, icon: Building2, color: 'text-green-500', path: '/admin/crm/companies' },
    { label: 'Deals', value: stats.deals, icon: Handshake, color: 'text-yellow-500', path: '/admin/crm/deals' },
    { label: 'Activities', value: stats.activities, icon: Activity, color: 'text-red-500', path: '/admin/crm/activities' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">CRM Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <Link key={card.label} to={card.path} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
              <Icon className={`w-8 h-8 ${card.color} mb-4`} />
              <p className="text-3xl font-bold text-white">{card.value}</p>
              <p className="text-gray-400 text-sm mt-1">{card.label}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
export default CRMDashboard;
