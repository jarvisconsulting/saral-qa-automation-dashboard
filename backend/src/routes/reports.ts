import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../db/client';

const router = Router();

router.get('/failures', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string || '30');
    const since = new Date();
    since.setDate(since.getDate() - days);

    const failures = await prisma.execution.findMany({
      where: { failedTests: { gt: 0 }, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      include: {
        module: { select: { name: true, displayName: true } },
        testResults: { where: { status: 'FAILED' }, take: 10 },
      },
      take: 50,
    });

    res.json({ failures });
  } catch (err) { next(err); }
});

router.get('/module-stats', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const modules = await prisma.automationModule.findMany({ where: { isActive: true } });
    const stats = await Promise.all(modules.map(async (m) => {
      const agg = await prisma.execution.aggregate({
        where: { moduleId: m.id, status: { notIn: ['PENDING', 'QUEUED'] } },
        _sum: { passedTests: true, failedTests: true, totalTests: true },
        _count: { id: true },
        _avg: { duration: true },
      });
      const totalTests = agg._sum.totalTests || 0;
      const passed = agg._sum.passedTests || 0;
      return {
        moduleId: m.id,
        moduleName: m.displayName,
        platform: m.platform,
        totalExecutions: agg._count.id,
        totalTests,
        passedTests: passed,
        failedTests: agg._sum.failedTests || 0,
        passRate: totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0,
        avgDuration: Math.round(agg._avg.duration || 0),
      };
    }));
    res.json({ stats });
  } catch (err) { next(err); }
});

export default router;
