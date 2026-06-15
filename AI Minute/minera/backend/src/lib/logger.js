// Tiny leveled logger. Quiet during tests (NODE_ENV=test or LOG=silent).
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };
const level = LEVELS[process.env.LOG || (process.env.NODE_ENV === "test" ? "silent" : "info")] ?? 1;
function log(lvl, ...args) { if (LEVELS[lvl] >= level && level < 4) console[lvl === "debug" ? "log" : lvl](`[${lvl}]`, ...args); }
export const logger = {
  debug: (...a) => log("debug", ...a),
  info: (...a) => log("info", ...a),
  warn: (...a) => log("warn", ...a),
  error: (...a) => log("error", ...a),
};
export function requestLogger(req, res, next) {
  const t0 = Date.now();
  res.on("finish", () => {
    if (level >= 4) return;
    const ms = Date.now() - t0;
    const color = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "debug";
    log(color, `${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
}
