import { Router, Request, Response, NextFunction } from 'express';
import { gitHubService } from '../services/GitHubService';
import { gitHubSyncService } from '../services/GitHubSyncService';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/status', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = await gitHubService.checkConnection();
    res.json(status);
  } catch (err) { next(err); }
});

router.get('/branches', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!gitHubService.isConfigured) {
      res.json({ branches: [], warning: 'GitHub not configured' });
      return;
    }
    const branches = await gitHubService.getBranches();
    res.json({ branches: branches.map(b => ({ name: b.name, sha: b.commit.sha, protected: b.protected })) });
  } catch (err) { next(err); }
});

router.get('/commits', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!gitHubService.isConfigured) {
      res.json({ commits: [], warning: 'GitHub not configured' });
      return;
    }
    const branch = req.query.branch as string || 'main';
    const count = parseInt(req.query.count as string || '20');
    const commits = await gitHubService.getCommits(branch, count);
    res.json({
      commits: commits.map(c => ({
        sha: c.sha,
        message: c.commit.message,
        author: c.commit.author.name,
        date: c.commit.author.date,
        url: c.html_url,
      })),
    });
  } catch (err) { next(err); }
});

router.get('/repo', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!gitHubService.isConfigured) {
      res.json({ repo: null, warning: 'GitHub not configured' });
      return;
    }
    const repo = await gitHubService.getRepoInfo();
    res.json({
      repo: {
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        defaultBranch: repo.default_branch,
        language: repo.language,
        url: repo.html_url,
        updatedAt: repo.updated_at,
      },
    });
  } catch (err) { next(err); }
});

// POST /api/github/sync - Admin-only manual synchronization of automation test cases
router.post('/sync', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branch = (req.body?.branch as string) || 'main';
    const result = await gitHubSyncService.syncRepository(branch);
    res.json({
      message: 'GitHub repository automation test cases successfully synchronized',
      result,
    });
  } catch (err: any) {
    next(err);
  }
});

export default router;
