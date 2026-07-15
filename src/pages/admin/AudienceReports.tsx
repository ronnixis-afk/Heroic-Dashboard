import React from 'react';
import { motion } from 'framer-motion';
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
      <div className="page">
        <div className="flex flex-col gap-2">
          <Skeleton width={200} height={24} />
          <Skeleton width="100%" height={14} className="opacity-50" />
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
    <div className="page">
      <PageHeader
        title="Audience Reports"
        description="Reach, acquisition, retention, and churn risk across the platform."
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <ActiveUsersCard />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <UserAcquisition acquisitionData={acquisitionData} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <RecentSignups recentSignups={recentSignups} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="overflow-x-auto"
        >
          <RetentionTable />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="overflow-x-auto"
        >
          <ChurnSignalsTable />
        </motion.div>
      </div>
    </div>
  );
}
