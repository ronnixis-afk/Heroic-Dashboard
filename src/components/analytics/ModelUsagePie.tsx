import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Globe } from 'lucide-react';

interface ModelData {
  name: string;
  value: number;
  color: string;
}

import { Skeleton, SkeletonText } from '../Skeleton';

interface ModelUsagePieProps {
  data: ModelData[];
  isLoading?: boolean;
}

export default function ModelUsagePie({ data, isLoading = false }: ModelUsagePieProps) {
  return (
    <div className="glass-panel p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-medium">Model Usage Distribution</h3>
        <Globe className="text-brand-text-muted" size={20} />
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="h-[250px] relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div className="h-40 w-40 rounded-full shimmer opacity-20 border-[20px] border-[#292a32]" />
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={isLoading ? [] : data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col justify-center space-y-4">
          {(isLoading ? Array.from({ length: 4 }) : data).map((item: any, i: number) => (
            <div key={isLoading ? i : item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <Skeleton width={12} height={12} circle />
                ) : (
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                )}
                {isLoading ? (
                  <SkeletonText width={80} className="h-3" />
                ) : (
                  <span className="text-sm font-medium">{item.name}</span>
                )}
              </div>
              {isLoading ? (
                <SkeletonText width={40} className="h-3" />
              ) : (
                <span className="text-sm font-bold">{item.value}%</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
