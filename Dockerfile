# Build stage for frontend
FROM node:20-alpine as frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build stage for backend
FROM node:20-alpine as backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# Final stage
FROM node:20-alpine
WORKDIR /app

# Install required packages
RUN apk add --no-cache \
    nginx \
    openssl \
    openssl-dev \
    curl \
    su-exec \
    && rm -rf /var/cache/apk/*

# Copy frontend build and nginx config
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/http.d/default.conf

# Copy backend build
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package.json ./backend/package.json
COPY --from=backend-builder /app/backend/prisma ./backend/prisma

# Create required directories
RUN mkdir -p /data \
    && mkdir -p /run/nginx \
    && chown -R node:node /data \
    && chmod 755 /data \
    && chown -R root:root /run/nginx \
    && chmod -R 755 /run/nginx \
    && chown -R root:root /usr/share/nginx \
    && chmod -R 755 /usr/share/nginx

# Copy entrypoint script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Expose ports
EXPOSE 80 3000

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=file:/data/dev.db \
    ZAMMAD_URL=https://michaelguggenbichler.com \
    APP_PASSWORD=admin \
    JWT_SECRET=jklas9d823rjlaksdu08f9823r5 \
    DEBUG_LVL=debug

# Start services
ENTRYPOINT ["/docker-entrypoint.sh"]