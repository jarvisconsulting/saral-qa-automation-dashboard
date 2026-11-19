import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendDataPoint } from '../../types';

interface ExecutionTrendChartProps {
  data: TrendDataPoint[];
}

const CustomTrendTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 animate-fadeIn pointer-events-none">
        <span className="font-bold text-slate-700 dark:text-slate-200 block border-b border-slate-100 dark:border-slate-700/60 pb-1">
          Date: {label}
        </span>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}:</span>
            </span>
            <span className="font-bold text-slate-900 dark:text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ExecutionTrendChart: React.FC<ExecutionTrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No execution trend data available for Staging
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    displayDate: d.date.slice(5), // MM-DD
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="passedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
          <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
          <Tooltip content={<CustomTrendTooltip />} />
          <Area
            type="monotone"
            dataKey="passed"
            name="Passed Tests"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#passedGradient)"
          />
          <Area
            type="monotone"
            dataKey="failed"
            name="Failed Tests"
            stroke="#ef4444"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#failedGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExecutionTrendChart;
