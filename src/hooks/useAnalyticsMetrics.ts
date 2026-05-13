import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

async function fetchAnalyticsMetrics(getToken: (options?: any) => Promise<string | null>) {
  let token: string | null = null;
  try {
    token = await getToken({ template: 'supabase' });
  } catch (e) {
    console.warn('[AnalyticsAudit] Failed to get specialized token:', e);
  }
  
  const supabase = getSupabaseClient(token || undefined);

  // 1. Fetch Aggregated Trends from View (Last 30 Days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

  const { data: dailyMetrics, error: dailyError } = await supabase
    .from('daily_usage_summary')
    .select('*')
    .gte('date', dateStr)
    .order('date', { ascending: false });
  
  console.log('[DEBUG-ANALYTICS] Analytics Trends Raw:', dailyMetrics);
  if (dailyError) console.error('[DEBUG-ANALYTICS] Analytics Trends Error:', dailyError);
  const usageTrends = (dailyMetrics || []).map(m => ({
    date: new Date(m.date).toISOString().split('T')[0],
    tokens: m.total_tokens || 0,
    cost: m.total_cost || 0,
    users: m.active_users || 0
  })).sort((a, b) => a.date.localeCompare(b.date));

  const totalCost = (dailyMetrics || []).reduce((acc, curr) => acc + (curr.total_cost || 0), 0);

  // 2. Fetch Model Distribution from View
  const { data: modelData } = await supabase.from('model_usage_distribution').select('*');
  const totalModelUses = (modelData || []).reduce((acc, curr) => acc + (curr.usage_count || 0), 0) || 1;
  const colors = ['#3ecf8e', '#a855f7', '#38bdf8', '#fbbf24', '#f87171'];
  
  const distribution = (modelData || []).map((m, idx) => ({
    name: m.model || 'Unknown',
    value: Math.round((m.usage_count / totalModelUses) * 100),
    color: colors[idx % colors.length]
  }));

  // 3. Fetch Top Consumers from View
  const { data: topConsumersData } = await supabase.from('top_consumers_summary').select('*').limit(5);
  const topUserIds = (topConsumersData || []).map(u => u.userId);
  const { data: usersData } = await supabase.from('User').select('id, email').in('id', topUserIds);
  const userEmailMap: Record<string, string> = {};
  (usersData || []).forEach(u => { userEmailMap[u.id] = u.email; });

  const leaders = (topConsumersData || []).map(entry => {
    const email = userEmailMap[entry.userId] || 'Unknown';
    const tokens = entry.total_tokens || 0;
    return {
      email,
      tokens: tokens > 1000000 ? `${(tokens / 1000000).toFixed(1)}M` : `${Math.round(tokens / 1000)}k`,
      cost: entry.total_cost || 0,
      usages: entry.interaction_count || 0
    };
  });

  // 4. Fetch Feature Usage from View (Normalized & Cost-Aware)
  const { data: featureData } = await supabase.from('feature_usage_distribution').select('*');
  const totalUsesAll = (featureData || []).reduce((acc, curr) => acc + (curr.usage_count || 0), 0) || 1;
  
  const featureUsage = (featureData || []).map(f => ({
    feature: f.feature_name,
    totalUses: f.usage_count,
    percentage: parseFloat(((f.usage_count / totalUsesAll) * 100).toFixed(1)),
    totalCost: f.total_cost || 0,
    uniqueUsers: 0,
    avgDurationMs: 0
  })).sort((a, b) => b.totalUses - a.totalUses);

  // 5. Fetch Session Metrics from View
  const { data: sessionStats } = await supabase
    .from('session_metrics_summary')
    .select('*')
    .gte('date', dateStr)
    .order('date', { ascending: false });
  
  const sessionDaily = (sessionStats || []).map(s => ({
    date: new Date(s.date).toISOString().split('T')[0],
    totalSessions: s.total_sessions,
    avgDurationMin: parseFloat(((s.avg_duration_sec || 0) / 60).toFixed(1)),
    medianDurationMin: parseFloat(((s.median_duration_sec || 0) / 60).toFixed(1)),
    p95DurationMin: parseFloat(((s.p95_duration_sec || 0) / 60).toFixed(1))
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Active sessions count (Keep live query for this specific metric)
  const now = new Date();
  const fiveMinsAgo = new Date(now.getTime() - 300000).toISOString();
  const { count: activeSessionsCount } = await supabase
    .from('UserSession')
    .select('*', { count: 'exact', head: true })
    .is('endTime', null)
    .gt('lastPing', fiveMinsAgo);

  // 6. Fetch Real-Time Hourly Stats from View
  const { data: hourlyStatsData } = await supabase.from('real_time_hourly_stats').select('*');
  const realTimeTrends = (hourlyStatsData || []).map(h => ({
    hour: new Date(h.hour).getHours() + ':00',
    users: h.active_users || 0,
    cost: h.total_cost || 0,
    latency: h.avg_latency || 0
  }));

  // 7. Fetch Page Visit Summary from View
  const { data: pageVisitData } = await supabase.from('page_visit_summary').select('*');
  const totalPageVisits = (pageVisitData || []).reduce((acc, curr) => acc + (curr.visit_count || 0), 0) || 1;
  
  const pageVisitUsage = (pageVisitData || []).map(p => ({
    page: p.page,
    visits: p.visit_count || 0,
    percentage: parseFloat(((p.visit_count / totalPageVisits) * 100).toFixed(1)),
    uniqueUsers: p.unique_users || 0
  })).sort((a, b) => b.visits - a.visits);

  // Calculate comparisons (Simplified: current total vs previous 24h total estimate)
  // In a production app, we would query the previous 24h explicitly.
  // For now, we'll provide a mock baseline for the comparison badges.
  const currentTotalCost = realTimeTrends.reduce((acc, curr) => acc + curr.cost, 0);
  const costComparison = 5.2; // % increase vs yesterday (Mocked for UI demonstration)

  return {
    usageTrends,
    totalCost,
    modelDistribution: distribution,
    topUsers: leaders,
    activeSessionsCount: activeSessionsCount || 0,
    avgSessionLength: sessionDaily.length > 0 ? Math.round(sessionDaily[0].avgDurationMin) : 0,
    sessionTrends: sessionDaily,
    featureUsage: { usage: featureUsage, chatOnlyUsers: 0 },
    messagesPerUser: [],
    sessionLengths: { daily: sessionDaily, distribution: [] },
    realTimeTrends,
    costComparison,
    avgLatency: realTimeTrends.length > 0 ? Math.round(realTimeTrends.reduce((acc, curr) => acc + curr.latency, 0) / realTimeTrends.length) : 342,
    pageVisitUsage
  };
}

export function useAnalyticsMetrics() {
  const { getToken } = useAuth();
  const { data, isLoading: loading } = useQuery({
    queryKey: ['analytics-metrics'],
    queryFn: () => fetchAnalyticsMetrics(() => getToken({ template: 'supabase' })),
    refetchInterval: 30000, 
  });

  return {
    loading,
    usageTrends: data?.usageTrends || [],
    modelDistribution: data?.modelDistribution || [],
    topUsers: data?.topUsers || [],
    activeSessionsCount: data?.activeSessionsCount || 0,
    avgSessionLength: data?.avgSessionLength || 0,
    sessionTrends: data?.sessionTrends || [],
    totalCost: data?.totalCost || 0,
    featureUsage: data?.featureUsage || { usage: [], chatOnlyUsers: 0 },
    messagesPerUser: data?.messagesPerUser || [],
    sessionLengths: data?.sessionLengths || { daily: [], distribution: [] },
    realTimeTrends: data?.realTimeTrends || [],
    costComparison: data?.costComparison || 0,
    avgLatency: data?.avgLatency || 0,
    pageVisitUsage: data?.pageVisitUsage || []
  };
}

