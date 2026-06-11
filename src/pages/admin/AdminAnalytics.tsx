import React, { useState } from 'react';
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
  Area,
  ReferenceLine
} from 'recharts';
import { motion } from 'framer-motion';
import { Zap, Activity, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAnalyticsMetrics, formatComparison } from '../../hooks/useAnalyticsMetrics';
import EngineHealthDashboard from '../../components/analytics/EngineHealthDashboard';
import ModelUsagePie from '../../components/analytics/ModelUsagePie';
import { PageHeader, FilterTabs } from '../../components/ui';
import { SkeletonText } from '../../components/Skeleton';

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
  const isNeutral = comparison === '—';
  const isPositive = !isNeutral && comparison.startsWith('+');
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden flex flex-col h-36 relative"
    >
      <div className="p-3.5 pb-0 flex justify-between items-start z-10">
        <div>
          <p className="input-label mb-0">{title}</p>
          {loading ? (
            <SkeletonText width={80} className="h-5 mt-1" />
          ) : (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="card-metric">{value}</span>
              <div className={`badge ${
                isNeutral ? 'badge-muted' : isPositive ? 'badge-success' : 'badge-danger'
              }`}>
                {!isNeutral && (isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />)}
                {comparison}
              </div>
            </div>
          )}
        </div>
        <div className="w-7 h-7 rounded-md bg-brand-primary/30 border border-brand-primary/50 flex items-center justify-center text-brand-text-muted">
          {icon}
        </div>
      </div>

      <div className="flex-1 mt-2 relative">
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

const METRIC_OPTIONS = [
  { id: 'tokens', label: 'Tokens', color: '#3ecf8e' },
  { id: 'cost', label: 'USD Cost', color: '#10b981' },
  { id: 'users', label: 'Active Users', color: '#38bdf8' },
  { id: 'engagement', label: 'Engagement', color: '#a855f7' }
] as const;

export default function AdminAnalytics() {
  const [activeMetric, setActiveMetric] = useState<'tokens' | 'users' | 'engagement' | 'cost'>('tokens');
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
    sessionsComparison,
    latencyComparison,
    avgLatency
  } = useAnalyticsMetrics();

  return (
    <div className="page">
      <PageHeader title="Real-Time Analytics" />
      
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <RealTimeTrendCard 
          title="Active Sessions (Live)" 
          value={activeSessionsCount} 
          trend={realTimeTrends} 
          dataKey="users"
          color="#20cce0"
          loading={loading}
          icon={<Activity size={14} />}
          comparison={formatComparison(sessionsComparison)}
        />

        <RealTimeTrendCard 
          title="Total API Cost (30d)" 
          value={`$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          trend={realTimeTrends} 
          dataKey="cost"
          color="#3ecf8e"
          loading={loading}
          icon={<DollarSign size={14} />}
          comparison={formatComparison(costComparison)}
        />

        <RealTimeTrendCard 
          title="Avg Latency (24h)" 
          value={`${avgLatency}ms`} 
          trend={realTimeTrends} 
          dataKey="latency"
          color="#a855f7"
          loading={loading}
          icon={<Zap size={14} />}
          comparison={formatComparison(latencyComparison)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
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
          className="card p-3.5"
        >
          <h3 className="card-title mb-3">Usage Leaderboard</h3>
          <div className="space-y-2">
            {topUsers.map((user, idx) => (
              <div key={user.email} className="list-item justify-between border-b border-brand-primary/10 pb-2 last:border-0">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-xs font-mono text-brand-text-muted flex-shrink-0">#{idx + 1}</span>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-medium truncate">{user.email}</span>
                    <span className="text-xs text-brand-text-muted">{user.usages} Total Invocations</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-semibold text-brand-accent">{user.tokens}</span>
                  <p className="text-xs text-brand-text-muted">Tokens</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-3.5"
      >
        <div className="card-header">
          <div>
            <h3 className="card-title">Performance Trends</h3>
            <p className="card-subtitle">Analysis of consumption and engagement over time</p>
          </div>
          <FilterTabs
            options={METRIC_OPTIONS.map(m => m.label)}
            value={METRIC_OPTIONS.find(m => m.id === activeMetric)?.label || 'Tokens'}
            onChange={(label) => {
              const match = METRIC_OPTIONS.find(m => m.label === label);
              if (match) setActiveMetric(match.id);
            }}
          />
        </div>
        <div className="h-[260px] md:h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={(activeMetric === 'engagement' ? sessionTrends : usageTrends) as any[]}
              margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#8E8E93" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return isNaN(d.getTime()) ? val : d.getDate().toString();
                }}
              />
              <YAxis stroke="#8E8E93" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}
                labelStyle={{ color: '#8b8c94', marginBottom: '4px', fontWeight: 'medium', fontSize: '10px' }}
                labelFormatter={(label) => {
                  const d = new Date(label);
                  return isNaN(d.getTime()) ? label : d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
                }}
              />
              
              {(() => {
                const data = (activeMetric === 'engagement' ? sessionTrends : usageTrends) as any[];
                const monthMarkers: React.ReactNode[] = [];
                
                for (let i = 1; i < data.length; i++) {
                  const prevDate = new Date(data[i-1].date);
                  const currDate = new Date(data[i].date);
                  
                  if (prevDate.getMonth() !== currDate.getMonth()) {
                    const monthName = currDate.toLocaleDateString(undefined, { month: 'short' });
                    const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                    
                    monthMarkers.push(
                      <ReferenceLine 
                        key={data[i].date}
                        x={data[i].date} 
                        stroke="#444" 
                        strokeWidth={1}
                        label={{ 
                          value: formattedMonth, 
                          position: 'top', 
                          fill: '#3ecf8e', 
                          fontSize: 10, 
                          fontWeight: 'bold',
                          offset: 10
                        }} 
                      />
                    );
                  }
                }
                return monthMarkers;
              })()}

              {activeMetric === 'tokens' && (
                <Line 
                  type="monotone" 
                  dataKey="tokens" 
                  stroke="#3ecf8e" 
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#3ecf8e', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              )}
              {activeMetric === 'cost' && (
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              )}
              {activeMetric === 'users' && (
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#38bdf8" 
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#38bdf8', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              )}
              {activeMetric === 'engagement' && (
                <Line 
                  type="monotone" 
                  dataKey="avgDurationMin" 
                  stroke="#a855f7" 
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#a855f7', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-3"
      >
        <h3 className="section-title">Engine Health</h3>
        <EngineHealthDashboard />
      </motion.div>
    </div>
  );
}
