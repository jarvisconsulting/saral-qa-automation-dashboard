import React, { useState } from 'react';
import { Play, Activity, Bell, Info, Lock } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { TriggerModal } from '../executions/TriggerModal';
import { useRealtimeStore } from '../../stores/realtimeStore';
import { useAuthStore } from '../../stores/authStore';

export const Header: React.FC = () => {
  const [isTriggerOpen, setIsTriggerOpen] = useState(false);
  const { isConnected, activeExecutions } = useRealtimeStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || (user?.role as string) === 'QA_LEAD';

  return (
    <>
      <header className="h-16 px-6 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {/* Environment indicator badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>STAGING ENVIRONMENT</span>
          </div>

          {/* Real-time socket status */}
          <div
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${isConnected
                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
                : 'text-amber-600 bg-amber-50 dark:bg-amber-950/30'
              }`}
            title={isConnected ? 'Live WebSocket Connected' : 'Connecting to Server...'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`}
            />
            <span>{isConnected ? 'Real-time sync' : 'Reconnecting'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick trigger build button or Read-Only indicator */}
          {isAdmin ? (
            <button
              onClick={() => setIsTriggerOpen(true)}
              className="btn-primary flex items-center gap-2 text-xs py-2 px-3.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Run Automation</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-medium cursor-not-allowed border border-slate-200 dark:border-slate-700"
              title="Read-Only users cannot trigger test executions"
            >
              <Lock className="w-3 h-3" />
              <span>Read-Only Mode</span>
            </div>
          )}

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          <ThemeToggle />
        </div>
      </header>

      {isAdmin && <TriggerModal isOpen={isTriggerOpen} onClose={() => setIsTriggerOpen(false)} />}
    </>
  );
};
