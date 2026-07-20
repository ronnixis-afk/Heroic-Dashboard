import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  Newspaper,
  Coins,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  LineChart,
  Bell,
  Search,
  Activity,
  DollarSign,
  Images,
  MessageSquare,
  Settings,
  Mail,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationPanel from './notifications/NotificationPanel';
import { useNotifications } from '../hooks/useNotifications';
import type { AdminNotificationItem } from '../lib/notifications/types';

const NAV_GROUPS = [
  {
    group: 'Main',
    items: [{ icon: LayoutDashboard, label: 'Dashboard', path: '/admin' }],
  },
  {
    group: 'Audience',
    items: [
      { icon: Users, label: 'Users', path: '/admin/users' },
      { icon: LineChart, label: 'Audience Reports', path: '/admin/reports/audience' },
    ],
  },
  {
    group: 'Intelligence',
    items: [
      { icon: Activity, label: 'Live Analytics', path: '/admin/analytics' },
      { icon: Search, label: 'Usage Reports', path: '/admin/reports/usage' },
    ],
  },
  {
    group: 'Monetization',
    items: [
      { icon: DollarSign, label: 'Financial Reports', path: '/admin/reports/financial' },
      { icon: Coins, label: 'Credits', path: '/admin/credits' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { icon: Newspaper, label: 'Global News', path: '/admin/news' },
      { icon: Images, label: 'Media Library', path: '/admin/media' },
      { icon: MessageSquare, label: 'User Feedback', path: '/admin/feedback' },
      { icon: Mail, label: 'Email Templates', path: '/admin/emails' },
    ],
  },
  {
    group: 'System',
    items: [
      { icon: Settings, label: 'System Settings', path: '/admin/settings' },
    ],
  },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(window.innerWidth >= 1024);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 1024);
  const notificationRef = React.useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    isError: notificationsError,
    markAllSeen,
  } = useNotifications();

  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  React.useEffect(() => {
    setShowNotifications(false);
  }, [location.pathname]);

  React.useEffect(() => {
    if (!showNotifications) return;

    markAllSeen();

    const onPointerDown = (event: MouseEvent) => {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowNotifications(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showNotifications, markAllSeen]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleSelectNotification = (notification: AdminNotificationItem) => {
    setShowNotifications(false);
    navigate(notification.href);
  };

  const currentPage = NAV_GROUPS.flatMap((g) => g.items).find(
    (item) =>
      location.pathname === item.path ||
      (item.path !== '/admin' && location.pathname.startsWith(item.path))
  );

  return (
    <div className="flex h-screen bg-sidebar-bg text-brand-text overflow-hidden">
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? (isSidebarOpen ? 220 : 0) : isSidebarOpen ? 200 : 52,
          x: isMobile && !isSidebarOpen ? -220 : 0,
        }}
        className={cn(
          'relative flex flex-col bg-sidebar-bg z-50 border-r border-brand-border shrink-0',
          isMobile ? 'fixed inset-y-0 left-0' : 'relative'
        )}
      >
        <div className="flex h-11 items-center justify-between px-3 border-b border-brand-border">
          <AnimatePresence mode="wait">
            {(isSidebarOpen || !isMobile) && (
              <motion.div
                key={isSidebarOpen ? 'logo-full' : 'logo-short'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn('flex items-center gap-2 min-w-0', !isSidebarOpen && 'mx-auto')}
              >
                <div className="h-6 w-6 rounded bg-gradient-to-tr from-brand-accent to-orange-500 shrink-0" />
                {isSidebarOpen && (
                  <span className="text-title font-semibold text-brand-text truncate">
                    Heroic Dashboard
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} className="btn-icon">
              <X size={14} />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.group} className="space-y-0.5">
              {isSidebarOpen && (
                <p className="px-2 text-xs font-medium text-brand-text-muted mb-1">{group.group}</p>
              )}
              {group.items.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path === '/admin' && location.pathname === '/admin');
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={!isSidebarOpen ? item.label : undefined}
                    className={cn(
                      'relative flex items-center gap-2.5 rounded-md px-2 h-8 text-xs font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-brand-hover text-brand-text'
                        : 'text-brand-text-muted hover:bg-brand-hover/70 hover:text-brand-text',
                      !isSidebarOpen && 'justify-center px-0'
                    )}
                  >
                    {isActive && isSidebarOpen && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand-accent" />
                    )}
                    <item.icon
                      size={14}
                      className={cn('shrink-0', isActive && 'text-brand-accent')}
                    />
                    {isSidebarOpen && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-brand-border p-2 space-y-0.5">
          {!isMobile && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex w-full items-center gap-2.5 rounded-md px-2 h-8 text-xs font-medium text-brand-text-muted hover:bg-brand-hover hover:text-brand-text transition-colors"
            >
              <Menu size={14} />
              {isSidebarOpen && <span>Collapse</span>}
            </button>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-2 h-8 text-xs font-medium text-brand-text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors',
              !isSidebarOpen && 'justify-center px-0'
            )}
          >
            <LogOut size={14} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      <main className="relative flex-1 overflow-y-auto bg-brand-bg flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-brand-bg/95 backdrop-blur-sm border-b border-brand-border h-11 px-3 sm:px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {isMobile && (
              <button onClick={() => setIsSidebarOpen(true)} className="btn-icon">
                <Menu size={14} />
              </button>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-brand-text-muted truncate">
                {NAV_GROUPS.find((g) => g.items.some((i) => i.path === currentPage?.path))?.group ?? 'Main'}
              </p>
              <h2 className="text-title font-semibold text-brand-text truncate leading-tight">
                {currentPage?.label ?? 'Dashboard'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 relative shrink-0">
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setShowNotifications((open) => !open)}
                className={cn(
                  'btn-icon relative',
                  showNotifications && 'bg-brand-hover text-brand-text'
                )}
                aria-label={
                  unreadCount > 0
                    ? `Notifications, ${unreadCount} unread`
                    : 'Notifications'
                }
                aria-expanded={showNotifications}
                aria-haspopup="dialog"
              >
                <Bell size={14} />
                {unreadCount > 0 && (
                  <span className="notification-bell-badge" aria-hidden="true">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <NotificationPanel
                    notifications={notifications}
                    isLoading={notificationsLoading}
                    isError={notificationsError}
                    onClose={() => setShowNotifications(false)}
                    onSelect={handleSelectNotification}
                  />
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-brand-text truncate max-w-[120px]">
                  {user?.fullName || 'Administrator'}
                </p>
                <p className="text-xs text-brand-text-muted truncate max-w-[120px]">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
              <div className="h-7 w-7 overflow-hidden rounded-full border border-brand-primary">
                <img
                  src={
                    user?.imageUrl ||
                    `https://ui-avatars.com/api/?name=${user?.firstName || 'A'}&background=3ecf8e&color=fff&size=28`
                  }
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-4 max-w-[1400px] mx-auto w-full flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
