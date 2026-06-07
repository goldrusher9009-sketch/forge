/**
 * Forge Platform v6.82 — PRODUCTION
 * Vanilla JS, SQLite, JWT, GraphQL, Socket.IO, Webhooks, Rate-limiting, Multi-model
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const http = require('http');

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'forge-dev-secret-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://forge-sand-two.vercel.app';
const NODE_ENV = process.env.NODE_ENV || 'production';

// ── SQLite DB ─────────────────────────────────────────────────────────────────
let db;
try {
  const Database = require('better-sqlite3');
  const DB_PATH = process.env.RAILWAY_ENVIRONMENT ? '/data/forge.db' : path.join(__dirname, 'forge.db');
  if (process.env.RAILWAY_ENVIRONMENT) { try { fs.mkdirSync('/data', { recursive: true }); } catch {} }
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  console.log('✅ SQLite connected at', DB_PATH);
} catch(e) {
  console.error('❌ SQLite failed:', e.message);
  process.exit(1);
}

// ── Schema ────────────────────────────────────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT DEFAULT 'user', created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS api_keys (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, provider TEXT NOT NULL, encrypted_key TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS platform_api_keys (id TEXT PRIMARY KEY, provider TEXT NOT NULL UNIQUE, encrypted_key TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS threads (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT DEFAULT 'New conversation', pinned INTEGER DEFAULT 0, archived INTEGER DEFAULT 0, project_id TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, thread_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, model TEXT, tokens_in INTEGER DEFAULT 0, tokens_out INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS usage_logs (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, model TEXT, provider TEXT, tokens_in INTEGER DEFAULT 0, tokens_out INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS forge_memory (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, topic TEXT NOT NULL, insight TEXT NOT NULL, source_thread_id TEXT, frequency INTEGER DEFAULT 1, strength REAL DEFAULT 1.0, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS superagent_messages (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS subscriptions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, plan TEXT DEFAULT 'free', tokens_used INTEGER DEFAULT 0, tokens_limit INTEGER DEFAULT 1000000, status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS webhooks (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, url TEXT NOT NULL, events TEXT DEFAULT '[]', secret TEXT, enabled INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')), last_delivery TEXT, last_status INTEGER, delivery_count INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS personas (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, system_prompt TEXT NOT NULL, model TEXT, temperature REAL DEFAULT 0.7, icon TEXT DEFAULT '🤖', created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS prompt_cache (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, category TEXT DEFAULT 'general', use_count INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS platform_models (id TEXT PRIMARY KEY, provider TEXT, name TEXT, enabled INTEGER DEFAULT 1, markup_pct REAL DEFAULT 0);
CREATE TABLE IF NOT EXISTS scheduled_tasks (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT, prompt TEXT, cron TEXT, enabled INTEGER DEFAULT 1, last_run TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS user_files (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, thread_id TEXT, name TEXT, type TEXT, size INTEGER, content TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS artifacts (id TEXT PRIMARY KEY, thread_id TEXT, user_id TEXT, title TEXT, type TEXT, content TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS thread_memories (id TEXT PRIMARY KEY, user_id TEXT, thread_id TEXT, topic TEXT, insight TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS dispatch_runs (id TEXT PRIMARY KEY, user_id TEXT, project_id TEXT, prompt TEXT, agent_ids TEXT, status TEXT DEFAULT 'pending', output TEXT, error TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
`);

// Seed default models
const modelCount = db.prepare('SELECT COUNT(*) as c FROM platform_models').get().c;
if (modelCount === 0) {
  const models = [
    { id:'claude-opus-4-6', provider:'anthropic', name:'Claude Opus 4.6' },
    { id:'claude-sonnet-4-6', provider:'anthropic', name:'Claude Sonnet 4.6' },
    { id:'gpt-4o', provider:'openai', name:'GPT-4o' },
    { id:'gpt-4o-mini', provider:'openai', name:'GPT-4o Mini' },
    { id:'gemini-2.5-pro', provider:'gemini', name:'Gemini 2.5 Pro' },
    { id:'gemini-2.5-flash', provider:'gemini', name:'Gemini 2.5 Flash' },
    { id:'llama-3.3-70b-versatile', provider:'groq', name:'Llama 3.3 70B' },
    { id:'deepseek/deepseek-r1', provider:'openrouter', name:'DeepSeek R1' },
  ];
  for (const m of models) db.prepare('INSERT OR IGNORE INTO platform_models (id,provider,name) VALUES (?,?,?)').run(m.id, m.provider, m.name);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const encrypt = (text, secret) => { const c = crypto.createCipher('aes-256-cbc', secret); return c.update(text,'utf8','hex') + c.final('hex'); };
const decrypt = (enc, secret) => { try { const d = crypto.createDecipher('aes-256-cbc', secret); return d.update(enc,'hex','utf8') + d.final('utf8'); } catch { return ''; } };

const getUserKey = (userId, provider) => {
  const row = db.prepare('SELECT encrypted_key FROM api_keys WHERE user_id=? AND provider=?').get(userId, provider);
  if (row) return decrypt(row.encrypted_key, JWT_SECRET);
  const platform = db.prepare('SELECT encrypted_key FROM platform_api_keys WHERE provider=?').get(provider);
  if (platform) return decrypt(platform.encrypted_key, JWT_SECRET);
  return process.env[`${provider.toUpperCase()}_API_KEY`] || null;
};

// ── App ───────────────────────────────────────────────────────────────────────
const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: [FRONTEND_URL, 'http://localhost:3001', 'http://localhost:3000'], credentials: true }));
app.use(morgan('tiny'));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// ── Auth middleware ───────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ error: 'AUTHENTICATION_REQUIRED' }); return; }
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'INVALID_TOKEN' }); }
};

// ── Rate limiting ─────────────────────────────────────────────────────────────
const rateMap = new Map();
const rateLimit = (max, windowMs) => (req, res, next) => {
  const key = req.user?.sub || req.ip;
  const now = Date.now();
  const e = rateMap.get(key);
  if (!e || now > e.reset) { rateMap.set(key, { count: 1, reset: now + windowMs }); return next(); }
  if (e.count >= max) { return res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED', retryAfter: Math.ceil((e.reset - now)/1000) }); }
  e.count++; next();
};

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', version: 'v6.82', env: NODE_ENV, time: new Date().toISOString() }));
app.get('/api/health', (_, res) => res.json({ success: true, status: 'ok', version: 'v6.82', env: NODE_ENV, time: new Date().toISOString() }));
app.get('/api/version', (_, res) => res.json({ version: 'v6.82', features: ['sqlite','jwt','graphql','webhooks','rate-limiting','multi-model','personas','prompt-cache','search','analytics','forge-optimizer','superagent','harvest','billing','export','socket.io'], built: new Date().toISOString() }));

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) { res.status(400).json({ error: 'EMAIL_PASSWORD_REQUIRED' }); return; }
    if (db.prepare('SELECT id FROM users WHERE email=?').get(email)) { res.status(409).json({ error: 'USER_EXISTS' }); return; }
    const id = uuidv4();
    db.prepare('INSERT INTO users (id,email,password) VALUES (?,?,?)').run(id, email.toLowerCase(), await bcrypt.hash(password, 10));
    db.prepare('INSERT INTO subscriptions (id,user_id) VALUES (?,?)').run(uuidv4(), id);
    const token = jwt.sign({ sub: id, email }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ success: true, access_token: token, user: { id, email, role: 'user' } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(email?.toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.password))) { res.status(401).json({ error: 'INVALID_CREDENTIALS' }); return; }
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, access_token: token, user: { id: user.id, email: user.email, role: user.role || 'user' } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/profile', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id,email,role,created_at FROM users WHERE id=?').get(req.user.sub);
  if (!user) { res.status(404).json({ error: 'USER_NOT_FOUND' }); return; }
  res.json({ success: true, user });
});

// ── API Keys ──────────────────────────────────────────────────────────────────
app.post('/api/keys', requireAuth, (req, res) => {
  const { provider, key } = req.body;
  if (!provider || !key) { res.status(400).json({ error: 'provider and key required' }); return; }
  const enc = encrypt(key, JWT_SECRET);
  const existing = db.prepare('SELECT id FROM api_keys WHERE user_id=? AND provider=?').get(req.user.sub, provider);
  if (existing) db.prepare('UPDATE api_keys SET encrypted_key=? WHERE id=?').run(enc, existing.id);
  else db.prepare('INSERT INTO api_keys (id,user_id,provider,encrypted_key) VALUES (?,?,?,?)').run(uuidv4(), req.user.sub, provider, enc);
  res.json({ success: true });
});

app.get('/api/keys', requireAuth, (req, res) => {
  const keys = db.prepare('SELECT provider,created_at FROM api_keys WHERE user_id=?').all(req.user.sub);
  const platform = db.prepare('SELECT provider FROM platform_api_keys').all();
  const result = {};
  for (const k of keys) result[`has_${k.provider}`] = true;
  for (const k of platform) result[`has_${k.provider}`] = result[`has_${k.provider}`] || true;
  res.json({ success: true, ...result });
});

app.delete('/api/keys/:provider', requireAuth, (req, res) => {
  db.prepare('DELETE FROM api_keys WHERE user_id=? AND provider=?').run(req.user.sub, req.params.provider);
  res.json({ success: true });
});

// ── Threads ───────────────────────────────────────────────────────────────────
app.get('/api/threads', requireAuth, (req, res) => {
  const threads = db.prepare('SELECT t.*,(SELECT SUM(tokens_in+tokens_out) FROM messages WHERE thread_id=t.id) as total_tokens FROM threads WHERE user_id=? AND archived=0 ORDER BY updated_at DESC LIMIT 200').all(req.user.sub);
  res.json({ success: true, data: threads });
});

app.post('/api/threads', requireAuth, (req, res) => {
  const { title, project_id } = req.body;
  const id = uuidv4();
  db.prepare("INSERT INTO threads (id,user_id,title,project_id) VALUES (?,?,?,?)").run(id, req.user.sub, title || 'New conversation', project_id || null);
  res.json({ success: true, data: db.prepare('SELECT * FROM threads WHERE id=?').get(id) });
});

app.get('/api/threads/:id', requireAuth, (req, res) => {
  const t = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(req.params.id, req.user.sub);
  if (!t) { res.status(404).json({ error: 'THREAD_NOT_FOUND' }); return; }
  res.json({ success: true, data: t });
});

app.patch('/api/threads/:id', requireAuth, (req, res) => {
  const { title, pinned, archived } = req.body;
  if (title !== undefined) db.prepare("UPDATE threads SET title=?,updated_at=datetime('now') WHERE id=? AND user_id=?").run(title, req.params.id, req.user.sub);
  if (pinned !== undefined) db.prepare('UPDATE threads SET pinned=? WHERE id=? AND user_id=?').run(pinned?1:0, req.params.id, req.user.sub);
  if (archived !== undefined) db.prepare('UPDATE threads SET archived=? WHERE id=? AND user_id=?').run(archived?1:0, req.params.id, req.user.sub);
  res.json({ success: true });
});

app.delete('/api/threads/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM messages WHERE thread_id=?').run(req.params.id);
  db.prepare('DELETE FROM threads WHERE id=? AND user_id=?').run(req.params.id, req.user.sub);
  res.json({ success: true });
});

// ── Messages ──────────────────────────────────────────────────────────────────
app.get('/api/threads/:id/messages', requireAuth, (req, res) => {
  const t = db.prepare('SELECT id FROM threads WHERE id=? AND user_id=?').get(req.params.id, req.user.sub);
  if (!t) { res.status(404).json({ error: 'THREAD_NOT_FOUND' }); return; }
  const messages = db.prepare('SELECT * FROM messages WHERE thread_id=? ORDER BY created_at ASC').all(req.params.id);
  res.json({ success: true, data: messages });
});

// ── LLM Call helper ───────────────────────────────────────────────────────────
async function callLLM(provider, model, messages, apiKey, stream, res, userId) {
  const systemMsg = { role: 'system', content: 'You are Forge AI, a powerful assistant. Be helpful, concise, and accurate.' };
  const allMessages = [systemMsg, ...messages];

  const sendSSE = (data) => { if (stream && !res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`); };

  let content = '';
  let tokensIn = 0, tokensOut = 0;

  try {
    if (provider === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model, messages: messages.map(m=>({role:m.role==='system'?'user':m.role,content:m.content})), max_tokens: 4096, stream: true })
      });
      const reader = r.body.getReader(); const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        const lines = dec.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const d = JSON.parse(line.slice(5));
            if (d.type === 'content_block_delta' && d.delta?.text) { content += d.delta.text; sendSSE({ type:'text', text:d.delta.text }); }
            if (d.type === 'message_delta' && d.usage) { tokensOut = d.usage.output_tokens || 0; }
            if (d.type === 'message_start' && d.message?.usage) { tokensIn = d.message.usage.input_tokens || 0; }
          } catch {}
        }
      }
    } else if (provider === 'openai' || provider === 'groq' || provider === 'mistral' || provider === 'openrouter') {
      const baseUrls = { openai:'https://api.openai.com/v1', groq:'https://api.groq.com/openai/v1', mistral:'https://api.mistral.ai/v1', openrouter:'https://openrouter.ai/api/v1' };
      const r = await fetch(`${baseUrls[provider]}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', ...(provider==='openrouter'?{'HTTP-Referer':'https://forge-sand-two.vercel.app'}:{}) },
        body: JSON.stringify({ model, messages: allMessages, stream: true, max_tokens: 4096 })
      });
      const reader = r.body.getReader(); const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        const lines = dec.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data:') || line.includes('[DONE]')) continue;
          try {
            const d = JSON.parse(line.slice(5));
            const text = d.choices?.[0]?.delta?.content || '';
            if (text) { content += text; sendSSE({ type:'text', text }); }
            if (d.usage) { tokensIn = d.usage.prompt_tokens||0; tokensOut = d.usage.completion_tokens||0; }
          } catch {}
        }
      }
    } else if (provider === 'gemini') {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: messages.map(m=>({ role: m.role==='assistant'?'model':'user', parts:[{text:m.content}] })) })
      });
      const text = await r.text();
      try {
        const lines = text.split('\n').filter(l => l.startsWith('data:'));
        for (const line of lines) {
          const d = JSON.parse(line.slice(5));
          const chunk = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (chunk) { content += chunk; sendSSE({ type:'text', text: chunk }); }
        }
      } catch { content = text.slice(0,2000); sendSSE({ type:'text', text: content }); }
    }
  } catch(e) {
    sendSSE({ type:'error', error: e.message });
  }

  return { content, tokensIn, tokensOut };
}

// ── Chat endpoint (SSE streaming) ─────────────────────────────────────────────
app.post('/api/threads/:id/messages', requireAuth, rateLimit(30, 60000), async (req, res) => {
  const { content, model: reqModel, provider: reqProvider } = req.body;
  const threadId = req.params.id;
  const userId = req.user.sub;

  const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, userId);
  if (!thread) { res.status(404).json({ error: 'THREAD_NOT_FOUND' }); return; }
  if (!content?.trim()) { res.status(400).json({ error: 'content required' }); return; }

  // Save user message
  const userMsgId = uuidv4();
  db.prepare('INSERT INTO messages (id,thread_id,role,content) VALUES (?,?,?,?)').run(userMsgId, threadId, 'user', content.trim());
  db.prepare("UPDATE threads SET updated_at=datetime('now'),title=CASE WHEN title='New conversation' THEN ? ELSE title END WHERE id=?").run(content.slice(0,60), threadId);

  // Resolve model + provider
  let provider = reqProvider || 'anthropic';
  let model = reqModel || 'claude-sonnet-4-6';

  // Detect provider from model string
  if (model.includes('claude')) provider = 'anthropic';
  else if (model.includes('gpt') || model.includes('o1') || model.includes('o3')) provider = 'openai';
  else if (model.includes('gemini')) provider = 'gemini';
  else if (model.includes('llama') || model.includes('mixtral')) provider = 'groq';
  else if (model.includes('/')) provider = 'openrouter';

  const apiKey = getUserKey(userId, provider);
  if (!apiKey) {
    res.status(402).json({ error: 'NO_API_KEY', message: `No API key for ${provider}. Add one in Settings.` });
    return;
  }

  // Load history
  const history = db.prepare('SELECT role,content FROM messages WHERE thread_id=? ORDER BY created_at ASC LIMIT 50').all(threadId);

  // SSE setup
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const { content: assistantContent, tokensIn, tokensOut } = await callLLM(provider, model, history, apiKey, true, res, userId);

  // Save assistant message
  const asMsgId = uuidv4();
  db.prepare('INSERT INTO messages (id,thread_id,role,content,model,tokens_in,tokens_out) VALUES (?,?,?,?,?,?,?)').run(asMsgId, threadId, 'assistant', assistantContent || '[No response]', model, tokensIn, tokensOut);
  db.prepare('INSERT INTO usage_logs (id,user_id,model,provider,tokens_in,tokens_out) VALUES (?,?,?,?,?,?)').run(uuidv4(), userId, model, provider, tokensIn, tokensOut);

  res.write(`data: ${JSON.stringify({ type:'result', messageId: asMsgId, usage: { tokensIn, tokensOut } })}\n\n`);
  res.end();
});

// ── SuperAgent ────────────────────────────────────────────────────────────────
app.post('/api/superagent/harvest', requireAuth, async (req, res) => {
  req.socket?.setTimeout(120000);
  const userId = req.user.sub;
  let harvested = 0; const sources = [];
  const upsert = (topic, insight, threadId, boost=1.0) => {
    if (!topic?.trim() || !insight?.trim()) return;
    const t = topic.trim().slice(0,120); const ins = insight.trim().slice(0,800);
    const ex = db.prepare('SELECT id FROM forge_memory WHERE user_id=? AND topic=?').get(userId, t);
    if (ex) db.prepare("UPDATE forge_memory SET frequency=frequency+1,strength=MIN(strength+?,10.0),insight=?,updated_at=datetime('now') WHERE id=?").run(boost*0.2, ins, ex.id);
    else { db.prepare('INSERT INTO forge_memory (id,user_id,topic,insight,source_thread_id,frequency,strength) VALUES (?,?,?,?,?,1,?)').run(uuidv4(), userId, t, ins, threadId||null, boost); harvested++; }
  };
  const threadMems = db.prepare('SELECT topic,insight,thread_id FROM thread_memories WHERE user_id=? ORDER BY created_at DESC LIMIT 1000').all(userId);
  for (const m of threadMems) upsert(m.topic, m.insight, m.thread_id, 2.0);
  if (threadMems.length) sources.push(`${threadMems.length} thread memories`);
  const allThreads = db.prepare('SELECT id,title FROM threads WHERE user_id=? ORDER BY updated_at DESC').all(userId);
  let msgH = 0;
  for (const t of allThreads) {
    const msgs = db.prepare('SELECT role,content FROM messages WHERE thread_id=? ORDER BY created_at ASC').all(t.id);
    for (let i=0; i<msgs.length-1; i++) {
      const u=msgs[i], a=msgs[i+1];
      if (u?.role==='user' && a?.role==='assistant' && u.content?.trim() && a.content?.trim()) { upsert(`[${t.title||'Chat'}] ${u.content.slice(0,80)}`, a.content.slice(0,800), t.id, 1.5); msgH++; }
    }
  }
  if (msgH) sources.push(`${msgH} message pairs`);
  const newMemCount = db.prepare('SELECT COUNT(*) as c FROM forge_memory WHERE user_id=?').get(userId).c;
  const intelligenceScore = Math.min(9999999, Math.floor(Math.pow(newMemCount,1.4)*10 + threadMems.length*8));
  res.json({ success:true, data:{ harvested, totalMemory:newMemCount, intelligenceScore, sources, message:`🧠 Harvested ${harvested} new memories. IQ: ${intelligenceScore.toLocaleString()}` }});
});

app.get('/api/superagent/memory', requireAuth, (req, res) => {
  const mems = db.prepare('SELECT * FROM forge_memory WHERE user_id=? ORDER BY strength DESC,frequency DESC LIMIT 100').all(req.user.sub);
  res.json({ success:true, data: mems });
});

app.get('/api/superagent/stats', requireAuth, (req, res) => {
  const memCount = db.prepare('SELECT COUNT(*) as c FROM forge_memory WHERE user_id=?').get(req.user.sub).c;
  const avgStrength = db.prepare('SELECT AVG(strength) as s FROM forge_memory WHERE user_id=?').get(req.user.sub)?.s || 1;
  const intelligenceScore = Math.min(9999999, Math.floor(Math.pow(memCount,1.4)*10 + avgStrength*100));
  res.json({ success:true, data:{ memoryCount:memCount, intelligenceScore, avgStrength } });
});

app.post('/api/superagent/chat', requireAuth, async (req, res) => {
  const { message, model='claude-sonnet-4-6' } = req.body;
  if (!message?.trim()) { res.status(400).json({ error:'message required' }); return; }
  const userId = req.user.sub;
  const memories = db.prepare('SELECT topic,insight FROM forge_memory WHERE user_id=? ORDER BY strength DESC,frequency DESC LIMIT 20').all(userId);
  const memContext = memories.length ? `\n\nUser memories:\n${memories.map(m=>`- ${m.topic}: ${m.insight}`).join('\n')}` : '';
  const history = db.prepare('SELECT role,content FROM superagent_messages WHERE user_id=? ORDER BY created_at DESC LIMIT 10').all(userId).reverse();
  db.prepare('INSERT INTO superagent_messages (id,user_id,role,content) VALUES (?,?,?,?)').run(uuidv4(), userId, 'user', message.trim());

  let provider = 'anthropic';
  if (model.includes('gpt')||model.includes('o3')) provider = 'openai';
  else if (model.includes('gemini')) provider = 'gemini';
  else if (model.includes('llama')||model.includes('mixtral')) provider = 'groq';
  else if (model.includes('/')) provider = 'openrouter';

  const apiKey = getUserKey(userId, provider);
  if (!apiKey) { res.status(402).json({ error:'NO_API_KEY' }); return; }

  const messages = [...history, { role:'user', content: message.trim() + memContext }];
  const { content } = await callLLM(provider, model, messages, apiKey, false, res, userId);
  db.prepare('INSERT INTO superagent_messages (id,user_id,role,content) VALUES (?,?,?,?)').run(uuidv4(), userId, 'assistant', content || 'No response');
  res.json({ success:true, data:{ message: content, model } });
});

app.get('/api/superagent/history', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT role,content,created_at FROM superagent_messages WHERE user_id=? ORDER BY created_at ASC LIMIT 100').all(req.user.sub);
  res.json({ success:true, data: rows });
});

// ── ForgeOptimizer ────────────────────────────────────────────────────────────
app.get('/api/forge-optimizer/:threadId/analyze', requireAuth, (req, res) => {
  const { threadId } = req.params; const userId = req.user.sub;
  try {
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, userId);
    if (!thread) { res.status(404).json({ error:'Thread not found' }); return; }
    const messages = db.prepare('SELECT role,content,tokens_in,tokens_out FROM messages WHERE thread_id=? ORDER BY created_at ASC').all(threadId);
    const totalTokens = messages.reduce((s,m) => s+(m.tokens_in||0)+(m.tokens_out||0), 0);
    const suggestions = []; let potentialSavings = 0;
    if (messages.length > 20) { const sv=Math.floor(totalTokens*0.25); suggestions.push({ type:'context', title:'Trim old context', description:`${messages.length} messages — summarize older ones.`, tokenSavings:sv, auto:true }); potentialSavings+=sv; }
    const bigMsgs = messages.filter(m=>m.role==='assistant'&&(m.content?.length||0)>4000);
    if (bigMsgs.length>2) { const sv=bigMsgs.length*800; suggestions.push({ type:'truncate', title:'Summarize long responses', description:`${bigMsgs.length} long responses.`, tokenSavings:sv, auto:false }); potentialSavings+=sv; }
    if (!suggestions.length) suggestions.push({ type:'healthy', title:'Thread optimized', description:'No major savings found.', tokenSavings:0, auto:false });
    const savingsPct = totalTokens>0?Math.min(95,Math.floor(potentialSavings/Math.max(totalTokens,1)*100)):0;
    res.json({ success:true, data:{ totalTokens, potentialSavings, savingsPct, estimatedCost:((totalTokens/1000)*0.003).toFixed(4), savedCost:((potentialSavings/1000)*0.003).toFixed(4), suggestions, autoApplyCount:suggestions.filter(s=>s.auto).length }});
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.post('/api/forge-optimizer/:threadId/apply', requireAuth, (req, res) => {
  const { threadId } = req.params; const userId = req.user.sub;
  try {
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, userId);
    if (!thread) { res.status(404).json({ error:'Thread not found' }); return; }
    const messages = db.prepare('SELECT id,role,content FROM messages WHERE thread_id=? ORDER BY created_at ASC').all(threadId);
    if (messages.length > 12) {
      const toSummarize = messages.slice(0, messages.length-10);
      const summary = `[Optimized: ${toSummarize.length} earlier messages summarized.]`;
      db.prepare(`DELETE FROM messages WHERE id IN (${toSummarize.map(()=>'?').join(',')})`).run(...toSummarize.map(m=>m.id));
      db.prepare('INSERT INTO messages (id,thread_id,role,content,created_at) VALUES (?,?,?,?,datetime("now","-1 second"))').run(uuidv4(), threadId, 'system', summary);
    }
    res.json({ success:true, message:'Optimization applied' });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── Models ────────────────────────────────────────────────────────────────────
app.get('/api/models', requireAuth, (req, res) => {
  const models = db.prepare("SELECT * FROM platform_models WHERE enabled=1 ORDER BY provider,name").all();
  res.json({ success:true, data: models });
});

app.get('/api/models/available', requireAuth, (req, res) => {
  const keys = db.prepare('SELECT provider FROM api_keys WHERE user_id=?').all(req.user.sub);
  const plat = db.prepare('SELECT provider FROM platform_api_keys').all();
  const has = p => keys.some(k=>k.provider===p) || plat.some(k=>k.provider===p);
  const models = [];
  if (has('anthropic')) models.push({id:'claude-opus-4-6',name:'Claude Opus 4.6',provider:'anthropic'},{id:'claude-sonnet-4-6',name:'Claude Sonnet 4.6',provider:'anthropic'});
  if (has('openai')) models.push({id:'gpt-4o',name:'GPT-4o',provider:'openai'},{id:'gpt-4o-mini',name:'GPT-4o Mini',provider:'openai'});
  if (has('gemini')) models.push({id:'gemini-2.5-pro',name:'Gemini 2.5 Pro',provider:'gemini'},{id:'gemini-2.5-flash',name:'Gemini 2.5 Flash',provider:'gemini'});
  if (has('groq')) models.push({id:'llama-3.3-70b-versatile',name:'Llama 3.3 70B',provider:'groq'});
  if (has('openrouter')) models.push({id:'deepseek/deepseek-r1',name:'DeepSeek R1',provider:'openrouter'},{id:'meta-llama/llama-4-maverick',name:'Llama 4 Maverick',provider:'openrouter'});
  res.json({ success:true, data:{ models, count:models.length }});
});

// ── Webhooks ──────────────────────────────────────────────────────────────────
app.get('/api/webhooks', requireAuth, (req, res) => { res.json({ success:true, data: db.prepare('SELECT id,url,events,enabled,created_at,last_delivery,last_status,delivery_count FROM webhooks WHERE user_id=?').all(req.user.sub) }); });
app.post('/api/webhooks', requireAuth, (req, res) => {
  const { url, events=['*'], secret } = req.body; if (!url) { res.status(400).json({ error:'url required' }); return; }
  const id=uuidv4(); db.prepare('INSERT INTO webhooks (id,user_id,url,events,secret) VALUES (?,?,?,?,?)').run(id, req.user.sub, url, JSON.stringify(events), secret||null);
  res.json({ success:true, data:{ id,url,events }});
});
app.delete('/api/webhooks/:id', requireAuth, (req, res) => { db.prepare('DELETE FROM webhooks WHERE id=? AND user_id=?').run(req.params.id, req.user.sub); res.json({ success:true }); });

// ── Personas ──────────────────────────────────────────────────────────────────
app.get('/api/personas', requireAuth, (req, res) => { res.json({ success:true, data: db.prepare('SELECT * FROM personas WHERE user_id=? ORDER BY created_at DESC').all(req.user.sub) }); });
app.post('/api/personas', requireAuth, (req, res) => {
  const { name, system_prompt, model, temperature=0.7, icon='🤖' } = req.body;
  if (!name||!system_prompt) { res.status(400).json({ error:'name and system_prompt required' }); return; }
  const id=uuidv4(); db.prepare('INSERT INTO personas (id,user_id,name,system_prompt,model,temperature,icon) VALUES (?,?,?,?,?,?,?)').run(id, req.user.sub, name, system_prompt, model||null, temperature, icon);
  res.json({ success:true, data:{ id,name,icon }});
});
app.delete('/api/personas/:id', requireAuth, (req, res) => { db.prepare('DELETE FROM personas WHERE id=? AND user_id=?').run(req.params.id, req.user.sub); res.json({ success:true }); });

// ── Prompt Cache ──────────────────────────────────────────────────────────────
app.get('/api/prompts', requireAuth, (req, res) => { res.json({ success:true, data: db.prepare('SELECT * FROM prompt_cache WHERE user_id=? ORDER BY use_count DESC').all(req.user.sub) }); });
app.post('/api/prompts', requireAuth, (req, res) => {
  const { title, content, category='general' } = req.body; if (!title||!content) { res.status(400).json({ error:'title and content required' }); return; }
  const id=uuidv4(); db.prepare('INSERT INTO prompt_cache (id,user_id,title,content,category) VALUES (?,?,?,?,?)').run(id, req.user.sub, title, content, category);
  res.json({ success:true, data:{ id,title,content }});
});

// ── Search ────────────────────────────────────────────────────────────────────
app.get('/api/search', requireAuth, (req, res) => {
  const { q, type='all', limit=20 } = req.query;
  if (!q||q.length<2) { res.status(400).json({ error:'query too short' }); return; }
  const uid=req.user.sub; const results=[];
  if (type==='all'||type==='threads') results.push(...db.prepare("SELECT id,'thread' as type,title as text,updated_at FROM threads WHERE user_id=? AND title LIKE ? LIMIT ?").all(uid,`%${q}%`,Math.floor(limit/2)));
  if (type==='all'||type==='messages') results.push(...db.prepare("SELECT m.id,'message' as type,SUBSTR(m.content,1,200) as text,m.thread_id FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=? AND m.content LIKE ? LIMIT ?").all(uid,`%${q}%`,Math.floor(limit/2)));
  if (type==='all'||type==='memory') results.push(...db.prepare("SELECT id,'memory' as type,topic||': '||SUBSTR(insight,1,150) as text,null as thread_id FROM forge_memory WHERE user_id=? AND (topic LIKE ? OR insight LIKE ?) LIMIT ?").all(uid,`%${q}%`,`%${q}%`,Math.floor(limit/3)));
  res.json({ success:true, data:{ results, count:results.length, query:q }});
});

// ── Analytics ─────────────────────────────────────────────────────────────────
app.get('/api/analytics', requireAuth, (req, res) => {
  const uid=req.user.sub; const { period='30d' } = req.query;
  const days = period==='7d'?7:period==='90d'?90:30;
  try {
    const totalThreads = db.prepare('SELECT COUNT(*) as c FROM threads WHERE user_id=?').get(uid).c;
    const totalMessages = db.prepare('SELECT COUNT(*) as c FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=?').get(uid).c;
    const totalTokens = db.prepare('SELECT COALESCE(SUM(tokens_in+tokens_out),0) as t FROM usage_logs WHERE user_id=?').get(uid)?.t||0;
    const memCount = db.prepare('SELECT COUNT(*) as c FROM forge_memory WHERE user_id=?').get(uid).c;
    const topModels = db.prepare('SELECT model,COUNT(*) as requests,SUM(tokens_in+tokens_out) as tokens FROM usage_logs WHERE user_id=? GROUP BY model ORDER BY requests DESC LIMIT 5').all(uid);
    res.json({ success:true, data:{ totalThreads, totalMessages, totalTokens, memCount, topModels, period }});
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── Export ────────────────────────────────────────────────────────────────────
app.get('/api/export', requireAuth, (req, res) => {
  const uid=req.user.sub;
  const threads=db.prepare('SELECT * FROM threads WHERE user_id=?').all(uid);
  const messages=db.prepare('SELECT m.* FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=?').all(uid);
  const memories=db.prepare('SELECT * FROM forge_memory WHERE user_id=?').all(uid);
  res.setHeader('Content-Disposition','attachment; filename="forge-export.json"');
  res.json({ exported_at:new Date().toISOString(), threads, messages, memories });
});

// ── Files ─────────────────────────────────────────────────────────────────────
app.get('/api/userfiles', requireAuth, (req, res) => {
  const { thread_id } = req.query;
  const files = thread_id
    ? db.prepare('SELECT id,name,type,size,created_at FROM user_files WHERE user_id=? AND thread_id=? ORDER BY created_at DESC').all(req.user.sub, thread_id)
    : db.prepare('SELECT id,name,type,size,created_at FROM user_files WHERE user_id=? ORDER BY created_at DESC').all(req.user.sub);
  res.json({ success:true, data: files });
});

// ── Billing ───────────────────────────────────────────────────────────────────
app.get('/api/billing/subscription', requireAuth, (req, res) => {
  const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id=?').get(req.user.sub);
  res.json({ success:true, data: sub || { plan:'free', tokens_used:0, tokens_limit:1000000, status:'active' }});
});

// ── Admin ─────────────────────────────────────────────────────────────────────
const requireAdmin = (req, res, next) => {
  const user = db.prepare('SELECT role FROM users WHERE id=?').get(req.user?.sub);
  if (user?.role !== 'admin') { res.status(403).json({ error:'FORBIDDEN' }); return; }
  next();
};
app.get('/api/adm/stats', requireAuth, requireAdmin, (req, res) => {
  const users=db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const threads=db.prepare('SELECT COUNT(*) as c FROM threads').get().c;
  const messages=db.prepare('SELECT COUNT(*) as c FROM messages').get().c;
  const tokens=db.prepare('SELECT COALESCE(SUM(tokens_in+tokens_out),0) as t FROM usage_logs').get().t||0;
  res.json({ success:true, data:{ users, threads, messages, tokens }});
});
app.get('/api/adm/users', requireAuth, requireAdmin, (req, res) => {
  res.json({ success:true, data: db.prepare('SELECT id,email,role,created_at FROM users ORDER BY created_at DESC').all() });
});
app.get('/api/adm/keys', requireAuth, requireAdmin, (req, res) => {
  res.json({ success:true, data: db.prepare('SELECT provider,updated_at FROM platform_api_keys').all() });
});
app.post('/api/adm/keys', requireAuth, requireAdmin, (req, res) => {
  const { provider, key } = req.body;
  const enc=encrypt(key, JWT_SECRET);
  const ex=db.prepare('SELECT id FROM platform_api_keys WHERE provider=?').get(provider);
  if (ex) db.prepare("UPDATE platform_api_keys SET encrypted_key=?,updated_at=datetime('now') WHERE provider=?").run(enc,provider);
  else db.prepare('INSERT INTO platform_api_keys (id,provider,encrypted_key) VALUES (?,?,?)').run(uuidv4(),provider,enc);
  res.json({ success:true });
});
app.get('/api/adm/models', requireAuth, requireAdmin, (req, res) => { res.json({ success:true, data: db.prepare('SELECT * FROM platform_models').all() }); });
app.patch('/api/adm/users/:id/role', requireAuth, requireAdmin, (req, res) => {
  db.prepare('UPDATE users SET role=? WHERE id=?').run(req.body.role, req.params.id);
  res.json({ success:true });
});

// ── Projects ──────────────────────────────────────────────────────────────────
app.get('/api/projects', requireAuth, (req, res) => { res.json({ success:true, data: db.prepare('SELECT * FROM projects WHERE user_id=? ORDER BY created_at DESC').all(req.user.sub) }); });
app.post('/api/projects', requireAuth, (req, res) => {
  const { name, description } = req.body; if (!name) { res.status(400).json({ error:'name required' }); return; }
  const id=uuidv4(); db.prepare('INSERT INTO projects (id,user_id,name,description) VALUES (?,?,?,?)').run(id, req.user.sub, name, description||null);
  res.json({ success:true, data:{ id,name }});
});

// ── GraphQL ───────────────────────────────────────────────────────────────────
try {
  const { buildSchema, graphql: gql } = require('graphql');
  const schema = buildSchema(`
    type Thread { id: ID!, title: String, created_at: String, updated_at: String }
    type Message { id: ID!, thread_id: ID!, role: String!, content: String!, created_at: String }
    type Memory { id: ID!, topic: String!, insight: String!, strength: Float, frequency: Int }
    type User { id: ID!, email: String!, role: String }
    type Analytics { totalThreads: Int, totalMessages: Int, totalTokens: Int, memCount: Int }
    type Query {
      threads(limit: Int): [Thread]
      thread(id: ID!): Thread
      messages(thread_id: ID!, limit: Int): [Message]
      memories(limit: Int): [Memory]
      me: User
      analytics: Analytics
    }
    type Mutation {
      createThread(title: String): Thread
      deleteThread(id: ID!): Boolean
      createMemory(topic: String!, insight: String!): Memory
    }
  `);
  const makeRoot = uid => ({
    threads: ({ limit=50 }) => db.prepare('SELECT * FROM threads WHERE user_id=? ORDER BY updated_at DESC LIMIT ?').all(uid,limit),
    thread: ({ id }) => db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(id,uid),
    messages: ({ thread_id, limit=100 }) => db.prepare('SELECT * FROM messages WHERE thread_id=? ORDER BY created_at ASC LIMIT ?').all(thread_id,limit),
    memories: ({ limit=50 }) => db.prepare('SELECT * FROM forge_memory WHERE user_id=? ORDER BY strength DESC LIMIT ?').all(uid,limit),
    me: () => db.prepare('SELECT id,email,role FROM users WHERE id=?').get(uid),
    analytics: () => ({
      totalThreads: db.prepare('SELECT COUNT(*) as c FROM threads WHERE user_id=?').get(uid).c,
      totalMessages: db.prepare('SELECT COUNT(*) as c FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=?').get(uid).c,
      totalTokens: db.prepare('SELECT COALESCE(SUM(tokens_in+tokens_out),0) as t FROM usage_logs WHERE user_id=?').get(uid)?.t||0,
      memCount: db.prepare('SELECT COUNT(*) as c FROM forge_memory WHERE user_id=?').get(uid).c,
    }),
    createThread: ({ title }) => { const id=uuidv4(); db.prepare("INSERT INTO threads (id,user_id,title) VALUES (?,?,?)").run(id,uid,title||'New conversation'); return db.prepare('SELECT * FROM threads WHERE id=?').get(id); },
    deleteThread: ({ id }) => { db.prepare('DELETE FROM threads WHERE id=? AND user_id=?').run(id,uid); return true; },
    createMemory: ({ topic, insight }) => { const id=uuidv4(); db.prepare('INSERT INTO forge_memory (id,user_id,topic,insight,frequency,strength) VALUES (?,?,?,?,1,1.0)').run(id,uid,topic,insight); return db.prepare('SELECT * FROM forge_memory WHERE id=?').get(id); },
  });
  app.post('/api/graphql', requireAuth, async (req, res) => {
    const { query, variables, operationName } = req.body;
    if (!query) { res.status(400).json({ error:'query required' }); return; }
    try { res.json(await gql({ schema, source:query, rootValue:makeRoot(req.user.sub), variableValues:variables, operationName })); }
    catch(e) { res.status(500).json({ errors:[{ message:e.message }] }); }
  });
  app.get('/api/graphql', (_, res) => res.json({ message:'Forge GraphQL API v6.82', endpoint:'POST /api/graphql' }));
  console.log('✅ GraphQL enabled');
} catch(e) {
  app.post('/api/graphql', (_, res) => res.status(503).json({ error:'graphql package not installed' }));
  console.warn('GraphQL not loaded:', e.message);
}

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const httpServer = http.createServer(app);
try {
  const { Server } = require('socket.io');
  const io = new Server(httpServer, { cors:{ origin:FRONTEND_URL, credentials:true }, transports:['websocket','polling'] });
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) { next(new Error('UNAUTHORIZED')); return; }
    try { const d = jwt.verify(token, JWT_SECRET); socket.userId = d.sub; next(); }
    catch { next(new Error('INVALID_TOKEN')); }
  });
  io.on('connection', socket => {
    socket.join(`user:${socket.userId}`);
    socket.on('join_thread', tid => { socket.join(`thread:${tid}`); });
    socket.on('leave_thread', tid => { socket.leave(`thread:${tid}`); });
    socket.on('typing_start', ({ threadId }) => { socket.to(`thread:${threadId}`).emit('typing', { userId:socket.userId, typing:true }); });
    socket.on('typing_stop', ({ threadId }) => { socket.to(`thread:${threadId}`).emit('typing', { userId:socket.userId, typing:false }); });
    socket.on('ping', () => socket.emit('pong', { time:Date.now() }));
  });
  app.io = io;
  console.log('✅ Socket.IO enabled');
} catch(e) { console.warn('Socket.IO not loaded:', e.message); }

// ── Start ─────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`🚀 Forge v6.82 on port ${PORT}`);
  console.log(`✅ SQLite + JWT + GraphQL + Socket.IO + Webhooks + Rate-limiting`);
});
