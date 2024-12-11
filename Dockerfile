# syntax=docker/dockerfile:1.4

# Base Node.js image for building
FROM node:20-alpine AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Frontend build stage
FROM base AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY frontend/ .
RUN pnpm run build

# Backend build stage
FROM base AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY backend/ .
RUN pnpm run build
RUN pnpm prune --prod

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install nginx
RUN apk add --no-cache nginx

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Copy backend files
COPY --from=backend-builder /app/backend/dist /app/backend/dist
COPY --from=backend-builder /app/backend/node_modules /app/backend/node_modules
COPY --from=backend-builder /app/backend/package.json /app/backend/
COPY --from=backend-builder /app/backend/prisma /app/backend/prisma

# Copy nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create data directory for SQLite
RUN mkdir -p /data && chown -R node:node /data

# Copy entrypoint script
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=file:/data/dev.db

# Expose ports
EXPOSE 80 3000

# Switch to non-root user
USER node

# Set up volumes
VOLUME ["/data"]

# Start services
ENTRYPOINT ["/app/docker-entrypoint.sh"]