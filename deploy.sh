#!/bin/bash

echo "🚀 Starting deployment..."

cd /var/www/thinkthentalk || exit

echo "📥 Pulling latest code..."
git pull

echo "📦 Installing backend deps..."
cd backend
pnpm install

echo "🏗️ Building backend..."
pnpm run build

echo "📦 Installing frontend deps..."
cd ../frontend
pnpm install

echo "🏗️ Building frontend..."
pnpm run build

echo "🔁 Restarting PM2 processes..."
pm2 restart thinkthentalk-backend
pm2 restart thinkthentalk-frontend

echo "✅ Deployment finished successfully!"
