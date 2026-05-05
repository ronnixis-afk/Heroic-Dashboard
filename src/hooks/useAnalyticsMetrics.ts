import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAnalyticsMetrics() {
  const [usageTrends, setUsageTrends] = useState<any[]>([]);
  const [modelDistribution, setModelDistribution] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Fetch all usage logs (limit to last 30 days for performance)
      const { data: logs, error } = await supabase
        .from('UsageLog')
        .select(`
          *,
          User ( email )
        `)
        .order('createdAt', { ascending: true });

      if (error || !logs) {
        console.error('Error fetching logs:', error);
        setLoading(false);
        return;
      }

      // 2. Process Trends (Group by Date)
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
      setUsageTrends(trends.slice(-7)); // Last 7 days for trend line

      // 3. Process Model Distribution
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
      setModelDistribution(distribution);

      // 4. Process Leaderboard (Top Users by Token)
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
        .sort((a, b) => b.tokens - a.tokens)
        .slice(0, 5)
        .map(u => ({
          ...u,
          tokens: u.tokens > 1000000 ? `${(u.tokens / 1000000).toFixed(1)}M` : `${Math.round(u.tokens / 1000)}k`
        }));
      setTopUsers(leaders);

      setLoading(false);
    };

    fetchData();
  }, []);

  return {
    loading,
    usageTrends,
    modelDistribution,
    topUsers
  };
}
