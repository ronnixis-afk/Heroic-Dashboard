import React from 'react';
import { cn } from '../../lib/utils';

interface PageLoaderProps {
  label?: string;
  className?: string;
}

export default function PageLoader({ label = 'Loading...', className }: PageLoaderProps) {
  return (
    <div className={cn('page-loader', className)} role="status" aria-live="polite">
      <div className="h-6 w-6 rounded-full shimmer opacity-50" />
      <p className="text-xs text-brand-text-muted">{label}</p>
    </div>
  );
}
