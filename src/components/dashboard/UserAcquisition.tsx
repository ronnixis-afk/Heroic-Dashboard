import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { SkeletonText } from '../Skeleton';

interface UserAcquisitionProps {
  acquisitionData: any[];
  isLoading?: boolean;
}

export default function UserAcquisition({ acquisitionData, isLoading = false }: UserAcquisitionProps) {
  const [signupFilter, setSignupFilter] = useState('6 Months');

  const getTierColor = (name: string) => {
    const tier = name.toLowerCase();
    if (tier.includes('super')) return '#6366f1'; // Indigo (Secondary Accent)
    if (tier.includes('hero')) return '#3ecf8e';  // Emerald (Secondary Accent)
    if (tier.includes('adventurer')) return '#20cce0'; // Brand Accent
    return '#ff5a36'; // Orange (Secondary Accent)
  };

  return (
    <div className="glass-panel p-6 h-[340px] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">Active Accounts by Tier</h3>
        <button 
          onClick={() => setSignupFilter(signupFilter === '6 Months' ? '30 Days' : '6 Months')}
          className="flex items-center gap-2 bg-[#141416] border border-[#292a32] px-3 py-1.5 rounded-lg text-xs font-bold text-[#8b8c94] hover:text-white transition-colors"
        >
          {signupFilter} <ChevronDown size={14} />
        </button>
      </div>
      
      <div className="h-32 w-full mt-2 relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-end gap-1 px-1 pb-6 opacity-20 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="shimmer flex-1 rounded-t-sm" style={{ height: `${Math.random() * 80 + 10}%` }} />
            ))}
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={isLoading ? [] : acquisitionData} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292a32" vertical={false} horizontal={false} />
            <XAxis 
              dataKey="name" 
              stroke="#8b8c94" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <Tooltip 
              cursor={{fill: '#292a32', opacity: 0.1}} 
              contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
              itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}
              labelStyle={{ color: '#8b8c94', marginBottom: '4px', fontWeight: 'medium', fontSize: '10px' }}
              formatter={(value: any) => [value, 'Total Users']}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {acquisitionData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={getTierColor(entry.name)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
        {acquisitionData.map((tier) => (
          <div key={tier.name} className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2 text-white font-medium">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getTierColor(tier.name) }}></span> 
              {tier.name}
            </div>
            <span className="font-bold text-brand-text-muted">{tier.count}</span>
          </div>
        ))}
        {acquisitionData.length === 0 && !isLoading && (
          <div className="text-center text-[10px] text-brand-text-muted italic">No active tiers found</div>
        )}
      </div>
    </div>
  );
}
