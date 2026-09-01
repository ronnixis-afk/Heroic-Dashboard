/**
 * Shared analytics aggregation used by AdminAnalytics and the MCP get_insights tool.
 * Callers supply a GET helper so Clerk tokens (browser) and ADMIN_API_KEY (server) both work.
 */
export type RpgGet = <T>(path: string) => Promise<T>;

type ViewDataResponse<T> = { resource: string; data: T };

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

interface AnalyticsOverviewResponse {
  dailyUsage: any[];
  modelUsage: any[];
  topConsumers: any[];
  featureCostUsage: any[];
  sessionMetrics: any[];
  activeSessions: { current: number; prior: number };
  hourlyStats: any[];
  pageVisits: any[];
  costAnalytics: {
    daily: any[];
    byModel: any[];
    byRole: any[];
    failoverRate: number;
    failoverCalls: number;
    totalCalls: number;
  };
  featureUsage: {
    usage: {
      feature: string;
      totalUses: number;
      percentage: number;
      uniqueUsers: number;
      avgDurationMs: number;
    }[];
    chatOnlyUsers: number;
  };
  sessionLengths: {
    daily: any[];
    distribution: any[];
  };
  messagesPerUser: MessagesPerUserRow[];
}

export interface AnalyticsInsightsSnapshot {
  generatedAt: string;
  usageTrends: {
    date: string;
    tokens: number;
    cost: number;
    users: number;
  }[];
  totalCost: number;
  modelDistribution: { name: string; value: number; color: string }[];
  topUsers: { email: string; tokens: string; cost: number; usages: number }[];
  activeSessionsCount: number;
  avgSessionLength: number;
  sessionTrends: {
    date: string;
    totalSessions: number;
    avgDurationMin: number;
    medianDurationMin: number;
    p95DurationMin: number;
  }[];
  featureUsage: {
    usage: {
      feature: string;
      totalUses: number;
      percentage: number;
      totalCost: number;
      uniqueUsers: number;
      avgDurationMs: number;
    }[];
    chatOnlyUsers: number;
  };
  messagesPerUser: MessagesPerUserRow[];
  sessionLengths: {
    daily: {
      date: string;
      totalSessions: number;
      avgDurationMin: number;
      medianDurationMin: number;
      p95DurationMin: number;
    }[];
    distribution: { range: string; count: number; percentage: number }[];
  };
  realTimeTrends: { hour: string; users: number; cost: number; latency: number }[];
  costComparison: number | null;
  sessionsComparison: number | null;
  latencyComparison: number | null;
  avgLatency: number;
  pageVisitUsage: { page: string; visits: number; percentage: number; uniqueUsers: number }[];
  modelCostData: {
    model: string;
    calls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
    avgLatencyMs: number;
  }[];
  dailyCostData: {
    date: string;
    activeUsers: number;
    totalCost: number;
    costPerUser: number;
  }[];
  degradedMessage: string | null;
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
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

function withGeneratedAt(
  snapshot: Omit<AnalyticsInsightsSnapshot, 'generatedAt'>
): AnalyticsInsightsSnapshot {
  return { generatedAt: new Date().toISOString(), ...snapshot };
}

export function formatAnalyticsOverview(
  overview: AnalyticsOverviewResponse
): AnalyticsInsightsSnapshot {
  const dailyMetrics = overview.dailyUsage || [];
  const modelData = overview.modelUsage || [];
  const costAnalytics = overview.costAnalytics;

  let modelCostData = modelData.map((m) => ({
    model: m.model || 'Unknown',
    calls: Number(m.usage_count) || 0,
    totalInputTokens: Number(m.total_input_tokens) || 0,
    totalOutputTokens: Number(m.total_output_tokens) || 0,
    totalCost: Number(m.total_cost) || 0,
    avgLatencyMs: Number(m.avg_latency) || 0,
  }));

  let dailyCostData = dailyMetrics.map((m) => ({
    date: m.date,
    activeUsers: m.active_users || 0,
    totalCost: Number(m.total_cost) || 0,
    costPerUser: m.active_users > 0 ? m.total_cost / m.active_users : 0,
  }));

  if (costAnalytics?.byModel?.length) {
    modelCostData = costAnalytics.byModel.map((m) => ({
      model: m.model || 'Unknown',
      calls: Number(m.calls) || 0,
      totalInputTokens: Number(m.totalInputTokens) || 0,
      totalOutputTokens: Number(m.totalOutputTokens) || 0,
      totalCost: Number(m.totalCost) || 0,
      avgLatencyMs: Number(m.avgLatencyMs) || 0,
    }));
  }

  if (costAnalytics?.daily?.length) {
    dailyCostData = costAnalytics.daily.map((d) => ({
      date: typeof d.date === 'string' ? d.date : String(d.date),
      activeUsers: Number(d.activeUsers) || 0,
      totalCost: Number(d.totalCost) || 0,
      costPerUser: Number(d.costPerUser) || 0,
    }));
  }

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

  const topConsumersData = overview.topConsumers || [];
  const leaders = topConsumersData.map((entry) => {
    const email = entry.email || `User ${String(entry.userId).slice(0, 5)}`;
    const tokens = entry.total_tokens || 0;
    return {
      email,
      tokens: tokens > 1000000 ? `${(tokens / 1000000).toFixed(1)}M` : `${Math.round(tokens / 1000)}k`,
      cost: entry.total_cost || 0,
      usages: entry.interaction_count || 0,
    };
  });

  const featureData = overview.featureCostUsage || [];
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
  if (overview.featureUsage?.usage?.length) {
    featureUsageRows = overview.featureUsage.usage
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
    chatOnlyUsers = Number(overview.featureUsage.chatOnlyUsers) || 0;
  }

  let sessionDaily = (overview.sessionMetrics || [])
    .map((s) => ({
      date: new Date(s.date).toISOString().split('T')[0],
      totalSessions: s.total_sessions,
      avgDurationMin: parseFloat(((s.avg_duration_sec || 0) / 60).toFixed(1)),
      medianDurationMin: parseFloat(((s.median_duration_sec || 0) / 60).toFixed(1)),
      p95DurationMin: parseFloat(((s.p95_duration_sec || 0) / 60).toFixed(1)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  let sessionDistribution: { range: string; count: number; percentage: number }[] = [];
  if (overview.sessionLengths?.daily?.length) {
    sessionDaily = overview.sessionLengths.daily
      .map((d: any) => ({
        date: d.date,
        totalSessions: d.totalSessions,
        avgDurationMin: d.avgDurationMin,
        medianDurationMin: d.medianDurationMin,
        p95DurationMin: d.p95DurationMin,
      }))
      .sort((a: any, b: any) => a.date.localeCompare(b.date));
  }
  sessionDistribution = overview.sessionLengths?.distribution || [];

  const messagesPerUser = (overview.messagesPerUser || [])
    .map((row) => ({
      date: row.date,
      activeUsers: Number(row.activeUsers) || 0,
      totalMessages: Number(row.totalMessages) || 0,
      msgsPerUser: Number(row.msgsPerUser) || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const activeSessionsCount = overview.activeSessions?.current || 0;
  const priorActiveSessionsCount = overview.activeSessions?.prior || 0;
  const sessionsComparison = percentChange(activeSessionsCount, priorActiveSessionsCount);

  const sortedHourly = [...(overview.hourlyStats || [])].sort(
    (a, b) => new Date(a.hour).getTime() - new Date(b.hour).getTime()
  );
  const recentHours = sortedHourly.slice(-12);
  const priorHours = sortedHourly.slice(-24, -12);

  const realTimeTrends = sortedHourly.map((h) => {
    const date = new Date(h.hour);
    return {
      hour: Number.isNaN(date.getTime())
        ? String(h.hour)
        : date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
          }),
      users: h.active_users || 0,
      cost: h.total_cost || 0,
      latency: h.avg_latency || 0,
    };
  });

  const avgOf = (rows: typeof sortedHourly, key: 'avg_latency') => {
    if (rows.length === 0) return 0;
    return rows.reduce((acc, h) => acc + (Number(h[key]) || 0), 0) / rows.length;
  };
  const latencyComparison = percentChange(avgOf(recentHours, 'avg_latency'), avgOf(priorHours, 'avg_latency'));

  const avgLatency =
    realTimeTrends.length > 0
      ? Math.round(realTimeTrends.reduce((acc, curr) => acc + curr.latency, 0) / realTimeTrends.length)
      : 0;

  const pageVisitData = overview.pageVisits || [];
  const totalPageVisits = pageVisitData.reduce((acc, curr) => acc + (curr.visit_count || 0), 0) || 1;
  const pageVisitUsage = pageVisitData
    .map((p) => ({
      page: p.page,
      visits: p.visit_count || 0,
      percentage: parseFloat(((p.visit_count / totalPageVisits) * 100).toFixed(1)),
      uniqueUsers: p.unique_users || 0,
    }))
    .sort((a, b) => b.visits - a.visits);

  return withGeneratedAt({
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
    degradedMessage: null,
  });
}

async function fetchCostAnalyticsBundle(rpgGet: RpgGet, days = 30) {
  const failures: string[] = [];
  const recover = <T,>(label: string, request: Promise<T>, fallback: T): Promise<T> =>
    request.catch((error) => {
      const detail = error instanceof Error ? error.message : String(error);
      console.warn(`[AnalyticsInsights] ${label} failed:`, error);
      failures.push(`${label}: ${detail}`);
      return fallback;
    });

  const [dailyMetrics, modelRes, costAnalytics] = await Promise.all([
    recover(
      'Daily Usage',
      rpgGet<ViewDataResponse<any[]>>(`/api/admin/analytics/view-data?resource=daily-usage&days=${days}`).then(
        (result) => result.data || []
      ),
      []
    ),
    recover(
      'Model Usage',
      rpgGet<ViewDataResponse<any[]>>('/api/admin/analytics/view-data?resource=model-usage'),
      { resource: 'model-usage', data: [] }
    ),
    recover(
      'Cost Analytics',
      rpgGet<{
        daily?: AnalyticsOverviewResponse['costAnalytics']['daily'];
        byModel?: AnalyticsOverviewResponse['costAnalytics']['byModel'];
        byRole?: AnalyticsOverviewResponse['costAnalytics']['byRole'];
        failoverRate?: number;
      }>(`/api/admin/analytics/cost-analytics?days=${days}`),
      null
    ),
  ]);

  const modelData = modelRes.data || [];

  let modelCostData = modelData.map((m) => ({
    model: m.model || 'Unknown',
    calls: Number(m.usage_count) || 0,
    totalInputTokens: Number(m.total_input_tokens) || 0,
    totalOutputTokens: Number(m.total_output_tokens) || 0,
    totalCost: Number(m.total_cost) || 0,
    avgLatencyMs: Number(m.avg_latency) || 0,
  }));

  let dailyCostData = dailyMetrics.map((m) => ({
    date: m.date,
    activeUsers: m.active_users || 0,
    totalCost: Number(m.total_cost) || 0,
    costPerUser: m.active_users > 0 ? m.total_cost / m.active_users : 0,
  }));

  if (costAnalytics?.byModel?.length) {
    modelCostData = costAnalytics.byModel.map((m) => ({
      model: m.model || 'Unknown',
      calls: Number(m.calls) || 0,
      totalInputTokens: Number(m.totalInputTokens) || 0,
      totalOutputTokens: Number(m.totalOutputTokens) || 0,
      totalCost: Number(m.totalCost) || 0,
      avgLatencyMs: Number(m.avgLatencyMs) || 0,
    }));
  }
  if (costAnalytics?.daily?.length) {
    dailyCostData = costAnalytics.daily.map((d) => ({
      date: typeof d.date === 'string' ? d.date : String(d.date),
      activeUsers: Number(d.activeUsers) || 0,
      totalCost: Number(d.totalCost) || 0,
      costPerUser: Number(d.costPerUser) || 0,
    }));
  }

  return {
    modelCostData,
    dailyCostData,
    dailyMetrics,
    modelData,
    degradedMessage:
      failures.length > 0
        ? `Some Cost Analytics Could Not Be Loaded. ${failures.join(' | ')}`
        : null,
  };
}

async function fetchAnalyticsInsightsFallback(rpgGet: RpgGet): Promise<AnalyticsInsightsSnapshot> {
  const degradedSources: string[] = [];
  const optional = <T,>(label: string, request: Promise<T>, fallback: T): Promise<T> =>
    request.catch((error) => {
      const detail = error instanceof Error ? error.message : String(error);
      console.warn(`[AnalyticsInsights] ${label} failed:`, error);
      degradedSources.push(`${label}: ${detail}`);
      return fallback;
    });

  const [
    costBundle,
    topConsumersRes,
    featureRes,
    sessionStatsRes,
    activeSessionsRes,
    hourlyStatsRes,
    pageVisitRes,
    featureApi,
    sessionLengthData,
    messagesData,
  ] = await Promise.all([
    optional('Cost Analytics', fetchCostAnalyticsBundle(rpgGet, 30), {
      dailyMetrics: [],
      modelData: [],
      modelCostData: [],
      dailyCostData: [],
      degradedMessage: null,
    }),
    optional(
      'Top Consumers',
      rpgGet<ViewDataResponse<any[]>>('/api/admin/analytics/view-data?resource=top-consumers&limit=5'),
      { resource: 'top-consumers', data: [] }
    ),
    optional(
      'Feature Cost Data',
      rpgGet<ViewDataResponse<any[]>>('/api/admin/analytics/view-data?resource=feature-usage'),
      { resource: 'feature-usage', data: [] }
    ),
    optional(
      'Session Metrics',
      rpgGet<ViewDataResponse<any[]>>('/api/admin/analytics/view-data?resource=session-metrics&days=30'),
      { resource: 'session-metrics', data: [] }
    ),
    optional(
      'Active Sessions',
      rpgGet<ViewDataResponse<{ current: number; prior: number }>>(
        '/api/admin/analytics/view-data?resource=active-sessions'
      ),
      { resource: 'active-sessions', data: { current: 0, prior: 0 } }
    ),
    optional(
      'Hourly Statistics',
      rpgGet<ViewDataResponse<any[]>>('/api/admin/analytics/view-data?resource=hourly-stats'),
      { resource: 'hourly-stats', data: [] }
    ),
    optional(
      'Page Visits',
      rpgGet<ViewDataResponse<any[]>>('/api/admin/analytics/view-data?resource=page-visits'),
      { resource: 'page-visits', data: [] }
    ),
    optional(
      'Feature Usage',
      rpgGet<FeatureUsageApiResponse>('/api/admin/analytics/feature-usage'),
      null
    ),
    optional(
      'Session Lengths',
      rpgGet<SessionLengthApiResponse>('/api/admin/analytics/session-length?days=30'),
      null
    ),
    optional(
      'Messages Per User',
      rpgGet<MessagesPerUserRow[]>('/api/admin/analytics/messages-per-user?days=7'),
      null
    ),
  ]);

  const { dailyMetrics, modelData, modelCostData, dailyCostData } = costBundle;
  if (costBundle.degradedMessage) {
    degradedSources.push(costBundle.degradedMessage);
  }

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

  const topConsumersData = topConsumersRes.data || [];
  const leaders = topConsumersData.map((entry) => {
    const email = entry.email || `User ${String(entry.userId).slice(0, 5)}`;
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

  const realTimeTrends = sortedHourly.map((h) => {
    const date = new Date(h.hour);
    return {
      hour: Number.isNaN(date.getTime())
        ? String(h.hour)
        : date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
          }),
      users: h.active_users || 0,
      cost: h.total_cost || 0,
      latency: h.avg_latency || 0,
    };
  });

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

  return withGeneratedAt({
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
    degradedMessage:
      degradedSources.length > 0
        ? `Some Analytics Could Not Be Loaded. ${degradedSources.join(' | ')}`
        : null,
  });
}

export async function fetchAnalyticsInsights(rpgGet: RpgGet): Promise<AnalyticsInsightsSnapshot> {
  try {
    const overview = await rpgGet<AnalyticsOverviewResponse>('/api/admin/analytics/overview');
    if (overview && overview.dailyUsage && overview.costAnalytics) {
      return formatAnalyticsOverview(overview);
    }
  } catch (error) {
    console.warn(
      '[AnalyticsInsights] Consolidated overview fetch failed, falling back to parallel fetches:',
      error
    );
  }

  return fetchAnalyticsInsightsFallback(rpgGet);
}
