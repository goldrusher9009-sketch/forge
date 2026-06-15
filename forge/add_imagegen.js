const fs = require('fs');
const path = 'C:\\Users\\teste\\OneDrive\\Documents\\Claude\\Projects\\forge\\forge-platform\\src\\index.ts';
let src = fs.readFileSync(path, 'utf8');

const anchor = `// GET /api/brain/category/:cat`;
if (!src.includes(anchor)) { console.error('Anchor not found'); process.exit(1); }
if (src.includes("'/api/image-gen'")) { console.log('Already exists'); process.exit(0); }

const insert = `
// POST /api/image-gen — generate image via DALL-E 3 using user's OpenAI key
app.post('/api/image-gen', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { prompt, thread_id } = req.body;
  if (!prompt) return res.status(400).json({ success: false, error: 'prompt required' });
  try {
    const key = await getUserKey(userId, 'openai');
    if (!key) return res.status(400).json({ success: false, error: 'No OpenAI key configured. Add one in Settings.' });
    const OpenAI = require('openai');
    const client = new OpenAI.default({ apiKey: key });
    const resp = await client.images.generate({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', quality: 'standard' });
    const url = resp.data[0].url;
    // Save assistant message to thread if thread_id provided
    if (thread_id) {
      const msgId = require('crypto').randomUUID();
      const userMsgId = require('crypto').randomUUID();
      db.prepare('INSERT INTO messages (id,thread_id,role,content,created_at) VALUES (?,?,?,?,datetime(\\'now\\'))').run(userMsgId, thread_id, 'user', '/image ' + prompt);
      db.prepare('INSERT INTO messages (id,thread_id,role,content,created_at) VALUES (?,?,?,?,datetime(\\'now\\'))').run(msgId, thread_id, 'assistant', \`![](\${url})\\n\\n*Prompt: \${prompt}*\`);
    }
    res.json({ success: true, url });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

`;

src = src.replace(anchor, insert + anchor);
fs.writeFileSync(path, src, 'utf8');
console.log('Done — image-gen endpoint added');
