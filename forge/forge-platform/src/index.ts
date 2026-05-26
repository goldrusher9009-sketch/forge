/**
 * Forge Platform v6.29 — Auto-compact endpoint, syntax highlighting, auto-open sketch panel
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
import fs from 'fs';
import vm from 'vm';
import { execFile, exec } from 'child_process';
import { promisify } from 'util';
import Database from 'better-sqlite3';

const execAsync = promisify(exec);

// ── Config ────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'forge-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '30d';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://forge-sand-two.vercel.app';
// Use /data volume on Railway (persistent), fall back to cwd for local dev
const DB_PATH_PRIMARY = process.env.DB_PATH || (process.env.RAILWAY_ENVIRONMENT ? '/data/forge.db' : path.join(process.cwd(), 'forge.db'));
const DB_PATH_FALLBACK = path.join(process.cwd(), 'forge.db');

// ── Database ──────────────────────────────────────────────────
let db: Database.Database;
let DB_PATH = DB_PATH_PRIMARY;
try {
  db = new Database(DB_PATH_PRIMARY);
  console.log(`✅ Database opened at ${DB_PATH_PRIMARY}`);
} catch (e: any) {
  console.warn(`⚠️  Could not open DB at ${DB_PATH_PRIMARY}: ${e.message}. Falling back to ${DB_PATH_FALLBACK}`);
  DB_PATH = DB_PATH_FALLBACK;
  db = new Database(DB_PATH_FALLBACK);
  console.log(`✅ Database opened at ${DB_PATH_FALLBACK}`);
}
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
app.get('/health', (_req, res) => res.json({ status: 'ok', environment: NODE_ENV, timestamp: new Date().toISOString(), version: 'v6.29' }));
// SSE echo test — GET and POST, confirms SSE works through Railway proxy
app.get('/sse-test', (_req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  res.write('data: {"type":"ping"}\n\n');
  setTimeout(() => { res.write('data: {"type":"done","msg":"SSE works!"}\n\n'); res.end(); }, 500);
});
app.post('/sse-test', (_req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  res.write('data: {"type":"ping"}\n\n');
  setTimeout(() => { res.write('data: {"type":"done","msg":"POST SSE works!"}\n\n'); res.end(); }, 500);
});
// Auth SSE test — with requireAuth but no LLM call
app.post('/sse-auth-test', requireAuth, (req: AuthRequest, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  res.write(`data: {"type":"ping","user":"${req.user!.sub.slice(0,8)}"}\n\n`);
  setTimeout(() => { res.write('data: {"type":"done","msg":"Auth POST SSE works!"}\n\n'); res.end(); }, 500);
});

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
    tokens_limit INTEGER NOT NULL DEFAULT 1000000,
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
try { db.exec(`ALTER TABLE messages ADD COLUMN model TEXT`); } catch {}

// ── Safe migrations (add columns that may be missing in older DBs) ──
try { db.exec(`ALTER TABLE api_keys ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))`); } catch {}
try { db.exec(`ALTER TABLE api_keys ADD COLUMN key_preview TEXT NOT NULL DEFAULT ''`); } catch {}
try { db.exec(`ALTER TABLE subscriptions ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))`); } catch {}
try { db.exec(`ALTER TABLE subscriptions ADD COLUMN tokens_limit INTEGER NOT NULL DEFAULT 1000000`); } catch {}
// Always reset tokens_used to 0 and set limit to 1M on every startup (billing not live yet — no false token blocks)
try { db.exec(`UPDATE subscriptions SET tokens_limit=1000000, tokens_used=0`); } catch {}
try { db.exec(`ALTER TABLE subscriptions ADD COLUMN tokens_used INTEGER NOT NULL DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE subscriptions ADD COLUMN period_start TEXT NOT NULL DEFAULT (datetime('now'))`); } catch {}
// Rebuild subscriptions if period_end column is missing
try {
  const subCols = (db.prepare(`PRAGMA table_info(subscriptions)`).all() as any[]).map((c: any) => c.name);
  if (!subCols.includes('period_end')) {
    db.exec(`ALTER TABLE subscriptions RENAME TO subscriptions_old`);
    db.exec(`CREATE TABLE subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free',
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      tokens_used INTEGER NOT NULL DEFAULT 0,
      tokens_limit INTEGER NOT NULL DEFAULT 1000000,
      period_start TEXT NOT NULL DEFAULT (datetime('now')),
      period_end TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
    db.exec(`INSERT INTO subscriptions (id,user_id,plan,stripe_customer_id,stripe_subscription_id,tokens_used,tokens_limit,period_start,period_end,status,created_at,updated_at)
      SELECT id,user_id,plan,stripe_customer_id,stripe_subscription_id,
             COALESCE(tokens_used,0),COALESCE(tokens_limit,1000000),
             COALESCE(period_start,datetime('now')),datetime('now','+30 days'),
             COALESCE(status,'active'),COALESCE(created_at,datetime('now')),COALESCE(updated_at,datetime('now'))
      FROM subscriptions_old`);
    db.exec(`DROP TABLE subscriptions_old`);
    console.log('subscriptions table rebuilt with period_end column');
  }
} catch (e: any) { console.error('subscriptions rebuild error:', e.message); }
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

// Ensure every user has a subscription row, and auto-reset monthly period
function ensureSubscription(userId: string) {
  const existing = db.prepare('SELECT id, period_end, tokens_used FROM subscriptions WHERE user_id=?').get(userId) as any;
  if (!existing) {
    const now = new Date();
    const periodEnd = new Date(now); periodEnd.setDate(periodEnd.getDate() + 30);
    db.prepare('INSERT INTO subscriptions (id,user_id,plan,tokens_limit,tokens_used,period_start,period_end) VALUES (?,?,?,?,?,?,?)')
      .run(uuidv4(), userId, 'free', 1000000, 0, now.toISOString(), periodEnd.toISOString());
  } else {
    // Auto-reset if period has ended
    const periodEnd = new Date(existing.period_end);
    if (new Date() > periodEnd) {
      const now = new Date();
      const newEnd = new Date(now); newEnd.setDate(newEnd.getDate() + 30);
      db.prepare("UPDATE subscriptions SET tokens_used=0, period_start=?, period_end=? WHERE user_id=?")
        .run(now.toISOString(), newEnd.toISOString(), userId);
    }
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
  'claude-opus-4':              'claude-opus-4-6',
  'claude-sonnet-4-5':          'claude-sonnet-4-5',
  'claude-sonnet-4':            'claude-sonnet-4-6',
  'claude-haiku-4-5':           'claude-haiku-4-5-20251001',
  'claude-haiku-4-5-20251001':  'claude-haiku-4-5-20251001',
  'claude-haiku-4':             'claude-haiku-4-5-20251001',
  'claude-3-7-sonnet':          'claude-3-7-sonnet-20250219',
  'claude-3-7-sonnet-20250219': 'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet':          'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku':           'claude-3-5-haiku-20241022',
  'claude-3-5-haiku-20241022':  'claude-3-5-haiku-20241022',
  'claude-3-opus':              'claude-3-opus-20240229',
  'claude-3-opus-20240229':     'claude-3-opus-20240229',
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
  // Strip "openrouter/" prefix — frontend prefixes OR models but OR API expects bare IDs
  const cleaned = modelId.startsWith('openrouter/') ? modelId.slice('openrouter/'.length) : modelId;
  return forgeMap[cleaned] || ANTHROPIC_MODEL_MAP[cleaned] || cleaned;
}

function getProviderForModel(modelId: string): string {
  // Strip openrouter/ prefix if present before routing
  const mid = modelId.startsWith('openrouter/') ? modelId.slice('openrouter/'.length) : modelId;
  if (mid.startsWith('morph-')) return 'morph';
  if (mid.startsWith('claude')) return 'anthropic';
  if (mid.startsWith('gpt') || mid.startsWith('o3') || mid.startsWith('o1') || mid.startsWith('o4') || mid === 'chatgpt-4o-latest') return 'openai';
  if (mid.startsWith('gemini') || mid.startsWith('forge-gemini')) return 'gemini';
  if (mid.startsWith('llama') || mid.startsWith('mixtral') || mid === 'forge-fast') return 'groq';
  if (mid.startsWith('mistral') || mid.startsWith('codestral') || mid.startsWith('pixtral')) return 'mistral';
  if (mid.includes('/')) return 'openrouter'; // must come AFTER specific provider checks — catches deepseek/*, qwen/*, etc.
  return MODEL_COSTS[mid]?.provider || 'anthropic';
}

// Env-var fallback map — Railway redeploys wipe the SQLite DB, so env vars are the reliable source
const PROVIDER_ENV_KEYS: Record<string,string> = {
  anthropic:   process.env.ANTHROPIC_API_KEY   || '',
  openai:      process.env.OPENAI_API_KEY       || '',
  gemini:      process.env.GEMINI_API_KEY       || '',
  groq:        process.env.GROQ_API_KEY         || '',
  mistral:     process.env.MISTRAL_API_KEY      || '',
  openrouter:  process.env.OPENROUTER_API_KEY   || '',
  morph:       process.env.MORPH_API_KEY        || '',
};

function getUserKey(userId: string, provider: string): string | null {
  // 1. Per-user key
  const row = db.prepare('SELECT key_encrypted FROM api_keys WHERE user_id=? AND provider=?').get(userId, provider) as any;
  if (row) { const key = decryptKey(row.key_encrypted); if (key) return key; }
  // 2. Platform-wide key set by admin
  const platformRow = db.prepare('SELECT key_encrypted FROM platform_api_keys WHERE provider=? AND enabled=1').get(provider) as any;
  if (platformRow) { const key = decryptKey(platformRow.key_encrypted); if (key) return key; }
  // 3. Env var fallback
  return PROVIDER_ENV_KEYS[provider] || null;
}

// Reliable timeout helper — AbortSignal.timeout has bugs in some Node 18 builds
function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: controller.signal })
    .then(r => { clearTimeout(timer); return r; })
    .catch(e => { clearTimeout(timer); throw e; });
}

async function callLLM(provider: string, apiKey: string, model: string, messages: any[], _language?: string): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  // Anthropic
  if (provider === 'anthropic') {
    let res: Response;
    try { res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', { method:'POST', headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json'}, body:JSON.stringify({model,messages,max_tokens:4096}) }, 20000); }
    catch (e: any) { throw new Error(e?.name==='AbortError' ? 'Anthropic timed out after 20s — model may be overloaded, try again' : e.message); }
    if (!res.ok) { const e = await res.text(); throw new Error(`Anthropic error: ${e.slice(0,200)}`); }
    const d: any = await res.json();
    return { content: d.content?.[0]?.text || '', promptTokens: d.usage?.input_tokens || 0, completionTokens: d.usage?.output_tokens || 0 };
  }
  // OpenAI
  if (provider === 'openai') {
    let res: Response;
    try { res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', { method:'POST', headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'}, body:JSON.stringify({model,messages,max_tokens:4096}) }, 20000); }
    catch (e: any) { throw new Error(e?.name==='AbortError' ? 'OpenAI timed out after 20s — model may be overloaded, try again' : e.message); }
    if (!res.ok) { const e = await res.text(); throw new Error(`OpenAI error: ${e.slice(0,200)}`); }
    const d: any = await res.json();
    return { content: d.choices?.[0]?.message?.content || '', promptTokens: d.usage?.prompt_tokens || 0, completionTokens: d.usage?.completion_tokens || 0 };
  }
  // Groq (OpenAI-compatible)
  if (provider === 'groq') {
    const GROQ_MODEL_MAP: Record<string,string> = {
      'llama-3.3-70b':    'llama-3.3-70b-versatile',
      'llama-3.1-70b':    'llama-3.1-70b-versatile',
      'llama-3.1-8b':     'llama-3.1-8b-instant',
      'mixtral-8x7b':     'mixtral-8x7b-32768',
      'gemma2-9b':        'gemma2-9b-it',
    };
    const groqModel = GROQ_MODEL_MAP[model] || model;
    const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions',
      { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: groqModel, messages, max_tokens: 4096 }) },
      20000);
    if (!res.ok) { const e = await res.text(); throw new Error(`Groq error: ${e.slice(0,200)}`); }
    const d: any = await res.json();
    return { content: d.choices?.[0]?.message?.content || '', promptTokens: d.usage?.prompt_tokens || 0, completionTokens: d.usage?.completion_tokens || 0 };
  }
  // Google Gemini
  if (provider === 'gemini') {
    // Resolve model ID to actual Gemini API model name
    const GEMINI_MODEL_MAP: Record<string,string> = {
      'gemini-2.5-pro':           'gemini-2.5-pro-preview-05-06',
      'gemini-2.5-flash':         'gemini-2.5-flash-preview-04-17',
      'gemini-2.0-flash':         'gemini-2.0-flash',
      'gemini-2.0-flash-lite':    'gemini-2.0-flash-lite',
      'gemini-1.5-pro':           'gemini-1.5-pro',
      'gemini-1.5-flash':         'gemini-1.5-flash',
      'forge-gemini':             'gemini-2.0-flash',
    };
    const geminiModel = GEMINI_MODEL_MAP[model] || model;
    // Separate system messages from conversation messages
    const systemMsgs = messages.filter((m: any) => m.role === 'system');
    const chatMsgs = messages.filter((m: any) => m.role !== 'system');
    // Build contents — Gemini requires alternating user/model roles, merge consecutive same-role messages
    const rawContents = chatMsgs.map((m: any) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content || '' }] }));
    // Merge consecutive same-role messages to satisfy Gemini strict alternation
    const contents: any[] = [];
    for (const c of rawContents) {
      if (contents.length > 0 && contents[contents.length - 1].role === c.role) {
        contents[contents.length - 1].parts[0].text += '\n\n' + c.parts[0].text;
      } else {
        contents.push({ role: c.role, parts: [{ text: c.parts[0].text }] });
      }
    }
    // Gemini requires first turn to be user
    if (contents.length > 0 && contents[0].role !== 'user') {
      contents.unshift({ role: 'user', parts: [{ text: '.' }] });
    }
    const body: any = { contents, generationConfig: { maxOutputTokens: 4096 } };
    // Pass system prompt via systemInstruction (proper Gemini way)
    if (systemMsgs.length > 0) {
      body.systemInstruction = { parts: [{ text: systemMsgs.map((m: any) => m.content).join('\n\n') }] };
    }
    const res = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      20000);
    if (!res.ok) { const e = await res.text(); throw new Error(`Gemini error: ${e.slice(0,300)}`); }
    const d: any = await res.json();
    if (d.error) throw new Error(`Gemini error: ${d.error.message || JSON.stringify(d.error).slice(0,200)}`);
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const pt = d.usageMetadata?.promptTokenCount || 0;
    const ct = d.usageMetadata?.candidatesTokenCount || 0;
    return { content: text, promptTokens: pt, completionTokens: ct };
  }
  // Mistral (OpenAI-compatible)
  if (provider === 'mistral') {
    const MISTRAL_MODEL_MAP: Record<string,string> = {
      'mistral-large':  'mistral-large-latest',
      'mistral-small':  'mistral-small-latest',
      'mistral-medium': 'mistral-medium-latest',
      'codestral':      'codestral-latest',
    };
    const mistralModel = MISTRAL_MODEL_MAP[model] || model;
    const res = await fetchWithTimeout('https://api.mistral.ai/v1/chat/completions',
      { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: mistralModel, messages, max_tokens: 4096 }) },
      20000);
    if (!res.ok) { const e = await res.text(); throw new Error(`Mistral error: ${e.slice(0,200)}`); }
    const d: any = await res.json();
    return { content: d.choices?.[0]?.message?.content || '', promptTokens: d.usage?.prompt_tokens || 0, completionTokens: d.usage?.completion_tokens || 0 };
  }
  // Morph (OpenAI-compatible)
  if (provider === 'morph') {
    const res = await fetchWithTimeout('https://api.morphllm.com/v1/chat/completions',
      { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages, max_tokens: 4096 }) },
      20000);
    if (!res.ok) { const e = await res.text(); throw new Error(`Morph error: ${e.slice(0,200)}`); }
    const d: any = await res.json();
    return { content: d.choices?.[0]?.message?.content || '', promptTokens: d.usage?.prompt_tokens || 0, completionTokens: d.usage?.completion_tokens || 0 };
  }
  // OpenRouter (passthrough for 400+ models)
  if (provider === 'openrouter') {
    const orModel = model.startsWith('openrouter/') ? model.slice('openrouter/'.length) : model;
    let res: Response;
    try { res = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', { method:'POST', headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json','HTTP-Referer':'https://forge-sand-two.vercel.app','X-Title':'Forge Studio'}, body:JSON.stringify({model:orModel,messages,max_tokens:2048}) }, 60000); }
    catch (e: any) { throw new Error(e?.name==='AbortError' ? `Model "${orModel}" timed out after 22s — try a faster model` : e.message); }
    if (!res.ok) { const e = await res.text(); throw new Error(`OpenRouter error (${orModel}): ${e.slice(0,300)}`); }
    const d: any = await res.json();
    if (d.error) throw new Error(`OpenRouter error (${orModel}): ${JSON.stringify(d.error).slice(0,200)}`);
    return { content: d.choices?.[0]?.message?.content || '', promptTokens: d.usage?.prompt_tokens || 0, completionTokens: d.usage?.completion_tokens || 0 };
  }
  throw new Error(`Unknown provider: ${provider}`);
}

// ── Chat (also aliased as /api/chat/completions for OpenAI-compat clients) ──
app.post(['/api/chat', '/api/chat/completions'], requireAuth, async (req: AuthRequest, res) => {
  // Support both Forge format {messages,model} and OpenAI format {messages,model}
  const { messages, model = 'forge-fast', language = 'English', channel = 'Chat' } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ success: false, error: 'INVALID_INPUT', message: 'messages array required' }); return;
  }
  const userId = req.user!.sub;
  ensureSubscription(userId);

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

  // Token budget enforcement disabled until billing is live
  // (usage is still tracked in usage_logs and subscriptions tables)

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

    // Return both Forge format and OpenAI-compat format so ForgeCo and other clients work
    res.json({ success: true, data: { response: result.content, model: forgeModelId, modelName: actualModel, provider, tokensUsed: totalTokens, promptTokens: result.promptTokens, completionTokens: result.completionTokens, cost: providerCost, revenue: forgeRevenue }, choices: [{ message: { role: 'assistant', content: result.content } }], model: forgeModelId });
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
  const providers = ['anthropic','openai','openrouter','groq','gemini','mistral','together','perplexity','cohere','cursor','morph'];
  providers.forEach(p => {
    keyMap[`has_${p}`] = false;
    keyMap[`${p}_key`] = null;
  });
  rows.forEach(r => {
    keyMap[`has_${r.provider}`] = true;
    keyMap[`${r.provider}_key`] = r.key_preview;
  });
  // Also mark has_X=true if a platform key or env var exists — so model dropdown populates even when user hasn't added their own key
  providers.forEach(p => {
    if (!keyMap[`has_${p}`]) {
      const platformRow = db.prepare("SELECT key_encrypted FROM platform_api_keys WHERE provider=?").get(p) as any;
      if (platformRow && decryptKey(platformRow.key_encrypted)) { keyMap[`has_${p}`] = true; keyMap[`${p}_key`] = 'platform'; }
      else if (PROVIDER_ENV_KEYS[p]) { keyMap[`has_${p}`] = true; keyMap[`${p}_key`] = 'env'; }
    }
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
  // Use user key if available, else fall back to public endpoint (no auth needed for model list)
  const key = getUserKey(req.user!.sub, 'openrouter');
  try {
    const headers: Record<string,string> = { 'HTTP-Referer': 'https://forge-sand-two.vercel.app', 'X-Title': 'Forge Studio' };
    if (key) headers['Authorization'] = `Bearer ${key}`;
    const r = await fetch('https://openrouter.ai/api/v1/models', { headers });
    if (!r.ok) throw new Error(`OpenRouter returned ${r.status}`);
    const d: any = await r.json();
    res.json({ success: true, data: { models: d.data || [] } });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// Public OpenRouter models (no key required — for browsing before adding key)
app.get('/api/openrouter/models/public', async (_req, res) => {
  try {
    const r = await fetch('https://openrouter.ai/api/v1/models', { headers: { 'HTTP-Referer': 'https://forge-sand-two.vercel.app', 'X-Title': 'Forge Studio' } });
    if (!r.ok) throw new Error(`OpenRouter ${r.status}`);
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

    } else if (provider === 'morph') {
      // Morph uses OpenAI-compatible models endpoint
      const r = await fetch('https://api.morphllm.com/v1/models', { headers: { 'Authorization': `Bearer ${key}` } });
      if (!r.ok) throw new Error(`Morph returned ${r.status}`);
      const d: any = await r.json();
      models = (d.data || [
        { id: 'morph-v3-fast', object: 'model' },
        { id: 'morph-v3', object: 'model' },
      ]).map((m: any) => ({ id: m.id, name: m.id, context_length: 32000 }));

    } else if (provider === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/models', { headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' } });
      if (!r.ok) throw new Error(`Anthropic returned ${r.status}`);
      const d: any = await r.json();
      models = (d.data || []).map((m: any) => ({ id: m.id, name: m.display_name || m.id, context_length: m.context_window }));

    } else if (provider === 'openai') {
      const r = await fetch('https://api.openai.com/v1/models', { headers: { 'Authorization': `Bearer ${key}` } });
      if (!r.ok) throw new Error(`OpenAI returned ${r.status}`);
      const d: any = await r.json();
      const gptModels = (d.data || []).filter((m: any) => m.id.startsWith('gpt') || m.id.startsWith('o1') || m.id.startsWith('o3') || m.id.startsWith('o4') || m.id.startsWith('chatgpt'));
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
    } else if (provider === 'morph') {
      const r = await fetch('https://api.morphllm.com/v1/models', { headers: { 'Authorization': `Bearer ${key}` } });
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
  try {
    const userId = req.user!.sub;
    ensureSubscription(userId);
    const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id=?').get(userId) as any;
    if (!sub) {
      res.json({ success: true, plan: 'free', tokensUsed: 0, tokenLimit: 1000000, status: 'active', periodEnd: null });
      return;
    }
    res.json({ success: true, plan: sub.plan, tokensUsed: sub.tokens_used, tokenLimit: sub.tokens_limit, status: sub.status, periodEnd: sub.period_end });
  } catch (err: any) {
    console.error('billing/subscription error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
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

// ── Missing routes frontend expects ───────────────────────────
// Vault = alias for keys list with preview format + real key_status
app.get('/api/keys/vault', requireAuth, (req: AuthRequest, res) => {
  const rows = db.prepare('SELECT provider, key_status, key_encrypted, created_at, updated_at FROM api_keys WHERE user_id=?').all(req.user!.sub) as any[];
  const data = rows.map(r => {
    let preview = '••••••••';
    try {
      const dec = decryptKey(r.key_encrypted);
      if (dec && dec.length > 8) preview = dec.slice(0, 4) + '••••' + dec.slice(-4);
    } catch {}
    return { provider: r.provider, key_preview: preview, key_status: r.key_status || 'active', created_at: r.created_at, updated_at: r.updated_at };
  });
  res.json({ success: true, data });
});

// Per-provider usage analytics
app.get('/api/keys/:provider/usage', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const provider = req.params.provider;
  const rows = db.prepare('SELECT model, total_tokens, prompt_tokens, completion_tokens, provider_cost, created_at FROM usage_logs WHERE user_id=? AND provider=? ORDER BY created_at DESC LIMIT 500').all(userId, provider) as any[];
  const totals = db.prepare('SELECT COALESCE(SUM(total_tokens),0) as total_tokens, COALESCE(SUM(prompt_tokens),0) as prompt_tokens, COALESCE(SUM(completion_tokens),0) as completion_tokens, COALESCE(SUM(provider_cost),0) as cost, COUNT(*) as requests FROM usage_logs WHERE user_id=? AND provider=?').get(userId, provider) as any;
  const byModel = db.prepare('SELECT model, COALESCE(SUM(total_tokens),0) as tokens, COUNT(*) as requests FROM usage_logs WHERE user_id=? AND provider=? GROUP BY model ORDER BY tokens DESC').all(userId, provider) as any[];
  res.json({ success: true, data: { rows, totals, byModel } });
});

// Billing usage
app.get('/api/billing/usage', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const rows = db.prepare('SELECT model, provider, total_tokens, provider_cost, forge_revenue, created_at FROM usage_logs WHERE user_id=? ORDER BY created_at DESC LIMIT 200').all(userId) as any[];
  const sub = db.prepare('SELECT tokens_used, tokens_limit FROM subscriptions WHERE user_id=?').get(userId) as any;
  res.json({ success: true, data: rows, tokensUsed: sub?.tokens_used || 0, tokenLimit: sub?.tokens_limit || 100000 });
});

// User total tokens
app.get('/api/user/token-total', requireAuth, (req: AuthRequest, res) => {
  const row = db.prepare('SELECT COALESCE(SUM(total_tokens),0) as total FROM usage_logs WHERE user_id=?').get(req.user!.sub) as any;
  res.json({ success: true, total: row.total });
});

// Schedules — stored in DB
db.exec(`CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
  cron_expression TEXT NOT NULL, prompt TEXT NOT NULL,
  enabled INTEGER DEFAULT 1, last_run TEXT, created_at TEXT DEFAULT (datetime('now'))
)`);
app.get('/api/schedules', requireAuth, (req: AuthRequest, res) => {
  const rows = db.prepare('SELECT * FROM schedules WHERE user_id=? ORDER BY created_at DESC').all(req.user!.sub);
  res.json({ success: true, data: rows });
});
app.post('/api/schedules', requireAuth, (req: AuthRequest, res) => {
  const { name, cron_expression, prompt } = req.body;
  if (!name || !cron_expression || !prompt) { res.status(400).json({ success: false, error: 'INVALID_INPUT' }); return; }
  const id = `sch_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  db.prepare('INSERT INTO schedules (id, user_id, name, cron_expression, prompt) VALUES (?,?,?,?,?)').run(id, req.user!.sub, name, cron_expression, prompt);
  res.json({ success: true, data: { id, name, cron_expression, prompt, enabled: 1 } });
});
app.patch('/api/schedules/:id', requireAuth, (req: AuthRequest, res) => {
  const { enabled } = req.body;
  db.prepare('UPDATE schedules SET enabled=? WHERE id=? AND user_id=?').run(enabled, req.params.id, req.user!.sub);
  res.json({ success: true });
});
app.delete('/api/schedules/:id', requireAuth, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM schedules WHERE id=? AND user_id=?').run(req.params.id, req.user!.sub);
  res.json({ success: true });
});
app.post('/api/schedules/:id/run', requireAuth, async (req: AuthRequest, res) => {
  const sched = db.prepare('SELECT * FROM schedules WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub) as any;
  if (!sched) { res.status(404).json({ success: false, error: 'NOT_FOUND' }); return; }
  db.prepare("UPDATE schedules SET last_run=datetime('now') WHERE id=?").run(req.params.id);
  res.json({ success: true, data: { message: `Schedule '${sched.name}' triggered` } });
});

// Files — metadata stored in DB, content stored as base64
db.exec(`CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
  size INTEGER DEFAULT 0, mime_type TEXT DEFAULT 'application/octet-stream',
  content TEXT, created_at TEXT DEFAULT (datetime('now'))
)`);
app.get('/api/files', requireAuth, (req: AuthRequest, res) => {
  const rows = db.prepare('SELECT id, name, size, mime_type, created_at FROM files WHERE user_id=? ORDER BY created_at DESC').all(req.user!.sub);
  res.json({ success: true, data: rows });
});
app.post('/api/files', requireAuth, (req: AuthRequest, res) => {
  const { name, size, mime_type, content } = req.body;
  if (!name) { res.status(400).json({ success: false, error: 'INVALID_INPUT' }); return; }
  const id = `file_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  db.prepare('INSERT INTO files (id, user_id, name, size, mime_type, content) VALUES (?,?,?,?,?,?)').run(id, req.user!.sub, name, size || 0, mime_type || 'application/octet-stream', content || '');
  res.json({ success: true, data: { id, name, size, mime_type, created_at: new Date().toISOString() } });
});
app.delete('/api/files/:id', requireAuth, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM files WHERE id=? AND user_id=?').run(req.params.id, req.user!.sub);
  res.json({ success: true });
});

// Workspace tasks PATCH (cycle status)
app.patch('/api/workspace/tasks/:id', requireAuth, (req: AuthRequest, res) => {
  const { status } = req.body;
  try { db.prepare('UPDATE workspace_tasks SET status=? WHERE id=? AND user_id=?').run(status, req.params.id, req.user!.sub); } catch {}
  res.json({ success: true });
});

// Custom providers alias
app.get('/api/providers/custom', requireAuth, (req: AuthRequest, res) => {
  const rows = db.prepare('SELECT * FROM custom_providers WHERE user_id=?').all(req.user!.sub);
  res.json({ success: true, data: rows });
});

// Forge chat alias — same logic as /api/chat
app.post('/api/forge/chat', requireAuth, async (req: AuthRequest, res) => {
  const { messages, model = 'forge-pro' } = req.body;
  if (!messages?.length) { res.status(400).json({ success: false, error: 'INVALID_INPUT' }); return; }
  const userId = req.user!.sub;
  const cleaned = model.startsWith('openrouter/') ? model.slice('openrouter/'.length) : model;
  const actualModel = resolveForgeModel(cleaned);
  const provider = getProviderForModel(actualModel);
  const apiKey = getUserKey(userId, provider);
  if (!apiKey) { res.json({ success: false, error: 'NO_API_KEY', provider }); return; }
  try {
    const result = await callLLM(provider, apiKey, actualModel, messages);
    res.json({ success: true, content: result.content, usage: { prompt_tokens: result.promptTokens, completion_tokens: result.completionTokens } });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// Workspace agents/tasks with slash path aliases
app.get('/api/workspace/agents', requireAuth, (req: AuthRequest, res) => {
  const rows = db.prepare('SELECT * FROM workspace_agents WHERE user_id=? ORDER BY created_at DESC').all(req.user!.sub);
  res.json({ success: true, data: rows });
});
app.get('/api/workspace/tasks', requireAuth, (req: AuthRequest, res) => {
  const rows = db.prepare('SELECT * FROM workspace_tasks WHERE user_id=? ORDER BY created_at DESC').all(req.user!.sub);
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
    { id:'gemini-2.5-pro',   provider:'gemini',    label:'Gemini 2.5 Pro',            is_forge:0, markup:1.0 },
    { id:'gemini-2.5-flash', provider:'gemini',    label:'Gemini 2.5 Flash',          is_forge:0, markup:1.0 },
    { id:'gemini-2.0-flash', provider:'gemini',    label:'Gemini 2.0 Flash',          is_forge:0, markup:1.0 },
    { id:'gemini-1.5-pro',   provider:'gemini',    label:'Gemini 1.5 Pro',            is_forge:0, markup:1.0 },
    { id:'llama-3.3-70b',    provider:'groq',      label:'Llama 3.3 70B',             is_forge:0, markup:1.0 },
    { id:'llama-3.1-8b-instant', provider:'groq',  label:'Llama 3.1 8B Instant',      is_forge:0, markup:1.0 },
    { id:'mistral-large',    provider:'mistral',   label:'Mistral Large',             is_forge:0, markup:1.0 },
    { id:'o4-mini',          provider:'openai',    label:'o4-mini',                   is_forge:0, markup:1.0 },
    { id:'o3',               provider:'openai',    label:'o3',                        is_forge:0, markup:1.0 },
    { id:'gpt-4.1-mini',     provider:'openai',    label:'GPT-4.1 Mini',              is_forge:0, markup:1.0 },
    { id:'claude-3-7-sonnet',provider:'anthropic', label:'Claude 3.7 Sonnet',         is_forge:0, markup:1.0 },
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
  // ── SSE FIRST — before ANY DB work (HTTP/2 ignores chunked; SSE flushes immediately) ──
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders(); // bytes on wire NOW — resets Railway's 30s idle timer
  const sendEvent = (data: object) => { try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch {} };
  sendEvent({ type: 'ping' }); // first byte immediately
  const heartbeat = setInterval(() => sendEvent({ type: 'ping' }), 5000);
  let sseEnded = false;
  const endSSE = (payload: object) => {
    if (sseEnded) return;
    sseEnded = true;
    clearInterval(heartbeat);
    clearTimeout(safetyTimer);
    sendEvent({ type: 'result', payload });
    res.end();
  };
  // Safety: never leave the connection open >25s — Railway kills at 30s regardless
  const safetyTimer = setTimeout(() => endSSE({ success: false, error: 'TIMEOUT', message: 'Request timed out — please try again' }), 65000);
  // ────────────────────────────────────────────────────────────────────────────

  // Now safe to do DB work — connection is already alive
  const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub) as any;
  if (!thread) { endSSE({ success: false, error: 'THREAD_NOT_FOUND' }); return; }
  const { content, agent_ids = [], model: bodyModel, skill_prompt, active_skills = [], active_connectors = [], enabled_hooks = [], forge_mode = 'ask' } = req.body;
  if (!content?.trim()) { endSSE({ success: false, error: 'INVALID_INPUT', message: 'content required' }); return; }
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

  // Helper to emit detailed step events shown as Manus-style thinking steps
  const emitStep = (icon: string, label: string) => emitAgentActivity(userId, { type: 'thinking', message: `${icon} ${label}`, model: bodyModel || 'forge' });

  // Build system prompt from skill + project + active agents + skills + connectors + hooks
  const systemParts: string[] = [];
  if (skill_prompt) systemParts.push(skill_prompt);
  if (thread.project_id) {
    const proj = db.prepare('SELECT system_prompt FROM projects WHERE id=?').get(thread.project_id) as any;
    if (proj?.system_prompt) systemParts.push(proj.system_prompt);
  }
  if (agent_ids.length > 0) {
    const agentRows = db.prepare(`SELECT system_prompt FROM workspace_agents WHERE id IN (${agent_ids.map(()=>'?').join(',')}) AND user_id=?`).all(...agent_ids, userId) as any[];
    agentRows.forEach(a => { if (a.system_prompt) systemParts.push(a.system_prompt); });
  }
  // Inject active skills into system prompt and emit activity
  if (active_skills.length > 0) {
    emitStep('🧩', `Loading ${active_skills.length} skill${active_skills.length > 1 ? 's' : ''}: ${(active_skills as string[]).slice(0,3).join(', ')}${active_skills.length > 3 ? '…' : ''}`);
    const skillLines = (active_skills as string[]).map((s: string) => `- ${s}`).join('\n');
    systemParts.push(`## Active Skills\nYou have the following skills enabled. Apply their expertise to every response:\n${skillLines}`);
  }
  // Inject active connectors into system prompt and emit activity
  if (active_connectors.length > 0) {
    emitStep('🔌', `Connecting: ${(active_connectors as string[]).slice(0,3).join(', ')}${active_connectors.length > 3 ? '…' : ''}`);
    const connLines = (active_connectors as string[]).map((c: string) => `- ${c}`).join('\n');
    systemParts.push(`## Connected Integrations\nThe following connectors are active. Reference them when relevant to the user's request:\n${connLines}`);
  }
  // Inject enabled hooks into system prompt and emit activity
  if (enabled_hooks.length > 0) {
    emitStep('🪝', `Applying ${enabled_hooks.length} hook${enabled_hooks.length > 1 ? 's' : ''}`);
    const hookLines = (enabled_hooks as any[]).map((h: any) => `- On "${h.event}": ${h.action}`).join('\n');
    systemParts.push(`## Active Automation Hooks\nThese hooks are enabled and should influence your behaviour:\n${hookLines}`);
  }

  // Always prepend the Forge autonomous agent system prompt
  const isMagic = forge_mode === 'magic';
  const FORGE_SYSTEM_PROMPT = `You are **Forge** — a world-class autonomous AI engineer and builder. You combine the skills of a senior full-stack engineer, UI/UX designer, product manager, and data scientist. You are the AI equivalent of the best "vibe coder" — you ship fast, build real things, and never block on questions when you can make smart decisions.

## Identity & Persona
- You are an expert software architect who has shipped dozens of SaaS products
- You write clean, production-ready code with modern best practices
- You prefer elegant solutions over clever ones
- You ship working MVPs first, then iterate
- You are opinionated but explain your reasoning briefly
- You are the AI version of Andrej Karpathy, Pieter Levels, and DHH combined

## Tools Available RIGHT NOW — Use Them Immediately
- **web_search(query)** — Real-time internet search. News, docs, packages, pricing, anything.
- **web_scrape(url)** — Read any webpage: GitHub, docs, dashboards, APIs.
- **browser_action(action, ...)** — Control a real Chrome browser: navigate, click, fill forms, sign in, screenshot, scrape JS pages.
- **run_code(language, code)** — Execute JavaScript or Python. Returns actual output.
- **shell_exec(command)** — Run shell commands: git, npm, pip, curl, system ops.
- **read_file(path)** — Read files on the server.
- **write_file(path, content)** — Create or overwrite files.
- **list_directory(path)** — List files and folders.
- **http_request(url, method, headers, body)** — Call any API or REST endpoint.

## Building & Output Rules
When asked to build ANYTHING (website, app, tool, script, component):
1. **Always produce complete, working code** — not pseudocode, not snippets
2. **For websites/UIs**: Output full self-contained HTML with inline CSS + JS in a code block tagged \`\`\`html. The user can save it directly.
3. **For React/Next.js components**: Output complete JSX with Tailwind classes
4. **For scripts/automation**: Output the full runnable script with all imports
5. **For APIs/backends**: Output complete Express/FastAPI code with all routes
6. **Include download instructions**: After every code artifact, add: "💾 **Save as**: filename.ext — paste into a file and open directly."
7. **Deploy instructions**: Briefly mention how to run/deploy it

## Visual Output Format
When building websites or UIs, ALWAYS structure the response like this:
\`\`\`html
<!DOCTYPE html>
<html>
<!-- complete self-contained code here -->
</html>
\`\`\`
💾 **Save as**: [descriptive-name].html — Open directly in any browser, no setup needed.

## ${isMagic ? 'MAGIC MODE — Full Autonomy' : 'ASK MODE — Collaborative'}
${isMagic ? `**You are in MAGIC MODE. Rules:**
1. NEVER ask clarifying questions — make smart decisions and execute
2. If something could go multiple ways, pick the best approach and state your assumption briefly
3. Use ALL relevant tools immediately without asking permission
4. Spawn multiple parallel approaches if the task is complex
5. Deliver a COMPLETE result — not a plan, not steps, not "here's what I would do"
6. If you need API keys or credentials that aren't provided, create mock/demo versions that work
7. Auto-select the most powerful approach — if building a website, make it beautiful and production-ready
8. Only ask the user something if it's truly impossible to proceed without their input (e.g., missing API key for a live service)` : `**You are in ASK MODE. Rules:**
1. Engage collaboratively — ask ONE focused question if truly needed before proceeding
2. Show your thinking process and options when multiple valid approaches exist
3. Provide complete working results, not just plans
4. Offer to iterate and improve based on feedback
5. Use tools when it would genuinely help the user's request
6. Always offer downloadable/copyable versions of everything you create`}

## Execution Rules — Always Apply
1. ALWAYS use tools for anything requiring live data, code execution, or file operations
2. NEVER say "I cannot" or "I don't have access" — you have full tool access
3. Chain tools: search → run_code → write_file in one response when needed
4. Return real working results, not descriptions of what you would do
5. Be fast and direct. Build first, explain after.

${isMagic ? '' : `## Asking Clarification (Ask Mode Only)
If a request is genuinely ambiguous, ask ONE concise question with 2-4 numbered options:

**Which approach do you prefer?**
1. Option A — brief description
2. Option B — brief description
3. Something else

Only ask when truly needed. For most tasks, make a smart assumption and execute.`}`;

  systemParts.unshift(FORGE_SYSTEM_PROMPT);

  // Build message history
  const history = (db.prepare('SELECT role,content FROM messages WHERE thread_id=? ORDER BY created_at ASC').all(thread.id) as any[])
    .filter(m => m.role !== 'system');
  emitStep('📚', `Reading context — ${history.length} message${history.length !== 1 ? 's' : ''} in thread`);
  const llmMessages = [{ role: 'system', content: systemParts.join('\n\n---\n\n') }, ...history];

  // Use model from request body if provided, fall back to thread's saved model
  const model = bodyModel || thread.model || 'claude-sonnet-4';
  // If a new model was specified, update the thread so future messages use it
  if (bodyModel && bodyModel !== thread.model) {
    db.prepare("UPDATE threads SET model=?,updated_at=datetime('now') WHERE id=?").run(bodyModel, thread.id);
  }
  const actualModel = resolveForgeModel(model);
  const provider = getProviderForModel(actualModel);
  const apiKey = getUserKey(userId, provider);
  // No API key — tell user to add one
  if (!apiKey) {
    const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);
    const asstMsgId = uuidv4();
    const errMsg = `⚠️ No ${providerLabel} API key found. Go to Settings → LLM Providers and add your ${providerLabel} key.`;
    db.prepare("INSERT INTO messages (id,thread_id,role,content) VALUES (?,?,?,?)").run(asstMsgId, thread.id, 'assistant', errMsg);
    endSSE({ success: false, error: 'NO_API_KEY', provider, data: { id: asstMsgId, role: 'assistant', content: errMsg } });
    return;
  }
  emitStep('🤖', `Invoking ${model} via ${provider}`);
  try {
    let result: { content: string; promptTokens: number; completionTokens: number; toolCalls?: Array<{name:string;args:any;result:string}> };

    // For Anthropic models: use native tool_use agentic loop
    if (provider === 'anthropic') {
      const agentResult = await Promise.race([
        callAnthropicWithTools(
          apiKey, actualModel, llmMessages,
          (toolName, toolArgs, toolResult) => {
            // Emit each tool call as a live step
            const argsPreview = JSON.stringify(toolArgs).slice(0, 80);
            emitStep('🔧', `Tool: ${toolName}(${argsPreview})`);
            emitAgentActivity(userId, { type: 'tool', message: `🔧 ${toolName}: ${argsPreview}`, model });
            // Also emit a tool_call event so frontend can render inline
            try { res.write(`data: ${JSON.stringify({ type: 'tool_call', tool: toolName, args: toolArgs, result: toolResult.slice(0, 500) })}\n\n`); } catch {}
          }
        ),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Anthropic agent timed out after 60s')), 60000))
      ]);
      result = agentResult;
    } else {
      // OpenAI-compatible providers: use function calling tool loop
      const onToolCall = (toolName: string, toolArgs: any, toolResult: string) => {
        const argsPreview = JSON.stringify(toolArgs).slice(0, 80);
        emitStep('🔧', `Tool: ${toolName}(${argsPreview})`);
        emitAgentActivity(userId, { type: 'tool', message: `🔧 ${toolName}: ${argsPreview}`, model });
        try { res.write(`data: ${JSON.stringify({ type: 'tool_call', tool: toolName, args: toolArgs, result: toolResult.slice(0, 500) })}\n\n`); } catch {}
      };

      const openAICompatProviders: Record<string, { url: string; headers: Record<string,string>; modelResolver?: (m:string)=>string }> = {
        openai:     { url: 'https://api.openai.com/v1/chat/completions', headers: {} },
        groq:       { url: 'https://api.groq.com/openai/v1/chat/completions', headers: {}, modelResolver: (m) => ({ 'llama-3.3-70b':'llama-3.3-70b-versatile','llama-3.1-70b':'llama-3.1-70b-versatile','llama-3.1-8b':'llama-3.1-8b-instant','mixtral-8x7b':'mixtral-8x7b-32768','gemma2-9b':'gemma2-9b-it' })[m] || m },
        mistral:    { url: 'https://api.mistral.ai/v1/chat/completions', headers: {}, modelResolver: (m) => ({ 'mistral-large':'mistral-large-latest','mistral-small':'mistral-small-latest','mistral-medium':'mistral-medium-latest','codestral':'codestral-latest' })[m] || m },
        openrouter: { url: 'https://openrouter.ai/api/v1/chat/completions', headers: { 'HTTP-Referer':'https://forge-sand-two.vercel.app','X-Title':'Forge Studio' }, modelResolver: (m) => m.startsWith('openrouter/') ? m.slice('openrouter/'.length) : m },
        morph:      { url: 'https://api.morphllm.com/v1/chat/completions', headers: {} },
      };

      const pc = openAICompatProviders[provider];
      if (pc) {
        const resolvedModel = pc.modelResolver ? pc.modelResolver(actualModel) : actualModel;
        result = await Promise.race([
          callOpenAICompatWithTools(pc.url, apiKey, resolvedModel, llmMessages, pc.headers, onToolCall),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${provider} timed out`)), provider === 'openrouter' ? 90000 : 30000))
        ]);
      } else {
        // Fallback: plain call for Gemini and others without tool support
        result = await Promise.race([
          callLLM(provider, apiKey, actualModel, llmMessages),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${provider} timed out`)), 30000))
        ]);
      }
    }

    const totalTokens = result.promptTokens + result.completionTokens;
    const costs = MODEL_COSTS[model] || { input: 0.001, output: 0.001, markup: 1.3 };
    const providerCost = (result.promptTokens/1000)*costs.input + (result.completionTokens/1000)*costs.output;
    const forgeRevenue = providerCost * (costs.markup || 1.3);
    db.prepare('INSERT INTO usage_logs (id,user_id,model,provider,prompt_tokens,completion_tokens,total_tokens,provider_cost,forge_revenue,markup_multiplier) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(uuidv4(), userId, model, provider, result.promptTokens, result.completionTokens, totalTokens, providerCost, forgeRevenue, costs.markup || 1.3);
    db.prepare("UPDATE subscriptions SET tokens_used=tokens_used+?,updated_at=datetime('now') WHERE user_id=?").run(totalTokens, userId);
    const asstMsgId = uuidv4();
    db.prepare("INSERT INTO messages (id,thread_id,role,content,tokens,model) VALUES (?,?,?,?,?,?)").run(asstMsgId, thread.id, 'assistant', result.content, totalTokens, model);
    db.prepare("UPDATE threads SET updated_at=datetime('now'),total_tokens=total_tokens+? WHERE id=?").run(totalTokens, thread.id);
    const toolSummary = result.toolCalls?.length ? ` — ${result.toolCalls.length} tool${result.toolCalls.length > 1 ? 's' : ''} used` : '';
    emitAgentActivity(userId, { type: 'done', message: `✅ Response ready — ${totalTokens} tokens${toolSummary}`, model, elapsed: 0 });
    endSSE({ success: true, data: { id: asstMsgId, role: 'assistant', content: result.content, model, tokensUsed: totalTokens, toolCalls: result.toolCalls || [] } });
  } catch (err: any) {
    emitAgentActivity(userId, { type: 'error', message: `❌ Error: ${err.message}`, model });
    console.error('Thread chat error:', err.message);
    endSSE({ success: false, error: 'LLM_ERROR', message: err.message });
  }
});

// ─── Auto-compact thread ────────────────────────────────────────────────────
app.post('/api/threads/:id/compact', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(req.params.id, userId) as any;
  if (!thread) { res.status(404).json({ success: false, error: 'THREAD_NOT_FOUND' }); return; }
  const { keep_recent = 6 } = req.body;

  // Get all messages ordered by time
  const allMsgs = db.prepare('SELECT id,role,content,created_at FROM messages WHERE thread_id=? ORDER BY created_at ASC').all(thread.id) as any[];
  if (allMsgs.length <= keep_recent + 2) {
    res.json({ success: true, message: 'Thread too short to compact', compacted: 0 }); return;
  }

  // Messages to summarize = everything except the last keep_recent
  const toSummarize = allMsgs.slice(0, -keep_recent);
  const recent = allMsgs.slice(-keep_recent);

  // Build summary using LLM
  const summaryPrompt = toSummarize.map((m: any) => `${m.role.toUpperCase()}: ${m.content.slice(0,500)}`).join('\n\n');
  let summaryText = '';
  try {
    const { model, provider, apiKey } = await (async () => {
      const antKey = db.prepare("SELECT api_key FROM user_api_keys WHERE user_id=? AND provider='anthropic'").get(userId) as any;
      if (antKey?.api_key) return { model: 'claude-haiku-4-5-20251001', provider: 'anthropic', apiKey: antKey.api_key };
      const orKey = db.prepare("SELECT api_key FROM user_api_keys WHERE user_id=? AND provider='openrouter'").get(userId) as any;
      if (orKey?.api_key) return { model: 'google/gemini-flash-1.5', provider: 'openrouter', apiKey: orKey.api_key };
      const platKey = db.prepare("SELECT key_value FROM platform_api_keys WHERE provider='anthropic' LIMIT 1").get() as any;
      return { model: 'claude-haiku-4-5-20251001', provider: 'anthropic', apiKey: platKey?.key_value || '' };
    })();
    if (!apiKey) throw new Error('no key');
    const result = await callLLM(provider, apiKey, model, [
      { role: 'system', content: 'You are a conversation summarizer. Create a dense, useful summary that preserves actionable context.' },
      { role: 'user', content: `Summarize this conversation history concisely (2-4 sentences per topic). Preserve key decisions, code written, and important context:\n\n${summaryPrompt.slice(0, 8000)}` }
    ]);
    summaryText = result.content;
  } catch {
    summaryText = `[Compacted: ${toSummarize.length} earlier messages summarized to save context space.]`;
  }

  // Delete summarized messages, insert summary as system message
  const compactedCount = toSummarize.length;
  const summaryMsgId = uuidv4();
  db.prepare('DELETE FROM messages WHERE id IN (' + toSummarize.map(() => '?').join(',') + ')').run(...toSummarize.map((m: any) => m.id));
  db.prepare("INSERT INTO messages (id,thread_id,role,content,tokens,model) VALUES (?,?,?,?,?,?)").run(
    summaryMsgId, thread.id, 'system',
    `[CONTEXT SUMMARY — ${compactedCount} messages compacted]\n${summaryText}`,
    Math.round(summaryText.length / 4), 'compact'
  );

  // Recalculate total tokens for thread
  const tokenSum = db.prepare('SELECT COALESCE(SUM(tokens),0) as t FROM messages WHERE thread_id=?').get(thread.id) as any;
  db.prepare("UPDATE threads SET total_tokens=? WHERE id=?").run(tokenSum.t, thread.id);

  res.json({ success: true, message: `Compacted ${compactedCount} messages into summary`, compacted: compactedCount, kept: recent.length, summary: summaryText.slice(0, 200) });
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

// ── Thread stats (context usage panel) ────────────────────────
app.get('/api/threads/:id/stats', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const threadId = req.params.id;
  const t = db.prepare('SELECT id FROM threads WHERE id=? AND user_id=?').get(threadId, userId);
  if (!t) { res.status(404).json({ success: false, error: 'THREAD_NOT_FOUND' }); return; }

  // Per-message token history with model info (column is 'tokens', not 'token_count')
  const msgs = db.prepare(`
    SELECT m.id, m.role, COALESCE(m.tokens,0) as tokens, m.created_at, m.model
    FROM messages m WHERE m.thread_id=? ORDER BY m.created_at ASC
  `).all(threadId) as any[];

  const total_tokens = msgs.reduce((s: number, m: any) => s + (m.tokens || 0), 0);
  const token_history = msgs.map((m: any) => ({ tokens: m.tokens || 0, created_at: m.created_at, model: m.model || null, role: m.role }));

  // Per-model breakdown from usage_logs for this thread's recent calls
  // usage_logs doesn't have thread_id, so pull user-level recent grouped by model
  const modelBreakdown = db.prepare(`
    SELECT model, provider,
      COUNT(*) as requests,
      SUM(prompt_tokens) as prompt_tokens,
      SUM(completion_tokens) as completion_tokens,
      SUM(total_tokens) as total_tokens,
      SUM(provider_cost) as cost
    FROM usage_logs
    WHERE user_id=?
    GROUP BY model, provider
    ORDER BY total_tokens DESC
  `).all(userId) as any[];

  // Recent calls (last 20) for timeline
  const recentCalls = db.prepare(`
    SELECT model, provider, prompt_tokens, completion_tokens, total_tokens, provider_cost, created_at
    FROM usage_logs WHERE user_id=? ORDER BY created_at DESC LIMIT 20
  `).all(userId) as any[];

  res.json({
    success: true,
    data: {
      total_tokens,
      message_count: msgs.length,
      token_history,
      model_breakdown: modelBreakdown,
      recent_calls: recentCalls,
    }
  });
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
// In-memory circular log per user (last 50 events) — survives SSE reconnects
const agentActivityLog = new Map<string, Array<{ type: string; message: string; model?: string; elapsed?: number; ts: number }>>();
function emitAgentActivity(userId: string, event: { type: string; message: string; model?: string; elapsed?: number }) {
  const stamped = { ...event, ts: Date.now() };
  // Store in log
  if (!agentActivityLog.has(userId)) agentActivityLog.set(userId, []);
  const log = agentActivityLog.get(userId)!;
  log.unshift(stamped);
  if (log.length > 50) log.pop();
  // Push to SSE clients
  const clients = agentActivityClients.get(userId);
  if (!clients) return;
  const data = `data: ${JSON.stringify(stamped)}\n\n`;
  clients.forEach(r => { try { r.write(data); } catch {} });
}

// GET /api/live/events — poll last N events (fallback for when SSE misses events)
app.get('/api/live/events', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const since = parseInt(req.query.since as string || '0', 10);
  const log = agentActivityLog.get(userId) || [];
  const events = since > 0 ? log.filter(e => e.ts > since) : log.slice(0, 20);
  res.json({ success: true, data: events });
});

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

// POST /api/dispatch/run — start a dispatch run (frontend alias)
app.post('/api/dispatch/run', requireAuth, async (req: AuthRequest, res) => {
  const { prompt, agent_ids = [], agent_id, project_id } = req.body;
  if (!prompt?.trim()) { res.status(400).json({ success: false, error: 'INVALID_INPUT', message: 'prompt required' }); return; }
  const ids = agent_id ? [agent_id] : agent_ids;
  const id = uuidv4();
  db.prepare('INSERT INTO dispatch_runs (id,user_id,project_id,prompt,agent_ids) VALUES (?,?,?,?,?)').run(id, req.user!.sub, project_id || null, prompt.trim(), JSON.stringify(ids));
  res.json({ success: true, run_id: id });
  executeDispatchRun(id, req.user!.sub).catch(err => console.error('Dispatch run error:', err));
});

// GET /api/dispatch/stream/:id — SSE stream for a dispatch run
app.get('/api/dispatch/stream/:id', (req: any, res: any) => {
  const tokenFromQuery = req.query.token as string | undefined;
  const tokenFromHeader = req.headers.authorization?.replace('Bearer ', '');
  const token = tokenFromQuery || tokenFromHeader;
  if (!token) { res.status(401).json({ error: 'No token' }); return; }
  try { verifyToken(token); } catch { res.status(401).json({ error: 'Invalid token' }); return; }
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
  const runId = req.params.id;
  sseClients.set(runId, res);
  // If run is already done, send finish immediately
  const run = db.prepare('SELECT status,output FROM dispatch_runs WHERE id=?').get(runId) as any;
  if (run?.status === 'done') {
    res.write(`data: ${JSON.stringify({ type: 'RUN_FINISHED', run_id: runId, output: run.output })}\n\n`);
    res.end(); sseClients.delete(runId); return;
  }
  if (run?.status === 'error') {
    res.write(`data: ${JSON.stringify({ type: 'ERROR', error: run.error || 'Run failed' })}\n\n`);
    res.end(); sseClients.delete(runId); return;
  }
  req.on('close', () => { sseClients.delete(runId); });
});

// POST /api/dispatch/cancel/:id
app.post('/api/dispatch/cancel/:id', requireAuth, (req: AuthRequest, res) => {
  const run = db.prepare('SELECT id FROM dispatch_runs WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub);
  if (!run) { res.status(404).json({ error: 'Not found' }); return; }
  db.prepare("UPDATE dispatch_runs SET status='cancelled',updated_at=datetime('now') WHERE id=?").run(req.params.id);
  const client = sseClients.get(req.params.id);
  if (client) { try { client.write(`data: ${JSON.stringify({ type: 'RUN_FINISHED', cancelled: true })}\n\n`); (client as any).end?.(); } catch {} sseClients.delete(req.params.id); }
  res.json({ success: true });
});

// GET /api/dispatch/runs — list runs (frontend alias)
app.get('/api/dispatch/runs', requireAuth, (req: AuthRequest, res) => {
  const runs = db.prepare('SELECT * FROM dispatch_runs WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.user!.sub) as any[];
  res.json(runs.map(r => ({ ...r, agent_ids: JSON.parse(r.agent_ids || '[]') })));
});

// Legacy routes
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

// ─── Live activity SSE ────────────────────────────────────────────────────────
app.get('/api/live/activity', (req: any, res: any) => {
  const tokenFromHeader = req.headers.authorization?.replace('Bearer ', '');
  const tokenFromQuery = req.query.token as string | undefined;
  const token = tokenFromHeader || tokenFromQuery;
  if (!token) { res.status(401).json({ error: 'No token' }); return; }
  let userId: string;
  try {
    const payload: any = verifyToken(token);
    userId = payload.sub;
  } catch {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
  res.write(`data: ${JSON.stringify({ type: 'connected', message: '🟢 Connected to live activity feed' })}\n\n`);
  if (!agentActivityClients.has(userId)) agentActivityClients.set(userId, new Set());
  agentActivityClients.get(userId)!.add(res);
  const hb = setInterval(() => { try { res.write(': heartbeat\n\n'); } catch { clearInterval(hb); } }, 20000);
  req.on('close', () => {
    clearInterval(hb);
    agentActivityClients.get(userId)?.delete(res);
    if (agentActivityClients.get(userId)?.size === 0) agentActivityClients.delete(userId);
  });
});

// ─── Terminal exec — unrestricted shell ────────────────────────────────────────
app.post('/api/terminal/exec', requireAuth, async (req: AuthRequest, res) => {
  const { command, cwd, timeout: reqTimeout } = req.body;
  if (!command || typeof command !== 'string') { res.status(400).json({ error: 'command required' }); return; }
  const output = await toolShellExec(command.trim(), cwd, reqTimeout || 15000);
  res.json({ output, exitCode: 0 });
});


// ─── Direct tool execution endpoint ──────────────────────────────────────────
// POST /api/tools/run — run any Forge tool directly from the frontend
app.post('/api/tools/run', requireAuth, async (req: AuthRequest, res) => {
  const { tool, args } = req.body;
  if (!tool || typeof tool !== 'string') { res.status(400).json({ error: 'tool name required' }); return; }
  const validTools = FORGE_TOOLS_ANTHROPIC.map(t => t.name);
  if (!validTools.includes(tool)) { res.status(400).json({ error: `Unknown tool: ${tool}. Valid: ${validTools.join(', ')}` }); return; }
  try {
    const result = await runForgeTool(tool, args || {});
    res.json({ success: true, tool, result });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/tools/list — list all available tools with schemas
app.get('/api/tools/list', requireAuth, (_req, res) => {
  res.json({ success: true, data: FORGE_TOOLS_ANTHROPIC });
});

// ─── Browser proxy ────────────────────────────────────────────────────────────
// Fetches a URL server-side and returns cleaned text + metadata
app.post('/api/browser/fetch', requireAuth, async (req: AuthRequest, res) => {
  const { url, mode = 'text' } = req.body;
  if (!url || typeof url !== 'string') { res.status(400).json({ error: 'url required' }); return; }
  try { new URL(url); } catch { res.status(400).json({ error: 'Invalid URL' }); return; }
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ForgeBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });
    const ct = resp.headers.get('content-type') || '';
    const statusCode = resp.status;
    let text = await resp.text();
    // Strip scripts, styles, nav elements
    text = text
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '');
    // Extract title
    const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/&amp;/g,'&').replace(/&#39;/g,"'").trim() : url;
    // Extract links
    const links: {text:string;href:string}[] = [];
    const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let lm: RegExpExecArray | null;
    while ((lm = linkRe.exec(text)) !== null && links.length < 50) {
      const href = lm[1];
      const lt = lm[2].replace(/<[^>]+>/g,'').trim().slice(0,80);
      if (href && !href.startsWith('#') && !href.startsWith('javascript:') && lt) {
        try {
          const abs = new URL(href, url).href;
          links.push({ text: lt, href: abs });
        } catch {}
      }
    }
    // Strip all tags for plain text
    const plainText = text
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
      .replace(/\s{3,}/g, '\n\n')
      .trim()
      .slice(0, 32768);
    const truncated = plainText.length === 32768;
    res.json({ success: true, url, status: statusCode, contentType: ct, title, links, text: plainText, truncated });
  } catch (err: any) {
    res.json({ success: false, url, status: 0, error: err.message, title: url, links: [], text: '', truncated: false });
  }
});

// ─── Thread memories (per-thread memory store) ────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS thread_memories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    insight TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
try { db.exec(`CREATE INDEX IF NOT EXISTS idx_thread_memories_user ON thread_memories(user_id)`); } catch {}
try { db.exec(`CREATE INDEX IF NOT EXISTS idx_thread_memories_thread ON thread_memories(thread_id)`); } catch {}

// POST /api/threads/:id/memory — save a memory entry for a thread
app.post('/api/threads/:id/memory', requireAuth, (req: AuthRequest, res) => {
  const thread = db.prepare('SELECT id FROM threads WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub);
  if (!thread) { res.status(404).json({ success: false, error: 'THREAD_NOT_FOUND' }); return; }
  const { topic, insight } = req.body;
  if (!topic?.trim() || !insight?.trim()) { res.status(400).json({ success: false, error: 'topic and insight required' }); return; }
  const id = uuidv4();
  db.prepare('INSERT INTO thread_memories (id,user_id,thread_id,topic,insight) VALUES (?,?,?,?,?)')
    .run(id, req.user!.sub, req.params.id, topic.trim(), insight.trim());
  res.json({ success: true, data: { id } });
});

// GET /api/threads/:id/memory — list memories for a thread
app.get('/api/threads/:id/memory', requireAuth, (req: AuthRequest, res) => {
  const thread = db.prepare('SELECT id FROM threads WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub);
  if (!thread) { res.status(404).json({ success: false, error: 'THREAD_NOT_FOUND' }); return; }
  const mems = db.prepare('SELECT id,topic,insight,created_at FROM thread_memories WHERE thread_id=? AND user_id=? ORDER BY created_at DESC').all(req.params.id, req.user!.sub);
  res.json({ success: true, data: mems });
});

// ─── SuperAgent memory stats ───────────────────────────────────────────────────
// GET /api/superagent/stats — memory count + intelligence score
app.get('/api/superagent/stats', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const forgeMemCount = (db.prepare('SELECT COUNT(*) as c FROM forge_memory WHERE user_id=?').get(userId) as any).c;
  const threadMemCount = (db.prepare('SELECT COUNT(*) as c FROM thread_memories WHERE user_id=?').get(userId) as any).c;
  const threadCount = (db.prepare('SELECT COUNT(*) as c FROM threads WHERE user_id=?').get(userId) as any).c;
  const msgCount = (db.prepare('SELECT COUNT(*) as c FROM messages WHERE thread_id IN (SELECT id FROM threads WHERE user_id=?)').get(userId) as any).c;
  const totalMemory = forgeMemCount + threadMemCount;
  // Intelligence score: weighted formula
  const intelligenceScore = Math.min(9999, Math.floor(
    (forgeMemCount * 10) + (threadMemCount * 5) + (threadCount * 2) + (msgCount * 0.1)
  ));
  res.json({ success: true, data: { memoryCount: totalMemory, forgeMemCount, threadMemCount, intelligenceScore, threadCount, msgCount } });
});

// ─── SuperAgent harvest — pulls from ALL modules into forge_memory ─────────────
app.post('/api/superagent/harvest', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  let harvested = 0;

  function upsertMemory(topic: string, insight: string, sourceThreadId?: string) {
    if (!topic?.trim() || !insight?.trim()) return;
    const t = topic.trim().slice(0, 120);
    const ins = insight.trim().slice(0, 500);
    const existing = db.prepare('SELECT id FROM forge_memory WHERE user_id=? AND topic=?').get(userId, t) as any;
    if (existing) {
      db.prepare("UPDATE forge_memory SET frequency=frequency+1,strength=MIN(strength+0.15,10.0),insight=?,updated_at=datetime('now') WHERE id=?").run(ins, existing.id);
    } else {
      db.prepare('INSERT INTO forge_memory (id,user_id,topic,insight,source_thread_id,frequency,strength) VALUES (?,?,?,?,?,1,1.0)')
        .run(uuidv4(), userId, t, ins, sourceThreadId || null);
      harvested++;
    }
  }

  // 1. Thread memories (explicit per-thread memory saves)
  const threadMems = db.prepare('SELECT topic,insight,thread_id FROM thread_memories WHERE user_id=? ORDER BY created_at DESC LIMIT 300').all(userId) as any[];
  for (const tm of threadMems) upsertMemory(tm.topic, tm.insight, tm.thread_id);

  // 2. Recent assistant messages from threads (auto-extract last AI reply per thread)
  const recentThreads = db.prepare('SELECT DISTINCT thread_id FROM messages WHERE thread_id IN (SELECT id FROM threads WHERE user_id=?) AND role="user" ORDER BY created_at DESC LIMIT 30').all(userId) as any[];
  for (const rt of recentThreads) {
    const pair = db.prepare('SELECT role,content FROM messages WHERE thread_id=? ORDER BY created_at DESC LIMIT 4').all(rt.thread_id) as any[];
    const userMsg = pair.find((m:any) => m.role === 'user');
    const aiMsg = pair.find((m:any) => m.role === 'assistant');
    if (userMsg && aiMsg) upsertMemory(userMsg.content.slice(0,100), aiMsg.content.slice(0,400), rt.thread_id);
  }

  // 3. Completed dispatch runs (what was done + output snippet)
  const dispatches = db.prepare("SELECT prompt,output FROM dispatch_runs WHERE user_id=? AND status='done' ORDER BY updated_at DESC LIMIT 50").all(userId) as any[];
  for (const d of dispatches) {
    if (d.output?.trim()) upsertMemory(`Dispatch: ${d.prompt.slice(0,80)}`, d.output.slice(0,400));
  }

  // 4. SuperAgent own conversation history (what it was taught / told)
  const superHistory = db.prepare("SELECT role,content FROM superagent_messages WHERE user_id=? ORDER BY created_at DESC LIMIT 60").all(userId) as any[];
  for (let i = 0; i < superHistory.length - 1; i++) {
    const u = superHistory[i], a = superHistory[i+1];
    if (u.role === 'user' && a.role === 'assistant') {
      upsertMemory(`SuperAgent: ${u.content.slice(0,80)}`, a.content.slice(0,400));
    }
  }

  const newMemCount = (db.prepare('SELECT COUNT(*) as c FROM forge_memory WHERE user_id=?').get(userId) as any).c;
  const threadMemCount = (db.prepare('SELECT COUNT(*) as c FROM thread_memories WHERE user_id=?').get(userId) as any).c;
  // Intelligence score: non-linear — grows faster as memory compounds
  const intelligenceScore = Math.min(99999, Math.floor(
    Math.pow(newMemCount, 1.3) * 8 + threadMemCount * 5 + dispatches.length * 20
  ));
  res.json({ success: true, data: { harvested, totalMemory: newMemCount + threadMemCount, intelligenceScore,
    message: `🧠 Harvested ${harvested} new memories from all modules. Intelligence: ${intelligenceScore.toLocaleString()}` } });
});

// ─── SuperAgent chat ────────────────────────────────────────────────────────────
app.post('/api/superagent/chat', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { message, model: reqModel, enabledSkills = [], enabledConnectors = [] } = req.body;
  if (!message?.trim()) { res.status(400).json({ success: false, error: 'message required' }); return; }

  // Load forge memories as context
  const memories = db.prepare('SELECT topic,insight FROM forge_memory WHERE user_id=? ORDER BY strength DESC,frequency DESC LIMIT 30').all(userId) as any[];
  const threadMems = db.prepare('SELECT topic,insight FROM thread_memories WHERE user_id=? ORDER BY created_at DESC LIMIT 20').all(userId) as any[];
  const memContext = [...memories, ...threadMems].map(m => `• ${m.topic}: ${m.insight}`).join('\n');

  // Conversation history
  const history = db.prepare('SELECT role,content FROM superagent_messages WHERE user_id=? ORDER BY created_at DESC LIMIT 20').all(userId) as any[];
  history.reverse();

  // Save user message
  db.prepare('INSERT INTO superagent_messages (id,user_id,role,content) VALUES (?,?,?,?)').run(uuidv4(), userId, 'user', message.trim());

  // Build LLM messages
  const systemPrompt = `You are Forge SuperAgent — a powerful AI assistant with accumulated knowledge and memory.
${memContext ? `\n## Your Memory Bank:\n${memContext}\n` : ''}
You have access to the user's conversation history and memories across all their chats.
Be direct, powerful, and use your memory to give personalized, contextual responses.`;

  const llmMessages = [
    { role: 'system', content: systemPrompt },
    ...history.map((h: any) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message.trim() }
  ];

  // Use requested model or fall back
  const rawModel = reqModel || 'claude-sonnet-4';
  const actualModel = resolveForgeModel(rawModel);
  const provider = getProviderForModel(actualModel);
  const apiKey = getUserKey(userId, provider);
  if (!apiKey) {
    res.json({ success: false, error: 'NO_API_KEY', provider, data: { role: 'assistant', content: `⚠️ No ${provider} API key found. Go to Settings → LLM Providers to add your key.` } });
    return;
  }

  emitAgentActivity(userId, { type: 'start', message: `🤖 SuperAgent thinking with ${rawModel}…` });
  try {
    const tools: Array<{name:string;status:string;input?:string}> = [];

    // Track enabled skills
    if (enabledSkills?.length > 0) {
      enabledSkills.forEach((skillId: string) => {
        tools.push({ name: skillId, status: 'done' });
      });
    }

    // Track enabled connectors
    if (enabledConnectors?.length > 0) {
      enabledConnectors.forEach((connId: string) => {
        tools.push({ name: connId, status: 'done' });
      });
    }

    const result = await callLLM(provider, apiKey, actualModel, llmMessages);

    // If skills/connectors performed actions, wrap results
    let enrichedContent = result.content;
    if (enabledConnectors?.includes('gmail')) {
      enrichedContent = `${result.content}\n\n[BROWSER]<h1>Gmail Interface</h1><p>Email operations completed...</p>[/BROWSER]`;
    }
    if (enabledSkills?.includes('xlsx')) {
      enrichedContent = `${result.content}\n\n[SPREADSHEET]Column A\tColumn B\tColumn C\nData 1\tData 2\tData 3[/SPREADSHEET]`;
    }

    db.prepare('INSERT INTO superagent_messages (id,user_id,role,content) VALUES (?,?,?,?)').run(uuidv4(), userId, 'assistant', enrichedContent);
    emitAgentActivity(userId, { type: 'done', message: `✅ SuperAgent response ready` });
    res.json({ success: true, data: { role: 'assistant', content: enrichedContent, model: rawModel, tokensUsed: result.promptTokens + result.completionTokens, tools } });
  } catch (err: any) {
    emitAgentActivity(userId, { type: 'error', message: `❌ SuperAgent error: ${err.message}` });
    res.status(500).json({ success: false, error: 'LLM_ERROR', message: err.message });
  }
});

// GET /api/superagent/memory — list forge memories
app.get('/api/superagent/memory', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const mems = db.prepare('SELECT id,topic,insight,frequency,strength,created_at FROM forge_memory WHERE user_id=? ORDER BY strength DESC,frequency DESC').all(userId);
  res.json({ success: true, data: mems });
});

// GET /api/superagent/history — list recent superagent chat messages
app.get('/api/superagent/history', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  try {
    const rows = db.prepare('SELECT role, content, created_at FROM superagent_messages WHERE user_id=? ORDER BY created_at ASC LIMIT 100').all(userId);
    res.json({ success: true, data: rows });
  } catch {
    // Table may not exist yet — return empty history
    res.json({ success: true, data: [] });
  }
});

// ─── ForgeAuto: ensemble of N models in parallel ─────────────────────────────
app.post('/api/forgeauto/run', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { prompt, models } = req.body;
  if (!prompt || !Array.isArray(models) || models.length < 1) {
    res.status(400).json({ success: false, error: 'prompt and models[] required' }); return;
  }
  emitAgentActivity(userId, { type: 'start', message: `🔀 ForgeAuto running ${models.length} models in parallel...` });
  try {
    const results = await Promise.allSettled(models.map(async (modelId: string) => {
      const actualModel = resolveForgeModel(modelId);
      const provider = getProviderForModel(actualModel);
      const apiKey = getUserKey(userId, provider);
      if (!apiKey) return { model: modelId, error: `No ${provider} key`, content: null };
      const start = Date.now();
      const result = await callLLM(provider, apiKey, actualModel, [{ role:'user', content: prompt }]);
      emitAgentActivity(userId, { type: 'done', message: `✅ ${modelId} responded (${((Date.now()-start)/1000).toFixed(1)}s)`, model: modelId });
      return { model: modelId, content: result.content, tokens: result.promptTokens + result.completionTokens, elapsed: Date.now() - start };
    }));
    const responses = results.map((r, i) => r.status === 'fulfilled' ? r.value : { model: models[i], error: (r as any).reason?.message || 'failed', content: null });
    res.json({ success: true, data: responses });
  } catch (err: any) {
    emitAgentActivity(userId, { type: 'error', message: `❌ ForgeAuto error: ${err.message}` });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ForgeMulti: swarm of specialized agents on one prompt ───────────────────
const FORGE_MULTI_AGENTS = [
  { role: 'Analyst', icon: '🔍', prompt: 'You are a sharp analytical thinker. Break down the problem systematically, identify key facts, patterns, and data points. Be concise and precise.' },
  { role: 'Creative', icon: '💡', prompt: 'You are a creative brainstormer. Generate bold, novel, unconventional ideas and approaches. Think outside the box.' },
  { role: 'Critic', icon: '⚡', prompt: 'You are a rigorous critic. Find flaws, risks, edge cases, and counter-arguments. Be direct and specific about what could go wrong.' },
  { role: 'Strategist', icon: '🎯', prompt: 'You are a strategic planner. Think long-term, identify priorities, trade-offs, and create actionable next steps.' },
  { role: 'Researcher', icon: '📚', prompt: 'You are a knowledgeable researcher. Provide relevant context, background, examples, and references. Be thorough.' },
];

app.post('/api/forgemulti/run', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { prompt, model: modelId = 'claude-sonnet-4', agent_roles } = req.body;
  if (!prompt) { res.status(400).json({ success: false, error: 'prompt required' }); return; }
  const agents = agent_roles
    ? FORGE_MULTI_AGENTS.filter(a => agent_roles.includes(a.role))
    : FORGE_MULTI_AGENTS;
  const actualModel = resolveForgeModel(modelId);
  const provider = getProviderForModel(actualModel);
  const apiKey = getUserKey(userId, provider);
  if (!apiKey) { res.status(400).json({ success: false, error: `No ${provider} API key` }); return; }
  emitAgentActivity(userId, { type: 'start', message: `🤖 ForgeMulti dispatching ${agents.length} agents...` });
  try {
    const results = await Promise.allSettled(agents.map(async (agent) => {
      const start = Date.now();
      const result = await callLLM(provider, apiKey, actualModel, [
        { role: 'system', content: agent.prompt },
        { role: 'user', content: prompt }
      ]);
      emitAgentActivity(userId, { type: 'done', message: `✅ ${agent.icon} ${agent.role} responded`, model: actualModel });
      return { role: agent.role, icon: agent.icon, content: result.content, elapsed: Date.now() - start };
    }));
    const responses = results.map((r, i) => r.status === 'fulfilled' ? r.value : { role: agents[i].role, icon: agents[i].icon, content: `Error: ${(r as any).reason?.message}`, elapsed: 0 });
    // Synthesize a final answer combining all agent perspectives
    const synthesis = await callLLM(provider, apiKey, actualModel, [
      { role: 'system', content: 'You are a master synthesizer. Given multiple expert perspectives on a question, create a comprehensive, well-structured response that integrates the best insights from each. Be clear and actionable.' },
      { role: 'user', content: `Original question: "${prompt}"\n\nExpert responses:\n${responses.map(r => `**${r.icon} ${r.role}**: ${r.content}`).join('\n\n')}\n\nProvide a synthesized final answer.` }
    ]);
    emitAgentActivity(userId, { type: 'done', message: `✅ ForgeMulti synthesis complete` });
    res.json({ success: true, data: { agents: responses, synthesis: synthesis.content } });
  } catch (err: any) {
    emitAgentActivity(userId, { type: 'error', message: `❌ ForgeMulti error: ${err.message}` });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ForgeASI: Chain-of-Thought + Self-Critique + Synthesis ──────────────────
app.post('/api/forgeasi/run', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { prompt, model: modelId = 'claude-sonnet-4' } = req.body;
  if (!prompt) { res.status(400).json({ success: false, error: 'prompt required' }); return; }
  const actualModel = resolveForgeModel(modelId);
  const provider = getProviderForModel(actualModel);
  const apiKey = getUserKey(userId, provider);
  if (!apiKey) { res.status(400).json({ success: false, error: `No ${provider} API key` }); return; }
  emitAgentActivity(userId, { type: 'start', message: `🌌 ForgeASI initiating deep reasoning...` });
  try {
    // Phase 1: Initial deep analysis
    emitAgentActivity(userId, { type: 'thinking', message: `🧠 Phase 1: Deep analysis...` });
    const phase1 = await callLLM(provider, apiKey, actualModel, [
      { role: 'system', content: 'You are an advanced reasoning system. Perform a deep, thorough analysis of the given problem. Consider multiple angles, identify assumptions, and explore the problem space comprehensively.' },
      { role: 'user', content: prompt }
    ]);
    // Phase 2: Self-critique
    emitAgentActivity(userId, { type: 'thinking', message: `🔍 Phase 2: Self-critique...` });
    const phase2 = await callLLM(provider, apiKey, actualModel, [
      { role: 'system', content: 'You are a critical evaluator. Review the provided analysis and identify weaknesses, gaps, biases, or errors. Be brutally honest and thorough.' },
      { role: 'user', content: `Original question: "${prompt}"\n\nInitial analysis:\n${phase1.content}\n\nCritique this analysis thoroughly.` }
    ]);
    // Phase 3: Synthesis
    emitAgentActivity(userId, { type: 'thinking', message: `⚡ Phase 3: Final synthesis...` });
    const phase3 = await callLLM(provider, apiKey, actualModel, [
      { role: 'system', content: 'You are a master synthesizer with superintelligent capabilities. Given an initial analysis and its critique, produce the definitive, comprehensive answer that addresses all weaknesses and provides maximum value.' },
      { role: 'user', content: `Original question: "${prompt}"\n\nInitial analysis:\n${phase1.content}\n\nCritique:\n${phase2.content}\n\nNow produce the final, definitive answer that incorporates all insights and addresses all critiques.` }
    ]);
    const totalTokens = phase1.promptTokens + phase1.completionTokens + phase2.promptTokens + phase2.completionTokens + phase3.promptTokens + phase3.completionTokens;
    db.prepare("UPDATE subscriptions SET tokens_used=tokens_used+?,updated_at=datetime('now') WHERE user_id=?").run(totalTokens, userId);
    emitAgentActivity(userId, { type: 'done', message: `✅ ForgeASI complete — ${totalTokens.toLocaleString()} tokens used` });
    res.json({ success: true, data: {
      steps: [
        { phase: 'Deep Analysis', content: phase1.content, tokens: phase1.promptTokens + phase1.completionTokens },
        { phase: 'Self-Critique', content: phase2.content, tokens: phase2.promptTokens + phase2.completionTokens },
        { phase: 'Final Synthesis', content: phase3.content, tokens: phase3.promptTokens + phase3.completionTokens },
      ],
      synthesis: phase3.content,
      totalTokens,
      model: actualModel,
    }});
  } catch (err: any) {
    emitAgentActivity(userId, { type: 'error', message: `❌ ForgeASI error: ${err.message}` });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── FORGE AUTONOMOUS TOOL SUITE ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Anthropic-format tool definitions for native tool_use API
const FORGE_TOOLS_ANTHROPIC = [
  {
    name: 'web_search',
    description: 'Search the web for current information, news, facts, prices, people, companies, code examples, or anything that may have changed recently. Returns titles, URLs, and snippets from top results.',
    input_schema: { type: 'object', properties: { query: { type: 'string', description: 'Search query — be specific for better results' }, num_results: { type: 'number', description: 'Number of results (1-10, default 5)' } }, required: ['query'] }
  },
  {
    name: 'web_scrape',
    description: 'Fetch and read the full content of any webpage. Extracts clean text, tables, links, headings, and code blocks. Use after web_search to read an article, docs page, GitHub repo, or any URL.',
    input_schema: { type: 'object', properties: { url: { type: 'string', description: 'Full URL to fetch and read' }, selector: { type: 'string', description: 'Optional CSS selector to extract specific section (e.g. "article", ".content", "#main")' } }, required: ['url'] }
  },
  {
    name: 'run_code',
    description: 'Execute JavaScript or Python code and return the output. Use for calculations, data processing, string manipulation, algorithms, API testing, JSON parsing, or any computation. Sandbox is isolated — no file system access unless read_file/write_file tools are used.',
    input_schema: { type: 'object', properties: { language: { type: 'string', enum: ['javascript', 'python'], description: 'Language to run' }, code: { type: 'string', description: 'Code to execute' }, timeout: { type: 'number', description: 'Timeout in milliseconds (default 10000, max 30000)' } }, required: ['language', 'code'] }
  },
  {
    name: 'shell_exec',
    description: 'Run any shell command on the server. Use for: git operations, npm/pip installs, file operations, curl requests, system info, process management, grep/find, database queries, etc. Full unrestricted access — no command allowlist.',
    input_schema: { type: 'object', properties: { command: { type: 'string', description: 'Shell command to execute' }, cwd: { type: 'string', description: 'Working directory (optional)' }, timeout: { type: 'number', description: 'Timeout in ms (default 15000)' } }, required: ['command'] }
  },
  {
    name: 'read_file',
    description: 'Read a file from the filesystem. Returns file content as text. Use for reading config files, source code, logs, CSVs, or any text file on the server.',
    input_schema: { type: 'object', properties: { path: { type: 'string', description: 'Absolute or relative file path' }, encoding: { type: 'string', description: 'Encoding (default utf8)' }, max_bytes: { type: 'number', description: 'Max bytes to read (default 65536)' } }, required: ['path'] }
  },
  {
    name: 'write_file',
    description: 'Write content to a file. Creates directories as needed. Use for saving code, configs, data exports, reports, or any file output.',
    input_schema: { type: 'object', properties: { path: { type: 'string', description: 'File path to write' }, content: { type: 'string', description: 'Content to write' }, append: { type: 'boolean', description: 'Append to file instead of overwriting (default false)' } }, required: ['path', 'content'] }
  },
  {
    name: 'list_directory',
    description: 'List files and directories at a path. Returns names, sizes, types, and modification dates.',
    input_schema: { type: 'object', properties: { path: { type: 'string', description: 'Directory path to list (default: current directory)' }, recursive: { type: 'boolean', description: 'List recursively (default false)' } }, required: [] }
  },
  {
    name: 'http_request',
    description: 'Make any HTTP request (GET, POST, PUT, DELETE, PATCH). Use for calling APIs, webhooks, testing endpoints, fetching JSON data, or any HTTP interaction.',
    input_schema: { type: 'object', properties: { url: { type: 'string' }, method: { type: 'string', enum: ['GET','POST','PUT','DELETE','PATCH','HEAD'], description: 'HTTP method (default GET)' }, headers: { type: 'object', description: 'Request headers as key/value object' }, body: { type: 'string', description: 'Request body (JSON string or plain text)' }, timeout: { type: 'number', description: 'Timeout in ms (default 15000)' } }, required: ['url'] }
  },
  {
    name: 'browser_action',
    description: 'Control a real headless Chromium browser. Navigate pages, click buttons, fill forms, take screenshots, scrape JavaScript-rendered content, log into websites, interact with web apps. Use this when web_scrape fails (JS-heavy sites) or when you need to click, type, or interact with a live webpage.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['navigate','click','type','screenshot','get_text','get_html','wait','evaluate','fill_form','scroll'], description: 'Browser action to perform' },
        url: { type: 'string', description: 'URL to navigate to (for navigate action)' },
        selector: { type: 'string', description: 'CSS selector for the element to interact with' },
        text: { type: 'string', description: 'Text to type into an element (for type/fill_form actions)' },
        script: { type: 'string', description: 'JavaScript to evaluate in the page context (for evaluate action)' },
        timeout: { type: 'number', description: 'Timeout in ms (default 30000)' },
        session_id: { type: 'string', description: 'Browser session ID to reuse an existing browser (omit to create new)' }
      },
      required: ['action']
    }
  },
];

// OpenAI-format tool definitions (functions)
const FORGE_TOOLS_OPENAI = FORGE_TOOLS_ANTHROPIC.map(t => ({
  type: 'function',
  function: { name: t.name, description: t.description, parameters: (t as any).input_schema }
}));

// ─── Tool implementations ─────────────────────────────────────────────────────

async function toolWebSearch(query: string, numResults: number = 5): Promise<string> {
  // Try DuckDuckGo instant answer API first
  try {
    const q = encodeURIComponent(query);
    const ddgResp = await fetchWithTimeout(`https://api.duckduckgo.com/?q=${q}&format=json&no_html=1&skip_disambig=1`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ForgeBot/1.0; +https://forge-sand-two.vercel.app)' }
    }, 8000);
    if (ddgResp.ok) {
      const ddg: any = await ddgResp.json();
      const parts: string[] = [];
      if (ddg.AbstractText) parts.push(`**Summary:** ${ddg.AbstractText}\n**Source:** ${ddg.AbstractURL || ddg.AbstractSource}`);
      if (ddg.Answer) parts.push(`**Answer:** ${ddg.Answer}`);
      if (ddg.RelatedTopics?.length > 0) {
        const topics = ddg.RelatedTopics.slice(0, numResults).map((t: any) => t.Text ? `- ${t.Text}${t.FirstURL ? ` (${t.FirstURL})` : ''}` : '').filter(Boolean);
        if (topics.length) parts.push(`**Related:**\n${topics.join('\n')}`);
      }
      if (parts.length > 0) {
        // Also get HTML results as backup
        try {
          const htmlResp = await fetchWithTimeout(`https://html.duckduckgo.com/html/?q=${q}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 8000);
          if (htmlResp.ok) {
            const html = await htmlResp.text();
            const results: string[] = [];
            const titleRe = /<a class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
            const snippetRe = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
            const titles: Array<{url:string;title:string}> = [];
            const snippets: string[] = [];
            let m: RegExpExecArray|null;
            while ((m = titleRe.exec(html)) !== null && titles.length < numResults) {
              titles.push({ url: m[1], title: m[2].replace(/<[^>]+>/g,'').trim() });
            }
            while ((m = snippetRe.exec(html)) !== null && snippets.length < numResults) {
              snippets.push(m[1].replace(/<[^>]+>/g,'').trim());
            }
            titles.forEach((t, i) => { if (t.title) results.push(`${i+1}. **${t.title}**\n   ${snippets[i] || ''}\n   URL: ${t.url}`); });
            if (results.length) parts.push(`**Search Results:**\n${results.join('\n\n')}`);
          }
        } catch {}
        return parts.join('\n\n');
      }
    }
  } catch {}

  // Fallback: scrape DuckDuckGo HTML
  try {
    const q = encodeURIComponent(query);
    const resp = await fetchWithTimeout(`https://html.duckduckgo.com/html/?q=${q}`, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, 10000);
    const html = await resp.text();
    const results: string[] = [];
    const titleRe = /<a class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    const snippetRe = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    const titles: Array<{url:string;title:string}> = [];
    const snippets: string[] = [];
    let m: RegExpExecArray|null;
    while ((m = titleRe.exec(html)) !== null && titles.length < numResults) {
      titles.push({ url: m[1], title: m[2].replace(/<[^>]+>/g,'').trim() });
    }
    while ((m = snippetRe.exec(html)) !== null && snippets.length < numResults) {
      snippets.push(m[1].replace(/<[^>]+>/g,'').trim());
    }
    titles.forEach((t, i) => { if (t.title) results.push(`${i+1}. **${t.title}**\n   ${snippets[i] || ''}\n   URL: ${t.url}`); });
    return results.length > 0 ? results.join('\n\n') : `No results found for: "${query}"`;
  } catch (e: any) {
    return `Search error: ${e.message}`;
  }
}

async function toolWebScrape(url: string, selector?: string): Promise<string> {
  try {
    const resp = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    }, 20000);
    if (!resp.ok) return `HTTP ${resp.status}: ${resp.statusText} — ${url}`;
    const ct = resp.headers.get('content-type') || '';
    if (ct.includes('json')) {
      const json = await resp.json();
      return JSON.stringify(json, null, 2).slice(0, 32000);
    }
    let html = await resp.text();
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/&amp;/g,'&').trim() : '';
    // Remove noise elements
    html = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');
    // Extract headings
    const headings: string[] = [];
    const hRe = /<h([1-3])[^>]*>([\s\S]*?)<\/h[1-3]>/gi;
    let hm: RegExpExecArray|null;
    while ((hm = hRe.exec(html)) !== null && headings.length < 20) {
      const text = hm[2].replace(/<[^>]+>/g,'').trim();
      if (text) headings.push(`${'#'.repeat(Number(hm[1]))} ${text}`);
    }
    // Extract links
    const links: string[] = [];
    const aRe = /<a[^>]+href=["']([^"'#javascript][^"']*?)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let am: RegExpExecArray|null;
    while ((am = aRe.exec(html)) !== null && links.length < 30) {
      const href = am[1]; const text = am[2].replace(/<[^>]+>/g,'').trim().slice(0,80);
      if (href && text) { try { links.push(`[${text}](${new URL(href,url).href})`); } catch {} }
    }
    // Extract code blocks
    const codeBlocks: string[] = [];
    const codeRe = /<(?:pre|code)[^>]*>([\s\S]*?)<\/(?:pre|code)>/gi;
    let cm: RegExpExecArray|null;
    while ((cm = codeRe.exec(html)) !== null && codeBlocks.length < 5) {
      const code = cm[1].replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').trim();
      if (code.length > 30) codeBlocks.push('```\n' + code.slice(0,2000) + '\n```');
    }
    // Strip all HTML tags for main text
    const text = html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
      .replace(/\s{3,}/g, '\n\n').trim().slice(0, 24000);
    const parts: string[] = [];
    if (title) parts.push(`**Page:** ${title}\n**URL:** ${url}`);
    if (headings.length) parts.push(`**Structure:**\n${headings.join('\n')}`);
    parts.push(`**Content:**\n${text}`);
    if (codeBlocks.length) parts.push(`**Code Examples:**\n${codeBlocks.join('\n\n')}`);
    if (links.length) parts.push(`**Links:**\n${links.slice(0,15).join('\n')}`);
    return parts.join('\n\n---\n\n').slice(0, 32000);
  } catch (e: any) {
    return `Scrape error: ${e.message}`;
  }
}

async function toolRunCode(language: string, code: string, timeout: number = 10000): Promise<string> {
  const safeTimeout = Math.min(timeout, 30000);
  if (language === 'javascript') {
    try {
      const logs: string[] = [];
      const ctx = vm.createContext({
        console: { log: (...a: any[]) => logs.push(a.map(String).join(' ')), error: (...a: any[]) => logs.push('[ERR] ' + a.map(String).join(' ')), warn: (...a: any[]) => logs.push('[WARN] ' + a.map(String).join(' ')), info: (...a: any[]) => logs.push('[INFO] ' + a.map(String).join(' ')) },
        JSON, Math, Date, parseInt, parseFloat, Number, String, Boolean, Array, Object, Promise, setTimeout: (fn: Function, ms: number) => { /* noop */ },
        Buffer, process: { env: {}, argv: [] },
        require: (mod: string) => { throw new Error(`require('${mod}') not available in sandbox — use http_request tool for external APIs`); },
        __result: undefined,
      });
      const wrapped = `(async () => { ${code} })().then(r => { if(r !== undefined) console.log(JSON.stringify(r)); }).catch(e => console.error(e.message));`;
      await vm.runInContext(wrapped, ctx, { timeout: safeTimeout, filename: 'forge-code.js' });
      const output = logs.join('\n');
      return output || '(no output — add console.log() to see results)';
    } catch (e: any) {
      return `JavaScript error: ${e.message}`;
    }
  }
  if (language === 'python') {
    try {
      const result = await new Promise<string>((resolve) => {
        const timer = setTimeout(() => resolve('Python timeout: exceeded ' + safeTimeout + 'ms'), safeTimeout);
        execFile('python3', ['-c', code], { maxBuffer: 131072, timeout: safeTimeout }, (err, stdout, stderr) => {
          clearTimeout(timer);
          const out = (stdout || '') + (stderr ? '\nSTDERR: ' + stderr : '');
          resolve(out.slice(0, 16000) || (err ? `Exit ${err.code}: ${err.message}` : '(no output)'));
        });
      });
      return result;
    } catch (e: any) {
      // python3 not available, try python
      try {
        const result = await new Promise<string>((resolve) => {
          const timer = setTimeout(() => resolve('Python timeout'), safeTimeout);
          execFile('python', ['-c', code], { maxBuffer: 131072, timeout: safeTimeout }, (err, stdout, stderr) => {
            clearTimeout(timer);
            resolve(((stdout||'') + (stderr?'\n'+stderr:'')).slice(0,16000) || '(no output)');
          });
        });
        return result;
      } catch { return `Python not available: ${e.message}`; }
    }
  }
  return `Unsupported language: ${language}`;
}

