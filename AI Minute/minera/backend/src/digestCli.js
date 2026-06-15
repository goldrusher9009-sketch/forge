// Standalone daily digest printer. Run: node src/digestCli.js
// Prints a network 24h summary; pass an address to get a personal digest.
import { db } from "./database/db.js";
const DAY = 86400000, since = Date.now() - DAY;
const addr = process.argv[2];

if (addr) {
  const txs = db.prepare("SELECT type,amount FROM transactions WHERE address=? AND ts>=?").all(addr, since);
  const earned = txs.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
  const u = db.prepare("SELECT balance,display_name FROM users WHERE address=?").get(addr);
  console.log(`\n=== Minera daily digest — ${u?.display_name||addr} ===`);
  console.log(`Earned (24h): ${earned.toFixed(2)} MINE`);
  console.log(`Balance now:  ${(u?.balance||0).toFixed(2)} MINE`);
  console.log(`Transactions: ${txs.length}`);
} else {
  const n=(q)=>db.prepare(q).get(since).n;
  console.log("\n=== Minera network digest (24h) ===");
  console.log("New insights:", n("SELECT COUNT(*) n FROM insights WHERE ts>=?"));
  console.log("Licenses:    ", n("SELECT COUNT(*) n FROM licenses WHERE ts>=?"));
  console.log("Burned:      ", db.prepare("SELECT COALESCE(SUM(amount),0) s FROM burn_events WHERE ts>=?").get(since).s.toFixed(0), "MINE");
  console.log("New users:   ", n("SELECT COUNT(*) n FROM users WHERE created>=?"));
}
process.exit(0);
