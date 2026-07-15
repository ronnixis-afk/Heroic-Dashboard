/**
 * ANALYTICS METRICS HOOK
 *
 * Aggregates platform metrics from Supabase views and Heroic AI RPG admin APIs.
 */
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { fetchRpgAdmin } from '../lib/rpgAdminApi';

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

interface CostAnalyticsApiResponse {
  daily: {
    date: string;
    activeUsers: number;
    totalCost: number;
    costPerUser: number;
  }[];
  byModel: {
    model: string;
    calls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
    avgLatencyMs: number;
  }[];
}

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
  let supabaseToken: string | null = null;
  try {
    supabaseToken = await getToken({ template: 'supabase' });
  } catch (e) {
    console.warn('[AnalyticsAudit] Failed to get specialized token:', e);
  }

  const supabase = getSupabaseClient(supabaseToken || undefined);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

  const { data: dailyMetrics, error: dailyError } = await supabase
    .from('daily_usage_summary')
    .select('*')
    .gte('date', dateStr)
    .order('date', { ascending: false });

  if (dailyError) console.error('[AnalyticsAudit] daily_usage_summary error:', dailyError);

  const usageTrends = (dailyMetrics || [])
    .map((m) => ({
      date: new Date(m.date).toISOString().split('T')[0],
      tokens: m.total_tokens || 0,
      cost: m.total_cost || 0,
      users: m.active_users || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalCost = (dailyMetrics || []).reduce((acc, curr) => acc + (curr.total_cost || 0), 0);

  const sortedDailyCosts = [...(dailyMetrics || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const latestDay = sortedDailyCosts[sortedDailyCosts.length - 1];
  const priorDay = sortedDailyCosts[sortedDailyCosts.length - 2];
  const costComparison = percentChange(
    Number(latestDay?.total_cost || 0),
    Number(priorDay?.total_cost || 0)
  );

  const { data: modelData } = await supabase.from('model_usage_distribution').select('*');
  const totalModelUses = (modelData || []).reduce((acc, curr) => acc + (curr.usage_count || 0), 0) || 1;
  const colors = ['#3ecf8e', '#20cce0', '#38bdf8', '#fbbf24', '#f87171'];

  const distribution = (modelData || []).map((m, idx) => ({
    name: m.model || 'Unknown',
    value: Math.round((m.usage_count / totalModelUses) * 100),
    color: colors[idx % colors.length],
  }));

  let modelCostData = (modelData || []).map((m) => ({
    model: m.model || 'Unknown',
    calls: Number(m.usage_count) || 0,
    totalInputTokens: Number(m.total_input_tokens) || 0,
    totalOutputTokens: Number(m.total_output_tokens) || 0,
    totalCost: Number(m.total_cost) || 0,
    avgLatencyMs: Number(m.avg_latency) || 0,
  }));

  let dailyCostData = (dailyMetrics || []).map((m) => ({
    date: m.date,
    activeUsers: m.active_users || 0,
    totalCost: Number(m.total_cost) || 0,
    costPerUser: m.active_users > 0 ? m.total_cost / m.active_users : 0,
  }));

  try {
    const costAnalytics = await fetchRpgAdmin<CostAnalyticsApiResponse>(
      '/api/admin/analytics/cost-analytics?days=30',
      getToken
    );
    if (costAnalytics.byModel?.length) {
      modelCostData = costAnalytics.byModel.map((m) => ({
        model: m.model || 'Unknown',
        calls: Number(m.calls) || 0,
        totalInputTokens: Number(m.totalInputTokens) || 0,
        totalOutputTokens: Number(m.totalOutputTokens) || 0,
        totalCost: Number(m.totalCost) || 0,
        avgLatencyMs: Number(m.avgLatencyMs) || 0,
      }));
    }
    if (costAnalytics.daily?.length) {
      dailyCostData = costAnalytics.daily.map((d) => ({
        date: typeof d.date === 'string' ? d.date : String(d.date),
        activeUsers: Number(d.activeUsers) || 0,
        totalCost: Number(d.totalCost) || 0,
        costPerUser: Number(d.costPerUser) || 0,
      }));
    }
  } catch (e) {
    console.warn('[AnalyticsAudit] cost-analytics API failed, using view fallback:', e);
  }

  const { data: topConsumersData } = await supabase.from('top_consumers_summary').select('*').limit(5);
  const topUserIds = (topConsumersData || []).map((u) => u.userId);
  const { data: usersData } = await supabase.from('User').select('id, email').in('id', topUserIds);
  const userEmailMap: Record<string, string> = {};
  (usersData || []).forEach((u) => {
    userEmailMap[u.id] = u.email;
  });

  const leaders = (topConsumersData || []).map((entry) => {
    const email = userEmailMap[entry.userId] || 'Unknown';
    const tokens = entry.total_tokens || 0;
    return {
      email,
      tokens: tokens > 1000000 ? `${(tokens / 1000000).toFixed(1)}M` : `${Math.round(tokens / 1000)}k`,
      cost: entry.total_cost || 0,
      usages: entry.interaction_count || 0,
    };
  });

  const { data: featureData } = await supabase.from('feature_usage_distribution').select('*');
  const totalUsesAll = (featureData || []).reduce((acc, curr) => acc + (curr.usage_count || 0), 0) || 1;
  const costByFeature = new Map<string, number>();
  (featureData || []).forEach((f) => {
    const key = String(f.feature_name || '').toLowerCase();
    if (key) costByFeature.set(key, Number(f.total_cost) || 0);
  });

  let featureUsageRows = (featureData || [])
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

  try {
    const featureApi = await fetchRpgAdmin<FeatureUsageApiResponse>(
      '/api/admin/analytics/feature-usage',
      getToken
    );
    if (featureApi.usage?.length) {
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
  } catch (e) {
    console.warn('[AnalyticsAudit] feature-usage API failed, using view fallback:', e);
  }

  const featureUsage = featureUsageRows;

  const { data: sessionStats } = await supabase
    .from('session_metrics_summary')
    .select('*')
    .gte('date', dateStr)
    .order('date', { ascending: false });

  let sessionDaily = (sessionStats || [])
    .map((s) => ({
      date: new Date(s.date).toISOString().split('T')[0],
      totalSessions: s.total_sessions,
      avgDurationMin: parseFloat(((s.avg_duration_sec || 0) / 60).toFixed(1)),
      medianDurationMin: parseFloat(((s.median_duration_sec || 0) / 60).toFixed(1)),
      p95DurationMin: parseFloat(((s.p95_duration_sec || 0) / 60).toFixed(1)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  let sessionDistribution: { range: string; count: number; percentage: number }[] = [];
  let messagesPerUser: MessagesPerUserRow[] = [];

  try {
    const sessionLengthData = await fetchRpgAdmin<SessionLengthApiResponse>(
      '/api/admin/analytics/session-length?days=30',
      getToken
    );
    if (sessionLengthData.daily?.length) {
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
    sessionDistribution = sessionLengthData.distribution || [];
  } catch (e) {
    console.warn('[AnalyticsAudit] session-length API failed, using view fallback:', e);
  }

  try {
    const messagesData = await fetchRpgAdmin<MessagesPerUserRow[]>(
      '/api/admin/analytics/messages-per-user',
      getToken
    );
    messagesPerUser = (messagesData || [])
      .map((row) => ({
        date: row.date,
        activeUsers: Number(row.activeUsers) || 0,
        totalMessages: Number(row.totalMessages) || 0,
        msgsPerUser: Number(row.msgsPerUser) || 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (e) {
    console.warn('[AnalyticsAudit] messages-per-user API failed:', e);
  }

  const now = new Date();
  const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

  // Live open sessions with a ping in the last 15 minutes (snapshot shown on the card).
  const { count: activeSessionsCount } = await supabase
    .from('UserSession')
    .select('*', { count: 'exact', head: true })
    .is('endTime', null)
    .gt('lastPing', fifteenMinsAgo);

  // Same definition for the prior 15-minute window (compare snapshot vs snapshot, not hourly aggregates).
  const { count: priorActiveSessionsCount } = await supabase
    .from('UserSession')
    .select('*', { count: 'exact', head: true })
    .is('endTime', null)
    .gt('lastPing', thirtyMinsAgo)
    .lte('lastPing', fifteenMinsAgo);

  const sessionsComparison = percentChange(
    activeSessionsCount || 0,
    priorActiveSessionsCount || 0
  );

  const { data: hourlyStatsData } = await supabase.from('real_time_hourly_stats').select('*');
  const sortedHourly = [...(hourlyStatsData || [])].sort(
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
  const recentLatency = avgOf(recentHours, 'avg_latency');
  const priorLatency = avgOf(priorHours, 'avg_latency');
  const latencyComparison = percentChange(recentLatency, priorLatency);

  const avgLatency =
    realTimeTrends.length > 0
      ? Math.round(realTimeTrends.reduce((acc, curr) => acc + curr.latency, 0) / realTimeTrends.length)
      : 0;

  const { data: pageVisitData } = await supabase.from('page_visit_summary').select('*');
  const totalPageVisits = (pageVisitData || []).reduce((acc, curr) => acc + (curr.visit_count || 0), 0) || 1;

  const pageVisitUsage = (pageVisitData || [])
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
    activeSessionsCount: activeSessionsCount || 0,
    avgSessionLength: sessionDaily.length > 0 ? Math.round(sessionDaily[sessionDaily.length - 1].avgDurationMin) : 0,
    sessionTrends: sessionDaily,
    featureUsage: { usage: featureUsage, chatOnlyUsers },
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
