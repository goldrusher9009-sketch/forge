const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'forge-platform', 'src', 'index.ts');
let src = fs.readFileSync(filePath, 'utf8');

if (src.includes('GET /api/threads/:id/diff-summary')) { console.log('Already patched'); process.exit(0); }

const anchor = '// GET /api/brain/category/:cat';

const patch = `
// ── Code diff summarizer ───────────────────────────────────────────────────────
// POST /api/threads/:id/diff-summary
app.post('/api/threads/:id/diff-summary', requireAuth, async (req: any, res: any) => {
  try {
    const { diff } = req.body;
    if (!diff) return res.status(400).json({ error: 'diff required' });
    const thread = db.prepare('SELECT id FROM threads WHERE id=? AND user_id=?').get(req.params.id, req.user.id) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    // Parse diff to extract files + line counts
    const files: any[] = [];
    let currentFile = '';
    let added = 0; let removed = 0;
    for (const line of diff.split('\\n')) {
      if (line.startsWith('+++ b/') || line.startsWith('--- b/')) {
        if (currentFile && (added + removed > 0)) files.push({ file: currentFile, added, removed });
        currentFile = line.slice(6); added = 0; removed = 0;
      } else if (line.startsWith('+') && !line.startsWith('+++')) added++;
      else if (line.startsWith('-') && !line.startsWith('---')) removed++;
    }
    if (currentFile && (added + removed > 0)) files.push({ file: currentFile, added, removed });
    const totalAdded = files.reduce((a: number, f: any) => a + f.added, 0);
    const totalRemoved = files.reduce((a: number, f: any) => a + f.removed, 0);
    const summary = \`Changed \${files.length} file(s): +\${totalAdded}/-\${totalRemoved} lines. Files: \${files.slice(0,5).map((f: any) => f.file.split('/').pop()).join(', ')}\${files.length > 5 ? '...' : ''}\`;
    res.json({ files, totalAdded, totalRemoved, summary });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Thread replay / session summary ────────────────────────────────────────────
// GET /api/threads/:id/replay
app.get('/api/threads/:id/replay', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const msgs = db.prepare("SELECT id, role, content, created_at, metadata FROM messages WHERE thread_id=? ORDER BY created_at ASC").all(threadId) as any[];
    // Build a timeline of key moments
    const timeline = msgs.map((m: any, i: number) => {
      const meta = JSON.parse(m.metadata || '{}');
      const isCode = /\`\`\`/.test(m.content);
      const isLong = m.content.length > 500;
      const hasUrl = /https?:\\/\\//.test(m.content);
      return {
        index: i,
        id: m.id,
        role: m.role,
        preview: m.content.slice(0, 120) + (m.content.length > 120 ? '…' : ''),
        timestamp: m.created_at,
        isCode,
        isLong,
        hasUrl,
        rating: meta.rating,
        bookmarked: meta.bookmarked || false,
        wordCount: Math.round(m.content.split(/\\s+/).length),
      };
    });
    const keyMoments = timeline.filter((m: any) => m.rating === 1 || m.bookmarked || m.isCode || m.isLong);
    res.json({ timeline, keyMoments, totalMessages: msgs.length, totalWords: timeline.reduce((a: number, m: any) => a + m.wordCount, 0) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Workspace glossary — extract repeated technical terms ───────────────────────
// GET /api/brain/glossary
app.get('/api/brain/glossary', requireAuth, (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 30;
    const msgs = db.prepare("SELECT content FROM messages WHERE user_id=? AND role='user' ORDER BY created_at DESC LIMIT 500").all(userId) as any[];
    const text = msgs.map((m: any) => m.content).join(' ');
    // Extract CamelCase, SCREAMING_SNAKE, kebab-terms, and tech words
    const patterns = [
      ...Array.from(text.matchAll(/\\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\\b/g)).map((m: any) => m[0]),   // CamelCase
      ...Array.from(text.matchAll(/\\b[A-Z]{2,}(?:_[A-Z]+)+\\b/g)).map((m: any) => m[0]),           // SCREAMING_SNAKE
      ...Array.from(text.matchAll(/\\b\\w+(?:-\\w+){1,3}\\b/g)).map((m: any) => m[0]),                // kebab-case
    ];
    const freq: Record<string, number> = {};
    for (const t of patterns) { freq[t] = (freq[t]||0) + 1; }
    const glossary = Object.entries(freq)
      .filter(([, c]) => c >= 2)
      .sort(([,a],[,b]) => (b as number) - (a as number))
      .slice(0, limit)
      .map(([term, count]) => ({ term, count }));
    res.json({ glossary });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Daily digest — top thread + memory summary ──────────────────────────────────
// GET /api/brain/daily-digest
app.get('/api/brain/daily-digest', requireAuth, (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const today = new Date(); today.setHours(0,0,0,0);
    const msgs = db.prepare("SELECT COUNT(*) as cnt FROM messages WHERE user_id=? AND created_at >= ?").get(userId, today.toISOString()) as any;
    const topThread = db.prepare(\`
      SELECT t.id, t.title, COUNT(m.id) as msg_count FROM threads t
      JOIN messages m ON m.thread_id=t.id
      WHERE t.user_id=? AND m.created_at >= ?
      GROUP BY t.id ORDER BY msg_count DESC LIMIT 1
    \`).get(userId, today.toISOString()) as any;
    const newMemories = db.prepare("SELECT COUNT(*) as cnt FROM forge_memory WHERE user_id=? AND created_at >= ?").get(userId, today.toISOString()) as any;
    const streak = db.prepare(\`
      SELECT COUNT(DISTINCT date(created_at)) as days FROM messages
      WHERE user_id=? AND created_at >= date('now','-30 days')
    \`).get(userId) as any;
    res.json({
      todayMessages: msgs?.cnt || 0,
      topThread: topThread || null,
      newMemories: newMemories?.cnt || 0,
      activeStreak: streak?.days || 0,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

`;

src = src.replace(anchor, patch + anchor);
fs.writeFileSync(filePath, src, 'utf8');
console.log('Batch4 backend done. Lines:', src.split('\n').length);
