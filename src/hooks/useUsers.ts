import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { fetchRpgAdmin } from '../lib/rpgAdminApi';

export const USERS_PAGE_SIZE = 50;
const REALTIME_INVALIDATE_DEBOUNCE_MS = 5000;
const EXPORT_CAP = 2000;

export interface UsersQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  tier?: string;
  minCredits?: number | null;
  maxCredits?: number | null;
  createdAfter?: string | null;
  createdBefore?: string | null;
}

export interface UserListItem {
  id: string;
  email: string;
  tier: string;
  currentCredits: number;
  maxCredits: number;
  createdAt: string;
  UserSession?: { lastPing: string; endTime: string | null; startTime: string }[];
  saveStats: { save_count: number; total_bytes: number };
}

async function getAdminSupabase(getToken: (options?: any) => Promise<string | null>) {
  let token: string | null = null;
  try {
    token = await getToken({ template: 'supabase' });
  } catch (e) {
    console.error('[UsersAudit] getToken failed, falling back to anonymous:', e);
  }
  return getSupabaseClient(token || undefined);
}

function applyUserFilters(
  query: any,
  params: UsersQueryParams
) {
  const search = params.search?.trim();
  if (search) {
    const pattern = `%${search.replace(/[%_,]/g, '')}%`;
    query = query.or(`email.ilike."${pattern}",id.ilike."${pattern}"`);
  }
  if (params.tier && params.tier !== 'All') {
    query = query.eq('tier', params.tier);
  }
  if (params.minCredits != null && !Number.isNaN(params.minCredits)) {
    query = query.gte('currentCredits', params.minCredits);
  }
  if (params.maxCredits != null && !Number.isNaN(params.maxCredits)) {
    query = query.lte('currentCredits', params.maxCredits);
  }
  if (params.createdAfter) {
    query = query.gte('createdAt', params.createdAfter);
  }
  if (params.createdBefore) {
    query = query.lte('createdAt', params.createdBefore);
  }
  return query;
}

async function fetchUsersPage(
  getToken: (options?: any) => Promise<string | null>,
  params: UsersQueryParams
): Promise<{ users: UserListItem[]; totalCount: number }> {
  const supabase = await getAdminSupabase(getToken);
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? USERS_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let usersQuery = supabase
    .from('User')
    .select(
      'id, email, tier, currentCredits, maxCredits, createdAt, UserSession(lastPing, endTime, startTime)',
      { count: 'exact' }
    )
    .order('createdAt', { ascending: false })
    .order('lastPing', { foreignTable: 'UserSession', ascending: false })
    .limit(1, { foreignTable: 'UserSession' })
    .range(from, to);

  usersQuery = applyUserFilters(usersQuery, params);

  const usersRes = await usersQuery;

  if (usersRes.error) {
    console.error('[UsersAudit] Supabase error fetching users:', usersRes.error);
    throw usersRes.error;
  }

  const users = usersRes.data || [];
  const totalCount = usersRes.count ?? users.length;
  const userIds = users.map((u) => u.id);

  let saveStatsMap = new Map<string, { save_count: number; total_bytes: number }>();
  if (userIds.length > 0) {
    try {
      const saveStatsRes = await fetchRpgAdmin<{
        data: { userId: string; save_count: number; total_bytes: number }[];
      }>(
        `/api/admin/analytics/view-data?resource=save-sizes&userIds=${encodeURIComponent(userIds.join(','))}`,
        getToken
      );
      saveStatsMap = new Map(
        (saveStatsRes.data || []).map((s) => [s.userId, s])
      );
    } catch (err) {
      console.warn('[UsersAudit] Save sizes fetch failed:', err);
    }
  }

  return {
    totalCount,
    users: users.map((user) => ({
      ...user,
      saveStats: saveStatsMap.get(user.id) || { save_count: 0, total_bytes: 0 },
    })),
  };
}

async function fetchSaveTotals(getToken: (options?: any) => Promise<string | null>) {
  try {
    const result = await fetchRpgAdmin<{
      data: { save_count: number; total_bytes: number }[];
    }>('/api/admin/analytics/view-data?resource=save-sizes', getToken);
    const rows = result.data || [];
    return {
      totalBytes: rows.reduce((acc, row) => acc + (Number(row.total_bytes) || 0), 0),
      totalCount: rows.reduce((acc, row) => acc + (Number(row.save_count) || 0), 0),
    };
  } catch (error) {
    console.warn('[UsersAudit] Save totals fetch failed:', error);
    return { totalBytes: 0, totalCount: 0 };
  }
}

