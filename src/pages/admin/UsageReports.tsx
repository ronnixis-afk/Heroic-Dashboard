import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, MessageSquare, BarChart2, MousePointerClick } from 'lucide-react';
import { FeatureUsageChart } from '../../components/dashboard/FeatureUsageChart';
import { MessagesPerUserChart } from '../../components/dashboard/MessagesPerUserChart';
import { SessionLengthChart } from '../../components/dashboard/SessionLengthChart';
import { PageVisitChart } from '../../components/dashboard/PageVisitChart';

import { useAnalyticsMetrics } from '../../hooks/useAnalyticsMetrics';



export default function UsageReports() {
  const { loading } = useAnalyticsMetrics();

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-h1">Usage Reports</h1>
          <p className="text-xs md:text-body text-brand-text-muted mt-2">Detailed analysis of feature adoption and AI interaction efficiency.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-purple-500/10 rounded-full border border-purple-500/20 w-fit">
          <Zap size={16} className="text-purple-400" />
          <span className="text-xs md:text-sm font-bold text-purple-400">Usage Hub</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 size={20} className="text-brand-accent" />
            <h3 className="text-lg">Feature Adoption</h3>
          </div>
          <FeatureUsageChart />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-emerald-500" />
            <h3 className="text-lg">Communication Volume</h3>
          </div>
          <MessagesPerUserChart />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2"
        >
          <div className="mb-4 flex items-center gap-2">
            <MousePointerClick size={20} className="text-purple-400" />
            <h3 className="text-lg">Page Navigation</h3>
          </div>
          <PageVisitChart />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Clock size={20} className="text-orange-500" />
            <h3 className="text-lg">Engagement Depth</h3>
          </div>
          <SessionLengthChart />
        </motion.div>
      </div>
    </div>
  );
}
