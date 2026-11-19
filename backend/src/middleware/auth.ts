import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import prisma from '../db/client';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name: string;
  isActive?: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No authentication token provided. Please log in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    
    // Validate that the user exists and is actively enabled in PostgreSQL
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!dbUser) {
      res.status(401).json({ error: 'User account not found' });
      return;
    }

    if (!dbUser.isActive) {
      res.status(403).json({ error: 'Your account has been deactivated. Please contact an administrator.' });
      return;
    }

    req.user = dbUser;
    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid or expired session token. Please log in again.' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Admin and QA Lead hold administrative privileges
  if (req.user.role !== 'ADMIN' && req.user.role !== 'QA_LEAD') {
    res.status(403).json({
      error: 'Permission denied: Administrator privileges required for this operation.',
      userRole: req.user.role,
    });
    return;
  }

  next();
};