async function fetchUserById(
  getToken: (options?: any) => Promise<string | null>,
  userId: string
): Promise<UserListItem | null> {
  const supabase = await getAdminSupabase(getToken);
  const { data, error } = await supabase
    .from('User')
    .select(
      'id, email, tier, currentCredits, maxCredits, createdAt, UserSession(lastPing, endTime, startTime)'
    )
    .eq('id', userId)
    .order('lastPing', { foreignTable: 'UserSession', ascending: false })
    .limit(1, { foreignTable: 'UserSession' })
    .maybeSingle();

  if (error || !data) return null;

  let saveStats = { save_count: 0, total_bytes: 0 };
  try {
    const saveStatsRes = await fetchRpgAdmin<{
      data: { userId: string; save_count: number; total_bytes: number }[];
    }>(
      `/api/admin/analytics/view-data?resource=save-sizes&userIds=${encodeURIComponent(userId)}`,
      getToken
    );
    saveStats = saveStatsRes.data?.[0] || saveStats;
  } catch (err) {
    console.warn('[UsersAudit] Save stats for user failed:', err);
  }

  return {
    ...data,
    saveStats,
  };
}

/** Export current filter result up to EXPORT_CAP rows. */
export async function exportUsersCsv(
  getToken: (options?: any) => Promise<string | null>,
  params: UsersQueryParams
): Promise<string> {
  const supabase = await getAdminSupabase(getToken);
  let query = supabase
    .from('User')
    .select('id, email, tier, currentCredits, maxCredits, createdAt')
    .order('createdAt', { ascending: false })
    .limit(EXPORT_CAP);

  query = applyUserFilters(query, params);
  const { data, error } = await query;
  if (error) throw error;

  const rows = data || [];
  const header = 'id,email,tier,currentCredits,maxCredits,createdAt';
  const escape = (value: unknown) => {
    const str = String(value ?? '');
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };
  const lines = rows.map((row) =>
    [row.id, row.email, row.tier, row.currentCredits, row.maxCredits, row.createdAt]
      .map(escape)
      .join(',')
  );
  return [header, ...lines].join('\n');
}

export function useUsers(params: UsersQueryParams = {}) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? USERS_PAGE_SIZE;
  const search = params.search?.trim() || '';
  const tier = params.tier || 'All';
  const minCredits = params.minCredits ?? null;
  const maxCredits = params.maxCredits ?? null;
  const createdAfter = params.createdAfter || null;
  const createdBefore = params.createdBefore || null;

  const queryKey = [
    'users',
    { page, pageSize, search, tier, minCredits, maxCredits, createdAfter, createdBefore },
  ] as const;

  const { data, isLoading: loading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchUsersPage(() => getToken({ template: 'supabase' }), {
        page,
        pageSize,
        search,
        tier,
        minCredits,
        maxCredits,
        createdAfter,
        createdBefore,
      }),
    placeholderData: (previous) => previous,
  });

  const { data: saveTotals } = useQuery({
    queryKey: ['user-save-totals'],
    queryFn: () => fetchSaveTotals(() => getToken({ template: 'supabase' })),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let invalidateTimer: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const setupSubscription = async () => {
      try {
        const token = await getToken({ template: 'supabase' }).catch(() => null);
        const supabase = getSupabaseClient(token || undefined);
        const subscription = supabase
          .channel('public:User')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'User' }, () => {
            if (invalidateTimer) clearTimeout(invalidateTimer);
            invalidateTimer = setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['users'] });
              queryClient.invalidateQueries({ queryKey: ['user-save-totals'] });
            }, REALTIME_INVALIDATE_DEBOUNCE_MS);
          })
          .subscribe();

        return () => {
          supabase.removeChannel(subscription);
        };
      } catch (e) {
        console.error('[UsersAudit] Real-time setup failed:', e);
      }
    };

    setupSubscription().then((result) => {
      if (isMounted) {
        cleanup = result;
      } else {
        result?.();
      }
    });

    return () => {
      isMounted = false;
      if (invalidateTimer) clearTimeout(invalidateTimer);
      cleanup?.();
    };
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
        headers,
      });
      const result = await response.json();
      if (result.success) {
        setSyncMessage('Sync Successful');
        queryClient.invalidateQueries({ queryKey: ['users'] });
        queryClient.invalidateQueries({ queryKey: ['user-save-totals'] });
        setTimeout(() => setSyncMessage(''), 3000);
      } else {
        console.error('Sync failed:', result.error);
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

  const resolveUserById = (userId: string) =>
    fetchUserById(() => getToken({ template: 'supabase' }), userId);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    users: data?.users ?? [],
    totalCount,
    totalPages,
    page,
    pageSize,
    loading,
    isFetching,
    isSyncing,
    syncMessage,
    syncUsers,
    resolveUserById,
    totalSavesSize: saveTotals?.totalBytes ?? 0,
    totalSavesCount: saveTotals?.totalCount ?? 0,
    exportParams: {
      search,
      tier,
      minCredits,
      maxCredits,
      createdAfter,
      createdBefore,
    } satisfies UsersQueryParams,
  };
}
