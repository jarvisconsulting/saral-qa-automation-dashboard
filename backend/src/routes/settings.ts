import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../db/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await prisma.setting.findMany();
    const result: Record<string, any> = {};
    for (const s of settings) {
      try { result[s.key] = JSON.parse(s.value); } catch { result[s.key] = s.value; }
    }
    // Add read-only integration status (no credentials leaked)
    result['jenkinsConfigured'] = !!(process.env.JENKINS_URL && process.env.JENKINS_USER && process.env.JENKINS_TOKEN);
    result['githubConfigured'] = !!(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO_OWNER);
    result['environment'] = 'staging';
    result['jenkinsUrl'] = process.env.JENKINS_URL || 'http://34.131.246.72:8080';
    result['jenkinsJobName'] = process.env.JENKINS_JOB_NAME || 'event-module-automation';
    result['githubRepo'] = `${process.env.GITHUB_REPO_OWNER || 'saral'}/${process.env.GITHUB_REPO_NAME || 'saral-automation'}`;
    res.json({ settings: result });
  } catch (err) { next(err); }
});

router.put('/:key', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const key = req.params.key as string;
    const { value } = req.body;
    // Protect sensitive keys from direct overwrite without env
    const protectedKeys = ['jenkinsToken', 'githubToken', 'webhookSecret'];
    if (protectedKeys.includes(key)) {
      res.status(403).json({ error: 'Sensitive credentials must be configured via environment variables (.env)' });
      return;
    }
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) },
    });
    res.json({ setting });
  } catch (err) { next(err); }
});

export default router;
