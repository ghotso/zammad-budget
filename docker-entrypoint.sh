#!/bin/bash
set -e

echo "Starting Zammad Budget Manager"

# Create nginx directories if they don't exist
mkdir -p /var/log/nginx
mkdir -p /var/cache/nginx
mkdir -p /run/nginx

# Start nginx in background with proper error handling
nginx -g 'daemon off;' &
NGINX_PID=$!

# Wait a moment to ensure nginx has started
sleep 2

# Check if nginx is running
if ! kill -0 $NGINX_PID 2>/dev/null; then
    echo "Nginx failed to start. Checking error log:"
    cat /var/log/nginx/error.log
    exit 1
fi

# Initialize database and start backend
cd /app/backend

echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting backend server..."
exec node dist/index.js