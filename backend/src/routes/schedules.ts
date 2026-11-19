import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../db/client';
import { schedulerService } from '../services/SchedulerService';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

const scheduleSchema = z.object({
  moduleId: z.string().min(1),
  name: z.string().min(1),
  cronExpr: z.string().min(1),
  testCommand: z.string().optional(),
  branch: z.string().default('main'),
  androidDeviceType: z.string().optional(),
  emulatorName: z.string().optional(),
  webTags: z.string().optional(),
  emailRecipients: z.string().optional(),
  isActive: z.boolean().default(true),
});

// GET /api/schedules - Read-only view
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schedules = await prisma.schedule.findMany({
      orderBy: { createdAt: 'desc' },
      include: { module: { select: { id: true, name: true, displayName: true, platform: true, color: true } } },
    });
    res.json({ schedules });
  } catch (err) { next(err); }
});

// POST /api/schedules - Create schedule (Admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = scheduleSchema.parse(req.body);

    // Validate module exists
    const module = await prisma.automationModule.findUnique({ where: { id: data.moduleId } });
    if (!module) { res.status(404).json({ error: 'Module not found' }); return; }

    const schedule = await prisma.schedule.create({
      data: {
        moduleId: data.moduleId,
        name: data.name,
        cronExpr: data.cronExpr,
        testCommand: data.testCommand,
        branch: data.branch || 'main',
        androidDeviceType: data.androidDeviceType,
        emulatorName: data.emulatorName,
        webTags: data.webTags,
        emailRecipients: data.emailRecipients,
        isActive: data.isActive ?? true,
        isPaused: false,
      },
    });

    // Add to scheduler
    schedulerService.addJob({ ...schedule, module });

    res.status(201).json({ schedule });
  } catch (err) { next(err); }
});

// PATCH /api/schedules/:id - Update schedule (Admin only)
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.schedule.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ error: 'Schedule not found' }); return; }

    const schedule = await prisma.schedule.update({
      where: { id },
      data: req.body,
      include: { module: true },
    });

    // Restart scheduler job with new config
    schedulerService.removeJob(schedule.id);
    if (schedule.isActive && !schedule.isPaused) {
      schedulerService.addJob(schedule);
    }

    res.json({ schedule });
  } catch (err) { next(err); }
});

// DELETE /api/schedules/:id - Delete schedule (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.schedule.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ error: 'Schedule not found' }); return; }

    schedulerService.removeJob(id);
    await prisma.schedule.delete({ where: { id } });

    res.json({ message: 'Schedule deleted' });
  } catch (err) { next(err); }
});

// POST /api/schedules/:id/pause - Pause schedule (Admin only)
router.post('/:id/pause', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const schedule = await prisma.schedule.update({
      where: { id },
      data: { isPaused: true },
    });
    schedulerService.removeJob(id);
    res.json({ schedule });
  } catch (err) { next(err); }
});

// POST /api/schedules/:id/resume - Resume schedule (Admin only)
router.post('/:id/resume', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const schedule = await prisma.schedule.update({
      where: { id },
      data: { isPaused: false },
      include: { module: true },
    });
    if (schedule.isActive) {
      schedulerService.addJob(schedule);
    }
    res.json({ schedule });
  } catch (err) { next(err); }
});

// POST /api/schedules/:id/run-now - Trigger schedule now (Admin only)
router.post('/:id/run-now', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const schedule = await prisma.schedule.findUnique({
      where: { id },
    });
    if (!schedule) { res.status(404).json({ error: 'Schedule not found' }); return; }
    
    // Run immediately in background
    schedulerService.runScheduledJob(id).catch(console.error);
    res.json({ message: 'Schedule triggered immediately' });
  } catch (err) { next(err); }
});

export default router;
