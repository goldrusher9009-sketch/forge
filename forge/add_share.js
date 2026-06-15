const fs = require('fs');
const path = 'C:\\Users\\teste\\OneDrive\\Documents\\Claude\\Projects\\forge\\forge-platform\\src\\index.ts';
let src = fs.readFileSync(path, 'utf8');

const anchor = `// GET /api/brain/category/:cat`;
if (!src.includes(anchor)) { console.error('Anchor not found'); process.exit(1); }
if (src.includes('thread_shares')) { console.log('Already exists'); process.exit(0); }

const insert = `
// Thread sharing — generate public read-only links
db.exec(\`CREATE TABLE IF NOT EXISTS thread_shares (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  title_override TEXT DEFAULT '',
  is_active INTEGER DEFAULT 1,
  view_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)\`);

// POST /api/threads/:id/share — create or return existing share link
app.post('/api/threads/:id/share', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(req.params.id, userId) as any;
  if (!thread) return res.status(404).json({ success: false, error: 'Thread not found' });
  let existing = db.prepare('SELECT * FROM thread_shares WHERE thread_id=? AND user_id=? AND is_active=1').get(req.params.id, userId) as any;
  if (existing) return res.json({ success: true, data: existing, token: existing.share_token });
  const id = require('crypto').randomUUID();
  const token = require('crypto').randomBytes(16).toString('hex');
  db.prepare('INSERT INTO thread_shares (id,thread_id,user_id,share_token) VALUES (?,?,?,?)').run(id, req.params.id, userId, token);
  res.json({ success: true, data: { id, thread_id: req.params.id, share_token: token }, token });
});

// DELETE /api/threads/:id/share — revoke share link
app.delete('/api/threads/:id/share', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  db.prepare('UPDATE thread_shares SET is_active=0 WHERE thread_id=? AND user_id=?').run(req.params.id, userId);
  res.json({ success: true });
});

// GET /api/shared/:token — public read-only view (no auth)
app.get('/api/shared/:token', (req, res) => {
  const share = db.prepare('SELECT * FROM thread_shares WHERE share_token=? AND is_active=1').get(req.params.token) as any;
  if (!share) return res.status(404).json({ success: false, error: 'Share link not found or revoked' });
  db.prepare('UPDATE thread_shares SET view_count=view_count+1 WHERE share_token=?').run(req.params.token);
  const thread = db.prepare('SELECT id,title,created_at FROM threads WHERE id=?').get(share.thread_id) as any;
  const msgs = db.prepare('SELECT role,content,created_at FROM messages WHERE thread_id=? ORDER BY created_at ASC').all(share.thread_id) as any[];
  res.json({ success: true, data: { thread, messages: msgs, view_count: share.view_count + 1 } });
});

`;

src = src.replace(anchor, insert + anchor);
fs.writeFileSync(path, src, 'utf8');
console.log('Done — thread share endpoints added');
