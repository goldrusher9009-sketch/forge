#!/usr/bin/env bash
# VIVA — Full Docker Stack
# Builds + starts: postgres + api + frontend

set -e

echo "🐳 Building VIVA Docker stack..."

# Build images
docker compose build --parallel

echo "🚀 Starting all services..."
docker compose up -d --wait

echo ""
echo "✅ VIVA is running!"
echo ""
echo "   Frontend → http://localhost:3000"
echo "   API      → http://localhost:4000"
echo "   DB       → localhost:5432 (viva / viva_password / vivadb)"
echo ""
echo "Logs: docker compose logs -f"
echo "Stop: docker compose down"
