import { Router } from "express";
import { db, getUser, credit, addBurn, notifyUser, award } from "../database/db.js";
import { emit } from "../lib/bus.js";
const r = Router();

// Split: 40% submitter, 35% compute pool, 20% data providers, 5% protocol→burn
const SPLIT = { submitter: 0.40, compute: 0.35, data: 0.20, protocol: 0.05 };

r.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM insights WHERE status IN ('verified','licensed') ORDER BY ts DESC LIMIT 50").all();
  res.json(rows.map((i) => ({
    id: i.id, prompt: i.prompt, status: i.status, confidence: i.confidence,
    licensed: i.status === "licensed",
    priceUsd: Math.round(5000 + (i.confidence || 0.5) * 20000),
  })));
});

function poolMembers(role, limit) {
  // demo proxy: top accounts act as the compute/data pool
  return db.prepare("SELECT address FROM users ORDER BY balance DESC LIMIT ?").all(limit).map((u) => u.address);
}
function payRole(insightId, members, totalUsd, role) {
  if (!members.length) return;
  const per = totalUsd / members.length;
  for (const addr of members) {
    if (getUser(addr)) credit(addr, per, "license", `${role} royalty insight #${insightId}`);
    db.prepare("INSERT INTO royalty_payouts (insight_id,address,role,amount,ts) VALUES (?,?,?,?,?)")
      .run(insightId, addr, role, per, Date.now());
  }
}

r.post("/:id/license", (req, res) => {
  const ins = db.prepare("SELECT * FROM insights WHERE id = ?").get(req.params.id);
  if (!ins) return res.status(404).json({ error: "insight not found" });
  if (ins.status === "licensed") return res.status(400).json({ error: "already licensed" });
  if (ins.status !== "verified") return res.status(400).json({ error: "not verified" });

  const amount = Math.round(5000 + (ins.confidence || 0.5) * 20000);
  const split = {
    submitter: amount * SPLIT.submitter,
    compute: amount * SPLIT.compute,
    data: amount * SPLIT.data,
    protocol: amount * SPLIT.protocol,
  };

  // 40% submitter
  const submitterAddr = req.body?.submitterAddress;
  if (submitterAddr && getUser(submitterAddr)) {
    credit(submitterAddr, split.submitter, "license", `submitter royalty #${ins.id}`);
    notifyUser(submitterAddr, `Your insight #${ins.id} licensed — +$${split.submitter.toLocaleString()}`, "license");
    db.prepare("INSERT INTO royalty_payouts (insight_id,address,role,amount,ts) VALUES (?,?,?,?,?)")
      .run(ins.id, submitterAddr, "submitter", split.submitter, Date.now());
    award(submitterAddr, "first_license");
  }
  // 35% compute pool, 20% data pool — distributed across contributor accounts
  payRole(ins.id, poolMembers("compute", 3), split.compute, "compute");
  payRole(ins.id, poolMembers("data", 2), split.data, "data");
  // 5% protocol → burn + treasury
  addBurn(split.protocol, "license-fee");
  db.prepare("UPDATE protocol SET v = v + ? WHERE k = 'treasury_usd'").run(split.protocol);

  db.prepare("UPDATE insights SET status = 'licensed' WHERE id = ?").run(ins.id);
  db.prepare("INSERT INTO licenses (insight_id,licensee,amount,ts) VALUES (?,?,?,?)")
    .run(ins.id, req.body?.licensee || "buyer", amount, Date.now());

  emit("license", { id: ins.id, amount, prompt: ins.prompt });
  emit("burn", { amount: split.protocol, source: "license-fee" });
  res.json({ ok: true, amount, split, distributed: true });
});

r.get("/:id/royalties", (req, res) => {
  res.json(db.prepare("SELECT * FROM royalty_payouts WHERE insight_id = ? ORDER BY ts DESC").all(req.params.id));
});
r.get("/licenses", (_req, res) => res.json(db.prepare("SELECT * FROM licenses ORDER BY ts DESC LIMIT 50").all()));
export default r;
