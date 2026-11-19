import axios, { AxiosInstance } from 'axios';
import { JENKINS_URL, JENKINS_USER, JENKINS_TOKEN, JENKINS_JOB_NAME } from '../config';

export interface JenkinsBuildInfo {
  number: number;
  url: string;
  result: string | null;
  building: boolean;
  duration: number;
  timestamp: number;
  displayName: string;
  description: string | null;
  actions: any[];
}

export interface JenkinsQueueItem {
  id: number;
  why: string | null;
  executable?: {
    number: number;
    url: string;
  };
}

export interface JenkinsJobInfo {
  name: string;
  url: string;
  description: string;
  buildable: boolean;
  color: string;
  lastBuild: { number: number; url: string } | null;
  lastSuccessfulBuild: { number: number; url: string } | null;
  lastFailedBuild: { number: number; url: string } | null;
  builds: Array<{ number: number; url: string }>;
  property: any[];
}

class JenkinsService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: JENKINS_URL,
      auth: {
        username: JENKINS_USER,
        password: JENKINS_TOKEN,
      },
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  get isConfigured(): boolean {
    return !!(JENKINS_URL && JENKINS_USER && JENKINS_TOKEN);
  }

  async checkConnection(): Promise<{ connected: boolean; version?: string; error?: string }> {
    if (!this.isConfigured) {
      return { connected: false, error: 'Jenkins not configured. Set JENKINS_URL, JENKINS_USER, JENKINS_TOKEN in .env' };
    }
    try {
      const response = await this.client.get('/api/json', { params: { tree: 'mode,nodeDescription' } });
      const version = response.headers['x-jenkins'] || 'unknown';
      return { connected: true, version };
    } catch (err: any) {
      return { connected: false, error: err.message || 'Connection failed' };
    }
  }

  async getJobInfo(jobName: string = JENKINS_JOB_NAME): Promise<JenkinsJobInfo> {
    const response = await this.client.get(`/job/${encodeURIComponent(jobName)}/api/json`, {
      params: {
        tree: 'name,url,description,buildable,color,lastBuild[number,url],lastSuccessfulBuild[number,url],lastFailedBuild[number,url],builds[number,url]{0,20},property[parameterDefinitions[name,type,choices,defaultParameterValue]]',
      },
    });
    return response.data;
  }

  async listJobs(): Promise<Array<{ name: string; url: string; color: string }>> {
    const response = await this.client.get('/api/json', {
      params: { tree: 'jobs[name,url,color,buildable]' },
    });
    return response.data.jobs || [];
  }

  async getBuildInfo(jobName: string, buildNumber: number): Promise<JenkinsBuildInfo> {
    const response = await this.client.get(`/job/${encodeURIComponent(jobName)}/${buildNumber}/api/json`, {
      params: {
        tree: 'number,url,result,building,duration,timestamp,displayName,description,actions[parameters[name,value],causes[shortDescription,userId,userName]]',
      },
    });
    return response.data;
  }

  async getAllRecentBuilds(count: number = 10): Promise<Array<{
    name: string;
    color: string;
    builds: Array<{
      number: number;
      url: string;
      building: boolean;
      timestamp: number;
      duration: number;
      result: string | null;
    }>;
  }>> {
    const response = await this.client.get('/api/json', {
      params: {
        tree: `jobs[name,color,builds[number,url,building,timestamp,duration,result]{0,${count}}]`,
      },
    });
    return response.data.jobs || [];
  }

  async getBuildHistory(jobName: string = JENKINS_JOB_NAME, count: number = 20): Promise<JenkinsBuildInfo[]> {
    const response = await this.client.get(`/job/${encodeURIComponent(jobName)}/api/json`, {
      params: {
        tree: `builds[number,url,result,building,duration,timestamp,displayName,description]{0,${count}}`,
      },
    });
    return response.data.builds || [];
  }

  async triggerBuild(jobName: string = JENKINS_JOB_NAME, parameters: Record<string, string>): Promise<number> {
    const response = await this.client.post(
      `/job/${encodeURIComponent(jobName)}/buildWithParameters`,
      null,
      {
        params: parameters,
        maxRedirects: 0,
        validateStatus: (s) => s === 201 || s === 302,
      }
    );

    const locationHeader = response.headers['location'] as string;
    if (locationHeader) {
      const match = locationHeader.match(/queue\/item\/(\d+)/);
      if (match) return parseInt(match[1]);
    }
    throw new Error('Could not determine queue item ID from Jenkins response');
  }

  async getQueueItem(queueItemId: number): Promise<JenkinsQueueItem> {
    const response = await this.client.get(`/queue/item/${queueItemId}/api/json`);
    return response.data;
  }

  async waitForBuildStart(queueItemId: number, maxWaitMs: number = 120000): Promise<number | null> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      const item = await this.getQueueItem(queueItemId);
      if (item.executable?.number) {
        return item.executable.number;
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
    return null;
  }

  async getConsoleLog(jobName: string, buildNumber: number, start: number = 0): Promise<{ text: string; more: boolean; nextStart: number }> {
    try {
      const response = await this.client.get(
        `/job/${encodeURIComponent(jobName)}/${buildNumber}/logText/progressiveText`,
        {
          params: { start },
          responseType: 'text',
          headers: { Accept: 'text/plain' },
        }
      );
      const more = response.headers['x-more-data'] === 'true';
      const nextStart = parseInt(response.headers['x-text-size'] || '0');
      return { text: response.data as string, more, nextStart };
    } catch {
      return { text: '', more: false, nextStart: start };
    }
  }

  async abortBuild(jobName: string, buildNumber: number): Promise<void> {
    await this.client.post(`/job/${encodeURIComponent(jobName)}/${buildNumber}/stop`);
  }

  async getConsoleText(jobName: string, buildNumber: number): Promise<string> {
    try {
      const response = await this.client.get(
        `/job/${encodeURIComponent(jobName)}/${buildNumber}/consoleText`,
        { timeout: 20000, responseType: 'text' }
      );
      return typeof response.data === 'string' ? response.data : '';
    } catch {
      return '';
    }
  }

  async getTestReport(jobName: string, buildNumber: number): Promise<any> {
    try {
      const response = await this.client.get(
        `/job/${encodeURIComponent(jobName)}/${buildNumber}/testReport/api/json`
      );
      return response.data;
    } catch {
      return null;
    }
  }

  async getAllureReport(jobName: string, buildNumber: number): Promise<string | null> {
    try {
      const response = await this.client.get(
        `/job/${encodeURIComponent(jobName)}/${buildNumber}/allure/api/json`,
        { validateStatus: (s) => s < 500 }
      );
      if (response.status === 200) {
        return `${JENKINS_URL}/job/${encodeURIComponent(jobName)}/${buildNumber}/allure/`;
      }
    } catch {}
    return null;
  }

  async getJobParameters(jobName: string = JENKINS_JOB_NAME): Promise<any[]> {
    const jobInfo = await this.getJobInfo(jobName);
    const paramProp = jobInfo.property?.find((p: any) => p.parameterDefinitions);
    return paramProp?.parameterDefinitions || [];
  }
}

export const jenkinsService = new JenkinsService();
export default jenkinsService;
