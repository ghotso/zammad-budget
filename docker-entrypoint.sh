#!/bin/sh
set -e

# Start nginx in background
nginx

# Change to backend directory
cd /app/backend

# Run database migrations
npx prisma generate
npx prisma migrate deploy

# Start backend server
exec node dist/index.js