#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Forge Platform — Start both servers
# Run from forge/ root:  bash start.sh
# Stop with Ctrl+C
# ─────────────────────────────────────────────────────────────
set -e

CYAN='\033[0;36m'; GREEN='\033[0;32m'; NC='\033[0m'

cleanup() {
  echo ""
  echo -e "${CYAN}Shutting down...${NC}"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  echo -e "${GREEN}Done.${NC}"
}
trap cleanup INT TERM

echo ""
echo -e "${CYAN}Starting Forge Platform...${NC}"
echo ""

# Backend
cd forge-platform
npm run dev &
BACKEND_PID=$!
cd ..

# Give backend a moment to start
sleep 2

# Frontend
cd forge-web-studio
npm run dev -- --port 3001 &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗"
echo -e "║  Forge is running!                        ║"
echo -e "╠═══════════════════════════════════════════╣"
echo -e "║  Frontend  →  http://localhost:3001       ║"
echo -e "║  API       →  http://localhost:3000/api   ║"
echo -e "║  Health    →  http://localhost:3000/health║"
echo -e "╠═══════════════════════════════════════════╣"
echo -e "║  Login:  admin@forge.local / Admin1234!   ║"
echo -e "╠═══════════════════════════════════════════╣"
echo -e "║  Press Ctrl+C to stop                     ║"
echo -e "╚═══════════════════════════════════════════╝${NC}"
echo ""

wait $BACKEND_PID $FRONTEND_PID
