import React from 'react';
import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  description?: string;
  icon?: LucideIcon;
  accent?: boolean;
  className?: string;
}

export default function StatCard({
  label,
  value,
  description,
  icon: Icon,
  accent = false,
  className,
}: StatCardProps) {
  return (
    <div className={cn('card p-3.5 flex items-center justify-between gap-3', className)}>
      <div className="min-w-0">
        <p className="stat-label">{label}</p>
        {description && <p className="help-text mt-0.5">{description}</p>}
        <div className={cn('card-metric mt-2', accent && 'text-brand-accent')}>{value}</div>
      </div>
      {Icon && (
        <div
          className={cn(
            'w-9 h-9 rounded-md border flex items-center justify-center shrink-0',
            accent
              ? 'bg-brand-accent/10 border-brand-accent/20 text-brand-accent'
              : 'bg-brand-hover border-brand-primary text-brand-text-muted'
          )}
        >
          <Icon size={16} />
        </div>
      )}
    </div>
  );
}
