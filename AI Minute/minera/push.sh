#!/usr/bin/env bash
# Push Minera to your own GitHub repo.
# 1. Create an EMPTY repo on github.com (no README), copy its URL.
# 2. Run:  bash push.sh https://github.com/YOU/minera.git
set -e
REMOTE="$1"
if [ -z "$REMOTE" ]; then echo "Usage: bash push.sh <git-remote-url>"; exit 1; fi
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE"
git branch -M main
git push -u origin main
echo "✓ Pushed to $REMOTE"
