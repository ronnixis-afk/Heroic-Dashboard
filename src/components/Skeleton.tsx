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
  circle = false 
}) => {
  return (
    <div 
      className={cn(
        "shimmer", 
        circle ? "rounded-full" : "rounded-xl",
        className
      )}
      style={{ width, height }}
    />
  );
};

export const SkeletonText: React.FC<{ width?: string | number; className?: string }> = ({ width = "100%", className }) => (
  <Skeleton width={width} height={16} className={cn("rounded-md", className)} />
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 5 
}) => {
  return (
    <div className="glass-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i}>
                  <Skeleton width="60%" height={12} className="opacity-50" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: cols }).map((_, colIndex) => (
                  <td key={colIndex}>
                    <Skeleton width={colIndex === 0 ? "80%" : "60%"} height={14} />
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

export const CardSkeleton: React.FC<{ height?: number | string }> = ({ height = 300 }) => {
  return (
    <div className="glass-panel p-6 flex flex-col gap-4" style={{ height }}>
      <div className="flex justify-between items-center mb-2">
        <Skeleton width="40%" height={24} />
        <Skeleton width={80} height={32} className="rounded-full" />
      </div>
      <Skeleton width="100%" height={20} className="opacity-30" />
      <div className="flex-1 flex flex-col gap-3 mt-4">
        <Skeleton width="100%" height={40} className="rounded-xl" />
        <Skeleton width="100%" height={40} className="rounded-xl" />
        <Skeleton width="100%" height={40} className="rounded-xl" />
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC<{ height?: number | string }> = ({ height = 300 }) => {
  return (
    <div className="glass-panel p-6 flex flex-col gap-6" style={{ height }}>
      <div className="flex justify-between items-center">
        <div className="space-y-2 flex-1">
          <Skeleton width="30%" height={24} />
          <Skeleton width="50%" height={14} className="opacity-50" />
        </div>
        <div className="flex gap-2">
          <Skeleton width={60} height={24} className="rounded-lg" />
          <Skeleton width={60} height={24} className="rounded-lg" />
        </div>
      </div>
      <div className="flex-1 w-full relative flex items-end gap-2 px-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 opacity-20" 
            height={`${Math.random() * 60 + 20}%`} 
          />
        ))}
      </div>
    </div>
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 text-white pb-8">
      {/* Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <ChartSkeleton height={350} />
        </div>
        <CardSkeleton height={350} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CardSkeleton height={340} />
        <CardSkeleton height={340} />
        <CardSkeleton height={340} />
      </div>
    </div>
  );
};
