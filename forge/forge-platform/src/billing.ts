/**
 * Forge Billing Routes Module (5/5 final piece)
 * Subscription tiers, usage tracking, invoices, Stripe integration
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';

interface AuthRequest extends Request {
  user?: { sub: string };
}

export function setupBillingRoutes(app: any, db: Database.Database, requireAuth: any) {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      stripe_customer_id TEXT UNIQUE,
      tier TEXT NOT NULL DEFAULT 'free',
      status TEXT NOT NULL DEFAULT 'active',
      stripe_subscription_id TEXT,
      current_period_end TEXT,
      tokens_used INTEGER NOT NULL DEFAULT 0,
      total_overage_cost REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS usage_tracking (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      month TEXT NOT NULL,
      api_calls INTEGER NOT NULL DEFAULT 0,
      storage_mb REAL NOT NULL DEFAULT 0,
      concurrent_users INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      stripe_invoice_id TEXT,
      amount_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      overage_details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // GET /api/billing/subscription — view user's subscription
  app.get('/api/billing/subscription', requireAuth, (req: AuthRequest, res: Response) => {
    const sub = db.prepare('SELECT id,tier,status,stripe_subscription_id,current_period_end,tokens_used,total_overage_cost FROM subscriptions WHERE user_id=?').get(req.user!.sub) as any;
    if (!sub) {
      const id = uuidv4();
      db.prepare('INSERT INTO subscriptions (id,user_id,tier,status) VALUES (?,?,?,?)').run(id, req.user!.sub, 'free', 'active');
      res.json({ success: true, data: { id, tier: 'free', status: 'active', tokens_used: 0, total_overage_cost: 0 } });
      return;
    }
    res.json({ success: true, data: sub });
  });

  // POST /api/billing/subscribe — upgrade tier
  app.post('/api/billing/subscribe', requireAuth, (req: AuthRequest, res: Response) => {
    const { tier = 'pro' } = req.body;
    if (!['free','pro','business'].includes(tier)) { res.status(400).json({ error: 'Invalid tier' }); return; }
    const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id=?').get(req.user!.sub) as any;
    const id = sub?.id || uuidv4();
    if (!sub) {
      db.prepare('INSERT INTO subscriptions (id,user_id,tier,status) VALUES (?,?,?,?)').run(id, req.user!.sub, tier, 'active');
    } else {
      db.prepare("UPDATE subscriptions SET tier=?,updated_at=datetime('now') WHERE id=?").run(tier, id);
    }
    res.json({ success: true, data: { id, tier, status: 'active', message: `Upgraded to ${tier} tier` } });
  });

  // POST /api/billing/usage — record usage metrics
  app.post('/api/billing/usage', requireAuth, (req: AuthRequest, res: Response) => {
    const { api_calls = 0, storage_mb = 0, concurrent_users = 0 } = req.body;
    const month = new Date().toISOString().slice(0, 7);
    const existing = db.prepare('SELECT id FROM usage_tracking WHERE user_id=? AND month=?').get(req.user!.sub, month) as any;
    if (existing) {
      db.prepare('UPDATE usage_tracking SET api_calls=api_calls+?,storage_mb=?,concurrent_users=? WHERE id=?').run(api_calls, storage_mb, concurrent_users, existing.id);
    } else {
      db.prepare('INSERT INTO usage_tracking (id,user_id,month,api_calls,storage_mb,concurrent_users) VALUES (?,?,?,?,?,?)').run(uuidv4(), req.user!.sub, month, api_calls, storage_mb, concurrent_users);
    }
    res.json({ success: true, message: 'Usage recorded' });
  });

  // GET /api/billing/invoices — list invoices
  app.get('/api/billing/invoices', requireAuth, (req: AuthRequest, res: Response) => {
    const invoices = db.prepare('SELECT id,amount_cents,status,created_at FROM invoices WHERE user_id=? ORDER BY created_at DESC LIMIT 20').all(req.user!.sub) as any[];
    res.json({ success: true, data: invoices.map(i => ({ ...i, amount: (i.amount_cents / 100).toFixed(2) })) });
  });

  // POST /api/billing/webhook — Stripe webhook (public, verify with secret)
  app.post('/api/billing/webhook', (req: AuthRequest, res: Response) => {
    const sig = req.headers['stripe-signature'];
    const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';
    if (!sig || sig !== secret) { res.status(401).json({ error: 'Invalid signature' }); return; }
    try {
      const evt = JSON.parse(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      if (evt.type === 'payment_intent.succeeded') {
        console.log('✅ Payment succeeded:', evt.data.object.amount_received);
      }
      res.json({ success: true, received: true });
    } catch (e) {
      res.status(400).json({ error: 'Webhook parse error' });
    }
  });
}
