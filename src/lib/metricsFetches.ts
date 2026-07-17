/**
 * Shared Supabase/RPG metric fetch helpers with stable shapes for React Query keys.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchRpgAdmin, type RpgAdminTokenSource } from './rpgAdminApi';

export const metricsQueryKeys = {
  dailyUsageSummary: (days: number) => ['metrics', 'daily-usage-summary', days] as const,
  topConsumers: (limit: number) => ['metrics', 'top-consumers', limit] as const,
  costAnalytics: (days: number) => ['metrics', 'cost-analytics', days] as const,
};

export async function fetchDailyUsageSummary(supabase: SupabaseClient, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const dateStr = since.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_usage_summary')
    .select('*')
    .gte('date', dateStr)
    .order('date', { ascending: false });

  if (error) {
    console.error('[Metrics] daily_usage_summary error:', error);
  }
  return data || [];
}

export async function fetchTopConsumersWithEmails(supabase: SupabaseClient, limit = 5) {
  const { data: topConsumersData } = await supabase
    .from('top_consumers_summary')
    .select('*')
    .order('total_cost', { ascending: false })
    .limit(limit);

  const topUserIds = (topConsumersData || []).map((u) => u.userId).filter(Boolean);
  let userEmailMap: Record<string, string> = {};

  if (topUserIds.length > 0) {
    const { data: usersData } = await supabase.from('User').select('id, email').in('id', topUserIds);
    (usersData || []).forEach((u) => {
      userEmailMap[u.id] = u.email;
    });
  }

  return { topConsumersData: topConsumersData || [], userEmailMap };
}

export interface CostAnalyticsApiResponse {
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

export async function fetchCostAnalyticsBundle(
  supabase: SupabaseClient,
  tokenOrGetter: RpgAdminTokenSource,
  days = 30
) {
  const [modelRes, dailyMetrics, costAnalytics] = await Promise.all([
    supabase.from('model_usage_distribution').select('*'),
    fetchDailyUsageSummary(supabase, days),
    fetchRpgAdmin<CostAnalyticsApiResponse>(
      `/api/admin/analytics/cost-analytics?days=${days}`,
      tokenOrGetter
    ).catch((e) => {
      console.warn('[Metrics] cost-analytics API failed, using view fallback:', e);
      return null;
    }),
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

  return { modelCostData, dailyCostData, dailyMetrics, modelData };
}
