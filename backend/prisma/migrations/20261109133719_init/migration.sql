-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AutomationModule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "repoPath" TEXT NOT NULL,
    "jenkinsJobName" TEXT,
    "platform" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'staging',
    "testCommands" TEXT NOT NULL,
    "browserSupport" TEXT,
    "tags" TEXT,
    "color" TEXT DEFAULT '#3b82f6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Execution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleId" TEXT NOT NULL,
    "jenkinsBuildNumber" INTEGER,
    "jenkinsBuildUrl" TEXT,
    "jenkinsJobName" TEXT,
    "queueItemId" INTEGER,
    "testCommand" TEXT,
    "triggerType" TEXT NOT NULL DEFAULT 'MANUAL',
    "platform" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'staging',
    "branch" TEXT DEFAULT 'main',
    "commitSha" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startTime" DATETIME,
    "endTime" DATETIME,
    "duration" INTEGER,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "passedTests" INTEGER NOT NULL DEFAULT 0,
    "failedTests" INTEGER NOT NULL DEFAULT 0,
    "skippedTests" INTEGER NOT NULL DEFAULT 0,
    "consoleLogUrl" TEXT,
    "allureReportUrl" TEXT,
    "errorDetails" TEXT,
    "triggeredBy" TEXT,
    "emailRecipients" TEXT,
    "androidDeviceType" TEXT,
    "emulatorName" TEXT,
    "webTags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Execution_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "AutomationModule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "executionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "suite" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "duration" INTEGER,
    "error" TEXT,
    "stackTrace" TEXT,
    "screenshotPath" TEXT,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestResult_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "Execution" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExecutionArtifact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "executionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExecutionArtifact_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "Execution" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cronExpr" TEXT NOT NULL,
    "testCommand" TEXT,
    "branch" TEXT DEFAULT 'main',
    "androidDeviceType" TEXT,
    "emulatorName" TEXT,
    "webTags" TEXT,
    "emailRecipients" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "lastRunAt" DATETIME,
    "nextRunAt" DATETIME,
    "lastStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Schedule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "AutomationModule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "deliveryId" TEXT,
    "repoFullName" TEXT,
    "branch" TEXT,
    "commitSha" TEXT,
    "pusherName" TEXT,
    "changedFiles" TEXT,
    "payload" TEXT NOT NULL,
    "executionId" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "signature" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "JenkinsJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "description" TEXT,
    "parameters" TEXT,
    "lastBuildNumber" INTEGER,
    "lastBuildStatus" TEXT,
    "syncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GitRepository" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "defaultBranch" TEXT,
    "branches" TEXT,
    "lastCommitSha" TEXT,
    "lastCommitMsg" TEXT,
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationModule_name_key" ON "AutomationModule"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_deliveryId_key" ON "WebhookEvent"("deliveryId");

-- CreateIndex
CREATE UNIQUE INDEX "JenkinsJob_name_key" ON "JenkinsJob"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GitRepository_fullName_key" ON "GitRepository"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");
