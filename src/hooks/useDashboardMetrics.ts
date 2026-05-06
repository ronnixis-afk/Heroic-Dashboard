import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

async function fetchDashboardMetrics() {
  // 1. Fetch Users
  const { data: users, error: usersError } = await supabase
    .from('User')
    .select('*')
    .order('createdAt', { ascending: false });

  if (usersError) throw usersError;

  // 2. Fetch Usage Logs
  const { data: logs, error: logsError } = await supabase
    .from('UsageLog')
    .select('*, User(email)');

  if (logsError) throw logsError;

  // Aggregate Metrics
  const recentSignups = (users || []).slice(0, 5).map(u => ({
    id: u.id,
    user: u.email,
    date: new Date(u.createdAt).toLocaleDateString(),
    plan: u.tier.charAt(0).toUpperCase() + u.tier.slice(1),
    icon: `https://ui-avatars.com/api/?name=${u.email?.charAt(0) || 'U'}&background=random&color=fff`
  }));

  const totalApiCost = (logs || []).reduce((sum, log) => sum + (log.costUsd || 0), 0);
  const totalRevenue = totalApiCost * 3;
  const netProfit = totalRevenue - totalApiCost;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const monthlyData: Record<string, any> = {};
  logs?.forEach(log => {
    const month = new Date(log.createdAt).toLocaleString('default', { month: 'short' });
    if (!monthlyData[month]) monthlyData[month] = { name: month, revenue: 0, apiCost: 0 };
    monthlyData[month].apiCost += log.costUsd;
    monthlyData[month].revenue += log.costUsd * 3;
  });

  const consumerMap: Record<string, any> = {};
  logs?.forEach(log => {
    const email = log.User?.email || 'Unknown';
    if (!consumerMap[email]) {
      consumerMap[email] = { id: log.userId, user: email, model: log.model, cost: 0 };
    }
    consumerMap[email].cost += log.costUsd;
    consumerMap[email].model = log.model;
  });

  const topConsumers = Object.values(consumerMap)
    .sort((a: any, b: any) => b.cost - a.cost)
    .slice(0, 4)
    .map((u: any) => ({
      ...u,
      icon: `https://ui-avatars.com/api/?name=${u.user.charAt(0)}&background=random&color=fff`
    }));

  const signupCount = users?.length || 0;
  const acquisitionData = [
    { name: 'Organic', organic: Math.round(signupCount * 0.5), referral: 0, paid: 0 },
    { name: 'Referral', organic: 0, referral: Math.round(signupCount * 0.3), paid: 0 },
    { name: 'Paid', organic: 0, referral: 0, paid: Math.round(signupCount * 0.2) },
  ];

  // 3. Fetch Active Sessions
  const { data: sessions } = await supabase
    .from('UserSession')
    .select('lastPing')
    .is('endTime', null);

  const now = new Date().getTime();
  const activeSessionsCount = sessions?.filter(s => (now - new Date(s.lastPing).getTime()) < 300000).length || 0;

  return {
    totalRevenue,
    totalApiCost,
    netProfit,
    profitMargin,
    revenueData: Object.values(monthlyData),
    recentSignups,
    topConsumers,
    acquisitionData,
    activeSessionsCount
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
    revenueData: data?.revenueData || [],
    recentSignups: data?.recentSignups || [],
    topConsumers: data?.topConsumers || [],
    acquisitionData: data?.acquisitionData || [],
    activeSessionsCount: data?.activeSessionsCount || 0
  };
}

