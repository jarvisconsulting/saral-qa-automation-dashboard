import React, { useState } from 'react';
import { Smartphone, Play, ExternalLink, ShieldAlert, CheckCircle2, Cpu, Video } from 'lucide-react';
import { TriggerModal } from '../components/executions/TriggerModal';
import { useExecutions } from '../api/hooks';
import { StatusBadge } from '../components/ui/StatusBadge';

export const MobileAutomation: React.FC = () => {
  const [isTriggerOpen, setIsTriggerOpen] = useState(false);
  const { data: runsData } = useExecutions({ limit: 20 });

  // Filter mobile executions
  const mobileRuns = (runsData?.data || []).filter(
    (e) =>
      e.platform === 'MOBILE' ||
      e.testCommand?.includes('android') ||
      e.testCommand?.includes('ios')
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-purple-600" />
            <span>Mobile Automation Hub (Android & iOS)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Appium & WebdriverIO mobile automation pipelines on Staging infrastructure
          </p>
        </div>

        <button
          onClick={() => setIsTriggerOpen(true)}
          className="btn-primary text-xs py-2 px-3.5 flex items-center gap-2 self-start sm:self-auto"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>Trigger Mobile Test</span>
        </button>
      </div>

      {/* Infrastructure Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Android Card */}
        <div className="card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Android Infrastructure (Verified Active)</span>
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              Operational
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Execution Host:</span>{' '}
              Linux VM (<code>34.131.246.72</code>)
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">App Distribution:</span>{' '}
              Firebase App Distribution (<code>scripts/setup-firebase.js</code>)
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Test Harness:</span>{' '}
              <code>App Tester.apk</code> automated onboarding & login flow
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Available AVDs:</span>{' '}
              <code>DEVICE-ANDROID-5</code> through <code>DEVICE-ANDROID-16</code>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Live Device Screen:</span>
            <a
              href="http://34.131.246.72:6080/vnc.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Open noVNC Live Stream</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* iOS Card */}
        <div className="card p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>iOS Infrastructure (Framework Ready)</span>
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
              macOS / TestFlight
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Framework:</span>{' '}
              WebdriverIO 9 + Appium XCUITest Driver
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Config:</span>{' '}
              <code>conf/wdio.ios.conf.ts</code>
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Distribution:</span>{' '}
              Apple TestFlight / App Store Connect
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Host Prerequisite:</span>{' '}
              Requires macOS runner with Xcode Command Line Tools for simulator launch
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Target Environment:</span>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
              Staging iOS App
            </span>
          </div>
        </div>
      </div>

      {/* Recent Mobile Executions */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
            Recent Mobile Executions (Staging)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 font-semibold">
                <th className="py-2.5 px-4">Build</th>
                <th className="py-2.5 px-4">Module</th>
                <th className="py-2.5 px-4">Command</th>
                <th className="py-2.5 px-4">Device Config</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Tests</th>
                <th className="py-2.5 px-4">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {mobileRuns.length > 0 ? (
                mobileRuns.map((exec) => (
                  <tr key={exec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      #{exec.jenkinsBuildNumber || exec.id.slice(-6)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {exec.module?.displayName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 max-w-[200px] truncate">
                      {exec.testCommand}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {exec.emulatorName || exec.androidDeviceType || 'Default Emulator'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={exec.status} />
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="text-emerald-600 font-semibold">{exec.passedTests}P</span>{' '}
                      <span className="text-red-500 font-semibold">{exec.failedTests}F</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {exec.duration ? `${exec.duration}s` : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-slate-400 italic">
                    No mobile runs recorded yet. Click "Trigger Mobile Test" to launch an Android emulator run.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TriggerModal
        isOpen={isTriggerOpen}
        onClose={() => setIsTriggerOpen(false)}
        defaultModuleId="event-module-automation"
      />
    </div>
  );
};
