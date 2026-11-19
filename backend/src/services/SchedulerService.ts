import cron from 'node-cron';
import prisma from '../db/client';
import { jenkinsService } from './JenkinsService';
import { buildPollerService } from './BuildPollerService';
import { webSocketService } from './WebSocketService';
import { gitHubSyncService } from './GitHubSyncService';

class SchedulerService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  async initialize(): Promise<void> {
    const schedules = await prisma.schedule.findMany({
      where: { isActive: true, isPaused: false },
      include: { module: true },
    });

    for (const schedule of schedules) {
      this.addJob(schedule);
    }

    // Schedule automated periodic GitHub automation repository synchronization every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      console.log('[Scheduler] Executing scheduled GitHub repository test case synchronization...');
      try {
        await gitHubSyncService.syncRepository('main');
      } catch (err: any) {
        console.error('[Scheduler] Scheduled GitHub synchronization failed:', err.message);
      }
    });

    // Run initial synchronization on server startup
    gitHubSyncService.syncRepository('main').catch((err) => {
      console.error('[Scheduler] Initial startup GitHub synchronization failed:', err.message);
    });

    console.log(`[Scheduler] Initialized ${schedules.length} scheduled jobs + automated GitHub repo sync`);
  }

  addJob(schedule: any): void {
    if (this.jobs.has(schedule.id)) {
      this.jobs.get(schedule.id)!.stop();
    }

    if (!cron.validate(schedule.cronExpr)) {
      console.warn(`[Scheduler] Invalid cron expression for schedule ${schedule.id}: ${schedule.cronExpr}`);
      return;
    }

    const task = cron.schedule(schedule.cronExpr, async () => {
      console.log(`[Scheduler] Running scheduled job: ${schedule.name}`);
      await this.runScheduledJob(schedule.id);
    });

    this.jobs.set(schedule.id, task);
    console.log(`[Scheduler] Added job for schedule: ${schedule.name} (${schedule.cronExpr})`);
  }

  async runScheduledJob(scheduleId: string): Promise<void> {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { module: true },
    });

    if (!schedule || !schedule.isActive || schedule.isPaused) return;

    try {
      const jenkinsParams: Record<string, string> = {};
      if (schedule.testCommand) jenkinsParams.TEST_COMMAND = schedule.testCommand;
      if (schedule.webTags) {
        jenkinsParams.WEB_TAGS = schedule.webTags;
        const cleanTag = schedule.webTags.replace(/^@+/, '').trim();
        const knownTags = ['Regression', 'Smoke', 'Login', 'WithValidNumber', 'WithValidEmailId', 'UserManagement', 'ProfilePage', 'DynamicCampaignsCreation'];
        const matchedTag = knownTags.find((t) => t.toLowerCase() === cleanTag.toLowerCase());
        jenkinsParams.CUCUMBER_TAGS = matchedTag || (cleanTag.charAt(0).toUpperCase() + cleanTag.slice(1));
      }
      if (schedule.androidDeviceType) jenkinsParams.ANDROID_DEVICE_TYPE = schedule.androidDeviceType;
      if (schedule.emulatorName) jenkinsParams.EMULATOR_NAME = schedule.emulatorName;
      if (schedule.emailRecipients) jenkinsParams.EMAIL = schedule.emailRecipients;

      const execution = await prisma.execution.create({
        data: {
          moduleId: schedule.moduleId,
          jenkinsJobName: schedule.module.jenkinsJobName || undefined,
          testCommand: schedule.testCommand || undefined,
          triggerType: 'SCHEDULED',
          platform: schedule.module.platform,
          framework: schedule.module.framework,
          environment: 'staging',
          branch: schedule.branch || 'main',
          androidDeviceType: schedule.androidDeviceType || undefined,
          emulatorName: schedule.emulatorName || undefined,
          webTags: schedule.webTags || undefined,
          emailRecipients: schedule.emailRecipients || undefined,
          status: 'QUEUED',
        },
      });

      webSocketService.emitExecutionCreated(execution as any);

      if (jenkinsService.isConfigured && schedule.module.jenkinsJobName) {
        const queueItemId = await jenkinsService.triggerBuild(schedule.module.jenkinsJobName, jenkinsParams);
        await prisma.execution.update({
          where: { id: execution.id },
          data: { queueItemId, status: 'QUEUED' },
        });

        const buildNumber = await jenkinsService.waitForBuildStart(queueItemId);
        if (buildNumber) {
          const buildUrl = `${process.env.JENKINS_URL}/job/${schedule.module.jenkinsJobName}/${buildNumber}/`;
          await prisma.execution.update({
            where: { id: execution.id },
            data: {
              jenkinsBuildNumber: buildNumber,
              jenkinsBuildUrl: buildUrl,
              status: 'RUNNING',
              startTime: new Date(),
            },
          });
          buildPollerService.trackBuild(execution.id, schedule.module.jenkinsJobName, buildNumber);
        }
      }

      await prisma.schedule.update({
        where: { id: scheduleId },
        data: { lastRunAt: new Date(), lastStatus: 'triggered' },
      });
    } catch (err: any) {
      console.error(`[Scheduler] Error running schedule ${scheduleId}:`, err);
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: { lastRunAt: new Date(), lastStatus: 'error' },
      });
    }
  }

  removeJob(scheduleId: string): void {
    const task = this.jobs.get(scheduleId);
    if (task) {
      task.stop();
      this.jobs.delete(scheduleId);
    }
  }

  stopAll(): void {
    for (const task of this.jobs.values()) {
      task.stop();
    }
    this.jobs.clear();
  }
}

export const schedulerService = new SchedulerService();
export default schedulerService;
