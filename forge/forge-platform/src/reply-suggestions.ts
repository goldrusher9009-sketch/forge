import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupReplySuggestions = (app: Express, db: Database, requireAuth: any) => {
  // Suggestions table
  db.exec(`CREATE TABLE IF NOT EXISTS reply_suggestions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    thread_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    suggestion_text TEXT NOT NULL,
    tone TEXT DEFAULT 'neutral',
    rating INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Generate suggestions for last message
  app.post('/api/threads/:threadId/suggest-replies', requireAuth, (req: AuthRequest, res) => {
    const lastMsg = db.prepare(
      'SELECT id, content FROM messages WHERE thread_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(req.params.threadId) as any;

    if (!lastMsg) {
      res.status(404).json({ error: 'NO_MESSAGES' });
      return;
    }

    // Generate 3 suggestions based on message
    const suggestions = [
      { tone: 'concise', text: 'Got it. Thanks for the info.' },
      { tone: 'detailed', text: `That\'s helpful. Can you expand on the point about "${lastMsg.content.substring(0, 30)}..."?` },
      { tone: 'technical', text: 'Understood. What are the implementation constraints we should consider?' }
    ];

    const stored = suggestions.map(s => {
      const id = uuidv4();
      db.prepare(
        'INSERT INTO reply_suggestions (id, user_id, thread_id, message_id, suggestion_text, tone) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(id, req.user!.sub, req.params.threadId, lastMsg.id, s.text, s.tone);
      return { id, ...s };
    });

    res.json({ success: true, data: stored });
  });

  // Get suggestions
  app.get('/api/threads/:threadId/suggestions', requireAuth, (req: AuthRequest, res) => {
    const suggestions = db.prepare(
      'SELECT id, suggestion_text, tone, rating FROM reply_suggestions WHERE thread_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 5'
    ).all(req.params.threadId, req.user!.sub) as any[];

    res.json({ success: true, data: suggestions });
  });

  // Rate suggestion
  app.post('/api/suggestions/:id/rate', requireAuth, (req: AuthRequest, res) => {
    const { rating } = req.body;
    db.prepare(
      'UPDATE reply_suggestions SET rating = ? WHERE id = ? AND user_id = ?'
    ).run(rating || 0, req.params.id, req.user!.sub);

    res.json({ success: true });
  });
};
