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
RUN set -ex && \
    npm run build

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

# Generate Prisma client and build
RUN set -ex && \
    npx prisma generate && \
    mkdir -p dist && \
    npm run build && \
    ls -la dist/

# Production stage
FROM node:20.10-slim AS runner

# Install nginx
RUN apt-get update && \
    apt-get install -y nginx && \
    rm -rf /var/lib/apt/lists/*

# Copy frontend build and nginx config
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Set up backend
WORKDIR /app/backend

# Copy backend files
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/prisma ./prisma

# Create volume for SQLite database
VOLUME /app/backend/prisma

# Environment variables with defaults
ENV NODE_ENV=production \
    DATABASE_URL=file:./prisma/dev.db \
    PORT=3000

# Start script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80 3000
ENTRYPOINT ["/docker-entrypoint.sh"]