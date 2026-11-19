import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../db/client';
import { jenkinsService } from '../services/JenkinsService';
import { buildPollerService } from '../services/BuildPollerService';

const router = Router();

router.get('/status', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = await jenkinsService.checkConnection();
    res.json(status);
  } catch (err) { next(err); }
});

router.get('/jobs', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!jenkinsService.isConfigured) {
      res.json({ jobs: [], warning: 'Jenkins not configured' });
      return;
    }
    const jobs = await jenkinsService.listJobs();
    res.json({ jobs });
  } catch (err) { next(err); }
});

router.get('/jobs/:jobName', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!jenkinsService.isConfigured) {
      res.status(503).json({ error: 'Jenkins not configured' });
      return;
    }
    const jobName = req.params.jobName as string;
    const jobInfo = await jenkinsService.getJobInfo(jobName);
    res.json({ job: jobInfo });
  } catch (err) { next(err); }
});

router.get('/jobs/:jobName/builds', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!jenkinsService.isConfigured) {
      res.status(503).json({ error: 'Jenkins not configured' });
      return;
    }
    const jobName = req.params.jobName as string;
    const count = parseInt(req.query.count as string || '20');
    const builds = await jenkinsService.getBuildHistory(jobName, count);
    res.json({ builds });
  } catch (err) { next(err); }
});

router.get('/jobs/:jobName/builds/:buildNumber', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!jenkinsService.isConfigured) {
      res.status(503).json({ error: 'Jenkins not configured' });
      return;
    }
    const jobName = req.params.jobName as string;
    const buildNumber = req.params.buildNumber as string;
    const buildInfo = await jenkinsService.getBuildInfo(jobName, parseInt(buildNumber));
    res.json({ build: buildInfo });
  } catch (err) { next(err); }
});

router.get('/jobs/:jobName/builds/:buildNumber/logs', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!jenkinsService.isConfigured) {
      res.status(503).json({ error: 'Jenkins not configured' });
      return;
    }
    const jobName = req.params.jobName as string;
    const buildNumber = req.params.buildNumber as string;
    const start = parseInt(req.query.start as string || '0');
    const logs = await jenkinsService.getConsoleLog(jobName, parseInt(buildNumber), start);
    res.json(logs);
  } catch (err) { next(err); }
});

router.get('/jobs/:jobName/parameters', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!jenkinsService.isConfigured) {
      res.status(503).json({ error: 'Jenkins not configured' });
      return;
    }
    const jobName = req.params.jobName as string;
    const params = await jenkinsService.getJobParameters(jobName);
    res.json({ parameters: params });
  } catch (err) { next(err); }
});

router.post('/sync', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!jenkinsService.isConfigured) {
      res.status(503).json({ error: 'Jenkins not configured' });
      return;
    }
    await buildPollerService.scanExternalJenkinsBuilds();
    res.json({ success: true, message: 'Jenkins synchronization completed' });
  } catch (err) { next(err); }
});

export default router;
