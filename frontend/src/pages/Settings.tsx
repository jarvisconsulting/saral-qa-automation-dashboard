import React from 'react';
import { Settings as SettingsIcon, Shield, Server, GitBranch, Info, UserCheck, Lock } from 'lucide-react';
import { useSettings } from '../api/hooks';
import { useAuthStore } from '../stores/authStore';

export const Settings: React.FC = () => {
  const { data } = useSettings();
  const { user } = useAuthStore();
  const settings = data?.settings || {};
  const isAdmin = user?.role === 'ADMIN' || (user?.role as string) === 'QA_LEAD';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          <span>System & Integration Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configuration parameters for Jenkins, GitHub, database, and authentication
        </p>
      </div>

      {!isAdmin && (
        <div className="card p-4 border-l-4 border-l-teal-500 bg-teal-50/30 dark:bg-teal-950/20 text-xs text-teal-800 dark:text-teal-300 flex items-center gap-3">
          <Lock className="w-5 h-5 text-teal-600 shrink-0" />
          <div>
            <span className="font-bold block">Read-Only Observer Access</span>
            <span>You are viewing dashboard settings in read-only mode. Modifying integration parameters requires Administrator privileges.</span>
          </div>
        </div>
      )}

      {/* Critical Environment Rule */}
      <div className="card p-5 border-l-4 border-l-blue-600 bg-blue-50/30 dark:bg-blue-950/20">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Target Automation Environment: STAGING ONLY
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              This dashboard is strictly coupled with the Staging test automation repository (
              <code>https://zila-staging.ccdms.in</code>). Execution against QA or Production
              environments is intentionally restricted to prevent unintended state mutations in
              production databases.
            </p>
          </div>
        </div>
      </div>

      {/* User Information */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-500" />
          <span>Current Session Profile</span>
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="block text-slate-400 mb-0.5">User Name</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {user?.name || 'QA Administrator'}
            </span>
          </div>
          <div>
            <span className="block text-slate-400 mb-0.5">Email Address</span>
            <span className="font-mono text-slate-800 dark:text-slate-200">{user?.email || 'admin@saral.qa'}</span>
          </div>
          <div>
            <span className="block text-slate-400 mb-0.5">Assigned Role</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {user?.role || 'ADMIN'}
            </span>
          </div>
          <div>
            <span className="block text-slate-400 mb-0.5">Execution Scope</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Staging Manual & Scheduled Triggers
            </span>
          </div>
        </div>
      </div>

      {/* Jenkins Integration Config */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-500" />
          <span>Jenkins Linux VM Configuration</span>
        </h3>
        <div className="space-y-3 text-xs">
          <div>
            <span className="block text-slate-400 mb-0.5">Jenkins Server Base URL</span>
            <input
              type="text"
              readOnly
              value={settings.jenkinsUrl || 'http://34.131.246.72:8080'}
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 font-mono text-slate-600 dark:text-slate-300"
            />
          </div>
          <div>
            <span className="block text-slate-400 mb-0.5">Default Job Name</span>
            <input
              type="text"
              readOnly
              value={settings.jenkinsJobName || 'event-module-automation'}
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 font-mono text-slate-600 dark:text-slate-300"
            />
          </div>
          <p className="text-[11px] text-slate-400 italic">
            To update Jenkins credentials, modify <code>JENKINS_USER</code> and{' '}
            <code>JENKINS_TOKEN</code> in <code>backend/.env</code> and restart the server.
          </p>
        </div>
      </div>

      {/* GitHub Integration Config */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-purple-500" />
          <span>GitHub Monorepo Configuration</span>
        </h3>
        <div className="space-y-3 text-xs">
          <div>
            <span className="block text-slate-400 mb-0.5">Repository Target</span>
            <input
              type="text"
              readOnly
              value={settings.githubRepo || 'saral-automation'}
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 font-mono text-slate-600 dark:text-slate-300"
            />
          </div>
          <p className="text-[11px] text-slate-400 italic">
            To update GitHub credentials, modify <code>GITHUB_TOKEN</code> and{' '}
            <code>GITHUB_WEBHOOK_SECRET</code> in <code>backend/.env</code>.
          </p>
        </div>
      </div>
    </div>
  );
};
