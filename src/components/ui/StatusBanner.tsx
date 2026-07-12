import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export type StatusTone = 'success' | 'error' | 'info';

interface StatusBannerProps {
  type: StatusTone;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

export default function StatusBanner({ type, message, onDismiss, className }: StatusBannerProps) {
  const Icon = ICONS[type];

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          role={type === 'error' ? 'alert' : 'status'}
          className={cn('status-banner', `status-banner-${type}`, className)}
        >
          <Icon size={14} className="shrink-0 mt-0.5" />
          <span className="flex-1">{message}</span>
          {onDismiss && (
            <button type="button" onClick={onDismiss} className="btn-icon h-6 w-6 shrink-0" aria-label="Dismiss">
              <X size={12} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
