const fs = require('fs');
const path = 'C:\\Users\\teste\\OneDrive\\Documents\\Claude\\Projects\\forge\\forge-platform\\src\\index.ts';
let src = fs.readFileSync(path, 'utf8');

const anchor = `// GET /api/brain/category/:cat`;
if (!src.includes(anchor)) { console.error('Anchor not found'); process.exit(1); }
if (src.includes('thread_templates')) { console.log('Already exists'); process.exit(0); }

const insert = `
// Thread templates — save/load conversation starters
db.exec(\`CREATE TABLE IF NOT EXISTS thread_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  initial_prompt TEXT NOT NULL,
  system_prompt TEXT DEFAULT '',
  icon TEXT DEFAULT '📋',
  is_public INTEGER DEFAULT 0,
  use_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)\`);

app.get('/api/templates', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const rows = db.prepare('SELECT * FROM thread_templates WHERE user_id=? OR is_public=1 ORDER BY use_count DESC, created_at DESC').all(userId);
  res.json({ success: true, data: rows });
});

app.post('/api/templates', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { title, description, initial_prompt, system_prompt, icon } = req.body;
  if (!title || !initial_prompt) return res.status(400).json({ success: false, error: 'title and initial_prompt required' });
  const id = require('crypto').randomUUID();
  db.prepare('INSERT INTO thread_templates (id,user_id,title,description,initial_prompt,system_prompt,icon) VALUES (?,?,?,?,?,?,?)').run(id, userId, title, description||'', initial_prompt, system_prompt||'', icon||'📋');
  res.json({ success: true, data: { id, title, description, initial_prompt, system_prompt, icon } });
});

app.post('/api/templates/:id/use', requireAuth, (req: AuthRequest, res) => {
  db.prepare('UPDATE thread_templates SET use_count=use_count+1 WHERE id=?').run(req.params.id);
  const row = db.prepare('SELECT * FROM thread_templates WHERE id=?').get(req.params.id);
  res.json({ success: true, data: row });
});

app.delete('/api/templates/:id', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  db.prepare('DELETE FROM thread_templates WHERE id=? AND user_id=?').run(req.params.id, userId);
  res.json({ success: true });
});

`;

src = src.replace(anchor, insert + anchor);
fs.writeFileSync(path, src, 'utf8');
console.log('Done — templates endpoints added');
