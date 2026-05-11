import React from 'react';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { useAnalytics } from '../../hooks/useAnalytics';
import RevenueOverview from '../../components/dashboard/RevenueOverview';
import NetProfitWidget from '../../components/dashboard/NetProfitWidget';
import UserAcquisition from '../../components/dashboard/UserAcquisition';
import RecentSignups from '../../components/dashboard/RecentSignups';
import TopConsumers from '../../components/dashboard/TopConsumers';

import { Activity } from 'lucide-react';

import { DashboardSkeleton } from '../../components/Skeleton';

export default function AdminDashboard() {
  const { 
    loading, 
    totalRevenue, 
    dailyData,
    weeklyData,
    monthlyData,
    yearlyData,
    recentSignups, 
    topConsumers, 
    acquisitionData,
    activeSessionsCount,
    netProfit,
    profitMargin
  } = useDashboardMetrics();
  
  // Track page view
  useAnalytics();
 
  return (
    <div className="space-y-6 text-white pb-8">
      <h1 className="mb-8">Admin Dashboard</h1>
      
      {/* Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
        <NetProfitWidget 
          netProfit={netProfit} 
          profitMargin={profitMargin} 
          isLoading={loading}
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UserAcquisition 
          acquisitionData={acquisitionData} 
          isLoading={loading}
        />
        <RecentSignups 
          recentSignups={recentSignups} 
          isLoading={loading}
        />
        <TopConsumers 
          topConsumers={topConsumers} 
          isLoading={loading}
        />
      </div>
    </div>
  );
}
