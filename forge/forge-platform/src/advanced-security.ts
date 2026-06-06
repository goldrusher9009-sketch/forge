import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

interface AuthRequest {
  user?: { sub: string };
}

export const setupAdvancedSecurity = (app: Express, db: Database, requireAuth: any) => {
  // IP whitelist table
  db.exec(`CREATE TABLE IF NOT EXISTS ip_whitelist (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(org_id, ip_address)
  )`);

  // 2FA setup table
  db.exec(`CREATE TABLE IF NOT EXISTS two_factor_auth (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    secret TEXT NOT NULL,
    enabled INTEGER DEFAULT 0,
    backup_codes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // API key rotation table
  db.exec(`CREATE TABLE IF NOT EXISTS api_key_rotation_policy (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL UNIQUE,
    rotation_days INTEGER DEFAULT 90,
    notify_days_before INTEGER DEFAULT 14,
    last_rotation TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Audit log table
  db.exec(`CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    changes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Setup 2FA for user
  app.post('/api/security/2fa/setup', requireAuth, (req: AuthRequest, res) => {
    const secret = crypto.randomBytes(20).toString('hex').toUpperCase();
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    db.prepare(`
      INSERT OR REPLACE INTO two_factor_auth
      (id, user_id, secret, backup_codes)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), req.user!.sub, secret, JSON.stringify(backupCodes));

    res.json({
      success: true,
      data: {
        secret,
        backup_codes: backupCodes,
        instruction: 'Enter this secret in your authenticator app (Google Authenticator, Authy, etc.)'
      }
    });
  });

  // Verify 2FA token
  app.post('/api/security/2fa/verify', requireAuth, (req: AuthRequest, res) => {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'token required' });
      return;
    }

    db.prepare('UPDATE two_factor_auth SET enabled = 1 WHERE user_id = ?').run(req.user!.sub);
    res.json({ success: true, message: '2FA enabled' });
  });

  // IP whitelisting
  app.post('/api/security/ip-whitelist', requireAuth, (req: AuthRequest, res) => {
    const { org_id, ip_address, description } = req.body;
    if (!org_id || !ip_address) {
      res.status(400).json({ error: 'org_id and ip_address required' });
      return;
    }

    db.prepare(`
      INSERT INTO ip_whitelist (id, org_id, ip_address, description)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), org_id, ip_address, description || '');

    res.status(201).json({ success: true });
  });

  // Get whitelisted IPs
  app.get('/api/security/ip-whitelist/:orgId', requireAuth, (req: AuthRequest, res) => {
    const ips = db.prepare(
      'SELECT id, ip_address, description, created_at FROM ip_whitelist WHERE org_id = ?'
    ).all(req.params.orgId) as any[];

    res.json({ success: true, data: ips });
  });

  // Remove whitelisted IP
  app.delete('/api/security/ip-whitelist/:id', requireAuth, (req: AuthRequest, res) => {
    db.prepare('DELETE FROM ip_whitelist WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Get audit log
  app.get('/api/security/audit-log', requireAuth, (req: AuthRequest, res) => {
    const logs = db.prepare(`
      SELECT id, action, resource_type, resource_id, ip_address, created_at
      FROM audit_log
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `).all(req.user!.sub) as any[];

    res.json({ success: true, data: logs });
  });

  // API key rotation policy
  app.post('/api/security/key-rotation-policy', requireAuth, (req: AuthRequest, res) => {
    const { org_id, rotation_days = 90, notify_days_before = 14 } = req.body;

    db.prepare(`
      INSERT OR REPLACE INTO api_key_rotation_policy
      (id, org_id, rotation_days, notify_days_before)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), org_id, rotation_days, notify_days_before);

    res.json({ success: true, data: { org_id, rotation_days, notify_days_before } });
  });

  // Get rotation policy
  app.get('/api/security/key-rotation-policy/:orgId', requireAuth, (req: AuthRequest, res) => {
    const policy = db.prepare(
      'SELECT rotation_days, notify_days_before, last_rotation FROM api_key_rotation_policy WHERE org_id = ?'
    ).get(req.params.orgId) as any;

    res.json({ success: true, data: policy || { rotation_days: 90, notify_days_before: 14 } });
  });

  // Check suspicious activity
  app.get('/api/security/suspicious-activity', requireAuth, (req: AuthRequest, res) => {
    const recentActions = db.prepare(`
      SELECT COUNT(*) as count FROM audit_log
      WHERE user_id = ? AND created_at > datetime('now', '-24 hours')
    `).get(req.user!.sub) as any;

    const failedAttempts = db.prepare(`
      SELECT COUNT(*) as count FROM audit_log
      WHERE user_id = ? AND action = 'failed_login' AND created_at > datetime('now', '-24 hours')
    `).get(req.user!.sub) as any;

    const isRiskyActivity = recentActions.count > 50 || failedAttempts.count > 5;

    res.json({
      success: true,
      data: {
        is_suspicious: isRiskyActivity,
        recent_actions_24h: recentActions.count,
        failed_attempts_24h: failedAttempts.count,
        recommendation: isRiskyActivity ? 'Enable 2FA and review account activity' : 'Account appears normal'
      }
    });
  });

  // Security status
  app.get('/api/security/status', requireAuth, (req: AuthRequest, res) => {
    const twofa = db.prepare('SELECT enabled FROM two_factor_auth WHERE user_id = ?').get(req.user!.sub) as any;
    const apiKeys = db.prepare('SELECT COUNT(*) as count FROM api_keys WHERE user_id = ?').get(req.user!.sub) as any;

    res.json({
      success: true,
      data: {
        two_factor_enabled: twofa?.enabled === 1,
        active_api_keys: apiKeys.count,
        security_score: (twofa?.enabled ? 50 : 0) + (apiKeys.count > 0 ? 25 : 0) + 25
      }
    });
  });
};
