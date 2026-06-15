import { Router } from "express";
import { currentPrice, priceHistory } from "../services/price.js";
const r = Router();
r.get("/", (_req, res) => res.json({ price: currentPrice(), history: priceHistory() }));
export default r;
