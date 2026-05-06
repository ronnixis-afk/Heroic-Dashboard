import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

async function fetchDashboardMetrics() {
  const { data, error } = await supabase.rpc('get_dashboard_stats');

  if (error) {
    console.error('Error fetching dashboard metrics via RPC:', error);
    throw error;
  }

  // Map RPC data to the dashboard's expected format
  const recentSignups = (data.recentSignups || []).map((u: any) => ({
    ...u,
    date: new Date(u.date).toLocaleDateString(),
    plan: u.plan.charAt(0).toUpperCase() + u.plan.slice(1),
    icon: `https://ui-avatars.com/api/?name=${u.user?.charAt(0) || 'U'}&background=random&color=fff`
  }));

  const topConsumers = (data.topConsumers || []).map((u: any) => ({
    ...u,
    icon: `https://ui-avatars.com/api/?name=${u.user.charAt(0)}&background=random&color=fff`
  }));

  const signupCount = data.totalUsers || 0;
  const acquisitionData = [
    { name: 'Organic', organic: Math.round(signupCount * 0.5), referral: 0, paid: 0 },
    { name: 'Referral', organic: 0, referral: Math.round(signupCount * 0.3), paid: 0 },
    { name: 'Paid', organic: 0, referral: 0, paid: Math.round(signupCount * 0.2) },
  ];

  return {
    totalRevenue: data.totalRevenue || 0,
    totalApiCost: data.totalApiCost || 0,
    netProfit: data.netProfit || 0,
    profitMargin: data.profitMargin || 0,
    dailyData: data.dailyData || [],
    weeklyData: data.weeklyData || [],
    monthlyData: data.monthlyData || [],
    yearlyData: data.yearlyData || [],
    recentSignups,
    topConsumers,
    acquisitionData,
    activeSessionsCount: data.activeSessionsCount || 0
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

