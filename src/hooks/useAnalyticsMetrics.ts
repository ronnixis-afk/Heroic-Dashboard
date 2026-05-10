import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

async function fetchAnalyticsMetrics() {
  let allLogs: any[] = [];
  let from = 0;
  const PAGE_SIZE = 1000;

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
  allLogs.forEach(log => {
    const date = new Date(log.createdAt).toISOString().split('T')[0];
    if (!trendsMap[date]) {
      trendsMap[date] = { date, tokens: 0, cost: 0, users: new Set() };
    }
    trendsMap[date].tokens += log.tokens;
    trendsMap[date].cost += Number(log.costUsd) || 0;
    trendsMap[date].users.add(log.userId);
    totalCost += Number(log.costUsd) || 0;
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
    userMap[email].usages += 1;
    userMap[email].tokens += log.tokens;
    userMap[email].cost += Number(log.costUsd) || 0;
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

  const sessionTrendsMap: Record<string, any> = {};
  sessions?.forEach(s => {
    const date = new Date(s.startTime).toISOString().split('T')[0];
    if (!sessionTrendsMap[date]) {
      sessionTrendsMap[date] = { date, count: 0, totalDuration: 0 };
    }
    sessionTrendsMap[date].count++;
    if (s.duration) sessionTrendsMap[date].totalDuration += s.duration;
  });

  const sessionTrends = Object.values(sessionTrendsMap).map(t => ({
    date: t.date,
    avgDuration: Math.round((t.totalDuration / (t.count || 1)) / 60) // in minutes
  })).sort((a: any, b: any) => a.date.localeCompare(b.date));

  return {
    usageTrends,
    totalCost,
    modelDistribution: distribution,
    topUsers: leaders,
    activeSessionsCount,
    avgSessionLength: Math.round(avgSessionLength / 60),
    sessionTrends
  };
}

export function useAnalyticsMetrics() {
  const { data, isLoading: loading } = useQuery({
    queryKey: ['analytics-metrics'],
    queryFn: fetchAnalyticsMetrics,
    refetchInterval: 30000, // Refresh every 30s for active sessions
  });

  return {
    loading,
    usageTrends: data?.usageTrends || [],
    modelDistribution: data?.modelDistribution || [],
    topUsers: data?.topUsers || [],
    activeSessionsCount: data?.activeSessionsCount || 0,
    avgSessionLength: data?.avgSessionLength || 0,
    sessionTrends: data?.sessionTrends || [],
    totalCost: data?.totalCost || 0
  };
}

