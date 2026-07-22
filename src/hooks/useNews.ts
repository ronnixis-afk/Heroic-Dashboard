import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

const NEWS_LIMIT = 50;
const REALTIME_INVALIDATE_DEBOUNCE_MS = 5000;

export interface NewsHighlight {
  title: string;
  body: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  published: boolean;
  is_popup?: boolean;
  active?: boolean;
  highlights?: NewsHighlight[];
  cta_label?: string | null;
  cta_url?: string | null;
  version?: string | null;
  is_patch_note?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewsFormData {
  title: string;
  content: string;
  imageUrl?: string;
  published: boolean;
  is_popup?: boolean;
  active?: boolean;
  highlights?: NewsHighlight[];
  cta_label?: string;
  cta_url?: string;
  version?: string;
  is_patch_note?: boolean;
}

async function fetchNews(getToken: (options?: any) => Promise<string | null>): Promise<NewsItem[]> {
  let token: string | null = null;
  try {
    token = await getToken({ template: 'supabase' });
  } catch (e) {
    console.error('[NewsAudit] getToken failed, falling back to anonymous:', e);
  }
  
  const supabase = getSupabaseClient(token || undefined);
  
  const { data, error } = await supabase
    .from('News')
    .select('id,title,content,imageUrl,published,is_popup,active,highlights,cta_label,cta_url,version,is_patch_note,createdAt,updatedAt')
    .order('createdAt', { ascending: false })
    .limit(NEWS_LIMIT);
  
  if (error) {
    if (error.code === 'PGRST204' || error.message?.includes('column')) {
      const basicRes = await supabase
        .from('News')
        .select('id,title,content,imageUrl,published,createdAt,updatedAt')
        .order('createdAt', { ascending: false })
        .limit(NEWS_LIMIT);
      return (basicRes.data || []) as NewsItem[];
    }
    console.error('[NewsAudit] Supabase news error:', error);
    throw error;
  }
  return (data || []) as NewsItem[];
}

async function fetchAppVersion(getToken: (options?: any) => Promise<string | null>): Promise<string> {
  let token: string | null = null;
  try {
    token = await getToken({ template: 'supabase' });
  } catch (e) {
    console.error('[NewsAudit] getToken failed for app_version:', e);
  }

  const supabase = getSupabaseClient(token || undefined);
  const { data, error } = await supabase
    .from('SystemSetting')
    .select('value')
    .eq('key', 'app_version')
    .maybeSingle();

  if (error) {
    console.warn('[NewsAudit] SystemSetting query error:', error.message);
  }

  return data?.value || 'v0.5';
}

export function useNews() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const { data: news = [], isLoading: loading } = useQuery({
    queryKey: ['news'],
    queryFn: () => fetchNews(() => getToken({ template: 'supabase' })),
  });

  const { data: appVersion = 'v0.5', isLoading: loadingVersion } = useQuery({
    queryKey: ['app_version'],
    queryFn: () => fetchAppVersion(() => getToken({ template: 'supabase' })),
  });

