import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, MessageSquare, BarChart2 } from 'lucide-react';
import { FeatureUsageChart } from '../../components/dashboard/FeatureUsageChart';
import { MessagesPerUserChart } from '../../components/dashboard/MessagesPerUserChart';
import { SessionLengthChart } from '../../components/dashboard/SessionLengthChart';

import { useAnalyticsMetrics } from '../../hooks/useAnalyticsMetrics';



export default function UsageReports() {
  const { loading } = useAnalyticsMetrics();



  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1>Usage Reports</h1>
          <p className="text-body text-brand-text-muted mt-2">Detailed analysis of feature adoption and AI interaction efficiency.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/20">
          <Zap size={16} className="text-purple-400" />
          <span className="text-sm font-bold text-purple-400">Usage Hub</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 size={20} className="text-brand-accent" />
            <h3>Feature Adoption</h3>
          </div>
          <FeatureUsageChart />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-emerald-500" />
            <h3>Communication Volume</h3>
          </div>
          <MessagesPerUserChart />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <div className="mb-4 flex items-center gap-2">
            <Clock size={20} className="text-orange-500" />
            <h3>Engagement Depth</h3>
          </div>
          <SessionLengthChart />
        </motion.div>
      </div>
    </div>
  );
}
