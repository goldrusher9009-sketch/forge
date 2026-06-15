import { Router } from "express";
import { db, getUser, credit, notifyUser } from "../database/db.js";
import { swarmMode } from "../services/swarm.js";
import { dkgMode } from "../services/dkg.js";
import { chainStatus } from "../services/chain.js";
import { emit } from "../lib/bus.js";
import { publishAsset } from "../services/dkg.js";
const r = Router();

// list pending insights for verifier review
r.get("/pending", (_req, res) => {
  res.json(db.prepare("SELECT * FROM insights WHERE status = 'pending' ORDER BY ts DESC").all());
});

// verifier approves/rejects a pending insight
r.post("/insights/:id/verify", async (req, res) => {
  const { approved, submitterAddress } = req.body || {};
  const ins = db.prepare("SELECT * FROM insights WHERE id = ?").get(req.params.id);
  if (!ins) return res.status(404).json({ error: "not found" });
  if (ins.status !== "pending") return res.status(400).json({ error: "already resolved" });
  const status = approved ? "verified" : "rejected";
  const reward = approved ? 100 : 0;
  db.prepare("UPDATE insights SET status = ?, reward = ? WHERE id = ?").run(status, reward, ins.id);
  let balance = null;
  if (approved && submitterAddress && getUser(submitterAddress))
    balance = credit(submitterAddress, reward, "insight", `verifier approved #${ins.id}`);
    if (submitterAddress) notifyUser(submitterAddress, `Verifier approved insight #${ins.id} — +${reward} MINE`);
  let ual = null;
  if (approved) { const pub = await publishAsset(ins.id, { prompt: ins.prompt }, submitterAddress ? [submitterAddress] : []); ual = pub.ual; }
  emit("insight", { id: ins.id, prompt: ins.prompt, status, reward });
  res.json({ ok: true, id: ins.id, status, balance, ual });
});

// open bonds + open prediction markets for admin actions
r.get("/open-bonds", (_req, res) =>
  res.json(db.prepare("SELECT * FROM bonds WHERE status = 'open' ORDER BY id DESC").all()));
r.get("/open-markets", (_req, res) =>
  res.json(db.prepare("SELECT insight_id, SUM(stake) pool, COUNT(*) bets FROM predictions WHERE settled=0 GROUP BY insight_id").all()));

// demo helper: create a pending insight so the queue isn't empty
r.post("/seed-pending", (req, res) => {
  const prompt = (req.body && req.body.prompt) || "Unverified candidate insight";
  const info = db.prepare("INSERT INTO insights (prompt,status,reward,ts) VALUES (?,?,?,?)")
    .run(prompt, "pending", 0, Date.now());
  res.status(201).json({ id: info.lastInsertRowid, status: "pending" });
});

// protocol-wide KPI overview
r.get("/overview", (_req, res) => {
  const num = (q) => db.prepare(q).get().n;
  const sum = (q) => db.prepare(q).get().s || 0;
  res.json({
    users: num("SELECT COUNT(*) n FROM users"),
    totalBalance: sum("SELECT SUM(balance) s FROM users"),
    totalStaked: sum("SELECT SUM(amount) s FROM stakes WHERE active = 1"),
    insights: num("SELECT COUNT(*) n FROM insights"),
    licensed: num("SELECT COUNT(*) n FROM insights WHERE status='licensed'"),
    subnets: num("SELECT COUNT(*) n FROM subnets"),
    bonds: num("SELECT COUNT(*) n FROM bonds"),
    proposals: num("SELECT COUNT(*) n FROM proposals"),
    totalBurned: db.prepare("SELECT v FROM protocol WHERE k='total_burned'").get()?.v || 0,
    treasuryUsd: db.prepare("SELECT v FROM protocol WHERE k='treasury_usd'").get()?.v || 0,
    licenseRevenue: sum("SELECT SUM(amount) s FROM licenses"),
    burnBySource: db.prepare("SELECT source, SUM(amount) s, COUNT(*) n FROM burn_events GROUP BY source").all(),
  });
});
r.get("/health", (_req, res) => {
  const mem = process.memoryUsage();
  res.json({
    uptimeSec: Math.round(process.uptime()),
    node: process.version,
    rssMb: +(mem.rss / 1048576).toFixed(1),
    heapMb: +(mem.heapUsed / 1048576).toFixed(1),
    swarm: swarmMode(),
    dkg: dkgMode(),
    chain: chainStatus(),
    counts: {
      users: db.prepare("SELECT COUNT(*) n FROM users").get().n,
      insights: db.prepare("SELECT COUNT(*) n FROM insights").get().n,
      activity: db.prepare("SELECT COUNT(*) n FROM activity").get().n,
      burns: db.prepare("SELECT COUNT(*) n FROM burn_events").get().n,
    },
  });
});
export default r;
