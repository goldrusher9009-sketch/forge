import { Router } from "express";
import { db } from "../database/db.js";
import { runBurnCycle } from "../services/burnEngine.js";
const r = Router();
r.get("/", (_req, res) => res.json(db.prepare("SELECT * FROM burn_events ORDER BY ts DESC LIMIT 50").all()));
r.post("/run", (_req, res) => res.json(runBurnCycle()));   // trigger a cycle now
export default r;
