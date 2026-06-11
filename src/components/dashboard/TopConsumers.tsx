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
    <div className="card p-3.5 h-[260px] flex flex-col">
      <div className="card-header mb-2">
        <h3 className="card-title">Top Consumers</h3>
        <button onClick={() => navigate('/admin/analytics')} className="btn-primary btn-sm">
          View All
        </button>
      </div>

      <div className="grid grid-cols-[1fr_64px] items-center text-xs font-medium text-brand-text-muted mb-2 pb-1.5 border-b border-brand-primary px-1">
        <span>Customer</span>
        <span className="text-right">Spend</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-0.5">
        {(isLoading ? Array.from({ length: 5 }) : topConsumers).map((tx, idx) => (
          <div key={isLoading ? idx : tx.id} className="grid grid-cols-[1fr_64px] items-center list-item px-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full overflow-hidden border border-brand-primary shrink-0">
                {isLoading ? (
                  <Skeleton width="100%" height="100%" circle />
                ) : (
                  <img src={tx.icon} alt={tx.user} className="w-full h-full object-cover" />
                )}
              </div>
              {isLoading ? (
                <SkeletonText width={80} className="h-3" />
              ) : (
                <span className="text-xs font-medium truncate" title={tx.user}>
                  {tx.user}
                </span>
              )}
            </div>
            {isLoading ? (
              <SkeletonText width={40} className="h-3 ml-auto" />
            ) : (
              <span className="text-xs font-semibold text-emerald-400 text-right">
                ${tx.cost.toFixed(2)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
