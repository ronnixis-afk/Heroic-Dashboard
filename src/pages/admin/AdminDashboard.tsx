import React from 'react';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { useAnalytics } from '../../hooks/useAnalytics';
import RevenueOverview from '../../components/dashboard/RevenueOverview';
import NetProfitWidget from '../../components/dashboard/NetProfitWidget';
import UserAcquisition from '../../components/dashboard/UserAcquisition';
import RecentSignups from '../../components/dashboard/RecentSignups';
import TopConsumers from '../../components/dashboard/TopConsumers';

import { Activity } from 'lucide-react';

export default function AdminDashboard() {
  const { 
    loading, 
    totalRevenue, 
    revenueData, 
    recentSignups, 
    topConsumers, 
    acquisitionData,
    activeSessionsCount,
    netProfit,
    profitMargin
  } = useDashboardMetrics();
  
  // Track page view
  useAnalytics();

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-accent border-t-transparent" />
          <p className="text-brand-text-muted animate-pulse">Synchronizing With RPG Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white pb-8">
      {/* Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <RevenueOverview totalRevenue={totalRevenue} revenueData={revenueData} />
        </div>
        <NetProfitWidget netProfit={netProfit} profitMargin={profitMargin} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UserAcquisition acquisitionData={acquisitionData} />
        <RecentSignups recentSignups={recentSignups} />
        <TopConsumers topConsumers={topConsumers} />
      </div>
    </div>
  );
}
