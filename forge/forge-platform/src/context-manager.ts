import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupContextManager = (app: Express, db: Database, requireAuth: any) => {
  // Context windows table
  db.exec(`CREATE TABLE IF NOT EXISTS context_windows (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    thread_id TEXT NOT NULL,
    max_tokens INTEGER DEFAULT 8000,
    current_tokens INTEGER DEFAULT 0,
    auto_summarize INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Get context status
  app.get('/api/context/:threadId', requireAuth, (req: AuthRequest, res) => {
    const context = db.prepare(
      'SELECT * FROM context_windows WHERE thread_id = ? AND user_id = ?'
    ).get(req.params.threadId, req.user!.sub) as any;

    if (!context) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const usage = Math.round((context.current_tokens / context.max_tokens) * 100);
    res.json({
      success: true,
      data: {
        thread_id: context.thread_id,
        max_tokens: context.max_tokens,
        current_tokens: context.current_tokens,
        usage_percentage: usage,
        auto_summarize: context.auto_summarize === 1
      }
    });
  });

  // Set context limit
  app.post('/api/context/:threadId/set-limit', requireAuth, (req: AuthRequest, res) => {
    const { max_tokens = 8000 } = req.body;

    db.prepare(
      'INSERT OR REPLACE INTO context_windows (id, user_id, thread_id, max_tokens, current_tokens) VALUES (?, ?, ?, ?, COALESCE((SELECT current_tokens FROM context_windows WHERE thread_id = ?), 0))'
    ).run(uuidv4(), req.user!.sub, req.params.threadId, max_tokens, req.params.threadId);

    res.json({ success: true, data: { max_tokens } });
  });

  // Update token usage
  app.post('/api/context/:threadId/update-usage', requireAuth, (req: AuthRequest, res) => {
    const { tokens_added = 0 } = req.body;

    const context = db.prepare(
      'SELECT current_tokens FROM context_windows WHERE thread_id = ? AND user_id = ?'
    ).get(req.params.threadId, req.user!.sub) as any;

    const newTotal = (context?.current_tokens || 0) + tokens_added;

    db.prepare(
      'UPDATE context_windows SET current_tokens = ? WHERE thread_id = ? AND user_id = ?'
    ).run(newTotal, req.params.threadId, req.user!.sub);

    res.json({ success: true, data: { total_tokens: newTotal } });
  });

  // Auto-summarize
  app.post('/api/context/:threadId/auto-summarize', requireAuth, (req: AuthRequest, res) => {
    const context = db.prepare(
      'SELECT * FROM context_windows WHERE thread_id = ? AND user_id = ?'
    ).get(req.params.threadId, req.user!.sub) as any;

    if (!context) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    // Get last 10 messages
    const messages = db.prepare(
      'SELECT role, content FROM messages WHERE thread_id = ? ORDER BY created_at DESC LIMIT 10'
    ).all(req.params.threadId) as any[];

    const summary = `
      Recent conversation summary:
      ${messages.map(m => `${m.role}: ${m.content.substring(0, 100)}...`).join('\n')}
    `;

    res.json({
      success: true,
      data: {
        summary,
        archived_message_count: messages.length
      }
    });
  });
};
