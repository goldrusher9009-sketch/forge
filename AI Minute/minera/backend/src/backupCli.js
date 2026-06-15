// node src/backupCli.js > snapshot.json
import { db } from "./database/db.js";
const TABLES = ["users","insights","bonds","transactions","subnets","stakes","proposals",
  "knowledge_assets","royalty_payouts","licenses","burn_events","achievements","referrals","protocol"];
const snap = { version: 1, ts: Date.now(), tables: {} };
for (const t of TABLES) { try { snap.tables[t] = db.prepare(`SELECT * FROM ${t}`).all(); } catch { snap.tables[t] = []; } }
process.stdout.write(JSON.stringify(snap, null, 2));
process.exit(0);
