import React from 'react';
import { DollarSign, TrendingUp, Activity } from 'lucide-react';

import { SkeletonText } from '../Skeleton';

interface NetProfitWidgetProps {
  netProfit: number;
  profitMargin: number;
  isLoading?: boolean;
}

export default function NetProfitWidget({ netProfit, profitMargin, isLoading = false }: NetProfitWidgetProps) {
  return (
    <div className="glass-panel col-span-1 lg:col-span-2 p-6 relative h-[380px] flex flex-col justify-between w-full">
      <div>
        <h3 className="mb-2">Profitability</h3>
        <p className="text-small text-brand-text-muted font-medium">Current Billing Period</p>
        <p className="text-[10px] text-brand-text-muted/80 mt-1 max-w-md leading-relaxed">
          Revenue is not connected to a payment provider. Figures reflect API cost only until billing is integrated.
        </p>
      </div>
      
      <div className="flex-1 flex flex-col lg:flex-row justify-center items-center gap-6 mt-4">
        <div className="bg-[#141416] rounded-3xl border border-[#292a32] p-5 relative overflow-hidden group flex-1 w-full h-full flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={48} className="text-emerald-500" />
          </div>
          <label className="text-xs text-brand-text-muted font-medium mb-2 block">
            {netProfit >= 0 ? 'Net Profit' : 'Operating Loss'}
          </label>
          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <SkeletonText width={120} className="h-9" />
            ) : (
              <span className={`text-h1 font-bold ${netProfit >= 0 ? 'text-white' : 'text-red-400'}`}>
                {netProfit < 0 && '-'}${Math.abs(netProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
          <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${netProfit >= 0 ? 'text-emerald-400' : 'text-brand-text-muted'}`}>
            {isLoading ? (
              <SkeletonText width={100} className="h-3" />
            ) : netProfit >= 0 ? (
              <><TrendingUp size={12} /> Healthy Profitability</>
            ) : (
              'Pre-revenue Operating Phase'
            )}
          </p>
        </div>

        <div className="bg-[#141416] rounded-3xl border border-[#292a32] p-5 relative overflow-hidden group flex-1 w-full h-full flex flex-col justify-center">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={48} className="text-brand-accent" />
          </div>
          <label className="text-xs text-brand-text-muted font-medium mb-2 block">Gross Margin</label>
          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <SkeletonText width={80} className="h-9" />
            ) : (
              <span className="text-h1 font-bold text-brand-accent">
                {profitMargin.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="w-full bg-[#1d1e24] rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className={`h-1.5 rounded-full ${isLoading ? 'shimmer w-full opacity-50' : 'bg-brand-accent'}`}
              style={{ width: isLoading ? undefined : `${Math.min(profitMargin, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
