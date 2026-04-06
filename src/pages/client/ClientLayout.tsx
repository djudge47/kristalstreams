import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  User, 
  Settings, 
  CreditCard, 
  Monitor, 
  History,
  Shield,
  MessageSquare
} from 'lucide-react';

const navigation = [
  { name: 'Account', path: '/client/account', icon: User },
  { name: 'Subscription', path: '/client/subscription', icon: CreditCard },
  { name: 'Devices', path: '/client/devices', icon: Monitor },
  { name: 'History', path: '/client/history', icon: History },
  { name: 'Security', path: '/client/security', icon: Shield },
  { name: 'Support', path: '/client/support', icon: MessageSquare },
  { name: 'Settings', path: '/client/settings', icon: Settings },
];

const ClientLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen py-32 bg-dark-300">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-400 hover:bg-dark-200 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default ClientLayout;