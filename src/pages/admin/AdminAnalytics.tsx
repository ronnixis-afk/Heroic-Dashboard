import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Zap, Globe } from 'lucide-react';

export default function AdminAnalytics() {
  const [activeMetric, setActiveMetric] = useState<'tokens' | 'users'>('tokens');
  const [usageTrends, setUsageTrends] = useState<any[]>([]);
  const [modelDistribution, setModelDistribution] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Fetch all usage logs (limit to last 30 days for performance)
      const { data: logs, error } = await supabase
        .from('UsageLog')
        .select(`
          *,
          User ( email )
        `)
        .order('createdAt', { ascending: true });

      if (error || !logs) {
        console.error('Error fetching logs:', error);
        setLoading(false);
        return;
      }

      // 2. Process Trends (Group by Date)
      const trendsMap: Record<string, any> = {};
      logs.forEach(log => {
        const date = new Date(log.createdAt).toISOString().split('T')[0];
        if (!trendsMap[date]) {
          trendsMap[date] = { date, tokens: 0, users: new Set() };
        }
        trendsMap[date].tokens += log.tokens;
        trendsMap[date].users.add(log.userId);
      });
      
      const trends = Object.values(trendsMap).map(t => ({
        ...t,
        users: t.users.size
      }));
      setUsageTrends(trends.slice(-7)); // Last 7 days for trend line

      // 3. Process Model Distribution
      const modelMap: Record<string, number> = {};
      logs.forEach(log => {
        const name = log.model || 'Unknown';
        modelMap[name] = (modelMap[name] || 0) + 1;
      });
      
      const colors = ['#3ecf8e', '#a855f7', '#38bdf8', '#fbbf24', '#f87171'];
      const distribution = Object.entries(modelMap).map(([name, count], idx) => ({
        name,
        value: Math.round((count / logs.length) * 100),
        color: colors[idx % colors.length]
      }));
      setModelDistribution(distribution);

      // 4. Process Leaderboard (Top Users by Token)
      const userMap: Record<string, any> = {};
      logs.forEach(log => {
        const email = log.User?.email || 'Unknown';
        if (!userMap[email]) {
          userMap[email] = { email, usages: 0, tokens: 0 };
        }
        userMap[email].usages += 1;
        userMap[email].tokens += log.tokens;
      });

      const leaders = Object.values(userMap)
        .sort((a, b) => b.tokens - a.tokens)
        .slice(0, 5)
        .map(u => ({
          ...u,
          tokens: u.tokens > 1000000 ? `${(u.tokens / 1000000).toFixed(1)}M` : `${Math.round(u.tokens / 1000)}k`
        }));
      setTopUsers(leaders);

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-accent border-t-transparent" />
          <p className="text-brand-text-muted animate-pulse">Aggregating Live Usage Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Row: Detailed Metrics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel col-span-2 p-6"
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-medium">Model Usage Distribution</h3>
            <Globe className="text-brand-text-muted" size={20} />
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modelDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {modelDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center space-y-4">
              {modelDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6"
        >
          <h3 className="mb-6 text-lg font-medium text-brand-accent">Leaderboard</h3>
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
            <h3 className="text-lg font-medium">Daily Consumption Trends</h3>
            <p className="text-sm text-brand-text-muted">Token Usage vs Active Users Over the Last 7 Days</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveMetric('tokens')}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${activeMetric === 'tokens' ? 'bg-brand-primary/20 text-brand-accent' : 'text-brand-text-muted hover:bg-brand-primary/10'}`}
            >
              Tokens
            </button>
            <button 
              onClick={() => setActiveMetric('users')}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${activeMetric === 'users' ? 'bg-brand-primary/20 text-[#38bdf8]' : 'text-brand-text-muted hover:bg-brand-primary/10'}`}
            >
              Active Users
            </button>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={usageTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" vertical={false} />
              <XAxis dataKey="date" stroke="#8E8E93" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="#3ecf8e" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '12px' }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="tokens" 
                stroke="#3ecf8e" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#3ecf8e', strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="users" 
                stroke="#38bdf8" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
