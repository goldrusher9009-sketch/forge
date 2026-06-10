#!/usr/bin/env bash
# VIVA — Online Deployment Script
# Deploys: Frontend → Vercel, Backend → Railway

set -e

echo "🚀 VIVA Online Deployment"
echo ""

# ── Check tools ──────────────────────────────────────────
check_tool() {
  if ! command -v "$1" &>/dev/null; then
    echo "❌ $1 not found. Install: $2"
    exit 1
  fi
}

check_tool node "https://nodejs.org"
check_tool npm "https://nodejs.org"

# ── Frontend: Vercel ─────────────────────────────────────
echo "📦 Deploying frontend to Vercel..."
cd apps/web

if ! command -v vercel &>/dev/null; then
  npm install -g vercel
fi

npm install --legacy-peer-deps
vercel --prod

cd ../..

# ── Backend: Railway ─────────────────────────────────────
echo ""
echo "📦 Deploying backend to Railway..."
cd apps/api

if ! command -v railway &>/dev/null; then
  npm install -g @railway/cli
fi

npm install
railway up --detach

cd ../..

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "Next steps:"
echo "1. Set NEXT_PUBLIC_API_URL in Vercel dashboard → Settings → Environment Variables"
echo "2. Set DATABASE_URL, JWT secrets in Railway dashboard"
echo "3. Run: cd apps/api && DATABASE_URL=<prod-url> npx prisma migrate deploy"
echo "4. Run: cd apps/api && DATABASE_URL=<prod-url> npx tsx src/seed.ts"
