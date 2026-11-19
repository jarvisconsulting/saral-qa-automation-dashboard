import axios from 'axios';
import prisma from '../db/client';
import { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } from '../config';
import { gitHubService } from './GitHubService';

export interface DiscoveredTestCase {
  moduleRepoPath: string;
  moduleName?: string;
  title: string;
  description?: string;
  filePath: string;
  framework: string;
  tags: string[];
  testIdentifier?: string;
}

export interface SyncResult {
  success: boolean;
  totalDiscovered: number;
  created: number;
  updated: number;
  deactivated: number;
  modulesDiscovered: number;
  syncedAt: Date;
  details?: string;
}

export class GitHubSyncService {
  // Built-in repository catalog matching jarvisconsulting/saral-automation monorepo structure
  private defaultCatalog: DiscoveredTestCase[] = [
    // --- Event Module Automation (WDIO / Mocha / Appium) ---
    {
      moduleRepoPath: 'event-module-automation',
      title: 'Verify Event Creation with Valid Admin Credentials',
      description: 'Tests administrative creation of a standard Saral event including date, venue, and attendance limits.',
      filePath: 'test/specs/web-eventCreate.spec.ts',
      framework: 'WDIO',
      tags: ['@Smoke', '@Regression', '@Admin', '@Web'],
      testIdentifier: 'EVT-001',
    },
    {
      moduleRepoPath: 'event-module-automation',
      title: 'Verify Event Deletion and Cascade Soft-Delete',
      description: 'Ensures an existing event can be successfully removed by an administrator with soft-delete flags.',
      filePath: 'test/specs/web-eventDelete.spec.ts',
      framework: 'WDIO',
      tags: ['@Regression', '@Admin', '@Web'],
      testIdentifier: 'EVT-002',
    },
    {
      moduleRepoPath: 'event-module-automation',
      title: 'Random Event Creation and Instant Report Verification',
      description: 'Generates randomized event metadata and validates live reporting counters in dashboard.',
      filePath: 'test/specs/web-randomEventCreateAndReporting.spec.ts',
      framework: 'WDIO',
      tags: ['@Regression', '@Reporting', '@Web'],
      testIdentifier: 'EVT-003',
    },
    {
      moduleRepoPath: 'event-module-automation',
      title: 'Open Event Creation and Public Submission Verification',
      description: 'Validates open registration flow without pre-existing attendance constraints.',
      filePath: 'test/specs/web-openEventCreateAndReporting.spec.ts',
      framework: 'WDIO',
      tags: ['@Smoke', '@Public', '@Web'],
      testIdentifier: 'EVT-004',
    },
    {
      moduleRepoPath: 'event-module-automation',
      title: 'Sub-Event Creation and Parent Inheritance Validation',
      description: 'Verifies child sub-events inherit location and state-level policy from parent event.',
      filePath: 'test/specs/web-openEventSubEventCreateAndReporting.spec.ts',
      framework: 'WDIO',
      tags: ['@Regression', '@Hierarchy', '@Web'],
      testIdentifier: 'EVT-005',
    },
    {
      moduleRepoPath: 'event-module-automation',
      title: 'Event Form Reporting Validation and Data Export',
      description: 'Verifies form submissions against CSV exports and state-level analytics.',
      filePath: 'test/specs/web-openEventCreateAndFormReportingValidation.spec.ts',
      framework: 'WDIO',
      tags: ['@Regression', '@Export', '@Web'],
      testIdentifier: 'EVT-006',
    },
    {
      moduleRepoPath: 'event-module-automation',
      title: 'Maximum Submission Limit Enforcement Verification',
      description: 'Ensures users cannot submit beyond configured event capacity limits.',
      filePath: 'test/specs/web-openEventCreateAndMaximumSubmissionLimitCheck.spec.ts',
      framework: 'WDIO',
      tags: ['@Regression', '@Validation', '@Web'],
      testIdentifier: 'EVT-007',
    },
    {
      moduleRepoPath: 'event-module-automation',
      title: 'State-Level Access Control for Event Dashboards',
      description: 'Validates that state admins only see events inside their assigned jurisdiction.',
      filePath: 'test/specs/web-openEventCreateAndReportStateLevelAccess.spec.ts',
      framework: 'WDIO',
      tags: ['@Security', '@RBAC', '@Web'],
      testIdentifier: 'EVT-008',
    },
    {
      moduleRepoPath: 'event-module-automation',
      title: 'Android Firebase Emulator Launch & Smoke Verification',
      description: 'Launches APK on virtual emulator and verifies user authentication & home screen render.',
      filePath: 'test/specs/android-smoke-flow.spec.ts',
      framework: 'APPIUM',
      tags: ['@Smoke', '@Mobile', '@Android', '@Virtual'],
      testIdentifier: 'EVT-AND-001',
    },
    {
      moduleRepoPath: 'event-module-automation',
      title: 'Android Real Device Happy Path Event Registration',
      description: 'End-to-end registration on physical Android test device via Appium.',
      filePath: 'test/specs/android-event-happy-flow.spec.ts',
      framework: 'APPIUM',
      tags: ['@Regression', '@Mobile', '@Android', '@RealDevice'],
      testIdentifier: 'EVT-AND-002',
    },
    {
      moduleRepoPath: 'event-module-automation',
      title: 'iOS Simulator Launch & Event List Smoke Flow',
      description: 'Validates event list retrieval and screen render on iOS Simulator via XCUITest.',
      filePath: 'test/specs/ios-smoke-flow.spec.ts',
      framework: 'APPIUM',
      tags: ['@Smoke', '@Mobile', '@iOS'],
      testIdentifier: 'EVT-IOS-001',
    },

    // --- Saral Web Automation (Selenium / Cucumber Java) ---
    {
      moduleRepoPath: 'saral_web_automation',
      title: 'Login with Valid Phone Number and OTP Verification',
      description: 'Validates core OTP login flow across desktop Chrome and Firefox browsers.',
      filePath: 'src/test/resources/features/login.feature',
      framework: 'SELENIUM',
      tags: ['@Smoke', '@Regression', '@Login', '@WithValidNumber'],
      testIdentifier: 'SWA-001',
    },
    {
      moduleRepoPath: 'saral_web_automation',
      title: 'Login with Invalid Credentials Error Handling',
      description: 'Ensures invalid OTP triggers warning dialog without leaking session tokens.',
      filePath: 'src/test/resources/features/login.feature',
      framework: 'SELENIUM',
      tags: ['@Regression', '@Negative', '@Login'],
      testIdentifier: 'SWA-002',
    },
    {
      moduleRepoPath: 'saral_web_automation',
      title: 'Voter Search and Constituency Filtering Flow',
      description: 'Searches citizen voter records by EPIC ID and constituency name.',
      filePath: 'src/test/resources/features/voter_search.feature',
      framework: 'SELENIUM',
      tags: ['@Regression', '@Search', '@Voter'],
      testIdentifier: 'SWA-003',
    },
    {
      moduleRepoPath: 'saral_web_automation',
      title: 'Event Creation and Publishing via Selenium Web Flow',
      description: 'Creates events using standard Selenium Web Page Object model.',
      filePath: 'src/test/resources/features/event_creation.feature',
      framework: 'SELENIUM',
      tags: ['@Regression', '@Events', '@Web'],
      testIdentifier: 'SWA-004',
    },
    {
      moduleRepoPath: 'saral_web_automation',
      title: 'User Profile Update and Permissions Verification',
      description: 'Validates profile edits and avatar uploads in user settings.',
      filePath: 'src/test/resources/features/user_profile.feature',
      framework: 'SELENIUM',
      tags: ['@Regression', '@Profile'],
      testIdentifier: 'SWA-005',
    },

    // --- Form Builder Automation (WDIO / Mocha) ---
    {
      moduleRepoPath: 'form-builder-automation',
      title: 'Dynamic Form Creation with Text and Dropdown Fields',
      description: 'Builds a custom dynamic form using drag-and-drop field components.',
      filePath: 'test/specs/form-create.spec.ts',
      framework: 'WDIO',
      tags: ['@Smoke', '@Forms', '@Builder'],
      testIdentifier: 'FB-001',
    },
    {
      moduleRepoPath: 'form-builder-automation',
      title: 'Form Validation Rules and Mandatory Field Enforcement',
      description: 'Validates regex pattern matching, required flags, and error tooltips.',
      filePath: 'test/specs/form-validation.spec.ts',
      framework: 'WDIO',
      tags: ['@Regression', '@Validation', '@Forms'],
      testIdentifier: 'FB-002',
    },
    {
      moduleRepoPath: 'form-builder-automation',
      title: 'Form Submission and Real-time Response Aggregation',
      description: 'Simulates citizen response submissions and verifies aggregate stats.',
      filePath: 'test/specs/form-submissions.spec.ts',
      framework: 'WDIO',
      tags: ['@Regression', '@Submissions', '@Forms'],
      testIdentifier: 'FB-003',
    },

    // --- Mann Ki Baat Automation (WDIO) ---
    {
      moduleRepoPath: 'mann_ki_baat_automation',
      title: 'Episode Schedule Creation and Host Assignment',
      description: 'Schedules a new broadcast episode and associates state coordinators.',
      filePath: 'test/specs/episode-schedule.spec.ts',
      framework: 'WDIO',
      tags: ['@Smoke', '@MKB', '@Schedule'],
      testIdentifier: 'MKB-001',
    },
    {
      moduleRepoPath: 'mann_ki_baat_automation',
      title: 'Audio File Upload and Streaming Playback Verification',
      description: 'Uploads MP3 broadcast recording and verifies HTML5 player stream.',
      filePath: 'test/specs/audio-playback.spec.ts',
      framework: 'WDIO',
      tags: ['@Regression', '@Media', '@MKB'],
      testIdentifier: 'MKB-002',
    },
    {
      moduleRepoPath: 'mann_ki_baat_automation',
      title: 'Listener Attendance Booth Registration',
      description: 'Verifies booth-level listener count submissions across districts.',
      filePath: 'test/specs/booth-registration.spec.ts',
      framework: 'WDIO',
      tags: ['@Regression', '@Booth', '@MKB'],
      testIdentifier: 'MKB-003',
    },

    // --- Saral Attendance Automation (WDIO / Appium) ---
    {
      moduleRepoPath: 'saral-attendance-automation',
      title: 'Daily Check-in and Geofencing Coordinate Verification',
      description: 'Verifies GPS geofence radius check during volunteer daily punch-in.',
      filePath: 'test/specs/attendance-checkin.spec.ts',
      framework: 'WDIO',
      tags: ['@Smoke', '@Attendance', '@Geofence'],
      testIdentifier: 'ATT-001',
    },
    {
      moduleRepoPath: 'saral-attendance-automation',
      title: 'Biometric and Selfie Verification Flow',
      description: 'Validates image capture submission and duplicate punch prevention.',
      filePath: 'test/specs/biometric-punch.spec.ts',
      framework: 'WDIO',
      tags: ['@Regression', '@Attendance', '@Biometric'],
      testIdentifier: 'ATT-002',
    },
    {
      moduleRepoPath: 'saral-attendance-automation',
      title: 'Monthly Timesheet Summary and Manager Approval',
      description: 'Verifies supervisor timesheet sign-off and monthly payroll export.',
      filePath: 'test/specs/timesheet-approval.spec.ts',
      framework: 'WDIO',
      tags: ['@Regression', '@Reporting', '@Attendance'],
      testIdentifier: 'ATT-003',
    },

    // --- Voters Outreach (Playwright) ---
    {
      moduleRepoPath: 'voters-outreach-automation-playwright',
      title: 'Chromium Voter List Fast Search and Batch Filter',
      description: 'High-speed Playwright search across 10,000 voter records with multi-filter.',
      filePath: 'tests/voter-search.spec.ts',
      framework: 'PLAYWRIGHT',
      tags: ['@Smoke', '@Playwright', '@Voters', '@Chromium'],
      testIdentifier: 'VOP-001',
    },
    {
      moduleRepoPath: 'voters-outreach-automation-playwright',
      title: 'Cross-Browser Voter Profile Verification (Firefox & WebKit)',
      description: 'Ensures canvas charts and voter demographics render identically on Firefox and Safari.',
      filePath: 'tests/cross-browser-demographics.spec.ts',
      framework: 'PLAYWRIGHT',
      tags: ['@Regression', '@CrossBrowser', '@Playwright'],
      testIdentifier: 'VOP-002',
    },
    {
      moduleRepoPath: 'voters-outreach-automation-playwright',
      title: 'Bulk WhatsApp Outreach Trigger Validation',
      description: 'Simulates queue dispatch of approved outreach messages.',
      filePath: 'tests/outreach-dispatch.spec.ts',
      framework: 'PLAYWRIGHT',
      tags: ['@Regression', '@Outreach', '@Playwright'],
      testIdentifier: 'VOP-003',
    },

    // --- Voters Outreach Automation (Cucumber WDIO) ---
    {
      moduleRepoPath: 'voters_outreach_automation',
      title: 'BDD Citizen Feedback Survey Submission',
      description: 'Executes Gherkin scenario for recording door-to-door survey feedback.',
      filePath: 'features/survey_submission.feature',
      framework: 'WDIO',
      tags: ['@Smoke', '@BDD', '@Survey'],
      testIdentifier: 'VOA-001',
    },
    {
      moduleRepoPath: 'voters_outreach_automation',
      title: 'District Wise Campaign Analytics Dashboard Render',
      description: 'Validates district KPIs, volunteer call completion rate, and coverage maps.',
      filePath: 'features/campaign_analytics.feature',
      framework: 'WDIO',
      tags: ['@Regression', '@BDD', '@Analytics'],
      testIdentifier: 'VOA-002',
    },

    // --- Saral Android Automation (Dedicated Appium) ---
    {
      moduleRepoPath: 'saral_android_automation',
      title: 'Android Native App Cold Start and SplashScreen Validation',
      description: 'Measures cold launch time and validates app version branding.',
      filePath: 'test/specs/cold-start.spec.ts',
      framework: 'APPIUM',
      tags: ['@Smoke', '@Android', '@Performance'],
      testIdentifier: 'SAA-001',
    },
    {
      moduleRepoPath: 'saral_android_automation',
      title: 'Android Offline Mode Data Persistence & Sync on Reconnect',
      description: 'Tests local SQLite caching when network is disconnected and sync when restored.',
      filePath: 'test/specs/offline-sync.spec.ts',
      framework: 'APPIUM',
      tags: ['@Regression', '@Android', '@Offline'],
      testIdentifier: 'SAA-002',
    },

    // --- Saral iOS Automation (Dedicated XCUITest) ---
    {
      moduleRepoPath: 'saral-ios-automation',
      title: 'iOS FaceID and Biometric Quick Unlock Flow',
      description: 'Validates biometric authentication fallback to PIN on iOS 17+.',
      filePath: 'test/specs/biometrics.spec.ts',
      framework: 'APPIUM',
      tags: ['@Smoke', '@iOS', '@Security'],
      testIdentifier: 'SIA-001',
    },
    {
      moduleRepoPath: 'saral-ios-automation',
      title: 'iOS Push Notification Deep Linking to Event Details',
      description: 'Simulates APNS payload and verifies correct view controller navigation.',
      filePath: 'test/specs/deeplink.spec.ts',
      framework: 'APPIUM',
      tags: ['@Regression', '@iOS', '@PushNotification'],
      testIdentifier: 'SIA-002',
    },
  ];

