#!/bin/sh
set -e

echo "================================================="
echo "  Saral QA Automation Dashboard                  "
echo "  Target: Unified Single-Container Service       "
echo "  Environment: Staging (Automated QA Engine)     "
echo "================================================="

# Synchronize database schema if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "[Database] Synchronizing schema with Prisma..."
  npx prisma db push --skip-generate --accept-data-loss || {
    echo "[Database Warning] Schema push encountered an issue, proceeding to server start..."
  }
else
  echo "[Database Warning] DATABASE_URL is not set. Ensure database configuration is provided if required."
fi

# Optional database seeding
if [ "$SEED_DATABASE" = "true" ]; then
  echo "[Database] Running database seed..."
  node -e "try { require('./prisma/seed.ts') } catch(e) { console.log('Seed skipped or already populated.'); }" || true
fi

echo "[Server] Launching application on port ${PORT:-8080}..."
exec "$@"

