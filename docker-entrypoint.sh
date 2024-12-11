#!/bin/sh
set -e

echo "Starting services..."

# Initialize database directory
echo "Initializing database directory..."
mkdir -p /data
touch /data/dev.db
chown node:node /data/dev.db
chmod 644 /data/dev.db

# Change to backend directory
cd /app/backend

# Run database migrations as node user
echo "Running Prisma migrations..."
export DATABASE_URL="file:/data/dev.db"
su-exec node sh -c 'npx prisma generate && npx prisma migrate deploy'

# Start backend server as node user in the background
echo "Starting backend server..."
su-exec node node dist/index.js &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
timeout=30
while ! nc -z localhost 3000; do
  if [ "$timeout" -le "0" ]; then
    echo "Timeout waiting for backend"
    exit 1
  fi
  timeout=$((timeout-1))
  sleep 1
done

echo "Backend is ready. Starting nginx..."
# Start nginx in the foreground
nginx -g 'daemon off;' &
NGINX_PID=$!

# Monitor both processes
echo "All services started. Monitoring processes..."
wait $BACKEND_PID $NGINX_PID