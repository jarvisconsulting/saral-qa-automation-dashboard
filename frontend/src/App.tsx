import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';

import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Overview } from './pages/Overview';
import { LiveExecutions } from './pages/LiveExecutions';
import { Modules } from './pages/Modules';
import { History } from './pages/History';
import { FailureAnalysis } from './pages/FailureAnalysis';
import { Reports } from './pages/Reports';
import { Schedules } from './pages/Schedules';
import { JenkinsIntegration } from './pages/JenkinsIntegration';
import { GitHubIntegration } from './pages/GitHubIntegration';
import { MobileAutomation } from './pages/MobileAutomation';
import { Settings } from './pages/Settings';
import { Users } from './pages/Users';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { token } = useAuthStore();
  const localToken = localStorage.getItem('saral_qa_token');

  if (!token && !localToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="live" element={<LiveExecutions />} />
            <Route path="modules" element={<Modules />} />
            <Route path="history" element={<History />} />
            <Route path="failures" element={<FailureAnalysis />} />
            <Route path="reports" element={<Reports />} />
            <Route path="schedules" element={<Schedules />} />
            <Route path="jenkins" element={<JenkinsIntegration />} />
            <Route path="github" element={<GitHubIntegration />} />
            <Route path="mobile" element={<MobileAutomation />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
