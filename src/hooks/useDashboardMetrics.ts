import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

const DASHBOARD_REFETCH_INTERVAL_MS = 5 * 60 * 1000;

async function fetchDashboardMetrics(getToken: (options?: any) => Promise<string | null>, timeframe: string = 'Month') {
  let token: string | null = null;
  try {
    // Attempt to get the specialized Supabase token
    token = await getToken();
  } catch (e) {
    console.error('[DashboardAudit] Specialized token retrieval failed, falling back to anonymous client:', e);
  }
  
  const supabase = getSupabaseClient(token || undefined);
  console.log('[DashboardAudit] Client initialized with token:', token ? 'YES' : 'NO (Anonymous Mode)');
  
  // 1. Fetch Global Lifetime Totals
  const { data: globalStats } = await supabase.from('global_usage_stats').select('*').single();
  const lifetimeCost = Number(globalStats?.lifetime_cost) || 0;

  // 2. Fetch Aggregated Daily Data from View (Ordered by Date)
  const { data: dailyMetrics } = await supabase
    .from('daily_usage_summary')
    .select('*')
    .order('date', { ascending: false })
    .limit(30);

  // 3. Fetch Aggregated Monthly Data (For the "Year" chart)
  const { data: monthlyMetrics, error: monthlyError } = await supabase
    .from('monthly_usage_summary')
    .select('*')
    .order('date', { ascending: false })
    .limit(12);

  console.log('[DEBUG-ANALYTICS] Monthly Metrics Raw:', monthlyMetrics);
  if (monthlyError) console.error('[DEBUG-ANALYTICS] Monthly Metrics Error:', monthlyError);

  // 4. Fetch Top Consumers from View
  const { data: topConsumersData } = await supabase
    .from('top_consumers_summary')
    .select('*')
    .order('total_cost', { ascending: false })
    .limit(5);

  // 5. Fetch User Metadata for the top consumers
  const topUserIds = (topConsumersData || []).map(u => u.userId || u.userId).filter(Boolean);
  let userMetadataMap: Record<string, any> = {};
  
  if (topUserIds.length > 0) {
    const { data: usersData } = await supabase
      .from('User')
      .select('id, email')
      .in('id', topUserIds);
    (usersData || []).forEach(u => { userMetadataMap[u.id] = u; });
  }

  // Process Daily Data for Charts
  const dailyData = (dailyMetrics || [])
    .map(m => {
      const dateObj = new Date(m.date);
      return {
        name: isNaN(dateObj.getTime()) ? m.date : dateObj.toISOString().split('T')[0],
        apiCost: Number(m.total_cost) || 0,
        revenue: Number(m.total_revenue) || 0 
      };
    })
    .sort((a, b) => a.name < b.name ? -1 : 1);

  // Process Monthly Data for the Year Chart
  const yearlyData = (monthlyMetrics || [])
    .map(m => {
      const dateObj = new Date(m.date);
      return {
        name: dateObj.toLocaleDateString('en-US', { month: 'short' }),
        apiCost: Number(m.total_cost) || 0,
        revenue: Number(m.total_revenue) || 0
      };
    })
    .reverse();

  // Process Top Consumers for Table
  const topConsumers = (topConsumersData || []).map(entry => {
    const uid = entry.userId || entry.userId;
    const u = userMetadataMap[uid] || {};
    return {
      id: uid,
      user: u.email || 'User ' + uid.slice(0,5),
      cost: Number(entry.total_cost) || 0,
      icon: `https://ui-avatars.com/api/?name=${(u.email || 'U').charAt(0)}&background=random&color=fff`
    };
  });

  // Note: We use timeframe to match the Supabase function signature
  const { data: rpcData } = await supabase.rpc('get_dashboard_stats', { timeframe });
  const safeRpcData = rpcData || {};
  const totalRevenue = Number(safeRpcData.totalRevenue || 0);

  // Calculate Weekly, Monthly, and Yearly data from the daily metrics (for the charts)
  const weeklyData = dailyData.slice(-7);
  const monthlyData = dailyData; 

  // Restore signup and acquisition data from RPC
  const recentSignups = (safeRpcData.recentSignups || []).map((u: any) => ({
    ...u,
    date: new Date(u.date).toLocaleDateString(),
    plan: (u.plan || 'newbie').charAt(0).toUpperCase() + (u.plan || 'newbie').slice(1),
    icon: `https://ui-avatars.com/api/?name=${u.user?.charAt(0) || 'U'}&background=random&color=fff`
  }));

  // 6. Fetch User Tier Distribution
  const { data: tierData } = await supabase.from('user_tier_distribution').select('*');
  const acquisitionData = (tierData || []).map(t => ({
    name: t.tier.charAt(0).toUpperCase() + t.tier.slice(1),
    count: t.user_count
  }));

  console.log('[DashboardAudit] Scalable calculation complete. Tier distribution enabled.');

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
    activeSessionsCount: safeRpcData.activeSessionsCount || 0
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
    activeSessionsCount: data?.activeSessionsCount || 0
  };
}

