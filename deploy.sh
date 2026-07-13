#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=========================================="
echo "🚀 Starting Deployment for Forever Us"
echo "=========================================="

# 1. Pull latest code
echo "📥 Pulling latest updates from Git..."
git pull origin main

# 2. Deploy Backend
echo "📦 Setting up backend server..."
cd server
npm install --production
echo "🔄 Restarting backend server under PM2..."
pm2 startOrReload ../ecosystem.config.cjs --env production
cd ..

# 3. Deploy Frontend
echo "📦 Setting up frontend client..."
cd client
npm install
echo "⚙️ Building static files for production..."
npm run build
cd ..

echo "=========================================="
echo "✅ Deployment completed successfully!"
echo "🚀 App is live and running under PM2."
echo "=========================================="
