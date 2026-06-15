import { Router } from "express";
import { db, getUser, credit, addBurn } from "../database/db.js";
import { runInference } from "../services/swarm.js";
import { emit } from "../lib/bus.js";
const r = Router();

r.get("/", (_req, res) => {
  res.json(db.prepare("SELECT * FROM subnets ORDER BY revenue DESC").all());
});

// create a subnet (operator)
r.post("/", (req, res) => {
  const { name, domain, operator, cut } = req.body || {};
  if (!name || !domain) return res.status(400).json({ error: "name+domain required" });
  const c = Math.min(0.30, Math.max(0.20, Number(cut) || 0.25)); // clamp 20-30%
  const info = db.prepare("INSERT INTO subnets (name,domain,operator,cut,ts) VALUES (?,?,?,?,?)")
    .run(name, domain, operator || null, c, Date.now());
  const s = db.prepare("SELECT * FROM subnets WHERE id = ?").get(info.lastInsertRowid);
  emit("subnet", { id: s.id, name: s.name });
  res.status(201).json(s);
});

// route a paid inference through a subnet — operator gets cut, rest split, protocol fee burns
r.post("/:id/query", async (req, res) => {
  const sub = db.prepare("SELECT * FROM subnets WHERE id = ?").get(req.params.id);
  if (!sub) return res.status(404).json({ error: "subnet not found" });
  const fee = 10; // flat $ per call (demo)
  const out = await runInference((req.body?.prompt || "") + ` [subnet:${sub.domain}]`);
  const operatorCut = fee * sub.cut;
  const protocolFee = fee * 0.10;
  if (sub.operator && getUser(sub.operator)) credit(sub.operator, operatorCut, "subnet", `subnet ${sub.name} call`);
  addBurn(protocolFee, "subnet-fee");
  db.prepare("UPDATE subnets SET calls = calls + 1, revenue = revenue + ? WHERE id = ?").run(fee, sub.id);
  res.json({ response: out.response, fee, operatorCut, protocolFee, subnet: sub.name });
});
export default r;
