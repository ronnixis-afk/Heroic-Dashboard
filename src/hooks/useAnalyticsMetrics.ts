/**
 * ANALYTICS METRICS HOOK
 *
 * Aggregates platform metrics from Clerk-gated Heroic AI RPG admin APIs.
 * Independent reads run in parallel; RPG calls share one pre-fetched Clerk token.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/AuthContext';
import { fetchRpgAdmin } from '../lib/rpgAdminApi';
import { fetchAnalyticsInsights } from '../lib/analyticsInsights';

const ANALYTICS_REFETCH_INTERVAL_MS = 5 * 60 * 1000;

export function formatComparison(pct: number | null): string {
  if (pct === null || Number.isNaN(pct)) return '—';
  const rounded = Math.round(pct * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

async function fetchAnalyticsMetrics(
  getToken: (options?: { template?: string }) => Promise<string | null>
) {
  const rpgToken = (await getToken()) || '';
  if (!rpgToken) {
    throw new Error('Admin Session Expired. Please Sign In Again.');
  }

  return fetchAnalyticsInsights((path) => fetchRpgAdmin(path, rpgToken));
}

export function useAnalyticsMetrics() {
  const { getToken } = useAuth();
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['analytics-metrics'],
    queryFn: () => fetchAnalyticsMetrics(getToken),
    refetchInterval: ANALYTICS_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });

  return {
    loading,
    error,
    degradedMessage: data?.degradedMessage || null,
    usageTrends: data?.usageTrends || [],
    modelDistribution: data?.modelDistribution || [],
    modelCostData: data?.modelCostData || [],
    dailyCostData: data?.dailyCostData || [],
    topUsers: data?.topUsers || [],
    activeSessionsCount: data?.activeSessionsCount || 0,
    avgSessionLength: data?.avgSessionLength || 0,
    sessionTrends: data?.sessionTrends || [],
    totalCost: data?.totalCost || 0,
    featureUsage: data?.featureUsage || { usage: [], chatOnlyUsers: 0 },
    messagesPerUser: data?.messagesPerUser || [],
    sessionLengths: data?.sessionLengths || { daily: [], distribution: [] },
    realTimeTrends: data?.realTimeTrends || [],
    costComparison: data?.costComparison ?? null,
    sessionsComparison: data?.sessionsComparison ?? null,
    latencyComparison: data?.latencyComparison ?? null,
    avgLatency: data?.avgLatency || 0,
    pageVisitUsage: data?.pageVisitUsage || [],
  };
}
