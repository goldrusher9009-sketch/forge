import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupMemoryRoutes = (app: Express, db: Database, requireAuth: any) => {
  // Vector memory store
  db.exec(`CREATE TABLE IF NOT EXISTS vector_memory (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding TEXT,
    memory_type TEXT DEFAULT 'episodic',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_accessed TEXT
  )`);

  // Store memory (episodic, semantic, working)
  app.post('/api/memory/store', requireAuth, (req: AuthRequest, res) => {
    const { content, memory_type = 'episodic' } = req.body;
    if (!content) {
      res.status(400).json({ error: 'content required' });
      return;
    }

    const id = uuidv4();
    // Placeholder embedding (in prod: call OpenAI embedding API)
    const embedding = Buffer.from(content).toString('base64').substring(0, 512);
    
    db.prepare(
      'INSERT INTO vector_memory (id, user_id, content, embedding, memory_type) VALUES (?, ?, ?, ?, ?)'
    ).run(id, req.user!.sub, content, embedding, memory_type);

    res.status(201).json({ success: true, data: { id, memory_type } });
  });

  // Semantic search over memories
  app.get('/api/memory/search', requireAuth, (req: AuthRequest, res) => {
    const { query, memory_type, limit = 10 } = req.query;
    
    if (!query) {
      res.status(400).json({ error: 'query required' });
      return;
    }

    let sql = 'SELECT * FROM vector_memory WHERE user_id = ?';
    const params: any[] = [req.user!.sub];
    
    if (memory_type) {
      sql += ' AND memory_type = ?';
      params.push(memory_type);
    }
    
    // Simple substring search (in prod: use vector similarity)
    sql += ' AND content LIKE ? ORDER BY last_accessed DESC LIMIT ?';
    params.push(`%${query}%`, limit);

    const results = db.prepare(sql).all(...params);
    res.json({ success: true, data: results });
  });

  // Update last accessed time
  app.post('/api/memory/access', requireAuth, (req: AuthRequest, res) => {
    const { memory_id } = req.body;
    db.prepare(
      "UPDATE vector_memory SET last_accessed = datetime('now') WHERE id = ? AND user_id = ?"
    ).run(memory_id, req.user!.sub);
    res.json({ success: true });
  });

  // List all memories
  app.get('/api/memory/list', requireAuth, (req: AuthRequest, res) => {
    const memories = db.prepare(
      'SELECT id, content, memory_type, created_at FROM vector_memory WHERE user_id = ? ORDER BY created_at DESC LIMIT 100'
    ).all(req.user!.sub);
    res.json({ success: true, data: memories });
  });
};
