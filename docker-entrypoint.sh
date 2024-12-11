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
wait_for localhost 80 "nginx"

# Start backend server
echo "Starting backend server..."
cd /app/backend
su-exec node:node node dist/index.js &

# Wait for backend to start
wait_for localhost 3000 "backend"

echo "All services are running!"

# Keep container running
tail -f /dev/null