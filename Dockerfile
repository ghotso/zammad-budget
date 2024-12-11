# syntax=docker/dockerfile:1.4

# Base Node.js image for building
FROM node:20-alpine AS base

# Install pnpm and system dependencies
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate && \
    apk add --no-cache \
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

# Copy package files and install dependencies
COPY frontend/package.json ./
RUN pnpm install --no-frozen-lockfile

# Copy source files
COPY frontend/ ./
RUN pnpm run build && pnpm prune --prod

# Backend build stage
FROM base AS backend-builder
WORKDIR /app/backend

# Copy package files and install dependencies
COPY backend/package.json ./
RUN pnpm install --no-frozen-lockfile

# Copy source files
COPY backend/ ./

# Generate Prisma client and build TypeScript
RUN NODE_ENV=production pnpm exec prisma generate && \
    pnpm run build && \
    pnpm prune --prod

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

# Copy nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create data directory for SQLite with proper permissions
RUN mkdir -p /data && chown -R node:node /data

# Copy entrypoint script and set permissions
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh && chown node:node /app/docker-entrypoint.sh

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=file:/data/dev.db \
    PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x

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