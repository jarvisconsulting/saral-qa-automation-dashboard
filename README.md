# Saral QA Automation Execution & Monitoring Dashboard

Standalone, production-grade automation management dashboard integrated with **Jenkins (Linux VM)** and **GitHub (saral-automation monorepo)** for the **Staging Environment**.

---

## ⚠️ Critical Architectural Environment Constraint

> **Automation coverage is currently available for the STAGING ENVIRONMENT ONLY.**
>
> All test suites, WebdriverIO configs, and Jenkins pipelines target `https://zila-staging.ccdms.in`.
> The dashboard strictly prevents triggering or claiming QA/Production test executions.

---

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                 SARAL QA DASHBOARD (Independent)            │
│                                                             │
│   ┌─────────────────────┐       ┌───────────────────────┐   │
│   │   Frontend (React)  │◄─────►│   Backend (Node/TS)   │   │
│   │   Tailwind + Recharts│       │   Express + Socket.io │   │
│   └─────────────────────┘       └───────────┬───────────┘   │
│                                             │               │
│                                 ┌───────────▼───────────┐   │
│                                 │   Database (SQLite)   │   │
│                                 │   Prisma ORM          │   │
│                                 └───────────────────────┘   │
└─────────────────────────────────────────────┬───────────────┘
                                              │
                      ┌───────────────────────┼───────────────────────┐
                      │                       │                       │
                      ▼                       ▼                       ▼
            ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
            │   Jenkins VM     │    │      GitHub      │    │     Firebase     │
            │  34.131.246.72   │    │  saral-automation│    │  App Distribution│
            │  REST API v2     │    │  Webhooks & Sync │    │  (App Tester)    │
            └──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 🚀 Quick Start

### 1. Clone & Configure Backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
npm run build
npm start
```

### 2. Configure Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

Default login credentials:
- **Email:** `admin@saral.qa`
- **Password:** `admin123`

---

## 🧪 Discovered Monorepo Automation Suites

| Module | Framework | Platform | Staging Job |
|---|---|---|---|
| `event-module-automation` | WebdriverIO + Appium + Locust | Web, Android, iOS, API | `event-module-automation` |
| `form-builder-automation` | WebdriverIO | Web, Android, iOS | `form-builder-automation` |
| `mann_ki_baat_automation` | WebdriverIO | Web, Android | `mann-ki-baat-automation` |
| `saral-attendance-automation` | WebdriverIO | Web, Android, iOS | `saral-attendance-automation` |
| `saral_web_automation` | Selenium / Cucumber (Java) | Web | `saral-web-automation` |
| `saral_android_automation` | WebdriverIO + Appium | Android Mobile | `saral-android-automation` |
| `saral-ios-automation` | WebdriverIO + Appium | iOS Mobile | `saral-ios-automation` |
| `voters-outreach-automation-playwright` | Playwright | Web | `voters-outreach-playwright` |
| `voters_outreach_automation` | WebdriverIO + Cucumber | Web, Android, iOS | `voters-outreach-automation` |

---

## 🐳 Docker Deployment
```bash
docker compose up --build -d
```
Dashboard Frontend: [http://localhost:5173](http://localhost:5173)
Backend API: [http://localhost:4000](http://localhost:4000)
Health Check: [http://localhost:4000/health](http://localhost:4000/health)
