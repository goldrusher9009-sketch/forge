/**
 * Forge Platform v6.80 — PRODUCTION
 * Vanilla JavaScript, zero build step, dynamic LLM routing
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

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'forge-dev-secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://forge-sand-two.vercel.app';

// In-memory store
const store = {
  users: new Map(),
  apiKeys: new Map(),
  threads: new Map(),
  messages: new Map(),
};

// Decrypt helper
function decrypt(encrypted, secret) {
  const decipher = crypto.createDecipher('aes-256-cbc', secret);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Encrypt helper
function encrypt(text, secret) {
  const cipher = crypto.createCipher('aes-256-cbc', secret);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Auth middleware
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { sub: decoded.sub };
    next();
  } catch (e) {
    res.status(401).json({ error: 'INVALID_TOKEN' });
  }
};

const app = express();
app.use(helmet());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(morgan('tiny'));
app.use(express.json());
app.use(cookieParser());

// ===== HEALTH =====
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', version: 'v6.80', timestamp: new Date().toISOString() }));

// ===== AUTH =====
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'EMAIL_PASSWORD_REQUIRED' });
  if (store.users.has(email)) return res.status(409).json({ error: 'USER_EXISTS' });

  const userId = uuidv4();
  const hashedPwd = await bcrypt.hash(password, 10);
  store.users.set(email, {
    id: userId,
    email,
    password: hashedPwd,
    created_at: new Date().toISOString(),
  });

  const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({
    success: true,
    access_token: token,
    user: { id: userId, email },
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = Array.from(store.users.values()).find((u) => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  }

  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, access_token: token, user: { id: user.id, email } });
});

app.get('/api/profile', requireAuth, (req, res) => {
  const user = Array.from(store.users.values()).find((u) => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json({ success: true, data: user });
});

// ===== API KEYS =====
app.post('/api/keys', requireAuth, (req, res) => {
  const { provider, key, model } = req.body;
  if (!provider || !key) return res.status(400).json({ error: 'PROVIDER_KEY_REQUIRED' });

  const keyId = uuidv4();
  const encrypted = encrypt(key, 'forge-key-secret');
  const preview = key.slice(0, 4) + '...' + key.slice(-4);

  store.apiKeys.set(keyId, {
    id: keyId,
    user_id: req.user.sub,
    provider,
    key: encrypted,
    model: model || null,
    preview,
    created_at: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    data: { id: keyId, provider, model, preview },
  });
});

app.get('/api/keys', requireAuth, (req, res) => {
  const keys = Array.from(store.apiKeys.values()).filter((k) => k.user_id === req.user.sub);
  const providers = new Set(keys.map((k) => k.provider));

  res.json({
    success: true,
    has_anthropic: providers.has('anthropic'),
    has_openai: providers.has('openai'),
    has_gemini: providers.has('gemini'),
    has_groq: providers.has('groq'),
    has_mistral: providers.has('mistral'),
    has_openrouter: providers.has('openrouter'),
    keys: keys.map((k) => ({ id: k.id, provider: k.provider, model: k.model, preview: k.preview })),
  });
});

// ===== THREADS =====
app.post('/api/threads', requireAuth, (req, res) => {
  const { title } = req.body;
  const threadId = uuidv4();
  store.threads.set(threadId, {
    id: threadId,
    user_id: req.user.sub,
    title: title || 'New Chat',
    created_at: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    data: { id: threadId, title: title || 'New Chat' },
  });
});

app.get('/api/threads', requireAuth, (req, res) => {
  const threads = Array.from(store.threads.values()).filter((t) => t.user_id === req.user.sub);
  res.json({ success: true, data: threads });
});

app.get('/api/threads/:id', requireAuth, (req, res) => {
  const thread = store.threads.get(req.params.id);
  if (!thread || thread.user_id !== req.user.sub) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json({ success: true, data: thread });
});

// ===== MESSAGES & LLM ROUTING =====
app.post('/api/threads/:id/chat', requireAuth, async (req, res) => {
  const { message, provider, model } = req.body;
  const threadId = req.params.id;

  const thread = store.threads.get(threadId);
  if (!thread || thread.user_id !== req.user.sub) return res.status(404).json({ error: 'NOT_FOUND' });

  // Save user message
  const msgId = uuidv4();
  store.messages.set(msgId, {
    id: msgId,
    thread_id: threadId,
    role: 'user',
    content: message,
    created_at: new Date().toISOString(),
  });

  // Get user's API key for selected provider
  const keyRecord = Array.from(store.apiKeys.values()).find(
    (k) => k.user_id === req.user.sub && k.provider === provider
  );

  if (!keyRecord) {
    const assistantMsgId = uuidv4();
    const errMsg = `[No API key configured for ${provider}]`;
    store.messages.set(assistantMsgId, {
      id: assistantMsgId,
      thread_id: threadId,
      role: 'assistant',
      content: errMsg,
      created_at: new Date().toISOString(),
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.write(`data: ${JSON.stringify({ type: 'message', content: errMsg })}\n\n`);
    return res.end();
  }

  const apiKey = decrypt(keyRecord.key, 'forge-key-secret');
  let response = '';

  // Route to selected LLM provider
  try {
    if (provider === 'anthropic') {
      const res1 = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{ role: 'user', content: message }],
        }),
      });
      const data = await res1.json();
      response = data.content?.[0]?.text || '[No response from Anthropic]';
    } else if (provider === 'openai') {
      const res1 = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          max_tokens: 1024,
          messages: [{ role: 'user', content: message }],
        }),
      });
      const data = await res1.json();
      response = data.choices?.[0]?.message?.content || '[No response from OpenAI]';
    } else if (provider === 'gemini') {
      const res1 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
        }),
      });
      const data = await res1.json();
      response = data.candidates?.[0]?.content?.parts?.[0]?.text || '[No response from Gemini]';
    } else if (provider === 'groq') {
      const res1 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'mixtral-8x7b-32768',
          max_tokens: 1024,
          messages: [{ role: 'user', content: message }],
        }),
      });
      const data = await res1.json();
      response = data.choices?.[0]?.message?.content || '[No response from Groq]';
    } else if (provider === 'mistral') {
      const res1 = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'mistral-large-latest',
          max_tokens: 1024,
          messages: [{ role: 'user', content: message }],
        }),
      });
      const data = await res1.json();
      response = data.choices?.[0]?.message?.content || '[No response from Mistral]';
    } else if (provider === 'openrouter') {
      const res1 = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'content-type': 'application/json',
          'HTTP-Referer': FRONTEND_URL,
        },
        body: JSON.stringify({
          model: model || 'openai/gpt-4-turbo',
          max_tokens: 1024,
          messages: [{ role: 'user', content: message }],
        }),
      });
      const data = await res1.json();
      response = data.choices?.[0]?.message?.content || '[No response from OpenRouter]';
    } else {
      response = `[Unknown provider: ${provider}]`;
    }
  } catch (e) {
    response = `[LLM Error: ${e.message}]`;
  }

  // Save assistant message
  const assistantMsgId = uuidv4();
  store.messages.set(assistantMsgId, {
    id: assistantMsgId,
    thread_id: threadId,
    role: 'assistant',
    content: response,
    created_at: new Date().toISOString(),
  });

  // Stream response
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.write(`data: ${JSON.stringify({ type: 'message', content: response })}\n\n`);
  res.end();
});

app.get('/api/threads/:id/messages', requireAuth, (req, res) => {
  const thread = store.threads.get(req.params.id);
  if (!thread || thread.user_id !== req.user.sub) return res.status(404).json({ error: 'NOT_FOUND' });

  const messages = Array.from(store.messages.values()).filter((m) => m.thread_id === req.params.id);
  res.json({ success: true, data: messages });
});

// ===== READINESS =====
app.get('/api/launch/readiness', (req, res) => {
  res.json({
    status: 'ok',
    version: 'v6.80',
    features: ['auth', 'threads', 'dynamic_llm_routing', 'api_keys'],
    supported_providers: ['anthropic', 'openai', 'gemini', 'groq', 'mistral', 'openrouter'],
    backend: 'live',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Forge v6.80 LIVE on port ${PORT}`);
  console.log(`📍 Frontend: ${FRONTEND_URL}`);
  console.log(`✅ Dynamic LLM Routing: Anthropic | OpenAI | Gemini | Groq | Mistral | OpenRouter`);
});
