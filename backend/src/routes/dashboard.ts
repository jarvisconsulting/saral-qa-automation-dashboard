import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../db/client';

const router = Router();

router.get('/stats', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalModules,
      activeExecutions,
      totalExecutions,
      todayStats,
      overallStats,
      recentExecutions,
      recentFailures,
    ] = await Promise.all([
      prisma.automationModule.count({ where: { isActive: true } }),
      prisma.execution.count({ where: { status: { in: ['RUNNING', 'QUEUED'] } } }),
      prisma.execution.count(),
      prisma.execution.aggregate({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
        _sum: { passedTests: true, failedTests: true, skippedTests: true, totalTests: true },
      }),
      prisma.execution.aggregate({
        _sum: { passedTests: true, failedTests: true, skippedTests: true, totalTests: true },
        _avg: { duration: true },
      }),
      prisma.execution.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { module: { select: { id: true, name: true, displayName: true, platform: true, color: true } } },
      }),
      prisma.execution.findMany({
        where: { failedTests: { gt: 0 } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { module: { select: { name: true, displayName: true } } },
      }),
    ]);

    const totalPassed = overallStats._sum.passedTests || 0;
    const totalFailed = overallStats._sum.failedTests || 0;
    const totalTests = overallStats._sum.totalTests || 0;
    const passRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

    res.json({
      totalModules,
      activeExecutions,
      totalExecutions,
      todayPassed: todayStats._sum.passedTests || 0,
      todayFailed: todayStats._sum.failedTests || 0,
      todayTotal: todayStats._sum.totalTests || 0,
      totalPassed,
      totalFailed,
      totalSkipped: overallStats._sum.skippedTests || 0,
      totalTests,
      passRate,
      avgDuration: Math.round(overallStats._avg.duration || 0),
      recentExecutions,
      recentFailures,
      environment: 'staging',
    });
  } catch (err) {
    next(err);
  }
});

router.get('/trends', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string || '30');
    const since = new Date();
    since.setDate(since.getDate() - days);

    const executions = await prisma.execution.findMany({
      where: { createdAt: { gte: since }, status: { notIn: ['PENDING', 'QUEUED'] } },
      select: { createdAt: true, passedTests: true, failedTests: true, skippedTests: true, duration: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const trendMap = new Map<string, { date: string; passed: number; failed: number; skipped: number; executions: number; totalDuration: number }>();
    for (const e of executions) {
      const day = e.createdAt.toISOString().split('T')[0];
      if (!trendMap.has(day)) {
        trendMap.set(day, { date: day, passed: 0, failed: 0, skipped: 0, executions: 0, totalDuration: 0 });
      }
      const d = trendMap.get(day)!;
      d.passed += e.passedTests;
      d.failed += e.failedTests;
      d.skipped += e.skippedTests;
      d.executions += 1;
      d.totalDuration += e.duration || 0;
    }

    res.json(Array.from(trendMap.values()).map(d => ({
      ...d,
      avgDuration: d.executions > 0 ? Math.round(d.totalDuration / d.executions) : 0,
    })));
  } catch (err) {
    next(err);
  }
});

export default router;
