// Tiny in-process event bus + SSE registry.
import { EventEmitter } from "events";
export const bus = new EventEmitter();
bus.setMaxListeners(0);

const clients = new Set();
export function addClient(res) {
  clients.add(res);
  res.on("close", () => clients.delete(res));
}
import { db } from "../database/db.js";
const SKIP = new Set(["hello", "price"]); // don't flood activity with price ticks
export function emit(type, data) {
  if (!SKIP.has(type)) {
    try { db.prepare("INSERT INTO activity (type,data,ts) VALUES (?,?,?)").run(type, JSON.stringify(data||{}), Date.now()); } catch {}
  }
  const payload = JSON.stringify({ type, data, ts: Date.now() });
  for (const res of clients) res.write(`data: ${payload}\n\n`);
  bus.emit(type, data);
}
