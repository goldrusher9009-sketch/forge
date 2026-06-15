import { Router } from "express";
import { db, addBurn, audit } from "../database/db.js";
import { emit } from "../lib/bus.js";
const r = Router();

r.get("/", (_req, res) => {
  const actions = db.prepare("SELECT * FROM treasury_actions ORDER BY id DESC").all();
  res.json(actions.map((a) => ({
    ...a,
    approvals: db.prepare("SELECT signer FROM treasury_approvals WHERE action_id = ?").all(a.id).map((x) => x.signer),
  })));
});

r.post("/", (req, res) => {
  const { kind, amount, detail, proposer, threshold } = req.body || {};
  if (!kind) return res.status(400).json({ error: "kind required" });
  const info = db.prepare("INSERT INTO treasury_actions (kind,amount,detail,proposer,threshold,ts) VALUES (?,?,?,?,?,?)")
    .run(kind, Number(amount) || 0, detail || "", proposer || null, Number(threshold) || 2, Date.now());
  res.status(201).json({ id: info.lastInsertRowid });
});

r.post("/:id/approve", (req, res) => {
  const a = db.prepare("SELECT * FROM treasury_actions WHERE id = ?").get(req.params.id);
  if (!a || a.status !== "pending") return res.status(400).json({ error: "not pending" });
  const signer = req.body?.signer;
  if (!signer) return res.status(400).json({ error: "signer required" });
  try { db.prepare("INSERT INTO treasury_approvals (action_id,signer,ts) VALUES (?,?,?)").run(a.id, signer, Date.now()); }
  catch { return res.status(400).json({ error: "already approved" }); }
  const count = db.prepare("SELECT COUNT(*) n FROM treasury_approvals WHERE action_id = ?").get(a.id).n;
  let executed = false;
  if (count >= a.threshold) {
    if (a.kind === "burn" && a.amount > 0) { addBurn(a.amount, "treasury-multisig"); emit("burn", { amount: a.amount, source: "treasury-multisig" }); }
    db.prepare("UPDATE treasury_actions SET status = 'executed' WHERE id = ?").run(a.id);
    executed = true;
    audit(signer, "multisig-execute", `action #${a.id} ${a.kind}`);
  }
  res.json({ ok: true, approvals: count, threshold: a.threshold, executed });
});
export default r;
