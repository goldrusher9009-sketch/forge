import { Router } from "express";
import { db } from "../database/db.js";
const r = Router();
r.get("/", (_req, res) => res.json(db.prepare("SELECT * FROM chain_events ORDER BY ts DESC LIMIT 50").all()));
export default r;
