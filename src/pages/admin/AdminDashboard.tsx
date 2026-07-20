import React from 'react';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { useAnalytics } from '../../hooks/useAnalytics';
import RevenueOverview from '../../components/dashboard/RevenueOverview';
import NetProfitWidget from '../../components/dashboard/NetProfitWidget';
import UserAcquisition from '../../components/dashboard/UserAcquisition';
import RecentSignups from '../../components/dashboard/RecentSignups';
import TopConsumers from '../../components/dashboard/TopConsumers';
import { PageHeader, StatusBanner } from '../../components/ui';

export default function AdminDashboard() {
  const {
    loading,
    error,
    totalRevenue,
    dailyData,
    weeklyData,
    monthlyData,
    yearlyData,
    recentSignups,
    topConsumers,
    acquisitionData,
    netProfit,
    profitMargin,
  } = useDashboardMetrics();

  useAnalytics();

  const errorMessage =
    error instanceof Error
      ? error.message
      : error
        ? 'Unable To Load Dashboard Metrics From The RPG API.'
        : null;

  return (
    <div className="page">
      <PageHeader
        title="Admin Dashboard"
        description="Revenue, profitability, acquisition, and top consumer overview."
      />

      {errorMessage && (
        <StatusBanner type="error" message={errorMessage} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-2">
          <RevenueOverview
            totalRevenue={totalRevenue}
            dailyData={dailyData}
            weeklyData={weeklyData}
            monthlyData={monthlyData}
            yearlyData={yearlyData}
            isLoading={loading}
          />
        </div>
        <div className="lg:col-span-2">
          <NetProfitWidget
            netProfit={netProfit}
            profitMargin={profitMargin}
            isLoading={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <UserAcquisition acquisitionData={acquisitionData} isLoading={loading} />
        <RecentSignups recentSignups={recentSignups} isLoading={loading} />
        <TopConsumers topConsumers={topConsumers} isLoading={loading} />
      </div>
    </div>
  );
}
