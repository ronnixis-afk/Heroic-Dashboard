import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton, SkeletonText } from '../Skeleton';

interface RecentSignupsProps {
  recentSignups: any[];
  isLoading?: boolean;
}

export default function RecentSignups({ recentSignups, isLoading = false }: RecentSignupsProps) {
  const navigate = useNavigate();

  return (
    <div className="glass-panel p-6 h-[340px] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3>Recent Signups</h3>
        <button 
          onClick={() => navigate('/admin/users')}
          className="btn-primary px-4 py-1.5 text-xs"
        >
          View All
        </button>
      </div>
      
      <div className="pr-1">
        <div className="grid grid-cols-[1fr_96px_80px] items-center text-xs font-bold text-brand-text-muted mb-4 pb-2 border-b border-brand-primary px-2">
          <span className="pr-2">User</span>
          <span className="text-center">Time</span>
          <span className="text-right">Plan</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {(isLoading ? Array.from({ length: 5 }) : recentSignups).map((signup, i) => (
          <div key={isLoading ? i : signup.id} className="grid grid-cols-[1fr_96px_80px] items-center p-2 rounded-xl hover:bg-brand-primary transition-colors group">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#292a32] shrink-0">
                {isLoading ? (
                  <Skeleton width="100%" height="100%" circle />
                ) : (
                  <img src={signup.icon} alt={signup.user} className="w-full h-full object-cover" />
                )}
              </div>
              {isLoading ? (
                <SkeletonText width={100} className="h-3" />
              ) : (
                <span className="text-body font-medium text-brand-text truncate" title={signup.user}>{signup.user}</span>
              )}
            </div>
            {isLoading ? (
              <SkeletonText width={60} className="h-3 mx-auto" />
            ) : (
              <span className="text-xs text-brand-text-muted text-center">{signup.date}</span>
            )}
            {isLoading ? (
              <SkeletonText width={50} className="h-3 ml-auto" />
            ) : (
              <span className="text-body font-bold text-white text-right">{signup.plan}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
