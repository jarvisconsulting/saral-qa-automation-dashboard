import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface PassRateGaugeProps {
  rate: number;
  size?: number;
}

export const PassRateGauge: React.FC<PassRateGaugeProps> = ({ rate, size = 160 }) => {
  const safeRate = Math.min(100, Math.max(0, rate));
  const data = [
    { name: 'Passed', value: safeRate },
    { name: 'Remaining', value: 100 - safeRate },
  ];

  const getColor = (r: number) => {
    if (r >= 90) return '#10b981'; // green
    if (r >= 75) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const primaryColor = getColor(safeRate);

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius="70%"
            outerRadius="90%"
            paddingAngle={0}
            dataKey="value"
          >
            <Cell fill={primaryColor} />
            <Cell fill="#e2e8f0" className="dark:fill-slate-800" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {safeRate}%
        </span>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Pass Rate
        </span>
      </div>
    </div>
  );
};
