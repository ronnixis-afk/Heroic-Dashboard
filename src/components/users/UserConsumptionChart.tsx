import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useUserUsage } from '../../hooks/useUserUsage';

interface UserConsumptionChartProps {
  userId: string;
}

import { ChartSkeleton } from '../Skeleton';

export default function UserConsumptionChart({ userId }: UserConsumptionChartProps) {
  const [filter, setFilter] = useState('Day');
  const { loading, hourlyData, dailyData, weeklyData, monthlyData, logCount, totalTokens, totalCost } = useUserUsage(userId);
  
  const chartData = useMemo(() => {
    switch (filter) {
      case 'Hour': return hourlyData;
      case 'Day': return dailyData;
      case 'Week': return weeklyData;
      case 'Month': return monthlyData;
      default: return dailyData;
    }
  }, [filter, hourlyData, dailyData, weeklyData, monthlyData]);
  
  const currentTotalCost = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.cost, 0);
  }, [chartData]);

  const currentTotalTokens = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.tokens, 0);
  }, [chartData]);

  if (loading) {
    return <ChartSkeleton height={350} />;
  }

  return (
    <div className="glass-panel p-6 flex flex-col w-full h-[350px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-sm font-bold text-brand-text-muted mb-1">Actual API Cost</h4>
          <div className="flex items-baseline gap-3">
            <p className="text-2xl font-bold text-white">
              ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-brand-text-muted">
              ({currentTotalTokens.toLocaleString()} tokens)
            </p>
          </div>
        </div>
        
        <div className="flex bg-[#141416] rounded-xl p-1 border border-[#292a32]">
          {['Hour', 'Day', 'Week', 'Month'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${filter === f ? 'bg-white text-black shadow-lg' : 'text-[#8b8c94] hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 w-full">
        {chartData.length > 0 && chartData.some(d => d.tokens > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00b2ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00b2ff" stopOpacity={0}/>
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
                interval={filter === 'Hour' ? 5 : filter === 'Day' ? 4 : 0}
              />
              <YAxis 
                stroke="#8b8c94" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}
                labelStyle={{ fontSize: '10px', color: '#8b8c94', marginBottom: '4px' }}
                formatter={(value: number, name: string, props: any) => [
                  `$${value.toFixed(2)} (${props.payload.tokens.toLocaleString()} tokens)`, 
                  'Cost'
                ]}
                cursor={{ stroke: '#00b2ff', strokeWidth: 1 }}
              />
              <Area 
                type="monotone" 
                dataKey="cost" 
                stroke="#00b2ff" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorCost)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-brand-text-muted">
            <p className="text-sm italic">No actual usage data found for this period.</p>
            <div className="flex flex-col items-center mt-2 opacity-50 space-y-1">
              <p className="text-[10px]">Checked window: {filter === 'Hour' ? 'Last 24 Hours' : filter === 'Day' ? 'Last 30 Days' : filter === 'Week' ? 'Last 12 Weeks' : 'Last 12 Months'}</p>
              <p className="text-[10px]">Total user logs found: {logCount}</p>
              <p className="text-[10px]">Total tokens across all time: {totalTokens.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



