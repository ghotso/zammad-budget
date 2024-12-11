# Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_APP_VERSION
ARG BUILD_TIMESTAMP
ENV NODE_ENV=production \
    VITE_APP_VERSION=${VITE_APP_VERSION} \
    BUILD_TIMESTAMP=${BUILD_TIMESTAMP}
RUN npm run build

# Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app

# Install nginx and other required packages
RUN apk add --no-cache \
    nginx \
    bash \
    openssl \
    curl \
    netcat-openbsd \
    su-exec \
    tzdata \
    && cp /usr/share/zoneinfo/UTC /etc/localtime \
    && echo "UTC" > /etc/timezone

# Create required directories
RUN mkdir -p /data \
    && mkdir -p /data/backups \
    && mkdir -p /run/nginx \
    && chown -R node:node /data \
    && chmod 755 /data

# Copy frontend build and nginx config
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/http.d/default.conf

# Copy backend build
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package.json ./backend/package.json
COPY --from=backend-builder /app/backend/prisma ./backend/prisma

# Copy entrypoint script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && chown -R nginx:nginx /etc/nginx/http.d \
    && chown -R nginx:nginx /run/nginx \
    && chown -R node:node /app/backend

# Environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=file:/data/dev.db \
    TZ=UTC

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Labels
LABEL org.opencontainers.image.title="Zammad Budget Manager" \
    org.opencontainers.image.description="Track and manage time budgets for Zammad organizations" \
    org.opencontainers.image.version=${VITE_APP_VERSION} \
    org.opencontainers.image.created=${BUILD_TIMESTAMP} \
    org.opencontainers.image.source="https://github.com/your-username/zammad-budget" \
    org.opencontainers.image.licenses="MIT"

# Expose ports
EXPOSE 80 3000

# Create volume mount points
VOLUME ["/data", "/data/backups"]

# Set entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]