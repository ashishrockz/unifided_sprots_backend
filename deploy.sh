#!/bin/bash
# ─────────────────────────────────────────────────────
# EC2 Deployment Script for Unified Sports Backend
# Run this ON the EC2 instance after initial setup
# Usage: bash deploy.sh
# ──��──────────────────────────────────────────────────
set -e

APP_DIR="/home/ubuntu/unified-sports-backend"

echo "▸ Pulling latest code..."
cd $APP_DIR
git pull origin main

echo "▸ Installing dependencies..."
npm ci --production=false

echo "▸ Building TypeScript..."
npm run build

echo "▸ Restarting PM2..."
pm2 restart ecosystem.config.js --update-env
pm2 save

echo "✅ Deployed successfully!"
