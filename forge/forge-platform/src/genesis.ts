import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupGenesisBuilder = (app: Express, db: Database, requireAuth: any) => {
  // Genesis apps table (one-prompt-to-app)
  db.exec(`CREATE TABLE IF NOT EXISTS genesis_apps (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    app_type TEXT NOT NULL,
    generated_code TEXT,
    test_suite TEXT,
    deploy_url TEXT,
    status TEXT DEFAULT 'generating',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // One prompt → full CRUD app
  app.post('/api/genesis/generate', requireAuth, (req: AuthRequest, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'prompt required' });
      return;
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO genesis_apps (id, user_id, prompt, app_type, status) VALUES (?, ?, ?, ?, ?)'
    ).run(id, req.user!.sub, prompt, 'full-stack-crud', 'generating');

    // Background job: generate app code
    setImmediate(async () => {
      try {
        // In prod: call Claude API to generate:
        // - Frontend (React)
        // - Backend (Express)
        // - Database schema
        // - Test suite
        // - Docker config
        
        const generatedCode = `
// Frontend: React CRUD
import React, { useState, useEffect } from 'react';
export default function App() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({});
  
  useEffect(() => { fetch('/api/items').then(r => r.json()).then(d => setItems(d)); }, []);
  
  return (
    <div style={{ padding: 20 }}>
      <h1>CRUD App</h1>
      <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
      <button onClick={() => fetch('/api/items', { method: 'POST', body: JSON.stringify(form) }).then(() => location.reload())}>Add</button>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            {item.title}
            <button onClick={() => fetch('/api/items/' + item.id, { method: 'DELETE' }).then(() => location.reload())}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Backend: Express CRUD
app.get('/api/items', (req, res) => {
  const items = db.prepare('SELECT * FROM items').all();
  res.json(items);
});

app.post('/api/items', (req, res) => {
  const { title } = req.body;
  db.prepare('INSERT INTO items (id, title) VALUES (?, ?)').run(crypto.randomUUID(), title);
  res.json({ success: true });
});

app.delete('/api/items/:id', (req, res) => {
  db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});
        `;

        const testSuite = `
describe('Genesis App', () => {
  it('should create item', async () => {
    const res = await fetch('/api/items', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' })
    });
    expect(res.status).toBe(200);
  });
});
        `;

        db.prepare(
          'UPDATE genesis_apps SET generated_code = ?, test_suite = ?, status = ? WHERE id = ?'
        ).run(generatedCode, testSuite, 'ready', id);
      } catch (e) {
        db.prepare('UPDATE genesis_apps SET status = ? WHERE id = ?').run('error', id);
      }
    });

    res.status(202).json({ success: true, data: { id, status: 'generating' } });
  });

  // List generated apps
  app.get('/api/genesis/apps', requireAuth, (req: AuthRequest, res) => {
    const apps = db.prepare(
      'SELECT id, prompt, app_type, status, deploy_url, created_at FROM genesis_apps WHERE user_id = ? ORDER BY created_at DESC'
    ).all(req.user!.sub);
    res.json({ success: true, data: apps });
  });

  // Get app code
  app.get('/api/genesis/apps/:id', requireAuth, (req: AuthRequest, res) => {
    const app = db.prepare(
      'SELECT * FROM genesis_apps WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user!.sub) as any;
    
    if (!app) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }
    res.json({ success: true, data: app });
  });
};
