import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../db/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// All user management routes require valid authentication and Administrator privileges
router.use(authenticate, requireAdmin);

const createUserSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'READ_ONLY']).default('READ_ONLY'),
  isActive: z.boolean().default(true),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'READ_ONLY']).optional(),
  isActive: z.boolean().optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// GET /api/users - List all users
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ users });
  } catch (err) {
    next(err);
  }
});

// POST /api/users - Create new user
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createUserSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(409).json({ error: 'A user with this email address already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role,
        isActive: data.isActive,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({ user, message: 'User created successfully' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id - Update user details or toggle status
router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = updateUserSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Safeguard 1: Prevent an admin from deactivating or demoting themselves
    if (req.user?.id === id) {
      if (data.isActive === false) {
        res.status(400).json({ error: 'You cannot deactivate your own administrative account' });
        return;
      }
      if (data.role && data.role !== 'ADMIN') {
        res.status(400).json({ error: 'You cannot revoke your own administrative role' });
        return;
      }
    }

    // Safeguard 2: Prevent deactivating or demoting the last active admin
    if ((data.isActive === false || (data.role && data.role !== 'ADMIN')) && existingUser.role === 'ADMIN') {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (activeAdminCount <= 1) {
        res.status(400).json({ error: 'Cannot deactivate or demote the last remaining active Administrator' });
        return;
      }
    }

    // Safeguard 3: If changing email, check for duplicate
    if (data.email && data.email !== existingUser.email) {
      const emailConflict = await prisma.user.findUnique({ where: { email: data.email } });
      if (emailConflict) {
        res.status(409).json({ error: 'A user with this email address already exists' });
        return;
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ user: updated, message: 'User updated successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/:id/reset-password - Admin reset password
router.post('/:id/reset-password', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { newPassword } = resetPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    res.json({ message: `Password reset successfully for ${user.email}` });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    // Safeguard 1: Admin cannot delete themselves
    if (req.user?.id === id) {
      res.status(400).json({ error: 'You cannot delete your own user account' });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Safeguard 2: Prevent deleting the last active admin
    if (targetUser.role === 'ADMIN') {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (activeAdminCount <= 1) {
        res.status(400).json({ error: 'Cannot delete the last remaining active Administrator' });
        return;
      }
    }

    await prisma.user.delete({ where: { id } });

    res.json({ message: `User ${targetUser.email} deleted successfully` });
  } catch (err) {
    next(err);
  }
});

export default router;
