# Build stage for frontend
FROM node:20.10-alpine AS frontend-builder
WORKDIR /app/frontend

# Install dependencies
COPY frontend/package*.json ./
RUN echo "Installing frontend dependencies..." && \
    npm install --no-audit --no-fund

# Build frontend
COPY frontend/ ./
ARG VITE_API_URL=http://localhost:3000
RUN echo "Building frontend..." && \
    npm run build

# Build stage for backend
FROM node:20.10-alpine AS backend-builder
WORKDIR /app/backend

# Install dependencies
COPY backend/package*.json ./
RUN echo "Installing backend dependencies..." && \
    npm install --no-audit --no-fund

# Build backend
COPY backend/ ./
RUN echo "Building backend..." && \
    npm run build

# Production stage
FROM node:20.10-alpine AS runner

# Install nginx
RUN apk add --no-cache nginx

# Copy frontend build and nginx config
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/http.d/default.conf

# Set up backend
WORKDIR /app/backend
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package.json ./
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