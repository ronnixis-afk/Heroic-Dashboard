import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import RevenueOverview from '../../components/dashboard/RevenueOverview';
import NetProfitWidget from '../../components/dashboard/NetProfitWidget';
import { CostAnalyticsCard } from '../../components/dashboard/CostAnalyticsCard';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { PageHeader, StatusBanner } from '../../components/ui';

export default function FinancialReports() {
  const {
    loading,
    error,
    totalRevenue,
    dailyData,
    weeklyData,
    monthlyData,
    yearlyData,
    netProfit,
    profitMargin,
  } = useDashboardMetrics();

  const errorMessage =
    error instanceof Error
      ? error.message
      : error
        ? 'Unable To Load Financial Metrics From The RPG API.'
        : null;

  return (
    <div className="page">
      <PageHeader
        title="Financial Reports"
        description="Revenue, API costs, and platform profitability."
      />

      {errorMessage && <StatusBanner type="error" message={errorMessage} />}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <RevenueOverview
            totalRevenue={totalRevenue}
            dailyData={dailyData}
            weeklyData={weeklyData}
            monthlyData={monthlyData}
            yearlyData={yearlyData}
            isLoading={loading}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-2"
        >
          <NetProfitWidget netProfit={netProfit} profitMargin={profitMargin} isLoading={loading} />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <CostAnalyticsCard />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="callout-accent"
      >
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-md bg-brand-accent/10 text-brand-accent shrink-0">
            <TrendingUp size={14} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-brand-text mb-1">Profitability Insight</h3>
            <p className="help-text max-w-3xl">
              Stripe revenue is connected. Net profit accounts for subscriptions and credit purchases
              in real time. Output token generation in high-narrative sessions is typically the
              largest cost driver — monitor token patterns to protect margin.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
