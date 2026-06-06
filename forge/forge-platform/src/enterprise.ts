import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupEnterprise = (app: Express, db: Database, requireAuth: any) => {
  // Enterprise SSO config
  db.exec(`CREATE TABLE IF NOT EXISTS enterprise_sso (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    metadata_url TEXT,
    enabled INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Enterprise audit logs
  db.exec(`CREATE TABLE IF NOT EXISTS enterprise_audit_logs (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Configure SSO
  app.post('/api/enterprise/sso/configure', requireAuth, (req: AuthRequest, res) => {
    const { org_id, provider, client_id, client_secret, metadata_url } = req.body;
    
    if (!org_id || !provider || !client_id || !client_secret) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO enterprise_sso (id, org_id, provider, client_id, client_secret, metadata_url) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, org_id, provider, client_id, client_secret, metadata_url || null);

    res.status(201).json({ success: true, data: { id, provider, enabled: 0 } });
  });

  // Enable/disable SSO
  app.patch('/api/enterprise/sso/:id', requireAuth, (req: AuthRequest, res) => {
    const { enabled } = req.body;
    db.prepare('UPDATE enterprise_sso SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, req.params.id);
    res.json({ success: true });
  });

  // Audit log
  app.post('/api/enterprise/audit', requireAuth, (req: AuthRequest, res) => {
    const { org_id, action, resource, ip_address } = req.body;
    
    db.prepare(
      'INSERT INTO enterprise_audit_logs (id, org_id, user_id, action, resource, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(uuidv4(), org_id, req.user!.sub, action, resource || null, ip_address || null);

    res.json({ success: true });
  });

  // Get audit logs
  app.get('/api/enterprise/audit/:org_id', requireAuth, (req: AuthRequest, res) => {
    const logs = db.prepare(
      'SELECT * FROM enterprise_audit_logs WHERE org_id = ? ORDER BY created_at DESC LIMIT 100'
    ).all(req.params.org_id);

    res.json({ success: true, data: logs });
  });
};
