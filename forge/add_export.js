const fs = require('fs');
const path = 'C:\\Users\\teste\\OneDrive\\Documents\\Claude\\Projects\\forge\\forge-platform\\src\\index.ts';
let src = fs.readFileSync(path, 'utf8');

const anchor = `// GET /api/brain/category/:cat`;
if (!src.includes(anchor)) { console.error('Anchor not found'); process.exit(1); }
if (src.includes('/api/threads/:id/export')) { console.log('Already exists'); process.exit(0); }

const insert = `
// GET /api/threads/:id/export — export thread as markdown or JSON
app.get('/api/threads/:id/export', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(req.params.id, userId) as any;
  if (!thread) return res.status(404).json({ success: false, error: 'Thread not found' });
  const msgs = db.prepare('SELECT role,content,created_at FROM messages WHERE thread_id=? ORDER BY created_at ASC').all(req.params.id) as any[];
  const fmt = (req.query.format as string) || 'md';
  if (fmt === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', \`attachment; filename="thread-\${req.params.id.slice(0,8)}.json"\`);
    return res.json({ thread: { id: thread.id, title: thread.title, created_at: thread.created_at }, messages: msgs });
  }
  const lines = [\`# \${thread.title || 'Thread'}\`, \`Exported \${new Date().toISOString().slice(0,10)}\`, ''];
  for (const m of msgs) {
    const role = m.role === 'user' ? '**You**' : '**Forge**';
    lines.push(\`### \${role}\`, \`_\${m.created_at}_\`, '', m.content, '', '---', '');
  }
  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', \`attachment; filename="thread-\${req.params.id.slice(0,8)}.md"\`);
  res.send(lines.join('\\n'));
});

`;

src = src.replace(anchor, insert + anchor);
fs.writeFileSync(path, src, 'utf8');
console.log('Done — export endpoint added');
