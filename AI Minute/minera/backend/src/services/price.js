// MINE price oracle. Base price rises as supply shrinks (burns) + small noise.
// In production: read a real DEX pool (Uniswap V3). Here: deterministic model + history.
import { db } from "../database/db.js";
import { emit } from "../lib/bus.js";

const BASE_SUPPLY = 250_000_000;
const BASE_PRICE = 0.012;
const history = [];
let timer = null;

export function currentPrice() {
  const supply = db.prepare("SELECT v FROM protocol WHERE k = 'total_supply'").get()?.v || BASE_SUPPLY;
  // scarcity: price scales inversely with supply ratio, plus ±1.5% noise
  const scarcity = BASE_SUPPLY / supply;
  const noise = 1 + (Math.sin(Date.now() / 60000) * 0.015);
  return +(BASE_PRICE * scarcity * noise).toFixed(6);
}

export function priceHistory() { return history.slice(-60); }

export function startPriceFeed(intervalMs = 5000) {
  if (timer) return;
  const tick = () => { const p = currentPrice(); history.push({ ts: Date.now(), price: p }); if (history.length > 200) history.shift(); emit("price", { price: p }); };
  tick();
  timer = setInterval(tick, intervalMs);
  console.log("[price] feed live");
}
