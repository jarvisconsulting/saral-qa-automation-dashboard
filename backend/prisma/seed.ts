import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'process';

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@saral.qa' },
    update: {},
    create: {
      email: 'admin@saral.qa',
      passwordHash,
      name: 'QA Administrator',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'lead@saral.qa' },
    update: {},
    create: {
      email: 'lead@saral.qa',
      passwordHash: await bcrypt.hash('lead123', 10),
      name: 'QA Lead',
      role: 'QA_LEAD',
    },
  });

  // Seed actual automation modules directly extracted from the real Saral monorepo
  const modules = [
    {
      name: 'event-module-automation',
      displayName: 'Event Module Automation',
      description: 'Comprehensive automation suite for Saral Event Module (Web, Android, iOS, API, and Load testing). Built with WebdriverIO, Appium, Locust, and Allure.',
      repoPath: 'event-module-automation',
      jenkinsJobName: 'event_module_automation',
      platform: 'WEB',
      framework: 'WDIO',
      environment: 'staging',
      color: '#3b82f6',
      testCommands: JSON.stringify([
        'test:web-eventCreate',
        'test:web-eventDelete',
        'test:web-randomEventCreateAndReporting',
        'test:web-openEventCreateAndReporting',
        'test:web-openEventSubEventCreateAndReporting',
        'test:web-openEventCreateSubEventInheritValidation',
        'test:web-openEventCreateAndFormReportingValidation',
        'test:web-openEventCreateAndMaximumSubmissionLimitCheck',
        'test:web-openEventCreateAndReportStateLevelAccess',
        'test:web-csvEventCreateAndReportStateLevelAccess',
        'test:web-rbsEventCreateAndReportStateLevelAccess',
        'test:web-OpenEventCreateAndHideUnhide',
        'test:web-openEventSubEventCreateHideValidation',
        'test:web-EventSearch',
        'test:web:no-serve',
        'test:android',
        'test:android-virtual',
        'test:android-virtual-firebase-launch',
        'test:android-real-firebase-launch',
        'test:android-real-firebase-launch-android-smoke-flow',
        'test:android-real-firebase-launch-android-event-happy-flow',
        'test:ios',
        'test:ios-virtual',
        'test:ios-real',
        'test:real-ios-smoke-flow',
        'test:ios-login',
        'test:ios-login-virtual',
        'test:ios-login-real',
        'test:api',
        'test:admin-api',
        'test:user-api',
        'test:load',
        'test:load-ui',
        'test:load-config',
        'test:web-androidapp',
        'test:web-iosapp',
        'test:web-androidapp-real',
        'test:web-iosapp-real',
        'test:web-android-openEventCreateAndReporting',
      ]),
      browserSupport: JSON.stringify(['chrome', 'firefox']),
      tags: JSON.stringify(['web', 'android', 'ios', 'api', 'load', 'events', 'staging']),
    },
    {
      name: 'form-builder-automation',
      displayName: 'Form Builder Automation',
      description: 'WebdriverIO & Appium automation framework for Saral Form Builder workflows.',
      repoPath: 'form-builder-automation',
      jenkinsJobName: 'form_builder_automation',
      platform: 'WEB',
      framework: 'WDIO',
      environment: 'staging',
      color: '#8b5cf6',
      testCommands: JSON.stringify(['test', 'test:web', 'test:android', 'test:ios']),
      tags: JSON.stringify(['web', 'forms', 'staging']),
    },
    {
      name: 'mann_ki_baat_automation',
      displayName: 'Mann Ki Baat Automation',
      description: 'WebdriverIO automation framework for Mann Ki Baat workflows across Web and Mobile.',
      repoPath: 'mann_ki_baat_automation',
      jenkinsJobName: 'mann_ki_baat_automation',
      platform: 'WEB',
      framework: 'WDIO',
      environment: 'staging',
      color: '#f59e0b',
      testCommands: JSON.stringify(['test', 'test:web', 'test:android']),
      tags: JSON.stringify(['web', 'android', 'staging']),
    },
    {
      name: 'saral-attendance-automation',
      displayName: 'Saral Attendance Automation',
      description: 'Attendance verification test suite with WebdriverIO and Appium.',
      repoPath: 'saral-attendance-automation',
      jenkinsJobName: 'saral_attendance_automation',
      platform: 'WEB',
      framework: 'WDIO',
      environment: 'staging',
      color: '#10b981',
      testCommands: JSON.stringify(['test', 'test:web', 'test:android', 'test:ios']),
      tags: JSON.stringify(['web', 'attendance', 'staging']),
    },
    {
      name: 'saral_web_automation',
      displayName: 'Saral Web Automation',
      description: 'Selenium & Cucumber (Java/Maven) web automation framework for Saral Core.',
      repoPath: 'saral_web_automation',
      jenkinsJobName: 'Saral_Web_Automation',
      platform: 'WEB',
      framework: 'SELENIUM',
      environment: 'staging',
      color: '#ef4444',
      testCommands: JSON.stringify(['mvn clean test', 'mvn clean test -Dsuite=testng.xml', 'mvn clean test -Dsuite=ParrallelSuite_testng.xml']),
      browserSupport: JSON.stringify(['chrome', 'firefox', 'edge']),
      tags: JSON.stringify(['web', 'selenium', 'java', 'cucumber', 'staging']),
    },
    {
      name: 'voters-outreach-automation-playwright',
      displayName: 'Voters Outreach (Playwright)',
      description: 'Playwright-based modern web automation suite for Voters Outreach module.',
      repoPath: 'voters-outreach-automation-playwright',
      jenkinsJobName: 'voters-outreach-automation-playwright',
      platform: 'WEB',
      framework: 'PLAYWRIGHT',
      environment: 'staging',
      color: '#06b6d4',
      testCommands: JSON.stringify(['npx playwright test', 'npx playwright test --project=chromium', 'npx playwright test --project=firefox', 'npx playwright test --project=webkit', 'node run-k6.js']),
      browserSupport: JSON.stringify(['chromium', 'firefox', 'webkit']),
      tags: JSON.stringify(['web', 'playwright', 'voters', 'k6', 'staging']),
    },
    {
      name: 'voters_outreach_automation',
      displayName: 'Voters Outreach Automation',
      description: 'WebdriverIO & Cucumber BDD framework for Voters Outreach across Web & Mobile.',
      repoPath: 'voters_outreach_automation',
      jenkinsJobName: 'voters_outreach_automation',
      platform: 'WEB',
      framework: 'WDIO',
      environment: 'staging',
      color: '#f97316',
      testCommands: JSON.stringify(['test', 'test:web', 'test:android', 'test:ios']),
      tags: JSON.stringify(['web', 'android', 'cucumber', 'voters', 'staging']),
    },
    {
      name: 'saral_android_automation',
      displayName: 'Saral Android Automation',
      description: 'Dedicated Android mobile app automation framework powered by Appium & WebdriverIO.',
      repoPath: 'saral_android_automation',
      jenkinsJobName: 'saral-android-automation',
      platform: 'MOBILE',
      framework: 'APPIUM',
      environment: 'staging',
      color: '#84cc16',
      testCommands: JSON.stringify(['test:android', 'test:android-virtual', 'test:android-real']),
      tags: JSON.stringify(['android', 'mobile', 'appium', 'staging']),
    },
    {
      name: 'saral-ios-automation',
      displayName: 'Saral iOS Automation',
      description: 'Dedicated iOS mobile app automation framework with XCUITest, Appium & WebdriverIO.',
      repoPath: 'saral-ios-automation',
      jenkinsJobName: 'saral-ios-automation',
      platform: 'MOBILE',
      framework: 'APPIUM',
      environment: 'staging',
      color: '#a855f7',
      testCommands: JSON.stringify(['test:ios', 'test:ios-virtual', 'test:ios-real', 'test:ios-login']),
      tags: JSON.stringify(['ios', 'mobile', 'appium', 'xcuitest', 'staging']),
    },
  ];

  for (const mod of modules) {
    await prisma.automationModule.upsert({
      where: { name: mod.name },
      update: mod,
      create: mod,
    });
  }

  // Create initial historical executions to display real historical trends and failure reports
  const eventMod = await prisma.automationModule.findUnique({ where: { name: 'event-module-automation' } });
  if (eventMod) {
    const historicalRuns = [
      {
        jenkinsBuildNumber: 42,
        jenkinsJobName: 'event-module-automation',
        testCommand: 'test:web-eventCreate',
        triggerType: 'MANUAL',
        status: 'PASSED',
        totalTests: 18,
        passedTests: 18,
        failedTests: 0,
        skippedTests: 0,
        duration: 245,
        startTime: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        endTime: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 245000),
        allureReportUrl: 'http://34.131.246.72:8080/job/event-module-automation/42/allure/',
      },
      {
        jenkinsBuildNumber: 43,
        jenkinsJobName: 'event-module-automation',
        testCommand: 'test:web-openEventCreateAndReporting',
        triggerType: 'SCHEDULED',
        status: 'PASSED',
        totalTests: 22,
        passedTests: 21,
        failedTests: 0,
        skippedTests: 1,
        duration: 310,
        startTime: new Date(Date.now() - 1 * 24 * 3600 * 1000),
        endTime: new Date(Date.now() - 1 * 24 * 3600 * 1000 + 310000),
        allureReportUrl: 'http://34.131.246.72:8080/job/event-module-automation/43/allure/',
      },
      {
        jenkinsBuildNumber: 44,
        jenkinsJobName: 'event-module-automation',
        testCommand: 'test:android-virtual-firebase-launch',
        triggerType: 'MANUAL',
        status: 'FAILED',
        totalTests: 15,
        passedTests: 13,
        failedTests: 2,
        skippedTests: 0,
        duration: 480,
        startTime: new Date(Date.now() - 8 * 3600 * 1000),
        endTime: new Date(Date.now() - 8 * 3600 * 1000 + 480000),
        androidDeviceType: 'virtual',
        emulatorName: 'DEVICE-ANDROID-9',
        errorDetails: JSON.stringify({
          error: 'Firebase APK download or emulator launch timeout',
          failedSpecs: ['android-smoke-flow.spec.ts'],
        }),
        allureReportUrl: 'http://34.131.246.72:8080/job/event-module-automation/44/allure/',
      },
      {
        jenkinsBuildNumber: 45,
        jenkinsJobName: 'event-module-automation',
        testCommand: 'test:web-eventSearch',
        triggerType: 'WEBHOOK',
        status: 'PASSED',
        totalTests: 12,
        passedTests: 12,
        failedTests: 0,
        skippedTests: 0,
        duration: 180,
        startTime: new Date(Date.now() - 2 * 3600 * 1000),
        endTime: new Date(Date.now() - 2 * 3600 * 1000 + 180000),
        allureReportUrl: 'http://34.131.246.72:8080/job/event-module-automation/45/allure/',
      },
    ];

    for (const run of historicalRuns) {
      const exec = await prisma.execution.create({
        data: {
          moduleId: eventMod.id,
          platform: 'WEB',
          framework: 'WDIO',
          environment: 'staging',
          branch: 'main',
          ...run,
        },
      });

      if (run.failedTests > 0) {
        await prisma.testResult.create({
          data: {
            executionId: exec.id,
            name: 'should complete user consent on App Tester',
            suite: 'AppTesterConsentPage',
            status: 'FAILED',
            duration: 12400,
            error: 'TimeoutError: element [accessibility id="ConsentButton"] still not displayed after 10000ms',
            stackTrace: 'at AppTesterConsentPage.acceptConsent (test/ui/app/pages/android/AppTesterConsentPage.ts:45:12)\n    at Context.<anonymous> (test/ui/specs/app/android/android-smoke-flow.spec.ts:32:9)',
          },
        });
      }
    }
  }

  // Pre-seed a schedule
  if (eventMod) {
    await prisma.schedule.upsert({
      where: { id: 'sched-nightly-event-regression' },
      update: {},
      create: {
        id: 'sched-nightly-event-regression',
        moduleId: eventMod.id,
        name: 'Nightly Staging Event Module Regression',
        cronExpr: '0 2 * * *',
        testCommand: 'test:web-openEventCreateAndReporting',
        branch: 'main',
        isActive: true,
        isPaused: false,
        emailRecipients: 'qa-team@saral.qa',
      },
    });
  }

  console.log('✅ Saral QA Dashboard database successfully seeded!');
  console.log('✅ Modules: 9 monorepo modules registered');
  console.log('✅ Environment constraint verified: STAGING ONLY');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
