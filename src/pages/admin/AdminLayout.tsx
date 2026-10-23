import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { unavailableAdminModule } from '../../lib/admin-modules';
import {
  LayoutDashboard, Users, TicketCheck, List,
  LogOut, ChevronLeft, Menu, Wifi, HelpCircle
} from 'lucide-react';

const ADMIN_EMAIL = 'djudge47@gmail.com';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/roomba', label: 'Roomba Connection', icon: Wifi },
  { path: '/admin/setup', label: 'Prepare Setup', icon: List },
  { path: '/admin/crm', label: 'Customer Workspace', icon: Users, exact: true },
  { path: '/admin/tickets', label: 'Support Tickets', icon: TicketCheck },
  { path: '/admin/modules', label: 'Unavailable Modules', icon: HelpCircle },
];

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  useEffect(() => {
    let active = true;
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!active) return;
        if (user?.email === ADMIN_EMAIL) {
          setAuthorized(true);
        } else {
          navigate('/login', { replace: true, state: { from: returnTo } });
        }
      } catch {
        if (active) navigate('/login', { replace: true, state: {
          from: returnTo, message: 'Your account could not be checked. Please sign in again.',
        } });
      } finally {
        if (active) setLoading(false);
      }
    };
    void checkAuth();
    return () => { active = false; };
  }, [navigate, location.pathname, location.search, location.hash]);

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
    <div className="flex h-screen overflow-hidden bg-gray-900 supports-[height:100dvh]:h-dvh">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0 lg:w-64' : '-translate-x-full lg:w-16 lg:translate-x-0'} fixed inset-y-0 left-0 z-40 flex h-full w-72 max-w-[86vw] shrink-0 flex-col border-r border-gray-800 bg-gray-950 shadow-2xl shadow-black/40 transition-[transform,width] duration-300 lg:static lg:max-w-none lg:shadow-none`}>
        <div className="shrink-0 p-4 border-b border-gray-800 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-lg font-bold text-red-500">KS Admin</h1>}
          <button
            type="button"
            onClick={() => setSidebarOpen(open => !open)}
            aria-label={sidebarOpen ? 'Collapse admin navigation' : 'Expand admin navigation'}
            aria-expanded={sidebarOpen}
            aria-controls="admin-navigation"
            className="inline-flex min-h-11 min-w-6 items-center justify-center text-gray-400 hover:text-white"
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav id="admin-navigation" aria-label="Admin pages" className="min-h-0 flex-1 overflow-y-auto py-4">
          {navItems.map(item => {
            const isActive = item.path === '/admin/modules'
              ? location.pathname === item.path || Boolean(unavailableAdminModule(location.pathname))
              : item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

            const Icon = item.icon!;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebarOnMobile}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                title={sidebarOpen ? undefined : item.label}
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

        <div className="shrink-0 p-4 border-t border-gray-800">
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign Out"
            title="Sign Out"
            className="flex min-h-11 w-full items-center rounded-lg px-2 py-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white lg:hidden"
          >
            <LogOut size={20} aria-hidden="true" />
            <span className="ml-3 text-sm">Sign Out</span>
          </button>
          <Link
            to="/"
            aria-label="Back to Site"
            title="Back to Site"
            onClick={closeSidebarOnMobile}
            className="flex items-center text-gray-400 hover:text-white w-full px-2 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft size={20} />
            {sidebarOpen && <span className="ml-3 text-sm">Back to Site</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="h-full min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-gray-800/90 bg-gray-900/95 px-3 py-3 backdrop-blur sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-gray-200 shadow-sm lg:hidden"
              aria-label="Open admin navigation"
              aria-expanded={sidebarOpen}
              aria-controls="admin-navigation"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">KS Admin</p>
              <p className="hidden text-xs text-gray-400 sm:block">Admin Operations</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-200 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <LogOut size={18} aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
        <div className="min-w-0 px-3 py-4 sm:p-5 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