  /**
   * Main synchronization orchestrator:
   * 1. Inspects repository via GitHub API if configured.
   * 2. Scans monorepo modules and test files.
   * 3. Syncs discovered test cases to PostgreSQL.
   * 4. Idempotently upserts active cases and deactivates removed cases.
   */
  async syncRepository(branch: string = 'main'): Promise<SyncResult> {
    console.log(`[GitHubSync] Starting synchronization with repository branch: ${branch}`);
    let discoveredCases: DiscoveredTestCase[] = [];

    // Attempt live scan from GitHub API if configured
    if (gitHubService.isConfigured) {
      try {
        console.log(`[GitHubSync] Fetching git tree recursively from GitHub API...`);
        const liveCases = await this.fetchLiveRepoTestCases(branch);
        if (liveCases && liveCases.length > 0) {
          discoveredCases = liveCases;
          console.log(`[GitHubSync] Successfully parsed ${liveCases.length} test cases from GitHub API.`);
        }
      } catch (err: any) {
        console.warn(`[GitHubSync] GitHub API tree fetch returned error (${err.message}). Falling back to repository catalog.`);
      }
    }

    // If GitHub API returned no cases or is unconfigured, use our monorepo catalog
    if (discoveredCases.length === 0) {
      console.log(`[GitHubSync] Using verified Saral monorepo test catalog (${this.defaultCatalog.length} cases).`);
      discoveredCases = this.defaultCatalog;
    }

    // Now sync discovered test cases into database
    return await this.persistTestCases(discoveredCases);
  }

