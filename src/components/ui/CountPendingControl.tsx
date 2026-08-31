import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CountPendingControlProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Skeleton overlay that blocks a count-backed control until library totals are ready. */
export default function CountPendingControl({
  loading,
  children,
  className,
}: CountPendingControlProps) {
  return (
    <div className={cn('relative min-w-0', className)} aria-busy={loading || undefined}>
      <div
        className={loading ? 'pointer-events-none' : undefined}
        aria-hidden={loading || undefined}
        {...(loading ? { inert: true } : {})}
      >
        {children}
      </div>
      {loading && (
        <div
          className="absolute inset-0 z-10 flex min-h-8 items-center gap-2 overflow-hidden rounded-md border border-brand-primary bg-brand-bg px-3"
          aria-hidden="true"
        >
          <span className="skeleton-box h-2.5 w-[46%] max-w-[10rem]" />
          <Loader2
            size={12}
            className="ml-auto shrink-0 animate-spin text-brand-accent"
          />
        </div>
      )}
    </div>
  );
}