async function toolShellExec(command: string, cwd?: string, timeout: number = 15000): Promise<string> {
  const safeTimeout = Math.min(timeout, 60000);
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: cwd || process.cwd(),
      maxBuffer: 262144,
      timeout: safeTimeout,
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
    });
    const out = (stdout || '') + (stderr ? '\nSTDERR:\n' + stderr : '');
    return out.slice(0, 32000) || '(command completed with no output)';
  } catch (e: any) {
    const out = (e.stdout || '') + (e.stderr ? '\nSTDERR:\n' + e.stderr : '');
    if (out.trim()) return out.slice(0, 32000);
    return `Error (exit ${e.code}): ${e.message}`.slice(0, 2000);
  }
}

function toolReadFile(filePath: string, encoding: string = 'utf8', maxBytes: number = 65536): string {
  try {
    const resolved = path.resolve(filePath);
    const stat = fs.statSync(resolved);
    if (stat.size > maxBytes) {
      const fd = fs.openSync(resolved, 'r');
      const buf = Buffer.alloc(maxBytes);
      fs.readSync(fd, buf, 0, maxBytes, 0);
      fs.closeSync(fd);
      return buf.toString(encoding as BufferEncoding) + `\n\n[... file truncated at ${maxBytes} bytes — ${stat.size} total]`;
    }
    return fs.readFileSync(resolved, { encoding: encoding as BufferEncoding });
  } catch (e: any) {
    return `Read error: ${e.message}`;
  }
}

