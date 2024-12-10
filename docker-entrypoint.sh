#!/bin/sh
set -e

echo "Starting Zammad Budget Manager"

# Start nginx in background
nginx

# Initialize database and start backend
cd /app/backend

echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting backend server..."
exec node dist/index.js