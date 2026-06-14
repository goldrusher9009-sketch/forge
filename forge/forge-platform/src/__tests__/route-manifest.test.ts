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

const FRONTEND_CALLS: Array<{ method: string; path: string }> = [
  { method: 'POST', path: '/api/agent/run' },
  { method: 'GET',  path: '/api/analytics/summary' },
  { method: 'GET',  path: '/api/billing/invoices' },
  { method: 'POST', path: '/api/billing/subscribe' },
  { method: 'GET',  path: '/api/billing/tiers' },
  { method: 'POST', path: '/api/billing/tiers' },
  { method: 'POST', path: '/api/billing/overage-charge' },
  { method: 'GET',  path: '/api/forge-tools/catalog' },
  { method: 'POST', path: '/api/marketplace/install' },
  { method: 'GET',  path: '/api/orgs' },
  { method: 'POST', path: '/api/orgs/1/invite' },
  { method: 'DELETE', path: '/api/orgs/members/abc123' },
  { method: 'GET',  path: '/api/tokens/balance' },
  { method: 'POST', path: '/api/tokens/stake' },
  { method: 'GET',  path: '/api/brief' },
  { method: 'GET',  path: '/api/brain/summary' },
  { method: 'GET',  path: '/api/brain/category/pricing' },
  { method: 'POST', path: '/api/brain/decay' },
  { method: 'GET',  path: '/api/brain/trust-ladder' },
  { method: 'GET',  path: '/api/outcomes' },
  { method: 'POST', path: '/api/auth/login' },
  { method: 'POST', path: '/api/auth/register' },
  { method: 'GET',  path: '/api/keys' },
  { method: 'POST', path: '/api/forge/chat' },
  { method: 'GET',  path: '/api/threads' },
];

interface RegRoute { method: string; regexp: RegExp; raw: string; }
function collectRoutes(): RegRoute[] {
  const a = app as any;
  const stack = a.router?.stack || a._router?.stack || [];
  const out: RegRoute[] = [];
  for (const layer of stack) {
    if (!layer.route) continue;
    const routePath: string = layer.route.path;
    const methods = Object.keys(layer.route.methods).filter(m => layer.route.methods[m]);
    const pattern = '^' + routePath
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/:[^/]+/g, '[^/]+')
      + '$';
    for (const m of methods) {
      out.push({ method: m.toUpperCase(), regexp: new RegExp(pattern), raw: routePath });
    }
  }
  return out;
}

describe('Route manifest', () => {
  const routes = collectRoutes();

  it('registers a non-trivial number of routes', () => {
    expect(routes.length).toBeGreaterThan(50);
  });

  for (const call of FRONTEND_CALLS) {
    it(call.method + ' ' + call.path + ' has a backend handler', () => {
      const match = routes.find(r => r.method === call.method && r.regexp.test(call.path));
      expect(match).toBeTruthy();
    });
  }
});
