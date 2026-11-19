import React from 'react';

interface ProgressBarProps {
  passed: number;
  failed: number;
  skipped: number;
  total?: number;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  passed,
  failed,
  skipped,
  total: propTotal,
  showLabels = false,
  size = 'md',
}) => {
  const total = propTotal || passed + failed + skipped || 1;
  const passedPct = Math.round((passed / total) * 100);
  const failedPct = Math.round((failed / total) * 100);
  const skippedPct = Math.round((skipped / total) * 100);

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex ${heights[size]}`}>
        {passedPct > 0 && (
          <div
            style={{ width: `${passedPct}%` }}
            className="bg-emerald-500 transition-all duration-300"
            title={`Passed: ${passed} (${passedPct}%)`}
          />
        )}
        {failedPct > 0 && (
          <div
            style={{ width: `${failedPct}%` }}
            className="bg-red-500 transition-all duration-300"
            title={`Failed: ${failed} (${failedPct}%)`}
          />
        )}
        {skippedPct > 0 && (
          <div
            style={{ width: `${skippedPct}%` }}
            className="bg-amber-400 transition-all duration-300"
            title={`Skipped: ${skipped} (${skippedPct}%)`}
          />
        )}
      </div>
      {showLabels && (
        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="text-emerald-600 font-medium">{passed} Passed</span>
          {failed > 0 && <span className="text-red-500 font-medium">{failed} Failed</span>}
          {skipped > 0 && <span className="text-amber-500 font-medium">{skipped} Skipped</span>}
        </div>
      )}
    </div>
  );
};
