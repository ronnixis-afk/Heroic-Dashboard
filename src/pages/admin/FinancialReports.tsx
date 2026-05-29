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
    <div className="space-y-6 md:space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-h1">Financial Reports</h1>
          <p className="text-xs md:text-body text-brand-text-muted mt-2">Comprehensive analysis of revenue, costs, and platform profitability.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 w-fit">
          <DollarSign size={16} className="text-emerald-500" />
          <span className="text-xs md:text-sm font-bold text-emerald-500">Financial Hub</span>
        </div>
      </div>

      {/* Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <NetProfitWidget netProfit={netProfit} profitMargin={profitMargin} isLoading={isLoading} />
        </motion.div>
      </div>

      {/* Detailed Cost Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-4 flex items-center gap-2">
          <PieChart size={20} className="text-brand-accent" />
          <h3 className="text-lg md:text-xl">API Cost Distribution</h3>
        </div>
        <CostAnalyticsCard />
      </motion.div>

      {/* Strategy Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel p-4 md:p-8 border-l-4 border-emerald-500"
      >
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 flex-shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="text-white mb-2 text-lg">Profitability Insight</h3>
            <p className="text-xs md:text-body text-brand-text-muted leading-relaxed max-w-3xl">
              Revenue is not connected to a payment provider, so net profit reflects API cost only. 
              Based on current token consumption, the largest cost driver is output token generation in high-narrative sessions. 
              Consider token caching or tiered credit limits for free users to optimize margins once billing is integrated.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
