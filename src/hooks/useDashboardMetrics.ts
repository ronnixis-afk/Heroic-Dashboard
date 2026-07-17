import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { fetchTopConsumersWithEmails } from '../lib/metricsFetches';

const DASHBOARD_REFETCH_INTERVAL_MS = 5 * 60 * 1000;

async function fetchDashboardMetrics(
  getToken: (options?: any) => Promise<string | null>,
  timeframe: string = 'Month'
) {
  let token: string | null = null;
  try {
    token = await getToken();
  } catch (e) {
    console.error('[DashboardAudit] Specialized token retrieval failed, falling back to anonymous client:', e);
  }

  const supabase = getSupabaseClient(token || undefined);

  const [
    globalRes,
    dailyRes,
    monthlyRes,
    rpcRes,
    tierRes,
    topConsumersBundle,
  ] = await Promise.all([
    supabase.from('global_usage_stats').select('*').single(),
    supabase.from('daily_usage_summary').select('*').order('date', { ascending: false }).limit(30),
    supabase.from('monthly_usage_summary').select('*').order('date', { ascending: false }).limit(12),
    supabase.rpc('get_dashboard_stats', { timeframe }),
    supabase.from('user_tier_distribution').select('*'),
    fetchTopConsumersWithEmails(supabase, 5),
  ]);

  const lifetimeCost = Number(globalRes.data?.lifetime_cost) || 0;
  const dailyMetrics = dailyRes.data || [];
  const monthlyMetrics = monthlyRes.data || [];
  if (monthlyRes.error) {
    console.error('[DashboardAudit] Monthly Metrics Error:', monthlyRes.error);
  }

  const dailyData = dailyMetrics
    .map((m) => {
      const dateObj = new Date(m.date);
      return {
        name: isNaN(dateObj.getTime()) ? m.date : dateObj.toISOString().split('T')[0],
        apiCost: Number(m.total_cost) || 0,
        revenue: Number(m.total_revenue) || 0,
      };
    })
    .sort((a, b) => (a.name < b.name ? -1 : 1));

  const yearlyData = monthlyMetrics
    .map((m) => {
      const dateObj = new Date(m.date);
      return {
        name: dateObj.toLocaleDateString('en-US', { month: 'short' }),
        apiCost: Number(m.total_cost) || 0,
        revenue: Number(m.total_revenue) || 0,
      };
    })
    .reverse();

  const { topConsumersData, userEmailMap } = topConsumersBundle;
  const topConsumers = topConsumersData.map((entry) => {
    const uid = entry.userId;
    const email = userEmailMap[uid] || 'User ' + String(uid).slice(0, 5);
    return {
      id: uid,
      user: email,
      cost: Number(entry.total_cost) || 0,
      icon: `https://ui-avatars.com/api/?name=${email.charAt(0)}&background=random&color=fff`,
    };
  });

  const safeRpcData = rpcRes.data || {};
  const totalRevenue = Number(safeRpcData.totalRevenue || 0);
  const weeklyData = dailyData.slice(-7);
  const monthlyData = dailyData;

  const recentSignups = (safeRpcData.recentSignups || []).map((u: any) => ({
    ...u,
    date: new Date(u.date).toLocaleDateString(),
    plan: (u.plan || 'newbie').charAt(0).toUpperCase() + (u.plan || 'newbie').slice(1),
    icon: `https://ui-avatars.com/api/?name=${u.user?.charAt(0) || 'U'}&background=random&color=fff`,
  }));

  const acquisitionData = (tierRes.data || []).map((t) => ({
    name: t.tier.charAt(0).toUpperCase() + t.tier.slice(1),
    count: t.user_count,
  }));

  return {
    totalRevenue,
    totalApiCost: lifetimeCost,
    netProfit: totalRevenue - lifetimeCost,
    profitMargin: totalRevenue > 0 ? ((totalRevenue - lifetimeCost) / totalRevenue) * 100 : 0,
    dailyData,
    weeklyData,
    monthlyData,
    yearlyData,
    recentSignups,
    topConsumers,
    acquisitionData,
    activeSessionsCount: safeRpcData.activeSessionsCount || 0,
  };
}

export function useDashboardMetrics(timeframe: string = 'Month') {
  const { getToken } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-metrics', timeframe],
    queryFn: () => fetchDashboardMetrics(() => getToken({ template: 'supabase' }), timeframe),
    refetchInterval: DASHBOARD_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });

  return {
    loading: isLoading,
    error,
    totalRevenue: data?.totalRevenue || 0,
    totalApiCost: data?.totalApiCost || 0,
    netProfit: data?.netProfit || 0,
    profitMargin: data?.profitMargin || 0,
    dailyData: data?.dailyData || [],
    weeklyData: data?.weeklyData || [],
    monthlyData: data?.monthlyData || [],
    yearlyData: data?.yearlyData || [],
    recentSignups: data?.recentSignups || [],
    topConsumers: data?.topConsumers || [],
    acquisitionData: data?.acquisitionData || [],
    activeSessionsCount: data?.activeSessionsCount || 0,
  };
}
