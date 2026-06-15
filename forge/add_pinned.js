const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'forge-platform', 'src', 'index.ts');
let src = fs.readFileSync(filePath, 'utf8');

if (src.includes('pinned_messages')) { console.log('Already patched'); process.exit(0); }

const anchor = '// GET /api/brain/category/:cat';

const patch = `
// ── Pinned Messages ────────────────────────────────────────────────────────────
// POST /api/messages/:id/pin
app.post('/api/messages/:id/pin', requireAuth, (req: any, res: any) => {
  try {
    const msgId = Number(req.params.id);
    const msg = db.prepare('SELECT * FROM messages WHERE id=?').get(msgId) as any;
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    // verify user owns the thread
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(msg.thread_id, req.user.id) as any;
    if (!thread) return res.status(403).json({ error: 'Forbidden' });
    db.prepare("UPDATE messages SET metadata = json_set(COALESCE(metadata,'{}'), '$.pinned', 1) WHERE id=?").run(msgId);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/messages/:id/pin
app.delete('/api/messages/:id/pin', requireAuth, (req: any, res: any) => {
  try {
    const msgId = Number(req.params.id);
    const msg = db.prepare('SELECT * FROM messages WHERE id=?').get(msgId) as any;
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(msg.thread_id, req.user.id) as any;
    if (!thread) return res.status(403).json({ error: 'Forbidden' });
    db.prepare("UPDATE messages SET metadata = json_set(COALESCE(metadata,'{}'), '$.pinned', 0) WHERE id=?").run(msgId);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/threads/:id/pinned
app.get('/api/threads/:id/pinned', requireAuth, (req: any, res: any) => {
  try {
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(Number(req.params.id), req.user.id) as any;
    if (!thread) return res.status(403).json({ error: 'Forbidden' });
    const pinned = db.prepare("SELECT * FROM messages WHERE thread_id=? AND json_extract(COALESCE(metadata,'{}'),'$.pinned')=1 ORDER BY created_at ASC").all(Number(req.params.id));
    res.json({ pinned });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

`;

src = src.replace(anchor, patch + anchor);
fs.writeFileSync(filePath, src, 'utf8');
console.log('Pinned messages routes added');
