# Build stage for frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./

# Set ownership and install dependencies
RUN chown -R node:node .
USER node
RUN npm install

# Copy source and build
COPY --chown=node:node frontend/ ./
# Ensure production environment
ENV NODE_ENV=production
RUN npm run build

# Build stage for backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./

# Set ownership and install dependencies
RUN chown -R node:node .
USER node
RUN npm install

# Copy source
COPY --chown=node:node backend/ ./
# Generate Prisma client first, then build
RUN npx prisma generate && \
    npm run build

# Final stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install required packages
RUN apk add --no-cache \
    nginx \
    openssl \
    openssl-dev \
    curl \
    netcat-openbsd \
    su-exec \
    && rm -rf /var/cache/apk/*

# Create required directories with correct permissions
RUN mkdir -p /data \
    && mkdir -p /run/nginx \
    && chown -R node:node /data \
    && chmod 755 /data \
    && chown -R root:root /run/nginx \
    && chmod -R 755 /run/nginx \
    && chown -R root:root /usr/share/nginx \
    && chmod -R 755 /usr/share/nginx

# Copy frontend build and nginx config
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/http.d/default.conf

# Copy backend with correct permissions
COPY --from=backend-builder --chown=node:node /app/backend/dist ./backend/dist
COPY --from=backend-builder --chown=node:node /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=node:node /app/backend/package.json ./backend/package.json
COPY --from=backend-builder --chown=node:node /app/backend/prisma ./backend/prisma

# Copy entrypoint script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Expose container ports
EXPOSE 80 3000

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=file:/data/dev.db \
    DEBUG_LVL=debug

# Start services
ENTRYPOINT ["/docker-entrypoint.sh"]