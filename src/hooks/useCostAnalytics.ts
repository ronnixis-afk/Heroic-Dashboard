/**
 * Focused cost-analytics hook for Financial Reports.
 * Avoids mounting the full useAnalyticsMetrics mega-fetch on that page.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/AuthContext';
import { fetchCostAnalyticsBundle, metricsQueryKeys } from '../lib/metricsFetches';

const COST_ANALYTICS_REFETCH_MS = 5 * 60 * 1000;

export function useCostAnalytics(days = 30) {
  const { getToken } = useAuth();

  const { data, isLoading: loading, error } = useQuery({
    queryKey: metricsQueryKeys.costAnalytics(days),
    queryFn: async () => {
      const rpgToken = await getToken();
      if (!rpgToken) {
        throw new Error('Admin Session Expired. Please Sign In Again.');
      }
      return fetchCostAnalyticsBundle(rpgToken, days);
    },
    refetchInterval: COST_ANALYTICS_REFETCH_MS,
    refetchIntervalInBackground: false,
  });

  return {
    loading,
    error,
    modelCostData: data?.modelCostData || [],
    dailyCostData: data?.dailyCostData || [],
  };
}
