import React, { useState } from 'react';
import { AlertTriangle, Bug, Wrench, Server, HelpCircle, CheckCircle2 } from 'lucide-react';
import { useFailuresReport } from '../api/hooks';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export const FailureAnalysis: React.FC = () => {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useFailuresReport(days);
  const failures = data?.failures || [];
  const navigate = useNavigate();

  // Categorize helper based on error message patterns
  const categorizeError = (msg: string = ''): { category: string; icon: any; color: string } => {
    const lower = msg.toLowerCase();
    if (lower.includes('element') && (lower.includes('not visible') || lower.includes('not displayed') || lower.includes('timeout'))) {
      return { category: 'Application / UI Timing', icon: Bug, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900' };
    }
    if (lower.includes('500') || lower.includes('502') || lower.includes('504') || lower.includes('econnrefused')) {
      return { category: 'Staging Environment Issue', icon: Server, color: 'text-red-500 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900' };
    }
    if (lower.includes('syntax') || lower.includes('typeerror') || lower.includes('referenceerror') || lower.includes('cannot read property')) {
      return { category: 'Automation Script Defect', icon: Wrench, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900' };
    }
    return { category: 'Unclassified Defect', icon: HelpCircle, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>Failure Analysis & Root Cause Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Diagnostic insights from Staging Allure and Jenkins build logs
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                days === d
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Analyzing failure patterns..." />
      ) : failures.length > 0 ? (
        <div className="space-y-4">
          {failures.map((exec) => {
            const failedResults = exec.testResults?.filter((r) => r.status === 'FAILED') || [];
            return (
              <div
                key={exec.id}
                className="card p-5 border-l-4 border-l-red-500 border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        Build #{exec.jenkinsBuildNumber || exec.id.slice(-6)}
                      </span>
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        {exec.module?.displayName}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        ({exec.testCommand || 'test'})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Executed on Staging at{' '}
                      {exec.createdAt ? format(new Date(exec.createdAt), 'yyyy-MM-dd HH:mm') : 'recently'}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(`/live?id=${exec.id}`)}
                    className="btn-secondary text-xs py-1.5 px-3 shrink-0"
                  >
                    View Run Console
                  </button>
                </div>

                {/* Failed test cases list */}
                <div className="space-y-3 mt-4">
                  {failedResults.length > 0 ? (
                    failedResults.map((tc) => {
                      const { category, icon: CatIcon, color } = categorizeError(tc.error || '');
                      return (
                        <div
                          key={tc.id}
                          className="p-3.5 rounded-lg bg-red-50/40 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {tc.name}
                            </span>
                            <span
                              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${color}`}
                            >
                              <CatIcon className="w-3 h-3" />
                              <span>{category}</span>
                            </span>
                          </div>

                          {tc.error && (
                            <pre className="p-2.5 rounded bg-white dark:bg-slate-900 border border-red-100 dark:border-red-950 text-[11px] font-mono text-red-600 dark:text-red-400 whitespace-pre-wrap overflow-x-auto">
                              {tc.error}
                            </pre>
                          )}

                          {tc.stackTrace && (
                            <details className="mt-2 text-slate-500">
                              <summary className="cursor-pointer text-[11px] hover:text-slate-700 dark:hover:text-slate-300 font-medium">
                                View Stack Trace
                              </summary>
                              <pre className="p-2.5 mt-1 rounded bg-slate-900 text-slate-300 text-[10px] font-mono whitespace-pre-wrap overflow-x-auto">
                                {tc.stackTrace}
                              </pre>
                            </details>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-300">
                      Pipeline failed during execution stage (exit code non-zero). Inspect Jenkins console log for details.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center text-slate-400">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Zero Failures in Selected Timeframe!
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            All Staging automation runs passed cleanly during the last {days} days.
          </p>
        </div>
      )}
    </div>
  );
};
