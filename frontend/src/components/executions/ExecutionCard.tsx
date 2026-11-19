import React from 'react';
import { ExternalLink, Clock, GitBranch, Terminal, ShieldAlert } from 'lucide-react';
import { Execution } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';

interface ExecutionCardProps {
  execution: Execution;
  onSelect?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export const ExecutionCard: React.FC<ExecutionCardProps> = ({
  execution,
  onSelect,
  onCancel,
}) => {
  const isRunning = execution.status === 'RUNNING' || execution.status === 'QUEUED';

  return (
    <div
      onClick={() => onSelect?.(execution.id)}
      className="card p-5 card-hover cursor-pointer border-slate-200 dark:border-slate-800 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                #{execution.jenkinsBuildNumber || execution.id.slice(-6)}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                STAGING
              </span>
            </div>
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white mt-1">
              {execution.module?.displayName || execution.module?.name}
            </h4>
          </div>
          <StatusBadge status={execution.status} />
        </div>

        {execution.testCommand && (
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800/60 p-2 rounded-lg mb-3 truncate">
            <Terminal className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">{execution.testCommand}</span>
          </div>
        )}

        {/* Progress bar */}
        <div className="my-3">
          <ProgressBar
            passed={execution.passedTests}
            failed={execution.failedTests}
            skipped={execution.skippedTests}
            total={execution.totalTests}
            showLabels
          />
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          {execution.branch && (
            <span className="flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5" />
              <span>{execution.branch}</span>
            </span>
          )}
          {execution.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{execution.duration}s</span>
            </span>
          )}
        </div>

        {isRunning && onCancel && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel(execution.id);
            }}
            className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded bg-red-50 dark:bg-red-950/40 hover:bg-red-100"
          >
            Abort Run
          </button>
        )}
      </div>
    </div>
  );
};
