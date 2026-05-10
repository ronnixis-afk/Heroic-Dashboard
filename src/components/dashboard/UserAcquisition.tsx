import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { SkeletonText } from '../Skeleton';

interface UserAcquisitionProps {
  acquisitionData: any[];
  isLoading?: boolean;
}

export default function UserAcquisition({ acquisitionData, isLoading = false }: UserAcquisitionProps) {
  const [signupFilter, setSignupFilter] = useState('6 Months');

  return (
    <div className="glass-panel p-6 h-[340px] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">New Signups</h3>
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
          <BarChart data={isLoading ? [] : acquisitionData} barSize={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292a32" vertical={false} horizontal={false} />
            <XAxis 
              dataKey="name" 
              stroke="#8b8c94" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <Tooltip cursor={{fill: '#292a32', opacity: 0.2}} contentStyle={{ backgroundColor: '#1d1e24', border: 'none', borderRadius: '8px' }} />
            <Bar dataKey="organic" fill="#00b2ff" radius={[4, 4, 0, 0]} />
            <Bar dataKey="referral" fill="#3ecf8e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="paid" fill="#ff5a36" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-auto space-y-3">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 text-[#8b8c94] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span> Organic  <span className="text-[#292a32] mx-1">|</span> (50%)
          </div>
          {isLoading ? (
            <SkeletonText width={40} className="h-4" />
          ) : (
            <span className="font-bold text-white">{acquisitionData.find(d => d.name === 'Organic')?.organic || 0}</span>
          )}
        </div>
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 text-[#8b8c94] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Referral  <span className="text-[#292a32] mx-1">|</span> (30%)
          </div>
          {isLoading ? (
            <SkeletonText width={40} className="h-4" />
          ) : (
            <span className="font-bold text-white">{acquisitionData.find(d => d.name === 'Referral')?.referral || 0}</span>
          )}
        </div>
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 text-[#8b8c94] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff5a36]"></span> Paid Ads  <span className="text-[#292a32] mx-1">|</span> (20%)
          </div>
          {isLoading ? (
            <SkeletonText width={40} className="h-4" />
          ) : (
            <span className="font-bold text-white">{acquisitionData.find(d => d.name === 'Paid')?.paid || 0}</span>
          )}
        </div>
      </div>
    </div>
  );
}
