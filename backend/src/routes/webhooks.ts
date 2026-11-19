import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../db/client';
import { verifyGitHubWebhook } from '../middleware/webhookVerify';
import { gitHubSyncService } from '../services/GitHubSyncService';

const router = Router();

// GitHub push webhook handler
router.post('/github', verifyGitHubWebhook, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = req.headers['x-github-event'] as string;
    const deliveryId = req.headers['x-github-delivery'] as string;
    const payload = req.body;

    // Store the webhook event
    await prisma.webhookEvent.upsert({
      where: { deliveryId: deliveryId || `no-delivery-${Date.now()}` },
      create: {
        source: 'github',
        eventType: event || 'unknown',
        deliveryId: deliveryId,
        repoFullName: payload.repository?.full_name,
        branch: payload.ref ? payload.ref.replace('refs/heads/', '') : null,
        commitSha: payload.after || payload.head_commit?.id,
        pusherName: payload.pusher?.name,
        changedFiles: payload.commits
          ? JSON.stringify(payload.commits.flatMap((c: any) => [...(c.added || []), ...(c.modified || []), ...(c.removed || [])]))
          : null,
        payload: JSON.stringify(payload),
        signature: req.headers['x-hub-signature-256'] as string,
      },
      update: { processed: false },
    });

    // Trigger asynchronous test case synchronization on push event
    if (event === 'push') {
      gitHubSyncService.syncFromWebhook(payload).catch((err) => {
        console.error('[Webhooks] GitHub push sync error:', err.message);
      });
    }

    // Acknowledge immediately
    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
});

// Jenkins build notification webhook
router.post('/jenkins', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payload = req.body;

    // Store the event
    await prisma.webhookEvent.create({
      data: {
        source: 'jenkins',
        eventType: payload.phase || 'build',
        payload: JSON.stringify(payload),
        processed: false,
      },
    });

    // If build completed, try to find and update the matching execution
    if (payload.build?.phase === 'FINISHED' && payload.build?.number && payload.name) {
      const execution = await prisma.execution.findFirst({
        where: {
          jenkinsJobName: payload.name,
          jenkinsBuildNumber: payload.build.number,
          status: { in: ['RUNNING', 'QUEUED'] },
        },
      });

      if (execution) {
        const statusMap: Record<string, string> = {
          SUCCESS: 'PASSED',
          FAILURE: 'FAILED',
          ABORTED: 'CANCELLED',
          UNSTABLE: 'FAILED',
        };
        const status = statusMap[payload.build.status] || 'UNKNOWN';
        await prisma.execution.update({
          where: { id: execution.id },
          data: {
            status,
            endTime: new Date(),
            duration: payload.build.duration ? Math.round(payload.build.duration / 1000) : null,
          },
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
});

// Get recent webhook events
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const events = await prisma.webhookEvent.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, source: true, eventType: true, deliveryId: true,
        repoFullName: true, branch: true, commitSha: true, pusherName: true,
        processed: true, createdAt: true,
      },
    });
    res.json({ events });
  } catch (err) { next(err); }
});

export default router;
