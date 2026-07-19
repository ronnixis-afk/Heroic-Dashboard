/**
 * Shared RPG admin metric fetch helpers with stable shapes for React Query keys.
 */
import { fetchRpgAdmin, type RpgAdminTokenSource } from './rpgAdminApi';

export const metricsQueryKeys = {
  dailyUsageSummary: (days: number) => ['metrics', 'daily-usage-summary', days] as const,
  topConsumers: (limit: number) => ['metrics', 'top-consumers', limit] as const,
  costAnalytics: (days: number) => ['metrics', 'cost-analytics', days] as const,
};

type ViewDataResponse<T> = { resource: string; data: T };

export async function fetchDailyUsageSummary(tokenOrGetter: RpgAdminTokenSource, days = 30) {
  const result = await fetchRpgAdmin<ViewDataResponse<any[]>>(
    `/api/admin/analytics/view-data?resource=daily-usage&days=${days}`,
    tokenOrGetter
  );
  return result.data || [];
}

export async function fetchTopConsumersWithEmails(tokenOrGetter: RpgAdminTokenSource, limit = 5) {
  const result = await fetchRpgAdmin<ViewDataResponse<any[]>>(
    `/api/admin/analytics/view-data?resource=top-consumers&limit=${limit}`,
    tokenOrGetter
  );
  const topConsumersData = result.data || [];
  const userEmailMap: Record<string, string> = {};
  topConsumersData.forEach((entry) => {
    if (entry.userId) {
      userEmailMap[entry.userId] = entry.email || `User ${String(entry.userId).slice(0, 5)}`;
    }
  });
  return { topConsumersData, userEmailMap };
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

export async function fetchCostAnalyticsBundle(tokenOrGetter: RpgAdminTokenSource, days = 30) {
  const [dailyMetrics, modelRes, costAnalytics] = await Promise.all([
    fetchDailyUsageSummary(tokenOrGetter, days),
    fetchRpgAdmin<ViewDataResponse<any[]>>(
      '/api/admin/analytics/view-data?resource=model-usage',
      tokenOrGetter
    ).catch((e) => {
      console.warn('[Metrics] model-usage view-data failed:', e);
      return { data: [] as any[] };
    }),
    fetchRpgAdmin<CostAnalyticsApiResponse>(
      `/api/admin/analytics/cost-analytics?days=${days}`,
      tokenOrGetter
    ).catch((e) => {
      console.warn('[Metrics] cost-analytics API failed:', e);
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
