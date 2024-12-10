# Build stage for frontend
FROM node:20.10 AS frontend-builder
WORKDIR /app/frontend

# Install dependencies
COPY frontend/package*.json ./
RUN set -ex && \
    npm install --legacy-peer-deps

# Build frontend
COPY frontend/ ./
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}
RUN set -ex && \
    npm run build || (echo "Frontend build failed" && exit 1)

# Build stage for backend
FROM node:20.10 AS backend-builder
WORKDIR /app/backend

# Install build dependencies
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY backend/package*.json ./
RUN set -ex && \
    npm install --legacy-peer-deps

# Copy backend files
COPY backend/ ./

# Update Prisma schema with absolute path
RUN sed -i 's|"file:./dev.db"|"file:/data/dev.db"|' prisma/schema.prisma

# Generate Prisma client
RUN set -ex && \
    DATABASE_URL="file:/data/dev.db" npx prisma generate

# Build backend
RUN set -ex && \
    npm run build || (echo "Backend build failed" && exit 1)

# Production stage
FROM node:20.10-slim AS runner

# Install nginx and debugging tools
RUN apt-get update && \
    apt-get install -y nginx tree && \
    mkdir -p /var/log/nginx /var/cache/nginx /run/nginx && \
    rm -rf /var/lib/apt/lists/*

# Remove default nginx config
RUN rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-available/default

# Copy frontend build and nginx config
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Set proper permissions
RUN chown -R www-data:www-data /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Set up backend
WORKDIR /app/backend

# Copy backend files
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/prisma ./prisma

# Create data directory
RUN mkdir -p /data && \
    chown -R node:node /data /app/backend/prisma

# Environment variables with defaults
ENV NODE_ENV=production \
    DATABASE_URL="file:/data/dev.db" \
    PORT=3000 \
    APP_PASSWORD=admin \
    JWT_SECRET=zammad_budget_jwt_secret_2024

# Start script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create volume mount points
VOLUME ["/data"]

EXPOSE 80 3000
ENTRYPOINT ["/docker-entrypoint.sh"]