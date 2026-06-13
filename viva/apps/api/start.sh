#!/bin/sh
echo "[start.sh] NODE=$(node --version) PORT=$PORT"
echo "[start.sh] DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo YES || echo NO)"
echo "[start.sh] Running prisma migrate deploy..."
npx prisma migrate deploy
echo "[start.sh] Starting server..."
exec node dist/index.js
