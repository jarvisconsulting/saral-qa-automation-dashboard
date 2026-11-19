import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../db/client';
import { jenkinsService } from '../services/JenkinsService';
import { buildPollerService } from '../services/BuildPollerService';
import { webSocketService } from '../services/WebSocketService';
import { logParserService } from '../services/LogParserService';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

const triggerSchema = z.object({
  moduleId: z.string().min(1),
  testCommand: z.string().optional(),
  branch: z.string().default('main'),
  androidDeviceType: z.string().optional(),
  emulatorName: z.string().optional(),
  webTags: z.string().optional(),
  emailRecipients: z.string().optional(),
  triggerType: z.string().default('MANUAL'),
});

router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string || '20')));
    const { status, moduleId, triggerType, search } = req.query;

    const where: any = {};
    if (status) where.status = String(status);
    if (moduleId) where.moduleId = String(moduleId);
    if (triggerType) where.triggerType = String(triggerType);
    if (search) {
      where.OR = [
        { jenkinsJobName: { contains: String(search) } },
        { branch: { contains: String(search) } },
        { testCommand: { contains: String(search) } },
        { module: { name: { contains: String(search) } } },
      ];
    }

    const [total, executions] = await Promise.all([
      prisma.execution.count({ where }),
      prisma.execution.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          module: { select: { id: true, name: true, displayName: true, platform: true, color: true } },
        },
      }),
    ]);

    res.json({ data: executions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = triggerSchema.parse(req.body);
    const module = await prisma.automationModule.findUnique({ where: { id: data.moduleId } });
    if (!module) { res.status(404).json({ error: 'Module not found' }); return; }

    // Create execution record
    const execution = await prisma.execution.create({
      data: {
        moduleId: module.id,
        jenkinsJobName: module.jenkinsJobName || undefined,
        testCommand: data.testCommand,
        triggerType: data.triggerType,
        platform: module.platform,
        framework: module.framework,
        environment: 'staging',
        branch: data.branch,
        androidDeviceType: data.androidDeviceType,
        emulatorName: data.emulatorName,
        webTags: data.webTags,
        emailRecipients: data.emailRecipients,
        status: 'QUEUED',
        startTime: new Date(),
      },
    });

    webSocketService.emitExecutionCreated(execution as any);

    // Trigger Jenkins if configured
    if (jenkinsService.isConfigured && module.jenkinsJobName) {
      const jenkinsParams: Record<string, string> = {};
      if (data.testCommand) jenkinsParams.TEST_COMMAND = data.testCommand;
      if (data.webTags) {
        jenkinsParams.WEB_TAGS = data.webTags;
        // Normalize for Cucumber/Selenium suites (like Saral_Web_Automation)
        const cleanTag = data.webTags.replace(/^@+/, '').trim();
        const knownTags = ['Regression', 'Smoke', 'Login', 'WithValidNumber', 'WithValidEmailId', 'UserManagement', 'ProfilePage', 'DynamicCampaignsCreation'];
        const matchedTag = knownTags.find((t) => t.toLowerCase() === cleanTag.toLowerCase());
        jenkinsParams.CUCUMBER_TAGS = matchedTag || (cleanTag.charAt(0).toUpperCase() + cleanTag.slice(1));
      }
      if (data.androidDeviceType) jenkinsParams.ANDROID_DEVICE_TYPE = data.androidDeviceType;
      if (data.emulatorName) jenkinsParams.EMULATOR_NAME = data.emulatorName;
      if (data.emailRecipients) jenkinsParams.EMAIL = data.emailRecipients;

      try {
        const queueItemId = await jenkinsService.triggerBuild(module.jenkinsJobName, jenkinsParams);
        await prisma.execution.update({
          where: { id: execution.id },
          data: { queueItemId, status: 'QUEUED' },
        });

        // Wait for build to start in background
        (async () => {
          const buildNumber = await jenkinsService.waitForBuildStart(queueItemId, 180000);
          if (buildNumber) {
            const buildUrl = `${process.env.JENKINS_URL}/job/${module.jenkinsJobName}/${buildNumber}/`;
            await prisma.execution.update({
              where: { id: execution.id },
              data: { jenkinsBuildNumber: buildNumber, jenkinsBuildUrl: buildUrl, status: 'RUNNING' },
            });
            webSocketService.emitExecutionUpdated(execution.id, { jenkinsBuildNumber: buildNumber, jenkinsBuildUrl: buildUrl, status: 'RUNNING' });
            buildPollerService.trackBuild(execution.id, module.jenkinsJobName!, buildNumber);
          }
        })().catch(console.error);

        res.status(201).json({ execution: { ...execution, queueItemId } });
      } catch (err: any) {
        await prisma.execution.update({ where: { id: execution.id }, data: { status: 'FAILED', errorDetails: err.message } });
        res.status(500).json({ error: 'Failed to trigger Jenkins build', details: err.message });
      }
    } else {
      res.status(201).json({ execution, warning: 'Jenkins not configured. Build not triggered.' });
    }
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const execution = await prisma.execution.findUnique({
      where: { id },
      include: { module: true, testResults: { orderBy: { createdAt: 'asc' } }, artifacts: true },
    });
    if (!execution) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ execution });
  } catch (err) { next(err); }
});

