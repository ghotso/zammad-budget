# Build stage for frontend
FROM node:20-alpine as frontend-builder

# Set working directory
WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy source and build
COPY --chown=node:node frontend/ ./
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from frontend
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]