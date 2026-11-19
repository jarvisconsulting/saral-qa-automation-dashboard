import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 4000;
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
export const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';
export const JWT_EXPIRES_IN = '7d';

export const JENKINS_URL = process.env.JENKINS_URL || '';
export const JENKINS_USER = process.env.JENKINS_USER || '';
export const JENKINS_TOKEN = process.env.JENKINS_TOKEN || '';
export const JENKINS_JOB_NAME = process.env.JENKINS_JOB_NAME || 'event-module-automation';

export const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
export const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER || '';
export const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME || 'saral-automation';
export const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

export const NODE_ENV = process.env.NODE_ENV || 'development';
