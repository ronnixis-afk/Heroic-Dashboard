import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/AuthContext';
import { getAdminSupabase } from '../lib/getAdminSupabase';
import { fetchRpgAdmin } from '../lib/rpgAdminApi';

const ROADMAP_LIMIT = 100;
const REALTIME_INVALIDATE_DEBOUNCE_MS = 5000;

export const ROADMAP_PHASES = [
  'Near Horizon',
  'Next Wave',
  'On The Horizon',
  'Shipped',
] as const;

export const ROADMAP_STATUSES = [
  { value: 'in_development', label: 'In Dev' },
  { value: 'next_in_queue', label: 'Queued' },
  { value: 'planned', label: 'Planned' },
  { value: 'shipped', label: 'Shipped' },
] as const;

export const ROADMAP_CATEGORIES = [
  'Gameplay',
  'Narrative AI',
  'World Building',
  'Quality of Life',
] as const;

export type RoadmapPhase = (typeof ROADMAP_PHASES)[number];
export type RoadmapStatus = (typeof ROADMAP_STATUSES)[number]['value'];
export type RoadmapCategory = (typeof ROADMAP_CATEGORIES)[number];

export interface RoadmapItem {
  id: string;
  title: string;
  summary: string;
  phase: string;
  status: string;
  category: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoadmapFormData {
  title: string;
  summary: string;
  phase: string;
  status: string;
  category: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
}

async function fetchRoadmap(
  getToken: (options?: any) => Promise<string | null>
): Promise<RoadmapItem[]> {
  const result = await fetchRpgAdmin<{ items?: RoadmapItem[]; roadmap?: RoadmapItem[] }>(
    `/api/admin/roadmap?limit=${ROADMAP_LIMIT}`,
    getToken
  );
  return result.items || result.roadmap || [];
}

export function useRoadmap() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const { data: items = [], isLoading: loading, error } = useQuery({
    queryKey: ['roadmap'],
    queryFn: () => fetchRoadmap(getToken),
  });

  useEffect(() => {
    let invalidateTimer: ReturnType<typeof setTimeout> | null = null;
    let cleanup: (() => void) | undefined;
    let isMounted = true;

    const setupSubscription = async () => {
      const supabase = await getAdminSupabase(getToken);

      const subscription = supabase
        .channel('public:RoadmapItem')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'RoadmapItem' }, () => {
          if (invalidateTimer) clearTimeout(invalidateTimer);
          invalidateTimer = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['roadmap'] });
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
      .catch((e) => console.error('[RoadmapAudit] Real-time setup failed:', e));

    return () => {
      isMounted = false;
      if (invalidateTimer) clearTimeout(invalidateTimer);
      cleanup?.();
    };
  }, [queryClient, getToken]);

  const createItem = async (formData: RoadmapFormData) => {
    const payload = {
      title: formData.title.trim(),
      summary: formData.summary.trim(),
      phase: formData.phase,
      status: formData.status,
      category: formData.category,
      featured: formData.featured,
      published: formData.published,
      sortOrder: Number.isFinite(formData.sortOrder) ? formData.sortOrder : 0,
    };

    const data = await fetchRpgAdmin('/api/admin/roadmap', getToken, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    queryClient.invalidateQueries({ queryKey: ['roadmap'] });
    return data;
  };

  const updateItem = async (id: string, formData: RoadmapFormData) => {
    const payload = {
      title: formData.title.trim(),
      summary: formData.summary.trim(),
      phase: formData.phase,
      status: formData.status,
      category: formData.category,
      featured: formData.featured,
      published: formData.published,
      sortOrder: Number.isFinite(formData.sortOrder) ? formData.sortOrder : 0,
    };

    const data = await fetchRpgAdmin(`/api/admin/roadmap/${id}`, getToken, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    queryClient.invalidateQueries({ queryKey: ['roadmap'] });
    return data;
  };

  const deleteItem = async (id: string) => {
    await fetchRpgAdmin(`/api/admin/roadmap/${id}`, getToken, {
      method: 'DELETE',
    });
    queryClient.invalidateQueries({ queryKey: ['roadmap'] });
  };

  return {
    items,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
  };
}
