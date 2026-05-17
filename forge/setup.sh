#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Forge Platform — One-command local setup
# Run once from the forge/ root:  bash setup.sh
# ─────────────────────────────────────────────────────────────
set -e

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${CYAN}[forge]${NC} $1"; }
ok()    { echo -e "${GREEN}[ok]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $1"; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗"
echo -e "║      Forge Local Setup               ║"
echo -e "╚══════════════════════════════════════╝${NC}"
echo ""

# ── Prereqs ──────────────────────────────────────────────────
command -v node >/dev/null 2>&1 || { echo -e "${RED}Error: Node.js not installed. Install from https://nodejs.org${NC}"; exit 1; }
NODE_VER=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
[[ $NODE_VER -lt 18 ]] && { echo -e "${RED}Error: Node.js 18+ required (you have $NODE_VER)${NC}"; exit 1; }
ok "Node.js $(node --version)"

# ── Backend setup ─────────────────────────────────────────────
info "Installing backend dependencies (forge-platform)..."
cd forge-platform

# Write .env if missing
if [ ! -f .env ]; then
  cat > .env << 'ENVEOF'
PORT=3000
NODE_ENV=development
JWT_SECRET=forge-local-dev-secret-at-least-32-chars
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3001
DB_PATH=./forge.db
ENVEOF
  ok "Created forge-platform/.env"
fi

npm install --no-audit --no-fund 2>&1 | tail -3
ok "Backend deps installed"
cd ..

# ── Frontend setup ────────────────────────────────────────────
info "Installing frontend dependencies (forge-web-studio)..."
cd forge-web-studio

# Write .env.local if missing
if [ ! -f .env.local ]; then
  cat > .env.local << 'ENVEOF'
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_ENABLE_AGENT_CREATION=true
NEXT_PUBLIC_ENABLE_WORKFLOW_CREATION=true
NEXT_PUBLIC_ENABLE_QUEUE_MONITORING=true
NEXT_PUBLIC_ENABLE_HISTORY_TRACKING=true
ENVEOF
  ok "Created forge-web-studio/.env.local"
fi

npm install --no-audit --no-fund 2>&1 | tail -3
ok "Frontend deps installed"
cd ..

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗"
echo -e "║  Setup complete! Start the stack with:           ║"
echo -e "║                                                  ║"
echo -e "║    bash start.sh                                 ║"
echo -e "║                                                  ║"
echo -e "║  Or start services separately:                   ║"
echo -e "║    cd forge-platform  && npm run dev  (port 3000)║"
echo -e "║    cd forge-web-studio && npm run dev (port 3001)║"
echo -e "╠══════════════════════════════════════════════════╣"
echo -e "║  Default login: admin@forge.local                ║"
echo -e "║  Password:      Admin1234!                       ║"
echo -e "╚══════════════════════════════════════════════════╝${NC}"
echo ""