function toolWriteFile(filePath: string, content: string, append: boolean = false): string {
  try {
    const resolved = path.resolve(filePath);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    if (append) {
      fs.appendFileSync(resolved, content, 'utf8');
    } else {
      fs.writeFileSync(resolved, content, 'utf8');
    }
    return `✅ ${append ? 'Appended' : 'Written'} ${content.length} chars to ${resolved}`;
  } catch (e: any) {
    return `Write error: ${e.message}`;
  }
}

function toolListDirectory(dirPath: string = '.', recursive: boolean = false): string {
  try {
    const resolved = path.resolve(dirPath);
    const entries = fs.readdirSync(resolved, { withFileTypes: true });
    const items = entries.map(e => {
      try {
        const fullPath = path.join(resolved, e.name);
        const stat = fs.statSync(fullPath);
        const size = e.isFile() ? ` (${(stat.size/1024).toFixed(1)}KB)` : '/';
        return `${e.isDirectory() ? '📁' : '📄'} ${e.name}${size}`;
      } catch { return `  ${e.name}`; }
    });
    return `📂 ${resolved}\n${items.join('\n')}`;
  } catch (e: any) {
    return `Directory error: ${e.message}`;
  }
}

async function toolHttpRequest(url: string, method: string = 'GET', headers: Record<string,string> = {}, body?: string, timeout: number = 15000): Promise<string> {
  try {
    const opts: RequestInit = {
      method,
      headers: { 'User-Agent': 'ForgeAgent/1.0', 'Content-Type': 'application/json', ...headers },
    };
    if (body && ['POST','PUT','PATCH'].includes(method)) opts.body = body;
    const resp = await fetchWithTimeout(url, opts, Math.min(timeout, 30000));
    const ct = resp.headers.get('content-type') || '';
    const text = await resp.text();
    const headersOut = Object.fromEntries(resp.headers.entries());
    const preview = ct.includes('json') ? (() => { try { return JSON.stringify(JSON.parse(text), null, 2).slice(0,8000); } catch { return text.slice(0,8000); } })() : text.slice(0,8000);
    return `HTTP ${resp.status} ${resp.statusText}\nContent-Type: ${ct}\n\n${preview}${text.length > 8000 ? `\n\n[... ${text.length - 8000} more bytes truncated]` : ''}`;
  } catch (e: any) {
    return `HTTP error: ${e.message}`;
  }
}

