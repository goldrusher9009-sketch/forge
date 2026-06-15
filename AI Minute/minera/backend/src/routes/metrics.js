import { Router } from "express";
import { metricsJson, metricsProm } from "../middleware/metrics.js";
const r = Router();
r.get("/", (req, res) => {
  if ((req.headers.accept || "").includes("json") || req.query.format === "json") return res.json(metricsJson());
  res.set("Content-Type", "text/plain").send(metricsProm());
});
export default r;
