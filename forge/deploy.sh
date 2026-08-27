#!/usr/bin/env bash
# Forge release helper: build and create a Vercel Preview only.
# It never pushes Git, deploys a control plane, or promotes Production.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$SCRIPT_DIR/forge-web-studio"
EXPECTED_BRANCH="sasaky/forge-google-drive-launch"
NPM_REGISTRY="https://registry.npmmirror.com"

fail() {
  printf '[forge] ERROR: %s\n' "$1" >&2
  exit 1
}

command -v git >/dev/null 2>&1 || fail 'git is required'
command -v node >/dev/null 2>&1 || fail 'Node.js is required'
command -v npm >/dev/null 2>&1 || fail 'npm is required'

cd "$SCRIPT_DIR"
branch="$(git branch --show-current)"
[[ "$branch" != "main" ]] || fail 'main is connected to a legacy deployment; refusing to continue'
[[ "$branch" == "$EXPECTED_BRANCH" ]] || fail "expected release branch $EXPECTED_BRANCH, found $branch"
[[ -z "$(git status --porcelain)" ]] || fail 'working tree must be clean; commit the reviewed release first'

major="$(node -p "Number(process.versions.node.split('.')[0])")"
[[ "$major" -ge 20 ]] || fail 'Node.js 20 or newer is required'
[[ -f "$WEB_DIR/.vercel/project.json" ]] || fail 'Vercel project is not linked; run vercel link in forge-web-studio first'

printf '[forge] Installing web dependencies from %s\n' "$NPM_REGISTRY"
cd "$WEB_DIR"
npm ci --registry="$NPM_REGISTRY" --no-fund
npm audit --omit=dev --audit-level=high --registry="$NPM_REGISTRY"
npm run build

printf '[forge] Creating protected Vercel Preview; Production is not promoted by this script\n'
npx --yes --registry="$NPM_REGISTRY" vercel deploy --yes
