import React, { useState } from 'react';
import {
  Boxes,
  Activity,
  CheckCircle2,
  XCircle,
  Play,
  ArrowUpRight,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useDashboardStats, useDashboardTrends } from '../api/hooks';
import { MetricCard } from '../components/ui/MetricCard';
import { PassRateGauge } from '../components/charts/PassRateGauge';
import { ExecutionTrendChart } from '../components/charts/ExecutionTrendChart';
import { PlatformDistributionChart } from '../components/charts/PlatformDistributionChart';
import { ExecutionRow } from '../components/executions/ExecutionRow';
import { TriggerModal } from '../components/executions/TriggerModal';
import { useNavigate } from 'react-router-dom';

export const Overview: React.FC = () => {
  const { data: stats } = useDashboardStats();
  const { data: trends = [] } = useDashboardTrends(30);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Informational banner: Mandatory Environment Constraint */}
      <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-xs text-blue-800 dark:text-blue-300">
          <Info className="w-4 h-4 text-blue-500 shrink-0" />
          <span>
            <strong>Automation Notice:</strong> Automation coverage currently available for{' '}
            <strong>Staging environment only</strong>. Executions run on the Jenkins Linux VM against{' '}
            <code>https://zila-staging.ccdms.in</code>.
          </span>
        </div>
        <button
          onClick={() => setIsTriggerModalOpen(true)}
          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0 ml-4"
        >
          <Play className="w-3 h-3 fill-white" />
          <span>Run Automation</span>
        </button>
      </div>

      {/* Top Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Automation Modules"
          value={stats?.totalModules ?? 9}
          icon={Boxes}
          color="blue"
          subtext="Active monorepo suites"
        />
        <MetricCard
          title="Active Runs"
          value={stats?.activeExecutions ?? 0}
          icon={Activity}
          color="purple"
          subtext="Running on Jenkins"
        />
        <MetricCard
          title="Today Passed"
          value={stats?.todayPassed ?? 0}
          icon={CheckCircle2}
          color="green"
          subtext="Staging tests verified"
        />
        <MetricCard
          title="Today Failed"
          value={stats?.todayFailed ?? 0}
          icon={XCircle}
          color="red"
          subtext="Defects detected"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 30-Day Trend Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                30-Day Staging Execution Trends
              </h3>
              <p className="text-xs text-slate-400">
                Daily test volume: Passed vs Failed test cases
              </p>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 flex items-center gap-1 font-semibold"
            >
              <span>View History</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <ExecutionTrendChart data={trends} />
        </div>

        {/* Pass Rate Gauge + Platform breakdown */}
        <div className="card p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
              Overall Pass Percentage
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Cumulative pass rate across Staging executions
            </p>
            <div className="py-2 flex justify-center">
              <PassRateGauge rate={stats?.passRate ?? 92} size={160} />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-semibold text-xs text-slate-700 dark:text-slate-300 mb-2">
              Platform Distribution
            </h4>
            <PlatformDistributionChart
              webCount={6}
              mobileCount={2}
              apiCount={1}
            />
          </div>
        </div>
      </div>

      {/* Latest Executions Table + Recent Failures */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Latest Jenkins Executions
              </h3>
              <p className="text-xs text-slate-400">
                Most recently triggered Staging pipeline runs
              </p>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 font-semibold"
            >
              See all
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="py-2.5 px-4 font-semibold">Build</th>
                  <th className="py-2.5 px-4 font-semibold">Module</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Env</th>
                  <th className="py-2.5 px-4 font-semibold">Tests (P/F/S)</th>
                  <th className="py-2.5 px-4 font-semibold">Duration</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentExecutions && stats.recentExecutions.length > 0 ? (
                  stats.recentExecutions.map((exec) => (
                    <ExecutionRow
                      key={exec.id}
                      execution={exec}
                      onSelect={(id) => navigate(`/live?id=${id}`)}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-xs text-slate-400 italic">
                      No executions recorded yet. Click "Run Automation" to trigger your first build.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Failures Card */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>Recent Failures</span>
              </h3>
              <p className="text-xs text-slate-400">
                Executions requiring QA investigation
              </p>
            </div>
            <button
              onClick={() => navigate('/failures')}
              className="text-xs text-blue-600 dark:text-blue-400 font-medium"
            >
              Analysis
            </button>
          </div>

          <div className="space-y-3">
            {stats?.recentFailures && stats.recentFailures.length > 0 ? (
              stats.recentFailures.map((fail) => (
                <div
                  key={fail.id}
                  onClick={() => navigate(`/live?id=${fail.id}`)}
                  className="p-3 rounded-lg border border-red-200/60 dark:border-red-950/40 bg-red-50/30 dark:bg-red-950/20 hover:border-red-400 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {fail.module?.displayName || fail.module?.name || 'Automation Suite'}
                    </span>
                    <span className="text-red-500 font-mono font-bold">
                      {fail.failedTests} failed
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Build #{fail.jenkinsBuildNumber || fail.id.slice(-6)} • Staging
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-xs text-slate-400 italic">
                No recent failures detected! All Staging runs passing. 🎉
              </div>
            )}
          </div>
        </div>
      </div>

      <TriggerModal
        isOpen={isTriggerModalOpen}
        onClose={() => setIsTriggerModalOpen(false)}
      />
    </div>
  );
};
