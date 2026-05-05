import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

async function fetchUsers() {
  const { data, error } = await supabase
    .from('User')
    .select('*')
    .order('createdAt', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export function useUsers() {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const { data: users = [], isLoading: loading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  useEffect(() => {
    // Subscribe to changes for real-time updates
    const subscription = supabase
      .channel('public:User')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'User' }, () => {
        // Industry standard: Invalidate the query to trigger a background refresh
        queryClient.invalidateQueries({ queryKey: ['users'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [queryClient]);

  const syncUsers = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_RPG_API_URL}/api/admin/sync-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_ADMIN_API_KEY}`
        }
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

