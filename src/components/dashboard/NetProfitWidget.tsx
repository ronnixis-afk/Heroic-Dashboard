import React from 'react';
import { DollarSign, TrendingUp, Activity } from 'lucide-react';
import { SkeletonText } from '../Skeleton';

interface NetProfitWidgetProps {
  netProfit: number;
  profitMargin: number;
  isLoading?: boolean;
}

export default function NetProfitWidget({
  netProfit,
  profitMargin,
  isLoading = false,
}: NetProfitWidgetProps) {
  return (
    <div className="card p-3.5 h-[300px] flex flex-col justify-between w-full">
      <div>
        <h3 className="card-title">Profitability</h3>
        <p className="text-xs text-brand-text-muted mt-0.5">Current Billing Period</p>
        <p className="text-xs text-brand-text-muted/80 mt-1 max-w-md leading-relaxed">
          Real-Time Profitability Performance Aggregated Across Stripe Sales and API Costs.
        </p>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row justify-center items-stretch gap-2 mt-2">
        <div className="bg-brand-bg rounded-md border border-brand-primary p-3 relative overflow-hidden group flex-1 flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <DollarSign size={28} className="text-emerald-500" />
          </div>
          <label className="text-xs text-brand-text-muted font-medium mb-1 block">
            {netProfit >= 0 ? 'Net Profit' : 'Operating Loss'}
          </label>
          {isLoading ? (
            <SkeletonText width={100} className="h-5" />
          ) : (
            <span
              className={`card-metric ${netProfit >= 0 ? 'text-brand-text' : 'text-red-400'}`}
            >
              {netProfit < 0 && '-'}$
              {Math.abs(netProfit).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          )}
          <p
            className={`text-xs mt-1 flex items-center gap-1 ${netProfit >= 0 ? 'text-emerald-400' : 'text-brand-text-muted'}`}
          >
            {isLoading ? (
              <SkeletonText width={80} className="h-3" />
            ) : netProfit >= 0 ? (
              <>
                <TrendingUp size={11} /> Healthy Profitability
              </>
            ) : (
              'Negative Operating Margin'
            )}
          </p>
        </div>

        <div className="bg-brand-bg rounded-md border border-brand-primary p-3 relative overflow-hidden group flex-1 flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Activity size={28} className="text-brand-accent" />
          </div>
          <label className="text-xs text-brand-text-muted font-medium mb-1 block">
            Gross Margin
          </label>
          {isLoading ? (
            <SkeletonText width={60} className="h-5" />
          ) : (
            <span className="card-metric text-brand-accent">{profitMargin.toFixed(1)}%</span>
          )}
          <div className="w-full bg-brand-surface rounded-full h-1 mt-2 overflow-hidden">
            <div
              className={`h-1 rounded-full ${isLoading ? 'shimmer w-full opacity-50' : 'bg-brand-accent'}`}
              style={{ width: isLoading ? undefined : `${Math.min(profitMargin, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
