import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, CreditCard, PieChart } from 'lucide-react';
import RevenueOverview from '../../components/dashboard/RevenueOverview';
import NetProfitWidget from '../../components/dashboard/NetProfitWidget';
import { CostAnalyticsCard } from '../../components/dashboard/CostAnalyticsCard';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';

import { Skeleton, ChartSkeleton, CardSkeleton } from '../../components/Skeleton';

export default function FinancialReports() {
  const { 
    loading, 
    totalRevenue, 
    dailyData,
    weeklyData,
    monthlyData,
    yearlyData,
    netProfit,
    profitMargin
  } = useDashboardMetrics();

  const isLoading = loading;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Financial Reports</h1>
          <p className="text-brand-text-muted mt-2">Comprehensive analysis of revenue, costs, and platform profitability.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
          <DollarSign size={16} className="text-emerald-500" />
          <span className="text-sm font-bold text-emerald-500">Financial Hub</span>
        </div>
      </div>

      {/* Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <RevenueOverview 
            totalRevenue={totalRevenue} 
            dailyData={dailyData}
            weeklyData={weeklyData}
            monthlyData={monthlyData}
            yearlyData={yearlyData}
            isLoading={isLoading}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <NetProfitWidget netProfit={netProfit} profitMargin={profitMargin} isLoading={isLoading} />
        </motion.div>
      </div>

      {/* Detailed Cost Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-4 flex items-center gap-2">
          <PieChart size={20} className="text-brand-accent" />
          <h3 className="text-lg font-bold">API Cost Distribution</h3>
        </div>
        <CostAnalyticsCard />
      </motion.div>

      {/* Strategy Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel p-8 border-l-4 border-emerald-500"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Profitability Insight</h3>
            <p className="text-brand-text-muted leading-relaxed max-w-3xl">
              Based on current token consumption and Gemini 3 Flash Lite pricing, your platform maintains a healthy profit margin. 
              The most significant cost factor remains output token generation in high-narrative sessions. 
              Consider implementing token caching or tiered credit limits for free users to further optimize margins.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
