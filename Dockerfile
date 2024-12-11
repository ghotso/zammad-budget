# syntax=docker/dockerfile:1.4

# Base Node.js image for building
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    nginx \
    netcat-openbsd

WORKDIR /app

# Frontend build stage
FROM base AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN pnpm install --no-frozen-lockfile --prod=false
COPY frontend/ ./
RUN pnpm run build && pnpm prune --prod

# Backend build stage
FROM base AS backend-builder
WORKDIR /app/backend

# Copy package files and install dependencies
COPY backend/package.json ./
RUN pnpm install --no-frozen-lockfile --prod=false

# Copy source files
COPY backend/ ./

# Generate Prisma client
RUN NODE_ENV=production pnpm exec prisma generate

# Build TypeScript
RUN pnpm run build

# Clean up dev dependencies but keep Prisma
RUN pnpm prune --prod

# Production stage
FROM base AS runner
WORKDIR /app

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Copy backend files
COPY --from=backend-builder /app/backend/dist /app/backend/dist
COPY --from=backend-builder /app/backend/node_modules /app/backend/node_modules
COPY --from=backend-builder /app/backend/package.json /app/backend/
COPY --from=backend-builder /app/backend/prisma /app/backend/prisma

# Ensure Prisma client is copied
COPY --from=backend-builder /app/backend/node_modules/.prisma /app/backend/node_modules/.prisma
COPY --from=backend-builder /app/backend/node_modules/@prisma /app/backend/node_modules/@prisma

# Copy nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create data directory for SQLite
RUN mkdir -p /data && chown -R node:node /data

# Copy entrypoint script
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=file:/data/dev.db

# Expose ports
EXPOSE 80 3000

# Switch to non-root user
USER node

# Set up volumes
VOLUME ["/data"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD nc -z localhost 3000 || exit 1

# Start services
ENTRYPOINT ["/app/docker-entrypoint.sh"]