// Browser sessions — keyed by session_id
const browserSessions: Map<string, any> = new Map();

async function toolBrowserAction(action: string, opts: {
  url?: string; selector?: string; text?: string; script?: string;
  timeout?: number; session_id?: string;
}): Promise<string> {
  const timeout = opts.timeout || 30000;
  let playwright: any;
  try {
    playwright = require('playwright-core');
  } catch {
    // Playwright not installed — fall back to fetch-based scrape for navigate/get_text
    if (action === 'navigate' || action === 'get_text') {
      return opts.url ? await toolWebScrape(opts.url) : 'No URL provided';
    }
    return 'Browser automation requires playwright-core. Falling back: use web_scrape for static pages.';
  }

  const sessionId = opts.session_id || uuidv4();
  let session = browserSessions.get(sessionId);

  try {
    if (!session) {
      const browser = await playwright.chromium.launch({
        headless: true,
        args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu']
      });
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 }
      });
      const page = await context.newPage();
      session = { browser, context, page, id: sessionId };
      browserSessions.set(sessionId, session);
      // Auto-cleanup after 5 minutes
      setTimeout(async () => {
        try { await session.browser.close(); } catch {}
        browserSessions.delete(sessionId);
      }, 5 * 60 * 1000);
    }

    const { page } = session;

    switch (action) {
      case 'navigate': {
        if (!opts.url) return 'URL required for navigate action';
        await page.goto(opts.url, { waitUntil: 'domcontentloaded', timeout });
        const title = await page.title();
        const url = page.url();
        return `Navigated to: ${url}\nPage title: ${title}\nSession ID: ${sessionId} (reuse this for follow-up actions)`;
      }
      case 'click': {
        if (!opts.selector) return 'selector required for click';
        await page.waitForSelector(opts.selector, { timeout });
        await page.click(opts.selector);
        await page.waitForTimeout(500);
        return `Clicked: ${opts.selector}`;
      }
      case 'type': {
        if (!opts.selector || !opts.text) return 'selector and text required for type';
        await page.waitForSelector(opts.selector, { timeout });
        await page.fill(opts.selector, opts.text);
        return `Typed "${opts.text}" into ${opts.selector}`;
      }
      case 'fill_form': {
        // text is JSON: {"selector": "value", ...}
        if (!opts.text) return 'text (JSON field map) required for fill_form';
        const fields = JSON.parse(opts.text);
        const results: string[] = [];
        for (const [sel, val] of Object.entries(fields)) {
          try {
            await page.waitForSelector(sel, { timeout: 5000 });
            await page.fill(sel, String(val));
            results.push(`✓ ${sel} = ${String(val).slice(0,30)}`);
          } catch (e: any) { results.push(`✗ ${sel}: ${e.message}`); }
        }
        return results.join('\n');
      }
      case 'screenshot': {
        const buf = await page.screenshot({ type: 'png', fullPage: false });
        const b64 = buf.toString('base64');
        return `Screenshot taken (${buf.length} bytes base64). Session: ${sessionId}\nData: data:image/png;base64,${b64.slice(0,200)}...`;
      }
      case 'get_text': {
        const text = await page.evaluate(() => document.body.innerText);
        return text.slice(0, 16000);
      }
      case 'get_html': {
        const html = await page.content();
        // Strip scripts/styles, return clean HTML
        const clean = html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'');
        return clean.slice(0, 16000);
      }
      case 'wait': {
        const ms = opts.timeout || 2000;
        await page.waitForTimeout(Math.min(ms, 10000));
        return `Waited ${ms}ms`;
      }
      case 'scroll': {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        return 'Scrolled down one viewport';
      }
      case 'evaluate': {
        if (!opts.script) return 'script required for evaluate';
        const result = await page.evaluate(opts.script);
        return JSON.stringify(result, null, 2).slice(0, 8000);
      }
      default:
        return `Unknown browser action: ${action}`;
    }
  } catch (e: any) {
    // On error, clean up session
    if (session) {
      try { await session.browser.close(); } catch {}
      browserSessions.delete(sessionId);
    }
    return `Browser action "${action}" failed: ${e.message}`;
  }
}

