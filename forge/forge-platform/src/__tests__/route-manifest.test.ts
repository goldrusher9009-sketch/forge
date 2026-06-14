/**
 * ROUTE MANIFEST TEST — the demo-saver.
 *
 * Phase 0 guard: every API path the frontend calls MUST be registered on the
 * backend Express app. If someone renames or deletes a route, this test fails
 * in CI/local BEFORE it 404s in front of a judge.
 *
 * Two layers:
 *  1. FRONTEND_CALLS — explicit manifest of paths the UI fetches. Hard assertion.
 *  2. Dynamic introspection of app._router so the manifest stays honest.
 *
 * To add a new frontend call: add it to FRONTEND_CALLS below.
 */
process.env.DB_PATH = '/tmp/forge-route-manifest-test.db';
process.env.JWT_SECRET = 'test-secret-key-for-tests-only';
process.env.NODE_ENV = 'test';
process.env.PORT = '0';

import fs from 'fs';
import { app } from '../index';

afterAll(() => {
  const db = process.env.DB_PATH!;
  if (fs.existsSync(db)) fs.unlinkSync(db);
});

// ── Every path the frontend calls. method + path (path as written in code). ──
const FRONTEND_CALLS: Array<{ method: string; path: string }> = [
  { method: 'POST', path: '/api/agent/run' },
  { method: 'GET',  path: '/api/analytics/summary' },
  { method: 'GET',  path: '/api/billing/invoices' },
  { method: 'POST', path: '/api/billing/subscribe' },
  { method: 'GET',  path: '/api/billing/tiers' },
  { method: 'POST', path: '/api/billing/tiers' },
  { method: 'GET',  path: '/api/forge-tools/catalog' },
  { method: 'POST', path: '/api/marketplace/install' },
  { method: 'GET',  path: '/api/orgs' },
  { method: 'POST', path: '/api/orgs/1/invite' },
  { method: 'DELETE', path: '/api/orgs/members/abc123' },
  { method: 'GET',  path: '/api/tokens/balance' },
  { method: 'POST', path: '/api/tokens/stake' },
  // Phase 2 — Morning Brief daily hook:
  { method: 'GET',  path: '/api/brief' },
  // Phase 3 — Forge Brain v2 (compounding-memory moat):
  { method: 'GET',  path: '/api/brain/summary' },
  { method: 'GET',  path: '/api/brain/category/pricing' },
  { method: 'POST', path: '/api/brain/decay' },
  // Core surfaces the demo also exercises:
  { method: 'POST', path: '/api/auth/login' },
  { method: 'POST', path: '/api/auth/register' },
  { method: 'GET',  path: '/api/keys' },
  { method: 'POST', path: '/api/forge/chat' },
  { method: 'GET',  path: '/api/threads' },
];

// ── Pull every registered route out of the Express app. ──────────────────────
interface RegRoute { method: string; regexp: RegExp; raw: string; }
function collectRoutes(): RegRoute[] {
  const a = app as any;
  // Express 4 exposes app._router; Express 5 exposes app.router.
  const stack = a.router?.stack || a._router?.stack || [];
  const out: RegRoute[] = [];
  for (const layer of stack) {
    if (!layer.route) continue;
    const routePath: string = layer.route.path;
    const methods = Object.keys(layer.route.methods).filter(m => layer.route.methods[m]);
    // Turn Express path (with :params) into a matcher regex.
    const pattern = '^' + routePath
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')   // escape regex metachars
      .replace(/:[^/\\]+/g, '[^/]+')             // :param → one segment
      + '$';
    for (const m of methods) {
      out.push({ method: m.toUpperCase(), regexp: new RegExp(pattern), raw: routePath });
    }
  }
  return out;
}

describe('Route manifest — frontend calls are all backed by a route', () => {
  const routes = collectRoutes();

  it('registers a non-trivial number of routes', () => {
    expect(routes.length).toBeGreaterThan(50);
  });

  for (const call of FRONTEND_CALLS) {
    it(`${call.method} ${call.path} → has a backend handler`, () => {
      const match = routes.find(r => r.method === call.method && r.regexp.test(call.path));
      if (!match) {
        const sameMethod = routes.filter(r => r.method === call.method).map(r => r.raw).sort();
        throw new Error(
          `No ${call.method} route matches "${call.path}".\n` +
          `Frontend calls this but backend has no handler → it would 404 in the demo.\n` +
          `Available ${call.method} routes:\n  ${sameMethod.join('\n  ')}`
        );
      }
      expect(match).toBeTruthy();
    });
  }
});
