#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/app/thinkthentalk-new}"
BACKEND_PROCESS="${BACKEND_PROCESS:-thinkthentalk-backend}"
FRONTEND_PROCESS="${FRONTEND_PROCESS:-thinkthentalk-frontend}"

cd "$APP_DIR"

echo "🚀 Deploying $(git branch --show-current) from $APP_DIR"

# Local edits on the server make the running code impossible to audit. Back up
# or remove them explicitly before deploying; never overwrite them implicitly.
if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
  echo "❌ Server worktree is dirty. Back up/reconcile these files first:"
  git status --short --untracked-files=all
  exit 1
fi

echo "📥 Synchronizing with origin/main..."
git fetch origin main
git pull --ff-only origin main

echo "📦 Installing and building backend..."
pnpm --dir backend install --frozen-lockfile
pnpm --dir backend run build

echo "📦 Installing and building frontend..."
pnpm --dir frontend install --frozen-lockfile
pnpm --dir frontend run build

echo "🔁 Restarting PM2 processes..."
pm2 restart "$BACKEND_PROCESS" --update-env
pm2 restart "$FRONTEND_PROCESS" --update-env

echo "✅ Deployment finished successfully!"
