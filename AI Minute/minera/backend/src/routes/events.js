import { Router } from "express";
import { addClient } from "../lib/bus.js";
const r = Router();
// GET /api/events  -> Server-Sent Events stream
r.get("/", (req, res) => {
  res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  res.flushHeaders?.();
  res.write(`data: ${JSON.stringify({ type: "hello", ts: Date.now() })}\n\n`);
  addClient(res);
  const ka = setInterval(() => res.write(": keep-alive\n\n"), 25000);
  req.on("close", () => clearInterval(ka));
});
export default r;
