const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'forge-platform', 'src', 'index.ts');
let src = fs.readFileSync(filePath, 'utf8');

if (src.includes('GET /api/messages/search')) { console.log('Already patched'); process.exit(0); }

const anchor = '// GET /api/brain/category/:cat';

const patch = `
// ── Message Search ─────────────────────────────────────────────────────────────
// GET /api/messages/search?q=&limit=20
app.get('/api/messages/search', requireAuth, (req: any, res: any) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ results: [] });
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const rows = db.prepare(\`
      SELECT m.id, m.thread_id, m.role, m.content, m.created_at,
             t.title as thread_title
      FROM messages m
      JOIN threads t ON t.id = m.thread_id
      WHERE m.user_id = ? AND m.content LIKE ?
      ORDER BY m.created_at DESC LIMIT ?
    \`).all(req.user.id, '%' + q + '%', limit) as any[];
    res.json({ results: rows, q });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Prompt Improver ────────────────────────────────────────────────────────────
// POST /api/prompts/improve
app.post('/api/prompts/improve', requireAuth, async (req: any, res: any) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });
    const systemMsg = 'You are a prompt engineer. Rewrite the user prompt to be clearer, more specific, and more likely to get a great AI response. Return ONLY the improved prompt text, nothing else.';
    // Try Haiku first
    let improved = '';
    try {
      const anthropicKey = await getUserKey(req.user.id, 'anthropic');
      if (anthropicKey) {
        const Anthropic = require('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey: anthropicKey });
        const msg = await client.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 512, system: systemMsg, messages: [{ role: 'user', content: prompt }] });
        improved = (msg.content[0] as any).text || '';
      }
    } catch {}
    if (!improved) {
      // Fallback: simple enhancement
      improved = prompt.trim() + '\\n\\nPlease be thorough, specific, and provide examples where relevant.';
    }
    res.json({ original: prompt, improved });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Thread Mood Tracker ────────────────────────────────────────────────────────
// GET /api/threads/:id/mood
app.get('/api/threads/:id/mood', requireAuth, async (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const msgs = db.prepare("SELECT content FROM messages WHERE thread_id=? AND role='assistant' ORDER BY created_at DESC LIMIT 10").all(threadId) as any[];
    if (!msgs.length) return res.json({ mood: 'neutral', emoji: '😐', score: 0 });
    const combined = msgs.map((m:any) => m.content).join(' ').slice(0, 1500);
    // Simple keyword sentiment
    const pos = (combined.match(/great|excellent|perfect|success|solved|done|happy|good|works|helpful|amazing|wonderful/gi) || []).length;
    const neg = (combined.match(/error|fail|broken|wrong|sorry|unfortunately|problem|issue|cannot|unable|bad/gi) || []).length;
    const score = pos - neg;
    const mood = score > 2 ? 'positive' : score < -1 ? 'negative' : 'neutral';
    const emoji = mood === 'positive' ? '😊' : mood === 'negative' ? '😟' : '😐';
    res.json({ mood, emoji, score, pos, neg });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Auto-tag Threads ───────────────────────────────────────────────────────────
// POST /api/threads/:id/autotag
app.post('/api/threads/:id/autotag', requireAuth, async (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const msgs = db.prepare("SELECT content FROM messages WHERE thread_id=? ORDER BY created_at ASC LIMIT 4").all(threadId) as any[];
    const combined = msgs.map((m:any) => m.content).join(' ').slice(0, 800);
    // Keyword-based tagging (fast, no LLM call needed)
    const tags: string[] = [];
    if (/code|function|bug|error|syntax|import|class|const|let|var|def |fn |async|await/i.test(combined)) tags.push('code');
    if (/write|draft|essay|article|email|blog|content|paragraph|story/i.test(combined)) tags.push('writing');
    if (/research|find|search|what is|explain|how does|summary|summarize/i.test(combined)) tags.push('research');
    if (/debug|fix|broken|issue|problem|not working|traceback|exception/i.test(combined)) tags.push('debug');
    if (/data|csv|sql|database|query|table|chart|analysis|excel/i.test(combined)) tags.push('data');
    if (/image|picture|photo|generate|dall|stable|midjourney/i.test(combined)) tags.push('image');
    if (tags.length === 0) tags.push('general');
    const finalTags = tags.slice(0, 3);
    // Store in thread metadata
    const meta = JSON.parse(thread.metadata || '{}');
    meta.tags = finalTags;
    db.prepare("UPDATE threads SET metadata = ? WHERE id=?").run(JSON.stringify(meta), threadId);
    res.json({ tags: finalTags });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

`;

src = src.replace(anchor, patch + anchor);
fs.writeFileSync(filePath, src, 'utf8');
console.log('Batch 2 backend routes added');
