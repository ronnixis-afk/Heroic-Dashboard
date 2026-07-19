import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/AuthContext';
import { fetchRpgAdmin } from '../lib/rpgAdminApi';
import {
  subHours,
  subDays,
  startOfDay,
  format,
  eachHourOfInterval,
  eachDayOfInterval,
  subMonths,
  startOfMonth,
  eachMonthOfInterval,
  parseISO,
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
 * Fetches lifetime + last-30-day aggregated usage via Clerk-gated RPG admin APIs.
 */
async function fetchUserUsageAggregated(
  userId: string,
  getToken: (options?: any) => Promise<string | null>
) {
  if (!userId) return { logs: [], lifetime: null };

  const [lifetimeRes, dailyRes] = await Promise.all([
    fetchRpgAdmin<{ data: any }>(
      `/api/admin/analytics/view-data?resource=top-consumer&userId=${encodeURIComponent(userId)}`,
      getToken
    ).catch((e) => {
      console.warn('[useUserUsage] top-consumer fetch failed:', e);
      return { data: null };
    }),
    fetchRpgAdmin<{ data: any[] }>(
      `/api/admin/analytics/view-data?resource=user-daily-usage&userId=${encodeURIComponent(userId)}&days=30`,
      getToken
    ).catch((e) => {
      console.error('[useUserUsage] Fetch error:', e);
      return { data: [] as any[] };
    }),
  ]);

  const logs = (dailyRes.data || []).map((m) => ({
    tokens: m.total_tokens || 0,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: m.total_cost || 0,
    createdAt: m.date,
  }));

  return { logs, lifetime: lifetimeRes.data };
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
    queryFn: () => fetchUserUsageAggregated(userId, getToken),
    enabled: !!userId,
    staleTime: 60000,
  });

  const rawLogs = rawData?.logs || [];
  const lifetimeStats = rawData?.lifetime || null;

  const processedData = useMemo(() => {
    const logs = rawLogs.map((log) => {
      const rawDate = String(log.createdAt);
      const dateStr =
        rawDate.includes('Z') || rawDate.includes('+')
          ? rawDate
          : `${rawDate.split('.')[0]}Z`;
      const date = parseISO(dateStr);

      const inT = Number(log.inputTokens) || 0;
      const outT = Number(log.outputTokens) || 0;
      const totalT = Number(log.tokens) || inT + outT || 0;

      const cost = calculateFallbackCost(log);

      return { totalT, cost, date };
    });

    const hourly = new Map<string, { t: number; c: number }>();
    const daily = new Map<string, { t: number; c: number }>();
    const monthly = new Map<string, { t: number; c: number }>();

    logs.forEach((log) => {
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

  const hourlyData = useMemo(
    () =>
      eachHourOfInterval({ start: subHours(now, 23), end: now }).map((hour) => {
        const key = format(hour, 'yyyy-MM-dd HH');
        const data = processedData.hourly.get(key) || { t: 0, c: 0 };
        return { name: format(hour, 'HH:00'), cost: data.c, tokens: data.t };
      }),
    [processedData, now]
  );

  const dailyData = useMemo(
    () =>
      eachDayOfInterval({ start: subDays(now, 29), end: now }).map((day) => {
        const key = format(day, 'yyyy-MM-dd');
        const data = processedData.daily.get(key) || { t: 0, c: 0 };
        return { name: format(day, 'MMM dd'), cost: data.c, tokens: data.t };
      }),
    [processedData, now]
  );

  const weeklyData = useMemo(() => {
    const data = [];
    for (let i = 11; i >= 0; i--) {
      const weekEnd = subDays(startOfDay(now), i * 7);
      const weekStart = subDays(weekEnd, 7);
      const filtered = processedData.logs.filter(
        (log) => log.date > weekStart && log.date <= weekEnd
      );
      data.push({
        name: i === 0 ? 'This Week' : `${i}w ago`,
        cost: filtered.reduce((sum, log) => sum + log.cost, 0),
        tokens: filtered.reduce((sum, log) => sum + log.totalT, 0),
      });
    }
    return data;
  }, [processedData, now]);

  const monthlyData = useMemo(
    () =>
      eachMonthOfInterval({ start: subMonths(startOfMonth(now), 11), end: now }).map(
        (month) => {
          const key = format(month, 'yyyy-MM');
          const data = processedData.monthly.get(key) || { t: 0, c: 0 };
          return { name: format(month, 'MMM'), cost: data.c, tokens: data.t };
        }
      ),
    [processedData, now]
  );

  return {
    loading,
    hourlyData,
    dailyData,
    weeklyData,
    monthlyData,
    totalTokens: lifetimeStats
      ? Number(lifetimeStats.total_tokens)
      : processedData.logs.reduce((sum, log) => sum + log.totalT, 0),
    totalCost: lifetimeStats
      ? Number(lifetimeStats.total_cost)
      : processedData.logs.reduce((sum, log) => sum + log.cost, 0),
    logCount: lifetimeStats
      ? Number(lifetimeStats.interaction_count)
      : rawLogs.length,
  };
}
