import React from 'react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface UserAcquisitionProps {
  acquisitionData: any[];
  isLoading?: boolean;
}

export default function UserAcquisition({
  acquisitionData,
  isLoading = false,
}: UserAcquisitionProps) {
  const getTierColor = (name: string) => {
    const tier = name.toLowerCase();
    if (tier.includes('super')) return '#38bdf8';
    if (tier.includes('hero')) return '#3ecf8e';
    if (tier.includes('adventurer')) return '#20cce0';
    return '#ff5a36';
  };

  return (
    <div className="card p-3.5 h-[260px] flex flex-col">
      <div className="card-header mb-2">
        <h3 className="card-title">Active Accounts by Tier</h3>
      </div>

      <div className="h-24 w-full relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-end gap-1 px-1 pb-4 opacity-20 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="shimmer flex-1 rounded-t-sm"
                style={{ height: `${Math.random() * 80 + 10}%` }}
              />
            ))}
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={isLoading ? [] : acquisitionData} barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292a32" vertical={false} horizontal={false} />
            <XAxis
              dataKey="name"
              stroke="#8b8c94"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={6}
            />
            <Tooltip
              cursor={{ fill: '#292a32', opacity: 0.1 }}
              contentStyle={{
                backgroundColor: '#1a1b20',
                border: '1px solid #292a32',
                borderRadius: '8px',
                fontSize: '11px',
              }}
              itemStyle={{ fontSize: '11px', fontWeight: 600, color: '#ffffff' }}
              labelStyle={{ color: '#8b8c94', marginBottom: '2px', fontSize: '10px' }}
              formatter={(value: any) => [value, 'Total Users']}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {acquisitionData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={getTierColor(entry.name)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 space-y-1.5 overflow-y-auto">
        {acquisitionData.map((tier) => (
          <div key={tier.name} className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 font-medium">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: getTierColor(tier.name) }}
              />
              {tier.name}
            </div>
            <span className="font-medium text-brand-text-muted">{tier.count}</span>
          </div>
        ))}
        {acquisitionData.length === 0 && !isLoading && (
          <div className="text-center text-xs text-brand-text-muted">No Active Tiers Found</div>
        )}
      </div>
    </div>
  );
}
