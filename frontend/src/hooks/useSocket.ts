import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRealtimeStore } from '../stores/realtimeStore';
import { useQueryClient } from '@tanstack/react-query';

export const useSocket = (executionId?: string) => {
  const socketRef = useRef<Socket | null>(null);
  const { setIsConnected, upsertExecution, removeExecution, appendLog } = useRealtimeStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('subscribe:dashboard');
      if (executionId) {
        socket.emit('subscribe:execution', executionId);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('execution:created', (data: { execution: any }) => {
      upsertExecution(data.execution);
      queryClient.invalidateQueries({ queryKey: ['executions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    });

    socket.on('execution:updated', (data: { executionId: string; changes: any }) => {
      if (['PASSED', 'FAILED', 'CANCELLED'].includes(data.changes?.status)) {
        removeExecution(data.executionId);
      }
      queryClient.invalidateQueries({ queryKey: ['execution', data.executionId] });
      queryClient.invalidateQueries({ queryKey: ['executions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    });

    socket.on('execution:completed', (data: { executionId: string; summary: any }) => {
      removeExecution(data.executionId);
      queryClient.invalidateQueries({ queryKey: ['execution', data.executionId] });
      queryClient.invalidateQueries({ queryKey: ['executions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-trends'] });
    });

    socket.on('log:append', (data: { executionId: string; line: string }) => {
      appendLog(data.executionId, data.line);
    });

    return () => {
      if (executionId) {
        socket.emit('unsubscribe:execution', executionId);
      }
      socket.disconnect();
    };
  }, [executionId]);

  return socketRef.current;
};
