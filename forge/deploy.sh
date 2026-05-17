#!/usr/bin/env bash
# Forge Platform — One-command deployment to Railway + Vercel
# Usage: bash deploy.sh
set -e

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${BLUE}[forge]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
error()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Prerequisites check ──────────────────────────────────────
info "Checking prerequisites..."
command -v node >/dev/null 2>&1 || error "Node.js not found. Install from https://nodejs.org"
command -v git >/dev/null 2>&1 || error "Git not found. Install from https://git-scm.com"
node_version=$(node -e "process.exit(parseInt(process.version.slice(1)) < 18 ? 1 : 0)" 2>/dev/null && echo "ok" || echo "old")
[[ "$node_version" == "old" ]] && error "Node.js 18+ required. Current: $(node --version)"
success "Node.js $(node --version)"

# ── Step 1: GitHub repo ─────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " STEP 1: Push to GitHub"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  1. Create a new GitHub repo at: https://github.com/new"
echo "     Name it: forge  (make it private or public — your choice)"
echo ""
read -p "  Enter your GitHub repo URL (e.g. https://github.com/yourname/forge): " GITHUB_URL
[[ -z "$GITHUB_URL" ]] && error "GitHub URL is required"

cd "$SCRIPT_DIR"
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git init
  git checkout -b main
fi
git remote remove origin 2>/dev/null || true
git remote add origin "$GITHUB_URL"
git add -A
git commit -m "Forge Platform v1.0" 2>/dev/null || true
git push -u origin main --force
success "Code pushed to GitHub"

# ── Step 2: Railway ─────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " STEP 2: Deploy Backend to Railway"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if ! command -v railway >/dev/null 2>&1; then
  info "Installing Railway CLI..."
  npm install -g @railway/cli --quiet
fi

echo "  Opening Railway login..."
railway login
echo ""
info "Creating Railway project for backend..."
cd "$SCRIPT_DIR/forge-platform"
railway init --name "forge-platform"

JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
info "Setting environment variables..."
railway variables set \
  NODE_ENV=production \
  JWT_SECRET="$JWT_SECRET" \
  JWT_EXPIRES_IN=15m \
  REFRESH_EXPIRES_IN=7d \
  DB_PATH=/data/forge.db

info "Deploying backend..."
railway up --detach
RAILWAY_URL=$(railway status --json 2>/dev/null | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); try{console.log(JSON.parse(d).deploymentUrl || '')}catch(e){}" || echo "")

if [[ -z "$RAILWAY_URL" ]]; then
  warn "Couldn't auto-detect Railway URL."
  read -p "  Paste your Railway deployment URL: " RAILWAY_URL
fi
success "Backend deployed to: $RAILWAY_URL"

# ── Step 3: Vercel ───────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " STEP 3: Deploy Frontend to Vercel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if ! command -v vercel >/dev/null 2>&1; then
  info "Installing Vercel CLI..."
  npm install -g vercel --quiet
fi

cd "$SCRIPT_DIR/forge-web-studio"
API_URL="${RAILWAY_URL}/api"
info "Deploying frontend (API → $API_URL)..."
vercel --prod \
  --env NEXT_PUBLIC_API_BASE_URL="$API_URL" \
  --yes

VERCEL_URL=$(vercel ls 2>/dev/null | grep forge-web-studio | awk '{print $2}' | head -1 || echo "")
if [[ -z "$VERCEL_URL" ]]; then
  read -p "  Paste your Vercel deployment URL: " VERCEL_URL
fi
success "Frontend deployed to: https://$VERCEL_URL"

# ── Step 4: Wire FRONTEND_URL back into Railway ──────────────
info "Setting FRONTEND_URL in Railway..."
cd "$SCRIPT_DIR/forge-platform"
railway variables set FRONTEND_URL="https://$VERCEL_URL"

# ── Done ─────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
success "Forge is live!"
echo ""
echo "  🌐 App:     https://$VERCEL_URL"
echo "  🔧 API:     $RAILWAY_URL/health"
echo "  🔑 Login:   admin@forge.local / Admin1234!"
echo ""
echo "  Verify: curl $RAILWAY_URL/health"
echo ""
