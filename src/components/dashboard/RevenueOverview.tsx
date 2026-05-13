import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine 
} from 'recharts';

import { SkeletonText } from '../Skeleton';

interface RevenueOverviewProps {
  totalRevenue: number;
  dailyData: any[];
  weeklyData: any[];
  monthlyData: any[];
  yearlyData: any[];
  isLoading?: boolean;
}

export default function RevenueOverview({ 
  totalRevenue, 
  dailyData, 
  weeklyData, 
  monthlyData, 
  yearlyData,
  isLoading = false
}: RevenueOverviewProps) {
  const [revenueFilter, setRevenueFilter] = useState('Month');

  const getChartData = () => {
    switch (revenueFilter) {
      case 'Day': return dailyData;
      case 'Week': return weeklyData;
      case 'Month': return monthlyData;
      case 'Year': return yearlyData;
      default: return monthlyData;
    }
  };

  const chartData = isLoading ? [] : getChartData();
  const isTimeScale = ['Day', 'Week', 'Month'].includes(revenueFilter);

  return (
    <div className="glass-panel col-span-1 lg:col-span-2 p-6 flex flex-col relative w-full h-[380px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-brand-accent">Revenue & API Costs</h3>
          <div className="mt-4">
            {isLoading ? (
              <SkeletonText width={180} className="h-9" />
            ) : (
              <span className="text-h1 font-bold text-white tracking-tight">
                ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-6">
          <div className="flex bg-[#141416] rounded-xl p-1 border border-[#292a32]">
            {['Day', 'Week', 'Month', 'Year'].map(filter => (
              <button 
                key={filter}
                onClick={() => setRevenueFilter(filter)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${revenueFilter === filter ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-brand-text-muted hover:text-white'}`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">
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
      
      <div className="flex-1 w-full mt-4 relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-end gap-2 px-2 pb-8 opacity-20 pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="shimmer flex-1 rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }} />
            ))}
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00b2ff" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#00b2ff" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff5a36" stopOpacity={0.15}/>
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
              tickFormatter={(val) => {
                if (!isTimeScale) return val;
                const d = new Date(val);
                return isNaN(d.getTime()) ? val : d.getDate().toString();
              }}
            />
            <YAxis 
              stroke="#8b8c94" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => `$${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
              itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
              labelFormatter={(label) => {
                if (!isTimeScale) return label;
                const d = new Date(label);
                return isNaN(d.getTime()) ? label : d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
              }}
              formatter={(value: number, name: string) => [
                `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                name === 'apiCost' ? 'API Cost' : 'Revenue'
              ]}
            />

            {/* Render Month Transitions if on day/week/month scale */}
            {isTimeScale && (() => {
              const markers: React.ReactNode[] = [];
              for (let i = 1; i < chartData.length; i++) {
                const prevDate = new Date(chartData[i-1].name);
                const currDate = new Date(chartData[i].name);
                if (prevDate.getMonth() !== currDate.getMonth()) {
                  const monthName = currDate.toLocaleDateString(undefined, { month: 'long' });
                  const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                  markers.push(
                    <ReferenceLine 
                      key={chartData[i].name}
                      x={chartData[i].name} 
                      stroke="#444" 
                      strokeWidth={1}
                      label={{ 
                        value: formattedMonth, 
                        position: 'top', 
                        fill: '#00b2ff', 
                        fontSize: 10, 
                        fontWeight: 'bold',
                        offset: 10
                      }} 
                    />
                  );
                }
              }
              return markers;
            })()}

            <Area type="monotone" dataKey="revenue" stroke="#00b2ff" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" animationDuration={1500} />
            <Area type="monotone" dataKey="apiCost" stroke="#ff5a36" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" animationDuration={1500} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
