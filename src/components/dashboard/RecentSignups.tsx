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
    <div className="card p-3.5 h-[260px] flex flex-col">
      <div className="card-header mb-2">
        <h3 className="card-title">Recent Signups</h3>
        <button onClick={() => navigate('/admin/users')} className="btn-primary btn-sm">
          View All
        </button>
      </div>

      <div className="grid grid-cols-[1fr_72px_64px] items-center text-xs font-medium text-brand-text-muted mb-2 pb-1.5 border-b border-brand-primary px-1">
        <span>User</span>
        <span className="text-center">Time</span>
        <span className="text-right">Plan</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-0.5">
        {(isLoading ? Array.from({ length: 5 }) : recentSignups).map((signup, i) => (
          <div
            key={isLoading ? i : signup.id}
            className="grid grid-cols-[1fr_72px_64px] items-center py-1.5 px-1 rounded-md hover:bg-brand-hover transition-colors duration-150"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full overflow-hidden border border-brand-primary shrink-0">
                {isLoading ? (
                  <Skeleton width="100%" height="100%" circle />
                ) : (
                  <img
                    src={signup.icon}
                    alt={signup.user}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              {isLoading ? (
                <SkeletonText width={80} className="h-3" />
              ) : (
                <span className="text-xs font-medium truncate" title={signup.user}>
                  {signup.user}
                </span>
              )}
            </div>
            {isLoading ? (
              <SkeletonText width={48} className="h-3 mx-auto" />
            ) : (
              <span className="text-xs text-brand-text-muted text-center">{signup.date}</span>
            )}
            {isLoading ? (
              <SkeletonText width={40} className="h-3 ml-auto" />
            ) : (
              <span className="text-xs font-medium text-right">{signup.plan}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