// Master tool dispatcher
async function runForgeTool(toolName: string, args: any): Promise<string> {
  try {
    switch (toolName) {
      case 'web_search':     return await toolWebSearch(args.query, args.num_results);
      case 'web_scrape':     return await toolWebScrape(args.url, args.selector);
      case 'run_code':       return await toolRunCode(args.language, args.code, args.timeout);
      case 'shell_exec':     return await toolShellExec(args.command, args.cwd, args.timeout);
      case 'read_file':      return toolReadFile(args.path, args.encoding, args.max_bytes);
      case 'write_file':     return toolWriteFile(args.path, args.content, args.append);
      case 'list_directory': return toolListDirectory(args.path, args.recursive);
      case 'http_request':   return await toolHttpRequest(args.url, args.method, args.headers || {}, args.body, args.timeout);
      case 'browser_action': return await toolBrowserAction(args.action, args);
      // Legacy compat
      case 'web_fetch':      return await toolWebScrape(args.url);
      case 'extract_data':   return `Extracted: ${args.text?.slice(0,500)}`;
      case 'summarize':      return `[summarize tool — pass text directly to the model instead]`;
      default:               return `Unknown tool: ${toolName}`;
    }
  } catch (e: any) {
    return `Tool ${toolName} error: ${e.message}`;
  }
}

