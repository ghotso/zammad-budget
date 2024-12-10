#!/bin/sh
set -e

# Start nginx as root
nginx

# Initialize database directory
mkdir -p /data
touch /data/dev.db
chown node:node /data/dev.db
chmod 644 /data/dev.db

# Change to backend directory
cd /app/backend

# Run database migrations as node user
echo "Running Prisma generate..."
su-exec node npx prisma generate

echo "Running Prisma migrations..."
su-exec node DATABASE_URL="file:/data/dev.db" npx prisma migrate deploy

# Start backend server as node user
echo "Starting backend server..."
exec su-exec node node dist/index.js