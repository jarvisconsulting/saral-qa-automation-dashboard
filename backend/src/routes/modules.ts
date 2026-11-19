import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../db/client';

const router = Router();

// GET /api/modules/test-cases/all - List all discovered test cases across all modules
router.get('/test-cases/all', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, tag, framework, isActive } = req.query;
    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    } else {
      where.isActive = true; // default to active cases
    }

    if (framework) where.framework = String(framework);

    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
        { filePath: { contains: String(search), mode: 'insensitive' } },
        { testIdentifier: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (tag) {
      where.tags = { contains: String(tag) };
    }

    const testCases = await prisma.testCase.findMany({
      where,
      orderBy: [{ moduleId: 'asc' }, { title: 'asc' }],
      include: {
        module: {
          select: { id: true, name: true, displayName: true, platform: true, framework: true, color: true },
        },
      },
    });

    const formatted = testCases.map((tc) => ({
      ...tc,
      tags: tc.tags ? JSON.parse(tc.tags) : [],
    }));

    res.json({ testCases: formatted, total: testCases.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/modules - List all modules enriched with test count and stats
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const modules = await prisma.automationModule.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // Enrich with execution stats and discovered test cases count
    const enriched = await Promise.all(
      modules.map(async (m) => {
        const [stats, lastExec, testCasesCount] = await Promise.all([
          prisma.execution.aggregate({
            where: { moduleId: m.id, status: { notIn: ['PENDING', 'QUEUED'] } },
            _sum: { passedTests: true, failedTests: true, skippedTests: true, totalTests: true },
            _avg: { duration: true },
            _count: { id: true },
          }),
          prisma.execution.findFirst({
            where: { moduleId: m.id },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.testCase.count({
            where: { moduleId: m.id, isActive: true },
          }),
        ]);

        const totalTests = stats._sum.totalTests || 0;
        const passed = stats._sum.passedTests || 0;

        return {
          ...m,
          testCommands: JSON.parse(m.testCommands || '[]'),
          totalExecutions: stats._count.id,
          totalTests,
          passedTests: passed,
          failedTests: stats._sum.failedTests || 0,
          skippedTests: stats._sum.skippedTests || 0,
          passRate: totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0,
          avgDuration: Math.round(stats._avg.duration || 0),
          lastStatus: lastExec?.status || 'never',
          lastExecutionAt: lastExec?.createdAt || null,
          discoveredCasesCount: testCasesCount,
        };
      })
    );

    res.json({ modules: enriched });
  } catch (err) {
    next(err);
  }
});

// GET /api/modules/:id/test-cases - Discovered test cases for a specific module
router.get('/:id/test-cases', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { search, tag } = req.query;

    const where: any = { moduleId: id, isActive: true };

    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
        { filePath: { contains: String(search), mode: 'insensitive' } },
        { testIdentifier: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (tag) {
      where.tags = { contains: String(tag) };
    }

    const testCases = await prisma.testCase.findMany({
      where,
      orderBy: { title: 'asc' },
    });

    const formatted = testCases.map((tc) => ({
      ...tc,
      tags: tc.tags ? JSON.parse(tc.tags) : [],
    }));

    res.json({ testCases: formatted, total: testCases.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/modules/:id - Single module details
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const module = await prisma.automationModule.findUnique({
      where: { id },
      include: {
        _count: {
          select: { testCases: { where: { isActive: true } } },
        },
      },
    });
    if (!module) {
      res.status(404).json({ error: 'Module not found' });
      return;
    }

    const executions = await prisma.execution.findMany({
      where: { moduleId: module.id },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      module: {
        ...module,
        testCommands: JSON.parse(module.testCommands || '[]'),
        discoveredCasesCount: module._count.testCases,
      },
      executions,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
