import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Newspaper, 
  Coins, 
  BarChart3, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X,
  CreditCard,
  Banknote,
  LineChart,
  Settings,
  Bell,
  Search,
  Activity,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_GROUPS = [
  {
    group: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    ]
  },
  {
    group: 'Audience',
    items: [
      { icon: Users, label: 'Users', path: '/admin/users' },
      { icon: LineChart, label: 'Audience Reports', path: '/admin/reports/audience' },
    ]
  },
  {
    group: 'Intelligence',
    items: [
      { icon: Activity, label: 'Real-Time Analytics', path: '/admin/analytics' },
      { icon: Search, label: 'Usage Reports', path: '/admin/reports/usage' },
    ]
  },
  {
    group: 'Monetization',
    items: [
      { icon: DollarSign, label: 'Financial Reports', path: '/admin/reports/financial' },
      { icon: Coins, label: 'Credits', path: '/admin/credits' },
    ]
  },
  {
    group: 'Operations',
    items: [
      { icon: Newspaper, label: 'Global News', path: '/admin/news' },
    ]
  }
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[#111114] text-white">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 240 : 80 }}
        className="relative flex flex-col bg-[#111114] z-50 transition-colors border-r border-[#1e1f24]"
      >
        <div className="flex h-20 items-center justify-between px-6">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div 
                key="logo-full"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="h-8 w-8 rounded flex items-center justify-center -rotate-45 bg-gradient-to-tr from-brand-accent to-orange-500 overflow-hidden">
                   {/* Logo mock */}
                </div>
                <span className="font-sans text-lg font-bold tracking-tight text-white">Heroic Dashboard</span>
              </motion.div>
            ) : (
              <motion.div 
                key="logo-short"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="mx-auto h-8 w-8 rounded flex items-center justify-center -rotate-45 bg-gradient-to-tr from-brand-accent to-orange-500"
              >
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 space-y-6 px-4 py-6 overflow-y-auto custom-scrollbar">
          {NAV_GROUPS.map((group) => (
            <div key={group.group} className="space-y-1">
              {isSidebarOpen && (
                <h3 className="px-4 text-xs font-bold text-brand-text-muted mb-2">
                  {group.group}
                </h3>
              )}
              {group.items.map((item) => {
                const isActive = location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin');
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-4 rounded-[1.5rem] px-4 py-3 transition-all duration-200",
                      isActive 
                        ? "bg-[#292a32] text-white shadow-lg" 
                        : "text-[#8b8c94] hover:bg-[#1a1b21] hover:text-white"
                    )}
                  >
                    <item.icon size={18} className={cn(isActive ? "text-brand-accent" : "")} />
                    {isSidebarOpen && <span className="text-body font-medium">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-[#1e1f24] p-4 space-y-2">
          
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-4 rounded-[1.5rem] px-4 py-3 text-[#8b8c94] transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>

      </motion.aside>

      {/* Main Content */}
      <main className="relative flex-1 overflow-y-auto bg-[#141416] m-4 rounded-[2rem] border border-[#1e1f24] inner-shadow-sm flex flex-col">
        <header className="sticky top-0 z-40 bg-[#141416]/90 backdrop-blur-md rounded-t-[2rem] relative py-6 px-8 flex justify-end">
          <div className="flex items-center gap-6 relative">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-[#8b8c94] hover:text-white transition-colors relative p-2"
              >
                 <Bell size={20} />
                 <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#141416]"></span>
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-64 glass-panel p-4 z-50 border border-[#292a32] shadow-2xl"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-bold text-white">Notifications</h4>
                      <button onClick={() => setShowNotifications(false)} className="text-[#8b8c94] hover:text-white">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="text-center py-6 text-xs text-[#8b8c94] italic bg-[#0A0A0B] rounded-xl">
                      No new notifications.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">{user?.fullName || 'Administrator'}</p>
                <p className="text-[10px] text-[#8b8c94]">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
              <div className="h-10 w-10 overflow-hidden rounded-full border border-[#292a32] shadow-xl">
                <img src={user?.imageUrl || `https://ui-avatars.com/api/?name=${user?.firstName || 'A'}&background=3ecf8e&color=fff`} alt="User" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
