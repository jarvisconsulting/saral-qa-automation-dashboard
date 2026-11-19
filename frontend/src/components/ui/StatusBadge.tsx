import React from 'react';
import clsx from 'clsx';
import { ExecutionStatus } from '../../types';

interface StatusBadgeProps {
  status: ExecutionStatus | string;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<string, { label: string; class: string; dot: string }> = {
  PASSED: {
    label: 'Passed',
    class: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40',
    dot: 'bg-emerald-500',
  },
  FAILED: {
    label: 'Failed',
    class: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/40',
    dot: 'bg-red-500',
  },
  RUNNING: {
    label: 'Running',
    class: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
    dot: 'bg-blue-500',
  },
  QUEUED: {
    label: 'Queued',
    class: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40',
    dot: 'bg-amber-500',
  },
  PENDING: {
    label: 'Pending',
    class: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    class: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    dot: 'bg-slate-500',
  },
  UNKNOWN: {
    label: 'Unknown',
    class: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, showIcon = true }) => {
  const normalized = (status || 'UNKNOWN').toUpperCase();
  const cfg = statusConfig[normalized] || statusConfig.UNKNOWN;
  const isLive = normalized === 'RUNNING' || normalized === 'QUEUED';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border tracking-wide',
        cfg.class,
        isLive && 'animate-pulse shadow-sm shadow-blue-500/20',
        className
      )}
    >
      {showIcon && (
        <span className="relative flex h-2 w-2">
          {isLive && (
            <span
              className={clsx(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                cfg.dot
              )}
            />
          )}
          <span className={clsx('relative inline-flex rounded-full h-2 w-2', cfg.dot)} />
        </span>
      )}
      <span>{cfg.label}</span>
    </span>
  );
};

export default StatusBadge;
