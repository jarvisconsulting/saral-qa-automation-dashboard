import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface PlatformDistributionChartProps {
  webCount?: number;
  mobileCount?: number;
  apiCount?: number;
}

const CustomPlatformTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 text-xs animate-fadeIn pointer-events-none">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: item.payload.color }}
          />
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {item.name}:
          </span>
          <span className="font-bold text-blue-600 dark:text-blue-400">
            {item.value} Suites
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const PlatformDistributionChart: React.FC<PlatformDistributionChartProps> = ({
  webCount = 6,
  mobileCount = 2,
  apiCount = 1,
}) => {
  const data = [
    { name: 'Web Automation', value: webCount, color: '#3b82f6' },
    { name: 'Mobile (Android/iOS)', value: mobileCount, color: '#8b5cf6' },
    { name: 'API / Load Suites', value: apiCount, color: '#10b981' },
  ];

  return (
    <div className="h-36 flex items-center justify-between">
      <div className="w-1/2 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomPlatformTooltip />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="50%"
              outerRadius="80%"
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-1/2 space-y-1.5 pl-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-[90px]" title={item.name}>
                {item.name}
              </span>
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 shrink-0">
              {item.value} suites
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlatformDistributionChart;
