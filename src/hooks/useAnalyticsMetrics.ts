/**
 * ANALYTICS METRICS HOOK
 *
 * Aggregates platform metrics from Clerk-gated Heroic AI RPG admin APIs.
 * Independent reads run in parallel; RPG calls share one pre-fetched Clerk token.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/AuthContext';
import { fetchRpgAdmin } from '../lib/rpgAdminApi';
import { fetchCostAnalyticsBundle, fetchTopConsumersWithEmails } from '../lib/metricsFetches';

const ANALYTICS_REFETCH_INTERVAL_MS = 5 * 60 * 1000;

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function formatComparison(pct: number | null): string {
  if (pct === null || Number.isNaN(pct)) return '—';
  const rounded = Math.round(pct * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

interface MessagesPerUserRow {
  date: string;
  activeUsers: number;
  totalMessages: number;
  msgsPerUser: number;
}

interface SessionLengthApiResponse {
  daily: {
    date: string;
    totalSessions: number;
    avgDurationMin: number;
    medianDurationMin: number;
    p95DurationMin: number;
  }[];
  distribution: { range: string; count: number; percentage: number }[];
}

interface FeatureUsageApiResponse {
  usage: {
    feature: string;
    totalUses: number;
    percentage: number;
    uniqueUsers: number;
    avgDurationMs: number;
  }[];
  chatOnlyUsers: number;
}

type ViewDataResponse<T> = { resource: string; data: T };

function titleCaseFeature(name: string): string {
  if (!name) return 'Unknown';
  return name
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

async function fetchAnalyticsMetrics(
  getToken: (options?: { template?: string }) => Promise<string | null>
) {
  const rpgToken = (await getToken()) || '';
  if (!rpgToken) {
    throw new Error('Admin Session Expired. Please Sign In Again.');
  }

  const [
    costBundle,
    topConsumersBundle,
    featureRes,
    sessionStatsRes,
    activeSessionsRes,
    hourlyStatsRes,
    pageVisitRes,
    featureApi,
    sessionLengthData,
    messagesData,
  ] = await Promise.all([
    fetchCostAnalyticsBundle(rpgToken, 30),
    fetchTopConsumersWithEmails(rpgToken, 5),
    fetchRpgAdmin<ViewDataResponse<any[]>>(
      '/api/admin/analytics/view-data?resource=feature-usage',
      rpgToken
    ).catch((e) => {
      console.warn('[AnalyticsAudit] feature-usage view failed:', e);
      return { data: [] as any[] };
    }),
    fetchRpgAdmin<ViewDataResponse<any[]>>(
      '/api/admin/analytics/view-data?resource=session-metrics&days=30',
      rpgToken
    ).catch((e) => {
      console.warn('[AnalyticsAudit] session-metrics view failed:', e);
      return { data: [] as any[] };
    }),
    fetchRpgAdmin<ViewDataResponse<{ current: number; prior: number }>>(
      '/api/admin/analytics/view-data?resource=active-sessions',
      rpgToken
    ).catch((e) => {
      console.warn('[AnalyticsAudit] active-sessions failed:', e);
      return { data: { current: 0, prior: 0 } };
    }),
    fetchRpgAdmin<ViewDataResponse<any[]>>(
      '/api/admin/analytics/view-data?resource=hourly-stats',
      rpgToken
    ).catch((e) => {
      console.warn('[AnalyticsAudit] hourly-stats failed:', e);
      return { data: [] as any[] };
    }),
    fetchRpgAdmin<ViewDataResponse<any[]>>(
      '/api/admin/analytics/view-data?resource=page-visits',
      rpgToken
    ).catch((e) => {
      console.warn('[AnalyticsAudit] page-visits failed:', e);
      return { data: [] as any[] };
    }),
    fetchRpgAdmin<FeatureUsageApiResponse>('/api/admin/analytics/feature-usage', rpgToken).catch(
      (e) => {
        console.warn('[AnalyticsAudit] feature-usage API failed:', e);
        return null;
      }
    ),
    fetchRpgAdmin<SessionLengthApiResponse>(
      '/api/admin/analytics/session-length?days=30',
      rpgToken
    ).catch((e) => {
      console.warn('[AnalyticsAudit] session-length API failed:', e);
      return null;
    }),
    fetchRpgAdmin<MessagesPerUserRow[]>('/api/admin/analytics/messages-per-user', rpgToken).catch(
      (e) => {
        console.warn('[AnalyticsAudit] messages-per-user API failed:', e);
        return null;
      }
    ),
  ]);

  const { dailyMetrics, modelData, modelCostData, dailyCostData } = costBundle;

  const usageTrends = dailyMetrics
    .map((m) => ({
      date: new Date(m.date).toISOString().split('T')[0],
      tokens: m.total_tokens || 0,
      cost: m.total_cost || 0,
      users: m.active_users || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalCost = dailyMetrics.reduce((acc, curr) => acc + (curr.total_cost || 0), 0);

  const sortedDailyCosts = [...dailyMetrics].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const latestDay = sortedDailyCosts[sortedDailyCosts.length - 1];
  const priorDay = sortedDailyCosts[sortedDailyCosts.length - 2];
  const costComparison = percentChange(
    Number(latestDay?.total_cost || 0),
    Number(priorDay?.total_cost || 0)
  );

  const totalModelUses = modelData.reduce((acc, curr) => acc + (curr.usage_count || 0), 0) || 1;
  const colors = ['#3ecf8e', '#20cce0', '#38bdf8', '#fbbf24', '#f87171'];
  const distribution = modelData.map((m, idx) => ({
    name: m.model || 'Unknown',
    value: Math.round((m.usage_count / totalModelUses) * 100),
    color: colors[idx % colors.length],
  }));

  const { topConsumersData, userEmailMap } = topConsumersBundle;
  const leaders = topConsumersData.map((entry) => {
    const email = userEmailMap[entry.userId] || 'Unknown';
    const tokens = entry.total_tokens || 0;
    return {
      email,
      tokens: tokens > 1000000 ? `${(tokens / 1000000).toFixed(1)}M` : `${Math.round(tokens / 1000)}k`,
      cost: entry.total_cost || 0,
      usages: entry.interaction_count || 0,
    };
  });

  const featureData = featureRes.data || [];
  const totalUsesAll = featureData.reduce((acc, curr) => acc + (curr.usage_count || 0), 0) || 1;
  const costByFeature = new Map<string, number>();
  featureData.forEach((f) => {
    const key = String(f.feature_name || '').toLowerCase();
    if (key) costByFeature.set(key, Number(f.total_cost) || 0);
  });

  let featureUsageRows = featureData
    .map((f) => ({
      feature: titleCaseFeature(String(f.feature_name || 'Unknown')),
      totalUses: Number(f.usage_count) || 0,
      percentage: parseFloat(((f.usage_count / totalUsesAll) * 100).toFixed(1)),
      totalCost: Number(f.total_cost) || 0,
      uniqueUsers: 0,
      avgDurationMs: 0,
    }))
    .sort((a, b) => b.totalUses - a.totalUses);

  let chatOnlyUsers = 0;
  if (featureApi?.usage?.length) {
    featureUsageRows = featureApi.usage
      .map((f) => {
        const feature = titleCaseFeature(String(f.feature || 'Unknown'));
        return {
          feature,
          totalUses: Number(f.totalUses) || 0,
          percentage: Number(f.percentage) || 0,
          totalCost: costByFeature.get(String(f.feature || '').toLowerCase()) || 0,
          uniqueUsers: Number(f.uniqueUsers) || 0,
          avgDurationMs: Number(f.avgDurationMs) || 0,
        };
      })
      .sort((a, b) => b.totalUses - a.totalUses);
    chatOnlyUsers = Number(featureApi.chatOnlyUsers) || 0;
  }

  let sessionDaily = (sessionStatsRes.data || [])
    .map((s) => ({
      date: new Date(s.date).toISOString().split('T')[0],
      totalSessions: s.total_sessions,
      avgDurationMin: parseFloat(((s.avg_duration_sec || 0) / 60).toFixed(1)),
      medianDurationMin: parseFloat(((s.median_duration_sec || 0) / 60).toFixed(1)),
      p95DurationMin: parseFloat(((s.p95_duration_sec || 0) / 60).toFixed(1)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  let sessionDistribution: { range: string; count: number; percentage: number }[] = [];
  if (sessionLengthData?.daily?.length) {
    sessionDaily = sessionLengthData.daily
      .map((d) => ({
        date: d.date,
        totalSessions: d.totalSessions,
        avgDurationMin: d.avgDurationMin,
        medianDurationMin: d.medianDurationMin,
        p95DurationMin: d.p95DurationMin,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  sessionDistribution = sessionLengthData?.distribution || [];

  const messagesPerUser = (messagesData || [])
    .map((row) => ({
      date: row.date,
      activeUsers: Number(row.activeUsers) || 0,
      totalMessages: Number(row.totalMessages) || 0,
      msgsPerUser: Number(row.msgsPerUser) || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const activeSessionsCount = activeSessionsRes.data?.current || 0;
  const priorActiveSessionsCount = activeSessionsRes.data?.prior || 0;
  const sessionsComparison = percentChange(activeSessionsCount, priorActiveSessionsCount);

  const sortedHourly = [...(hourlyStatsRes.data || [])].sort(
    (a, b) => new Date(a.hour).getTime() - new Date(b.hour).getTime()
  );
  const recentHours = sortedHourly.slice(-12);
  const priorHours = sortedHourly.slice(-24, -12);

  const realTimeTrends = sortedHourly.map((h) => ({
    hour: new Date(h.hour).getHours() + ':00',
    users: h.active_users || 0,
    cost: h.total_cost || 0,
    latency: h.avg_latency || 0,
  }));

  const avgOf = (rows: typeof sortedHourly, key: 'avg_latency') => {
    if (rows.length === 0) return 0;
    return rows.reduce((acc, h) => acc + (Number(h[key]) || 0), 0) / rows.length;
  };
  const latencyComparison = percentChange(avgOf(recentHours, 'avg_latency'), avgOf(priorHours, 'avg_latency'));

  const avgLatency =
    realTimeTrends.length > 0
      ? Math.round(realTimeTrends.reduce((acc, curr) => acc + curr.latency, 0) / realTimeTrends.length)
      : 0;

  const pageVisitData = pageVisitRes.data || [];
  const totalPageVisits = pageVisitData.reduce((acc, curr) => acc + (curr.visit_count || 0), 0) || 1;
  const pageVisitUsage = pageVisitData
    .map((p) => ({
      page: p.page,
      visits: p.visit_count || 0,
      percentage: parseFloat(((p.visit_count / totalPageVisits) * 100).toFixed(1)),
      uniqueUsers: p.unique_users || 0,
    }))
    .sort((a, b) => b.visits - a.visits);

  return {
    usageTrends,
    totalCost,
    modelDistribution: distribution,
    topUsers: leaders,
    activeSessionsCount,
    avgSessionLength:
      sessionDaily.length > 0 ? Math.round(sessionDaily[sessionDaily.length - 1].avgDurationMin) : 0,
    sessionTrends: sessionDaily,
    featureUsage: { usage: featureUsageRows, chatOnlyUsers },
    messagesPerUser,
    sessionLengths: { daily: sessionDaily, distribution: sessionDistribution },
    realTimeTrends,
    costComparison,
    sessionsComparison,
    latencyComparison,
    avgLatency,
    pageVisitUsage,
    modelCostData,
    dailyCostData,
  };
}

export function useAnalyticsMetrics() {
  const { getToken } = useAuth();
  const { data, isLoading: loading } = useQuery({
    queryKey: ['analytics-metrics'],
    queryFn: () => fetchAnalyticsMetrics(getToken),
    refetchInterval: ANALYTICS_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });

  return {
    loading,
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
