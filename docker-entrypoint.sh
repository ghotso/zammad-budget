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

echo "Setting up Prisma..."
# Ensure the data directory exists
mkdir -p /config/prisma/data

# Create symlink if it doesn't exist
if [ ! -L /app/backend/prisma/data ]; then
    ln -s /config/prisma/data /app/backend/prisma/data
fi

echo "Generating Prisma client..."
npx prisma generate --schema=/app/backend/prisma/schema.prisma

echo "Running database migrations..."
DATABASE_URL="file:/config/prisma/data/dev.db" npx prisma migrate deploy --schema=/app/backend/prisma/schema.prisma

echo "Starting backend server..."
DATABASE_URL="file:/config/prisma/data/dev.db" exec node dist/index.js