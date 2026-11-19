import http from 'http';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { PORT, CORS_ORIGIN } from './config';
import { errorHandler } from './middleware/errorHandler';
import { webSocketService } from './services/WebSocketService';
import { schedulerService } from './services/SchedulerService';
import { buildPollerService } from './services/BuildPollerService';

import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import executionRoutes from './routes/executions';
import moduleRoutes from './routes/modules';
import scheduleRoutes from './routes/schedules';
import webhookRoutes from './routes/webhooks';
import reportRoutes from './routes/reports';
import settingsRoutes from './routes/settings';
import jenkinsRoutes from './routes/jenkins';
import githubRoutes from './routes/github';
import userRoutes from './routes/users';

const app = express();
const server = http.createServer(app);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

app.use((req, res, next) => {
  if (req.path === '/api/webhooks/github') {
    express.raw({ type: 'application/json' })(req, res, (err) => {
      if (!err) {
        try { (req as any).body = JSON.parse((req as any).body); } catch {}
      }
      next(err);
    });
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/auth/login', authLimiter);

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'staging',
    notice: 'Automation coverage currently available for Staging environment only.',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/jenkins', jenkinsRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/users', userRoutes);

// Serve frontend static build in production / single container deployment
const publicCandidates = [
  path.resolve(__dirname, '../public'),
  path.resolve(process.cwd(), 'public'),
  path.resolve(process.cwd(), '../frontend/dist'),
];
const publicPath = publicCandidates.find((p) => fs.existsSync(p));
if (publicPath) {
  console.log(`[Static] Serving frontend from: ${publicPath}`);
  app.use(express.static(publicPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

app.use(errorHandler);

webSocketService.initialize(server);

server.listen(Number(PORT), '0.0.0.0', async () => {
  console.log(`================================================`);
  console.log(`  Saral QA Automation Dashboard API Server      `);
  console.log(`  Port: ${PORT}                                 `);
  console.log(`  Environment: STAGING ONLY                     `);
  console.log(`================================================`);

  try {
    await schedulerService.initialize();
    buildPollerService.startPolling();
    await buildPollerService.resumeActiveBuilds();
  } catch (err) {
    console.error('Initialization error:', err);
  }
});

const shutdown = () => {
  console.log('\nShutting down gracefully...');
  schedulerService.stopAll();
  buildPollerService.stopPolling();
  server.close(() => { process.exit(0); });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
