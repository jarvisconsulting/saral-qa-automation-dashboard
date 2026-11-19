import { create } from 'zustand';
import { Execution } from '../types';

interface RealtimeState {
  activeExecutions: Map<string, Execution>;
  liveLogs: Map<string, string[]>;
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
  upsertExecution: (execution: Execution) => void;
  removeExecution: (id: string) => void;
  appendLog: (executionId: string, log: string) => void;
  clearLogs: (executionId: string) => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  activeExecutions: new Map(),
  liveLogs: new Map(),
  isConnected: false,

  setIsConnected: (connected: boolean) => set({ isConnected: connected }),

  upsertExecution: (execution: Execution) => {
    set((state) => {
      const updated = new Map(state.activeExecutions);
      updated.set(execution.id, execution);
      return { activeExecutions: updated };
    });
  },

  removeExecution: (id: string) => {
    set((state) => {
      const updated = new Map(state.activeExecutions);
      updated.delete(id);
      return { activeExecutions: updated };
    });
  },

  appendLog: (executionId: string, log: string) => {
    set((state) => {
      const logsMap = new Map(state.liveLogs);
      const existing = logsMap.get(executionId) || [];
      logsMap.set(executionId, [...existing, log]);
      return { liveLogs: logsMap };
    });
  },

  clearLogs: (executionId: string) => {
    set((state) => {
      const logsMap = new Map(state.liveLogs);
      logsMap.delete(executionId);
      return { liveLogs: logsMap };
    });
  },
}));
