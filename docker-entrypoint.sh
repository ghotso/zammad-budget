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

# Function to handle cleanup
cleanup() {
    echo "Shutting down services..."
    
    # Kill backend process if running
    if [ -n "$BACKEND_PID" ] && ps -p $BACKEND_PID > /dev/null; then
        echo "Stopping backend service..."
        kill -TERM $BACKEND_PID
        wait $BACKEND_PID
    fi
    
    # Kill nginx if running
    if [ -n "$NGINX_PID" ] && ps -p $NGINX_PID > /dev/null; then
        echo "Stopping nginx..."
        kill -TERM $NGINX_PID
        wait $NGINX_PID
    fi
    
    echo "All services stopped"
    exit 0
}

# Setup signal traps
trap cleanup SIGTERM SIGINT

cd /app/backend

# Ensure DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL is not set"
    exit 1
fi

# Initialize Prisma
echo "Initializing Prisma..."

# Generate Prisma client
echo "Generating Prisma client..."
if ! NODE_ENV=production pnpm exec prisma generate; then
    echo "Failed to generate Prisma client"
    exit 1
fi

# Initialize database if it doesn't exist
if [ ! -f "/data/dev.db" ]; then
    echo "Initializing database..."
    if ! NODE_ENV=production pnpm exec prisma migrate deploy; then
        echo "Failed to deploy migrations"
        exit 1
    fi
else
    echo "Database exists, checking for migrations..."
    if ! NODE_ENV=production pnpm exec prisma migrate deploy; then
        echo "Failed to deploy migrations"
        exit 1
    fi
fi

# Start backend service
echo "Starting backend service..."
NODE_ENV=production \
DATABASE_URL=file:/data/dev.db \
PORT=3000 \
node dist/index.js &
BACKEND_PID=$!

# Wait for backend to be ready
wait_for_service "backend" 3000

# Start nginx
echo "Starting nginx..."
nginx -g 'daemon off;' &
NGINX_PID=$!

# Keep container running and handle signals
wait