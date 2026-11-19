const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importData() {
  const backupPath = path.join(__dirname, 'sqlite_backup.json');
  if (!fs.existsSync(backupPath)) {
    throw new Error('Backup file not found at: ' + backupPath);
  }

  const raw = fs.readFileSync(backupPath, 'utf8');
  const data = JSON.parse(raw);

  console.log('Beginning import into PostgreSQL...');

  // 1. Users
  console.log(`Importing ${data.users.length} users...`);
  for (const u of data.users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: u,
      create: u,
    });
  }

  // 2. Automation Modules
  console.log(`Importing ${data.modules.length} modules...`);
  for (const m of data.modules) {
    await prisma.automationModule.upsert({
      where: { id: m.id },
      update: m,
      create: m,
    });
  }

  // 3. Schedules
  console.log(`Importing ${data.schedules.length} schedules...`);
  for (const s of data.schedules) {
    await prisma.schedule.upsert({
      where: { id: s.id },
      update: s,
      create: s,
    });
  }

  // 4. Executions
  console.log(`Importing ${data.executions.length} executions...`);
  for (const e of data.executions) {
    await prisma.execution.upsert({
      where: { id: e.id },
      update: e,
      create: e,
    });
  }

  // 5. TestResults
  console.log(`Importing ${data.testResults.length} test results...`);
  for (const tr of data.testResults) {
    await prisma.testResult.upsert({
      where: { id: tr.id },
      update: tr,
      create: tr,
    });
  }

  // 6. Artifacts
  if (data.artifacts && data.artifacts.length > 0) {
    console.log(`Importing ${data.artifacts.length} artifacts...`);
    for (const a of data.artifacts) {
      await prisma.executionArtifact.upsert({
        where: { id: a.id },
        update: a,
        create: a,
      });
    }
  }

  // 7. WebhookEvents
  if (data.webhookEvents && data.webhookEvents.length > 0) {
    console.log(`Importing ${data.webhookEvents.length} webhook events...`);
    for (const w of data.webhookEvents) {
      await prisma.webhookEvent.upsert({
        where: { id: w.id },
        update: w,
        create: w,
      });
    }
  }

  console.log('✅ ALL DATA SUCCESSFULLY MIGRATED TO POSTGRESQL!');
}

importData()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

