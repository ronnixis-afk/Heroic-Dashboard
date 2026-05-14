import React from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, TrendingUp, AlertTriangle } from 'lucide-react';
import UserAcquisition from '../../components/dashboard/UserAcquisition';
import { ActiveUsersCard } from '../../components/dashboard/ActiveUsersCard';
import RecentSignups from '../../components/dashboard/RecentSignups';
import { RetentionTable } from '../../components/dashboard/RetentionTable';
import { ChurnSignalsTable } from '../../components/dashboard/ChurnSignalsTable';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';

import { Skeleton, ChartSkeleton, CardSkeleton, TableSkeleton } from '../../components/Skeleton';

export default function AudienceReports() {
  const { acquisitionData, recentSignups, loading } = useDashboardMetrics();

  if (loading) {
    return (
      <div className="space-y-6 md:space-y-8 pb-12">
        <div className="flex flex-col gap-2">
          <Skeleton width={200} height={32} mdWidth={280} mdHeight={40} />
          <Skeleton width="100%" height={16} mdWidth={450} className="opacity-50" />
        </div>
        <CardSkeleton height={200} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <ChartSkeleton height={340} />
          <CardSkeleton height={340} />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          <div className="space-y-4">
            <Skeleton width={150} height={24} />
            <TableSkeleton rows={6} cols={4} />
          </div>
          <div className="space-y-4">
            <Skeleton width={150} height={24} />
            <TableSkeleton rows={6} cols={4} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-h1">Audience Reports</h1>
          <p className="text-xs md:text-body text-brand-text-muted mt-2">Analysis of user growth, behavior, and retention across the platform.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-brand-accent/10 rounded-full border border-brand-accent/20 w-fit">
          <Users size={16} className="text-brand-accent" />
          <span className="text-xs md:text-sm font-bold text-brand-accent">Audience Hub</span>
        </div>
      </div>

      {/* Primary Metrics Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <ActiveUsersCard />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <UserAcquisition acquisitionData={acquisitionData} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <RecentSignups recentSignups={recentSignups} />
        </motion.div>
      </div>

      {/* Advanced Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-500" />
            <h3>User Retention</h3>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <RetentionTable />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" />
            <h3>Churn Signals</h3>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <ChurnSignalsTable />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
