# Deployment & Operations Guide
## Saral QA Automation Execution & Monitoring Dashboard

---

## 1. Prerequisites
- **Node.js:** v18+ or v20 LTS
- **Docker & Docker Compose:** (Optional for containerized deployment)
- **Jenkins Access:** Network route to `http://34.131.246.72:8080` (or company VPN)
- **GitHub Repository Access:** Personal access token with `repo` scope for `saral-automation`

---

## 2. Environment Variables Specification

Create `.env` in `backend/` with the following parameters:

```ini
# Application Port
PORT=4000
CORS_ORIGIN=http://localhost:5173

# SQLite Database Location
DATABASE_URL="file:./prisma/dev.db"

# JWT Secret Key
JWT_SECRET=generate_a_random_32_character_string_here

# Jenkins Linux VM Integration
JENKINS_URL=http://34.131.246.72:8080
JENKINS_USER=your_jenkins_username
JENKINS_TOKEN=your_jenkins_api_token
JENKINS_JOB_NAME=event-module-automation

# GitHub Integration
GITHUB_TOKEN=ghp_your_github_personal_access_token
GITHUB_REPO_OWNER=your_github_organization
GITHUB_REPO_NAME=saral-automation
GITHUB_WEBHOOK_SECRET=your_generated_webhook_hmac_secret

# Runtime Environment
NODE_ENV=production
```

---

## 3. Jenkins Linux VM Connection & Security

1. **API Token Creation:**
   - Log into Jenkins at `http://34.131.246.72:8080`.
   - Click on your username in the top right → **Configure**.
   - Under **API Token**, click **Add new Token** → Name it `SaralQADashboard` → Click **Generate**.
   - Copy the token and paste it into `JENKINS_TOKEN` in `backend/.env`.

2. **Allowlisting Parameters:**
   - The dashboard validates every trigger request against the allowlisted parameters from the Jenkinsfile:
     - `TEST_COMMAND`
     - `ANDROID_DEVICE_TYPE` (`virtual`, `real`)
     - `EMULATOR_NAME` (`DEVICE-ANDROID-5` through `DEVICE-ANDROID-16`)
     - `WEB_TAGS`
     - `EMAIL`
   - Arbitrary shell commands are strictly disallowed.

---

## 4. GitHub Webhook Configuration

1. In GitHub, navigate to `https://github.com/<owner>/saral-automation/settings/hooks`.
2. Click **Add webhook**.
3. **Payload URL:** `https://<your-dashboard-domain>/api/webhooks/github`
4. **Content type:** `application/json`
5. **Secret:** The same secret string placed in `GITHUB_WEBHOOK_SECRET`.
6. Select **Just the push event**.
7. Click **Add webhook**.

---

## 5. Production PM2 Daemon Deployment (Alternative to Docker)

```bash
# Install PM2 globally
npm install -g pm2

# Start Backend
cd /path/to/SaralQADashboard/backend
pm2 start dist/server.js --name "saral-qa-backend"

# Start Frontend (built with Nginx or static file server)
cd ../frontend
pm2 serve dist 5173 --name "saral-qa-frontend" --spa
```

---

## 6. Backup & Recovery

- The primary persistent state is stored in SQLite at `backend/prisma/dev.db`.
- Back up this file periodically:
```bash
# Snapshot SQLite database safely
sqlite3 backend/prisma/dev.db ".backup 'backend/prisma/backup-$(date +%Y%m%d).db'"
```
