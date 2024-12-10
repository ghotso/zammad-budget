#!/bin/sh

# Print environment variables (excluding sensitive ones)
echo "Starting Zammad Budget Manager with configuration:"
echo "NODE_ENV: $NODE_ENV"
echo "ZAMMAD_URL: $ZAMMAD_URL"
echo "Database URL: $DATABASE_URL"

# Start nginx in background
nginx

# Initialize database and start backend
cd /app/backend
echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting backend server..."
node dist/index.js