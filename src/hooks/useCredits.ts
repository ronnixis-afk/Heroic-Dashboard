import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

async function fetchCreditHistory(getToken: (options?: any) => Promise<string | null>) {
  let token: string | null = null;
  try {
    token = await getToken({ template: 'supabase' });
  } catch (e) {
    console.error('[CreditsAudit] getToken failed, falling back to anonymous:', e);
  }
  
  const supabase = getSupabaseClient(token || undefined);
  
  const { data, error } = await supabase
    .from('CreditAdjustment')
    .select('*')
    .order('createdAt', { ascending: false });
  
  if (error) {
    console.error('[CreditsAudit] Supabase credits history error:', error);
    throw error;
  }
  return data || [];
}

export function useCredits() {
  const queryClient = useQueryClient();
  const { getToken, user } = useAuth();
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: history = [], isLoading: loading } = useQuery({
    queryKey: ['credit-history'],
    queryFn: () => fetchCreditHistory(() => getToken({ template: 'supabase' })),
  });

  useEffect(() => {
    let subscription: any;

    const setupSubscription = async () => {
      try {
        const token = await getToken({ template: 'supabase' }).catch(() => null);
        const supabase = getSupabaseClient(token || undefined);
        
        subscription = supabase
          .channel('public:CreditAdjustment')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'CreditAdjustment' }, () => {
            queryClient.invalidateQueries({ queryKey: ['credit-history'] });
          })
          .subscribe();
      } catch (e) {
        console.error('[CreditsAudit] Real-time setup failed:', e);
      }
    };
    
    setupSubscription();

    return () => {
      if (subscription) {
        const token = getToken({ template: 'supabase' }).catch(() => null);
        token.then((t) => {
          getSupabaseClient(t || undefined).removeChannel(subscription);
        });
      }
    };
  }, [queryClient, getToken]);

  const adjustCredits = async (email: string, amount: number, reason: string) => {
    setStatus(null);
    setIsProcessing(true);
    try {
      const apiUrl = import.meta.env.VITE_RPG_API_URL;
      const token = await getToken(); // Get standard Clerk token for the Next.js API

      if (!apiUrl) {
        throw new Error('Admin API configuration missing in Dashboard.');
      }

      const response = await fetch(`${apiUrl}/api/admin/adjust-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: email.trim(),
          amount,
          reason,
          adminEmail: user?.primaryEmailAddress?.emailAddress || 'Unknown Admin'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to Adjust Credits.');
      }

      setStatus({ 
        type: 'success', 
        msg: `Successfully Adjusted Credits for ${email.trim()}. New Balance: ${result.newBalance}` 
      });
      queryClient.invalidateQueries({ queryKey: ['credit-history'] });
      return result;
    } catch (error: any) {
      console.error('[CreditsAudit] Adjustment error:', error);
      setStatus({ type: 'error', msg: error.message || 'Failed to Adjust Credits.' });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    history,
    loading,
    status,
    setStatus,
    isProcessing,
    adjustCredits
  };
}
