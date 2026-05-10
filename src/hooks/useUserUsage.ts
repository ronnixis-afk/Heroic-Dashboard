import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
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
async function fetchUserUsagePartitioned(userId: string, months: number = 12) {
  if (!userId) return [];

  const since = new Date();
  since.setMonth(since.getMonth() - months);
  const sinceISO = since.toISOString();

  let allData: any[] = [];
  let from = 0;
  
  // INDUSTRY STANDARD: Use 1000 as a safe page size for Supabase default limits
  const PAGE_SIZE = 1000; 

  try {
    while (true) {
      // Query the subset of columns needed
      const { data, error, count } = await supabase
        .from('UsageLog')
        .select('tokens, inputTokens, outputTokens, costUsd, createdAt', { count: 'exact' })
        .eq('userId', userId)
        .gte('createdAt', sinceISO)
        .order('createdAt', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.error('[useUserUsage] Fetch error:', error);
        throw error;
      }

      if (!data || data.length === 0) break;

      allData = [...allData, ...data];
      
      // If we got fewer than 1000, or we've reached the known count, stop.
      if (data.length < PAGE_SIZE) break;
      
      // Safety check: if we've reached the total count returned by Supabase
      if (count !== null && allData.length >= count) break;

      from += PAGE_SIZE;

      // Safety cap at 100,000 records
      if (from >= 100000) break;
    }
    
    console.log(`[useUserUsage] Scaled fetch complete: ${allData.length} records retrieved.`);
    return allData;
  } catch (err) {
    console.error('[useUserUsage] Critical fetch failure:', err);
    return allData;
  }
}

export function useUserUsage(userId: string) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { data: rawLogs = [], isLoading: loading } = useQuery({
    queryKey: ['user-usage-optimized', userId],
    queryFn: () => fetchUserUsagePartitioned(userId),
    enabled: !!userId,
    staleTime: 60000,
  });

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
    totalTokens: processedData.logs.reduce((sum, log) => sum + log.totalT, 0),
    totalCost: processedData.logs.reduce((sum, log) => sum + log.cost, 0),
    logCount: rawLogs.length
  };
}
