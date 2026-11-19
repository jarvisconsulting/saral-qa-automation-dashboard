import axios, { AxiosInstance } from 'axios';
import { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } from '../config';

export interface GitHubBranch {
  name: string;
  commit: { sha: string; url: string };
  protected: boolean;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
  html_url: string;
}

class GitHubService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: GITHUB_TOKEN
          ? (GITHUB_TOKEN.startsWith('github_pat_') ? `Bearer ${GITHUB_TOKEN}` : `token ${GITHUB_TOKEN}`)
          : undefined,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'SaralQADashboard/1.0',
      },
      timeout: 15000,
    });
  }

  get isConfigured(): boolean {
    return !!(GITHUB_TOKEN && GITHUB_REPO_OWNER && GITHUB_REPO_NAME);
  }

  async checkConnection(): Promise<{ connected: boolean; rateLimitRemaining?: number; error?: string; repo?: string }> {
    if (!this.isConfigured) {
      return { connected: false, error: 'GitHub not configured. Set GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME in .env' };
    }
    try {
      const response = await this.client.get('/rate_limit');
      const rateLimitRemaining = response.data.rate?.remaining;
      try {
        const repoRes = await this.client.get(`/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`);
        return { connected: true, rateLimitRemaining, repo: repoRes.data.full_name };
      } catch (repoErr: any) {
        const errMsg = repoErr.response?.data?.message || repoErr.message;
        return {
          connected: false,
          rateLimitRemaining,
          error: `Token authenticated, but repository '${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}' returned: ${errMsg}`,
        };
      }
    } catch (err: any) {
      return { connected: false, error: err.response?.data?.message || err.message };
    }
  }

  async getRepoInfo(): Promise<any> {
    const response = await this.client.get(`/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`);
    return response.data;
  }

  async getBranches(): Promise<GitHubBranch[]> {
    const response = await this.client.get(`/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/branches`, {
      params: { per_page: 50 },
    });
    return response.data;
  }

  async getDefaultBranch(): Promise<string> {
    const repo = await this.getRepoInfo();
    return repo.default_branch || 'main';
  }

  async getCommits(branch: string = 'main', count: number = 20): Promise<GitHubCommit[]> {
    const response = await this.client.get(`/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/commits`, {
      params: { sha: branch, per_page: count },
    });
    return response.data;
  }

  async getLatestCommit(branch: string = 'main'): Promise<GitHubCommit | null> {
    const commits = await this.getCommits(branch, 1);
    return commits[0] || null;
  }

  async getFilesChanged(commitSha: string): Promise<string[]> {
    const response = await this.client.get(`/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/commits/${commitSha}`);
    return (response.data.files || []).map((f: any) => f.filename);
  }

  async getContents(path: string, branch: string = 'main'): Promise<any> {
    const response = await this.client.get(
      `/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${path}`,
      { params: { ref: branch } }
    );
    return response.data;
  }
}

export const gitHubService = new GitHubService();
export default gitHubService;
