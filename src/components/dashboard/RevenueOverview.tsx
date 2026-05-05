import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueOverviewProps {
  totalRevenue: number;
  revenueData: any[];
}

export default function RevenueOverview({ totalRevenue, revenueData }: RevenueOverviewProps) {
  const [revenueFilter, setRevenueFilter] = useState('Month');

  return (
    <div className="glass-panel col-span-1 lg:col-span-2 p-6 flex flex-col relative w-full h-[380px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">Revenue & API Costs</h3>
          <p className="gap-2 mt-4">
            <span className="text-3xl font-bold">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-6">
          <div className="flex bg-[#141416] rounded-xl p-1 border border-[#292a32]">
            {['Day', 'Week', 'Month'].map(filter => (
              <button 
                key={filter}
                onClick={() => setRevenueFilter(filter)}
                className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${revenueFilter === filter ? 'bg-white text-black' : 'text-[#8b8c94] hover:text-white'}`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-[#8b8c94]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
              Revenue
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5a36]"></span>
              API Costs
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00b2ff" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#00b2ff" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff5a36" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#ff5a36" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#292a32" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#8b8c94" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#8b8c94" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => `${value >= 1000 ? value/1000 + 'k' : value}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '12px' }}
              itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#00b2ff" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
            <Area type="monotone" dataKey="apiCost" stroke="#ff5a36" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
