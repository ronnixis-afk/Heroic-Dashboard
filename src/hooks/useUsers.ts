import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

const USERS_PAGE_SIZE = 250;
const REALTIME_INVALIDATE_DEBOUNCE_MS = 5000;

async function fetchUsers(getToken: (options?: any) => Promise<string | null>) {
  let token: string | null = null;
  try {
    token = await getToken({ template: 'supabase' });
  } catch (e) {
    console.error('[UsersAudit] getToken failed, falling back to anonymous:', e);
  }
  
  const supabase = getSupabaseClient(token || undefined);
  
  const [usersRes, saveStatsRes] = await Promise.all([
    supabase
      .from('User')
      .select('id, email, tier, currentCredits, maxCredits, createdAt, UserSession(lastPing, endTime, startTime)')
      .order('createdAt', { ascending: false })
      .order('lastPing', { foreignTable: 'UserSession', ascending: false })
      .limit(1, { foreignTable: 'UserSession' })
      .limit(USERS_PAGE_SIZE),
    supabase
      .from('user_save_sizes_summary')
      .select('userId, save_count, total_bytes')
  ]);
  
  if (usersRes.error) {
    console.error('[UsersAudit] Supabase error fetching users:', usersRes.error);
    throw usersRes.error;
  }
  
  if (saveStatsRes.error) {
    console.warn('[UsersAudit] Supabase error fetching save sizes:', saveStatsRes.error);
  }

  const users = usersRes.data || [];
  const saveStats = saveStatsRes.data || [];
  const saveStatsMap = new Map(saveStats.map((s: any) => [s.userId, s]));

  return users.map((user) => ({
    ...user,
    saveStats: saveStatsMap.get(user.id) || { save_count: 0, total_bytes: 0 }
  }));
}

export function useUsers() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const { data: users = [], isLoading: loading } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsers(() => getToken({ template: 'supabase' })),
  });

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let invalidateTimer: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const setupSubscription = async () => {
      try {
        const token = await getToken({ template: 'supabase' }).catch(() => null);
        const supabase = getSupabaseClient(token || undefined);
        const subscription = supabase
          .channel('public:User')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'User' }, () => {
            if (invalidateTimer) clearTimeout(invalidateTimer);
            invalidateTimer = setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['users'] });
            }, REALTIME_INVALIDATE_DEBOUNCE_MS);
          })
          .subscribe();

        return () => {
          supabase.removeChannel(subscription);
        };
      } catch (e) {
        console.error('[UsersAudit] Real-time setup failed:', e);
      }
    };
    
    setupSubscription().then((result) => {
      if (isMounted) {
        cleanup = result;
      } else {
        result?.();
      }
    });

    return () => {
      isMounted = false;
      if (invalidateTimer) clearTimeout(invalidateTimer);
      cleanup?.();
    };
  }, [queryClient, getToken]);

  const syncUsers = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    try {
      const token = await getToken().catch(() => null);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${import.meta.env.VITE_RPG_API_URL}/api/admin/sync-users`, {
        method: 'POST',
        headers
      });
      const data = await response.json();
      if (data.success) {
        setSyncMessage('Sync Successful');
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setTimeout(() => setSyncMessage(''), 3000);
      } else {
        console.error('Sync failed:', data.error);
        setSyncMessage('Sync Failed');
        setTimeout(() => setSyncMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error syncing users:', err);
      setSyncMessage('Error Syncing');
      setTimeout(() => setSyncMessage(''), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    users,
    loading,
    isSyncing,
    syncMessage,
    syncUsers
  };
}

