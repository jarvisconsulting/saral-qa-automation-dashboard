const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backup() {
  const data = {
    users: await prisma.user.findMany(),
    modules: await prisma.automationModule.findMany(),
    executions: await prisma.execution.findMany(),
    testResults: await prisma.testResult.findMany(),
    artifacts: await prisma.executionArtifact.findMany(),
    schedules: await prisma.schedule.findMany(),
    webhookEvents: await prisma.webhookEvent.findMany(),
    jenkinsJobs: await prisma.jenkinsJob.findMany(),
    gitRepositories: await prisma.gitRepository.findMany(),
    settings: await prisma.setting.findMany(),
  };

  const outPath = path.join(__dirname, 'sqlite_backup.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log('Backup written to:', outPath);
  console.log('Record counts:');
  for (const [k, v] of Object.entries(data)) {
    console.log(`  ${k}: ${v.length}`);
  }
}

backup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