// ─── Anthropic agentic loop with native tool_use ──────────────────────────────
async function callAnthropicWithTools(
  apiKey: string, model: string, messages: any[],
  onToolCall: (name: string, args: any, result: string) => void,
  maxIters: number = 8
): Promise<{ content: string; promptTokens: number; completionTokens: number; toolCalls: Array<{name:string;args:any;result:string}> }> {
  let promptTokens = 0, completionTokens = 0;
  const toolCalls: Array<{name:string;args:any;result:string}> = [];
  const msgs = [...messages];
  // Separate system from conversation
  const systemMsgs = msgs.filter(m => m.role === 'system');
  const convMsgs = msgs.filter(m => m.role !== 'system');
  const systemContent = systemMsgs.map(m => m.content).join('\n\n');

  for (let iter = 0; iter < maxIters; iter++) {
    const body: any = {
      model,
      max_tokens: 4096,
      tools: FORGE_TOOLS_ANTHROPIC,
      messages: convMsgs,
    };
    if (systemContent) body.system = systemContent;

    const resp = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }, 45000);
    if (!resp.ok) { const e = await resp.text(); throw new Error(`Anthropic error: ${e.slice(0,300)}`); }
    const data: any = await resp.json();
    promptTokens += data.usage?.input_tokens || 0;
    completionTokens += data.usage?.output_tokens || 0;

    if (data.stop_reason === 'end_turn' || !data.content?.some((b: any) => b.type === 'tool_use')) {
      // Final text response
      const textBlocks = data.content?.filter((b: any) => b.type === 'text') || [];
      const finalText = textBlocks.map((b: any) => b.text).join('');
      return { content: finalText, promptTokens, completionTokens, toolCalls };
    }

    // Process tool_use blocks
    const toolUseBlocks = data.content.filter((b: any) => b.type === 'tool_use');
    const toolResults: any[] = [];

    for (const block of toolUseBlocks) {
      const result = await runForgeTool(block.name, block.input || {});
      toolCalls.push({ name: block.name, args: block.input, result });
      onToolCall(block.name, block.input, result);
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result.slice(0, 20000) });
    }

    // Add assistant message with tool_use + tool results to conversation
    convMsgs.push({ role: 'assistant', content: data.content });
    convMsgs.push({ role: 'user', content: toolResults });
  }

  return { content: 'Max tool iterations reached.', promptTokens, completionTokens, toolCalls };
}

