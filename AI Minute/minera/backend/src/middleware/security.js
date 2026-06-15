// Lightweight security middleware — no external deps.

// simple in-memory sliding-window rate limiter
const hits = new Map();
export function rateLimit({ windowMs = 60000, max = 200 } = {}) {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
    arr.push(now);
    hits.set(ip, arr);
    if (arr.length > max) return res.status(429).json({ error: "rate limit exceeded" });
    next();
  };
}

// security headers (helmet-lite)
export function secureHeaders(_req, res, next) {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "X-XSS-Protection": "0",
  });
  next();
}

// validation helper used inside routes
export function validate(body, rules) {
  const errors = [];
  for (const [field, rule] of Object.entries(rules)) {
    const v = body?.[field];
    if (rule.required && (v === undefined || v === null || v === "")) errors.push(`${field} required`);
    else if (v !== undefined && rule.type === "number" && isNaN(Number(v))) errors.push(`${field} must be a number`);
    else if (v !== undefined && rule.max && String(v).length > rule.max) errors.push(`${field} too long`);
  }
  return errors;
}

// central error handler
export function errorHandler(err, _req, res, _next) {
  console.error("[error]", err.message);
  res.status(500).json({ error: "internal error" });
}
