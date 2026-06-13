#!/bin/sh
echo "[start.sh] NODE=$(node --version) PORT=$PORT"
echo "[start.sh] DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo YES || echo NO)"
echo "[start.sh] Running prisma db push..."
npx prisma db push --accept-data-loss
echo "[start.sh] Starting server..."
exec node dist/index.js
