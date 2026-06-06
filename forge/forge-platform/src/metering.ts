import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupMetering = (app: Express, db: Database, requireAuth: any) => {
  // Meter events (usage tracking)
  db.exec(`CREATE TABLE IF NOT EXISTS meter_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Usage aggregates (for billing)
  db.exec(`CREATE TABLE IF NOT EXISTS usage_aggregates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    period TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    total_value REAL DEFAULT 0,
    unit_price REAL DEFAULT 0,
    total_cost REAL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Record meter event
  app.post('/api/metering/record', requireAuth, (req: AuthRequest, res) => {
    const { metric_name, value, unit } = req.body;

    if (!metric_name || value === undefined) {
      res.status(400).json({ error: 'metric_name and value required' });
      return;
    }

    db.prepare(
      'INSERT INTO meter_events (id, user_id, metric_name, value, unit) VALUES (?, ?, ?, ?, ?)'
    ).run(uuidv4(), req.user!.sub, metric_name, value, unit || 'unit');

    res.json({ success: true });
  });

  // Get usage for period
  app.get('/api/metering/usage/:period', requireAuth, (req: AuthRequest, res) => {
    const usage = db.prepare(
      'SELECT * FROM usage_aggregates WHERE user_id = ? AND period = ? ORDER BY metric_name'
    ).all(req.user!.sub, req.params.period) as any[];

    const totalCost = usage.reduce((sum, u) => sum + (u.total_cost || 0), 0);

    res.json({
      success: true,
      data: {
        period: req.params.period,
        usage,
        total_cost: totalCost
      }
    });
  });

  // Calculate monthly bill
  app.post('/api/metering/calculate-bill', requireAuth, (req: AuthRequest, res) => {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const meterEvents = db.prepare(
      'SELECT metric_name, SUM(value) as total_value FROM meter_events WHERE user_id = ? AND strftime(?, created_at) = ? GROUP BY metric_name'
    ).all(req.user!.sub, '%Y-%m', period) as any[];

    let totalBill = 0;
    meterEvents.forEach(event => {
      // Pricing: $0.01 per unit for most metrics
      const cost = event.total_value * 0.01;
      totalBill += cost;

      db.prepare(
        'INSERT INTO usage_aggregates (id, user_id, period, metric_name, total_value, unit_price, total_cost) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(uuidv4(), req.user!.sub, period, event.metric_name, event.total_value, 0.01, cost);
    });

    res.json({
      success: true,
      data: {
        period,
        total_bill: totalBill,
        events_count: meterEvents.length
      }
    });
  });
};
