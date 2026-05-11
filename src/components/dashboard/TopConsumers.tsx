import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton, SkeletonText } from '../Skeleton';

interface TopConsumersProps {
  topConsumers: any[];
  isLoading?: boolean;
}

export default function TopConsumers({ topConsumers, isLoading = false }: TopConsumersProps) {
  const navigate = useNavigate();

  return (
    <div className="glass-panel p-6 h-[340px] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3>Top Consumers</h3>
        <button 
          onClick={() => navigate('/admin/analytics')}
          className="btn-primary px-4 py-1.5 text-xs"
        >
          View All
        </button>
      </div>
      
      <div className="pr-1">
        <div className="grid grid-cols-[1fr_80px] items-center text-xs font-bold text-brand-text-muted mb-4 pb-2 border-b border-brand-primary px-2">
          <span className="pr-2">Customer</span>
          <span className="text-right">Spend</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {(isLoading ? Array.from({ length: 5 }) : topConsumers).map((tx, idx) => (
          <div key={isLoading ? idx : tx.id} className={`grid grid-cols-[1fr_80px] items-center p-2 rounded-xl transition-colors ${idx === 1 && !isLoading ? 'bg-brand-primary' : 'hover:bg-brand-primary'}`}>
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#292a32] shrink-0">
                {isLoading ? (
                  <Skeleton width="100%" height="100%" circle />
                ) : (
                  <img src={tx.icon} alt={tx.user} className="w-full h-full object-cover" />
                )}
              </div>
              {isLoading ? (
                <SkeletonText width={100} className="h-3" />
              ) : (
                <span className="text-body font-medium text-brand-text truncate" title={tx.user}>{tx.user}</span>
              )}
            </div>
            {isLoading ? (
              <SkeletonText width={50} className="h-3 ml-auto" />
            ) : (
              <span className="text-body font-bold text-emerald-400 text-right">${tx.cost.toFixed(2)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
