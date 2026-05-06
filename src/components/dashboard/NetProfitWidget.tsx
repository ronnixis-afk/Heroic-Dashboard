import React from 'react';
import { DollarSign, TrendingUp, Activity } from 'lucide-react';

interface NetProfitWidgetProps {
  netProfit: number;
  profitMargin: number;
}

export default function NetProfitWidget({ netProfit, profitMargin }: NetProfitWidgetProps) {
  return (
    <div className="glass-panel col-span-1 lg:col-span-2 p-6 relative h-[380px] flex flex-col justify-between w-full">
      <div>
        <h3 className="text-xl font-bold mb-2">Profitability</h3>
        <p className="text-xs text-[#8b8c94]">Current Billing Period</p>
      </div>
      
      <div className="flex-1 flex flex-col lg:flex-row justify-center items-center gap-6 mt-4">
        <div className="bg-[#141416] rounded-3xl border border-[#292a32] p-5 relative overflow-hidden group flex-1 w-full h-full flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={48} className="text-emerald-500" />
          </div>
          <label className="text-xs text-[#8b8c94] font-medium mb-2 block">Net Profit</label>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">
              ${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1">
            <TrendingUp size={12} />
            Healthy Profitability
          </p>
        </div>

        <div className="bg-[#141416] rounded-3xl border border-[#292a32] p-5 relative overflow-hidden group flex-1 w-full h-full flex flex-col justify-center">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={48} className="text-brand-accent" />
          </div>
          <label className="text-xs text-[#8b8c94] font-medium mb-2 block">Gross Margin</label>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-brand-accent">
              {profitMargin.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-[#1d1e24] rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-brand-accent h-1.5 rounded-full" 
              style={{ width: `${Math.min(profitMargin, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
