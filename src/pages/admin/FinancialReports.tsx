import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, PieChart } from 'lucide-react';
import RevenueOverview from '../../components/dashboard/RevenueOverview';
import NetProfitWidget from '../../components/dashboard/NetProfitWidget';
import { CostAnalyticsCard } from '../../components/dashboard/CostAnalyticsCard';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { PageHeader } from '../../components/ui';

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
    <div className="page pb-6">
      <PageHeader
        title="Financial Reports"
        description="Comprehensive analysis of revenue, costs, and platform profitability."
        actions={
          <span className="badge-success flex items-center gap-1.5">
            <DollarSign size={12} />
            Financial Hub
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-2 flex items-center gap-2">
          <PieChart size={14} className="text-brand-accent" />
          <h3 className="section-title">API Cost Distribution</h3>
        </div>
        <CostAnalyticsCard />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-3.5 border-l-4 border-emerald-500"
      >
        <div className="flex flex-col sm:flex-row items-start gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 flex-shrink-0">
            <TrendingUp size={16} />
          </div>
          <div>
            <h3 className="text-title font-semibold text-white mb-1">Profitability Insight</h3>
            <p className="text-xs text-brand-text-muted leading-relaxed max-w-3xl">
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
