import React from 'react';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { useAnalytics } from '../../hooks/useAnalytics';
import RevenueOverview from '../../components/dashboard/RevenueOverview';
import TokenEstimator from '../../components/dashboard/TokenEstimator';
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
    activeSessionsCount
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
        <div className="glass-panel p-6 flex flex-col justify-center items-center text-center">
          <div className="h-12 w-12 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent mb-4">
            <Activity size={24} className="animate-pulse" />
          </div>
          <p className="text-xs font-medium text-brand-text-muted uppercase tracking-wider">Live Players</p>
          <h4 className="mt-2 text-4xl font-bold text-brand-accent">{activeSessionsCount}</h4>
          <p className="text-[10px] text-brand-text-muted mt-2">Active in the last 5 minutes</p>
        </div>
        <TokenEstimator />
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
