import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/AuthContext';
import { getAdminSupabase } from '../lib/getAdminSupabase';

const CREDIT_HISTORY_LIMIT = 100;
const REALTIME_INVALIDATE_DEBOUNCE_MS = 5000;

async function fetchCreditHistory(getToken: (options?: any) => Promise<string | null>) {
  const supabase = await getAdminSupabase(getToken);

  const { data, error } = await supabase
    .from('CreditAdjustment')
    .select('id,userId,amount,reason,adminId,createdAt')
    .order('createdAt', { ascending: false })
    .limit(CREDIT_HISTORY_LIMIT);

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
    queryFn: () => fetchCreditHistory(getToken),
  });

  useEffect(() => {
    let invalidateTimer: ReturnType<typeof setTimeout> | null = null;
    let cleanup: (() => void) | undefined;
    let isMounted = true;

    const setupSubscription = async () => {
      const supabase = await getAdminSupabase(getToken);

      const subscription = supabase
        .channel('public:CreditAdjustment')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'CreditAdjustment' }, () => {
          if (invalidateTimer) clearTimeout(invalidateTimer);
          invalidateTimer = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['credit-history'] });
          }, REALTIME_INVALIDATE_DEBOUNCE_MS);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    };

    setupSubscription()
      .then((result) => {
        if (isMounted) {
          cleanup = result;
        } else {
          result?.();
        }
      })
      .catch((e) => console.error('[CreditsAudit] Real-time setup failed:', e));

    return () => {
      isMounted = false;
      if (invalidateTimer) clearTimeout(invalidateTimer);
      cleanup?.();
    };
  }, [queryClient, getToken]);

  const adjustCredits = async (email: string, amount: number, reason: string) => {
    setStatus(null);
    setIsProcessing(true);
    try {
      const apiUrl = import.meta.env.VITE_RPG_API_URL;
      const token = await getToken();

      if (!apiUrl) {
        throw new Error('Admin Api Configuration Missing In Dashboard.');
      }
      if (!token) {
        throw new Error('Admin Session Expired. Please Sign In Again.');
      }

      const response = await fetch(`${apiUrl}/api/admin/adjust-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          amount,
          reason,
          adminEmail: user?.primaryEmailAddress?.emailAddress || 'Unknown Admin',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed To Adjust Credits.');
      }

      setStatus({
        type: 'success',
        msg: `Successfully Adjusted Credits for ${email.trim()}. New Balance: ${result.newBalance}`,
      });
      queryClient.invalidateQueries({ queryKey: ['credit-history'] });
      return result;
    } catch (error: any) {
      console.error('[CreditsAudit] Adjustment error:', error);
      setStatus({ type: 'error', msg: error.message || 'Failed To Adjust Credits.' });
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
    adjustCredits,
  };
}
