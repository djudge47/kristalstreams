import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  LayoutDashboard, Tv, Users, TicketCheck, BarChart3,
  Image, Film, Calendar, List, Building2, Handshake,
  Activity, LogOut, ChevronLeft, Menu
} from 'lucide-react';

const ADMIN_EMAIL = 'djudge47@gmail.com';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/channels', label: 'Channels', icon: Tv },
  { path: '/admin/customers', label: 'Customers', icon: Users },
  { path: '/admin/tickets', label: 'Support Tickets', icon: TicketCheck },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/admin/slider', label: 'Slider Manager', icon: Image },
  { path: '/admin/demo-reel', label: 'Demo Reel', icon: Film },
  { path: '/admin/schedule', label: 'Schedule', icon: Calendar },
  { path: '/admin/programs', label: 'Programs', icon: List },
  { divider: true, label: 'CRM' },
  { path: '/admin/crm', label: 'CRM Dashboard', icon: Handshake, exact: true },
  { path: '/admin/crm/contacts', label: 'Contacts', icon: Users },
  { path: '/admin/crm/companies', label: 'Companies', icon: Building2 },
  { path: '/admin/crm/deals', label: 'Deals', icon: Handshake },
  { path: '/admin/crm/activities', label: 'Activities', icon: Activity },
];

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email === ADMIN_EMAIL) {
        setAuthorized(true);
      } else {
        navigate('/login');
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-950 border-r border-gray-800 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-lg font-bold text-red-500">KS Admin</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white">
            {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item, i) => {
            if ('divider' in item && item.divider) {
              return sidebarOpen ? (
                <div key={i} className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  {item.label}
                </div>
              ) : <div key={i} className="border-t border-gray-800 my-2" />;
            }

            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path!);

            const Icon = item.icon!;

            return (
              <Link
                key={item.path}
                to={item.path!}
                className={`flex items-center px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-red-600/20 text-red-500'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="ml-3 text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-400 hover:text-white w-full px-2 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="ml-3 text-sm">Sign Out</span>}
          </button>
          <Link
            to="/"
            className="flex items-center text-gray-400 hover:text-white w-full px-2 py-2 rounded-lg hover:bg-gray-800 transition-colors mt-1"
          >
            <ChevronLeft size={20} />
            {sidebarOpen && <span className="ml-3 text-sm">Back to Site</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
