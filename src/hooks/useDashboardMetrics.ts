import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

async function fetchDashboardMetrics(getToken: () => Promise<string | null>, timeframe: string = 'Month') {
  let token: string | null = null;
  try {
    // Attempt to get the specialized Supabase token
    token = await getToken({ template: 'supabase' });
  } catch (e) {
    console.error('[DashboardAudit] Specialized token retrieval failed, falling back to anonymous client:', e);
  }
  
  const supabase = getSupabaseClient(token || undefined);
  console.log('[DashboardAudit] Client initialized with token:', token ? 'YES' : 'NO (Anonymous Mode)');
  
  // 1. Fetch data from RPC
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_dashboard_stats', { timeframe });
  
  if (rpcError) {
    console.error('[DashboardAudit] RPC Error:', rpcError);
    // Don't throw, let's try to proceed with fallback data if possible
  } else {
    console.log('[DashboardAudit] RPC Success:', rpcData);
  }

  const safeRpcData = rpcData || {};

  // 2. Fetch all logs for Unified Financial Calculation (Bottom-Up)
  let allLogs: any[] = [];
  let from = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data, error, count } = await supabase
      .from('UsageLog')
      .select('tokens, inputTokens, outputTokens, costUsd, createdAt', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('[DashboardAudit] Error fetching logs range:', from, error);
      throw error;
    }
    console.log(`[DashboardAudit] Fetched ${data?.length || 0} logs (range ${from}-${from + PAGE_SIZE - 1})`);
    if (!data || data.length === 0) break;
    allLogs = [...allLogs, ...data];
    if (data.length < PAGE_SIZE || (count !== null && allLogs.length >= count)) break;
    from += PAGE_SIZE;
    if (from >= 100000) break;
  }

  // Unified Cost Calculation
  const { calculateFallbackCost } = await import('../lib/costCalculator');

  let totalApiCost = 0;
  const dailyMap: Record<string, number> = {};
  const weeklyMap: Record<string, number> = {};
  const monthlyMap: Record<string, number> = {};
  const yearlyMap: Record<string, number> = {};

  allLogs.forEach(log => {
    let cost = calculateFallbackCost(log);
    totalApiCost += cost;

    const date = new Date(log.createdAt);
    const dKey = date.toISOString().split('T')[0];
    const yKey = date.getFullYear().toString();
    
    dailyMap[dKey] = (dailyMap[dKey] || 0) + cost;
    yearlyMap[yKey] = (yearlyMap[yKey] || 0) + cost;
  });

  const dailyData = Object.entries(dailyMap).map(([name, cost]) => ({ name, apiCost: cost, revenue: 0 })).sort((a,b) => a.name.localeCompare(b.name)).slice(-30);
  const yearlyData = Object.entries(yearlyMap).map(([name, cost]) => ({ name, apiCost: cost, revenue: 0 })).sort((a,b) => a.name.localeCompare(b.name));

  const recentSignups = (safeRpcData.recentSignups || []).map((u: any) => ({
    ...u,
    date: new Date(u.date).toLocaleDateString(),
    plan: (u.plan || 'newbie').charAt(0).toUpperCase() + (u.plan || 'newbie').slice(1),
    icon: `https://ui-avatars.com/api/?name=${u.user?.charAt(0) || 'U'}&background=random&color=fff`
  }));

  const signupCount = safeRpcData.totalUsers || 0;
  const acquisitionData = [
    { name: 'Organic', organic: Math.round(signupCount * 0.5), referral: 0, paid: 0 },
    { name: 'Referral', organic: 0, referral: Math.round(signupCount * 0.3), paid: 0 },
    { name: 'Paid', organic: 0, referral: 0, paid: Math.round(signupCount * 0.2) },
  ];

  const totalRevenue = safeRpcData.totalRevenue || 0;

  console.log('[DashboardAudit] Final calculation complete. Costs:', totalApiCost);

  return {
    totalRevenue,
    totalApiCost,
    netProfit: totalRevenue - totalApiCost,
    profitMargin: totalRevenue > 0 ? ((totalRevenue - totalApiCost) / totalRevenue) * 100 : 0,
    dailyData,
    weeklyData: safeRpcData.weeklyData || [], 
    monthlyData: safeRpcData.monthlyData || [],
    yearlyData,
    recentSignups,
    topConsumers: safeRpcData.topConsumers || [],
    acquisitionData,
    activeSessionsCount: safeRpcData.activeSessionsCount || 0
  };
}

export function useDashboardMetrics(timeframe: string = 'Month') {
  const { getToken } = useAuth();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-metrics', timeframe],
    queryFn: () => fetchDashboardMetrics(() => getToken({ template: 'supabase' }), timeframe),
    refetchInterval: 60000, // Refresh every minute
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

