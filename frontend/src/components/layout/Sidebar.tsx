import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Boxes,
  History,
  AlertTriangle,
  FileText,
  Calendar,
  Server,
  GitBranch,
  Smartphone,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Users as UsersIcon,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useRealtimeStore } from '../../stores/realtimeStore';
import { useDashboardStats } from '../../api/hooks';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  isLive?: boolean;
}

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const { activeExecutions } = useRealtimeStore();
  const { data: stats } = useDashboardStats();
  const navigate = useNavigate();

  const runningCount = Math.max(activeExecutions.size, stats?.activeExecutions || 0);

  const isAdmin = user?.role === 'ADMIN' || (user?.role as string) === 'QA_LEAD';

  const navItems: NavItem[] = [
    { name: 'Overview', path: '/overview', icon: LayoutDashboard },
    {
      name: 'Live Executions',
      path: '/live',
      icon: Activity,
      isLive: runningCount > 0,
      badge: runningCount > 0 ? String(runningCount) : undefined,
    },
    { name: 'Automation Modules', path: '/modules', icon: Boxes },
    { name: 'Execution History', path: '/history', icon: History },
    { name: 'Failure Analysis', path: '/failures', icon: AlertTriangle },
    { name: 'Reports & Artifacts', path: '/reports', icon: FileText },
    { name: 'Schedules', path: '/schedules', icon: Calendar },
    { name: 'Jenkins Pipeline', path: '/jenkins', icon: Server },
    { name: 'GitHub Integration', path: '/github', icon: GitBranch },
    { name: 'Mobile Automation', path: '/mobile', icon: Smartphone },
    ...(isAdmin ? [{ name: 'User Management', path: '/users', icon: UsersIcon }] : []),
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0 font-bold">
          <ShieldCheck className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight truncate">
              Saral QA Hub
            </span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold tracking-wide uppercase">
              Staging Center
            </span>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-sm z-40 transition-colors"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                } ${collapsed ? 'justify-center' : ''}`
              }
              title={collapsed ? item.name : undefined}
            >
              <div className="relative shrink-0">
                <Icon className="w-4 h-4" />
                {item.isLive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                )}
                {item.isLive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </div>
              {!collapsed && <span className="truncate flex-1">{item.name}</span>}
              {!collapsed && item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Environment constraint notice in sidebar */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          <p className="font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Staging Environment</p>
          <p className="leading-tight text-[10px]">Automation scripts configured for Staging VM only.</p>
        </div>
      )}

      {/* User profile & Logout */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <div
          className={`flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-none">
                {user?.name || 'QA Admin'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                      : 'bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300'
                  }`}
                >
                  {user?.role || 'READ_ONLY'}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
