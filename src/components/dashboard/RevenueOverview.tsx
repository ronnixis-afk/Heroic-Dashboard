import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { SkeletonText } from '../Skeleton';
import FilterTabs from '../ui/FilterTabs';

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
  isLoading = false,
}: RevenueOverviewProps) {
  const [revenueFilter, setRevenueFilter] = useState('Month');

  const getChartData = () => {
    switch (revenueFilter) {
      case 'Day':
        return dailyData;
      case 'Week':
        return weeklyData;
      case 'Month':
        return monthlyData;
      case 'Year':
        return yearlyData;
      default:
        return monthlyData;
    }
  };

  const chartData = isLoading ? [] : getChartData();
  const isTimeScale = ['Day', 'Week', 'Month'].includes(revenueFilter);

  return (
    <div className="card p-3.5 flex flex-col w-full h-[300px]">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="card-title text-brand-accent">Revenue & API Costs</h3>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Real-Time Revenue from Stripe Integration
          </p>
          <div className="mt-2">
            {isLoading ? (
              <SkeletonText width={120} className="h-5" />
            ) : (
              <span className="card-metric">
                $
                {totalRevenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <FilterTabs
            options={['Day', 'Week', 'Month', 'Year']}
            value={revenueFilter}
            onChange={setRevenueFilter}
          />
          <div className="flex items-center gap-3 text-xs text-brand-text-muted">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
              Revenue
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5a36]" />
              API Cost
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full mt-1 relative min-h-0">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-end gap-1.5 px-1 pb-6 opacity-20 pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="shimmer flex-1 rounded-t"
                style={{ height: `${Math.random() * 60 + 20}%` }}
              />
            ))}
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#20cce0" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#20cce0" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff5a36" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ff5a36" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#292a32" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#8b8c94"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={6}
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
              tickFormatter={(value) =>
                `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1b20',
                border: '1px solid #292a32',
                borderRadius: '8px',
                fontSize: '11px',
              }}
              itemStyle={{ fontSize: '11px', fontWeight: 600 }}
              labelFormatter={(label) => {
                if (!isTimeScale) return label;
                const d = new Date(label);
                return isNaN(d.getTime())
                  ? label
                  : d.toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    });
              }}
              formatter={(value: number, name: string) => [
                `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                name === 'apiCost' ? 'API Cost' : 'Revenue',
              ]}
            />

            {isTimeScale &&
              (() => {
                const markers: React.ReactNode[] = [];
                for (let i = 1; i < chartData.length; i++) {
                  const prevDate = new Date(chartData[i - 1].name);
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
                          fill: '#20cce0',
                          fontSize: 10,
                          fontWeight: 600,
                          offset: 8,
                        }}
                      />
                    );
                  }
                }
                return markers;
              })()}

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#20cce0"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#colorIncome)"
              animationDuration={1200}
            />
            <Area
              type="monotone"
              dataKey="apiCost"
              stroke="#ff5a36"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#colorExpense)"
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
