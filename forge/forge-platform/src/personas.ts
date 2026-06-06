import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupPersonas = (app: Express, db: Database, requireAuth: any) => {
  // Personas table
  db.exec(`CREATE TABLE IF NOT EXISTS chat_personas (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    model TEXT DEFAULT 'claude-3-sonnet',
    temperature REAL DEFAULT 0.7,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Create persona
  app.post('/api/personas', requireAuth, (req: AuthRequest, res) => {
    const { name, description, system_prompt, model = 'claude-3-sonnet', temperature = 0.7 } = req.body;
    if (!name || !system_prompt) {
      res.status(400).json({ error: 'name and system_prompt required' });
      return;
    }

    const personaId = uuidv4();
    db.prepare(
      'INSERT INTO chat_personas (id, user_id, name, description, system_prompt, model, temperature) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(personaId, req.user!.sub, name, description || '', system_prompt, model, temperature);

    res.status(201).json({
      success: true,
      data: { id: personaId, name, description, system_prompt, model, temperature }
    });
  });

  // List personas
  app.get('/api/personas', requireAuth, (req: AuthRequest, res) => {
    const personas = db.prepare(
      'SELECT id, name, description, model FROM chat_personas WHERE user_id = ? ORDER BY created_at DESC'
    ).all(req.user!.sub) as any[];

    res.json({ success: true, data: personas });
  });

  // Get persona
  app.get('/api/personas/:id', requireAuth, (req: AuthRequest, res) => {
    const persona = db.prepare(
      'SELECT * FROM chat_personas WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user!.sub) as any;

    if (!persona) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    res.json({ success: true, data: persona });
  });

  // Update persona
  app.put('/api/personas/:id', requireAuth, (req: AuthRequest, res) => {
    const { name, description, system_prompt, temperature } = req.body;
    db.prepare(
      'UPDATE chat_personas SET name = ?, description = ?, system_prompt = ?, temperature = ? WHERE id = ? AND user_id = ?'
    ).run(name, description, system_prompt, temperature, req.params.id, req.user!.sub);

    res.json({ success: true });
  });

  // Delete persona
  app.delete('/api/personas/:id', requireAuth, (req: AuthRequest, res) => {
    db.prepare(
      'DELETE FROM chat_personas WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.user!.sub);

    res.json({ success: true });
  });
};
