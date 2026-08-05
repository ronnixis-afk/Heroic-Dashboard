import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/AuthContext';
import { getAdminSupabase } from '../lib/getAdminSupabase';
import { fetchRpgAdmin } from '../lib/rpgAdminApi';
import { isSafeHttpUrl } from '../lib/safeHttpUrl';

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

function normalizeOptionalUrl(value: string | undefined | null): string | null {
  if (!value || !value.trim()) return null;
  if (!isSafeHttpUrl(value)) {
    throw new Error('Invalid URL. Only Http And Https Links Are Allowed.');
  }
  return value.trim();
}

function buildNewsPayload(formData: NewsFormData) {
  return {
    title: formData.title,
    content: formData.content,
    imageUrl: normalizeOptionalUrl(formData.imageUrl),
    published: formData.published,
    is_popup: formData.is_popup ?? false,
    active: formData.active ?? false,
    highlights: formData.highlights || [],
    cta_label: formData.cta_label?.trim() || null,
    cta_url: normalizeOptionalUrl(formData.cta_url),
    version: formData.version?.trim() || null,
    is_patch_note: formData.is_patch_note ?? false,
  };
}

async function fetchNews(
  getToken: (options?: any) => Promise<string | null>
): Promise<NewsItem[]> {
  const result = await fetchRpgAdmin<{ news?: NewsItem[]; items?: NewsItem[] }>(
    `/api/admin/news?limit=${NEWS_LIMIT}`,
    getToken
  );
  return result.news || result.items || [];
}

async function fetchAppVersion(
  getToken: (options?: any) => Promise<string | null>
): Promise<string> {
  const result = await fetchRpgAdmin<{ version?: string; value?: string }>(
    '/api/admin/app-version',
    getToken
  );
  return result.version || result.value || 'v0.5';
}

export function useNews() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const { data: news = [], isLoading: loading } = useQuery({
    queryKey: ['news'],
    queryFn: () => fetchNews(getToken),
  });

  const { data: appVersion = 'v0.5', isLoading: loadingVersion } = useQuery({
    queryKey: ['app_version'],
    queryFn: () => fetchAppVersion(getToken),
  });

  useEffect(() => {
    let invalidateTimer: ReturnType<typeof setTimeout> | null = null;
    let cleanup: (() => void) | undefined;
    let isMounted = true;

    const setupSubscription = async () => {
      const supabase = await getAdminSupabase(getToken);

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
    const formattedVersion = newVersion.trim().startsWith('v')
      ? newVersion.trim()
      : `v${newVersion.trim()}`;

    const result = await fetchRpgAdmin<{ version?: string; value?: string }>(
      '/api/admin/app-version',
      getToken,
      {
        method: 'PUT',
        body: JSON.stringify({ version: formattedVersion }),
      }
    );

    const version = result.version || result.value || formattedVersion;
    queryClient.invalidateQueries({ queryKey: ['app_version'] });
    return version;
  };

  const createNews = async (formData: NewsFormData) => {
    const payload = buildNewsPayload(formData);
    const data = await fetchRpgAdmin<{ news?: NewsItem; item?: NewsItem } | NewsItem[]>(
      '/api/admin/news',
      getToken,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    if (formData.version) {
      await updateAppVersion(formData.version).catch((e) =>
        console.warn('[NewsAudit] Could not auto-update app_version:', e)
      );
    }

    queryClient.invalidateQueries({ queryKey: ['news'] });
    return data;
  };

  const updateNews = async (id: string, formData: NewsFormData) => {
    const payload = buildNewsPayload(formData);
    const data = await fetchRpgAdmin<{ news?: NewsItem; item?: NewsItem } | NewsItem[]>(
      `/api/admin/news/${id}`,
      getToken,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );

    if (formData.version) {
      await updateAppVersion(formData.version).catch((e) =>
        console.warn('[NewsAudit] Could not auto-update app_version:', e)
      );
    }

    queryClient.invalidateQueries({ queryKey: ['news'] });
    return data;
  };

  const activatePopup = async (id: string, targetVersion?: string | null) => {
    const data = await fetchRpgAdmin(
      '/api/admin/news/activate-popup',
      getToken,
      {
        method: 'POST',
        body: JSON.stringify({ id, version: targetVersion || undefined }),
      }
    );

    if (targetVersion) {
      await updateAppVersion(targetVersion).catch((e) =>
        console.warn('[NewsAudit] Could not auto-update app_version on activation:', e)
      );
    }

    queryClient.invalidateQueries({ queryKey: ['news'] });
    return data;
  };

  const deactivatePopup = async (id: string) => {
    const data = await fetchRpgAdmin(
      '/api/admin/news/deactivate-popup',
      getToken,
      {
        method: 'POST',
        body: JSON.stringify({ id }),
      }
    );

    queryClient.invalidateQueries({ queryKey: ['news'] });
    return data;
  };

  const deleteNews = async (id: string) => {
    await fetchRpgAdmin(`/api/admin/news/${id}`, getToken, {
      method: 'DELETE',
    });
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
    deleteNews,
  };
}
