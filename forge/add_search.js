const fs = require('fs');
const path = 'C:\\Users\\teste\\OneDrive\\Documents\\Claude\\Projects\\forge\\forge-platform\\src\\index.ts';
let src = fs.readFileSync(path, 'utf8');

const anchor = `// GET /api/brain/category/:cat`;
if (!src.includes(anchor)) { console.error('Anchor not found'); process.exit(1); }
if (src.includes("'/api/search'")) { console.log('Already exists'); process.exit(0); }

const insert = `
// GET /api/search?q= — full-text search across threads and messages
app.get('/api/search', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const q = ((req.query.q as string) || '').trim();
  if (!q || q.length < 2) return res.json({ success: true, data: [] });
  const like = '%' + q.replace(/%/g,'\\%').replace(/_/g,'\\_') + '%';
  const threadHits = db.prepare(\`SELECT id, title, created_at, 'thread' as type, title as snippet FROM threads WHERE user_id=? AND title LIKE ? ESCAPE '\\\\' ORDER BY created_at DESC LIMIT 10\`).all(userId, like) as any[];
  const msgHits = db.prepare(\`SELECT m.id, m.thread_id, m.role, m.content, m.created_at, 'message' as type, t.title as thread_title FROM messages m JOIN threads t ON t.id=m.thread_id WHERE t.user_id=? AND m.content LIKE ? ESCAPE '\\\\' ORDER BY m.created_at DESC LIMIT 20\`).all(userId, like) as any[];
  const msgResults = msgHits.map((m: any) => {
    const idx = m.content.toLowerCase().indexOf(q.toLowerCase());
    const start = Math.max(0, idx - 60);
    const snippet = (start > 0 ? '…' : '') + m.content.slice(start, start + 140) + (start + 140 < m.content.length ? '…' : '');
    return { ...m, snippet };
  });
  res.json({ success: true, data: { threads: threadHits, messages: msgResults } });
});

`;

src = src.replace(anchor, insert + anchor);
fs.writeFileSync(path, src, 'utf8');
console.log('Done — search endpoint added');
