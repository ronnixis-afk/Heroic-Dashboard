import React, { useState } from 'react';
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

const usageTrends = [
  { date: '2024-04-26', tokens: 120000, users: 800 },
  { date: '2024-04-27', tokens: 150000, users: 950 },
  { date: '2024-04-28', tokens: 180000, users: 1100 },
  { date: '2024-04-29', tokens: 160000, users: 1050 },
  { date: '2024-04-30', tokens: 210000, users: 1300 },
  { date: '2024-05-01', tokens: 250000, users: 1500 },
  { date: '2024-05-02', tokens: 280000, users: 1650 },
];

const modelDistribution = [
  { name: 'Gemini 3.1 Flash', value: 65, color: '#3ecf8e' },
  { name: 'Gemini 2.5 TTS', value: 25, color: '#a855f7' },
  { name: 'Gemini 3 Image', value: 10, color: '#38bdf8' },
];

const topUsers = [
  { email: 'wizard@rpg.com', usages: 450, tokens: '1.2M' },
  { email: 'knight_errant@heroic.app', usages: 380, tokens: '980k' },
  { email: 'dungeon_master@boss.com', usages: 310, tokens: '820k' },
  { email: 'rogue@guild.net', usages: 290, tokens: '750k' },
];

export default function AdminAnalytics() {
  const [activeMetric, setActiveMetric] = useState<'tokens' | 'users'>('tokens');

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
                    contentStyle={{ backgroundColor: '#1C1C1E', border: '1px solid #3a3a3a', borderRadius: '8px' }}
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
                    <span className="text-[10px] text-brand-text-muted">{user.usages} total invocations</span>
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
            <p className="text-sm text-brand-text-muted">Token usage vs active users over the last 7 days</p>
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
                contentStyle={{ backgroundColor: '#1C1C1E', border: '1px solid #3a3a3a', borderRadius: '8px' }}
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
