#!/bin/sh
set -e

# Start nginx
nginx

# Initialize database directory
mkdir -p /data
touch /data/dev.db
chown node:node /data/dev.db
chmod 644 /data/dev.db

# Change to backend directory
cd /app/backend

# Run database migrations as node user
echo "Running Prisma migrations..."
export DATABASE_URL="file:/data/dev.db"
su-exec node sh -c 'npx prisma migrate deploy'

# Start backend server as node user
echo "Starting backend server..."
exec su-exec node node dist/index.js