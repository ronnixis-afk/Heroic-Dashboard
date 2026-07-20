import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/AuthContext';
import { fetchRpgAdmin } from '../lib/rpgAdminApi';

const DASHBOARD_REFETCH_INTERVAL_MS = 5 * 60 * 1000;

export type DashboardMetricsPayload = {
  totalRevenue: number;
  totalApiCost: number;
  netProfit: number;
  profitMargin: number;
  dailyData: { name: string; apiCost: number; revenue: number }[];
  weeklyData: { name: string; apiCost: number; revenue: number }[];
  monthlyData: { name: string; apiCost: number; revenue: number }[];
  yearlyData: { name: string; apiCost: number; revenue: number }[];
  recentSignups: any[];
  topConsumers: {
    id: string;
    user: string;
    cost: number;
    icon: string;
  }[];
  acquisitionData: { name: string; count: number }[];
  activeSessionsCount: number;
};

async function fetchDashboardMetrics(
  getToken: (options?: { template?: string }) => Promise<string | null>
) {
  return fetchRpgAdmin<DashboardMetricsPayload>(
    '/api/admin/analytics/dashboard-metrics',
    getToken
  );
}

export function useDashboardMetrics() {
  const { getToken } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => fetchDashboardMetrics(getToken),
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
