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
  Search
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: Newspaper, label: 'News', path: '/admin/news' },
  { icon: Coins, label: 'Credits', path: '/admin/credits' },
  { icon: LineChart, label: 'Analytics', path: '/admin/analytics' },
];

export default function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const handleLogout = async () => {
    await auth.signOut();
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
                <span className="font-sans text-xl font-bold tracking-tight text-white">Heroic Dashboard</span>
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

        <nav className="flex-1 space-y-2 px-4 py-6">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-4 rounded-[1.5rem] px-4 py-3 transition-all duration-200",
                  isActive 
                    ? "bg-[#292a32] text-white" 
                    : "text-[#8b8c94] hover:bg-[#1a1b21] hover:text-white"
                )}
              >
                <item.icon size={20} />
                {isSidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#1e1f24] p-4">
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
                    <div className="text-center py-6 text-sm text-brand-text-muted italic bg-brand-bg rounded-xl">
                      No new notifications.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-8 w-8 overflow-hidden rounded-full border border-[#292a32]">
              <img src="https://ui-avatars.com/api/?name=User&background=3ecf8e&color=fff" alt="User" />
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
