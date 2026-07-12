import React from 'react';
import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export default function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={cn('empty-state', compact && 'empty-state-compact', className)}>
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={16} />
        </div>
      )}
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
