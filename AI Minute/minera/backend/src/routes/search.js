import { Router } from "express";
import { db } from "../database/db.js";
const r = Router();
r.get("/", (req, res) => {
  const q = `%${(req.query.q || "").toLowerCase()}%`;
  if (!req.query.q) return res.json({ results: [] });
  const insights = db.prepare("SELECT id,prompt FROM insights WHERE lower(prompt) LIKE ? LIMIT 8").all(q)
    .map((x) => ({ type: "insight", id: x.id, label: x.prompt }));
  const bonds = db.prepare("SELECT id,title FROM bonds WHERE lower(title) LIKE ? LIMIT 8").all(q)
    .map((x) => ({ type: "bond", id: x.id, label: x.title }));
  const subnets = db.prepare("SELECT id,name,domain FROM subnets WHERE lower(name) LIKE ? OR lower(domain) LIKE ? LIMIT 8").all(q, q)
    .map((x) => ({ type: "subnet", id: x.id, label: `${x.name} (${x.domain})` }));
  res.json({ results: [...insights, ...bonds, ...subnets] });
});
export default r;
