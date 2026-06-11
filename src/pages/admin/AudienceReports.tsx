import React from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, AlertTriangle } from 'lucide-react';
import UserAcquisition from '../../components/dashboard/UserAcquisition';
import { ActiveUsersCard } from '../../components/dashboard/ActiveUsersCard';
import RecentSignups from '../../components/dashboard/RecentSignups';
import { RetentionTable } from '../../components/dashboard/RetentionTable';
import { ChurnSignalsTable } from '../../components/dashboard/ChurnSignalsTable';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { PageHeader } from '../../components/ui';
import { Skeleton, ChartSkeleton, CardSkeleton, TableSkeleton } from '../../components/Skeleton';

export default function AudienceReports() {
  const { acquisitionData, recentSignups, loading } = useDashboardMetrics();

  if (loading) {
    return (
      <div className="page pb-6">
        <div className="flex flex-col gap-2">
          <Skeleton width={200} height={24} mdWidth={240} mdHeight={28} />
          <Skeleton width="100%" height={14} mdWidth={450} className="opacity-50" />
        </div>
        <CardSkeleton height={160} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ChartSkeleton height={280} />
          <CardSkeleton height={280} />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Skeleton width={150} height={18} />
            <TableSkeleton rows={6} cols={4} />
          </div>
          <div className="space-y-2">
            <Skeleton width={150} height={18} />
            <TableSkeleton rows={6} cols={4} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page pb-6">
      <PageHeader
        title="Audience Reports"
        description="Analysis of user growth, behavior, and retention across the platform."
        actions={
          <span className="badge-accent flex items-center gap-1.5">
            <Users size={12} />
            Audience Hub
          </span>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <ActiveUsersCard />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-500" />
            <h3 className="section-title">User Retention</h3>
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
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle size={14} className="text-orange-500" />
            <h3 className="section-title">Churn Signals</h3>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <ChurnSignalsTable />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
