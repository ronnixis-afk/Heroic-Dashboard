import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

async function fetchUsers(getToken: (options?: any) => Promise<string | null>) {
  let token: string | null = null;
  try {
    token = await getToken({ template: 'supabase' });
  } catch (e) {
    console.error('[UsersAudit] getToken failed, falling back to anonymous:', e);
  }
  
  const supabase = getSupabaseClient(token || undefined);
  
  const { data, error } = await supabase
    .from('User')
    .select('*')
    .order('createdAt', { ascending: false });
  
  if (error) {
    console.error('[UsersAudit] Supabase error:', error);
    throw error;
  }
  return data || [];
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
    const setupSubscription = async () => {
      try {
        const token = await getToken({ template: 'supabase' }).catch(() => null);
        const supabase = getSupabaseClient(token || undefined);
        const subscription = supabase
          .channel('public:User')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'User' }, () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
          })
          .subscribe();

        return () => {
          supabase.removeChannel(subscription);
        };
      } catch (e) {
        console.error('[UsersAudit] Real-time setup failed:', e);
      }
    };
    
    setupSubscription();
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

