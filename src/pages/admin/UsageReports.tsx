import React from 'react';
import { motion } from 'framer-motion';
import { FeatureUsageChart } from '../../components/dashboard/FeatureUsageChart';
import { MessagesPerUserChart } from '../../components/dashboard/MessagesPerUserChart';
import { SessionLengthChart } from '../../components/dashboard/SessionLengthChart';
import { PageVisitChart } from '../../components/dashboard/PageVisitChart';
import { ProductUsageInsight } from '../../components/dashboard/ProductUsageInsight';
import { useAnalyticsMetrics } from '../../hooks/useAnalyticsMetrics';
import { PageHeader, StatusBanner } from '../../components/ui';

export default function UsageReports() {
  const { error, degradedMessage } = useAnalyticsMetrics();

  return (
    <div className="page">
      <PageHeader
        title="Usage Reports"
        description="Product adoption, communication volume, navigation, and session depth."
      />

      {error && (
        <StatusBanner
          type="error"
          message={
            error instanceof Error
              ? error.message
              : 'Unable To Load Usage Metrics From The RPG API.'
          }
        />
      )}
      {!error && degradedMessage && (
        <StatusBanner type="info" message={degradedMessage} />
      )}

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <ProductUsageInsight />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <FeatureUsageChart />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <MessagesPerUserChart />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2"
        >
          <PageVisitChart />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <SessionLengthChart />
      </motion.div>
    </div>
  );
}
