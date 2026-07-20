/**
 * Generic admin notification model.
 * Add new `type` values as sources come online; the panel stays type-agnostic.
 */
export type AdminNotificationType = 'signup';

export type AdminNotification = {
  /** Stable id across sources, e.g. `signup:user_abc`. */
  id: string;
  type: AdminNotificationType;
  title: string;
  body?: string;
  /** In-app path to open when the notification is selected. */
  href: string;
  createdAt: string;
  /** Optional chip (tier, status, etc.). */
  badge?: string;
  imageUrl?: string;
};

export type AdminNotificationItem = AdminNotification & {
  unread: boolean;
  relativeTime: string;
};

export type NotificationSourceResult = {
  items: AdminNotification[];
  isLoading: boolean;
  isError: boolean;
};
