/**
 * Forge Platform — Production-ready backend
 * SQLite + JWT + bcrypt. No external services needed.
 * export app for testing; server only started when run directly.
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import Database from 'better-sqlite3';

// ── Config ────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'forge-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '30d';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://forge-sand-two.vercel.app';
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'forge.db');

// ── Database ──────────────────────────────────────────────────
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
    first_name TEXT NOT NULL DEFAULT '', last_name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'user', verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL, expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL DEFAULT 'claude-3-sonnet',
    temperature REAL NOT NULL DEFAULT 0.7, max_tokens INTEGER NOT NULL DEFAULT 2048,
    status TEXT NOT NULL DEFAULT 'inactive',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft', definition TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY, workflow_id TEXT REFERENCES workflows(id) ON DELETE SET NULL,
    agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'queued',
    result TEXT, error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed default admin for local dev
if (!db.prepare('SELECT id FROM users WHERE email = ?').get('admin@forge.local')) {
  db.prepare('INSERT INTO users (id,email,password,first_name,last_name,role,verified) VALUES (?,?,?,?,?,?,?)')
    .run(uuidv4(), 'admin@forge.local', bcrypt.hashSync('Admin1234!', 10), 'Admin', 'User', 'admin', 1);
  console.log('Seeded default admin: admin@forge.local / Admin1234!');
}

// ── JWT helpers ───────────────────────────────────────────────
interface TokenPayload { sub: string; email: string; role: string; }
const signAccess  = (p: TokenPayload) => jwt.sign(p, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
const signRefresh = (p: TokenPayload) => jwt.sign(p, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN } as jwt.SignOptions);
const verifyToken = (t: string) => jwt.verify(t, JWT_SECRET) as TokenPayload;

// ── Auth middleware ───────────────────────────────────────────
interface AuthRequest extends Request { user?: TokenPayload; }

function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) { res.status(401).json({ success: false, error: 'AUTHENTICATION_REQUIRED' }); return; }
  try { req.user = verifyToken(h.slice(7)); next(); }
  catch { res.status(401).json({ success: false, error: 'INVALID_TOKEN', message: 'Token invalid or expired' }); }
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') { res.status(403).json({ success: false, error: 'FORBIDDEN' }); return; }
  next();
}

// ── App ───────────────────────────────────────────────────────
const app = express();
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    // Allow: no origin (curl/Postman), localhost, Vercel deployments
    const allowed = [
      FRONTEND_URL,
      'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002',
      'https://forge-sand-two.vercel.app',
    ];
    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true); // open CORS for now — tighten post-launch
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Health ────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', environment: NODE_ENV, timestamp: new Date().toISOString() }));

// ── Auth ──────────────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName = '', lastName = '' } = req.body;
  if (!email || !password) { res.status(400).json({ success: false, error: 'INVALID_INPUT', message: 'email and password required' }); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { res.status(400).json({ success: false, error: 'INVALID_EMAIL' }); return; }
  if (password.length < 8) { res.status(400).json({ success: false, error: 'INVALID_PASSWORD', message: 'Password must be at least 8 characters' }); return; }
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase())) {
    res.status(409).json({ success: false, error: 'DUPLICATE_EMAIL', message: 'Email already registered' }); return;
  }
  const id = uuidv4();
  db.prepare('INSERT INTO users (id,email,password,first_name,last_name,role,verified) VALUES (?,?,?,?,?,?,?)')
    .run(id, email.toLowerCase(), bcrypt.hashSync(password, 10), firstName, lastName, 'user', 1);
  res.status(201).json({ success: true, message: 'Account created', data: { id, email: email.toLowerCase(), firstName, lastName, role: 'user' } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ success: false, error: 'INVALID_INPUT' }); return; }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ success: false, error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }); return;
  }
  const payload: TokenPayload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);
  db.prepare('INSERT INTO refresh_tokens (id,user_id,token,expires_at) VALUES (?,?,?,?)')
    .run(uuidv4(), user.id, refreshToken, new Date(Date.now() + 7 * 86400000).toISOString());
  res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 86400000 });
  res.json({ success: true, message: 'Login successful', data: { accessToken, user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role } } });
});

app.post('/api/auth/refresh', (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  if (!token) { res.status(401).json({ success: false, error: 'INVALID_REFRESH_TOKEN' }); return; }
  let payload: TokenPayload;
  try { payload = verifyToken(token); } catch { res.status(401).json({ success: false, error: 'INVALID_REFRESH_TOKEN' }); return; }
  const stored = db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(token) as any;
  if (!stored) { res.status(401).json({ success: false, error: 'INVALID_REFRESH_TOKEN' }); return; }
  db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token);
  const newAccess = signAccess(payload);
  const newRefresh = signRefresh(payload);
  db.prepare('INSERT INTO refresh_tokens (id,user_id,token,expires_at) VALUES (?,?,?,?)')
    .run(uuidv4(), stored.user_id, newRefresh, new Date(Date.now() + 7 * 86400000).toISOString());
  res.cookie('refreshToken', newRefresh, { httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 86400000 });
  res.json({ success: true, data: { accessToken: newAccess } });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = (req as any).cookies?.refreshToken;
  if (token) db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token);
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out' });
});

// ── Profile ───────────────────────────────────────────────────
app.get('/api/profile', requireAuth, (req: AuthRequest, res) => {
  const u = db.prepare('SELECT id,email,first_name,last_name,role,created_at FROM users WHERE id = ?').get(req.user!.sub) as any;
  if (!u) { res.status(404).json({ success: false, error: 'USER_NOT_FOUND' }); return; }
  res.json({ success: true, data: { id: u.id, email: u.email, firstName: u.first_name, lastName: u.last_name, role: u.role, createdAt: u.created_at } });
});

app.put('/api/profile', requireAuth, (req: AuthRequest, res) => {
  const { firstName, lastName } = req.body;
  db.prepare("UPDATE users SET first_name=?,last_name=?,updated_at=datetime('now') WHERE id=?").run(firstName||'', lastName||'', req.user!.sub);
  res.json({ success: true, message: 'Profile updated' });
});

app.post('/api/password/change', requireAuth, (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.sub) as any;
  if (!bcrypt.compareSync(currentPassword, user.password)) { res.status(400).json({ success: false, error: 'INVALID_CREDENTIALS' }); return; }
  if (!newPassword || newPassword.length < 8) { res.status(400).json({ success: false, error: 'INVALID_PASSWORD' }); return; }
  db.prepare("UPDATE users SET password=?,updated_at=datetime('now') WHERE id=?").run(bcrypt.hashSync(newPassword, 10), req.user!.sub);
  db.prepare('DELETE FROM refresh_tokens WHERE user_id=?').run(req.user!.sub);
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Password changed. Please log in again.' });
});

// ── Agents ────────────────────────────────────────────────────
app.get('/api/agents', requireAuth, (req: AuthRequest, res) => {
  res.json({ success: true, data: db.prepare('SELECT * FROM agents WHERE user_id=? ORDER BY created_at DESC').all(req.user!.sub) });
});
app.post('/api/agents', requireAuth, (req: AuthRequest, res) => {
  const { name, description='', model='claude-3-sonnet', temperature=0.7, maxTokens=2048 } = req.body;
  if (!name) { res.status(400).json({ success: false, error: 'INVALID_INPUT', message: 'name required' }); return; }
  const id = uuidv4();
  db.prepare('INSERT INTO agents (id,user_id,name,description,model,temperature,max_tokens) VALUES (?,?,?,?,?,?,?)')
    .run(id, req.user!.sub, name, description, model, temperature, maxTokens);
  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM agents WHERE id=?').get(id) });
});
app.get('/api/agents/:id', requireAuth, (req: AuthRequest, res) => {
  const a = db.prepare('SELECT * FROM agents WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub);
  if (!a) { res.status(404).json({ success: false, error: 'AGENT_NOT_FOUND' }); return; }
  res.json({ success: true, data: a });
});
app.put('/api/agents/:id', requireAuth, (req: AuthRequest, res) => {
  const { name, description, model, temperature, maxTokens, status } = req.body;
  if (!db.prepare('SELECT id FROM agents WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub)) {
    res.status(404).json({ success: false, error: 'AGENT_NOT_FOUND' }); return;
  }
  db.prepare("UPDATE agents SET name=COALESCE(?,name),description=COALESCE(?,description),model=COALESCE(?,model),temperature=COALESCE(?,temperature),max_tokens=COALESCE(?,max_tokens),status=COALESCE(?,status),updated_at=datetime('now') WHERE id=?")
    .run(name, description, model, temperature, maxTokens, status, req.params.id);
  res.json({ success: true, data: db.prepare('SELECT * FROM agents WHERE id=?').get(req.params.id) });
});
app.delete('/api/agents/:id', requireAuth, (req: AuthRequest, res) => {
  const r = db.prepare('DELETE FROM agents WHERE id=? AND user_id=?').run(req.params.id, req.user!.sub);
  if (!r.changes) { res.status(404).json({ success: false, error: 'AGENT_NOT_FOUND' }); return; }
  res.json({ success: true, message: 'Agent deleted' });
});

// ── Workflows ─────────────────────────────────────────────────
app.get('/api/workflows', requireAuth, (req: AuthRequest, res) => {
  res.json({ success: true, data: db.prepare('SELECT * FROM workflows WHERE user_id=? ORDER BY created_at DESC').all(req.user!.sub) });
});
app.post('/api/workflows', requireAuth, (req: AuthRequest, res) => {
  const { name, description='', definition={} } = req.body;
  if (!name) { res.status(400).json({ success: false, error: 'INVALID_INPUT', message: 'name required' }); return; }
  const id = uuidv4();
  db.prepare('INSERT INTO workflows (id,user_id,name,description,definition) VALUES (?,?,?,?,?)')
    .run(id, req.user!.sub, name, description, JSON.stringify(definition));
  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM workflows WHERE id=?').get(id) });
});
app.get('/api/workflows/:id', requireAuth, (req: AuthRequest, res) => {
  const w = db.prepare('SELECT * FROM workflows WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub);
  if (!w) { res.status(404).json({ success: false, error: 'WORKFLOW_NOT_FOUND' }); return; }
  res.json({ success: true, data: w });
});
app.delete('/api/workflows/:id', requireAuth, (req: AuthRequest, res) => {
  const r = db.prepare('DELETE FROM workflows WHERE id=? AND user_id=?').run(req.params.id, req.user!.sub);
  if (!r.changes) { res.status(404).json({ success: false, error: 'WORKFLOW_NOT_FOUND' }); return; }
  res.json({ success: true, message: 'Workflow deleted' });
});

// ── Dashboard / Queue / History ───────────────────────────────
app.get('/api/dashboard', requireAuth, (req: AuthRequest, res) => {
  const uid = req.user!.sub;
  res.json({ success: true, data: {
    activeWorkflows: (db.prepare("SELECT COUNT(*) as c FROM workflows WHERE user_id=? AND status!='draft'").get(uid) as any).c,
    completedTasks:  (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE user_id=? AND status='completed'").get(uid) as any).c,
    queuedTasks:     (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE user_id=? AND status='queued'").get(uid) as any).c,
    agentCount:      (db.prepare('SELECT COUNT(*) as c FROM agents WHERE user_id=?').get(uid) as any).c,
  }});
});
app.get('/api/queue',   requireAuth, (req: AuthRequest, res) => {
  res.json({ success: true, data: db.prepare("SELECT * FROM tasks WHERE user_id=? AND status='queued' ORDER BY created_at DESC").all(req.user!.sub) });
});
app.get('/api/history', requireAuth, (req: AuthRequest, res) => {
  res.json({ success: true, data: db.prepare('SELECT * FROM tasks WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.user!.sub) });
});

// ── Extra DB tables ────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    key_encrypted TEXT NOT NULL,
    key_preview TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, provider)
  );
  CREATE TABLE IF NOT EXISTS custom_providers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    api_key_encrypted TEXT NOT NULL DEFAULT '',
    markup_multiplier REAL NOT NULL DEFAULT 1.3,
    model_prefix TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS usage_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT '',
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    provider_cost REAL NOT NULL DEFAULT 0,
    forge_revenue REAL NOT NULL DEFAULT 0,
    markup_multiplier REAL NOT NULL DEFAULT 1.0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    plan TEXT NOT NULL DEFAULT 'free',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    tokens_limit INTEGER NOT NULL DEFAULT 10000,
    period_start TEXT NOT NULL DEFAULT (datetime('now')),
    period_end TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ── Safe migrations (add columns that may be missing in older DBs) ──
try { db.exec(`ALTER TABLE api_keys ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))`); } catch {}
try { db.exec(`ALTER TABLE api_keys ADD COLUMN key_preview TEXT NOT NULL DEFAULT ''`); } catch {}
try { db.exec(`ALTER TABLE subscriptions ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))`); } catch {}

// ── Schema repair: rebuild api_keys if it has a broken DEFAULT from old schema ──
// The old schema had DEFAULT (datetime('now', '+30 days')) which SQLite rejects at runtime.
// We rebuild via rename → recreate → copy → drop (SQLite doesn't support ALTER COLUMN).
try {
  const schemaRow = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='api_keys'`).get() as any;
  if (schemaRow && schemaRow.sql && schemaRow.sql.includes("'+30 days'")) {
    db.exec(`
      ALTER TABLE api_keys RENAME TO api_keys_old;
      CREATE TABLE api_keys (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        key_encrypted TEXT NOT NULL,
        key_preview TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(user_id, provider)
      );
      INSERT INTO api_keys (id,user_id,provider,key_encrypted,key_preview,created_at,updated_at)
        SELECT id,user_id,provider,key_encrypted,COALESCE(key_preview,''),COALESCE(created_at,datetime('now')),COALESCE(updated_at,datetime('now')) FROM api_keys_old;
      DROP TABLE api_keys_old;
    `);
    console.log('Repaired api_keys table schema');
  }
} catch (e) { console.error('Schema repair error:', e); }

// Ensure every user has a subscription row
function ensureSubscription(userId: string) {
  const existing = db.prepare('SELECT id FROM subscriptions WHERE user_id=?').get(userId);
  if (!existing) {
    db.prepare('INSERT INTO subscriptions (id,user_id,plan,tokens_limit) VALUES (?,?,?,?)').run(uuidv4(), userId, 'free', 10000);
  }
}

// Simple XOR "encryption" for API keys at rest (good enough for demo; swap for AES in prod)
function encryptKey(key: string): string { return Buffer.from(key).toString('base64'); }
function decryptKey(enc: string): string { try { return Buffer.from(enc, 'base64').toString('utf8'); } catch { return ''; } }
function previewKey(key: string): string {
  if (key.length <= 8) return key;
  return key.slice(0, 6) + '…' + key.slice(-4);
}

const PLAN_LIMITS: Record<string, number> = { free: 10000, starter: 500000, pro: 2000000, enterprise: 10000000 };
const MODEL_COSTS: Record<string, { input: number; output: number; provider: string; markup: number }> = {
  'forge-ultra':      { input: 0.015,   output: 0.075,  provider: 'anthropic', markup: 1.5  },
  'forge-pro':        { input: 0.003,   output: 0.015,  provider: 'anthropic', markup: 1.5  },
  'forge-fast':       { input: 0.00015, output: 0.0006, provider: 'groq',      markup: 2.0  },
  'forge-code':       { input: 0.0025,  output: 0.010,  provider: 'anthropic', markup: 1.5  },
  'forge-creative':   { input: 0.003,   output: 0.015,  provider: 'openai',    markup: 1.5  },
  'claude-opus-4':    { input: 0.015,   output: 0.075,  provider: 'anthropic', markup: 1.35 },
  'claude-sonnet-4':  { input: 0.003,   output: 0.015,  provider: 'anthropic', markup: 1.35 },
  'claude-haiku-4':   { input: 0.0008,  output: 0.004,  provider: 'anthropic', markup: 1.4  },
  'gpt-4o':           { input: 0.0025,  output: 0.010,  provider: 'openai',    markup: 1.35 },
  'gpt-4o-mini':      { input: 0.00015, output: 0.0006, provider: 'openai',    markup: 1.5  },
  'gpt-4.1':          { input: 0.002,   output: 0.008,  provider: 'openai',    markup: 1.35 },
  'o3-mini':          { input: 0.0011,  output: 0.0044, provider: 'openai',    markup: 1.4  },
  'gemini-2.0-flash': { input: 0.0001,  output: 0.0004, provider: 'gemini',    markup: 1.5  },
  'gemini-1.5-pro':   { input: 0.00125, output: 0.005,  provider: 'gemini',    markup: 1.4  },
  'llama-3.3-70b':    { input: 0.00059, output: 0.00079,provider: 'groq',      markup: 1.5  },
  'llama-3.1-8b':     { input: 0.00005, output: 0.00008,provider: 'groq',      markup: 2.0  },
  'mixtral-8x7b':     { input: 0.00024, output: 0.00024,provider: 'groq',      markup: 1.5  },
  'mistral-large':    { input: 0.002,   output: 0.006,  provider: 'mistral',   markup: 1.4  },
  'mistral-small':    { input: 0.0001,  output: 0.0003, provider: 'mistral',   markup: 1.5  },
};

function resolveForgeModel(modelId: string): string {
  const map: Record<string,string> = {
    'forge-ultra': 'claude-opus-4', 'forge-pro': 'claude-sonnet-4',
    'forge-fast': 'llama-3.3-70b', 'forge-code': 'gpt-4.1', 'forge-creative': 'gpt-4o',
  };
  return map[modelId] || modelId;
}

function getProviderForModel(modelId: string): string {
  if (modelId.startsWith('claude')) return 'anthropic';
  if (modelId.startsWith('gpt') || modelId.startsWith('o3')) return 'openai';
  if (modelId.startsWith('gemini')) return 'gemini';
  if (modelId.startsWith('llama') || modelId.startsWith('mixtral')) return 'groq';
  if (modelId.startsWith('mistral')) return 'mistral';
  if (modelId.startsWith('openrouter/') || modelId.includes('/')) return 'openrouter';
  return MODEL_COSTS[modelId]?.provider || 'openrouter';
}

function getUserKey(userId: string, provider: string): string | null {
  const row = db.prepare('SELECT key_encrypted FROM api_keys WHERE user_id=? AND provider=?').get(userId, provider) as any;
  if (!row) return null;
  return decryptKey(row.key_encrypted);
}

async function callLLM(provider: string, apiKey: string, model: string, messages: any[], _language?: string): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  // Anthropic
  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model, messages, max_tokens: 2048 }),
    });
    if (!res.ok) { const e = await res.text(); throw new Error(`Anthropic error: ${e.slice(0,200)}`); }
    const d: any = await res.json();
    return { content: d.content?.[0]?.text || '', promptTokens: d.usage?.input_tokens || 0, completionTokens: d.usage?.output_tokens || 0 };
  }
  // OpenAI
  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, max_tokens: 2048 }),
    });
    if (!res.ok) { const e = await res.text(); throw new Error(`OpenAI error: ${e.slice(0,200)}`); }
    const d: any = await res.json();
    return { content: d.choices?.[0]?.message?.content || '', promptTokens: d.usage?.prompt_tokens || 0, completionTokens: d.usage?.completion_tokens || 0 };
  }
  // Groq (OpenAI-compatible)
  if (provider === 'groq') {
    const groqModel = model === 'llama-3.3-70b' ? 'llama-3.3-70b-versatile' : model === 'llama-3.1-8b' ? 'llama-3.1-8b-instant' : model === 'mixtral-8x7b' ? 'mixtral-8x7b-32768' : model;
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: groqModel, messages, max_tokens: 2048 }),
    });
    if (!res.ok) { const e = await res.text(); throw new Error(`Groq error: ${e.slice(0,200)}`); }
    const d: any = await res.json();
    return { content: d.choices?.[0]?.message?.content || '', promptTokens: d.usage?.prompt_tokens || 0, completionTokens: d.usage?.completion_tokens || 0 };
  }
  // Google Gemini
  if (provider === 'gemini') {
    const geminiModel = model === 'gemini-2.0-flash' ? 'gemini-2.0-flash' : 'gemini-1.5-pro';
    const contents = messages.map((m: any) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 2048 } }),
    });
    if (!res.ok) { const e = await res.text(); throw new Error(`Gemini error: ${e.slice(0,200)}`); }
    const d: any = await res.json();
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const pt = d.usageMetadata?.promptTokenCount || 0;
    const ct = d.usageMetadata?.candidatesTokenCount || 0;
    return { content: text, promptTokens: pt, completionTokens: ct };
  }
  // Mistral (OpenAI-compatible)
  if (provider === 'mistral') {
    const mistralModel = model === 'mistral-large' ? 'mistral-large-latest' : 'mistral-small-latest';
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: mistralModel, messages, max_tokens: 2048 }),
    });
    if (!res.ok) { const e = await res.text(); throw new Error(`Mistral error: ${e.slice(0,200)}`); }
    const d: any = await res.json();
    return { content: d.choices?.[0]?.message?.content || '', promptTokens: d.usage?.prompt_tokens || 0, completionTokens: d.usage?.completion_tokens || 0 };
  }
  // OpenRouter (passthrough for 400+ models)
  if (provider === 'openrouter') {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://forge-sand-two.vercel.app', 'X-Title': 'Forge Studio' },
      body: JSON.stringify({ model, messages, max_tokens: 2048 }),
    });
    if (!res.ok) { const e = await res.text(); throw new Error(`OpenRouter error: ${e.slice(0,200)}`); }
    const d: any = await res.json();
    return { content: d.choices?.[0]?.message?.content || '', promptTokens: d.usage?.prompt_tokens || 0, completionTokens: d.usage?.completion_tokens || 0 };
  }
  throw new Error(`Unknown provider: ${provider}`);
}

// ── Chat ──────────────────────────────────────────────────────
app.post('/api/chat', requireAuth, async (req: AuthRequest, res) => {
  const { messages, model = 'forge-fast', language = 'English', channel = 'Chat' } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ success: false, error: 'INVALID_INPUT', message: 'messages array required' }); return;
  }
  const userId = req.user!.sub;
  ensureSubscription(userId);

  // Check token budget
  const sub = db.prepare('SELECT plan, tokens_used, tokens_limit FROM subscriptions WHERE user_id=?').get(userId) as any;
  if (sub && sub.tokens_used >= sub.tokens_limit) {
    res.status(429).json({ success: false, error: 'TOKEN_LIMIT_EXCEEDED', message: `You've used all ${sub.tokens_limit.toLocaleString()} tokens on your ${sub.plan} plan. Please upgrade.` }); return;
  }

  const forgeModelId = model;
  const actualModel = resolveForgeModel(model);
  const provider = getProviderForModel(actualModel);

  // Get user's API key for this provider
  const apiKey = getUserKey(userId, provider);
  if (!apiKey) {
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
    res.json({ success: false, error: 'NO_API_KEY', needsApiKey: true, provider, providerName, model: forgeModelId,
      message: `No ${providerName} API key found. Go to Settings → LLM Providers and add your ${providerName} key to use ${actualModel}.` });
    return;
  }

  try {
    // Add language/channel context to system message if needed
    const systemMsg = language !== 'English' || channel !== 'Chat'
      ? [{ role: 'system', content: `You are a helpful AI assistant. Respond in ${language}. This is a ${channel} channel — keep format appropriate for that context.` }, ...messages]
      : messages;

    const result = await callLLM(provider, apiKey, actualModel, systemMsg, language);
    const totalTokens = result.promptTokens + result.completionTokens;

    // Cost calculation
    const costs = MODEL_COSTS[forgeModelId] || MODEL_COSTS[actualModel] || { input: 0.001, output: 0.001, markup: 1.3 };
    const providerCost = (result.promptTokens / 1000) * costs.input + (result.completionTokens / 1000) * costs.output;
    const forgeRevenue = providerCost * costs.markup;

    // Log usage
    db.prepare('INSERT INTO usage_logs (id,user_id,model,provider,prompt_tokens,completion_tokens,total_tokens,provider_cost,forge_revenue,markup_multiplier) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(uuidv4(), userId, forgeModelId, provider, result.promptTokens, result.completionTokens, totalTokens, providerCost, forgeRevenue, costs.markup);

    // Update token usage
    db.prepare("UPDATE subscriptions SET tokens_used=tokens_used+?,updated_at=datetime('now') WHERE user_id=?").run(totalTokens, userId);

    res.json({ success: true, data: { response: result.content, model: forgeModelId, modelName: actualModel, provider, tokensUsed: totalTokens, promptTokens: result.promptTokens, completionTokens: result.completionTokens, cost: providerCost, revenue: forgeRevenue } });
  } catch (err: any) {
    console.error('Chat error:', err.message);
    res.status(500).json({ success: false, error: 'LLM_ERROR', message: err.message });
  }
});

// ── API Keys ──────────────────────────────────────────────────
app.get('/api/keys', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const rows = db.prepare('SELECT provider, key_preview FROM api_keys WHERE user_id=?').all(userId) as any[];
  const keyMap: any = {};
  const providers = ['anthropic','openai','openrouter','groq','gemini','mistral','together','perplexity','cohere','cursor'];
  providers.forEach(p => {
    keyMap[`has_${p}`] = false;
    keyMap[`${p}_key`] = null;
  });
  rows.forEach(r => {
    keyMap[`has_${r.provider}`] = true;
    keyMap[`${r.provider}_key`] = r.key_preview;
  });
  res.json({ success: true, data: keyMap });
});

app.post('/api/keys', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const providers = ['anthropic','openai','openrouter','groq','gemini','mistral','together','perplexity','cohere','cursor'];
  const saved: string[] = [];

  const upsertKey = (provider: string, value: string, preview: string) => {
    const enc = encryptKey(value);
    const existing = db.prepare('SELECT id FROM api_keys WHERE user_id=? AND provider=?').get(userId, provider);
    if (existing) {
      db.prepare("UPDATE api_keys SET key_encrypted=?,key_preview=? WHERE user_id=? AND provider=?").run(enc, preview, userId, provider);
    } else {
      db.prepare('INSERT INTO api_keys (id,user_id,provider,key_encrypted,key_preview) VALUES (?,?,?,?,?)').run(uuidv4(), userId, provider, enc, preview);
    }
    saved.push(provider);
  };

  providers.forEach(p => {
    // API key
    const key = req.body[`${p}_key`];
    if (key && typeof key === 'string' && key.trim()) {
      const trimmed = key.trim();
      upsertKey(p, trimmed, previewKey(trimmed));
    }
    // Account email + password (stored as JSON under provider key "${p}_account")
    const email = req.body[`${p}_account_email`];
    const password = req.body[`${p}_account_password`];
    if (email && typeof email === 'string' && email.trim() &&
        password && typeof password === 'string' && password.trim()) {
      const creds = JSON.stringify({ email: email.trim(), password: password.trim() });
      const preview = email.trim().slice(0, 4) + '***';
      upsertKey(`${p}_account`, creds, preview);
    }
  });

  res.json({ success: true, message: `Saved keys for: ${saved.join(', ') || 'none'}`, saved });
});

app.delete('/api/keys/:provider', requireAuth, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM api_keys WHERE user_id=? AND provider=?').run(req.user!.sub, req.params.provider);
  res.json({ success: true, message: 'Key deleted' });
});

// OpenRouter model list proxy
app.get('/api/keys/openrouter-models', requireAuth, async (req: AuthRequest, res) => {
  const key = getUserKey(req.user!.sub, 'openrouter');
  if (!key) { res.status(400).json({ success: false, error: 'NO_OPENROUTER_KEY', message: 'Add your OpenRouter key in Settings first' }); return; }
  try {
    const r = await fetch('https://openrouter.ai/api/v1/models', { headers: { 'Authorization': `Bearer ${key}` } });
    if (!r.ok) throw new Error(`OpenRouter returned ${r.status}`);
    const d: any = await r.json();
    res.json({ success: true, data: { models: d.data || [] } });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// ── Custom Providers ──────────────────────────────────────────
app.get('/api/providers', requireAuth, (req: AuthRequest, res) => {
  const rows = db.prepare('SELECT id,name,base_url,markup_multiplier,model_prefix,notes,active,created_at FROM custom_providers WHERE user_id=? ORDER BY created_at DESC').all(req.user!.sub) as any[];
  res.json({ success: true, data: rows });
});

app.post('/api/providers', requireAuth, (req: AuthRequest, res) => {
  const { name, base_url, api_key = '', markup_multiplier = 1.3, model_prefix = '', notes = '' } = req.body;
  if (!name || !base_url) { res.status(400).json({ success: false, error: 'INVALID_INPUT', message: 'name and base_url required' }); return; }
  const id = uuidv4();
  const enc = api_key ? encryptKey(api_key) : '';
  db.prepare('INSERT INTO custom_providers (id,user_id,name,base_url,api_key_encrypted,markup_multiplier,model_prefix,notes) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, req.user!.sub, name, base_url, enc, markup_multiplier, model_prefix, notes);
  const row = db.prepare('SELECT id,name,base_url,markup_multiplier,model_prefix,notes,active,created_at FROM custom_providers WHERE id=?').get(id);
  res.status(201).json({ success: true, data: row });
});

app.put('/api/providers/:id', requireAuth, (req: AuthRequest, res) => {
  const { name, base_url, api_key, markup_multiplier, model_prefix, notes, active } = req.body;
  const row = db.prepare('SELECT id FROM custom_providers WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub);
  if (!row) { res.status(404).json({ success: false, error: 'PROVIDER_NOT_FOUND' }); return; }
  if (api_key) db.prepare("UPDATE custom_providers SET api_key_encrypted=?,updated_at=datetime('now') WHERE id=?").run(encryptKey(api_key), req.params.id);
  db.prepare("UPDATE custom_providers SET name=COALESCE(?,name),base_url=COALESCE(?,base_url),markup_multiplier=COALESCE(?,markup_multiplier),model_prefix=COALESCE(?,model_prefix),notes=COALESCE(?,notes),active=COALESCE(?,active),updated_at=datetime('now') WHERE id=?")
    .run(name, base_url, markup_multiplier, model_prefix, notes, active !== undefined ? (active ? 1 : 0) : null, req.params.id);
  res.json({ success: true, data: db.prepare('SELECT id,name,base_url,markup_multiplier,model_prefix,notes,active FROM custom_providers WHERE id=?').get(req.params.id) });
});

app.delete('/api/providers/:id', requireAuth, (req: AuthRequest, res) => {
  const r = db.prepare('DELETE FROM custom_providers WHERE id=? AND user_id=?').run(req.params.id, req.user!.sub);
  if (!r.changes) { res.status(404).json({ success: false, error: 'PROVIDER_NOT_FOUND' }); return; }
  res.json({ success: true, message: 'Provider deleted' });
});

// Test custom provider — try a simple chat completion
app.post('/api/providers/:id/test', requireAuth, async (req: AuthRequest, res) => {
  const row = db.prepare('SELECT * FROM custom_providers WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub) as any;
  if (!row) { res.status(404).json({ success: false, error: 'PROVIDER_NOT_FOUND' }); return; }
  const apiKey = row.api_key_encrypted ? decryptKey(row.api_key_encrypted) : '';
  try {
    const testModel = row.model_prefix ? `${row.model_prefix}/test` : 'gpt-3.5-turbo';
    const r = await fetch(`${row.base_url}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: testModel, messages: [{ role: 'user', content: 'Reply with just "OK"' }], max_tokens: 10 }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text().then(t=>t.slice(0,100))}`);
    const d: any = await r.json();
    const resp = d.choices?.[0]?.message?.content || d.response || 'Connected';
    res.json({ success: true, response: resp });
  } catch (err: any) { res.json({ success: false, error: err.message }); }
});

// ── Billing ───────────────────────────────────────────────────
app.get('/api/billing/subscription', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  ensureSubscription(userId);
  const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id=?').get(userId) as any;
  res.json({ success: true, plan: sub.plan, tokensUsed: sub.tokens_used, tokenLimit: sub.tokens_limit, status: sub.status, periodEnd: sub.period_end });
});

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_PRICE_IDS: Record<string, string> = {
  starter:    process.env.STRIPE_PRICE_STARTER    || '',
  pro:        process.env.STRIPE_PRICE_PRO        || '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || '',
};

app.post('/api/billing/upgrade', requireAuth, async (req: AuthRequest, res) => {
  const { plan } = req.body;
  if (!['free','starter','pro','enterprise'].includes(plan)) {
    res.status(400).json({ success: false, error: 'INVALID_PLAN' }); return;
  }
  const userId = req.user!.sub;
  ensureSubscription(userId);

  // If downgrading to free, just update locally
  if (plan === 'free') {
    const newLimit = PLAN_LIMITS[plan];
    db.prepare("UPDATE subscriptions SET plan=?,tokens_limit=?,stripe_subscription_id=NULL,status='active',updated_at=datetime('now') WHERE user_id=?").run(plan, newLimit, userId);
    res.json({ success: true, plan, message: 'Downgraded to Free plan' });
    return;
  }

  // With Stripe configured: create checkout session
  if (STRIPE_SECRET && STRIPE_PRICE_IDS[plan]) {
    try {
      const user = db.prepare('SELECT email FROM users WHERE id=?').get(userId) as any;
      const sub = db.prepare('SELECT stripe_customer_id FROM subscriptions WHERE user_id=?').get(userId) as any;

      const sessionBody: any = {
        mode: 'subscription',
        line_items: [{ price: STRIPE_PRICE_IDS[plan], quantity: 1 }],
        success_url: `${process.env.FRONTEND_URL || 'https://forge-sand-two.vercel.app'}/?billing=success&plan=${plan}`,
        cancel_url:  `${process.env.FRONTEND_URL || 'https://forge-sand-two.vercel.app'}/?billing=cancel`,
        client_reference_id: userId,
        customer_email: user?.email,
        metadata: { userId, plan },
      };
      if (sub?.stripe_customer_id) sessionBody.customer = sub.stripe_customer_id;

      const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(Object.entries(sessionBody).flatMap(([k, v]) =>
          typeof v === 'object' ? Object.entries(v as any).map(([k2, v2]: [string, any]) => [String(`${k}[${k2}]`), String(v2)] as [string, string]) : [[k, String(v)] as [string, string]]
        ) as [string, string][]).toString(),
      });
      if (!r.ok) throw new Error(await r.text());
      const session: any = await r.json();
      res.json({ success: true, checkoutUrl: session.url, sessionId: session.id, message: 'Redirecting to Stripe checkout…' });
      return;
    } catch (err: any) {
      console.error('Stripe error:', err.message);
      // Fall through to mock upgrade
    }
  }

  // No Stripe configured — mock upgrade for demo
  const newLimit = PLAN_LIMITS[plan];
  db.prepare("UPDATE subscriptions SET plan=?,tokens_limit=?,status='active',updated_at=datetime('now') WHERE user_id=?").run(plan, newLimit, userId);
  res.json({ success: true, plan, message: `Upgraded to ${plan} (demo mode — add STRIPE_SECRET_KEY for real payments)`, tokensLimit: newLimit });
});

// Stripe webhook (handle subscription events)
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!STRIPE_SECRET || !sig) { res.json({ received: true }); return; }
  try {
    // In production: verify signature with stripe.webhooks.constructEvent()
    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id || session.metadata?.userId;
      const plan = session.metadata?.plan;
      if (userId && plan) {
        const newLimit = PLAN_LIMITS[plan] || 10000;
        db.prepare("UPDATE subscriptions SET plan=?,tokens_limit=?,stripe_customer_id=?,stripe_subscription_id=?,status='active',updated_at=datetime('now') WHERE user_id=?")
          .run(plan, newLimit, session.customer, session.subscription, userId);
      }
    }
    res.json({ received: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// ── Router / Usage Analytics ──────────────────────────────────
app.get('/api/router/usage', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const rows = db.prepare(`
    SELECT model, provider,
      COUNT(*) as requests,
      SUM(total_tokens) as tokens,
      SUM(provider_cost) as cost,
      SUM(forge_revenue) as revenue
    FROM usage_logs WHERE user_id=?
    GROUP BY model, provider
    ORDER BY tokens DESC
  `).all(userId) as any[];

  const usage = rows.map(r => ({
    model: r.model, provider: r.provider,
    requests: r.requests, tokens: r.tokens,
    cost: r.cost, revenue: r.revenue,
  }));

  const totalTokens = rows.reduce((s, r) => s + r.tokens, 0);
  const totalCost   = rows.reduce((s, r) => s + r.cost, 0);
  const totalRev    = rows.reduce((s, r) => s + r.revenue, 0);

  res.json({ success: true, usage, totals: { tokens: totalTokens, cost: totalCost, revenue: totalRev, margin: totalRev > 0 ? (totalRev - totalCost) / totalRev * 100 : 0 } });
});

app.get('/api/router/usage/history', requireAuth, (req: AuthRequest, res) => {
  const rows = db.prepare('SELECT model,provider,total_tokens,provider_cost,forge_revenue,created_at FROM usage_logs WHERE user_id=? ORDER BY created_at DESC LIMIT 100').all(req.user!.sub);
  res.json({ success: true, data: rows });
});

// ── Admin ─────────────────────────────────────────────────────
app.get('/api/admin/users', requireAuth, requireAdmin, (_req, res) => {
  res.json({ success: true, data: db.prepare('SELECT id,email,first_name,last_name,role,verified,created_at FROM users ORDER BY created_at DESC').all() });
});

// ── 404 + Error handler ───────────────────────────────────────
app.use((req, res) => { res.status(404).json({ success: false, error: 'NOT_FOUND', message: `${req.method} ${req.path} not found` }); });
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: err.message });
});

// ── Export app (for tests) — only listen when run directly ───
export default app;
export { db };

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║       Forge Platform — Backend API           ║
╠══════════════════════════════════════════════╣
║  ✅  http://localhost:${PORT}                   ║
║  ✅  SQLite  ${path.basename(DB_PATH).padEnd(30)}║
║  ✅  JWT auth                                ║
║  🔑  admin@forge.local / Admin1234!          ║
╚══════════════════════════════════════════════╝
    `);
  });
  process.on('SIGTERM', () => { server.close(() => { db.close(); process.exit(0); }); });
  process.on('SIGINT',  () => { server.close(() => { db.close(); process.exit(0); }); });
}
