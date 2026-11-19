import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

class WebSocketService {
  private io: SocketIOServer | null = null;

  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: { origin: true, methods: ['GET', 'POST'], credentials: true },
      transports: ['websocket', 'polling'],
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`[WS] Client connected: ${socket.id}`);

      socket.on('subscribe:execution', (executionId: string) => {
        socket.join(`execution:${executionId}`);
        socket.emit('subscribed', { executionId });
      });

      socket.on('unsubscribe:execution', (executionId: string) => {
        socket.leave(`execution:${executionId}`);
      });

      socket.on('subscribe:dashboard', () => {
        socket.join('dashboard');
        socket.emit('subscribed', { room: 'dashboard' });
      });

      socket.on('disconnect', (reason) => {
        console.log(`[WS] Client disconnected: ${socket.id} (${reason})`);
      });
    });

    console.log('[WS] Socket.io server initialized');
  }

  emitExecutionCreated(execution: Record<string, unknown>): void {
    this.io?.emit('execution:created', { execution, timestamp: new Date().toISOString() });
  }

  emitExecutionUpdated(executionId: string, changes: Record<string, unknown>): void {
    this.io?.emit('execution:updated', { executionId, changes, timestamp: new Date().toISOString() });
  }

  emitExecutionCompleted(executionId: string, summary: Record<string, unknown>): void {
    this.io?.emit('execution:completed', { executionId, summary, timestamp: new Date().toISOString() });
  }

  emitLogAppend(executionId: string, line: string): void {
    this.io?.to(`execution:${executionId}`).emit('log:append', {
      executionId, line, timestamp: new Date().toISOString(),
    });
  }

  emitStatsUpdated(stats: Record<string, unknown>): void {
    this.io?.emit('stats:updated', { stats, timestamp: new Date().toISOString() });
  }

  getConnectedCount(): number {
    return this.io?.engine.clientsCount || 0;
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService;
