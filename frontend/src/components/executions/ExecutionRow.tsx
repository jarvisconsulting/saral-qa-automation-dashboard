import React from 'react';
import { Play, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';
import { Execution } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { formatDistanceToNow } from 'date-fns';

interface ExecutionRowProps {
  execution: Execution;
  onSelect?: (id: string) => void;
}

export const ExecutionRow: React.FC<ExecutionRowProps> = ({ execution, onSelect }) => {
  const timeAgo = execution.createdAt
    ? formatDistanceToNow(new Date(execution.createdAt), { addSuffix: true })
    : 'recently';

  return (
    <tr
      onClick={() => onSelect?.(execution.id)}
      className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors text-xs"
    >
      {/* Build # and Job */}
      <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-blue-600 dark:text-blue-400">
            #{execution.jenkinsBuildNumber || execution.id.slice(-6)}
          </span>
          {execution.jenkinsBuildUrl && (
            <a
              href={execution.jenkinsBuildUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </td>

      {/* Module */}
      <td className="py-3 px-4">
        <div>
          <span className="font-semibold text-slate-900 dark:text-white">
            {execution.module?.displayName || execution.module?.name || 'Automation Suite'}
          </span>
          {execution.testCommand && (
            <p className="text-[11px] font-mono text-slate-400 truncate max-w-[200px]">
              {execution.testCommand}
            </p>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <StatusBadge status={execution.status} />
      </td>

      {/* Environment constraint label */}
      <td className="py-3 px-4">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 uppercase">
          STAGING
        </span>
      </td>

      {/* Tests (P/F/S) */}
      <td className="py-3 px-4 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-emerald-600 font-semibold">{execution.passedTests}P</span>
          <span className="text-red-500 font-semibold">{execution.failedTests}F</span>
          {execution.skippedTests > 0 && (
            <span className="text-amber-500 font-semibold">{execution.skippedTests}S</span>
          )}
        </div>
      </td>

      {/* Duration */}
      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
        {execution.duration ? `${execution.duration}s` : execution.status === 'RUNNING' ? 'In progress...' : '-'}
      </td>

      {/* Trigger & Timestamp */}
      <td className="py-3 px-4 text-slate-400 text-right">
        <div>
          <span>{timeAgo}</span>
          <p className="text-[10px] font-semibold uppercase text-slate-500">{execution.triggerType}</p>
        </div>
      </td>
    </tr>
  );
};