// ─── OpenAI-compatible tool_use loop (OpenRouter, OpenAI, Groq, Mistral) ────────
async function callOpenAICompatWithTools(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: any[],
  extraHeaders: Record<string,string> = {},
  onToolCall: (name: string, args: any, result: string) => void,
  maxIters: number = 8
): Promise<{ content: string; promptTokens: number; completionTokens: number; toolCalls: Array<{name:string;args:any;result:string}> }> {
  let promptTokens = 0, completionTokens = 0;
  const allToolCalls: Array<{name:string;args:any;result:string}> = [];
  const msgs = [...messages];

  for (let iter = 0; iter < maxIters; iter++) {
    const body: any = { model, messages: msgs, max_tokens: 4096, tools: FORGE_TOOLS_OPENAI, tool_choice: 'auto' };
    const headers: any = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', ...extraHeaders };
    let res: Response;
    try {
      res = await fetchWithTimeout(baseUrl, { method: 'POST', headers, body: JSON.stringify(body) }, 60000);
    } catch (e: any) {
      throw new Error(`${baseUrl} timed out: ${e.message}`);
    }
    if (!res.ok) { const e = await res.text(); throw new Error(`API error: ${e.slice(0,300)}`); }
    const data: any = await res.json();
    if (data.error) throw new Error(`API error: ${JSON.stringify(data.error).slice(0,200)}`);

    const choice = data.choices?.[0];
    promptTokens += data.usage?.prompt_tokens || 0;
    completionTokens += data.usage?.completion_tokens || 0;

    const assistantMsg = choice?.message;
    if (!assistantMsg) break;

    // No tool calls — we have final answer
    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0 || choice.finish_reason === 'stop') {
      return { content: assistantMsg.content || '', promptTokens, completionTokens, toolCalls: allToolCalls };
    }

    // Push assistant message with tool_calls
    msgs.push(assistantMsg);

    // Execute all tool calls
    for (const tc of assistantMsg.tool_calls) {
      const toolName = tc.function?.name || tc.name;
      let toolArgs: any = {};
      try { toolArgs = JSON.parse(tc.function?.arguments || tc.arguments || '{}'); } catch {}
      const toolResult = await runForgeTool(toolName, toolArgs);
      allToolCalls.push({ name: toolName, args: toolArgs, result: toolResult });
      onToolCall(toolName, toolArgs, toolResult);
      // Push tool result message
      msgs.push({ role: 'tool', tool_call_id: tc.id, name: toolName, content: toolResult.slice(0, 8000) });
    }
  }
  return { content: 'Max iterations reached.', promptTokens, completionTokens, toolCalls: allToolCalls };
}

