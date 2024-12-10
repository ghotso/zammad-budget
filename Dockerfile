# Build stage for frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build stage for backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./

# Install dependencies as node user
USER node
RUN npm install

# Copy backend files with correct ownership
COPY --chown=node:node backend/ ./

# Build and generate prisma
RUN npm run build
RUN npx prisma generate

# Final stage
FROM node:20-alpine AS runner
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

# Copy backend with correct permissions
COPY --from=backend-builder --chown=node:node /app/backend/dist ./backend/dist
COPY --from=backend-builder --chown=node:node /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=node:node /app/backend/package.json ./backend/package.json
COPY --from=backend-builder --chown=node:node /app/backend/prisma ./backend/prisma

# Create required directories with correct permissions
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

# Expose container ports (these will be mapped to 8071 and 3071 on host)
EXPOSE 80 3000

# Build arguments for secrets
ARG ZAMMAD_URL
ARG APP_PASSWORD
ARG JWT_SECRET
ARG DEBUG_LVL

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=file:/data/dev.db \
    ZAMMAD_URL=${ZAMMAD_URL:-https://michaelguggenbichler.com} \
    DEBUG_LVL=${DEBUG_LVL:-debug}

# Start services
ENTRYPOINT ["/docker-entrypoint.sh"]