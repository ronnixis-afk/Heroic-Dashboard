import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../supabase';
import { useAuth } from '../../AuthContext';
import type { AdminNotification, NotificationSourceResult } from '../types';

const SIGNUP_NOTIFICATION_LIMIT = 12;
const REFETCH_INTERVAL_MS = 60_000;
const REALTIME_INVALIDATE_DEBOUNCE_MS = 2_000;
const QUERY_KEY = ['notifications', 'signup'] as const;

function formatTierLabel(tier: string): string {
  switch (tier) {
    case 'newbie':
      return 'Apprentice';
    case 'adventurer':
      return 'Adventurer';
    case 'hero':
      return 'Hero';
    case 'overlord':
      return 'Overlord';
    case 'super_admin':
      return 'Super Admin';
    default:
      return tier
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
  }
}

async function fetchSignupNotifications(
  getToken: (options?: { template?: string }) => Promise<string | null>
): Promise<AdminNotification[]> {
  let token: string | null = null;
  try {
    token = await getToken({ template: 'supabase' });
  } catch (error) {
    console.error('[Notifications:signup] getToken failed:', error);
  }

  const supabase = getSupabaseClient(token || undefined);
  const { data, error } = await supabase
    .from('User')
    .select('id, email, tier, createdAt')
    .order('createdAt', { ascending: false })
    .limit(SIGNUP_NOTIFICATION_LIMIT);

  if (error) {
    console.error('[Notifications:signup] Fetch failed:', error);
    throw error;
  }

  return (data || []).map((row) => {
    const userId = String(row.id);
    const email = String(row.email || 'Unknown');
    const tier = String(row.tier || 'newbie');
    return {
      id: `signup:${userId}`,
      type: 'signup' as const,
      title: email,
      body: 'New Account Created',
      href: `/admin/users?userId=${encodeURIComponent(userId)}`,
      createdAt: String(row.createdAt),
      badge: formatTierLabel(tier),
      imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        email.charAt(0) || 'U'
      )}&background=292a32&color=ffffff&size=48`,
    };
  });
}

/** Signup feed — one pluggable source for the shared notification inbox. */
export function useSignupNotificationSource(): NotificationSourceResult {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchSignupNotifications(getToken),
    refetchInterval: REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    let invalidateTimer: ReturnType<typeof setTimeout> | null = null;
    let cleanup: (() => void) | undefined;
    let isMounted = true;

    const setupSubscription = async () => {
      const token = await getToken({ template: 'supabase' }).catch(() => null);
      const supabase = getSupabaseClient(token || undefined);

      const subscription = supabase
        .channel('public:User:notifications-signup')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'User' },
          () => {
            if (invalidateTimer) clearTimeout(invalidateTimer);
            invalidateTimer = setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            }, REALTIME_INVALIDATE_DEBOUNCE_MS);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    };

    setupSubscription()
      .then((result) => {
        if (isMounted) cleanup = result;
        else result?.();
      })
      .catch((error) => console.error('[Notifications:signup] Realtime setup failed:', error));

    return () => {
      isMounted = false;
      if (invalidateTimer) clearTimeout(invalidateTimer);
      cleanup?.();
    };
  }, [getToken, queryClient]);

  return { items, isLoading, isError };
}
