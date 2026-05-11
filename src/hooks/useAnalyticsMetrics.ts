import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

async function fetchAnalyticsMetrics(getToken: () => Promise<string | null>) {
  let allLogs: any[] = [];
  let from = 0;
  const PAGE_SIZE = 1000;
  
  let token: string | null = null;
  try {
    token = await getToken({ template: 'supabase' });
  } catch (e) {
    console.warn('[AnalyticsAudit] Failed to get specialized token:', e);
  }
  
  const supabase = getSupabaseClient(token || undefined);

  // 1. Scalable Fetching of Usage Logs
  try {
    while (true) {
      const { data, error, count } = await supabase
        .from('UsageLog')
        .select(`
          *,
          User ( email )
        `, { count: 'exact' })
        .order('createdAt', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;
      allLogs = [...allLogs, ...data];
      if (data.length < PAGE_SIZE || (count !== null && allLogs.length >= count)) break;
      from += PAGE_SIZE;
      if (from >= 100000) break; // Safety cap
    }
  } catch (err) {
    console.error('Error fetching logs:', err);
  }

  // Process Trends (Group by Date)
  const trendsMap: Record<string, any> = {};
  let totalCost = 0;
  
  // Consistency Constants (matching useUserUsage.ts)
  const { calculateFallbackCost } = await import('../lib/costCalculator');

  allLogs.forEach(log => {
    const date = new Date(log.createdAt).toISOString().split('T')[0];
    if (!trendsMap[date]) {
      trendsMap[date] = { date, tokens: 0, cost: 0, users: new Set() };
    }
    
    let cost = calculateFallbackCost(log);

    trendsMap[date].tokens += log.tokens;
    trendsMap[date].cost += cost;
    trendsMap[date].users.add(log.userId);
    totalCost += cost;
  });
  
  const usageTrends = Object.values(trendsMap).map(t => ({
    ...t,
    users: t.users.size
  })).sort((a: any, b: any) => a.date.localeCompare(b.date));

  // Process Model Distribution
  const modelMap: Record<string, number> = {};
  allLogs.forEach(log => {
    const name = log.model || 'Unknown';
    modelMap[name] = (modelMap[name] || 0) + 1;
  });
  
  const colors = ['#3ecf8e', '#a855f7', '#38bdf8', '#fbbf24', '#f87171'];
  const distribution = Object.entries(modelMap).map(([name, count], idx) => ({
    name,
    value: Math.round((count / allLogs.length) * 100),
    color: colors[idx % colors.length]
  }));

  // Process Leaderboard
  const userMap: Record<string, any> = {};
  allLogs.forEach(log => {
    const email = log.User?.email || 'Unknown';
    if (!userMap[email]) {
      userMap[email] = { email, usages: 0, tokens: 0, cost: 0 };
    }

    let cost = calculateFallbackCost(log);

    userMap[email].usages += 1;
    userMap[email].tokens += log.tokens;
    userMap[email].cost += cost;
  });

  const leaders = Object.values(userMap)
    .sort((a: any, b: any) => b.tokens - a.tokens)
    .slice(0, 5)
    .map((u: any) => ({
      ...u,
      tokens: u.tokens > 1000000 ? `${(u.tokens / 1000000).toFixed(1)}M` : `${Math.round(u.tokens / 1000)}k`
    }));

  // 2. Fetch Sessions
  const { data: sessions, error: sessionError } = await supabase
    .from('UserSession')
    .select('*')
    .order('startTime', { ascending: false })
    .limit(5000); // Session history limit

  if (sessionError) console.error('Error fetching sessions:', sessionError);

  // Process Session Data
  const now = new Date().getTime();
  const activeSessionsCount = sessions?.filter(s => !s.endTime && (now - new Date(s.lastPing).getTime()) < 300000).length || 0;
  
  const sessionsWithDuration = sessions?.filter(s => s.duration) || [];
  const avgSessionLength = sessionsWithDuration.reduce((acc, s) => acc + (s.duration || 0), 0) / (sessionsWithDuration.length || 1);

  const sessionDailyMap: Record<string, number[]> = {};
  sessions?.forEach(s => {
    if (!s.duration) return;
    const d = new Date(s.startTime).toISOString().split('T')[0];
    if (!sessionDailyMap[d]) sessionDailyMap[d] = [];
    sessionDailyMap[d].push(s.duration / 60); // Convert seconds to minutes
  });

  const sessionDaily = Object.entries(sessionDailyMap).map(([date, durations]) => {
    const sorted = [...durations].sort((a, b) => a - b);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    return {
      date,
      totalSessions: durations.length,
      avgDurationMin: parseFloat(avg.toFixed(1)),
      medianDurationMin: parseFloat(median.toFixed(1)),
      p95DurationMin: parseFloat(p95.toFixed(1))
    };
  }).sort((a, b) => a.date.localeCompare(b.date));

  // Session Distribution
  const ranges = [
    { label: '< 1m', min: 0, max: 1 },
    { label: '1-5m', min: 1, max: 5 },
    { label: '5-15m', min: 5, max: 15 },
    { label: '15-30m', min: 15, max: 30 },
    { label: '30-60m', min: 30, max: 60 },
    { label: '> 60m', min: 60, max: Infinity }
  ];

  const distributionMap: Record<string, number> = {};
  ranges.forEach(r => distributionMap[r.label] = 0);
  let totalWithDuration = 0;
  sessions?.forEach(s => {
    if (!s.duration) return;
    const mins = s.duration / 60;
    totalWithDuration++;
    const range = ranges.find(r => mins >= r.min && mins < r.max);
    if (range) distributionMap[range.label]++;
  });

  const sessionDistribution = ranges.map(r => ({
    range: r.label,
    count: distributionMap[r.label],
    percentage: parseFloat(((distributionMap[r.label] / (totalWithDuration || 1)) * 100).toFixed(1))
  }));

  // Process Feature Usage
  const featureMap: Record<string, any> = {};
  allLogs.forEach(log => {
    const f = log.type || 'unknown';
    if (!featureMap[f]) {
      featureMap[f] = { feature: f, totalUses: 0, uniqueUsers: new Set(), totalDuration: 0 };
    }
    featureMap[f].totalUses++;
    featureMap[f].uniqueUsers.add(log.userId);
    featureMap[f].totalDuration += (log.durationMs || 0);
  });

  const totalUsesAll = allLogs.length || 1;
  const featureUsage = Object.values(featureMap).map(f => ({
    feature: f.feature,
    totalUses: f.totalUses,
    percentage: parseFloat(((f.totalUses / totalUsesAll) * 100).toFixed(1)),
    uniqueUsers: f.uniqueUsers.size,
    avgDurationMs: Math.round(f.totalDuration / f.totalUses)
  })).sort((a, b) => b.totalUses - a.totalUses);

  // Chat only users
  const userFeatures: Record<string, Set<string>> = {};
  allLogs.forEach(log => {
    if (!userFeatures[log.userId]) userFeatures[log.userId] = new Set();
    userFeatures[log.userId].add(log.type);
  });
  const chatOnlyUsers = Object.values(userFeatures).filter(fs => 
    fs.size === 1 && (fs.has('response') || fs.has('Response') || fs.has('message'))
  ).length;

  // Process Messages Per User (7 Days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const msgLogs = allLogs.filter(l => {
    const logDate = new Date(l.createdAt);
    const type = (l.type || '').toLowerCase();
    return logDate >= sevenDaysAgo && (type === 'response' || type === 'message');
  });
  
  const msgTrendsMap: Record<string, any> = {};
  msgLogs.forEach(l => {
    const d = new Date(l.createdAt).toISOString().split('T')[0];
    if (!msgTrendsMap[d]) msgTrendsMap[d] = { date: d, totalMessages: 0, users: new Set() };
    msgTrendsMap[d].totalMessages++;
    msgTrendsMap[d].users.add(l.userId);
  });

  const messagesPerUser = Object.values(msgTrendsMap).map(t => ({
    date: t.date,
    activeUsers: t.users.size,
    totalMessages: t.totalMessages,
    msgsPerUser: parseFloat((t.totalMessages / (t.users.size || 1)).toFixed(1))
  })).sort((a: any, b: any) => a.date.localeCompare(b.date));

  return {
    usageTrends,
    totalCost,
    modelDistribution: distribution,
    topUsers: leaders,
    activeSessionsCount,
    avgSessionLength: Math.round(avgSessionLength / 60),
    sessionTrends: sessionDaily,
    featureUsage: { usage: featureUsage, chatOnlyUsers },
    messagesPerUser,
    sessionLengths: { daily: sessionDaily, distribution: sessionDistribution }
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
    sessionLengths: data?.sessionLengths || { daily: [], distribution: [] }
  };
}

