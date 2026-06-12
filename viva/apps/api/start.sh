#!/bin/sh
echo "[start.sh] NODE=$(node --version) PORT=$PORT"
echo "[start.sh] DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo YES || echo NO)"
exec node dist/index.js
