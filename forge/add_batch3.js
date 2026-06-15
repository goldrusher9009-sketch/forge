const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'forge-platform', 'src', 'index.ts');
let src = fs.readFileSync(filePath, 'utf8');

if (src.includes('GET /api/threads/:id/token-breakdown')) { console.log('Already patched'); process.exit(0); }

const anchor = '// GET /api/brain/category/:cat';

const patch = `
// ── Per-model token breakdown ─────────────────────────────────────────────────
// GET /api/threads/:id/token-breakdown
app.get('/api/threads/:id/token-breakdown', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT id FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const breakdown = db.prepare(\`
      SELECT model, provider,
        SUM(prompt_tokens) as prompt_tokens,
        SUM(completion_tokens) as completion_tokens,
        SUM(prompt_tokens+completion_tokens) as total_tokens,
        COUNT(*) as requests,
        SUM(provider_cost) as cost
      FROM routing_log
      WHERE thread_id=? AND user_id=?
      GROUP BY model, provider
      ORDER BY total_tokens DESC
    \`).all(threadId, req.user.id) as any[];
    const totals = breakdown.reduce((a:any,r:any) => ({
      prompt: a.prompt + (r.prompt_tokens||0),
      completion: a.completion + (r.completion_tokens||0),
      total: a.total + (r.total_tokens||0),
      cost: a.cost + (r.cost||0),
      requests: a.requests + (r.requests||0)
    }), { prompt:0, completion:0, total:0, cost:0, requests:0 });
    res.json({ breakdown, totals });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Smart thread rename (auto-rename after 3rd message if title is 'New Thread') ──
// POST /api/threads/:id/smart-rename
app.post('/api/threads/:id/smart-rename', requireAuth, async (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    // Only rename if still default title
    if (thread.title && thread.title !== 'New Thread' && thread.title !== 'Untitled') {
      return res.json({ renamed: false, title: thread.title });
    }
    const msgs = db.prepare("SELECT content, role FROM messages WHERE thread_id=? ORDER BY created_at ASC LIMIT 3").all(threadId) as any[];
    if (msgs.length < 2) return res.json({ renamed: false, title: thread.title });
    const firstUser = msgs.find((m:any) => m.role === 'user');
    if (!firstUser) return res.json({ renamed: false });
    // Generate title from first user message
    const raw = firstUser.content.slice(0, 120).trim();
    let title = raw.length > 60 ? raw.slice(0, 57) + '…' : raw;
    // Clean up
    title = title.replace(/^(please|can you|help me|i need|could you|write|explain|tell me about)\s+/i, '');
    title = title.charAt(0).toUpperCase() + title.slice(1);
    db.prepare('UPDATE threads SET title=? WHERE id=?').run(title, threadId);
    res.json({ renamed: true, title });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Thread word count & reading time ─────────────────────────────────────────
// GET /api/threads/:id/stats-extended
app.get('/api/threads/:id/stats-extended', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT id FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const msgs = db.prepare("SELECT role, content, LENGTH(content) as len FROM messages WHERE thread_id=?").all(threadId) as any[];
    const totalChars = msgs.reduce((a:any,m:any) => a + (m.len||0), 0);
    const wordCount = Math.round(totalChars / 5);
    const readingMinutes = Math.ceil(wordCount / 200);
    const userMsgs = msgs.filter((m:any) => m.role === 'user').length;
    const asMsgs = msgs.filter((m:any) => m.role === 'assistant').length;
    res.json({ totalMessages: msgs.length, userMessages: userMsgs, assistantMessages: asMsgs, wordCount, readingMinutes, totalChars });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Conversation highlights — best-rated + most-reacted messages ─────────────
// GET /api/threads/:id/highlights
app.get('/api/threads/:id/highlights', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT id FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const msgs = db.prepare(\`
      SELECT id, role, content, metadata, created_at FROM messages
      WHERE thread_id=? AND role='assistant'
      ORDER BY created_at ASC
    \`).all(threadId) as any[];
    const highlights = msgs
      .map((m:any) => {
        const meta = JSON.parse(m.metadata || '{}');
        return { ...m, rating: meta.rating || 0, reactions: Object.keys(meta.reactions || {}).length };
      })
      .filter((m:any) => m.rating === 1 || m.reactions > 0)
      .slice(0, 5);
    res.json({ highlights });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

`;

src = src.replace(anchor, patch + anchor);
fs.writeFileSync(filePath, src, 'utf8');
console.log('Batch 3 backend routes added');
