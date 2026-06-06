import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupBatchJobs = (app: Express, db: Database, requireAuth: any) => {
  // Batch jobs table
  db.exec(`CREATE TABLE IF NOT EXISTS batch_jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    job_type TEXT NOT NULL,
    input_data TEXT NOT NULL,
    status TEXT DEFAULT 'queued',
    result TEXT,
    progress_percent INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
  )`);

  // Submit batch job
  app.post('/api/batch/submit', requireAuth, (req: AuthRequest, res) => {
    const { job_type, input_data } = req.body;
    if (!job_type || !input_data) {
      res.status(400).json({ error: 'job_type and input_data required' });
      return;
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO batch_jobs (id, user_id, job_type, input_data, status) VALUES (?, ?, ?, ?, ?)'
    ).run(id, req.user!.sub, job_type, JSON.stringify(input_data), 'queued');

    // Background processing
    setImmediate(() => {
      db.prepare('UPDATE batch_jobs SET status = ? WHERE id = ?').run('processing', id);
      
      setTimeout(() => {
        const result = { processed: true, timestamp: new Date().toISOString() };
        db.prepare(
          'UPDATE batch_jobs SET status = ?, result = ?, progress_percent = ?, completed_at = datetime(?) WHERE id = ?'
        ).run('completed', JSON.stringify(result), 100, 'now', id);
      }, 1000);
    });

    res.status(202).json({ success: true, data: { job_id: id, status: 'queued' } });
  });

  // Get job status
  app.get('/api/batch/status/:jobId', requireAuth, (req: AuthRequest, res) => {
    const job = db.prepare(
      'SELECT * FROM batch_jobs WHERE id = ? AND user_id = ?'
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
        progress: job.progress_percent,
        result: job.result ? JSON.parse(job.result) : null
      }
    });
  });

  // List user's batch jobs
  app.get('/api/batch/jobs', requireAuth, (req: AuthRequest, res) => {
    const jobs = db.prepare(
      'SELECT id, job_type, status, progress_percent, created_at, completed_at FROM batch_jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).all(req.user!.sub);

    res.json({ success: true, data: jobs });
  });
};
