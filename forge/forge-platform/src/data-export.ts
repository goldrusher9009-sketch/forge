import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupDataExport = (app: Express, db: Database, requireAuth: any) => {
  // Export jobs table
  db.exec(`CREATE TABLE IF NOT EXISTS export_jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    export_type TEXT NOT NULL,
    format TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    file_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
  )`);

  // Export scheduled jobs
  db.exec(`CREATE TABLE IF NOT EXISTS export_schedules (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    export_type TEXT NOT NULL,
    format TEXT NOT NULL,
    frequency TEXT NOT NULL,
    email TEXT,
    next_run TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Request data export
  app.post('/api/export/request', requireAuth, (req: AuthRequest, res) => {
    const { export_type = 'threads', format = 'json' } = req.body;

    if (!['threads', 'messages', 'usage', 'analytics'].includes(export_type)) {
      res.status(400).json({ error: 'Invalid export_type' });
      return;
    }

    const jobId = uuidv4();
    db.prepare(`
      INSERT INTO export_jobs (id, user_id, export_type, format, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).run(jobId, req.user!.sub, export_type, format);

    // Simulate immediate processing
    setTimeout(() => {
      const data = generateExportData(db, req.user!.sub, export_type);
      const fileUrl = `/api/export/${jobId}/download`;

      db.prepare(`
        UPDATE export_jobs
        SET status = 'completed', file_url = ?, completed_at = datetime('now')
        WHERE id = ?
      `).run(fileUrl, jobId);
    }, 1000);

    res.status(201).json({
      success: true,
      data: {
        job_id: jobId,
        status: 'pending',
        export_type,
        format
      }
    });
  });

  // Get export status
  app.get('/api/export/:jobId/status', requireAuth, (req: AuthRequest, res) => {
    const job = db.prepare(
      'SELECT * FROM export_jobs WHERE id = ? AND user_id = ?'
    ).get(req.params.jobId, req.user!.sub) as any;

    if (!job) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    res.json({
      success: true,
      data: {
        job_id: job.id,
        status: job.status,
        progress: job.status === 'completed' ? 100 : 50,
        download_url: job.file_url,
        created_at: job.created_at,
        completed_at: job.completed_at
      }
    });
  });

  // Download export
  app.get('/api/export/:jobId/download', requireAuth, (req: AuthRequest, res) => {
    const job = db.prepare(
      'SELECT * FROM export_jobs WHERE id = ? AND user_id = ? AND status = ?'
    ).get(req.params.jobId, req.user!.sub, 'completed') as any;

    if (!job) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const data = generateExportData(db, req.user!.sub, job.export_type);
    const filename = `${job.export_type}_${new Date().toISOString().split('T')[0]}.${job.format}`;

    res.setHeader('Content-Type', job.format === 'csv' ? 'text/csv' : 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(job.format === 'csv' ? data : JSON.stringify(data, null, 2));
  });

  // Schedule recurring export
  app.post('/api/export/schedule', requireAuth, (req: AuthRequest, res) => {
    const { export_type, format = 'json', frequency = 'weekly', email } = req.body;

    const scheduleId = uuidv4();
    db.prepare(`
      INSERT INTO export_schedules
      (id, user_id, export_type, format, frequency, email, next_run)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+' || ? || ' days'))
    `).run(scheduleId, req.user!.sub, export_type, format, frequency, email || '', frequency === 'daily' ? 1 : 7);

    res.status(201).json({
      success: true,
      data: {
        schedule_id: scheduleId,
        frequency,
        email,
        export_type
      }
    });
  });

  // Get schedules
  app.get('/api/export/schedules', requireAuth, (req: AuthRequest, res) => {
    const schedules = db.prepare(
      'SELECT id, export_type, format, frequency, email, next_run FROM export_schedules WHERE user_id = ?'
    ).all(req.user!.sub) as any[];

    res.json({ success: true, data: schedules });
  });
};

function generateExportData(db: Database, userId: string, exportType: string): any {
  switch (exportType) {
    case 'threads':
      return db.prepare('SELECT * FROM threads WHERE user_id = ?').all(userId);
    case 'messages':
      return db.prepare(`
        SELECT m.* FROM messages m
        JOIN threads t ON m.thread_id = t.id
        WHERE t.user_id = ?
      `).all(userId);
    case 'usage':
      return db.prepare('SELECT * FROM usage_logs WHERE user_id = ?').all(userId);
    case 'analytics':
      return db.prepare('SELECT * FROM analytics_events WHERE user_id = ?').all(userId);
    default:
      return [];
  }
}
