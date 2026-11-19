import React from 'react';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'purple' | 'green' | 'red' | 'amber' | 'cyan';
  subtext?: string;
  trend?: { value: number; isPositive: boolean };
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-100 dark:border-blue-900/40',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-100 dark:border-purple-900/40',
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100 dark:border-emerald-900/40',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-100 dark:border-red-900/40',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-100 dark:border-amber-900/40',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-100 dark:border-cyan-900/40',
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color = 'blue',
  subtext,
  trend,
}) => {
  const styles = colorMap[color];

  return (
    <div className="card p-5 card-hover">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={clsx('p-2.5 rounded-xl border', styles.bg, styles.text, styles.border)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </span>
        {trend && (
          <span
            className={clsx(
              'text-xs font-semibold flex items-center',
              trend.isPositive ? 'text-emerald-600' : 'text-red-600'
            )}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {subtext && (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 font-medium">{subtext}</p>
      )}
    </div>
  );
};
