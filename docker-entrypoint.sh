#!/bin/bash
set -e

# Function to wait for a service to be ready
wait_for() {
    local host="$1"
    local port="$2"
    local service="$3"
    local retries=30
    local wait=1

    echo "Waiting for $service to be ready..."
    while ! nc -z "$host" "$port"; do
        retries=$((retries - 1))
        if [ $retries -eq 0 ]; then
            echo >&2 "$service is not available"
            exit 1
        fi
        sleep $wait
    done
    echo "$service is ready!"
}

# Ensure required environment variables
: "${JWT_SECRET:?JWT_SECRET is required}"
: "${APP_PASSWORD:?APP_PASSWORD is required}"
: "${DATABASE_URL:?DATABASE_URL is required}"

# Create data directory if it doesn't exist
mkdir -p /data
chown -R node:node /data

# Switch to node user for Prisma operations
su-exec node:node bash << 'EOF'
cd /app/backend

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Create database if it doesn't exist
if [ ! -f "/data/dev.db" ]; then
    echo "Initializing database..."
    npx prisma db push
fi
EOF

# Start nginx in background
echo "Starting nginx..."
nginx -g 'daemon off;' &

# Wait for nginx to start
wait_for 0.0.0.0 80 "nginx"

# Start backend server
echo "Starting backend server..."
cd /app/backend

# Export environment variables for the backend
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}
export JWT_SECRET=${JWT_SECRET}
export APP_PASSWORD=${APP_PASSWORD}
export DATABASE_URL=${DATABASE_URL}
export ZAMMAD_URL=${ZAMMAD_URL}
export ZAMMAD_TOKEN=${ZAMMAD_TOKEN}

# Start the backend server as node user
su-exec node:node node dist/index.js &

# Wait for backend to start
wait_for 0.0.0.0 3000 "backend"

echo "All services are running!"

# Keep container running and forward logs
exec tail -f /var/log/nginx/access.log /var/log/nginx/error.log