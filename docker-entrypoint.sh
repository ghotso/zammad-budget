#!/bin/bash
set -e

echo "Starting Zammad Budget Manager"

# Debug: Show directory structure
echo "Current directory structure:"
tree /app/backend/prisma
tree /data

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
if [ ! -f "/data/dev.db" ]; then
    echo "Initializing new database..."
    touch /data/dev.db
fi

echo "Verifying Prisma schema..."
if [ ! -f "/app/backend/prisma/schema.prisma" ]; then
    echo "Error: Prisma schema not found at /app/backend/prisma/schema.prisma!"
    echo "Contents of /app/backend/prisma:"
    ls -la /app/backend/prisma/
    exit 1
fi

echo "Checking Prisma schema content:"
cat /app/backend/prisma/schema.prisma

echo "Generating Prisma client..."
DATABASE_URL="file:/data/dev.db" \
    npx prisma generate --schema=/app/backend/prisma/schema.prisma

echo "Running database migrations..."
DATABASE_URL="file:/data/dev.db" \
    npx prisma migrate deploy --schema=/app/backend/prisma/schema.prisma

echo "Starting backend server..."
DATABASE_URL="file:/data/dev.db" \
    exec node dist/index.js