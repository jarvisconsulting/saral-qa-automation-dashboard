import prisma from '../db/client';
import { jenkinsService } from './JenkinsService';
import { webSocketService } from './WebSocketService';
import { logParserService } from './LogParserService';

type ActiveBuild = {
  executionId: string;
  jenkinsJobName: string;
  jenkinsBuildNumber: number;
  logOffset: number;
};

class BuildPollerService {
  private activeBuilds: Map<string, ActiveBuild> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 6000; // 6 seconds for fast reactivity
  private isScanning = false;
  private pendingImports = new Set<string>();

  startPolling(): void {
    if (this.pollingInterval) return;
    this.pollingInterval = setInterval(async () => {
      try {
        await this.pollAllActiveBuilds();
        await this.scanExternalJenkinsBuilds();
      } catch (err) {
        console.error('[BuildPoller] Polling cycle error:', err);
      }
    }, this.POLL_INTERVAL_MS);
    console.log('[BuildPoller] Started polling for active Jenkins builds (interval: 6s)');
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  trackBuild(executionId: string, jenkinsJobName: string, jenkinsBuildNumber: number): void {
    this.activeBuilds.set(executionId, {
      executionId,
      jenkinsJobName,
      jenkinsBuildNumber,
      logOffset: 0,
    });
    console.log(`[BuildPoller] Tracking build ${jenkinsJobName}#${jenkinsBuildNumber} for execution ${executionId}`);
  }

  stopTracking(executionId: string): void {
    this.activeBuilds.delete(executionId);
  }

  async pollAllActiveBuilds(): Promise<void> {
    for (const [executionId, build] of this.activeBuilds) {
      try {
        await this.pollBuild(executionId, build);
      } catch (err) {
        console.error(`[BuildPoller] Error polling build ${executionId}:`, err);
      }
    }
  }

  private async pollBuild(executionId: string, build: ActiveBuild): Promise<void> {
    if (!jenkinsService.isConfigured) return;

    // Get build info
    const buildInfo = await jenkinsService.getBuildInfo(build.jenkinsJobName, build.jenkinsBuildNumber);

    // Fetch new console log lines
    const logResult = await jenkinsService.getConsoleLog(
      build.jenkinsJobName,
      build.jenkinsBuildNumber,
      build.logOffset
    );

    if (logResult.text) {
      build.logOffset = logResult.nextStart;
      webSocketService.emitLogAppend(executionId, logResult.text);
    }

    // Map Jenkins result to our status
    let status = 'RUNNING';
    if (!buildInfo.building) {
      switch (buildInfo.result) {
        case 'SUCCESS': status = 'PASSED'; break;
        case 'FAILURE': status = 'FAILED'; break;
        case 'ABORTED': status = 'CANCELLED'; break;
        case 'UNSTABLE': status = 'FAILED'; break;
        default: status = 'UNKNOWN';
      }
    }

    const updates: any = { status, updatedAt: new Date() };

    if (!buildInfo.building) {
      updates.endTime = new Date(buildInfo.timestamp + buildInfo.duration);
      updates.duration = Math.round(buildInfo.duration / 1000);

      // Try to get Allure report URL
      const allureUrl = await jenkinsService.getAllureReport(build.jenkinsJobName, build.jenkinsBuildNumber);
      if (allureUrl) {
        updates.allureReportUrl = allureUrl;
      }

      // Fetch full console text to parse test results and metrics
      try {
        const consoleText = await jenkinsService.getConsoleText(build.jenkinsJobName, build.jenkinsBuildNumber);
        if (consoleText) {
          const parsedMetrics = logParserService.parseLog(consoleText);

          // Reconcile status with real test execution outcome
          if (parsedMetrics.failed > 0 || parsedMetrics.hasExecutionFailure) {
            status = 'FAILED';
          } else if (parsedMetrics.total > 0 && parsedMetrics.failed === 0 && (buildInfo.result === 'SUCCESS' || consoleText.includes('Finished: SUCCESS'))) {
            status = 'PASSED';
          }

          updates.status = status;
          updates.totalTests = parsedMetrics.total;
          updates.passedTests = parsedMetrics.passed;
          updates.failedTests = parsedMetrics.failed;
          updates.skippedTests = parsedMetrics.skipped;

          if (parsedMetrics.failed > 0 && parsedMetrics.testResults.length > 0) {
            const firstFail = parsedMetrics.testResults.find(t => t.status === 'FAILED');
            if (firstFail) {
              updates.errorDetails = `${firstFail.name}: ${firstFail.error || 'Failed'}`;
            }
          }

          if (parsedMetrics.testResults.length > 0) {
            await prisma.testResult.deleteMany({ where: { executionId } });
            await prisma.testResult.createMany({
              data: parsedMetrics.testResults.map(tr => ({
                executionId,
                name: tr.name,
                status: tr.status,
                error: tr.error || null,
              })),
            });
          }
        }
      } catch (parseErr) {
        console.error(`[BuildPoller] Error extracting test metrics for ${executionId}:`, parseErr);
      }
    }

    await prisma.execution.update({ where: { id: executionId }, data: updates });
    webSocketService.emitExecutionUpdated(executionId, updates);

    if (!buildInfo.building) {
      this.stopTracking(executionId);
      webSocketService.emitExecutionCompleted(executionId, {
        status,
        jenkinsBuildNumber: build.jenkinsBuildNumber,
        duration: updates.duration,
      });
      console.log(`[BuildPoller] Build ${executionId} completed: ${status}`);
    }
  }

  /**
   * Scan Jenkins for external builds (triggered directly from Jenkins UI, CLI, or timers).
   * Automatically ingests active running builds into Live Executions and records completed builds.
   */
  async scanExternalJenkinsBuilds(): Promise<void> {
    if (!jenkinsService.isConfigured || this.isScanning) return;
    this.isScanning = true;

    try {
      const modules = await prisma.automationModule.findMany({
        where: { jenkinsJobName: { not: null }, isActive: true },
      });
      if (modules.length === 0) return;

      const moduleMap = new Map<string, typeof modules[0]>();
      for (const m of modules) {
        if (m.jenkinsJobName) {
          moduleMap.set(m.jenkinsJobName.toLowerCase(), m);
        }
      }

      // Fetch top 5 builds per job across Jenkins
      const jobs = await jenkinsService.getAllRecentBuilds(5);

      for (const job of jobs) {
        const mod = moduleMap.get(job.name.toLowerCase());
        if (!mod || !job.builds || job.builds.length === 0) continue;

        // Process builds from oldest to newest so history stays chronological
        const sortedBuilds = [...job.builds].sort((a, b) => a.number - b.number);

        for (const build of sortedBuilds) {
          const importKey = `${job.name}#${build.number}`;
          if (this.pendingImports.has(importKey)) continue;

          // Check if execution already exists in DB
          const existing = await prisma.execution.findFirst({
            where: {
              jenkinsJobName: mod.jenkinsJobName,
              jenkinsBuildNumber: build.number,
            },
          });

          if (!existing) {
            // New unrecorded build discovered from Jenkins!
            this.pendingImports.add(importKey);
            try {
              await this.importExternalBuild(mod, build);
            } finally {
              this.pendingImports.delete(importKey);
            }
          } else if (existing.status === 'RUNNING' || existing.status === 'QUEUED' || existing.status === 'PENDING') {
            // If already recorded as running, ensure it's actively tracked in memory
            if (build.building && !this.activeBuilds.has(existing.id)) {
              this.trackBuild(existing.id, mod.jenkinsJobName!, build.number);
            }
          }
        }
      }
    } catch (err) {
      console.error('[BuildPoller] Error scanning external Jenkins builds:', err);
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Import an externally-triggered Jenkins build into PostgreSQL and broadcast to connected clients
   */
  private async importExternalBuild(
    mod: { id: string; name: string; displayName: string; jenkinsJobName: string | null; platform: string; framework: string },
    build: { number: number; url: string; building: boolean; timestamp: number; duration: number; result: string | null }
  ): Promise<void> {
    try {
      console.log(`[BuildPoller] Discovered external Jenkins build: ${mod.jenkinsJobName}#${build.number} (building=${build.building})`);

      const buildInfo = await jenkinsService.getBuildInfo(mod.jenkinsJobName!, build.number);

      // Extract parameters
      const paramAction = buildInfo.actions?.find((a: any) => a.parameters);
      const params = paramAction?.parameters || [];
      const testCommand = params.find((p: any) => p.name === 'TEST_COMMAND')?.value || null;
      const webTags = params.find((p: any) => p.name === 'WEB_TAGS' || p.name === 'CUCUMBER_TAGS')?.value || null;
      const androidDeviceType = params.find((p: any) => p.name === 'ANDROID_DEVICE_TYPE')?.value || null;
      const emulatorName = params.find((p: any) => p.name === 'EMULATOR_NAME')?.value || null;
      const emailRecipients = params.find((p: any) => p.name === 'EMAIL')?.value || null;

      // Extract cause / triggeredBy
      const causeAction = buildInfo.actions?.find((a: any) => a.causes);
      const firstCause = causeAction?.causes?.[0];
      const triggeredBy = firstCause?.userName || firstCause?.userId || firstCause?.shortDescription || 'Jenkins';

      let triggerType = 'MANUAL';
      const causeDesc = (firstCause?.shortDescription || '').toLowerCase();
      if (causeDesc.includes('timer') || causeDesc.includes('schedule') || causeDesc.includes('periodic')) {
        triggerType = 'SCHEDULED';
      } else if (causeDesc.includes('push') || causeDesc.includes('github') || causeDesc.includes('webhook')) {
        triggerType = 'WEBHOOK';
      }

      const startTime = new Date(buildInfo.timestamp || build.timestamp);

      // Case 1: Build is currently RUNNING on Jenkins
      if (build.building) {
        const execution = await prisma.execution.create({
          data: {
            moduleId: mod.id,
            jenkinsJobName: mod.jenkinsJobName,
            jenkinsBuildNumber: build.number,
            jenkinsBuildUrl: buildInfo.url || build.url,
            testCommand,
            triggerType,
            platform: mod.platform,
            framework: mod.framework,
            environment: 'staging',
            branch: 'main',
            status: 'RUNNING',
            startTime,
            triggeredBy,
            webTags,
            androidDeviceType,
            emulatorName,
            emailRecipients,
          },
          include: {
            module: { select: { id: true, name: true, displayName: true, platform: true, color: true } },
          },
        });

        // Broadcast to all dashboard clients immediately
        webSocketService.emitExecutionCreated(execution as any);

        // Put into poller tracking map so live console logs stream and final status is recorded
        this.trackBuild(execution.id, mod.jenkinsJobName!, build.number);
        console.log(`[BuildPoller] Successfully ingested RUNNING external build ${mod.jenkinsJobName}#${build.number} -> Execution ${execution.id}`);
        return;
      }

      // Case 2: Build has already completed on Jenkins
      let status = 'PASSED';
      if (buildInfo.result === 'FAILURE' || buildInfo.result === 'UNSTABLE') {
        status = 'FAILED';
      } else if (buildInfo.result === 'ABORTED') {
        status = 'CANCELLED';
      }

      const durationMs = buildInfo.duration || build.duration || 0;
      const endTime = new Date(startTime.getTime() + durationMs);
      const durationSec = Math.round(durationMs / 1000);

      // Allure report
      const allureReportUrl = await jenkinsService.getAllureReport(mod.jenkinsJobName!, build.number);

      // Fetch console log to extract real test case metrics
      let totalTests = 0;
      let passedTests = 0;
      let failedTests = 0;
      let skippedTests = 0;
      let errorDetails: string | null = null;
      let testResultsToCreate: Array<{ name: string; status: string; error?: string | null }> = [];

      try {
        const consoleText = await jenkinsService.getConsoleText(mod.jenkinsJobName!, build.number);
        if (consoleText) {
          const parsed = logParserService.parseLog(consoleText);
          totalTests = parsed.total;
          passedTests = parsed.passed;
          failedTests = parsed.failed;
          skippedTests = parsed.skipped;

          // Reconcile status with real execution outcome
          if (parsed.failed > 0 || parsed.hasExecutionFailure) {
            status = 'FAILED';
          } else if (parsed.total > 0 && parsed.failed === 0 && (buildInfo.result === 'SUCCESS' || consoleText.includes('Finished: SUCCESS'))) {
            status = 'PASSED';
          }

          if (parsed.failed > 0 && parsed.testResults.length > 0) {
            const firstFail = parsed.testResults.find(t => t.status === 'FAILED');
            if (firstFail) {
              errorDetails = `${firstFail.name}: ${firstFail.error || 'Failed'}`;
            }
          }

          testResultsToCreate = parsed.testResults;
        }
      } catch (parseErr) {
        console.error(`[BuildPoller] Error parsing console log for external build ${mod.jenkinsJobName}#${build.number}:`, parseErr);
      }

      const execution = await prisma.execution.create({
        data: {
          moduleId: mod.id,
          jenkinsJobName: mod.jenkinsJobName,
          jenkinsBuildNumber: build.number,
          jenkinsBuildUrl: buildInfo.url || build.url,
          testCommand,
          triggerType,
          platform: mod.platform,
          framework: mod.framework,
          environment: 'staging',
          branch: 'main',
          status,
          startTime,
          endTime,
          duration: durationSec,
          totalTests,
          passedTests,
          failedTests,
          skippedTests,
          errorDetails,
          allureReportUrl,
          triggeredBy,
          webTags,
          androidDeviceType,
          emulatorName,
          emailRecipients,
          testResults: testResultsToCreate.length > 0 ? {
            create: testResultsToCreate.map(tr => ({
              name: tr.name,
              status: tr.status,
              error: tr.error || null,
            })),
          } : undefined,
        },
        include: {
          module: { select: { id: true, name: true, displayName: true, platform: true, color: true } },
        },
      });

      // Broadcast creation and completion
      webSocketService.emitExecutionCreated(execution as any);
      webSocketService.emitExecutionCompleted(execution.id, {
        status,
        jenkinsBuildNumber: build.number,
        duration: durationSec,
      });

      console.log(`[BuildPoller] Successfully ingested completed external build ${mod.jenkinsJobName}#${build.number} -> Execution ${execution.id} (${status}, ${totalTests} tests)`);
    } catch (importErr) {
      console.error(`[BuildPoller] Failed to import external build ${mod.jenkinsJobName}#${build.number}:`, importErr);
    }
  }

  // Resume tracking on server restart for RUNNING builds and backfill metrics
  async resumeActiveBuilds(): Promise<void> {
    if (!jenkinsService.isConfigured) return;

    // 1. Scan Jenkins to detect any external builds
    await this.scanExternalJenkinsBuilds();

    // 2. Resume tracking in-flight builds
    const runningExecutions = await prisma.execution.findMany({
      where: { status: { in: ['RUNNING', 'QUEUED', 'PENDING'] } },
    });
    for (const exec of runningExecutions) {
      if (exec.jenkinsBuildNumber && exec.jenkinsJobName) {
        this.trackBuild(exec.id, exec.jenkinsJobName, exec.jenkinsBuildNumber);
      }
    }
    console.log(`[BuildPoller] Resumed tracking ${runningExecutions.length} active builds`);

    // 3. Backfill any completed builds that currently have 0 tests recorded
    this.syncCompletedExecutionsWithoutMetrics().catch(console.error);
  }

  async syncCompletedExecutionsWithoutMetrics(): Promise<void> {
    if (!jenkinsService.isConfigured) return;
    try {
      const targetExecutions = await prisma.execution.findMany({
        where: {
          totalTests: 0,
          jenkinsBuildNumber: { not: null },
          jenkinsJobName: { not: null },
          status: { in: ['PASSED', 'FAILED', 'UNKNOWN'] },
        },
      });

      for (const exec of targetExecutions) {
        if (!exec.jenkinsJobName || !exec.jenkinsBuildNumber) continue;
        const consoleText = await jenkinsService.getConsoleText(exec.jenkinsJobName, exec.jenkinsBuildNumber);
        if (!consoleText) continue;

        const parsedMetrics = logParserService.parseLog(consoleText);
        let newStatus = exec.status;
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
          const firstFail = parsedMetrics.testResults.find(t => t.status === 'FAILED');
          if (firstFail) {
            updates.errorDetails = `${firstFail.name}: ${firstFail.error || 'Failed'}`;
          }
        }

        await prisma.execution.update({
          where: { id: exec.id },
          data: updates,
        });

        if (parsedMetrics.testResults.length > 0) {
          await prisma.testResult.deleteMany({ where: { executionId: exec.id } });
          await prisma.testResult.createMany({
            data: parsedMetrics.testResults.map(tr => ({
              executionId: exec.id,
              name: tr.name,
              status: tr.status,
              error: tr.error || null,
            })),
          });
        }
        console.log(`[BuildPoller] Backfilled test metrics for execution ${exec.id} (${exec.jenkinsJobName}#${exec.jenkinsBuildNumber}): ${parsedMetrics.total} total (${parsedMetrics.passed}P, ${parsedMetrics.failed}F)`);
      }
    } catch (err) {
      console.error('[BuildPoller] Error backfilling test metrics:', err);
    }
  }
}

export const buildPollerService = new BuildPollerService();
export default buildPollerService;
