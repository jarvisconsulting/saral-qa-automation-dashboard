import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ModuleComparisonChartProps {
  data: Array<{
    moduleName: string;
    passed: number;
    failed: number;
    passRate: number;
  }>;
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 animate-fadeIn pointer-events-none">
        <span className="font-bold text-slate-800 dark:text-slate-100 block border-b border-slate-100 dark:border-slate-700/60 pb-1">
          {label}
        </span>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
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

export const ModuleComparisonChart: React.FC<ModuleComparisonChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-xs text-slate-400">No module comparison data available</div>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
          <XAxis
            dataKey="moduleName"
            stroke="#94a3b8"
            fontSize={10}
            angle={-20}
            textAnchor="end"
            interval={0}
          />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
          <Tooltip content={<CustomBarTooltip />} />
          <Bar dataKey="passed" name="Passed" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ModuleComparisonChart;