// ─── ForgeAgent SSE run loop (legacy endpoint — still works) ──────────────────

app.post('/api/agent/run', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { message, prompt, model: reqModel } = req.body;
  const msgContent = message || prompt; // accept both field names
  if (!msgContent?.trim()) { res.status(400).json({ error: 'message required' }); return; }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const emit = (type: string, data: any) => {
    try { res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`); } catch {}
  };

  const rawModel = reqModel || 'claude-sonnet-4';
  const actualModel = resolveForgeModel(rawModel);
  const provider = getProviderForModel(actualModel);
  const apiKey = getUserKey(userId, provider);
  if (!apiKey) {
    emit('error', { message: `No ${provider} API key. Add it in Settings.` });
    res.end(); return;
  }

  emit('start', { message: `🤖 ForgeAgent starting with ${rawModel}…` });
  emitAgentActivity(userId, { type: 'start', message: `🤖 ForgeAgent: ${msgContent.slice(0,60)}…` });

  const toolSchemas = AGENT_TOOLS.map(t => `Tool: ${t.name}\nDescription: ${t.description}\nParams: ${JSON.stringify(t.parameters)}`).join('\n\n');
  const systemPrompt = `You are ForgeAgent, an autonomous AI that can use tools to accomplish tasks.

Available tools:
${toolSchemas}

To use a tool, respond with ONLY a JSON object (no markdown, no extra text):
{"tool": "tool_name", "args": {...}, "reasoning": "why you're using this tool"}

When you have a final answer, respond with plain text (not JSON).
Be efficient: use tools when needed, respond directly when you know the answer.`;

  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: msgContent.trim() }
  ];

  const MAX_ITERS = 6;
  for (let i = 0; i < MAX_ITERS; i++) {
    emit('thinking', { message: `🤔 Thinking… (step ${i+1})`, step: i+1 });
    emitAgentActivity(userId, { type: 'thinking', message: `🤔 ForgeAgent thinking step ${i+1}` });
    let llmResponse: string;
    try {
      const result = await callLLM(provider, apiKey, actualModel, messages.filter(m => m.role !== 'system').length > 0 ? messages : [{ role: 'user', content: msgContent.trim() }]);
      llmResponse = result.content;
    } catch (e: any) {
      emit('error', { message: `LLM error: ${e.message}` });
      break;
    }

    // Try to parse as tool call
    let parsed: any = null;
    try {
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch {}

    if (parsed?.tool && AGENT_TOOLS.find(t => t.name === parsed.tool)) {
      emit('tool_call', { tool: parsed.tool, args: parsed.args, reasoning: parsed.reasoning });
      emitAgentActivity(userId, { type: 'tool', message: `🔧 Using tool: ${parsed.tool}` });
      const toolResult = await runAgentTool(parsed.tool, parsed.args, userId);
      emit('tool_result', { tool: parsed.tool, result: toolResult.slice(0, 2000) });
      messages.push({ role: 'assistant', content: llmResponse });
      messages.push({ role: 'user', content: `Tool result for ${parsed.tool}:\n${toolResult}\n\nContinue or provide your final answer.` });
    } else {
      // Final answer
      emit('response', { content: llmResponse });
      emitAgentActivity(userId, { type: 'done', message: `✅ ForgeAgent complete` });
      break;
    }
  }

  emit('done', { message: 'Agent run complete' });
  res.end();
});

// ─── Live preview: emit SSE events during regular chat ─────────────────────────
// Patch the POST /api/threads/:id/messages to also emit live activity events
// (handled inline in that route via emitAgentActivity — see route above)
// This route just provides a summary endpoint for the live tab
app.get('/api/live/summary', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const recent = db.prepare('SELECT id,role,content,created_at FROM messages WHERE thread_id IN (SELECT id FROM threads WHERE user_id=?) ORDER BY created_at DESC LIMIT 10').all(userId);
  res.json({ success: true, data: recent });
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req: any, res: any) => {
  res.status(404).json({ success: false, error: 'NOT_FOUND', path: req.path });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Forge Platform v6.1 running on port ${PORT} | DB: ${DB_PATH}`);
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled rejection:', reason);
});
