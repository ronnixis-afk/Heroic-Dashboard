import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

async function fetchDashboardMetrics() {
  // 1. Fetch data from RPC for signups and sessions (which are still efficient)
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_dashboard_stats');
  if (rpcError) throw rpcError;

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
    if (error) throw error;
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

  const recentSignups = (rpcData.recentSignups || []).map((u: any) => ({
    ...u,
    date: new Date(u.date).toLocaleDateString(),
    plan: u.plan.charAt(0).toUpperCase() + u.plan.slice(1),
    icon: `https://ui-avatars.com/api/?name=${u.user?.charAt(0) || 'U'}&background=random&color=fff`
  }));

  const signupCount = rpcData.totalUsers || 0;
  const acquisitionData = [
    { name: 'Organic', organic: Math.round(signupCount * 0.5), referral: 0, paid: 0 },
    { name: 'Referral', organic: 0, referral: Math.round(signupCount * 0.3), paid: 0 },
    { name: 'Paid', organic: 0, referral: 0, paid: Math.round(signupCount * 0.2) },
  ];

  const totalRevenue = rpcData.totalRevenue || 0;

  return {
    totalRevenue,
    totalApiCost,
    netProfit: totalRevenue - totalApiCost,
    profitMargin: totalRevenue > 0 ? ((totalRevenue - totalApiCost) / totalRevenue) * 100 : 0,
    dailyData,
    weeklyData: rpcData.weeklyData || [], // Keep RPC for these for now
    monthlyData: rpcData.monthlyData || [],
    yearlyData,
    recentSignups,
    topConsumers: rpcData.topConsumers || [],
    acquisitionData,
    activeSessionsCount: rpcData.activeSessionsCount || 0
  };
}

export function useDashboardMetrics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: fetchDashboardMetrics,
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

