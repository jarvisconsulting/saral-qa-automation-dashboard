import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { GITHUB_WEBHOOK_SECRET } from '../config';

export const verifyGitHubWebhook = (req: Request, res: Response, next: NextFunction): void => {
  const signature = req.headers['x-hub-signature-256'] as string;
  if (!GITHUB_WEBHOOK_SECRET) {
    // Skip verification if secret not configured
    next();
    return;
  }
  if (!signature) {
    res.status(401).json({ error: 'Missing webhook signature' });
    return;
  }
  const hmac = crypto.createHmac('sha256', GITHUB_WEBHOOK_SECRET);
  const body = JSON.stringify(req.body);
  const expected = 'sha256=' + hmac.update(body).digest('hex');
  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }
  next();
};
