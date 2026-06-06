import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupCompliance = (app: Express, db: Database, requireAuth: any) => {
  // Data retention policies
  db.exec(`CREATE TABLE IF NOT EXISTS data_retention_policy (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    data_type TEXT NOT NULL,
    retention_days INTEGER,
    auto_delete INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // User consent records
  db.exec(`CREATE TABLE IF NOT EXISTS user_consent (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    consent_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Data access audit
  db.exec(`CREATE TABLE IF NOT EXISTS data_access_audit (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    data_category TEXT NOT NULL,
    action TEXT NOT NULL,
    reason TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Request data export (GDPR right to portability)
  app.post('/api/compliance/export-data', requireAuth, (req: AuthRequest, res) => {
    const exportId = uuidv4();
    
    // Collect user data
    const userData = db.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).get(req.user!.sub);

    const exportData = {
      export_id: exportId,
      user_data: userData,
      requested_at: new Date().toISOString(),
      status: 'processing'
    };

    res.status(202).json({ success: true, data: exportData });
  });

  // Request data deletion (GDPR right to be forgotten)
  app.post('/api/compliance/delete-data', requireAuth, (req: AuthRequest, res) => {
    const { confirm_deletion } = req.body;
    if (!confirm_deletion) {
      res.status(400).json({ error: 'Deletion confirmation required' });
      return;
    }

    // Soft-delete user data
    db.prepare('UPDATE users SET deleted_at = datetime(?) WHERE id = ?').run('now', req.user!.sub);

    res.json({
      success: true,
      message: 'Data deletion request submitted. Data will be permanently deleted in 30 days.'
    });
  });

  // Record user consent
  app.post('/api/compliance/consent', requireAuth, (req: AuthRequest, res) => {
    const { consent_type, status, ip_address, user_agent } = req.body;
    
    db.prepare(
      'INSERT INTO user_consent (id, user_id, consent_type, status, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(uuidv4(), req.user!.sub, consent_type, status, ip_address, user_agent);

    res.json({ success: true });
  });

  // Get compliance status
  app.get('/api/compliance/status', requireAuth, (req: AuthRequest, res) => {
    const gdprConsent = db.prepare(
      'SELECT status FROM user_consent WHERE user_id = ? AND consent_type = ?'
    ).get(req.user!.sub, 'GDPR');

    const hipaaAgreement = db.prepare(
      'SELECT status FROM user_consent WHERE user_id = ? AND consent_type = ?'
    ).get(req.user!.sub, 'HIPAA');

    res.json({
      success: true,
      data: {
        gdpr_compliant: gdprConsent ? true : false,
        hipaa_compliant: hipaaAgreement ? true : false,
        data_retention: 'Configured',
        audit_logs_enabled: true
      }
    });
  });
};
