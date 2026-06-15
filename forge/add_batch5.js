const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'forge-platform', 'src', 'index.ts');
let src = fs.readFileSync(filePath, 'utf8');

if (src.includes('GET /api/threads/:id/similar')) { console.log('Already patched'); process.exit(0); }

const anchor = '// GET /api/brain/category/:cat';

const patch = `
// ── Similar threads finder ─────────────────────────────────────────────────────
// GET /api/threads/:id/similar
app.get('/api/threads/:id/similar', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    // Get keywords from this thread's messages
    const msgs = db.prepare("SELECT content FROM messages WHERE thread_id=? ORDER BY created_at ASC LIMIT 5").all(threadId) as any[];
    const text = msgs.map((m: any) => m.content).join(' ').toLowerCase();
    const words = text.match(/\\b[a-z]{4,}\\b/g) || [];
    const freq: Record<string,number> = {};
    for (const w of words) freq[w] = (freq[w]||0)+1;
    const topWords = Object.entries(freq).sort(([,a],[,b])=>(b as number)-(a as number)).slice(0,8).map(([w])=>w);
    if (topWords.length === 0) return res.json({ similar: [] });
    // Find other threads with similar words
    const allThreads = db.prepare("SELECT t.id, t.title, t.created_at FROM threads t WHERE t.user_id=? AND t.id!=? AND t.archived=0 ORDER BY t.created_at DESC LIMIT 100").all(req.user.id, threadId) as any[];
    const scored = allThreads.map((t: any) => {
      const tMsgs = db.prepare("SELECT content FROM messages WHERE thread_id=? LIMIT 3").all(t.id) as any[];
      const tText = tMsgs.map((m: any) => m.content).join(' ').toLowerCase();
      const score = topWords.filter((w: string) => tText.includes(w)).length;
      return { ...t, score };
    }).filter((t: any) => t.score > 1).sort((a: any,b: any) => b.score - a.score).slice(0,5);
    res.json({ similar: scored });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Prompt template library (public + user) ────────────────────────────────────
// GET /api/prompt-templates
app.get('/api/prompt-templates', requireAuth, (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const builtins = [
      { id:'b1', title:'Debug this code', body:'Please debug the following code and explain what is wrong:\\n\\n```\\n{{code}}\\n```', category:'coding', builtin:true },
      { id:'b2', title:'Explain like I\'m 5', body:'Explain the following concept in simple terms a 5-year-old could understand:\\n\\n{{concept}}', category:'learning', builtin:true },
      { id:'b3', title:'Write unit tests', body:'Write comprehensive unit tests for the following function:\\n\\n```\\n{{code}}\\n```', category:'coding', builtin:true },
      { id:'b4', title:'Summarize article', body:'Please summarize the following article in 3-5 bullet points:\\n\\n{{article}}', category:'writing', builtin:true },
      { id:'b5', title:'Code review', body:'Please review the following code for bugs, performance issues, and best practices:\\n\\n```\\n{{code}}\\n```', category:'coding', builtin:true },
      { id:'b6', title:'Translate to English', body:'Please translate the following text to English:\\n\\n{{text}}', category:'writing', builtin:true },
      { id:'b7', title:'SQL query help', body:'Write a SQL query to: {{task}}\\n\\nTable schema: {{schema}}', category:'data', builtin:true },
      { id:'b8', title:'Regex pattern', body:'Write a regex pattern that matches: {{description}}\\n\\nTest cases:\\n{{examples}}', category:'coding', builtin:true },
    ];
    const userTemplates = db.prepare("SELECT * FROM prompt_templates WHERE user_id=? ORDER BY created_at DESC").all(userId) as any[];
    res.json({ templates: [...builtins, ...userTemplates] });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/prompt-templates
app.post('/api/prompt-templates', requireAuth, (req: any, res: any) => {
  try {
    const { title, body, category } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'title and body required' });
    // Ensure table exists
    db.prepare(\`CREATE TABLE IF NOT EXISTS prompt_templates (
      id TEXT PRIMARY KEY, user_id TEXT, title TEXT, body TEXT, category TEXT, created_at TEXT DEFAULT (datetime('now'))
    )\`).run();
    const id = 'ut_' + Date.now();
    db.prepare("INSERT INTO prompt_templates (id, user_id, title, body, category) VALUES (?,?,?,?,?)").run(id, req.user.id, title, body, category || 'general');
    res.json({ id, title, body, category, builtin: false });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/prompt-templates/:id
app.delete('/api/prompt-templates/:id', requireAuth, (req: any, res: any) => {
  try {
    db.prepare("DELETE FROM prompt_templates WHERE id=? AND user_id=?").run(req.params.id, req.user.id);
    res.json({ deleted: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── AI Writing coach — critique a user message before sending ─────────────────
// POST /api/prompts/critique
app.post('/api/prompts/critique', requireAuth, async (req: any, res: any) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });
    const issues: string[] = [];
    if (text.length < 20) issues.push('Very short prompt — add more context for better results');
    if (!/[?.]/.test(text)) issues.push('No clear question or goal — consider ending with a specific request');
    if ((text.match(/please|help|can you/gi)||[]).length > 2) issues.push('Too many filler words — be direct');
    if (text.length > 2000) issues.push('Very long prompt — consider breaking into smaller questions');
    if (!/\\b(code|function|class|api|sql|json|csv|html|css|react|python|javascript|typescript)\\b/i.test(text) && !/\\b(explain|write|create|build|fix|debug|analyze|compare|summarize|translate)\\b/i.test(text)) {
      issues.push('No clear action verb — try starting with: explain, write, create, fix, analyze');
    }
    const score = Math.max(0, 100 - issues.length * 20);
    res.json({ score, issues, ok: issues.length === 0 });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

`;

src = src.replace(anchor, patch + anchor);
fs.writeFileSync(filePath, src, 'utf8');
console.log('Batch5 backend done. Lines:', src.split('\n').length);
