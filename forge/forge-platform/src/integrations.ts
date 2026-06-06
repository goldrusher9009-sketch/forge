import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupIntegrations = (app: Express, db: Database, requireAuth: any) => {
  // Integrations table
  db.exec(`CREATE TABLE IF NOT EXISTS integrations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    service TEXT NOT NULL,
    config TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, service)
  )`);

  // Slack integration
  app.post('/api/integrations/slack/connect', requireAuth, (req: AuthRequest, res) => {
    const { webhook_url } = req.body;
    if (!webhook_url) {
      res.status(400).json({ error: 'webhook_url required' });
      return;
    }

    const intId = uuidv4();
    db.prepare(`
      INSERT OR REPLACE INTO integrations
      (id, user_id, service, config)
      VALUES (?, ?, 'slack', ?)
    `).run(intId, req.user!.sub, JSON.stringify({ webhook_url }));

    res.json({ success: true, data: { integration_id: intId, service: 'slack' } });
  });

  // Send Slack notification
  app.post('/api/integrations/slack/notify', requireAuth, (req: AuthRequest, res) => {
    const { message, channel = '#forge-notifications' } = req.body;

    const integration = db.prepare(
      'SELECT config FROM integrations WHERE user_id = ? AND service = ? AND enabled = 1'
    ).get(req.user!.sub, 'slack') as any;

    if (!integration) {
      res.status(404).json({ error: 'SLACK_NOT_CONNECTED' });
      return;
    }

    // Simulate sending notification
    const config = JSON.parse(integration.config);
    console.log(`[Slack] Sending to ${channel}: ${message}`);

    res.json({
      success: true,
      data: {
        service: 'slack',
        channel,
        message_sent: true
      }
    });
  });

  // Email digest
  app.post('/api/integrations/email/digest', requireAuth, (req: AuthRequest, res) => {
    const { email, frequency = 'weekly', digest_type = 'summary' } = req.body;

    const intId = uuidv4();
    db.prepare(`
      INSERT INTO integrations
      (id, user_id, service, config)
      VALUES (?, ?, 'email', ?)
    `).run(intId, req.user!.sub, JSON.stringify({ email, frequency, digest_type }));

    res.json({
      success: true,
      data: {
        integration_id: intId,
        service: 'email',
        frequency,
        digest_type
      }
    });
  });

  // Zapier webhook
  app.post('/api/integrations/zapier/connect', requireAuth, (req: AuthRequest, res) => {
    const zapierWebhook = `https://hooks.zapier.com/hooks/catch/${uuidv4().split('-')[0]}/${uuidv4().split('-')[1]}/`;

    const intId = uuidv4();
    db.prepare(`
      INSERT OR REPLACE INTO integrations
      (id, user_id, service, config)
      VALUES (?, ?, 'zapier', ?)
    `).run(intId, req.user!.sub, JSON.stringify({ webhook_url: zapierWebhook }));

    res.json({
      success: true,
      data: {
        integration_id: intId,
        service: 'zapier',
        webhook_url: zapierWebhook,
        instruction: 'Use this webhook URL in Zapier to trigger actions'
      }
    });
  });

  // Get integrations
  app.get('/api/integrations', requireAuth, (req: AuthRequest, res) => {
    const integrations = db.prepare(
      'SELECT id, service, enabled, created_at FROM integrations WHERE user_id = ?'
    ).all(req.user!.sub) as any[];

    res.json({ success: true, data: integrations });
  });

  // Disable integration
  app.post('/api/integrations/:id/disable', requireAuth, (req: AuthRequest, res) => {
    db.prepare(
      'UPDATE integrations SET enabled = 0 WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.user!.sub);

    res.json({ success: true });
  });

  // Enable integration
  app.post('/api/integrations/:id/enable', requireAuth, (req: AuthRequest, res) => {
    db.prepare(
      'UPDATE integrations SET enabled = 1 WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.user!.sub);

    res.json({ success: true });
  });

  // Delete integration
  app.delete('/api/integrations/:id', requireAuth, (req: AuthRequest, res) => {
    db.prepare(
      'DELETE FROM integrations WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.user!.sub);

    res.json({ success: true });
  });
};
