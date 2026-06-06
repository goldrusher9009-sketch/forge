import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupWebhookSandbox = (app: Express, db: Database, requireAuth: any) => {
  // Webhook test deliveries
  db.exec(`CREATE TABLE IF NOT EXISTS webhook_test_deliveries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    webhook_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    status_code INTEGER,
    response TEXT,
    latency_ms INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Test webhook delivery
  app.post('/api/webhooks/:id/test', requireAuth, (req: AuthRequest, res) => {
    const webhook = db.prepare(
      'SELECT * FROM webhook_triggers WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user!.sub) as any;

    if (!webhook) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const testId = uuidv4();
    const testPayload = {
      event: webhook.event_type,
      timestamp: new Date().toISOString(),
      test: true,
      data: { sample: 'test_data' }
    };

    // Simulate delivery
    const startTime = Date.now();
    const statusCode = 200;
    const responseText = JSON.stringify({ success: true, message: 'Webhook received' });
    const latency = Date.now() - startTime;

    db.prepare(`
      INSERT INTO webhook_test_deliveries
      (id, user_id, webhook_id, payload, status_code, response, latency_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(testId, req.user!.sub, req.params.id, JSON.stringify(testPayload), statusCode, responseText, latency);

    res.status(201).json({
      success: true,
      data: {
        test_id: testId,
        status: statusCode,
        latency_ms: latency,
        payload: testPayload,
        response: responseText
      }
    });
  });

  // Get webhook test history
  app.get('/api/webhooks/:id/test-history', requireAuth, (req: AuthRequest, res) => {
    const tests = db.prepare(`
      SELECT id, status_code, latency_ms, created_at
      FROM webhook_test_deliveries
      WHERE webhook_id = ? AND user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(req.params.id, req.user!.sub) as any[];

    res.json({
      success: true,
      data: {
        webhook_id: req.params.id,
        tests,
        total: tests.length
      }
    });
  });

  // Webhook request inspector
  app.get('/api/webhooks/:id/last-delivery', requireAuth, (req: AuthRequest, res) => {
    const delivery = db.prepare(`
      SELECT payload, response, status_code, latency_ms, created_at
      FROM webhook_test_deliveries
      WHERE webhook_id = ? AND user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(req.params.id, req.user!.sub) as any;

    if (!delivery) {
      res.status(404).json({ error: 'NO_DELIVERIES' });
      return;
    }

    res.json({
      success: true,
      data: {
        webhook_id: req.params.id,
        timestamp: delivery.created_at,
        request: JSON.parse(delivery.payload),
        response: delivery.response,
        status_code: delivery.status_code,
        latency_ms: delivery.latency_ms
      }
    });
  });
};
