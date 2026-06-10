#!/usr/bin/env bash
# VIVA — Local Dev Start Script
# Starts postgres via Docker, then API + frontend natively

set -e

echo "🚀 Starting VIVA dev environment..."

# ── Step 1: Start Postgres ──────────────────────────────
echo "📦 Starting PostgreSQL..."
docker compose up postgres -d --wait

# ── Step 2: Install API deps ────────────────────────────
echo "📦 Installing API dependencies..."
cd apps/api
npm install
npx prisma generate

# ── Step 3: Run migrations ──────────────────────────────
echo "🗃️  Running database migrations..."
npx prisma migrate dev --name init

# ── Step 4: Seed database ───────────────────────────────
echo "🌱 Seeding database..."
npx tsx src/seed.ts

cd ../..

# ── Step 5: Install frontend deps ───────────────────────
echo "📦 Installing frontend dependencies..."
cd apps/web
npm install --legacy-peer-deps
cd ../..

# ── Step 6: Start everything ────────────────────────────
echo ""
echo "✅ Ready! Starting servers..."
echo ""
echo "   Frontend → http://localhost:3000"
echo "   API      → http://localhost:4000"
echo "   API Docs → http://localhost:4000/health"
echo ""

# Start API in background
cd apps/api && npm run dev &
API_PID=$!

# Start frontend in foreground
cd ../web && npm run dev

# Cleanup on exit
trap "kill $API_PID 2>/dev/null; docker compose stop postgres" EXIT
