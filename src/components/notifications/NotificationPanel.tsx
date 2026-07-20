import { motion } from 'framer-motion';
import { Bell, BellRing, Loader2, UserPlus, X, type LucideIcon } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import type { AdminNotificationItem, AdminNotificationType } from '../../lib/notifications/types';
import { cn } from '../../lib/utils';

type NotificationPanelProps = {
  notifications: AdminNotificationItem[];
  isLoading: boolean;
  isError: boolean;
  onClose: () => void;
  onSelect: (notification: AdminNotificationItem) => void;
};

const TYPE_META: Record<AdminNotificationType, { label: string; icon: LucideIcon }> = {
  signup: { label: 'Signup', icon: UserPlus },
};

export default function NotificationPanel({
  notifications,
  isLoading,
  isError,
  onClose,
  onSelect,
}: NotificationPanelProps) {
  return (
    <motion.div
      role="dialog"
      aria-label="Notifications"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="tooltip-panel absolute right-0 top-full mt-1.5 z-50 w-[min(20rem,calc(100vw-1.5rem))] !p-0 overflow-hidden"
    >
      <div className="p-2.5 border-b border-brand-border">
        <div className="card-header mb-0">
          <div className="min-w-0">
            <h4 className="card-title">Notifications</h4>
            <p className="card-subtitle">Recent admin activity</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon w-6 h-6 shrink-0"
            aria-label="Close Notifications"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      <div className="max-h-[min(20rem,55vh)] overflow-y-auto p-1.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-brand-text-muted">
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            <p className="text-xs">Loading Notifications…</p>
          </div>
        ) : isError ? (
          <EmptyState
            compact
            icon={BellRing}
            title="Could Not Load Notifications"
            description="Check your connection, then try again."
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            compact
            icon={Bell}
            title="No New Notifications"
            description="New activity will appear here when it arrives."
          />
        ) : (
          <ul className="space-y-0.5">
            {notifications.map((item) => {
              const meta = TYPE_META[item.type];
              const TypeIcon = meta.icon;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className={cn(
                      'list-item w-full text-left items-start gap-2.5 py-2 px-2',
                      item.unread && 'bg-brand-hover/60'
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className="h-7 w-7 overflow-hidden rounded-full border border-brand-primary bg-brand-bg">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-brand-text-muted">
                            <TypeIcon size={12} aria-hidden="true" />
                          </span>
                        )}
                      </div>
                      {item.unread && (
                        <span
                          className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-brand-accent"
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className="text-xs font-medium text-brand-text truncate"
                          title={item.title}
                        >
                          {item.title}
                        </p>
                        <span className="text-xs text-brand-text-muted shrink-0 tabular-nums">
                          {item.relativeTime}
                        </span>
                      </div>
                      {item.body && (
                        <p className="mt-0.5 text-xs text-brand-text-muted truncate">{item.body}</p>
                      )}
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className="badge-muted">{meta.label}</span>
                        {item.badge && <span className="badge-accent">{item.badge}</span>}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="px-2.5 py-2 border-t border-brand-border">
        <p className="help-text">
          {notifications.length > 0
            ? `${notifications.length} Notification${notifications.length === 1 ? '' : 's'}`
            : 'Inbox Is Empty'}
        </p>
      </div>
    </motion.div>
  );
}
