import React from 'react';
import { Server, CheckCircle2, XCircle, RotateCw, ExternalLink, Terminal, Shield } from 'lucide-react';
import { useJenkinsStatus, useJenkinsJob, useJenkinsJobParameters } from '../api/hooks';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const JenkinsIntegration: React.FC = () => {
  const { data: status, isLoading, refetch } = useJenkinsStatus();
  const { data: jobData } = useJenkinsJob('event_module_automation');
  const { data: paramsData } = useJenkinsJobParameters('event_module_automation');

  const job = jobData?.job;
  const parameters = paramsData?.parameters || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            <span>Jenkins Linux VM Pipeline Integration</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Direct integration with the primary QA execution server (<code>34.131.246.72</code>)
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Test Connection</span>
        </button>
      </div>

      {/* Connection Status Card */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                status?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {status?.connected ? 'Connected to Jenkins Server' : 'Jenkins Disconnected'}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Target: http://34.131.246.72:8080 • Primary Pipeline: <code>event-module-automation</code>
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
              status?.connected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
            }`}
          >
            {status?.connected ? `v${status.version || '2.x'}` : 'Offline / Unreachable'}
          </span>
        </div>

        {!status?.connected && (
          <div className="mt-4 p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <p className="font-semibold mb-1">Jenkins Connection Configuration:</p>
            <p>
              Verify that <code>JENKINS_URL</code>, <code>JENKINS_USER</code>, and{' '}
              <code>JENKINS_TOKEN</code> are configured in <code>backend/.env</code>. The dashboard
              communicates securely with the Jenkins REST API without exposing credentials to the
              browser.
            </p>
          </div>
        )}
      </div>

      {/* Discovered Pipeline Parameters */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Discovered Jenkins Pipeline Parameters
            </h3>
            <p className="text-xs text-slate-400">
              Parameters extracted directly from the Jenkinsfile for <code>event_module_automation</code>
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {parameters.length > 0 ? (
            parameters.map((param: any) => (
              <div
                key={param.name}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 text-xs"
              >
                <div className="flex items-center justify-between mb-1 font-mono">
                  <span className="font-bold text-blue-600 dark:text-blue-400">{param.name}</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    {param.type}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mb-2">{param.description}</p>
                {param.choices && (
                  <div className="flex flex-wrap gap-1">
                    {param.choices.slice(0, 8).map((ch: string) => (
                      <span
                        key={ch}
                        className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {ch}
                      </span>
                    ))}
                    {param.choices.length > 8 && (
                      <span className="text-[10px] text-slate-400 px-1 py-0.5">
                        +{param.choices.length - 8} more choices
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-slate-400 italic">
              Discovered pipeline parameters: <code>TEST_COMMAND</code> (35+ scripts),{' '}
              <code>ANDROID_DEVICE_TYPE</code> (virtual/real), <code>EMULATOR_NAME</code>{' '}
              (DEVICE-ANDROID-5 through 16), <code>WEB_TAGS</code>, <code>EMAIL</code>.
            </div>
          )}
        </div>
      </div>

      {/* Linux VM Architecture Info */}
      <div className="card p-5">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">
          Execution Environment Specifications (Linux VM)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5 text-slate-600 dark:text-slate-400">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">OS:</span> Linux VM
              (Ubuntu Server)
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Host IP:</span>{' '}
              <code>34.131.246.72</code>
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Target URL:</span>{' '}
              <code>https://zila-staging.ccdms.in</code> (STAGING)
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Test Container:</span>{' '}
              Docker with KVM hardware acceleration (<code>/dev/kvm</code>)
            </div>
          </div>
          <div className="space-y-1.5 text-slate-600 dark:text-slate-400">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">VNC Display:</span>{' '}
              Xvfb :99 + x11vnc :5900 + noVNC :6080
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">noVNC URL:</span>{' '}
              <a
                href="http://34.131.246.72:6080/vnc.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                http://34.131.246.72:6080/vnc.html
              </a>
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Android SDK:</span>{' '}
              <code>/opt/android-sdk</code> (AVD user: <code>qateam</code>)
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Reporting:</span> Allure
              v2.21 + nodemailer
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
