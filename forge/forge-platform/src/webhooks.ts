import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupWebhookRetry = (db: Database) => {
  // Create webhook logs table
  db.exec(`CREATE TABLE IF NOT EXISTS webhook_logs (
    id TEXT PRIMARY KEY,
    webhook_id TEXT NOT NULL,
    event TEXT NOT NULL,
    payload TEXT NOT NULL,
    status INTEGER,
    response TEXT,
    retry_count INTEGER DEFAULT 0,
    next_retry TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Retry failed webhooks every 5 minutes (exponential backoff)
  setInterval(() => {
    try {
      const failedLogs = db.prepare(
        "SELECT * FROM webhook_logs WHERE status != 200 AND retry_count < 5 AND (next_retry IS NULL OR next_retry <= datetime('now'))"
      ).all() as any[];

      failedLogs.forEach(log => {
        const backoffMs = Math.pow(2, log.retry_count) * 60000; // 1min, 2min, 4min, 8min, 16min
        const nextRetry = new Date(Date.now() + backoffMs).toISOString();

        const hook = db.prepare('SELECT * FROM webhook_triggers WHERE id = ?').get(log.webhook_id) as any;
        if (!hook) return;

        fetch(hook.webhook_url || '', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Forge-Secret': hook.secret },
          body: log.payload,
          timeout: 10000
        })
          .then(res => {
            const status = res.status;
            db.prepare(
              'UPDATE webhook_logs SET status = ?, retry_count = retry_count + 1, next_retry = ? WHERE id = ?'
            ).run(status, status === 200 ? null : nextRetry, log.id);
          })
          .catch(e => {
            db.prepare(
              'UPDATE webhook_logs SET status = 0, retry_count = retry_count + 1, next_retry = ?, response = ? WHERE id = ?'
            ).run(nextRetry, e.message, log.id);
          });
      });
    } catch (e) {
      console.error('Webhook retry worker error:', e);
    }
  }, 300000); // 5 minutes
};

// Webhook endpoints for logging
export const setupWebhookLogging = (app: Express, db: Database, requireAuth: any) => {
  app.get('/api/webhooks/logs/:webhookId', requireAuth, (req: AuthRequest, res) => {
    const logs = db.prepare(
      'SELECT * FROM webhook_logs WHERE webhook_id = ? ORDER BY created_at DESC LIMIT 50'
    ).all(req.params.webhookId);
    res.json({ success: true, data: logs });
  });

  app.delete('/api/webhooks/logs/:logId', requireAuth, (req: AuthRequest, res) => {
    db.prepare('DELETE FROM webhook_logs WHERE id = ?').run(req.params.logId);
    res.json({ success: true });
  });
};
