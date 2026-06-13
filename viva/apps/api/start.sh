#!/bin/sh
echo "[start.sh] NODE=$(node --version) PORT=$PORT"
echo "[start.sh] DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo YES || echo NO)"

echo "[start.sh] Running prisma db push..."
npx prisma db push --accept-data-loss

echo "[start.sh] Fixing stale market dates..."
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const future = new Date('2027-12-31');
p.market.updateMany({ where: { closesAt: { lt: new Date() } }, data: { closesAt: future } })
  .then(r => { console.log('[seed] updated', r.count, 'stale markets'); return p.\$disconnect(); })
  .catch(e => { console.error('[seed] market fix error:', e.message); return p.\$disconnect(); });
"

echo "[start.sh] Starting server..."
exec node dist/index.js
