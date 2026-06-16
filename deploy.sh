#!/bin/bash
set -e

echo "=== Finance App Deployment ==="
cd /opt/finance-app

# Clean and install dependencies
echo "Installing dependencies..."
rm -rf node_modules package-lock.json
npm install

# Build for production
echo "Building..."
npm run build

# Create data directory for SQLite
mkdir -p data

# Push database schema
echo "Setting up database..."
npm run db:push

# Seed demo data
echo "Seeding data..."
npx tsx db/seed.ts

# Kill existing process on port 3001 if any
fuser -k 3001/tcp 2>/dev/null || true

# Start with PM2
echo "Starting with PM2..."
pm2 delete finance-app 2>/dev/null || true
NODE_ENV=production pm2 start dist/boot.js --name finance-app -- --port 3001
pm2 save

echo "=== Deployment Complete ==="
echo "App running on http://localhost:3001"
echo ""
echo "Next: configure nginx (see /opt/finance-app/nginx-finance.conf)"
