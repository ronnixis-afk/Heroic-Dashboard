import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (data) setUsers(data);
      if (error) console.error('Error fetching users:', error);
      setLoading(false);
    };

    fetchUsers();

    // Subscribe to changes for real-time updates
    const subscription = supabase
      .channel('public:User')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'User' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setUsers(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setUsers(prev => prev.map(u => u.id === payload.new.id ? payload.new : u));
        } else if (payload.eventType === 'DELETE') {
          setUsers(prev => prev.filter(u => u.id === payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

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
