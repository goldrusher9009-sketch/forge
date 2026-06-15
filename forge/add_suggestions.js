const fs = require('fs');
const path = 'C:\\Users\\teste\\OneDrive\\Documents\\Claude\\Projects\\forge\\forge-platform\\src\\index.ts';
let src = fs.readFileSync(path, 'utf8');

const anchor = `// GET /api/brain/category/:cat`;
if (!src.includes(anchor)) { console.error('Anchor not found'); process.exit(1); }
if (src.includes('/api/threads/:id/suggestions')) { console.log('Already exists'); process.exit(0); }

const insert = `
// POST /api/threads/:id/suggestions — generate 3 follow-up reply chips using LLM
app.post('/api/threads/:id/suggestions', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const thread = db.prepare('SELECT id FROM threads WHERE id=? AND user_id=?').get(req.params.id, userId);
  if (!thread) return res.status(404).json({ success: false, error: 'Thread not found' });
  const msgs = db.prepare('SELECT role,content FROM messages WHERE thread_id=? ORDER BY created_at DESC LIMIT 6').all(req.params.id) as any[];
  const lastAI = msgs.find((m: any) => m.role === 'assistant');
  if (!lastAI) return res.json({ success: true, suggestions: [] });
  try {
    const userRow = db.prepare('SELECT preferred_model FROM users WHERE id=?').get(userId) as any;
    const model = userRow?.preferred_model || 'claude-3-5-haiku-20241022';
    const key = await getUserKey(userId, 'anthropic');
    if (!key) return res.json({ success: true, suggestions: [] });
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic.default({ apiKey: key });
    const context = msgs.reverse().map((m: any) => \`\${m.role}: \${m.content.slice(0,300)}\`).join('\\n');
    const resp = await client.messages.create({
      model: model.startsWith('claude') ? model : 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      messages: [{ role: 'user', content: \`Given this conversation, generate exactly 3 short follow-up questions or prompts the user might want to ask next. Return ONLY a JSON array of 3 strings, each under 60 chars. No explanation.\\n\\nConversation:\\n\${context}\` }]
    });
    const text = resp.content[0].type === 'text' ? resp.content[0].text.trim() : '[]';
    const match = text.match(/\\[.*\\]/s);
    const suggestions = match ? JSON.parse(match[0]) : [];
    res.json({ success: true, suggestions: suggestions.slice(0, 3) });
  } catch (e: any) { res.json({ success: true, suggestions: [] }); }
});

`;

src = src.replace(anchor, insert + anchor);
fs.writeFileSync(path, src, 'utf8');
console.log('Done — suggestions endpoint added');
