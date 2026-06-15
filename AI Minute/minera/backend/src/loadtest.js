// Simple load test. Usage: node src/loadtest.js [url] [requests] [concurrency]
const BASE = process.argv[2] || "http://localhost:4000";
const N = Number(process.argv[3] || 500);
const C = Number(process.argv[4] || 20);
const paths = ["/api/stats", "/api/price", "/api/bonds", "/api/leaderboard", "/api/activity", "/health"];

let done = 0, errors = 0, totalMs = 0;
const start = Date.now();

async function worker() {
  while (done < N) {
    const p = paths[done % paths.length];
    const t0 = Date.now();
    try { const r = await fetch(BASE + p); if (!r.ok) errors++; await r.text(); }
    catch { errors++; }
    totalMs += Date.now() - t0; done++;
  }
}
(async () => {
  await Promise.all(Array.from({ length: C }, worker));
  const secs = (Date.now() - start) / 1000;
  console.log(`\nLoad test: ${N} reqs, ${C} concurrent`);
  console.log(`Total: ${secs.toFixed(2)}s · ${(N/secs).toFixed(0)} req/s · avg ${(totalMs/N).toFixed(1)}ms · errors ${errors}`);
  process.exit(0);
})();
