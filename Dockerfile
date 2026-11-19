# ==============================================================================
# Multi-Stage Unified Dockerfile: Saral QA Automation Dashboard
# Packages React Frontend + Express Backend + Prisma in a Single Container
# Compatible with Google Cloud Run, GCP Compute Engine (GCE), GKE, and Docker VMs
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend (Vite + React + Tailwind CSS)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Build Backend (TypeScript + Express + Prisma)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/prisma ./prisma
RUN npx prisma generate

COPY backend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 3: Production Runtime
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Install OpenSSL (required by Prisma engines on Alpine) and dumb-init
RUN apk add --no-cache openssl dumb-init

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install production dependencies only
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy Prisma schema and generate client for the Alpine architecture
COPY backend/prisma ./prisma
RUN npx prisma generate

# Copy compiled backend dist from builder
COPY --from=backend-builder /app/backend/dist ./dist

# Copy built frontend assets into public/ (served statically by Express)
COPY --from=frontend-builder /app/frontend/dist ./public

# Copy entrypoint script and ensure Unix line endings
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh

# Cloud Run defaults to $PORT (typically 8080), local/standalone often uses 4000
EXPOSE 8080 4000

# Handle container signals gracefully
ENTRYPOINT ["/usr/bin/dumb-init", "--", "/app/docker-entrypoint.sh"]

CMD ["node", "dist/server.js"]

