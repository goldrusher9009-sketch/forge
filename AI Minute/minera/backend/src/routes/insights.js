import { Router } from "express";
import { db, getUser, credit, rewardReferrer, award } from "../database/db.js";
import { checkNovelty, publishAsset, getAsset, dkgMode } from "../services/dkg.js";
import { emit } from "../lib/bus.js";
import { mintReward } from "../services/chain.js";
import { notifyUser } from "../database/db.js";
const r = Router();

r.get("/", (_req, res) => {
  res.json(db.prepare("SELECT * FROM insights ORDER BY ts DESC LIMIT 50").all());
});

r.post("/", async (req, res) => {
  const { prompt, response, address } = req.body || {};
  if (!prompt || !response) return res.status(400).json({ error: "prompt+response required" });
  const hash = String(Math.abs([...response].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)));
  const { novel, confidence } = await checkNovelty(hash);
  const status = novel ? "verified" : "rejected";
  const reward = novel ? 100 : 0;
  const ts = Date.now();
  const info = db.prepare(
    "INSERT INTO insights (prompt,response,status,reward,confidence,ts) VALUES (?,?,?,?,?,?)"
  ).run(prompt, response, status, reward, confidence, ts);

  let ual = null;
  if (status === "verified") {
    const pub = await publishAsset(info.lastInsertRowid, { prompt, response }, address ? [address] : []);
    ual = pub.ual;
  }
  let balance = null;
  if (reward && address && getUser(address)) {
    balance = credit(address, reward, "insight", `verified insight #${info.lastInsertRowid}`);
    mintReward(address, reward).catch(() => {});
    rewardReferrer(address);
    award(address, "first_insight");
    const ub = getUser(address); if (ub && ub.balance >= 1000) award(address, "rich_1k");
    notifyUser(address, `Insight #${info.lastInsertRowid} verified — +${reward} MINE`);
  }
  emit("insight", { id: info.lastInsertRowid, prompt, status, reward });
  res.status(201).json({ id: info.lastInsertRowid, prompt, status, reward, confidence, ts, balance, ual });
});
r.get("/:id/asset", (req, res) => {
  const a = getAsset(Number(req.params.id));
  if (!a) return res.status(404).json({ error: "no asset" });
  res.json({ ...a, contributors: JSON.parse(a.contributors || "[]"), dkg: dkgMode() });
});
export default r;
