import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useUserUsage } from '../../hooks/useUserUsage';
import { FilterTabs } from '../ui';

interface UserConsumptionChartProps {
  userId: string;
}

import { ChartSkeleton } from '../Skeleton';

export default function UserConsumptionChart({ userId }: UserConsumptionChartProps) {
  const [filter, setFilter] = useState('Day');
  const { loading, dailyData, weeklyData, monthlyData, logCount, totalTokens, totalCost } = useUserUsage(userId);
  
  const chartData = useMemo(() => {
    switch (filter) {
      case 'Day': return dailyData;
      case 'Week': return weeklyData;
      case 'Month': return monthlyData;
      default: return dailyData;
    }
  }, [filter, dailyData, weeklyData, monthlyData]);
  
  const currentTotalCost = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.cost, 0);
  }, [chartData]);

  const currentTotalTokens = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.tokens, 0);
  }, [chartData]);

  if (loading) {
    return <ChartSkeleton height={280} />;
  }

  return (
    <div className="card p-3.5 flex flex-col w-full h-[280px]">
      <div className="card-header mb-2">
        <div>
          <h4 className="card-title">Actual API Cost</h4>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="card-metric">
              ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-brand-text-muted">
              ({currentTotalTokens.toLocaleString()} tokens)
            </p>
          </div>
        </div>
        
        <FilterTabs
          options={['Day', 'Week', 'Month']}
          value={filter}
          onChange={setFilter}
        />
      </div>
      
      <div className="flex-1 w-full">
        {chartData.length > 0 && chartData.some(d => d.tokens > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#20cce0" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#20cce0" stopOpacity={0}/>
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
                interval={filter === 'Day' ? 4 : 0}
              />
              <YAxis 
                stroke="#8b8c94" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}
                labelStyle={{ color: '#8b8c94', marginBottom: '4px', fontWeight: 'medium', fontSize: '10px' }}
                formatter={(value: number, name: string, props: any) => [
                  `$${value.toFixed(2)} (${props.payload.tokens.toLocaleString()} Tokens)`, 
                  'Cost'
                ]}
                cursor={{ stroke: '#20cce0', strokeWidth: 1 }}
              />
              <Area 
                type="monotone" 
                dataKey="cost" 
                stroke="#20cce0" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorCost)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-brand-text-muted">
            <p className="text-xs italic">No actual usage data found for this period.</p>
            <div className="flex flex-col items-center mt-2 opacity-50 space-y-1">
              <p className="text-xs">Checked window: {filter === 'Day' ? 'Last 30 Days' : filter === 'Week' ? 'Last 12 Weeks' : 'Last 12 Months'}</p>
              <p className="text-xs">Total user logs found: {logCount}</p>
              <p className="text-xs">Total tokens across all time: {totalTokens.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
