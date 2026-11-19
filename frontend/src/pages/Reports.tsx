import React from 'react';
import { FileText, ExternalLink, Download, BarChart2, ShieldCheck } from 'lucide-react';
import { useModuleStatsReport, useExecutions } from '../api/hooks';
import { ModuleComparisonChart } from '../components/charts/ModuleComparisonChart';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const Reports: React.FC = () => {
  const { data: statsData, isLoading } = useModuleStatsReport();
  const { data: runsData } = useExecutions({ limit: 20 });

  const stats = statsData?.stats || [];
  const executions = runsData?.data || [];

  const comparisonData = stats.map((s) => ({
    moduleName: s.moduleName.replace(' Automation', ''),
    passed: s.passedTests,
    failed: s.failedTests,
    passRate: s.passRate,
  }));

  const allureRuns = executions.filter((e) => e.allureReportUrl);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Reports & Test Artifacts
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Archived Allure HTML test reports, execution logs, and module performance analytics
        </p>
      </div>

      {/* Module Comparison Bar Chart */}
      <div className="card p-5">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
          Module-Wise Quality Breakdown (Staging)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Comparative volume of passed vs failed tests by module
        </p>
        <ModuleComparisonChart data={comparisonData} />
      </div>

      {/* Published Allure Reports Grid */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Published Allure HTML Reports</span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive HTML test reports served directly by Jenkins
            </p>
          </div>
        </div>

        {allureRuns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allureRuns.map((run) => (
              <div
                key={run.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      Build #{run.jenkinsBuildNumber}
                    </span>
                    <span className="text-slate-400">{run.duration}s</span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                    {run.module?.displayName}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                    {run.testCommand}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-xs font-mono">
                    <span className="text-emerald-600 font-semibold">{run.passedTests} passed</span>
                    {run.failedTests > 0 && (
                      <span className="text-red-500 font-semibold">{run.failedTests} failed</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
                  <a
                    href={run.allureReportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <span>Open Allure Report</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400 italic">
            No Allure reports published yet. Run a pipeline with <code>test:web-*</code> or{' '}
            <code>test:android*</code> to generate reports.
          </div>
        )}
      </div>

      {/* Module Stats Summary Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
            Historical Suite Performance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 font-semibold">
                <th className="py-2.5 px-4">Module Name</th>
                <th className="py-2.5 px-4">Platform</th>
                <th className="py-2.5 px-4">Total Runs</th>
                <th className="py-2.5 px-4">Total Tests</th>
                <th className="py-2.5 px-4">Passed</th>
                <th className="py-2.5 px-4">Failed</th>
                <th className="py-2.5 px-4">Pass Rate</th>
                <th className="py-2.5 px-4">Avg Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.map((s) => (
                <tr key={s.moduleId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {s.moduleName}
                  </td>
                  <td className="py-3 px-4 font-mono uppercase text-[10px] text-slate-500">
                    {s.platform}
                  </td>
                  <td className="py-3 px-4 font-mono">{s.totalExecutions}</td>
                  <td className="py-3 px-4 font-mono">{s.totalTests}</td>
                  <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">{s.passedTests}</td>
                  <td className="py-3 px-4 font-mono text-red-500 font-semibold">{s.failedTests}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {s.passRate}%
                  </td>
                  <td className="py-3 px-4 text-slate-500">{s.avgDuration}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
