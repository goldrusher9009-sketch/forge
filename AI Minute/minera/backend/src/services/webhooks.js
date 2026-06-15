// Outbound webhook delivery. Subscribes to the event bus; fire-and-forget POST.
import { db } from "../database/db.js";
import { bus } from "../lib/bus.js";

export function startWebhooks() {
  const types = ["insight", "license", "bond", "bond-award", "predict-settle", "burn", "subnet", "proposal"];
  for (const type of types) {
    bus.on(type, (data) => deliver(type, data));
  }
  console.log("[webhooks] delivery active");
}

function deliver(type, data) {
  let hooks;
  try { hooks = db.prepare("SELECT * FROM webhooks WHERE active = 1").all(); } catch { return; }
  for (const h of hooks) {
    const list = h.events.split(",").map((s) => s.trim());
    if (!(h.events === "*" || list.includes(type))) continue;
    fetch(h.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Minera-Event": type },
      body: JSON.stringify({ type, data, ts: Date.now() }),
      signal: AbortSignal.timeout(4000),
    }).catch(() => {}); // best-effort
  }
}
