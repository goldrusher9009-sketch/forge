// Lightweight metrics collector + Prometheus-style exposition.
const m = { total: 0, errors: 0, latencySum: 0, byStatus: {}, byMethod: {}, startedAt: Date.now() };

export function metricsMiddleware(req, res, next) {
  const t0 = Date.now();
  res.on("finish", () => {
    const dt = Date.now() - t0;
    m.total++; m.latencySum += dt;
    if (res.statusCode >= 400) m.errors++;
    m.byStatus[res.statusCode] = (m.byStatus[res.statusCode] || 0) + 1;
    m.byMethod[req.method] = (m.byMethod[req.method] || 0) + 1;
  });
  next();
}

export function metricsJson() {
  return {
    requests_total: m.total,
    errors_total: m.errors,
    avg_latency_ms: m.total ? +(m.latencySum / m.total).toFixed(2) : 0,
    uptime_sec: Math.round((Date.now() - m.startedAt) / 1000),
    by_status: m.byStatus,
    by_method: m.byMethod,
  };
}

export function metricsProm() {
  const j = metricsJson();
  let out = "";
  out += `# HELP minera_requests_total Total HTTP requests\n# TYPE minera_requests_total counter\nminera_requests_total ${j.requests_total}\n`;
  out += `# HELP minera_errors_total Total error responses\n# TYPE minera_errors_total counter\nminera_errors_total ${j.errors_total}\n`;
  out += `# HELP minera_avg_latency_ms Average latency\n# TYPE minera_avg_latency_ms gauge\nminera_avg_latency_ms ${j.avg_latency_ms}\n`;
  out += `# HELP minera_uptime_seconds Uptime\n# TYPE minera_uptime_seconds gauge\nminera_uptime_seconds ${j.uptime_sec}\n`;
  for (const [code, n] of Object.entries(j.by_status)) out += `minera_responses_by_status{code="${code}"} ${n}\n`;
  return out;
}
