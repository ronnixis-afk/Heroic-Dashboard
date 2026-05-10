import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Zap, Globe, Clock, Activity, DollarSign } from 'lucide-react';
import { useAnalyticsMetrics } from '../../hooks/useAnalyticsMetrics';
import EngineHealthDashboard from '../../components/analytics/EngineHealthDashboard';
import ModelUsagePie from '../../components/analytics/ModelUsagePie';

import { Skeleton, ChartSkeleton, SkeletonText } from '../../components/Skeleton';

export default function AdminAnalytics() {
  const [activeMetric, setActiveMetric] = useState<'tokens' | 'users' | 'engagement' | 'engine' | 'cost'>('tokens');
  const { 
    loading, 
    usageTrends, 
    modelDistribution, 
    topUsers,
    activeSessionsCount,
    avgSessionLength,
    sessionTrends,
    totalCost
  } = useAnalyticsMetrics();

  return (
    <div className="space-y-8">
      {/* Real-time Stats Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel flex items-center justify-between p-6 border-l-4 border-brand-accent"
        >
          <div>
            <p className="text-xs font-medium text-brand-text-muted uppercase tracking-wider">Active Sessions</p>
            {loading ? (
              <SkeletonText width={60} className="h-9 mt-2" />
            ) : (
              <h4 className="mt-2 text-3xl font-bold text-brand-accent">{activeSessionsCount}</h4>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent">
            <Activity size={24} className="animate-pulse" />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel flex items-center justify-between p-6 border-l-4 border-emerald-500"
        >
          <div>
            <p className="text-xs font-medium text-brand-text-muted uppercase tracking-wider">Total API Cost</p>
            {loading ? (
              <SkeletonText width={120} className="h-9 mt-2" />
            ) : (
              <h4 className="mt-2 text-3xl font-bold text-white">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <DollarSign size={24} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel flex items-center justify-between p-6 border-l-4 border-indigo-500"
        >
          <div>
            <p className="text-xs font-medium text-brand-text-muted uppercase tracking-wider">Avg Latency</p>
            {loading ? (
              <SkeletonText width={80} className="h-9 mt-2" />
            ) : (
              <h4 className="mt-2 text-3xl font-bold text-white">342ms</h4>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Zap size={24} />
          </div>
        </motion.div>
      </div>

      {/* Top Row: Detailed Metrics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <ModelUsagePie data={modelDistribution} />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6"
        >
          <h3 className="mb-6 text-lg font-medium text-brand-accent">Usage Leaderboard</h3>
          <div className="space-y-6">
            {topUsers.map((user, idx) => (
              <div key={user.email} className="flex items-center justify-between border-b border-brand-primary/10 pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-brand-text-muted">#{idx + 1}</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.email}</span>
                    <span className="text-[10px] text-brand-text-muted">{user.usages} Total Invocations</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-brand-accent">{user.tokens}</span>
                  <p className="text-[8px] text-brand-text-muted">Tokens</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Consumption Trend Line Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Performance Trends</h3>
            <p className="text-sm text-brand-text-muted">Analysis of consumption and engagement over time</p>
          </div>
          <div className="flex gap-2">
            {[
              { id: 'tokens', label: 'Tokens', color: '#3ecf8e' },
              { id: 'cost', label: 'USD Cost', color: '#10b981' },
              { id: 'users', label: 'Active Users', color: '#38bdf8' },
              { id: 'engagement', label: 'Engagement', color: '#a855f7' },
              { id: 'engine', label: 'Engine Health', color: '#00b2ff' }
            ].map(m => (
              <button 
                key={m.id}
                onClick={() => setActiveMetric(m.id as any)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${activeMetric === m.id ? 'bg-brand-primary/20' : 'text-brand-text-muted hover:bg-brand-primary/10'}`}
                style={{ color: activeMetric === m.id ? m.color : undefined }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {activeMetric === 'engine' ? (
          <EngineHealthDashboard />
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeMetric === 'engagement' ? sessionTrends : usageTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" vertical={false} />
                <XAxis dataKey="date" stroke="#8E8E93" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8E8E93" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '12px' }}
                />
                {activeMetric === 'tokens' && (
                  <Line 
                    type="monotone" 
                    dataKey="tokens" 
                    stroke="#3ecf8e" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#3ecf8e', strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                )}
                {activeMetric === 'cost' && (
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                )}
                {activeMetric === 'users' && (
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#38bdf8" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#38bdf8', strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                )}
                {activeMetric === 'engagement' && (
                  <Line 
                    type="monotone" 
                    dataKey="avgDuration" 
                    stroke="#a855f7" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#a855f7', strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>
    </div>
  );
}
