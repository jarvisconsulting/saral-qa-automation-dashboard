export type Platform = 'WEB' | 'MOBILE' | 'API';
export type Framework = 'WDIO' | 'PLAYWRIGHT' | 'SELENIUM' | 'APPIUM' | 'LOCUST';
export type TriggerType = 'MANUAL' | 'SCHEDULED' | 'WEBHOOK';
export type ExecutionStatus = 'PENDING' | 'QUEUED' | 'RUNNING' | 'PASSED' | 'FAILED' | 'CANCELLED' | 'UNKNOWN';
export type UserRole = 'ADMIN' | 'READ_ONLY' | 'QA_LEAD' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestCase {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  filePath: string;
  framework: string;
  tags: string[];
  testIdentifier?: string;
  isActive: boolean;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
  module?: {
    id: string;
    name: string;
    displayName: string;
    platform: string;
    framework: string;
    color?: string;
  };
}

export interface AutomationModule {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  repoPath: string;
  jenkinsJobName?: string;
  platform: Platform;
  framework: Framework;
  environment: 'staging';
  testCommands: string[];
  browserSupport?: string;
  tags?: string;
  color?: string;
  isActive: boolean;
  totalExecutions?: number;
  totalTests?: number;
  passedTests?: number;
  failedTests?: number;
  skippedTests?: number;
  passRate?: number;
  avgDuration?: number;
  lastStatus?: string;
  lastExecutionAt?: string | null;
  discoveredCasesCount?: number;
}

export interface Execution {
  id: string;
  moduleId: string;
  jenkinsBuildNumber?: number;
  jenkinsBuildUrl?: string;
  jenkinsJobName?: string;
  queueItemId?: number;
  testCommand?: string;
  triggerType: TriggerType;
  platform: Platform;
  framework: Framework;
  environment: 'staging';
  branch?: string;
  commitSha?: string;
  status: ExecutionStatus;
  startTime?: string;
  endTime?: string;
  duration?: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  consoleLogUrl?: string;
  allureReportUrl?: string;
  errorDetails?: string;
  triggeredBy?: string;
  emailRecipients?: string;
  androidDeviceType?: 'virtual' | 'real';
  emulatorName?: string;
  webTags?: string;
  createdAt: string;
  updatedAt: string;
  module?: AutomationModule;
  testResults?: TestResult[];
  artifacts?: ExecutionArtifact[];
}

export interface TestResult {
  id: string;
  executionId: string;
  name: string;
  suite?: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED';
  duration?: number;
  error?: string;
  stackTrace?: string;
  screenshotPath?: string;
  startTime?: string;
  endTime?: string;
}

export interface ExecutionArtifact {
  id: string;
  executionId: string;
  name: string;
  type: string;
  url: string;
  size?: number;
}

export interface Schedule {
  id: string;
  moduleId: string;
  name: string;
  cronExpr: string;
  testCommand?: string;
  branch?: string;
  androidDeviceType?: string;
  emulatorName?: string;
  webTags?: string;
  emailRecipients?: string;
  isActive: boolean;
  isPaused: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  lastStatus?: string;
  module?: {
    name: string;
    displayName: string;
  };
}

export interface DashboardStats {
  totalModules: number;
  activeExecutions: number;
  totalExecutions: number;
  todayPassed: number;
  todayFailed: number;
  todayTotal: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  totalTests: number;
  passRate: number;
  avgDuration: number;
  recentExecutions: Execution[];
  recentFailures: Execution[];
  environment: 'staging';
}

export interface TrendDataPoint {
  date: string;
  passed: number;
  failed: number;
  skipped: number;
  executions: number;
  avgDuration: number;
}

export interface JenkinsStatus {
  connected: boolean;
  version?: string;
  error?: string;
}

export interface GitHubStatus {
  connected: boolean;
  rateLimitRemaining?: number;
  error?: string;
}
