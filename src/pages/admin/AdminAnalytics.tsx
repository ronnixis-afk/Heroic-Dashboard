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
  Line,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Zap, Globe, Clock, Activity, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAnalyticsMetrics } from '../../hooks/useAnalyticsMetrics';
import EngineHealthDashboard from '../../components/analytics/EngineHealthDashboard';
import ModelUsagePie from '../../components/analytics/ModelUsagePie';

import { Skeleton, ChartSkeleton, SkeletonText } from '../../components/Skeleton';

interface TrendCardProps {
  title: string;
  value: string | number;
  trend: any[];
  dataKey: string;
  color: string;
  loading: boolean;
  icon: React.ReactNode;
  comparison: string;
}

function RealTimeTrendCard({ title, value, trend, dataKey, color, loading, icon, comparison }: TrendCardProps) {
  const isPositive = comparison.startsWith('+');
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel overflow-hidden flex flex-col h-48 relative"
    >
      <div className="p-6 pb-0 flex justify-between items-start z-10">
        <div>
          <p className="text-xs font-bold text-brand-text-muted mb-1">{title}</p>
          {loading ? (
            <SkeletonText width={80} className="h-8 mt-2" />
          ) : (
            <div className="flex items-baseline gap-3">
              <h4 className="text-h1 font-bold text-white tracking-tight">{value}</h4>
              <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {isPositive ? <ArrowUpRight size={10} className="mr-1" /> : <ArrowDownRight size={10} className="mr-1" />}
                {comparison}
              </div>
            </div>
          )}
        </div>
        <div className="h-10 w-10 rounded-xl bg-brand-primary/30 border border-brand-primary/50 flex items-center justify-center text-brand-text-muted">
          {icon}
        </div>
      </div>

      <div className="flex-1 mt-4 relative">
        {!loading && trend.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey={dataKey} 
                stroke={color} 
                strokeWidth={2}
                fillOpacity={1} 
                fill={`url(#color-${dataKey})`} 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

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
    totalCost,
    realTimeTrends,
    costComparison,
    avgLatency
  } = useAnalyticsMetrics();

  return (
    <div className="space-y-8">
      <h1>Real-Time Analytics</h1>
      
      {/* Real-time Stats Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <RealTimeTrendCard 
          title="Active Sessions" 
          value={activeSessionsCount} 
          trend={realTimeTrends} 
          dataKey="users"
          color="#00b2ff"
          loading={loading}
          icon={<Activity size={18} />}
          comparison="+12%"
        />

        <RealTimeTrendCard 
          title="Total API Cost" 
          value={`$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          trend={realTimeTrends} 
          dataKey="cost"
          color="#3ecf8e"
          loading={loading}
          icon={<DollarSign size={18} />}
          comparison={`${costComparison > 0 ? '+' : ''}${costComparison}%`}
        />

        <RealTimeTrendCard 
          title="Avg Latency" 
          value={`${avgLatency}ms`} 
          trend={realTimeTrends} 
          dataKey="latency"
          color="#a855f7"
          loading={loading}
          icon={<Zap size={18} />}
          comparison="-4%"
        />
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
          <h3 className="mb-6 text-brand-accent">Usage Leaderboard</h3>
          <div className="space-y-6">
            {topUsers.map((user, idx) => (
              <div key={user.email} className="flex items-center justify-between border-b border-brand-primary/10 pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-brand-text-muted">#{idx + 1}</span>
                  <div className="flex flex-col">
                    <span className="text-body font-medium">{user.email}</span>
                    <span className="text-xs text-brand-text-muted">{user.usages} Total Invocations</span>
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
            <h3>Performance Trends</h3>
            <p className="text-body text-brand-text-muted">Analysis of consumption and engagement over time</p>
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
              <LineChart data={(activeMetric === 'engagement' ? sessionTrends : usageTrends) as any[]}>
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
