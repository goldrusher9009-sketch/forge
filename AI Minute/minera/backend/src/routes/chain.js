import { Router } from "express";
import { chainStatus, onchainBalance } from "../services/chain.js";
const r = Router();
r.get("/status", (_req, res) => res.json(chainStatus()));
r.get("/balance/:address", async (req, res) => {
  const b = await onchainBalance(req.params.address);
  res.json({ address: req.params.address, onchainBalance: b, mode: b == null ? "db-only" : "onchain" });
});
export default r;
