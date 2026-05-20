import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

async function fetchNews(getToken: (options?: any) => Promise<string | null>) {
  let token: string | null = null;
  try {
    token = await getToken({ template: 'supabase' });
  } catch (e) {
    console.error('[NewsAudit] getToken failed, falling back to anonymous:', e);
  }
  
  const supabase = getSupabaseClient(token || undefined);
  
  const { data, error } = await supabase
    .from('News')
    .select('*')
    .order('createdAt', { ascending: false });
  
  if (error) {
    console.error('[NewsAudit] Supabase news error:', error);
    throw error;
  }
  return data || [];
}

export function useNews() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const { data: news = [], isLoading: loading } = useQuery({
    queryKey: ['news'],
    queryFn: () => fetchNews(() => getToken({ template: 'supabase' })),
  });

  useEffect(() => {
    let subscription: any;

    const setupSubscription = async () => {
      try {
        const token = await getToken({ template: 'supabase' }).catch(() => null);
        const supabase = getSupabaseClient(token || undefined);
        
        subscription = supabase
          .channel('public:News')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'News' }, () => {
            queryClient.invalidateQueries({ queryKey: ['news'] });
          })
          .subscribe();
      } catch (e) {
        console.error('[NewsAudit] Real-time setup failed:', e);
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

  const createNews = async (formData: { title: string; content: string; imageUrl?: string; published: boolean }) => {
    const token = await getToken({ template: 'supabase' }).catch(() => null);
    const supabase = getSupabaseClient(token || undefined);
    
    const { data, error } = await supabase
      .from('News')
      .insert({
        title: formData.title,
        content: formData.content,
        imageUrl: formData.imageUrl || null,
        published: formData.published
      })
      .select();
      
    if (error) {
      console.error('[NewsAudit] Create news failed:', error);
      throw error;
    }
    
    queryClient.invalidateQueries({ queryKey: ['news'] });
    return data;
  };

  const updateNews = async (id: string, formData: { title: string; content: string; imageUrl?: string; published: boolean }) => {
    const token = await getToken({ template: 'supabase' }).catch(() => null);
    const supabase = getSupabaseClient(token || undefined);
    
    const { data, error } = await supabase
      .from('News')
      .update({
        title: formData.title,
        content: formData.content,
        imageUrl: formData.imageUrl || null,
        published: formData.published,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select();
      
    if (error) {
      console.error('[NewsAudit] Update news failed:', error);
      throw error;
    }
    
    queryClient.invalidateQueries({ queryKey: ['news'] });
    return data;
  };

  const deleteNews = async (id: string) => {
    const token = await getToken({ template: 'supabase' }).catch(() => null);
    const supabase = getSupabaseClient(token || undefined);
    
    const { error } = await supabase
      .from('News')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('[NewsAudit] Delete news failed:', error);
      throw error;
    }
    
    queryClient.invalidateQueries({ queryKey: ['news'] });
  };

  return {
    news,
    loading,
    createNews,
    updateNews,
    deleteNews
  };
}
