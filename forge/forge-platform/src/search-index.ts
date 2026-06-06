import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupSearchIndex = (app: Express, db: Database, requireAuth: any) => {
  // Search index table
  db.exec(`CREATE TABLE IF NOT EXISTS search_index (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    title TEXT,
    content TEXT,
    indexed_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, resource_type, resource_id)
  )`);

  // Full-text search on threads
  app.get('/api/search', requireAuth, (req: AuthRequest, res) => {
    const { q = '', resource_type = 'all' } = req.query;

    if (!q || q.toString().length < 2) {
      res.status(400).json({ error: 'Query must be at least 2 characters' });
      return;
    }

    const query = `%${q}%`;
    let results: any[] = [];

    if (resource_type === 'all' || resource_type === 'threads') {
      const threadResults = db.prepare(`
        SELECT 'thread' as type, id, title as name, created_at
        FROM threads
        WHERE user_id = ? AND (title LIKE ? OR id LIKE ?)
        LIMIT 20
      `).all(req.user!.sub, query, query) as any[];
      results.push(...threadResults);
    }

    if (resource_type === 'all' || resource_type === 'messages') {
      const messageResults = db.prepare(`
        SELECT 'message' as type, m.id, substr(m.content, 1, 100) as name, m.created_at
        FROM messages m
        JOIN threads t ON m.thread_id = t.id
        WHERE t.user_id = ? AND m.content LIKE ?
        LIMIT 20
      `).all(req.user!.sub, query) as any[];
      results.push(...messageResults);
    }

    res.json({
      success: true,
      data: {
        query: q,
        total_results: results.length,
        results
      }
    });
  });

  // Index resource
  app.post('/api/search/index', requireAuth, (req: AuthRequest, res) => {
    const { resource_type, resource_id, title, content } = req.body;

    db.prepare(`
      INSERT OR REPLACE INTO search_index
      (id, user_id, resource_type, resource_id, title, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user!.sub, resource_type, resource_id, title || '', content || '');

    res.json({ success: true });
  });

  // Rebuild index
  app.post('/api/search/rebuild-index', requireAuth, (req: AuthRequest, res) => {
    // Clear user's index
    db.prepare('DELETE FROM search_index WHERE user_id = ?').run(req.user!.sub);

    // Re-index all threads
    const threads = db.prepare(
      'SELECT id, title FROM threads WHERE user_id = ?'
    ).all(req.user!.sub) as any[];

    threads.forEach(t => {
      db.prepare(`
        INSERT INTO search_index (id, user_id, resource_type, resource_id, title, content)
        VALUES (?, ?, 'thread', ?, ?, ?)
      `).run(uuidv4(), req.user!.sub, t.id, t.title, '');
    });

    // Re-index all messages
    const messages = db.prepare(`
      SELECT m.id, m.content, m.thread_id
      FROM messages m
      JOIN threads t ON m.thread_id = t.id
      WHERE t.user_id = ?
    `).all(req.user!.sub) as any[];

    messages.forEach(m => {
      db.prepare(`
        INSERT INTO search_index (id, user_id, resource_type, resource_id, title, content)
        VALUES (?, ?, 'message', ?, ?, ?)
      `).run(uuidv4(), req.user!.sub, m.id, substr(m.content, 0, 100), m.content);
    });

    res.json({
      success: true,
      data: {
        threads_indexed: threads.length,
        messages_indexed: messages.length,
        total_indexed: threads.length + messages.length
      }
    });
  });

  // Get search stats
  app.get('/api/search/stats', requireAuth, (req: AuthRequest, res) => {
    const indexed = db.prepare(
      'SELECT COUNT(*) as total, COUNT(DISTINCT resource_type) as types FROM search_index WHERE user_id = ?'
    ).get(req.user!.sub) as any;

    res.json({
      success: true,
      data: {
        total_indexed: indexed.total,
        resource_types: indexed.types,
        search_ready: indexed.total > 0
      }
    });
  });
};

function substr(str: string, start: number, length?: number): string {
  return length ? str.substring(start, start + length) : str.substring(start);
}