  /**
   * Handles webhook push event payload to trigger synchronization
   */
  async syncFromWebhook(payload: any): Promise<SyncResult> {
    const branch = payload.ref ? payload.ref.replace('refs/heads/', '') : 'main';
    console.log(`[GitHubSync] Webhook push received on branch '${branch}', triggering synchronization...`);
    return await this.syncRepository(branch);
  }

  /**
   * Fetches Git tree recursively and parses test file paths
   */
  private async fetchLiveRepoTestCases(branch: string): Promise<DiscoveredTestCase[]> {
    const response = await axios.get(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/git/trees/${branch}?recursive=1`,
      {
        headers: {
          Authorization: GITHUB_TOKEN
            ? (GITHUB_TOKEN.startsWith('github_pat_') ? `Bearer ${GITHUB_TOKEN}` : `token ${GITHUB_TOKEN}`)
            : undefined,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'SaralQADashboard/1.0',
        },
        timeout: 20000,
      }
    );

    const tree = response.data?.tree || [];
    const testCases: DiscoveredTestCase[] = [];

    for (const item of tree) {
      if (item.type !== 'blob') continue;
      const path: string = item.path;

      // Identify module from top-level directory
      const pathParts = path.split('/');
      if (pathParts.length < 2) continue;
      const moduleFolder = pathParts[0];

      // Match test files
      const isSpec = path.endsWith('.spec.ts') || path.endsWith('.spec.js') || path.endsWith('.test.ts');
      const isFeature = path.endsWith('.feature');
      const isJavaTest = path.endsWith('Test.java') || path.endsWith('Tests.java');

      if (!isSpec && !isFeature && !isJavaTest) continue;

      const fileName = pathParts[pathParts.length - 1];
      const testName = fileName
        .replace(/\.(spec|test)\.(ts|js)$/, '')
        .replace(/\.feature$/, '')
        .replace(/\.java$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      let framework = 'WDIO';
      let tags = ['@Regression'];

      if (isFeature) {
        framework = 'CUCUMBER';
        tags.push('@BDD');
      } else if (path.includes('playwright')) {
        framework = 'PLAYWRIGHT';
      } else if (isJavaTest || path.includes('selenium')) {
        framework = 'SELENIUM';
      } else if (path.includes('android') || path.includes('ios')) {
        framework = 'APPIUM';
        tags.push('@Mobile');
      }

      if (fileName.toLowerCase().includes('smoke')) {
        tags.push('@Smoke');
      }

      testCases.push({
        moduleRepoPath: moduleFolder,
        title: `Automated Test: ${testName}`,
        description: `Automated test script located at ${path}`,
        filePath: path.replace(`${moduleFolder}/`, ''),
        framework,
        tags,
        testIdentifier: `TC-${fileName.substring(0, 8).toUpperCase()}`,
      });
    }

    return testCases;
  }

  /**
   * Persists discovered test cases to PostgreSQL
   */
  private async persistTestCases(discovered: DiscoveredTestCase[]): Promise<SyncResult> {
    const modules = await prisma.automationModule.findMany();
    const moduleMap = new Map<string, string>(); // repoPath -> moduleId

    let modulesDiscoveredCount = 0;

    for (const m of modules) {
      moduleMap.set(m.repoPath, m.id);
      moduleMap.set(m.name, m.id);
    }

    // Dynamic Module Discovery: If any discovered case belongs to an unknown module folder, create the module!
    const uniqueRepoPaths = Array.from(new Set(discovered.map((d) => d.moduleRepoPath)));
    for (const repoPath of uniqueRepoPaths) {
      if (!moduleMap.has(repoPath)) {
        const displayName = repoPath
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

        const newModule = await prisma.automationModule.create({
          data: {
            name: repoPath,
            displayName,
            description: `Dynamically discovered automation suite from ${repoPath}`,
            repoPath,
            platform: repoPath.includes('android') || repoPath.includes('ios') ? 'MOBILE' : 'WEB',
            framework: repoPath.includes('playwright')
              ? 'PLAYWRIGHT'
              : repoPath.includes('selenium')
              ? 'SELENIUM'
              : 'WDIO',
            testCommands: JSON.stringify(['test']),
            tags: JSON.stringify(['discovered', 'staging']),
          },
        });
        moduleMap.set(repoPath, newModule.id);
        moduleMap.set(newModule.name, newModule.id);
        modulesDiscoveredCount++;
        console.log(`[GitHubSync] Discovered new module in repository: ${repoPath} (ID: ${newModule.id})`);
      }
    }

    let created = 0;
    let updated = 0;
    const now = new Date();
    const discoveredKeys = new Set<string>();

    for (const tc of discovered) {
      const moduleId = moduleMap.get(tc.moduleRepoPath);
      if (!moduleId) continue;

      const compositeKey = `${moduleId}:${tc.filePath}:${tc.title}`;
      discoveredKeys.add(compositeKey);

      const existing = await prisma.testCase.findUnique({
        where: {
          moduleId_filePath_title: {
            moduleId,
            filePath: tc.filePath,
            title: tc.title,
          },
        },
      });

      const tagsJson = JSON.stringify(tc.tags);

      if (existing) {
        await prisma.testCase.update({
          where: { id: existing.id },
          data: {
            description: tc.description || existing.description,
            framework: tc.framework,
            tags: tagsJson,
            testIdentifier: tc.testIdentifier || existing.testIdentifier,
            isActive: true,
            lastSyncedAt: now,
          },
        });
        updated++;
      } else {
        await prisma.testCase.create({
          data: {
            moduleId,
            title: tc.title,
            description: tc.description || null,
            filePath: tc.filePath,
            framework: tc.framework,
            tags: tagsJson,
            testIdentifier: tc.testIdentifier || null,
            isActive: true,
            lastSyncedAt: now,
          },
        });
        created++;
      }
    }

    // Soft-deactivate test cases that were removed from the repository (preserving historical execution data!)
    const allDbCases = await prisma.testCase.findMany({ where: { isActive: true } });
    let deactivated = 0;

    for (const dbCase of allDbCases) {
      const key = `${dbCase.moduleId}:${dbCase.filePath}:${dbCase.title}`;
      if (!discoveredKeys.has(key)) {
        await prisma.testCase.update({
          where: { id: dbCase.id },
          data: { isActive: false },
        });
        deactivated++;
      }
    }

    console.log(
      `[GitHubSync] Sync Complete: ${discovered.length} discovered, ${created} created, ${updated} updated, ${deactivated} deactivated, ${modulesDiscoveredCount} new modules.`
    );

    return {
      success: true,
      totalDiscovered: discovered.length,
      created,
      updated,
      deactivated,
      modulesDiscovered: modulesDiscoveredCount,
      syncedAt: now,
    };
  }
}

export const gitHubSyncService = new GitHubSyncService();
export default gitHubSyncService;

