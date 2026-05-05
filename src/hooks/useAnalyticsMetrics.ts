import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

async function fetchAnalyticsMetrics() {
  const { data: logs, error } = await supabase
    .from('UsageLog')
    .select(`
      *,
      User ( email )
    `)
    .order('createdAt', { ascending: true });

  if (error || !logs) throw error || new Error('No logs found');

  // Process Trends (Group by Date)
  const trendsMap: Record<string, any> = {};
  logs.forEach(log => {
    const date = new Date(log.createdAt).toISOString().split('T')[0];
    if (!trendsMap[date]) {
      trendsMap[date] = { date, tokens: 0, users: new Set() };
    }
    trendsMap[date].tokens += log.tokens;
    trendsMap[date].users.add(log.userId);
  });
  
  const trends = Object.values(trendsMap).map(t => ({
    ...t,
    users: t.users.size
  }));
  const usageTrends = trends.slice(-7);

  // Process Model Distribution
  const modelMap: Record<string, number> = {};
  logs.forEach(log => {
    const name = log.model || 'Unknown';
    modelMap[name] = (modelMap[name] || 0) + 1;
  });
  
  const colors = ['#3ecf8e', '#a855f7', '#38bdf8', '#fbbf24', '#f87171'];
  const distribution = Object.entries(modelMap).map(([name, count], idx) => ({
    name,
    value: Math.round((count / logs.length) * 100),
    color: colors[idx % colors.length]
  }));

  // Process Leaderboard (Top Users by Token)
  const userMap: Record<string, any> = {};
  logs.forEach(log => {
    const email = log.User?.email || 'Unknown';
    if (!userMap[email]) {
      userMap[email] = { email, usages: 0, tokens: 0 };
    }
    userMap[email].usages += 1;
    userMap[email].tokens += log.tokens;
  });

  const leaders = Object.values(userMap)
    .sort((a: any, b: any) => b.tokens - a.tokens)
    .slice(0, 5)
    .map((u: any) => ({
      ...u,
      tokens: u.tokens > 1000000 ? `${(u.tokens / 1000000).toFixed(1)}M` : `${Math.round(u.tokens / 1000)}k`
    }));

  // Fetch Sessions
  const { data: sessions, error: sessionError } = await supabase
    .from('UserSession')
    .select('*')
    .order('startTime', { ascending: true });

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
  }));

  return {
    usageTrends,
    modelDistribution: distribution,
    topUsers: leaders,
    activeSessionsCount,
    avgSessionLength: Math.round(avgSessionLength / 60), // in minutes
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
    sessionTrends: data?.sessionTrends || []
  };
}

