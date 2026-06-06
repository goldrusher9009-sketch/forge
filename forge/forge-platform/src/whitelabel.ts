import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupWhiteLabel = (app: Express, db: Database, requireAuth: any) => {
  // White-label config
  db.exec(`CREATE TABLE IF NOT EXISTS whitelabel_config (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#ff1f35',
    secondary_color TEXT DEFAULT '#0a0a0b',
    app_name TEXT,
    app_description TEXT,
    footer_text TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Set white-label config
  app.post('/api/whitelabel/configure', requireAuth, (req: AuthRequest, res) => {
    const { org_id, domain, logo_url, primary_color, secondary_color, app_name } = req.body;

    if (!org_id || !domain) {
      res.status(400).json({ error: 'org_id and domain required' });
      return;
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO whitelabel_config (id, org_id, domain, logo_url, primary_color, secondary_color, app_name) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, org_id, domain, logo_url || null, primary_color || '#ff1f35', secondary_color || '#0a0a0b', app_name || 'Forge');

    res.status(201).json({ success: true, data: { id, domain, app_name } });
  });

  // Get white-label config
  app.get('/api/whitelabel/config/:org_id', (req: AuthRequest, res) => {
    const config = db.prepare(
      'SELECT * FROM whitelabel_config WHERE org_id = ?'
    ).get(req.params.org_id) as any;

    if (!config) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    res.json({ success: true, data: config });
  });

  // Update white-label config
  app.patch('/api/whitelabel/config/:id', requireAuth, (req: AuthRequest, res) => {
    const { primary_color, secondary_color, logo_url, app_name } = req.body;

    db.prepare(
      'UPDATE whitelabel_config SET primary_color = ?, secondary_color = ?, logo_url = ?, app_name = ? WHERE id = ?'
    ).run(primary_color, secondary_color, logo_url, app_name, req.params.id);

    res.json({ success: true });
  });
};
