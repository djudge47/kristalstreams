import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  LayoutDashboard, Users, TicketCheck, BarChart3,
  Image, Film, List, Building2, Handshake,
  Activity, LogOut, ChevronLeft, Menu
} from 'lucide-react';

const ADMIN_EMAIL = 'djudge47@gmail.com';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/customers', label: 'Customers', icon: Users },
  { path: '/admin/tickets', label: 'Support Tickets', icon: TicketCheck },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/admin/slider', label: 'Slider Manager', icon: Image },
  { path: '/admin/demo-reel', label: 'Demo Reel', icon: Film },
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
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

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

  const closeSidebarOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
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
    <div className="min-h-screen bg-gray-900 lg:flex">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0 lg:w-64' : '-translate-x-full lg:w-16 lg:translate-x-0'} fixed inset-y-0 left-0 z-40 flex w-72 max-w-[86vw] flex-col border-r border-gray-800 bg-gray-950 shadow-2xl shadow-black/40 transition-[transform,width] duration-300 lg:static lg:max-w-none lg:shadow-none`}>
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
                onClick={closeSidebarOnMobile}
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
            onClick={closeSidebarOnMobile}
            className="flex items-center text-gray-400 hover:text-white w-full px-2 py-2 rounded-lg hover:bg-gray-800 transition-colors mt-1"
          >
            <ChevronLeft size={20} />
            {sidebarOpen && <span className="ml-3 text-sm">Back to Site</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-800/90 bg-gray-900/95 px-3 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-gray-200 shadow-sm"
            aria-label="Open admin navigation"
          >
            <Menu size={20} />
          </button>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-400">Kristal Streams</p>
            <p className="text-sm font-semibold text-white">Admin Operations</p>
          </div>
        </div>
        <div className="min-w-0 px-3 py-4 sm:p-5 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
