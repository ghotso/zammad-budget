#!/bin/sh
set -e

# Switch back to root to start nginx
su root -c "nginx"

# Change to backend directory
cd /app/backend

# Initialize database directory
mkdir -p /data
touch /data/dev.db
chmod 644 /data/dev.db

# Run database migrations
echo "Running Prisma generate..."
npx prisma generate

echo "Running Prisma migrations..."
DATABASE_URL="file:/data/dev.db" npx prisma migrate deploy

# Start backend server
echo "Starting backend server..."
exec node dist/index.js