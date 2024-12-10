FROM node:20-alpine AS base
WORKDIR /app

# Frontend build
FROM base AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
ARG VITE_API_URL=http://localhost:3000
RUN npm run build

# Backend build
FROM base AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# Production image
FROM base AS runner

# Install nginx
RUN apk add --no-cache nginx

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/http.d/default.conf

# Copy backend build
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
    JWT_SECRET=default_jwt_secret_change_me \
    APP_PASSWORD=admin \
    ZAMMAD_URL=https://your-zammad-instance.com \
    ZAMMAD_TOKEN=your_token_here

# Start script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80 3000
ENTRYPOINT ["/docker-entrypoint.sh"]