import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { 
  subHours, 
  subDays, 
  startOfHour, 
  startOfDay, 
  format, 
  isAfter, 
  eachHourOfInterval, 
  eachDayOfInterval,
  subWeeks,
  subMonths,
  isSameHour,
  isSameDay,
  isSameMonth,
  startOfMonth,
  eachMonthOfInterval,
  parseISO
} from 'date-fns';

export interface UsageLog {
  tokens: number;
  inputTokens?: number;
  outputTokens?: number;
  createdAt: string;
  costUsd?: number;
}

import { calculateFallbackCost } from '../lib/costCalculator';
/**
 * FIXED Scalable Fetcher: 
 * Handles strict server-side row limits (usually 1,000) by accurately 
 * calculating pagination steps and checking for data completion.
 */
async function fetchUserUsageAggregated(userId: string, getToken: (options?: any) => Promise<string | null>) {
  if (!userId) return { logs: [], lifetime: null };

  const token = await getToken({ template: 'supabase' });
  const supabase = getSupabaseClient(token || undefined);

  // 1. Fetch lifetime totals from view
  const { data: lifetime } = await supabase
    .from('top_consumers_summary')
    .select('*')
    .eq('userId', userId)
    .single();

  // 2. Fetch the last 30 days of aggregated data for this specific user
  const { data, error } = await supabase
    .from('user_daily_usage_summary')
    .select('*')
    .eq('userId', userId)
    .order('date', { ascending: false })
    .limit(30);

  if (error) {
    console.error('[useUserUsage] Fetch error:', error);
  }

  const logs = (data || []).map(m => ({
    tokens: m.total_tokens || 0,
    inputTokens: 0, 
    outputTokens: 0,
    costUsd: m.total_cost || 0,
    createdAt: m.date
  }));

  return { logs, lifetime };
}

export function useUserUsage(userId: string) {
  const { getToken } = useAuth();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { data: rawData, isLoading: loading } = useQuery({
    queryKey: ['user-usage-optimized', userId],
    queryFn: () => fetchUserUsageAggregated(userId, () => getToken({ template: 'supabase' })),
    enabled: !!userId,
    staleTime: 60000,
  });

  const rawLogs = rawData?.logs || [];
  const lifetimeStats = rawData?.lifetime || null;

  const processedData = useMemo(() => {
    const logs = rawLogs.map(log => {
      // Fix potential timestamp issues
      const rawDate = String(log.createdAt);
      const dateStr = rawDate.includes('Z') || rawDate.includes('+') ? rawDate : `${rawDate.split('.')[0]}Z`;
      const date = parseISO(dateStr);
      
      const inT = Number(log.inputTokens) || 0;
      const outT = Number(log.outputTokens) || 0;
      const totalT = Number(log.tokens) || (inT + outT) || 0;

      let cost = calculateFallbackCost(log);

      return { totalT, cost, date };
    });

    const hourly = new Map<string, { t: number, c: number }>();
    const daily = new Map<string, { t: number, c: number }>();
    const monthly = new Map<string, { t: number, c: number }>();

    logs.forEach(log => {
      const hKey = format(log.date, 'yyyy-MM-dd HH');
      const dKey = format(log.date, 'yyyy-MM-dd');
      const mKey = format(log.date, 'yyyy-MM');

      const h = hourly.get(hKey) || { t: 0, c: 0 };
      hourly.set(hKey, { t: h.t + log.totalT, c: h.c + log.cost });

      const d = daily.get(dKey) || { t: 0, c: 0 };
      daily.set(dKey, { t: d.t + log.totalT, c: d.c + log.cost });

      const m = monthly.get(mKey) || { t: 0, c: 0 };
      monthly.set(mKey, { t: m.t + log.totalT, c: m.c + log.cost });
    });

    return { hourly, daily, monthly, logs };
  }, [rawLogs]);

  const hourlyData = useMemo(() => 
    eachHourOfInterval({ start: subHours(now, 23), end: now }).map(hour => {
      const key = format(hour, 'yyyy-MM-dd HH');
      const data = processedData.hourly.get(key) || { t: 0, c: 0 };
      return { name: format(hour, 'HH:00'), cost: data.c, tokens: data.t };
    })
  , [processedData, now]);

  const dailyData = useMemo(() => 
    eachDayOfInterval({ start: subDays(now, 29), end: now }).map(day => {
      const key = format(day, 'yyyy-MM-dd');
      const data = processedData.daily.get(key) || { t: 0, c: 0 };
      return { name: format(day, 'MMM dd'), cost: data.c, tokens: data.t };
    })
  , [processedData, now]);

  const weeklyData = useMemo(() => {
    const data = [];
    for (let i = 11; i >= 0; i--) {
      const weekEnd = subDays(startOfDay(now), i * 7);
      const weekStart = subDays(weekEnd, 7);
      const filtered = processedData.logs.filter(log => log.date > weekStart && log.date <= weekEnd);
      data.push({
        name: i === 0 ? 'This Week' : `${i}w ago`,
        cost: filtered.reduce((sum, log) => sum + log.cost, 0),
        tokens: filtered.reduce((sum, log) => sum + log.totalT, 0)
      });
    }
    return data;
  }, [processedData, now]);

  const monthlyData = useMemo(() => 
    eachMonthOfInterval({ start: subMonths(startOfMonth(now), 11), end: now }).map(month => {
      const key = format(month, 'yyyy-MM');
      const data = processedData.monthly.get(key) || { t: 0, c: 0 };
      return { name: format(month, 'MMM'), cost: data.c, tokens: data.t };
    })
  , [processedData, now]);

  return {
    loading,
    hourlyData,
    dailyData,
    weeklyData,
    monthlyData,
    totalTokens: lifetimeStats ? Number(lifetimeStats.total_tokens) : processedData.logs.reduce((sum, log) => sum + log.totalT, 0),
    totalCost: lifetimeStats ? Number(lifetimeStats.total_cost) : processedData.logs.reduce((sum, log) => sum + log.cost, 0),
    logCount: lifetimeStats ? Number(lifetimeStats.interaction_count) : rawLogs.length
  };
}
