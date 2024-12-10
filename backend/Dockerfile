# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Generate Prisma client and build
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install curl for healthcheck
RUN apk --no-cache add curl

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production

# Copy built files and prisma schema
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create data directory
RUN mkdir -p /data

# Expose port
EXPOSE 3071

# Start the application
CMD ["npm", "start"]