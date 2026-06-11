import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, MessageSquare, BarChart2, MousePointerClick } from 'lucide-react';
import { FeatureUsageChart } from '../../components/dashboard/FeatureUsageChart';
import { MessagesPerUserChart } from '../../components/dashboard/MessagesPerUserChart';
import { SessionLengthChart } from '../../components/dashboard/SessionLengthChart';
import { PageVisitChart } from '../../components/dashboard/PageVisitChart';
import { PageHeader } from '../../components/ui';

export default function UsageReports() {

  return (
    <div className="page pb-6">
      <PageHeader
        title="Usage Reports"
        description="Detailed analysis of feature adoption and AI interaction efficiency."
        actions={
          <span className="badge bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1.5">
            <Zap size={12} />
            Usage Hub
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-2 flex items-center gap-2">
            <BarChart2 size={14} className="text-brand-accent" />
            <h3 className="section-title">Feature Adoption</h3>
          </div>
          <FeatureUsageChart />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-2 flex items-center gap-2">
            <MessageSquare size={14} className="text-emerald-500" />
            <h3 className="section-title">Communication Volume</h3>
          </div>
          <MessagesPerUserChart />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2"
        >
          <div className="mb-2 flex items-center gap-2">
            <MousePointerClick size={14} className="text-purple-400" />
            <h3 className="section-title">Page Navigation</h3>
          </div>
          <PageVisitChart />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-2 flex items-center gap-2">
            <Clock size={14} className="text-orange-500" />
            <h3 className="section-title">Engagement Depth</h3>
          </div>
          <SessionLengthChart />
        </motion.div>
      </div>
    </div>
  );
}