  useEffect(() => {
    let invalidateTimer: ReturnType<typeof setTimeout> | null = null;
    let cleanup: (() => void) | undefined;
    let isMounted = true;

    const setupSubscription = async () => {
      const token = await getToken({ template: 'supabase' }).catch(() => null);
      const supabase = getSupabaseClient(token || undefined);

      const subscription = supabase
        .channel('public:News')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'News' }, () => {
          if (invalidateTimer) clearTimeout(invalidateTimer);
          invalidateTimer = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['news'] });
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
      .catch((e) => console.error('[NewsAudit] Real-time setup failed:', e));

    return () => {
      isMounted = false;
      if (invalidateTimer) clearTimeout(invalidateTimer);
      cleanup?.();
    };
  }, [queryClient, getToken]);

  const updateAppVersion = async (newVersion: string) => {
    const token = await getToken({ template: 'supabase' }).catch(() => null);
    const supabase = getSupabaseClient(token || undefined);

    const formattedVersion = newVersion.trim().startsWith('v') ? newVersion.trim() : `v${newVersion.trim()}`;

    const { error } = await supabase
      .from('SystemSetting')
      .upsert({
        key: 'app_version',
        value: formattedVersion,
        updatedAt: new Date().toISOString(),
      });

    if (error) {
      console.error('[NewsAudit] Update app_version failed:', error);
      throw new Error(`SystemSetting update failed: ${error.message || error.details}`);
    }

    queryClient.invalidateQueries({ queryKey: ['app_version'] });
    return formattedVersion;
  };

  const createNews = async (formData: NewsFormData) => {
    const token = await getToken({ template: 'supabase' }).catch(() => null);
    const supabase = getSupabaseClient(token || undefined);
    
    const now = new Date().toISOString();
    const payload = {
      id: crypto.randomUUID(),
      title: formData.title,
      content: formData.content,
      imageUrl: formData.imageUrl || null,
      published: formData.published,
      is_popup: formData.is_popup ?? false,
      active: formData.active ?? false,
      highlights: formData.highlights || [],
      cta_label: formData.cta_label || null,
      cta_url: formData.cta_url || null,
      version: formData.version || null,
      is_patch_note: formData.is_patch_note ?? false,
      createdAt: now,
      updatedAt: now,
    };

    const { data, error } = await supabase
      .from('News')
      .insert(payload)
      .select();
      
    if (error) {
      console.error('[NewsAudit] Create news failed:', error);
      if (error.code === 'PGRST204' || error.message?.includes('column')) {
        console.warn('[NewsAudit] Missing columns in News table. Attempting fallback basic insert.', error);
        const basicPayload = {
          id: crypto.randomUUID(),
          title: formData.title,
          content: formData.content,
          imageUrl: formData.imageUrl || null,
          published: formData.published,
          createdAt: now,
          updatedAt: now,
        };
        const fallback = await supabase.from('News').insert(basicPayload).select();
        if (fallback.error) {
          throw new Error(`Database Error (${fallback.error.message}).`);
        }
        queryClient.invalidateQueries({ queryKey: ['news'] });
        return fallback.data;
      }
      throw new Error(`Database Error (${error.message || error.details}). ${error.hint || ''}`);
    }

    if (formData.version) {
      await updateAppVersion(formData.version).catch((e) =>
        console.warn('[NewsAudit] Could not auto-update app_version:', e)
      );
    }
    
    queryClient.invalidateQueries({ queryKey: ['news'] });
    return data;
  };

  const updateNews = async (id: string, formData: NewsFormData) => {
    const token = await getToken({ template: 'supabase' }).catch(() => null);
    const supabase = getSupabaseClient(token || undefined);
    
    const payload = {
      title: formData.title,
      content: formData.content,
      imageUrl: formData.imageUrl || null,
      published: formData.published,
      is_popup: formData.is_popup ?? false,
      active: formData.active ?? false,
      highlights: formData.highlights || [],
      cta_label: formData.cta_label || null,
      cta_url: formData.cta_url || null,
      version: formData.version || null,
      is_patch_note: formData.is_patch_note ?? false,
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('News')
      .update(payload)
      .eq('id', id)
      .select();
      
    if (error) {
      console.error('[NewsAudit] Update news failed:', error);
      if (error.code === 'PGRST204' || error.message?.includes('column')) {
        const basicPayload = {
          title: formData.title,
          content: formData.content,
          imageUrl: formData.imageUrl || null,
          published: formData.published,
          updatedAt: new Date().toISOString()
        };
        const fallback = await supabase.from('News').update(basicPayload).eq('id', id).select();
        if (fallback.error) {
          throw new Error(`Database Error (${fallback.error.message}).`);
        }
        queryClient.invalidateQueries({ queryKey: ['news'] });
        return fallback.data;
      }
      throw new Error(`Database Error (${error.message || error.details}). ${error.hint || ''}`);
    }

    if (formData.version) {
      await updateAppVersion(formData.version).catch((e) =>
        console.warn('[NewsAudit] Could not auto-update app_version:', e)
      );
    }
    
    queryClient.invalidateQueries({ queryKey: ['news'] });
    return data;
  };

  const activatePopup = async (id: string, targetVersion?: string | null) => {
    const token = await getToken({ template: 'supabase' }).catch(() => null);
    const supabase = getSupabaseClient(token || undefined);

    await supabase
      .from('News')
      .update({ active: false })
      .eq('is_popup', true);

    const { data, error } = await supabase
      .from('News')
      .update({
        is_popup: true,
        active: true,
        published: true,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('[NewsAudit] Activate popup failed:', error);
      throw new Error(`Database Error (${error.message || error.details}).`);
    }

    if (targetVersion) {
      await updateAppVersion(targetVersion).catch((e) =>
        console.warn('[NewsAudit] Could not auto-update app_version on activation:', e)
      );
    }

    queryClient.invalidateQueries({ queryKey: ['news'] });
    return data;
  };

  const deactivatePopup = async (id: string) => {
    const token = await getToken({ template: 'supabase' }).catch(() => null);
    const supabase = getSupabaseClient(token || undefined);

    const { data, error } = await supabase
      .from('News')
      .update({
        active: false,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('[NewsAudit] Deactivate popup failed:', error);
      throw new Error(`Database Error (${error.message || error.details}).`);
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
      throw new Error(`Database Error (${error.message || error.details}).`);
    }
    
    queryClient.invalidateQueries({ queryKey: ['news'] });
  };

  return {
    news,
    loading,
    appVersion,
    loadingVersion,
    updateAppVersion,
    createNews,
    updateNews,
    activatePopup,
    deactivatePopup,
    deleteNews
  };
}
