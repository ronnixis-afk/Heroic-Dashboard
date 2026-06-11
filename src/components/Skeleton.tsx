import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  circle = false,
}) => {
  return (
    <div
      className={cn('shimmer', circle ? 'rounded-full' : 'rounded-md', className)}
      style={{ width, height }}
    />
  );
};

export const SkeletonText: React.FC<{ width?: string | number; className?: string }> = ({
  width = '100%',
  className,
}) => <Skeleton width={width} height={11} className={cn('rounded', className)} />;

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i}>
                  <Skeleton width="60%" height={11} className="opacity-50" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: cols }).map((_, colIndex) => (
                  <td key={colIndex}>
                    <Skeleton width={colIndex === 0 ? '80%' : '60%'} height={11} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC<{ height?: number | string }> = ({ height = 260 }) => {
  return (
    <div className="card p-3.5 flex flex-col gap-3" style={{ height }}>
      <div className="flex justify-between items-center">
        <Skeleton width="40%" height={14} />
        <Skeleton width={56} height={28} className="rounded-md" />
      </div>
      <Skeleton width="100%" height={11} className="opacity-30" />
      <div className="flex-1 flex flex-col gap-2 mt-2">
        <Skeleton width="100%" height={28} />
        <Skeleton width="100%" height={28} />
        <Skeleton width="100%" height={28} />
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC<{ height?: number | string }> = ({ height = 260 }) => {
  return (
    <div className="card p-3.5 flex flex-col gap-3" style={{ height }}>
      <div className="flex justify-between items-center">
        <div className="space-y-1.5 flex-1">
          <Skeleton width="30%" height={14} />
          <Skeleton width="50%" height={11} className="opacity-50" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton width={48} height={24} className="rounded-md" />
          <Skeleton width={48} height={24} className="rounded-md" />
        </div>
      </div>
      <div className="flex-1 w-full relative flex items-end gap-1.5 px-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="flex-1 opacity-20" height={`${Math.random() * 60 + 20}%`} />
        ))}
      </div>
    </div>
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="page">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-2">
          <ChartSkeleton height={300} />
        </div>
        <div className="lg:col-span-2">
          <CardSkeleton height={300} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <CardSkeleton height={260} />
        <CardSkeleton height={260} />
        <CardSkeleton height={260} />
      </div>
    </div>
  );
};
