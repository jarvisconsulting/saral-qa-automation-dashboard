import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import {
  DashboardStats,
  TrendDataPoint,
  AutomationModule,
  Execution,
  Schedule,
  JenkinsStatus,
  GitHubStatus,
  User,
  TestCase,
} from '../types';

export const useDashboardStats = () => {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/stats');
      return res.data;
    },
    refetchInterval: 10000,
  });
};

export const useDashboardTrends = (days: number = 30) => {
  return useQuery<TrendDataPoint[]>({
    queryKey: ['dashboard-trends', days],
    queryFn: async () => {
      const res = await apiClient.get(`/dashboard/trends?days=${days}`);
      return res.data;
    },
  });
};

export const useModules = () => {
  return useQuery<{ modules: AutomationModule[] }>({
    queryKey: ['modules'],
    queryFn: async () => {
      const res = await apiClient.get('/modules');
      return res.data;
    },
    refetchInterval: 15000,
  });
};

export const useModule = (id: string) => {
  return useQuery<{ module: AutomationModule; executions: Execution[] }>({
    queryKey: ['module', id],
    queryFn: async () => {
      const res = await apiClient.get(`/modules/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
};

export const useExecutions = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  moduleId?: string;
  triggerType?: string;
  search?: string;
}) => {
  return useQuery<{
    data: Execution[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>({
    queryKey: ['executions', params],
    queryFn: async () => {
      const res = await apiClient.get('/executions', { params });
      return res.data;
    },
    refetchInterval: 8000,
  });
};

export const useExecution = (id: string) => {
  return useQuery<{ execution: Execution }>({
    queryKey: ['execution', id],
    queryFn: async () => {
      const res = await apiClient.get(`/executions/${id}`);
      return res.data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.execution?.status;
      return status === 'RUNNING' || status === 'QUEUED' ? 3000 : false;
    },
  });
};

export const useExecutionLogs = (id: string, start: number = 0) => {
  return useQuery<{ logs: string; more: boolean; nextStart: number; source: string }>({
    queryKey: ['execution-logs', id, start],
    queryFn: async () => {
      const res = await apiClient.get(`/executions/${id}/logs?start=${start}`);
      return res.data;
    },
    enabled: !!id,
  });
};

export const useTriggerExecution = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      moduleId: string;
      testCommand?: string;
      branch?: string;
      androidDeviceType?: string;
      emulatorName?: string;
      webTags?: string;
      emailRecipients?: string;
    }) => {
      const res = await apiClient.post('/executions', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
};

export const useCancelExecution = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/executions/${id}/cancel`);
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['execution', id] });
      queryClient.invalidateQueries({ queryKey: ['executions'] });
    },
  });
};

export const useSchedules = () => {
  return useQuery<{ schedules: Schedule[] }>({
    queryKey: ['schedules'],
    queryFn: async () => {
      const res = await apiClient.get('/schedules');
      return res.data;
    },
  });
};

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Schedule>) => {
      const res = await apiClient.post('/schedules', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Schedule> }) => {
      const res = await apiClient.patch(`/schedules/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

export const useRunScheduleNow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/schedules/${id}/run-now`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/schedules/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

export const useJenkinsStatus = () => {
  return useQuery<JenkinsStatus>({
    queryKey: ['jenkins-status'],
    queryFn: async () => {
      const res = await apiClient.get('/jenkins/status');
      return res.data;
    },
    refetchInterval: 30000,
  });
};

export const useJenkinsJobs = () => {
  return useQuery<{ jobs: Array<{ name: string; url: string; color: string }> }>({
    queryKey: ['jenkins-jobs'],
    queryFn: async () => {
      const res = await apiClient.get('/jenkins/jobs');
      return res.data;
    },
  });
};

export const useJenkinsJob = (jobName: string) => {
  return useQuery({
    queryKey: ['jenkins-job', jobName],
    queryFn: async () => {
      const res = await apiClient.get(`/jenkins/jobs/${jobName}`);
      return res.data;
    },
    enabled: !!jobName,
  });
};

export const useJenkinsJobParameters = (jobName: string) => {
  return useQuery({
    queryKey: ['jenkins-job-params', jobName],
    queryFn: async () => {
      const res = await apiClient.get(`/jenkins/jobs/${jobName}/parameters`);
      return res.data;
    },
    enabled: !!jobName,
  });
};

export const useSyncJenkins = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/jenkins/sync');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-trends'] });
    },
  });
};

export const useGitHubStatus = () => {
  return useQuery<GitHubStatus>({
    queryKey: ['github-status'],
    queryFn: async () => {
      const res = await apiClient.get('/github/status');
      return res.data;
    },
    refetchInterval: 30000,
  });
};

export const useGitHubBranches = () => {
  return useQuery({
    queryKey: ['github-branches'],
    queryFn: async () => {
      const res = await apiClient.get('/github/branches');
      return res.data;
    },
  });
};

export const useGitHubCommits = (branch: string = 'main') => {
  return useQuery({
    queryKey: ['github-commits', branch],
    queryFn: async () => {
      const res = await apiClient.get(`/github/commits?branch=${branch}`);
      return res.data;
    },
  });
};

export const useFailuresReport = (days: number = 30) => {
  return useQuery<{ failures: Execution[] }>({
    queryKey: ['failures-report', days],
    queryFn: async () => {
      const res = await apiClient.get(`/reports/failures?days=${days}`);
      return res.data;
    },
  });
};

export const useModuleStatsReport = () => {
  return useQuery<{ stats: any[] }>({
    queryKey: ['module-stats-report'],
    queryFn: async () => {
      const res = await apiClient.get('/reports/module-stats');
      return res.data;
    },
  });
};

export const useSettings = () => {
  return useQuery<{ settings: Record<string, any> }>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await apiClient.get('/settings');
      return res.data;
    },
  });
};

// --- User Management Hooks (Admin Only) ---
export const useUsers = () => {
  return useQuery<{ users: User[] }>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data;
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; email: string; password: string; role: 'ADMIN' | 'READ_ONLY'; isActive?: boolean }) => {
      const res = await apiClient.post('/users', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; email?: string; role?: 'ADMIN' | 'READ_ONLY'; isActive?: boolean } }) => {
      const res = await apiClient.patch(`/users/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useResetUserPassword = () => {
  return useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      const res = await apiClient.post(`/users/${id}/reset-password`, { newPassword });
      return res.data;
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/users/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// --- Dynamic Test Case Synchronization Hooks ---
export const useAllTestCases = (params?: { search?: string; tag?: string; framework?: string; isActive?: boolean }) => {
  return useQuery<{ testCases: TestCase[]; total: number }>({
    queryKey: ['test-cases', params],
    queryFn: async () => {
      const res = await apiClient.get('/modules/test-cases/all', { params });
      return res.data;
    },
  });
};

export const useModuleTestCases = (moduleId: string, params?: { search?: string; tag?: string }) => {
  return useQuery<{ testCases: TestCase[]; total: number }>({
    queryKey: ['module-test-cases', moduleId, params],
    queryFn: async () => {
      const res = await apiClient.get(`/modules/${moduleId}/test-cases`, { params });
      return res.data;
    },
    enabled: !!moduleId,
  });
};

export const useSyncGitHub = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (branch: string = 'main') => {
      const res = await apiClient.post('/github/sync', { branch });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['test-cases'] });
      queryClient.invalidateQueries({ queryKey: ['module-test-cases'] });
    },
  });
};
