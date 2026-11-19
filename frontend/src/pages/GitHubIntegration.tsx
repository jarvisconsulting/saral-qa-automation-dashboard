import React from 'react';
import { GitBranch, GitCommit, RefreshCw, CheckCircle2, Shield, ArrowUpRight } from 'lucide-react';
import { useGitHubStatus, useGitHubBranches, useGitHubCommits } from '../api/hooks';
import apiClient from '../api/client';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const GitHubIntegration: React.FC = () => {
  const { data: status, refetch: refetchStatus } = useGitHubStatus();
  const { data: branchesData, refetch: refetchBranches } = useGitHubBranches();
  const { data: commitsData } = useGitHubCommits('main');

  const branches = branchesData?.branches || [];
  const commits = commitsData?.commits || [];

  const handleSync = async () => {
    try {
      await apiClient.post('/github/sync');
      alert('GitHub repository metadata successfully synchronized!');
      refetchBranches();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Synchronization failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-600" />
            <span>GitHub Repository Synchronization & Webhooks</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitors repository commits, branches, and receives automated push triggers
          </p>
        </div>

        <button
          onClick={handleSync}
          className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Repository Now</span>
        </button>
      </div>

      {/* GitHub Status Card */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                status?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {status?.connected ? 'GitHub REST API Connected' : 'GitHub Integration Offline'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Target Repository: <code>saral-automation</code> (Staging Monorepo)
              </p>
            </div>
          </div>

          <span className="text-xs font-mono text-slate-400">
            {status?.rateLimitRemaining !== undefined && (
              <span>Rate limit: {status.rateLimitRemaining} reqs left</span>
            )}
          </span>
        </div>
      </div>

      {/* Webhook Configuration Guide */}
      <div className="card p-5 bg-blue-50/20 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-xs space-y-2">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              GitHub Webhook Setup Instructions
            </h4>
            <p className="text-slate-600 dark:text-slate-300">
              Configure your GitHub repository to trigger automatic Staging test runs on push:
            </p>
            <div className="p-3 rounded-lg bg-slate-950 text-slate-200 font-mono text-[11px] space-y-1">
              <div>
                <span className="text-slate-500">Payload URL:</span>{' '}
                <span className="text-emerald-400">https://your-dashboard-domain/api/webhooks/github</span>
              </div>
              <div>
                <span className="text-slate-500">Content type:</span>{' '}
                <span className="text-blue-400">application/json</span>
              </div>
              <div>
                <span className="text-slate-500">Secret:</span>{' '}
                <span className="text-amber-400">Configured via GITHUB_WEBHOOK_SECRET in .env</span>
              </div>
              <div>
                <span className="text-slate-500">Events:</span> Just the <code>push</code> event
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Branches & Recent Commits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Branches */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-3">
            Available Branches ({branches.length || 1})
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {branches.length > 0 ? (
              branches.map((b: any) => (
                <div
                  key={b.name}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 text-xs"
                >
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {b.name}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {b.commit?.sha?.slice(0, 7)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-xs italic py-4">
                Primary active branch: <code>main</code>
              </div>
            )}
          </div>
        </div>

        {/* Commits */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-3">
            Recent Monorepo Commits
          </h3>
          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {commits.length > 0 ? (
              commits.map((c: any) => (
                <div
                  key={c.sha}
                  className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {c.sha?.slice(0, 7)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {c.commit?.author?.name}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 truncate">
                    {c.commit?.message}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-xs italic py-4">
                Connecting to GitHub commits stream...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
