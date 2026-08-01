import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

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

async function fetchRoadmap(getToken: (options?: any) => Promise<string | null>): Promise<RoadmapItem[]> {
  let token: string | null = null;
  try {
    token = await getToken({ template: 'supabase' });
  } catch (e) {
    console.error('[RoadmapAudit] getToken failed, falling back to anonymous:', e);
  }

  const supabase = getSupabaseClient(token || undefined);
  const { data, error } = await supabase
    .from('RoadmapItem')
    .select('id,title,summary,phase,status,category,featured,published,sortOrder,createdAt,updatedAt')
    .order('sortOrder', { ascending: true })
    .order('createdAt', { ascending: true })
    .limit(ROADMAP_LIMIT);

  if (error) {
    console.error('[RoadmapAudit] Supabase roadmap error:', error);
    throw error;
  }

  return (data || []) as RoadmapItem[];
}

export function useRoadmap() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const { data: items = [], isLoading: loading, error } = useQuery({
    queryKey: ['roadmap'],
    queryFn: () => fetchRoadmap(() => getToken({ template: 'supabase' })),
  });

  useEffect(() => {
    let invalidateTimer: ReturnType<typeof setTimeout> | null = null;
    let cleanup: (() => void) | undefined;
    let isMounted = true;

    const setupSubscription = async () => {
      const token = await getToken({ template: 'supabase' }).catch(() => null);
      const supabase = getSupabaseClient(token || undefined);

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
    const token = await getToken({ template: 'supabase' }).catch(() => null);
    const supabase = getSupabaseClient(token || undefined);
    const now = new Date().toISOString();

    const payload = {
      id: crypto.randomUUID(),
      title: formData.title.trim(),
      summary: formData.summary.trim(),
      details: null,
      phase: formData.phase,
      status: formData.status,
      category: formData.category,
      featured: formData.featured,
      published: formData.published,
      sortOrder: Number.isFinite(formData.sortOrder) ? formData.sortOrder : 0,
      createdAt: now,
      updatedAt: now,
    };

    const { data, error } = await supabase.from('RoadmapItem').insert(payload).select();
    if (error) {
      console.error('[RoadmapAudit] Create failed:', error);
      throw new Error(`Database Error (${error.message || error.details}). ${error.hint || ''}`);
    }
    if (!data?.length) {
      throw new Error('Create Failed: No Row Returned. Check Admin Access.');
    }

    queryClient.invalidateQueries({ queryKey: ['roadmap'] });
    return data;
  };

  const updateItem = async (id: string, formData: RoadmapFormData) => {
    const token = await getToken({ template: 'supabase' }).catch(() => null);
    const supabase = getSupabaseClient(token || undefined);

    const payload = {
      title: formData.title.trim(),
      summary: formData.summary.trim(),
      details: null,
      phase: formData.phase,
      status: formData.status,
      category: formData.category,
      featured: formData.featured,
      published: formData.published,
      sortOrder: Number.isFinite(formData.sortOrder) ? formData.sortOrder : 0,
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('RoadmapItem').update(payload).eq('id', id).select();
    if (error) {
      console.error('[RoadmapAudit] Update failed:', error);
      throw new Error(`Database Error (${error.message || error.details}). ${error.hint || ''}`);
    }
    if (!data?.length) {
      throw new Error('Update Failed: No Row Returned. Check Admin Access Or Item Id.');
    }

    queryClient.invalidateQueries({ queryKey: ['roadmap'] });
    return data;
  };

  const deleteItem = async (id: string) => {
    const token = await getToken({ template: 'supabase' }).catch(() => null);
    const supabase = getSupabaseClient(token || undefined);

    const { data, error } = await supabase.from('RoadmapItem').delete().eq('id', id).select('id');
    if (error) {
      console.error('[RoadmapAudit] Delete failed:', error);
      throw new Error(`Database Error (${error.message || error.details}).`);
    }
    if (!data?.length) {
      throw new Error('Delete Failed: No Row Deleted. Check Admin Access Or Item Id.');
    }

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