router.get('/:id/logs', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const exec = await prisma.execution.findUnique({ where: { id } });
    if (!exec) { res.status(404).json({ error: 'Not found' }); return; }

    // Stream from Jenkins if build is active or retrieve completed build logs
    if (jenkinsService.isConfigured && exec.jenkinsJobName && exec.jenkinsBuildNumber) {
      const start = parseInt(req.query.start as string || '0');
      let logResult = await jenkinsService.getConsoleLog(exec.jenkinsJobName, exec.jenkinsBuildNumber, start);
      if (!logResult.text && start === 0) {
        const fullText = await jenkinsService.getConsoleText(exec.jenkinsJobName, exec.jenkinsBuildNumber);
        if (fullText) {
          logResult = { text: fullText, more: false, nextStart: fullText.length };
        }
      }
      res.json({ logs: logResult.text, more: logResult.more, nextStart: logResult.nextStart, source: 'jenkins' });
    } else {
      res.json({ logs: '', more: false, nextStart: 0, source: 'db' });
    }
  } catch (err) { next(err); }
});

router.post('/:id/cancel', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const exec = await prisma.execution.findUnique({ where: { id } });
    if (!exec) { res.status(404).json({ error: 'Not found' }); return; }

    if (!['RUNNING', 'QUEUED', 'PENDING'].includes(exec.status)) {
      res.status(400).json({ error: 'Execution is not in a cancellable state' });
      return;
    }

    // Abort Jenkins build if applicable
    if (jenkinsService.isConfigured && exec.jenkinsJobName && exec.jenkinsBuildNumber) {
      try {
        await jenkinsService.abortBuild(exec.jenkinsJobName, exec.jenkinsBuildNumber);
      } catch (e) {
        console.error('[executions] Failed to abort Jenkins build:', e);
      }
    }

    buildPollerService.stopTracking(exec.id);

    const updated = await prisma.execution.update({
      where: { id: exec.id },
      data: { status: 'CANCELLED', endTime: new Date() },
    });

    webSocketService.emitExecutionUpdated(exec.id, { status: 'CANCELLED' });
    res.json({ execution: updated });
  } catch (err) { next(err); }
});

router.post('/:id/sync', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const execution = await prisma.execution.findUnique({ where: { id } });
    if (!execution || !execution.jenkinsJobName || !execution.jenkinsBuildNumber) {
      res.status(404).json({ error: 'Execution or Jenkins build details not found' });
      return;
    }

    const consoleText = await jenkinsService.getConsoleText(execution.jenkinsJobName, execution.jenkinsBuildNumber);
    if (!consoleText) {
      res.status(400).json({ error: 'No console logs available from Jenkins for this build' });
      return;
    }

    const parsedMetrics = logParserService.parseLog(consoleText);
    let newStatus = execution.status;
    if (parsedMetrics.failed > 0 || parsedMetrics.hasExecutionFailure) {
      newStatus = 'FAILED';
    } else if (parsedMetrics.total > 0 && parsedMetrics.failed === 0) {
      newStatus = 'PASSED';
    }

    const updates: any = {
      status: newStatus,
      totalTests: parsedMetrics.total,
      passedTests: parsedMetrics.passed,
      failedTests: parsedMetrics.failed,
      skippedTests: parsedMetrics.skipped,
    };

    if (parsedMetrics.failed > 0 && parsedMetrics.testResults.length > 0) {
      const firstFail = parsedMetrics.testResults.find((t) => t.status === 'FAILED');
      if (firstFail) updates.errorDetails = `${firstFail.name}: ${firstFail.error || 'Failed'}`;
    }

    const updated = await prisma.execution.update({ where: { id }, data: updates });

    if (parsedMetrics.testResults.length > 0) {
      await prisma.testResult.deleteMany({ where: { executionId: id } });
      await prisma.testResult.createMany({
        data: parsedMetrics.testResults.map((tr) => ({
          executionId: id,
          name: tr.name,
          status: tr.status,
          error: tr.error || null,
        })),
      });
    }

    webSocketService.emitExecutionUpdated(id, updates);
    res.json({ execution: updated, metrics: parsedMetrics });
  } catch (err) { next(err); }
});

export default router;
