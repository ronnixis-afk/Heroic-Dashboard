import { useCallback, useMemo, useState } from 'react';
import { formatRelativeNotificationTime } from '../lib/notifications/formatRelativeTime';
import { useSignupNotificationSource } from '../lib/notifications/sources/signupSource';
import type { AdminNotification, AdminNotificationItem } from '../lib/notifications/types';

const LAST_SEEN_STORAGE_KEY = 'heroic.admin.notifications.lastSeenAt';

function readLastSeenAt(): string | null {
  try {
    return localStorage.getItem(LAST_SEEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function mergeNotificationSources(sourceItems: AdminNotification[][]): AdminNotification[] {
  return sourceItems
    .flat()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Aggregates notification sources into one inbox.
 * Register new feeds here as they ship (feedback, billing, system alerts, etc.).
 */
export function useNotifications() {
  const signups = useSignupNotificationSource();
  // const feedback = useFeedbackNotificationSource();
  // const billing = useBillingNotificationSource();

  const [lastSeenAt, setLastSeenAt] = useState<string | null>(() => readLastSeenAt());

  const rawItems = useMemo(
    () => mergeNotificationSources([signups.items]),
    [signups.items]
  );

  const isLoading = signups.isLoading;
  const isError = signups.isError;

  const notifications: AdminNotificationItem[] = useMemo(() => {
    const seenMs = lastSeenAt ? new Date(lastSeenAt).getTime() : NaN;
    return rawItems.map((item) => {
      const createdMs = new Date(item.createdAt).getTime();
      return {
        ...item,
        unread: !Number.isFinite(seenMs) || createdMs > seenMs,
        relativeTime: formatRelativeNotificationTime(item.createdAt),
      };
    });
  }, [lastSeenAt, rawItems]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications]
  );

  const markAllSeen = useCallback(() => {
    const newest = rawItems[0]?.createdAt || new Date().toISOString();
    try {
      localStorage.setItem(LAST_SEEN_STORAGE_KEY, newest);
    } catch {
      // Ignore quota / private-mode failures.
    }
    setLastSeenAt(newest);
  }, [rawItems]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isError,
    markAllSeen,
  };
}
