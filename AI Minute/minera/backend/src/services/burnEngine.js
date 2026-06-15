// Auto buyback-and-burn engine. Periodically converts accrued treasury USD
// into MINE (illustrative DEX price) and burns it.
import { db, addBurn } from "../database/db.js";
import { emit } from "../lib/bus.js";

const PRICE = 0.012; // USD per MINE (illustrative)
let timer = null;

export function runBurnCycle() {
  const t = db.prepare("SELECT v FROM protocol WHERE k = 'treasury_usd'").get()?.v || 0;
  if (t <= 0) return { burned: 0, skipped: true };
  const mine = t / PRICE;                 // swap USD -> MINE
  db.prepare("UPDATE protocol SET v = 0 WHERE k = 'treasury_usd'").run();
  addBurn(mine, "scheduled-buyback");
  emit("burn", { amount: mine, source: "scheduled-buyback" });
  return { burned: mine, usd: t };
}

export function startBurnEngine(intervalMs = 60000) {
  if (timer) return;
  timer = setInterval(runBurnCycle, intervalMs);
  console.log(`[burn] auto buyback-burn every ${intervalMs/1000}s`);
}
