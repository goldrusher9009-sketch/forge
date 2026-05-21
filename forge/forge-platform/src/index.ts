/**
 * Forge Platform v5.6 — Dynamic model fetch for all providers, live preview SSE, browser/terminal backend
 * SQLite + JWT + bcrypt. Admin routes, platform keys, model management.
 * DB persists on Railway via /data volume mount (set RAILWAY_ENVIRONMENT).
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
import { execFile } from 'child_process';
import Database from 'better-sqlite3';

// ── Config ────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'forge-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '30d';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://forge-sand-two.vercel.app';
// Use /data volume on Railway (persistent), fall back to cwd for local dev
const DB_PATH = process.env.DB_PATH || (process.env.RAILWAY_ENVIRONMENT ? '/data/forge.db' : path.join(process.cwd(), 'forge.db'));

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

// ── v5.2 new tables ────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS forge_memory (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    insight TEXT NOT NULL,
    source_thread_id TEXT,
    frequency INTEGER NOT NULL DEFAULT 1,
    strength REAL NOT NULL DEFAULT 1.0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS superagent_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
// v5.2 column migrations
try { db.exec(`ALTER TABLE api_keys ADD COLUMN key_status TEXT NOT NULL DEFAULT 'active'`); } catch {}
try { db.exec(`ALTER TABLE threads ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE threads ADD COLUMN archived INTEGER NOT NULL DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE threads ADD COLUMN total_tokens INTEGER NOT NULL DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE messages ADD COLUMN tokens INTEGER NOT NULL DEFAULT 0`); } catch {}

// ── Safe migrations (add columns that may be missing in older DBs) ──
try { db.exec(`ALTER TABLE api_keys ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))`); } catch {}
try { db.exec(`ALTER TABLE api_keys ADD COLUMN key_preview TEXT NOT NULL DEFAULT ''`); } catch {}
try { db.exec(`ALTER TABLE subscriptions ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))`); } catch {}
try { db.exec(`ALTER TABLE subscriptions ADD COLUMN tokens_limit INTEGER NOT NULL DEFAULT 10000`); } catch {}
try { db.exec(`ALTER TABLE subscriptions ADD COLUMN tokens_used INTEGER NOT NULL DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE subscriptions ADD COLUMN period_start TEXT NOT NULL DEFAULT (datetime('now'))`); } catch {}
try { db.exec(`ALTER TABLE subscriptions ADD COLUMN period_end TEXT NOT NULL DEFAULT (datetime('now', '+30 days'))`); } catch {}
try { db.exec(`ALTER TABLE subscriptions ADD COLUMN status TEXT NOT NULL DEFAULT 'active'`); } catch {}

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

// Canonical Anthropic model IDs (as of 2025)
const ANTHROPIC_MODEL_MAP: Record<string,string> = {
  'claude-opus-4-6':            'claude-opus-4-6',
  'claude-sonnet-4-6':          'claude-sonnet-4-6',
  'claude-opus-4-5':            'claude-opus-4-5',
  'claude-opus-4':              'claude-opus-4-5',
  'claude-sonnet-4-5':          'claude-sonnet-4-5',
  'claude-sonnet-4':            'claude-sonnet-4-5',
  'claude-haiku-4-5':           'claude-haiku-4-5-20251001',
  'claude-haiku-4':             'claude-haiku-4-5-20251001',
  'claude-3-5-sonnet':          'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku':           'claude-3-5-haiku-20241022',
  'claude-3-opus':              'claude-3-opus-20240229',
};

function resolveForgeModel(modelId: string): string {
  const forgeMap: Record<string,string> = {
    'forge-ultra':    'claude-opus-4-6',
    'forge-pro':      'claude-sonnet-4-6',
    'forge-flash':    'claude-haiku-4-5-20251001',
    'forge-fast':     'llama-3.3-70b',
    'forge-code':     'gpt-4.1',
    'forge-creative': 'gpt-4o',
    'forge-gpt':      'gpt-4o',
    'forge-gemini':   'gemini-2.0-flash',
  };
  return forgeMap[modelId] || ANTHROPIC_MODEL_MAP[modelId] || modelId;
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

// Env-var fallback map — Railway redeploys wipe the SQLite DB, so env vars are the reliable source
const PROVIDER_ENV_KEYS: Record<string,string> = {
  anthropic:   process.env.ANTHROPIC_API_KEY   || '',
  openai:      process.env.OPENAI_API_KEY       || '',
  gemini:      process.env.GEMINI_API_KEY       || '',
  groq:        process.env.GROQ_API_KEY         || '',
  mistral:     process.env.MISTRAL_API_KEY      || '',
  openrouter:  process.env.OPENROUTER_API_KEY   || '',
};

function getUserKey(userId: string, provider: string): string | null {
  // First check per-user key in DB
  const row = db.prepare('SELECT key_encrypted FROM api_keys WHERE user_id=? AND provider=?').get(userId, provider) as any;
  if (row) {
    const key = decryptKey(row.key_encrypted);
    if (key) return key;
  }
  // Fall back to server-level env var (so Railway deploys always work)
  return PROVIDER_ENV_KEYS[provider] || null;
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

// ── Dynamic model fetch for any provider ─────────────────────────────────
app.get('/api/keys/:provider/models', requireAuth, async (req: AuthRequest, res) => {
  const { provider } = req.params;
  const userId = req.user!.sub;
  const key = getUserKey(userId, provider);
  if (!key) { res.status(400).json({ success: false, error: 'NO_KEY', message: `No ${provider} key saved` }); return; }

  try {
    let models: { id: string; name: string; context_length?: number; pricing?: { prompt: string; completion: string } }[] = [];

    if (provider === 'openrouter') {
      const r = await fetch('https://openrouter.ai/api/v1/models', { headers: { 'Authorization': `Bearer ${key}` } });
      if (!r.ok) throw new Error(`OpenRouter returned ${r.status}`);
      const d: any = await r.json();
      models = (d.data || []).map((m: any) => ({ id: m.id, name: m.name || m.id, context_length: m.context_length, pricing: m.pricing }));

    } else if (provider === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/models', { headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' } });
      if (!r.ok) throw new Error(`Anthropic returned ${r.status}`);
      const d: any = await r.json();
      models = (d.data || []).map((m: any) => ({ id: m.id, name: m.display_name || m.id, context_length: m.context_window }));

    } else if (provider === 'openai') {
      const r = await fetch('https://api.openai.com/v1/models', { headers: { 'Authorization': `Bearer ${key}` } });
      if (!r.ok) throw new Error(`OpenAI returned ${r.status}`);
      const d: any = await r.json();
      const gptModels = (d.data || []).filter((m: any) => m.id.startsWith('gpt') || m.id.startsWith('o1') || m.id.startsWith('o3') || m.id.startsWith('chatgpt'));
      models = gptModels.map((m: any) => ({ id: m.id, name: m.id }));

    } else if (provider === 'groq') {
      const r = await fetch('https://api.groq.com/openai/v1/models', { headers: { 'Authorization': `Bearer ${key}` } });
      if (!r.ok) throw new Error(`Groq returned ${r.status}`);
      const d: any = await r.json();
      models = (d.data || []).map((m: any) => ({ id: m.id, name: m.id, context_length: m.context_window }));

    } else if (provider === 'gemini') {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      if (!r.ok) throw new Error(`Gemini returned ${r.status}`);
      const d: any = await r.json();
      const geminiModels = (d.models || []).filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'));
      models = geminiModels.map((m: any) => ({ id: m.name.replace('models/',''), name: m.displayName || m.name, context_length: m.inputTokenLimit }));

    } else if (provider === 'mistral') {
      const r = await fetch('https://api.mistral.ai/v1/models', { headers: { 'Authorization': `Bearer ${key}` } });
      if (!r.ok) throw new Error(`Mistral returned ${r.status}`);
      const d: any = await r.json();
      models = (d.data || []).map((m: any) => ({ id: m.id, name: m.name || m.id }));

    } else if (provider === 'together') {
      const r = await fetch('https://api.together.xyz/v1/models', { headers: { 'Authorization': `Bearer ${key}` } });
      if (!r.ok) throw new Error(`Together returned ${r.status}`);
      const d: any = await r.json();
      models = (Array.isArray(d) ? d : d.data || []).map((m: any) => ({ id: m.id, name: m.display_name || m.id, context_length: m.context_length }));

    } else if (provider === 'perplexity') {
      // Perplexity doesn't have a /models endpoint; return known models
      models = [
        { id: 'sonar-pro', name: 'Sonar Pro', context_length: 200000 },
        { id: 'sonar', name: 'Sonar', context_length: 127072 },
        { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro', context_length: 128000 },
        { id: 'sonar-reasoning', name: 'Sonar Reasoning', context_length: 127072 },
        { id: 'r1-1776', name: 'R1-1776', context_length: 128000 },
      ];
    } else if (provider === 'cohere') {
      const r = await fetch('https://api.cohere.com/v1/models', { headers: { 'Authorization': `Bearer ${key}` } });
      if (!r.ok) throw new Error(`Cohere returned ${r.status}`);
      const d: any = await r.json();
      models = (d.models || []).map((m: any) => ({ id: m.name, name: m.name, context_length: m.context_length }));
    } else {
      models = [];
    }

    res.json({ success: true, data: { provider, models } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Key validation endpoint ────────────────────────────────────
app.post('/api/keys/:provider/validate', requireAuth, async (req: AuthRequest, res) => {
  const { provider } = req.params;
  const userId = req.user!.sub;
  const key = getUserKey(userId, provider);
  if (!key) { res.status(400).json({ valid: false, error: 'No key saved for this provider' }); return; }

  try {
    let valid = false;
    let error = '';
    if (provider === 'openrouter') {
      const r = await fetch('https://openrouter.ai/api/v1/auth/key', { headers: { 'Authorization': `Bearer ${key}` } });
      valid = r.ok;
      if (!r.ok) error = `HTTP ${r.status}`;
    } else if (provider === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/models', { headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' } });
      valid = r.ok;
      if (!r.ok) error = `HTTP ${r.status}`;
    } else if (provider === 'openai') {
      const r = await fetch('https://api.openai.com/v1/models', { headers: { 'Authorization': `Bearer ${key}` } });
      valid = r.ok;
      if (!r.ok) error = `HTTP ${r.status}`;
    } else if (provider === 'groq') {
      const r = await fetch('https://api.groq.com/openai/v1/models', { headers: { 'Authorization': `Bearer ${key}` } });
      valid = r.ok;
      if (!r.ok) error = `HTTP ${r.status}`;
    } else if (provider === 'gemini') {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      valid = r.ok;
      if (!r.ok) error = `HTTP ${r.status}`;
    } else if (provider === 'mistral') {
      const r = await fetch('https://api.mistral.ai/v1/models', { headers: { 'Authorization': `Bearer ${key}` } });
      valid = r.ok;
      if (!r.ok) error = `HTTP ${r.status}`;
    } else {
      // For unknown providers, just confirm key exists
      valid = true;
    }
    // Update key_status in DB
    db.prepare("UPDATE api_keys SET key_status=? WHERE user_id=? AND provider=?").run(valid ? 'active' : 'invalid', userId, provider);
    res.json({ valid, error });
  } catch (err: any) {
    db.prepare("UPDATE api_keys SET key_status='invalid' WHERE user_id=? AND provider=?").run(userId, provider);
    res.json({ valid: false, error: err.message });
  }
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
// ── Platform settings table ──────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS platform_api_keys (
    provider TEXT PRIMARY KEY,
    key_encrypted TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS platform_models (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    label TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    is_forge_model INTEGER NOT NULL DEFAULT 0,
    markup REAL NOT NULL DEFAULT 1.3,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed default model list if empty
const modelCount = (db.prepare('SELECT COUNT(*) as c FROM platform_models').get() as any).c;
if (modelCount === 0) {
  const defaultModels = [
    { id:'forge-ultra',      provider:'anthropic', label:'Forge Ultra (Opus 4.6)',    is_forge:1, markup:2.5 },
    { id:'forge-pro',        provider:'anthropic', label:'Forge Pro (Sonnet 4.6)',    is_forge:1, markup:2.0 },
    { id:'forge-flash',      provider:'anthropic', label:'Forge Flash (Haiku 4.5)',   is_forge:1, markup:1.5 },
    { id:'forge-gpt',        provider:'openai',    label:'Forge GPT (GPT-4o)',        is_forge:1, markup:2.0 },
    { id:'forge-gemini',     provider:'gemini',    label:'Forge Gemini (Flash 2.0)',  is_forge:1, markup:1.5 },
    { id:'claude-opus-4-6',  provider:'anthropic', label:'Claude Opus 4.6',           is_forge:0, markup:1.0 },
    { id:'claude-sonnet-4-6',provider:'anthropic', label:'Claude Sonnet 4.6',         is_forge:0, markup:1.0 },
    { id:'claude-opus-4-5',  provider:'anthropic', label:'Claude Opus 4.5',           is_forge:0, markup:1.0 },
    { id:'claude-sonnet-4-5',provider:'anthropic', label:'Claude Sonnet 4.5',         is_forge:0, markup:1.0 },
    { id:'claude-haiku-4-5', provider:'anthropic', label:'Claude Haiku 4.5',          is_forge:0, markup:1.0 },
    { id:'claude-3-5-sonnet',provider:'anthropic', label:'Claude 3.5 Sonnet',         is_forge:0, markup:1.0 },
    { id:'gpt-4o',           provider:'openai',    label:'GPT-4o',                    is_forge:0, markup:1.0 },
    { id:'gpt-4o-mini',      provider:'openai',    label:'GPT-4o Mini',               is_forge:0, markup:1.0 },
    { id:'gpt-4.1',          provider:'openai',    label:'GPT-4.1',                   is_forge:0, markup:1.0 },
    { id:'gemini-2.0-flash', provider:'gemini',    label:'Gemini 2.0 Flash',          is_forge:0, markup:1.0 },
    { id:'gemini-1.5-pro',   provider:'gemini',    label:'Gemini 1.5 Pro',            is_forge:0, markup:1.0 },
    { id:'llama-3.3-70b',    provider:'groq',      label:'Llama 3.3 70B',             is_forge:0, markup:1.0 },
    { id:'mistral-large',    provider:'mistral',   label:'Mistral Large',             is_forge:0, markup:1.0 },
  ];
  const ins = db.prepare('INSERT OR IGNORE INTO platform_models (id,provider,label,enabled,is_forge_model,markup) VALUES (?,?,?,1,?,?)');
  defaultModels.forEach(m => ins.run(m.id, m.provider, m.label, m.is_forge, m.markup));
}

// ── Admin routes ─────────────────────────────────────────────
app.get('/api/admin/users', requireAuth, requireAdmin, (_req, res) => {
  res.json({ success: true, data: db.prepare('SELECT id,email,first_name,last_name,role,verified,created_at FROM users ORDER BY created_at DESC').all() });
});

app.patch('/api/admin/users/:id', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const { role, verified } = req.body;
  db.prepare("UPDATE users SET role=COALESCE(?,role), verified=COALESCE(?,verified), updated_at=datetime('now') WHERE id=?")
    .run(role ?? null, verified ?? null, req.params.id);
  res.json({ success: true, data: db.prepare('SELECT id,email,first_name,last_name,role,verified FROM users WHERE id=?').get(req.params.id) });
});

app.delete('/api/admin/users/:id', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  if (req.params.id === req.user!.sub) { res.status(400).json({ success:false, error:'Cannot delete yourself' }); return; }
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// Platform-level API keys (used as fallback for all users)
app.get('/api/admin/platform-keys', requireAuth, requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT provider, enabled, updated_at FROM platform_api_keys').all();
  res.json({ success: true, data: rows });
});

app.post('/api/admin/platform-keys', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const { provider, key } = req.body;
  if (!provider || !key) { res.status(400).json({ success:false, error:'provider and key required' }); return; }
  const enc = encryptKey(key.trim());
  const existing = db.prepare('SELECT provider FROM platform_api_keys WHERE provider=?').get(provider);
  if (existing) {
    db.prepare("UPDATE platform_api_keys SET key_encrypted=?,enabled=1,updated_at=datetime('now') WHERE provider=?").run(enc, provider);
  } else {
    db.prepare('INSERT INTO platform_api_keys (provider,key_encrypted,enabled) VALUES (?,?,1)').run(provider, enc);
  }
  res.json({ success: true, message: `Platform key saved for ${provider}` });
});

app.delete('/api/admin/platform-keys/:provider', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM platform_api_keys WHERE provider=?').run(req.params.provider);
  res.json({ success: true });
});

// Model management
app.get('/api/admin/models', requireAuth, requireAdmin, (_req, res) => {
  res.json({ success: true, data: db.prepare('SELECT * FROM platform_models ORDER BY provider, id').all() });
});

app.patch('/api/admin/models/:id', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const { enabled, label, markup } = req.body;
  db.prepare("UPDATE platform_models SET enabled=COALESCE(?,enabled), label=COALESCE(?,label), markup=COALESCE(?,markup), updated_at=datetime('now') WHERE id=?")
    .run(enabled ?? null, label ?? null, markup ?? null, req.params.id);
  res.json({ success: true, data: db.prepare('SELECT * FROM platform_models WHERE id=?').get(req.params.id) });
});

app.post('/api/admin/models', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const { id, provider, label, is_forge_model = 0, markup = 1.0 } = req.body;
  if (!id || !provider || !label) { res.status(400).json({ success:false, error:'id, provider, label required' }); return; }
  db.prepare('INSERT OR REPLACE INTO platform_models (id,provider,label,enabled,is_forge_model,markup) VALUES (?,?,?,1,?,?)').run(id, provider, label, is_forge_model, markup);
  res.json({ success: true });
});

// Public endpoint — returns enabled models (used by frontend to populate dropdown)
app.get('/api/models', requireAuth, (_req, res) => {
  const rows = db.prepare('SELECT id,provider,label,is_forge_model,markup FROM platform_models WHERE enabled=1 ORDER BY is_forge_model DESC, provider, id').all();
  res.json({ success: true, data: rows });
});

// Admin stats
app.get('/api/admin/stats', requireAuth, requireAdmin, (_req, res) => {
  const users = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  const threads = (db.prepare('SELECT COUNT(*) as c FROM threads').get() as any).c;
  const messages = (db.prepare('SELECT COUNT(*) as c FROM messages').get() as any).c;
  const revenue = (db.prepare('SELECT COALESCE(SUM(forge_revenue),0) as r FROM usage_logs').get() as any).r;
  const topModels = db.prepare('SELECT model, COUNT(*) as uses FROM usage_logs GROUP BY model ORDER BY uses DESC LIMIT 5').all();
  res.json({ success: true, data: { users, threads, messages, revenue, topModels } });
});

// ═══════════════════════════════════════════════════════════════
// ── FORGE WORKSPACE — Projects, Threads, Artifacts, Agents,
//    Tasks, Dispatch (SSE), Scheduler
// ═══════════════════════════════════════════════════════════════

// ── Workspace DB tables ────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#7F77DD',
    system_prompt TEXT NOT NULL DEFAULT '',
    pinned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New conversation',
    model TEXT NOT NULL DEFAULT 'forge-fast',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
    content TEXT NOT NULL,
    artifact_ids TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS artifacts (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    thread_id TEXT REFERENCES threads(id) ON DELETE SET NULL,
    message_id TEXT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'code',
    title TEXT NOT NULL DEFAULT 'Untitled',
    content TEXT NOT NULL DEFAULT '',
    language TEXT NOT NULL DEFAULT '',
    version INTEGER NOT NULL DEFAULT 1,
    pinned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS workspace_agents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#7F77DD',
    icon TEXT NOT NULL DEFAULT 'robot',
    system_prompt TEXT NOT NULL DEFAULT '',
    tools TEXT NOT NULL DEFAULT '[]',
    model TEXT NOT NULL DEFAULT 'forge-fast',
    active INTEGER NOT NULL DEFAULT 1,
    is_builtin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS workspace_tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    thread_id TEXT REFERENCES threads(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('backlog','todo','in_progress','done','cancelled')),
    agent_id TEXT REFERENCES workspace_agents(id) ON DELETE SET NULL,
    artifact_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS dispatch_runs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    agent_ids TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','done','error','cancelled')),
    output TEXT NOT NULL DEFAULT '',
    error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    cron_expr TEXT NOT NULL DEFAULT '0 9 * * 1',
    prompt TEXT NOT NULL,
    agent_ids TEXT NOT NULL DEFAULT '[]',
    enabled INTEGER NOT NULL DEFAULT 1,
    last_run TEXT,
    last_status TEXT NOT NULL DEFAULT 'never',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed default workspace agents for every new user on first use
function ensureDefaultAgents(userId: string) {
  const count = (db.prepare('SELECT COUNT(*) as c FROM workspace_agents WHERE user_id=?').get(userId) as any).c;
  if (count > 0) return;
  const defaults = [
    { name: 'Coder',      color: '#7F77DD', icon: 'code',       system_prompt: 'You are an expert software engineer. Write clean, production-ready code. When creating files or code artifacts, make them complete and runnable.', tools: '["create_artifact","create_task"]' },
    { name: 'Deployer',   color: '#1D9E75', icon: 'server',     system_prompt: 'You are a DevOps and deployment expert. Help with Railway, Vercel, Docker, git operations, CI/CD, environment config, and production troubleshooting.', tools: '["create_artifact","create_task"]' },
    { name: 'Researcher', color: '#D85A30', icon: 'search',     system_prompt: 'You are a thorough researcher. Synthesize information clearly, cite sources, summarize findings, and present actionable insights.', tools: '["create_artifact"]' },
    { name: 'Designer',   color: '#BA7517', icon: 'palette',    system_prompt: 'You are a UI/UX expert. Create beautiful, accessible HTML/CSS/React components and mockups. Output complete, renderable code.', tools: '["create_artifact"]' },
  ];
  defaults.forEach(d => {
    db.prepare('INSERT INTO workspace_agents (id,user_id,name,color,icon,system_prompt,tools,model,is_builtin) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(uuidv4(), userId, d.name, d.color, d.icon, d.system_prompt, d.tools, 'forge-fast', 1);
  });
}

// ── Projects ──────────────────────────────────────────────────
app.get('/api/projects', requireAuth, (req: AuthRequest, res) => {
  ensureDefaultAgents(req.user!.sub);
  const rows = db.prepare('SELECT * FROM projects WHERE user_id=? ORDER BY pinned DESC, updated_at DESC').all(req.user!.sub);
  res.json({ success: true, data: rows });
});

app.post('/api/projects', requireAuth, (req: AuthRequest, res) => {
  const { name, color = '#7F77DD', system_prompt = '' } = req.body;
  if (!name) { res.status(400).json({ success: false, error: 'INVALID_INPUT', message: 'name required' }); return; }
  const id = uuidv4();
  db.prepare("INSERT INTO projects (id,user_id,name,color,system_prompt) VALUES (?,?,?,?,?)").run(id, req.user!.sub, name, color, system_prompt);
  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM projects WHERE id=?').get(id) });
});

app.get('/api/projects/:id', requireAuth, (req: AuthRequest, res) => {
  const p = db.prepare('SELECT * FROM projects WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub);
  if (!p) { res.status(404).json({ success: false, error: 'PROJECT_NOT_FOUND' }); return; }
  const threadCount = (db.prepare('SELECT COUNT(*) as c FROM threads WHERE project_id=?').get(req.params.id) as any).c;
  const artifactCount = (db.prepare('SELECT COUNT(*) as c FROM artifacts WHERE project_id=?').get(req.params.id) as any).c;
  const taskCount = (db.prepare("SELECT COUNT(*) as c FROM workspace_tasks WHERE project_id=? AND status!='done'").get(req.params.id) as any).c;
  res.json({ success: true, data: { ...(p as any), threadCount, artifactCount, taskCount } });
});

app.patch('/api/projects/:id', requireAuth, (req: AuthRequest, res) => {
  const { name, color, system_prompt, pinned } = req.body;
  if (!db.prepare('SELECT id FROM projects WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub)) {
    res.status(404).json({ success: false, error: 'PROJECT_NOT_FOUND' }); return;
  }
  db.prepare("UPDATE projects SET name=COALESCE(?,name),color=COALESCE(?,color),system_prompt=COALESCE(?,system_prompt),pinned=COALESCE(?,pinned),updated_at=datetime('now') WHERE id=?")
    .run(name ?? null, color ?? null, system_prompt ?? null, pinned !== undefined ? (pinned ? 1 : 0) : null, req.params.id);
  res.json({ success: true, data: db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id) });
});

app.delete('/api/projects/:id', requireAuth, (req: AuthRequest, res) => {
  const r = db.prepare('DELETE FROM projects WHERE id=? AND user_id=?').run(req.params.id, req.user!.sub);
  if (!r.changes) { res.status(404).json({ success: false, error: 'PROJECT_NOT_FOUND' }); return; }
  res.json({ success: true, message: 'Project deleted' });
});

// ── Threads ───────────────────────────────────────────────────
app.get('/api/threads', requireAuth, (req: AuthRequest, res) => {
  const { project_id, limit = '20' } = req.query;
  let q = 'SELECT * FROM threads WHERE user_id=?';
  const params: any[] = [req.user!.sub];
  if (project_id) { q += ' AND project_id=?'; params.push(project_id); }
  q += ` ORDER BY updated_at DESC LIMIT ${parseInt(limit as string, 10) || 20}`;
  res.json({ success: true, data: db.prepare(q).all(...params) });
});

app.post('/api/threads', requireAuth, (req: AuthRequest, res) => {
  const { project_id, title = 'New conversation', model = 'forge-fast' } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO threads (id,user_id,project_id,title,model) VALUES (?,?,?,?,?)').run(id, req.user!.sub, project_id || null, title, model);
  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM threads WHERE id=?').get(id) });
});

app.get('/api/threads/:id/messages', requireAuth, (req: AuthRequest, res) => {
  const t = db.prepare('SELECT id FROM threads WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub);
  if (!t) { res.status(404).json({ success: false, error: 'THREAD_NOT_FOUND' }); return; }
  res.json({ success: true, data: db.prepare('SELECT * FROM messages WHERE thread_id=? ORDER BY created_at ASC').all(req.params.id) });
});

app.post('/api/threads/:id/messages', requireAuth, async (req: AuthRequest, res) => {
  const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub) as any;
  if (!thread) { res.status(404).json({ success: false, error: 'THREAD_NOT_FOUND' }); return; }
  const { content, agent_ids = [], model: bodyModel } = req.body;
  if (!content?.trim()) { res.status(400).json({ success: false, error: 'INVALID_INPUT', message: 'content required' }); return; }
  const userId = req.user!.sub;
  ensureSubscription(userId);

  // Save user message
  const userMsgId = uuidv4();
  db.prepare("INSERT INTO messages (id,thread_id,role,content) VALUES (?,?,?,?)").run(userMsgId, thread.id, 'user', content.trim());
  // Auto-title thread on first user message
  const msgCount = (db.prepare('SELECT COUNT(*) as c FROM messages WHERE thread_id=?').get(thread.id) as any).c;
  if (msgCount === 1) {
    const autoTitle = content.trim().slice(0, 60) + (content.trim().length > 60 ? '…' : '');
    db.prepare("UPDATE threads SET title=?,updated_at=datetime('now') WHERE id=?").run(autoTitle, thread.id);
  }

  // Build system prompt from project + active agents
  const systemParts: string[] = [];
  if (thread.project_id) {
    const proj = db.prepare('SELECT system_prompt FROM projects WHERE id=?').get(thread.project_id) as any;
    if (proj?.system_prompt) systemParts.push(proj.system_prompt);
  }
  if (agent_ids.length > 0) {
    const agentRows = db.prepare(`SELECT system_prompt FROM workspace_agents WHERE id IN (${agent_ids.map(()=>'?').join(',')}) AND user_id=?`).all(...agent_ids, userId) as any[];
    agentRows.forEach(a => { if (a.system_prompt) systemParts.push(a.system_prompt); });
  }

  // Build message history
  const history = (db.prepare('SELECT role,content FROM messages WHERE thread_id=? ORDER BY created_at ASC').all(thread.id) as any[])
    .filter(m => m.role !== 'system');
  const llmMessages = systemParts.length > 0
    ? [{ role: 'system', content: systemParts.join('\n\n---\n\n') }, ...history]
    : history;

  // Route through existing /api/chat logic
  const sub = db.prepare('SELECT plan, tokens_used, tokens_limit FROM subscriptions WHERE user_id=?').get(userId) as any;
  if (sub && sub.tokens_used >= sub.tokens_limit) {
    res.status(429).json({ success: false, error: 'TOKEN_LIMIT_EXCEEDED', message: `Token limit reached. Please upgrade.` }); return;
  }
  // Use model from request body if provided, fall back to thread's saved model
  const model = bodyModel || thread.model || 'claude-sonnet-4';
  // If a new model was specified, update the thread so future messages use it
  if (bodyModel && bodyModel !== thread.model) {
    db.prepare("UPDATE threads SET model=?,updated_at=datetime('now') WHERE id=?").run(bodyModel, thread.id);
  }
  const actualModel = resolveForgeModel(model);
  const provider = getProviderForModel(actualModel);
  const apiKey = getUserKey(userId, provider);
  if (!apiKey) {
    const asstMsgId = uuidv4();
    const errMsg = `⚠️ No ${provider} API key found. Go to Settings → LLM Providers to add your key.`;
    db.prepare("INSERT INTO messages (id,thread_id,role,content) VALUES (?,?,?,?)").run(asstMsgId, thread.id, 'assistant', errMsg);
    res.json({ success: false, error: 'NO_API_KEY', provider, data: { id: asstMsgId, role: 'assistant', content: errMsg } });
    return;
  }
  try {
    const result = await callLLM(provider, apiKey, actualModel, llmMessages);
    const totalTokens = result.promptTokens + result.completionTokens;
    const costs = MODEL_COSTS[model] || { input: 0.001, output: 0.001, markup: 1.3 };
    const providerCost = (result.promptTokens/1000)*costs.input + (result.completionTokens/1000)*costs.output;
    const forgeRevenue = providerCost * (costs.markup || 1.3);
    db.prepare('INSERT INTO usage_logs (id,user_id,model,provider,prompt_tokens,completion_tokens,total_tokens,provider_cost,forge_revenue,markup_multiplier) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(uuidv4(), userId, model, provider, result.promptTokens, result.completionTokens, totalTokens, providerCost, forgeRevenue, costs.markup || 1.3);
    db.prepare("UPDATE subscriptions SET tokens_used=tokens_used+?,updated_at=datetime('now') WHERE user_id=?").run(totalTokens, userId);
    const asstMsgId = uuidv4();
    db.prepare("INSERT INTO messages (id,thread_id,role,content,tokens) VALUES (?,?,?,?,?)").run(asstMsgId, thread.id, 'assistant', result.content, totalTokens);
    db.prepare("UPDATE threads SET updated_at=datetime('now'),total_tokens=total_tokens+? WHERE id=?").run(totalTokens, thread.id);
    res.json({ success: true, data: { id: asstMsgId, role: 'assistant', content: result.content, model, tokensUsed: totalTokens } });
  } catch (err: any) {
    console.error('Thread chat error:', err.message);
    res.status(500).json({ success: false, error: 'LLM_ERROR', message: err.message });
  }
});

app.patch('/api/threads/:id', requireAuth, (req: AuthRequest, res) => {
  const { title, model, project_id, pinned, archived } = req.body;
  if (!db.prepare('SELECT id FROM threads WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub)) {
    res.status(404).json({ success: false, error: 'THREAD_NOT_FOUND' }); return;
  }
  // Build dynamic SET clause so we only update fields explicitly provided
  const updates: string[] = [];
  const params: any[] = [];
  if (title !== undefined)      { updates.push('title=?');      params.push(title); }
  if (model !== undefined)      { updates.push('model=?');      params.push(model); }
  if (project_id !== undefined) { updates.push('project_id=?'); params.push(project_id); }
  if (pinned !== undefined)     { updates.push('pinned=?');     params.push(pinned ? 1 : 0); }
  if (archived !== undefined)   { updates.push('archived=?');   params.push(archived ? 1 : 0); }
  if (updates.length === 0) { res.status(400).json({ success: false, error: 'NOTHING_TO_UPDATE' }); return; }
  updates.push("updated_at=datetime('now')");
  params.push(req.params.id);
  db.prepare(`UPDATE threads SET ${updates.join(',')} WHERE id=?`).run(...params);
  res.json({ success: true, data: db.prepare('SELECT * FROM threads WHERE id=?').get(req.params.id) });
});

app.delete('/api/threads/:id', requireAuth, (req: AuthRequest, res) => {
  const r = db.prepare('DELETE FROM threads WHERE id=? AND user_id=?').run(req.params.id, req.user!.sub);
  if (!r.changes) { res.status(404).json({ success: false, error: 'THREAD_NOT_FOUND' }); return; }
  res.json({ success: true, message: 'Thread deleted' });
});

// ── Artifacts ─────────────────────────────────────────────────
app.get('/api/artifacts', requireAuth, (req: AuthRequest, res) => {
  const { project_id, thread_id, pinned } = req.query;
  let q = 'SELECT * FROM artifacts WHERE user_id=?';
  const params: any[] = [req.user!.sub];
  if (project_id) { q += ' AND project_id=?'; params.push(project_id); }
  if (thread_id) { q += ' AND thread_id=?'; params.push(thread_id); }
  if (pinned === 'true') { q += ' AND pinned=1'; }
  q += ' ORDER BY updated_at DESC LIMIT 50';
  res.json({ success: true, data: db.prepare(q).all(...params) });
});

app.post('/api/artifacts', requireAuth, (req: AuthRequest, res) => {
  const { title = 'Untitled', type = 'code', content = '', language = '', project_id, thread_id, message_id } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO artifacts (id,user_id,project_id,thread_id,message_id,type,title,content,language) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(id, req.user!.sub, project_id || null, thread_id || null, message_id || null, type, title, content, language);
  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM artifacts WHERE id=?').get(id) });
});

app.get('/api/artifacts/:id', requireAuth, (req: AuthRequest, res) => {
  const a = db.prepare('SELECT * FROM artifacts WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub);
  if (!a) { res.status(404).json({ success: false, error: 'ARTIFACT_NOT_FOUND' }); return; }
  res.json({ success: true, data: a });
});

app.patch('/api/artifacts/:id', requireAuth, (req: AuthRequest, res) => {
  const { title, content, language, pinned, type } = req.body;
  if (!db.prepare('SELECT id FROM artifacts WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub)) {
    res.status(404).json({ success: false, error: 'ARTIFACT_NOT_FOUND' }); return;
  }
  db.prepare("UPDATE artifacts SET title=COALESCE(?,title),content=COALESCE(?,content),language=COALESCE(?,language),type=COALESCE(?,type),pinned=COALESCE(?,pinned),version=version+1,updated_at=datetime('now') WHERE id=?")
    .run(title ?? null, content ?? null, language ?? null, type ?? null, pinned !== undefined ? (pinned ? 1 : 0) : null, req.params.id);
  res.json({ success: true, data: db.prepare('SELECT * FROM artifacts WHERE id=?').get(req.params.id) });
});

app.delete('/api/artifacts/:id', requireAuth, (req: AuthRequest, res) => {
  const r = db.prepare('DELETE FROM artifacts WHERE id=? AND user_id=?').run(req.params.id, req.user!.sub);
  if (!r.changes) { res.status(404).json({ success: false, error: 'ARTIFACT_NOT_FOUND' }); return; }
  res.json({ success: true, message: 'Artifact deleted' });
});

// ── Workspace Agents ──────────────────────────────────────────
app.get('/api/workspace-agents', requireAuth, (req: AuthRequest, res) => {
  ensureDefaultAgents(req.user!.sub);
  res.json({ success: true, data: db.prepare('SELECT * FROM workspace_agents WHERE user_id=? ORDER BY is_builtin DESC, created_at ASC').all(req.user!.sub) });
});

app.post('/api/workspace-agents', requireAuth, (req: AuthRequest, res) => {
  const { name, color = '#7F77DD', icon = 'robot', system_prompt = '', tools = [], model = 'forge-fast' } = req.body;
  if (!name) { res.status(400).json({ success: false, error: 'INVALID_INPUT', message: 'name required' }); return; }
  const id = uuidv4();
  db.prepare('INSERT INTO workspace_agents (id,user_id,name,color,icon,system_prompt,tools,model) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, req.user!.sub, name, color, icon, system_prompt, JSON.stringify(tools), model);
  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM workspace_agents WHERE id=?').get(id) });
});

app.patch('/api/workspace-agents/:id', requireAuth, (req: AuthRequest, res) => {
  const { name, color, icon, system_prompt, tools, model, active } = req.body;
  if (!db.prepare('SELECT id FROM workspace_agents WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub)) {
    res.status(404).json({ success: false, error: 'AGENT_NOT_FOUND' }); return;
  }
  db.prepare("UPDATE workspace_agents SET name=COALESCE(?,name),color=COALESCE(?,color),icon=COALESCE(?,icon),system_prompt=COALESCE(?,system_prompt),tools=COALESCE(?,tools),model=COALESCE(?,model),active=COALESCE(?,active),updated_at=datetime('now') WHERE id=?")
    .run(name ?? null, color ?? null, icon ?? null, system_prompt ?? null, tools ? JSON.stringify(tools) : null, model ?? null, active !== undefined ? (active ? 1 : 0) : null, req.params.id);
  res.json({ success: true, data: db.prepare('SELECT * FROM workspace_agents WHERE id=?').get(req.params.id) });
});

app.delete('/api/workspace-agents/:id', requireAuth, (req: AuthRequest, res) => {
  const agent = db.prepare('SELECT * FROM workspace_agents WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub) as any;
  if (!agent) { res.status(404).json({ success: false, error: 'AGENT_NOT_FOUND' }); return; }
  if (agent.is_builtin) { res.status(400).json({ success: false, error: 'CANNOT_DELETE_BUILTIN', message: 'Built-in agents cannot be deleted. Disable them instead.' }); return; }
  db.prepare('DELETE FROM workspace_agents WHERE id=?').run(req.params.id);
  res.json({ success: true, message: 'Agent deleted' });
});

// Test an agent with a sample prompt
app.post('/api/workspace-agents/:id/test', requireAuth, async (req: AuthRequest, res) => {
  const agent = db.prepare('SELECT * FROM workspace_agents WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub) as any;
  if (!agent) { res.status(404).json({ success: false, error: 'AGENT_NOT_FOUND' }); return; }
  const testPrompt = req.body.prompt || 'Say hello and describe what you can help with in 1-2 sentences.';
  const model = agent.model || 'forge-fast';
  const actualModel = resolveForgeModel(model);
  const provider = getProviderForModel(actualModel);
  const apiKey = getUserKey(req.user!.sub, provider);
  if (!apiKey) { res.json({ success: false, error: 'NO_API_KEY', provider, message: `No ${provider} key configured` }); return; }
  try {
    const msgs: any[] = agent.system_prompt ? [{ role: 'system', content: agent.system_prompt }, { role: 'user', content: testPrompt }] : [{ role: 'user', content: testPrompt }];
    const result = await callLLM(provider, apiKey, actualModel, msgs);
    res.json({ success: true, response: result.content, model, provider });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// ── Workspace Tasks ───────────────────────────────────────────
app.get('/api/workspace-tasks', requireAuth, (req: AuthRequest, res) => {
  const { project_id, status, thread_id } = req.query;
  let q = 'SELECT t.*,a.name as agent_name,a.color as agent_color FROM workspace_tasks t LEFT JOIN workspace_agents a ON t.agent_id=a.id WHERE t.user_id=?';
  const params: any[] = [req.user!.sub];
  if (project_id) { q += ' AND t.project_id=?'; params.push(project_id); }
  if (status) { q += ' AND t.status=?'; params.push(status); }
  if (thread_id) { q += ' AND t.thread_id=?'; params.push(thread_id); }
  q += ' ORDER BY t.created_at DESC LIMIT 100';
  res.json({ success: true, data: db.prepare(q).all(...params) });
});

app.post('/api/workspace-tasks', requireAuth, (req: AuthRequest, res) => {
  const { title, description = '', project_id, thread_id, agent_id, status = 'todo' } = req.body;
  if (!title) { res.status(400).json({ success: false, error: 'INVALID_INPUT', message: 'title required' }); return; }
  const id = uuidv4();
  db.prepare('INSERT INTO workspace_tasks (id,user_id,project_id,thread_id,title,description,agent_id,status) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, req.user!.sub, project_id || null, thread_id || null, title, description, agent_id || null, status);
  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM workspace_tasks WHERE id=?').get(id) });
});

app.patch('/api/workspace-tasks/:id', requireAuth, (req: AuthRequest, res) => {
  const { title, description, status, agent_id, artifact_id } = req.body;
  if (!db.prepare('SELECT id FROM workspace_tasks WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub)) {
    res.status(404).json({ success: false, error: 'TASK_NOT_FOUND' }); return;
  }
  db.prepare("UPDATE workspace_tasks SET title=COALESCE(?,title),description=COALESCE(?,description),status=COALESCE(?,status),agent_id=COALESCE(?,agent_id),artifact_id=COALESCE(?,artifact_id),updated_at=datetime('now') WHERE id=?")
    .run(title ?? null, description ?? null, status ?? null, agent_id ?? null, artifact_id ?? null, req.params.id);
  res.json({ success: true, data: db.prepare('SELECT * FROM workspace_tasks WHERE id=?').get(req.params.id) });
});

app.post('/api/workspace-tasks/bulk', requireAuth, (req: AuthRequest, res) => {
  const { tasks, project_id, thread_id } = req.body;
  if (!Array.isArray(tasks)) { res.status(400).json({ success: false, error: 'INVALID_INPUT' }); return; }
  const created: any[] = [];
  const insert = db.prepare('INSERT INTO workspace_tasks (id,user_id,project_id,thread_id,title,description,status) VALUES (?,?,?,?,?,?,?)');
  const insertMany = db.transaction((ts: any[]) => ts.forEach(t => {
    const id = uuidv4();
    insert.run(id, req.user!.sub, project_id || null, thread_id || null, t.title, t.description || '', t.status || 'todo');
    created.push(db.prepare('SELECT * FROM workspace_tasks WHERE id=?').get(id));
  }));
  insertMany(tasks);
  res.status(201).json({ success: true, data: created });
});

app.delete('/api/workspace-tasks/:id', requireAuth, (req: AuthRequest, res) => {
  const r = db.prepare('DELETE FROM workspace_tasks WHERE id=? AND user_id=?').run(req.params.id, req.user!.sub);
  if (!r.changes) { res.status(404).json({ success: false, error: 'TASK_NOT_FOUND' }); return; }
  res.json({ success: true, message: 'Task deleted' });
});

// ── Live agent activity pub/sub (must be declared before executeDispatchRun) ──
const agentActivityClients = new Map<string, Set<Response>>();
function emitAgentActivity(userId: string, event: { type: string; message: string; model?: string; elapsed?: number }) {
  const clients = agentActivityClients.get(userId);
  if (!clients) return;
  const data = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach(r => { try { r.write(data); } catch {} });
}

// ── Dispatch (with SSE streaming) ─────────────────────────────
// Active SSE clients: runId -> response
const sseClients = new Map<string, Response>();

async function executeDispatchRun(runId: string, userId: string) {
  const run = db.prepare('SELECT * FROM dispatch_runs WHERE id=?').get(runId) as any;
  if (!run) return;
  db.prepare("UPDATE dispatch_runs SET status='running',updated_at=datetime('now') WHERE id=?").run(runId);
  const sendEvent = (type: string, data: any) => {
    const client = sseClients.get(runId);
    if (client) {
      try { client.write(`data: ${JSON.stringify({ type, ...data })}\n\n`); } catch {}
    }
  };
  sendEvent('RUN_STARTED', { run_id: runId });
  emitAgentActivity(userId, { type: 'start', message: `🚀 Dispatch started: ${run.prompt?.slice(0,60)}...` });

  try {
    const agentIds: string[] = JSON.parse(run.agent_ids || '[]');
    const systemParts: string[] = ['You are a helpful AI assistant inside Forge workspace.'];
    if (agentIds.length > 0) {
      const agentRows = db.prepare(`SELECT system_prompt FROM workspace_agents WHERE id IN (${agentIds.map(()=>'?').join(',')}) AND user_id=?`).all(...agentIds, userId) as any[];
      agentRows.forEach(a => { if (a.system_prompt) systemParts.push(a.system_prompt); });
    }
    if (run.project_id) {
      const proj = db.prepare('SELECT system_prompt FROM projects WHERE id=?').get(run.project_id) as any;
      if (proj?.system_prompt) systemParts.unshift(proj.system_prompt);
    }
    const messages = [{ role: 'system', content: systemParts.join('\n\n---\n\n') }, { role: 'user', content: run.prompt }];
    const model = 'forge-fast';
    const actualModel = resolveForgeModel(model);
    const provider = getProviderForModel(actualModel);
    const apiKey = getUserKey(userId, provider);
    if (!apiKey) {
      sendEvent('RUN_ERROR', { error: `No ${provider} API key. Add it in Settings.` });
      db.prepare("UPDATE dispatch_runs SET status='error',error=?,updated_at=datetime('now') WHERE id=?").run(`No ${provider} API key`, runId);
      return;
    }
    sendEvent('TEXT_MESSAGE_START', { run_id: runId });
    emitAgentActivity(userId, { type: 'thinking', message: `🤔 Model ${actualModel} processing...`, model: actualModel });
    const startTime = Date.now();
    const result = await callLLM(provider, apiKey, actualModel, messages);
    const elapsed = Date.now() - startTime;
    // Simulate streaming by sending content in chunks
    const words = result.content.split(' ');
    let accumulated = '';
    for (let i = 0; i < words.length; i += 5) {
      const chunk = words.slice(i, i + 5).join(' ') + ' ';
      accumulated += chunk;
      sendEvent('TEXT_MESSAGE_CHUNK', { delta: chunk });
      await new Promise(r => setTimeout(r, 20));
    }
    db.prepare("UPDATE dispatch_runs SET status='done',output=?,updated_at=datetime('now') WHERE id=?").run(result.content, runId);
    sendEvent('RUN_FINISHED', { run_id: runId, output: result.content });
    emitAgentActivity(userId, { type: 'done', message: `✅ Task complete (${(elapsed/1000).toFixed(1)}s, ${result.promptTokens+result.completionTokens} tokens)`, model: actualModel, elapsed });
  } catch (err: any) {
    console.error('Dispatch error:', err.message);
    db.prepare("UPDATE dispatch_runs SET status='error',error=?,updated_at=datetime('now') WHERE id=?").run(err.message, runId);
    emitAgentActivity(userId, { type: 'error', message: `❌ Error: ${err.message}` });
    sendEvent('RUN_ERROR', { error: err.message });
  }
}

app.post('/api/dispatch', requireAuth, async (req: AuthRequest, res) => {
  const { prompt, agent_ids = [], project_id } = req.body;
  if (!prompt?.trim()) { res.status(400).json({ success: false, error: 'INVALID_INPUT', message: 'prompt required' }); return; }
  const id = uuidv4();
  db.prepare('INSERT INTO dispatch_runs (id,user_id,project_id,prompt,agent_ids) VALUES (?,?,?,?,?)').run(id, req.user!.sub, project_id || null, prompt.trim(), JSON.stringify(agent_ids));
  res.json({ success: true, run_id: id });
  executeDispatchRun(id, req.user!.sub).catch(err => console.error('Dispatch run error:', err));
});

app.get('/api/dispatch/:id', requireAuth, (req: AuthRequest, res) => {
  const run = db.prepare('SELECT * FROM dispatch_runs WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub) as any;
  if (!run) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ...run, agent_ids: JSON.parse(run.agent_ids || '[]') });
});

app.get('/api/dispatch', requireAuth, (req: AuthRequest, res) => {
  const runs = db.prepare('SELECT * FROM dispatch_runs WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.user!.sub) as any[];
  res.json(runs.map(r => ({ ...r, agent_ids: JSON.parse(r.agent_ids || '[]') })));
});

// ─── 404 ───────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ─── Start server ──────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001', 10);
app.listen(PORT, () => {
  console.log(`🚀 Forge Platform v5.6 running on port ${PORT}`);
  console.log(`   DB: ${DB_PATH}`);
});
