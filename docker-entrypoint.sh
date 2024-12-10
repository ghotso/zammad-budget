#!/bin/bash
set -e

echo "Starting Zammad Budget Manager"

# Switch to root to start nginx
su root -c "nginx -g 'daemon off;' &"
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

echo "Setting up Prisma..."
# Ensure the data directory exists
mkdir -p prisma/data

echo "Generating Prisma client..."
npx prisma generate --schema=./prisma/schema.prisma

echo "Running database migrations..."
DATABASE_URL="file:/app/backend/prisma/data/dev.db" npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "Starting backend server..."
exec node dist/index.js