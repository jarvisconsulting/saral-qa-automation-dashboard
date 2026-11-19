import React, { useState } from 'react';
import {
  History as HistoryIcon,
  Search,
  Filter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RotateCw,
} from 'lucide-react';
import { useExecutions, useModules, useSyncJenkins } from '../api/hooks';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export const History: React.FC = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [moduleId, setModuleId] = useState<string>('');
  const [triggerType, setTriggerType] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const navigate = useNavigate();
  const { data: modulesData } = useModules();
  const modules = modulesData?.modules || [];
  const syncJenkinsMutation = useSyncJenkins();

  const handleRefresh = async () => {
    try {
      await syncJenkinsMutation.mutateAsync();
    } catch {}
    refetch();
  };

  const { data, isLoading, refetch } = useExecutions({
    page,
    limit: 15,
    status: status || undefined,
    moduleId: moduleId || undefined,
    triggerType: triggerType || undefined,
    search: search || undefined,
  });

  const executions = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Execution History
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete historical audit of all Staging pipeline runs
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={syncJenkinsMutation.isPending}
          className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 self-start sm:self-auto"
          title="Sync with Jenkins & refresh history"
        >
          <RotateCw className={`w-3.5 h-3.5 ${syncJenkinsMutation.isPending ? 'animate-spin text-blue-500' : ''}`} />
          <span>{syncJenkinsMutation.isPending ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search builds, commands..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Module select */}
        <select
          value={moduleId}
          onChange={(e) => {
            setModuleId(e.target.value);
            setPage(1);
          }}
          className="text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="">All Modules</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
            </option>
          ))}
        </select>

        {/* Status select */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="">All Statuses</option>
          <option value="PASSED">Passed</option>
          <option value="FAILED">Failed</option>
          <option value="RUNNING">Running</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {/* Trigger Type select */}
        <select
          value={triggerType}
          onChange={(e) => {
            setTriggerType(e.target.value);
            setPage(1);
          }}
          className="text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="">All Trigger Types</option>
          <option value="MANUAL">Manual</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="WEBHOOK">GitHub Webhook</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 font-semibold">
                <th className="py-3 px-4">Build</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Command</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Environment</th>
                <th className="py-3 px-4">Trigger</th>
                <th className="py-3 px-4">Tests (P/F/S)</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Started At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={10}>
                    <LoadingSpinner text="Loading execution records..." />
                  </td>
                </tr>
              ) : executions.length > 0 ? (
                executions.map((exec) => (
                  <tr
                    key={exec.id}
                    onClick={() => navigate(`/live?id=${exec.id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      #{exec.jenkinsBuildNumber || exec.id.slice(-6)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {exec.module?.displayName || exec.module?.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 max-w-[180px] truncate">
                      {exec.testCommand || 'default'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={exec.status} />
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                        STAGING
                      </span>
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] font-semibold text-slate-500">
                      {exec.triggerType}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="text-emerald-600 font-semibold">{exec.passedTests}P</span>{' '}
                      <span className="text-red-500 font-semibold">{exec.failedTests}F</span>{' '}
                      {exec.skippedTests > 0 && (
                        <span className="text-amber-500 font-semibold">{exec.skippedTests}S</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {exec.duration ? `${exec.duration}s` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {exec.createdAt ? format(new Date(exec.createdAt), 'MMM d, HH:mm') : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {exec.allureReportUrl && (
                        <a
                          href={exec.allureReportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-blue-600 hover:underline font-semibold"
                        >
                          Allure
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-xs text-slate-400 italic">
                    No execution records match the active filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total runs)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="btn-secondary text-xs py-1 px-2.5 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page >= pagination.totalPages}
                className="btn-secondary text-xs py-1 px-2.5 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
