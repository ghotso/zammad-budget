#!/bin/bash
set -e

echo "Starting Zammad Budget Manager"

# Start nginx in background
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

echo "Setting up database directory..."
if [ ! -f "/config/dev.db" ]; then
    echo "Initializing new database..."
    touch /config/dev.db
fi

echo "Verifying Prisma schema..."
if [ ! -f "/app/backend/prisma/schema.prisma" ]; then
    echo "Error: Prisma schema not found!"
    exit 1
fi

echo "Generating Prisma client..."
export DATABASE_URL="file:/config/dev.db"
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting backend server..."
exec node dist/index.js