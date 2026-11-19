import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  Terminal,
  Clock,
  GitBranch,
  ExternalLink,
  StopCircle,
  Play,
  RotateCw,
  Lock,
} from 'lucide-react';
import { useExecutions, useExecution, useExecutionLogs, useCancelExecution, useSyncJenkins } from '../api/hooks';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { LiveLogViewer } from '../components/executions/LiveLogViewer';
import { TestCaseList } from '../components/executions/TestCaseList';
import { TriggerModal } from '../components/executions/TriggerModal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuthStore } from '../stores/authStore';

export const LiveExecutions: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || (user?.role as string) === 'QA_LEAD';
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedIdFromUrl = searchParams.get('id');

  const { data: runsData, refetch } = useExecutions({ limit: 15 });
  const executions = runsData?.data || [];

  const activeRuns = executions.filter(
    (e) => e.status === 'RUNNING' || e.status === 'QUEUED' || e.status === 'PENDING'
  );

  const [selectedId, setSelectedId] = useState<string>(
    selectedIdFromUrl || activeRuns[0]?.id || executions[0]?.id || ''
  );
  const [isTriggerOpen, setIsTriggerOpen] = useState(false);

  const effectiveId = selectedIdFromUrl || selectedId || executions[0]?.id;
  const { data: execData, isLoading } = useExecution(effectiveId);
  const { data: logData } = useExecutionLogs(effectiveId);
  const cancelMutation = useCancelExecution();
  const syncJenkinsMutation = useSyncJenkins();

  const handleRefresh = async () => {
    try {
      await syncJenkinsMutation.mutateAsync();
    } catch {}
    refetch();
  };

  const currentExecution = execData?.execution;
  const isRunning =
    currentExecution?.status === 'RUNNING' || currentExecution?.status === 'QUEUED';

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setSearchParams({ id });
  };

  const handleCancel = async () => {
    if (!currentExecution) return;
    if (window.confirm('Are you sure you want to abort this Jenkins build?')) {
      await cancelMutation.mutateAsync(currentExecution.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Live Execution Monitor
            </h2>
            {activeRuns.length > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 border border-blue-200 dark:border-blue-800">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                {activeRuns.length} Active Run{activeRuns.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time pipeline monitoring & live console stream from Jenkins Linux VM
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={syncJenkinsMutation.isPending}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            title="Sync with Jenkins & refresh status"
          >
            <RotateCw className={`w-3.5 h-3.5 ${syncJenkinsMutation.isPending ? 'animate-spin text-blue-500' : ''}`} />
            <span>{syncJenkinsMutation.isPending ? 'Syncing...' : 'Refresh'}</span>
          </button>
          {isAdmin ? (
            <button
              onClick={() => setIsTriggerOpen(true)}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>New Execution</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-medium cursor-not-allowed border border-slate-200 dark:border-slate-700"
              title="Read-Only users cannot trigger executions"
            >
              <Lock className="w-3 h-3" />
              <span>Read-Only</span>
            </div>
          )}
        </div>
      </div>

      {/* Concurrent Executions Selector Strip */}
      <div className="card p-3 overflow-x-auto flex items-center gap-2.5">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
          Select Run:
        </span>
        {executions.map((exec) => {
          const isSelected = exec.id === effectiveId;
          const isExecRunning = exec.status === 'RUNNING';
          return (
            <button
              key={exec.id}
              onClick={() => handleSelect(exec.id)}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all shrink-0 ${
                isSelected
                  ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-500 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isExecRunning && <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />}
                <span className="font-mono font-bold">
                  #{exec.jenkinsBuildNumber || exec.id.slice(-6)}
                </span>
              </div>
              <span className="truncate max-w-[120px]">
                {exec.module?.displayName || exec.module?.name}
              </span>
              <StatusBadge status={exec.status} showIcon={false} className="py-0 px-1.5 text-[10px]" />
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <LoadingSpinner text="Connecting to execution stream..." />
      ) : currentExecution ? (
        <div className="space-y-6">
          {/* Current Execution Banner Card */}
          <div className="card p-6 border-slate-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                    Jenkins Build #{currentExecution.jenkinsBuildNumber || 'Queued'}
                  </span>
                  <StatusBadge status={currentExecution.status} />
                  {isRunning && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 animate-pulse">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                      </span>
                      <span>Live Active Run</span>
                    </span>
                  )}
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    STAGING ONLY
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {currentExecution.module?.displayName}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2 font-mono">
                  {currentExecution.testCommand && (
                    <span className="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {currentExecution.testCommand}
                    </span>
                  )}
                  {currentExecution.branch && (
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3.5 h-3.5" />
                      {currentExecution.branch}
                    </span>
                  )}
                  {currentExecution.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {currentExecution.duration}s
                    </span>
                  )}
                  {currentExecution.jenkinsBuildUrl && (
                    <a
                      href={currentExecution.jenkinsBuildUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>Jenkins Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {currentExecution.allureReportUrl && (
                    <a
                      href={currentExecution.allureReportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>Allure Report</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {isRunning && isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={cancelMutation.isPending}
                    className="btn-danger text-xs py-2 px-3.5 flex items-center gap-2"
                  >
                    <StopCircle className="w-4 h-4" />
                    <span>{cancelMutation.isPending ? 'Aborting...' : 'Abort Build'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Test Progress */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Execution Progress
                </span>
                <span className="font-mono font-medium text-slate-500">
                  {currentExecution.passedTests} Passed • {currentExecution.failedTests} Failed •{' '}
                  {currentExecution.skippedTests} Skipped / {currentExecution.totalTests || '—'} Total
                </span>
              </div>
              <ProgressBar
                passed={currentExecution.passedTests}
                failed={currentExecution.failedTests}
                skipped={currentExecution.skippedTests}
                total={currentExecution.totalTests}
                size="lg"
              />
            </div>
          </div>

          {/* Real-time Logs Console */}
          <LiveLogViewer
            logs={logData?.logs || ''}
            isRunning={isRunning}
            title={`Console Output: ${currentExecution.jenkinsJobName || 'Pipeline'} #${
              currentExecution.jenkinsBuildNumber || 'Live'
            }`}
          />

          {/* Executed Test Cases Breakdown */}
          {currentExecution.testResults && currentExecution.testResults.length > 0 && (
            <TestCaseList testResults={currentExecution.testResults} />
          )}
        </div>
      ) : (
        <div className="card p-12 text-center text-slate-400">
          No execution selected. Select a run from above or trigger a new one.
        </div>
      )}

      <TriggerModal isOpen={isTriggerOpen} onClose={() => setIsTriggerOpen(false)} />
    </div>
  );
};
