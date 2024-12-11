#!/bin/sh
set -e

# Function to wait for a service to be ready
wait_for_service() {
    local service=$1
    local port=$2
    local retries=30
    local wait=1

    echo "Waiting for $service to be ready..."
    while ! nc -z localhost $port; do
        if [ "$retries" -eq 0 ]; then
            echo "$service failed to start"
            exit 1
        fi
        retries=$((retries-1))
        sleep $wait
    done
    echo "$service is ready!"
}

# Initialize database if it doesn't exist
if [ ! -f "/data/dev.db" ]; then
    echo "Initializing database..."
    cd /app/backend && npx prisma migrate deploy
fi

# Start backend service
echo "Starting backend service..."
cd /app/backend && \
NODE_ENV=production \
DATABASE_URL=file:/data/dev.db \
PORT=3000 \
node dist/index.js &

# Wait for backend to be ready
wait_for_service "backend" 3000

# Start nginx
echo "Starting nginx..."
nginx -g 'daemon off;'

# Keep container running and handle signals
trap 'kill $(jobs -p)' EXIT
wait