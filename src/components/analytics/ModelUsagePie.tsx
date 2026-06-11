import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Globe } from 'lucide-react';
import { Skeleton, SkeletonText } from '../Skeleton';

interface ModelData {
  name: string;
  value: number;
  color: string;
}

interface ModelUsagePieProps {
  data: ModelData[];
  isLoading?: boolean;
}

export default function ModelUsagePie({ data, isLoading = false }: ModelUsagePieProps) {
  return (
    <div className="card p-3.5">
      <div className="card-header mb-2">
        <h3 className="card-title">Model Usage Distribution</h3>
        <Globe className="text-brand-text-muted" size={14} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-[200px] relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div className="h-32 w-32 rounded-full shimmer opacity-20 border-[16px] border-[#292a32]" />
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={isLoading ? [] : data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={65}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}
                labelStyle={{ color: '#8b8c94', marginBottom: '4px', fontWeight: 'medium', fontSize: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col justify-center space-y-2">
          {(isLoading ? Array.from({ length: 4 }) : data).map((item: any, i: number) => (
            <div key={isLoading ? i : item.name} className="list-item justify-between">
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <Skeleton width={10} height={10} circle />
                ) : (
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                )}
                {isLoading ? (
                  <SkeletonText width={80} className="h-3" />
                ) : (
                  <span className="text-xs font-medium">{item.name}</span>
                )}
              </div>
              {isLoading ? (
                <SkeletonText width={40} className="h-3" />
              ) : (
                <span className="text-xs font-semibold">{item.value}%</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
