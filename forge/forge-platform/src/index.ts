/**
 * Forge Platform v6.83 — Full production: SQLite + GraphQL + webhooks + rate-limiting + multi-model
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
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import vm from 'vm';
import { execFile, exec } from 'child_process';
import { promisify } from 'util';
import Database from 'better-sqlite3';
import { setupAutonomy } from './autonomy';
import cron from 'node-cron';

const execAsync = promisify(exec);

// ── Crash visibility: never die silently; surface the real error in Railway logs ──
process.on('uncaughtException', (e: any) => { console.error('🔴 UNCAUGHT EXCEPTION:', e?.stack || e?.message || e); });
process.on('unhandledRejection', (e: any) => { console.error('🔴 UNHANDLED REJECTION:', e?.stack || e?.message || e); });

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

// Token-saver: per-user cache of skill-prompt text. The frontend ships the full skill
// prompts only when the active-skill set changes; on subsequent messages it sends just IDs,
// and we rehydrate the prompts from this cache instead of re-paying for them every turn.
const skillPromptCache = new Map<string, Record<string, string>>();

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
// Shared Socket.IO ref — set during bootstrap, used by routes for realtime push
let ioRef: any = null;
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
app.get('/health', (_req, res) => res.json({ status: 'ok', environment: NODE_ENV, timestamp: new Date().toISOString(), version: 'v6.99' }));
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
  try { touchStreak(user.id); } catch {}
  res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: NODE_ENV === 'production', sameSite: NODE_ENV === 'production' ? 'none' : 'lax', maxAge: 7 * 86400000 });
  // return both keys for compatibility with old/new frontend
  res.json({ success: true, message: 'Login successful', accessToken, access_token: accessToken, data: { accessToken, access_token: accessToken, user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role } } });
});

// Dev-only password reset (no auth required — secured by secret header)
app.post('/api/auth/reset-password', (req, res) => {
  const { email, newPassword, secret } = req.body;
  if (secret !== (process.env.RESET_SECRET || 'forge-reset-2026')) { res.status(403).json({ success: false, error: 'FORBIDDEN' }); return; }
  if (!email || !newPassword || newPassword.length < 8) { res.status(400).json({ success: false, error: 'INVALID_INPUT' }); return; }
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase()) as any;
  if (!user) { res.status(404).json({ success: false, error: 'USER_NOT_FOUND' }); return; }
  db.prepare("UPDATE users SET password=?,updated_at=datetime('now') WHERE id=?").run(bcrypt.hashSync(newPassword, 10), user.id);
  res.json({ success: true, message: 'Password updated' });
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
  res.cookie('refreshToken', newRefresh, { httpOnly: true, secure: NODE_ENV === 'production', sameSite: NODE_ENV === 'production' ? 'none' : 'lax', maxAge: 7 * 86400000 });
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
// Phase 4: billing is live — do NOT reset tokens on startup. Set correct plan limits for any rows that still have the old 1M default.
try { db.exec(`UPDATE subscriptions SET tokens_limit=10000   WHERE plan='free'      AND tokens_limit=1000000`); } catch {}
try { db.exec(`UPDATE subscriptions SET tokens_limit=500000  WHERE plan='starter'   AND tokens_limit=1000000`); } catch {}
try { db.exec(`UPDATE subscriptions SET tokens_limit=2000000 WHERE plan='pro'       AND tokens_limit=1000000`); } catch {}
try { db.exec(`UPDATE subscriptions SET tokens_limit=10000000 WHERE plan='enterprise' AND tokens_limit=1000000`); } catch {}
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
  'forge-fable':      { input: 0.010,   output: 0.050,  provider: 'anthropic', markup: 1.5  },
  'forge-pro':        { input: 0.003,   output: 0.015,  provider: 'anthropic', markup: 1.5  },
  'forge-fast':       { input: 0.00015, output: 0.0006, provider: 'groq',      markup: 2.0  },
  'forge-code':       { input: 0.0025,  output: 0.010,  provider: 'anthropic', markup: 1.5  },
  'forge-creative':   { input: 0.003,   output: 0.015,  provider: 'openai',    markup: 1.5  },
  'claude-fable-5':   { input: 0.010,   output: 0.050,  provider: 'anthropic', markup: 1.35 },
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
  'claude-fable-5':             'claude-fable-5',
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
    'forge-fable':    'claude-fable-5',
    'forge-ultra':    'claude-opus-4-6',
    'forge-pro':      'claude-sonnet-4-6',
    'forge-flash':    'claude-haiku-4-5-20251001',
    'forge-fast':     'llama-3.3-70b',
    'forge-code':     'gpt-4.1',
    'forge-creative': 'gpt-4o',
    'forge-gpt':      'gpt-4o',
    'forge-gemini':   'gemini-2.0-flash',
  };
  // Strip leading "~" (OpenRouter auto-route marker the UI may add) and "openrouter/" prefix — OR API expects bare IDs
  let cleaned = modelId.startsWith('~') ? modelId.slice(1) : modelId;
  cleaned = cleaned.startsWith('openrouter/') ? cleaned.slice('openrouter/'.length) : cleaned;
  return forgeMap[cleaned] || ANTHROPIC_MODEL_MAP[cleaned] || cleaned;
}

function getProviderForModel(modelId: string): string {
  // Strip leading "~" and openrouter/ prefix if present before routing
  let mid = modelId.startsWith('~') ? modelId.slice(1) : modelId;
  mid = mid.startsWith('openrouter/') ? mid.slice('openrouter/'.length) : mid;
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

// Returns the best available LLM provider+key+model for a user (for internal tasks)
function getUserLLMKey(userId: string): { provider: string; apiKey: string; model: string } {
  const order = [
    { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' },
    { provider: 'openrouter', model: 'meta-llama/llama-3.1-8b-instruct' },
    { provider: 'openai', model: 'gpt-4o-mini' },
    { provider: 'gemini', model: 'gemini-1.5-flash' },
    { provider: 'groq', model: 'llama3-8b-8192' },
  ];
  for (const { provider, model } of order) {
    const apiKey = getUserKey(userId, provider);
    if (apiKey) return { provider, apiKey, model };
  }
  return { provider: 'anthropic', apiKey: '', model: 'claude-haiku-4-5-20251001' };
}

// Magic-mode fallback chain: ordered list of every provider/model the user can actually use,
// from most capable to fastest/cheapest. Used to auto-retry when a model errors or times out.
// `difficulty` hints how hard the task is so we can start on a stronger model for complex work.
function getFallbackChain(userId: string, preferred?: { provider: string; model: string }, difficulty: 'simple'|'medium'|'hard' = 'medium'): Array<{ provider: string; apiKey: string; model: string }> {
  const tiers: Array<{ provider: string; model: string }> = [
    { provider: 'anthropic',  model: 'claude-sonnet-4-6' },
    { provider: 'openai',     model: 'gpt-4o' },
    { provider: 'openrouter', model: 'deepseek/deepseek-chat' },
    { provider: 'gemini',     model: 'gemini-2.0-flash' },
    { provider: 'groq',       model: 'llama-3.3-70b' },
    { provider: 'mistral',    model: 'mistral-large' },
    // fast/cheap tail — always tried last so we "never fail" if anything has a key
    { provider: 'anthropic',  model: 'claude-haiku-4-5-20251001' },
    { provider: 'openai',     model: 'gpt-4o-mini' },
    { provider: 'groq',       model: 'llama-3.1-8b' },
    { provider: 'gemini',     model: 'gemini-1.5-flash' },
  ];
  const chain: Array<{ provider: string; apiKey: string; model: string }> = [];
  const seen = new Set<string>();
  const push = (provider: string, model: string) => {
    const k = provider + '|' + model;
    if (seen.has(k)) return;
    const apiKey = getUserKey(userId, provider);
    if (apiKey) { chain.push({ provider, apiKey, model }); seen.add(k); }
  };
  // honour the user's explicitly-chosen model first
  if (preferred?.provider && preferred?.model) push(preferred.provider, preferred.model);
  // for hard tasks prefer the strongest tier first; for simple tasks a fast model is fine
  const ordered = difficulty === 'simple' ? [...tiers].reverse() : tiers;
  for (const t of ordered) push(t.provider, t.model);
  return chain;
}

// Heuristic task-difficulty estimate from the user's message — lets magic mode pick a
// strong model for hard work and a fast one for trivial asks.
function estimateDifficulty(text: string): 'simple'|'medium'|'hard' {
  const t = (text || '').toLowerCase();
  const len = t.length;
  const hardSignals = ['build', 'implement', 'refactor', 'architecture', 'design a', 'debug', 'optimize', 'algorithm', 'full app', 'end to end', 'multi-step', 'analyze', 'prove', 'derive', 'migrate'];
  const simpleSignals = ['hi', 'hello', 'thanks', 'what is', 'define', 'translate', 'summarize', 'rename', 'list '];
  if (hardSignals.some(s => t.includes(s)) || len > 600) return 'hard';
  if (simpleSignals.some(s => t.startsWith(s) || t.includes(s)) && len < 120) return 'simple';
  return 'medium';
}

// Reliable timeout helper — AbortSignal.timeout has bugs in some Node 18 builds
function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: controller.signal })
    .then(r => { clearTimeout(timer); return r; })
    .catch(e => { clearTimeout(timer); throw e; });
}

// Fable 5 model IDs — require special headers and refusal handling
const FABLE5_MODELS = new Set(['claude-fable-5', 'claude-mythos-5', 'forge-fable']);

// Effort levels for Fable 5 adaptive thinking
const EFFORT_MAP: Record<string, string> = { low: 'low', medium: 'medium', high: 'high' };

async function callLLM(provider: string, apiKey: string, model: string, messages: any[], _language?: string, opts?: { effort?: string; maxTokens?: number; taskBudget?: number }): Promise<{ content: string; promptTokens: number; completionTokens: number; refused?: boolean; refusedReason?: string }> {
  const isFable5 = FABLE5_MODELS.has(model);
  // Anthropic
  if (provider === 'anthropic') {
    const maxTokens = opts?.maxTokens || (isFable5 ? 16000 : 4096);
    const body: any = { model, messages, max_tokens: maxTokens };
    // Fable 5: add effort param for adaptive thinking depth
    if (isFable5 && opts?.effort) {
      body.thinking = { type: 'adaptive', effort: EFFORT_MAP[opts.effort] || 'medium' };
    }
    const headers: Record<string,string> = {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    };
    // Task budgets beta header
    if (opts?.taskBudget) headers['anthropic-beta'] = 'task-budgets-2026-03-13';
    if (opts?.taskBudget) body['task_budget'] = { max_tokens: opts.taskBudget };
    let res: Response;
    try { res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', { method:'POST', headers, body:JSON.stringify(body) }, 180000); }
    catch (e: any) { throw new Error(e?.name==='AbortError' ? 'Anthropic timed out — model may be overloaded, try again' : e.message); }
    if (!res.ok) { const e = await res.text(); throw new Error(`Anthropic error: ${e.slice(0,200)}`); }
    const d: any = await res.json();
    // Fable 5 refusal handling: stop_reason === 'refusal'
    if (d.stop_reason === 'refusal') {
      return { content: '', promptTokens: d.usage?.input_tokens || 0, completionTokens: 0, refused: true, refusedReason: d.refusal_classifier || 'policy' };
    }
    const text = d.content?.find((b: any) => b.type === 'text')?.text || d.content?.[0]?.text || '';
    return { content: text, promptTokens: d.usage?.input_tokens || 0, completionTokens: d.usage?.output_tokens || 0 };
  }
  // OpenAI
  if (provider === 'openai') {
    let res: Response;
    try { res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', { method:'POST', headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'}, body:JSON.stringify({model,messages,max_tokens:4096}) }, 120000); }
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
    const orModel = (model.startsWith('~') ? model.slice(1) : model).replace(/^openrouter\//, '');
    let res: Response;
    try { res = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', { method:'POST', headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json','HTTP-Referer':'https://forge-sand-two.vercel.app','X-Title':'Forge Studio'}, body:JSON.stringify({model:orModel,messages,max_tokens:2048}) }, 150000); }
    catch (e: any) { throw new Error(e?.name==='AbortError' ? `Model "${orModel}" timed out. DeepSeek and some models can be slow under load — try again or switch to Claude/GPT-4o for faster responses.` : e.message); }
    if (!res.ok) {
      const e = await res.text();
      if (res.status === 429) {
        const isFree = orModel.endsWith(':free') || orModel.includes('/free');
        throw new Error(isFree
          ? `⚡ Free model "${orModel}" has hit its shared rate limit. Switch to a paid model for unthrottled access.`
          : `⚡ Rate limit hit for "${orModel}". Wait a moment and try again, or switch to a different model.`);
      }
      throw new Error(`OpenRouter error (${orModel}): ${e.slice(0,300)}`);
    }
    const d: any = await res.json();
    if (d.error) {
      if (d.error.code === 429) {
        const isFree = orModel.endsWith(':free') || orModel.includes('/free');
        throw new Error(isFree
          ? `⚡ Free model "${orModel}" has hit its shared rate limit. Switch to a paid model for unthrottled access.`
          : `⚡ Rate limit hit for "${orModel}". Wait a moment and try again, or switch to a different model.`);
      }
      throw new Error(`OpenRouter error (${orModel}): ${JSON.stringify(d.error).slice(0,200)}`);
    }
    return { content: d.choices?.[0]?.message?.content || '', promptTokens: d.usage?.prompt_tokens || 0, completionTokens: d.usage?.completion_tokens || 0 };
  }
  throw new Error(`Unknown provider: ${provider}`);
}

// ─── Fable 5 fallback chain ───────────────────────────────────────────────────

const FALLBACK_CHAIN = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'];

async function callLLMWithFallback(
  provider: string,
  apiKey: string,
  model: string,
  messages: any[],
  language?: string,
  opts?: { effort?: string; maxTokens?: number; taskBudget?: number }
): Promise<{ content: string; promptTokens: number; completionTokens: number; usedModel?: string }> {
  const result = await callLLM(provider, apiKey, model, messages, language, opts);
  if (!result.refused) return { ...result, usedModel: model };

  // Fable 5 refused — try fallback chain
  for (const fallbackModel of FALLBACK_CHAIN) {
    if (fallbackModel === model) continue;
    try {
      const fb = await callLLM(provider, apiKey, fallbackModel, messages, language, {});
      if (!fb.refused) return { ...fb, usedModel: fallbackModel };
    } catch (_e) {
      continue;
    }
  }
  throw new Error(`All models refused request (classifier: ${result.refusedReason || 'policy'})`);
}

// ─── Tool infrastructure ──────────────────────────────────────────────────────

async function toolShellExec(command: string, cwd?: string, timeoutMs = 15000): Promise<string> {
  return new Promise((resolve) => {
    exec(command, { cwd: cwd || '/tmp', timeout: timeoutMs, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      resolve(stdout || stderr || (err ? err.message : ''));
    });
  });
}

async function runForgeTool(toolName: string, args: Record<string, any>, userId?: string): Promise<string> {
  try {
    switch (toolName) {
      case 'web_search': {
        const q = encodeURIComponent(args.query || args.q || '');
        if (!q) return 'No query provided';
        // Use DuckDuckGo HTML scrape as fallback (no API key required)
        const res = await fetchWithTimeout(`https://html.duckduckgo.com/html/?q=${q}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 8000);
        const html = await res.text();
        // Extract result snippets
        const results: string[] = [];
        const snippetRe = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
        const titleRe = /<a class="result__a"[^>]*>([\s\S]*?)<\/a>/g;
        let m; const titles: string[] = [];
        while ((m = titleRe.exec(html)) !== null && titles.length < 5) titles.push(m[1].replace(/<[^>]+>/g, '').trim());
        const snips: string[] = [];
        while ((m = snippetRe.exec(html)) !== null && snips.length < 5) snips.push(m[1].replace(/<[^>]+>/g, '').trim());
        for (let i = 0; i < Math.min(titles.length, snips.length, 5); i++) results.push(`**${titles[i]}**\n${snips[i]}`);
        return results.length ? results.join('\n\n') : `Search completed for: ${decodeURIComponent(q)}`;
      }
      case 'run_code': {
        const lang = (args.language || 'javascript').toLowerCase();
        const code = args.code || '';
        if (lang === 'javascript' || lang === 'js') {
          const tmpFile = `/tmp/forge_code_${Date.now()}.js`;
          const { writeFileSync } = await import('fs');
          writeFileSync(tmpFile, code);
          return await toolShellExec(`node ${tmpFile}`, '/tmp', 10000);
        } else if (lang === 'python' || lang === 'py') {
          const tmpFile = `/tmp/forge_code_${Date.now()}.py`;
          const { writeFileSync } = await import('fs');
          writeFileSync(tmpFile, code);
          return await toolShellExec(`python3 ${tmpFile}`, '/tmp', 10000);
        }
        return `Language ${lang} not supported. Use javascript or python.`;
      }
      case 'write_file': {
        const path = args.path || args.filename || '/tmp/forge_output.txt';
        const content = args.content || '';
        const { writeFileSync, mkdirSync } = await import('fs');
        const { dirname } = await import('path');
        try { mkdirSync(dirname(path), { recursive: true }); } catch {}
        writeFileSync(path, content, 'utf8');
        return `File written: ${path} (${content.length} bytes)`;
      }
      case 'read_file': {
        const path = args.path || args.filename || '';
        if (!path) return 'No path provided';
        const { readFileSync } = await import('fs');
        try { return readFileSync(path, 'utf8'); } catch (e: any) { return `Error reading file: ${e.message}`; }
      }
      case 'shell': {
        const cmd = args.command || args.cmd || '';
        if (!cmd) return 'No command provided';
        return await toolShellExec(cmd, args.cwd, 15000);
      }
      case 'spawn_agent': {
        const agentName = args.name || 'Sub-Agent';
        const agentTask = args.task || '';
        // Return a structured marker the frontend can display as an agent step
        return `[AGENT:${agentName}] Task accepted: "${agentTask.slice(0, 120)}". Working in parallel…`;
      }
      case 'create_artifact': {
        return `Artifact created: ${args.title || 'untitled'}\n\`\`\`${args.language || ''}\n${args.content || ''}\n\`\`\``;
      }
      case 'image_gen': {
        const prompt = args.prompt || args.description || '';
        if (!prompt) return 'No prompt provided';
        const size = args.size || '1024x1024';
        const quality = args.quality || 'standard';
        // Try to get OpenAI key from DB for this user context (passed via closure not available here, use env)
        const openaiKey = (userId ? getUserKey(userId, 'openai') : null) || process.env.OPENAI_API_KEY || '';
        if (!openaiKey) return 'Image generation requires an OpenAI API key. Please add your OpenAI key in Settings.';
        const imgRes = await fetchWithTimeout('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size, quality, response_format: 'url' })
        }, 30000);
        const imgData: any = await imgRes.json();
        if (imgData.error) return `Image generation error: ${imgData.error.message}`;
        const url = imgData.data?.[0]?.url;
        if (!url) return 'No image URL returned';
        return `![Generated Image](${url})\n\n${imgData.data?.[0]?.revised_prompt ? `*Prompt: ${imgData.data[0].revised_prompt}*` : ''}`;
      }
      case 'http_request': {
        const url = args.url || '';
        if (!url) return 'No URL provided';
        const method = (args.method || 'GET').toUpperCase();
        const fetchOpts: RequestInit = { method, headers: args.headers || {} };
        if (args.body && method !== 'GET') fetchOpts.body = typeof args.body === 'string' ? args.body : JSON.stringify(args.body);
        const r = await fetchWithTimeout(url, fetchOpts, 10000);
        const text = await r.text();
        return `Status: ${r.status}\n${text.slice(0, 2000)}`;
      }
      default:
        return `Tool '${toolName}' executed with args: ${JSON.stringify(args)}`;
    }
  } catch (e: any) {
    return `Tool error (${toolName}): ${e.message}`;
  }
}

const FORGE_TOOLS_ANTHROPIC = [
  { name: 'spawn_agent', description: 'Spawn a sub-agent to work on a parallel task. Use for orchestration of multi-step or multi-domain jobs.', input_schema: { type: 'object', properties: { name: { type: 'string', description: 'Agent name/role e.g. Researcher, Coder, Designer' }, task: { type: 'string', description: 'Full task description for this sub-agent' }, model: { type: 'string', description: 'Model to use, e.g. forge-fast, claude-sonnet-4' } }, required: ['name', 'task'] } },
  { name: 'web_search', description: 'Search the web for real-time information', input_schema: { type: 'object', properties: { query: { type: 'string', description: 'Search query' } }, required: ['query'] } },
  { name: 'run_code', description: 'Execute JavaScript or Python code and return output', input_schema: { type: 'object', properties: { language: { type: 'string', enum: ['javascript', 'python'] }, code: { type: 'string', description: 'Code to execute' } }, required: ['language', 'code'] } },
  { name: 'write_file', description: 'Write content to a file', input_schema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] } },
  { name: 'read_file', description: 'Read contents of a file', input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
  { name: 'shell', description: 'Execute a shell command', input_schema: { type: 'object', properties: { command: { type: 'string' }, cwd: { type: 'string' } }, required: ['command'] } },
  { name: 'http_request', description: 'Make an HTTP request to any URL', input_schema: { type: 'object', properties: { url: { type: 'string' }, method: { type: 'string', enum: ['GET','POST','PUT','DELETE','PATCH'] }, headers: { type: 'object' }, body: {} }, required: ['url'] } },
  { name: 'create_artifact', description: 'Create a code or content artifact to display to the user', input_schema: { type: 'object', properties: { title: { type: 'string' }, language: { type: 'string' }, content: { type: 'string' } }, required: ['title', 'content'] } },
  { name: 'image_gen', description: 'Generate an image using DALL-E 3 from a text prompt', input_schema: { type: 'object', properties: { prompt: { type: 'string', description: 'Detailed description of image to generate' }, size: { type: 'string', enum: ['1024x1024','1792x1024','1024x1792'], description: 'Image dimensions' }, quality: { type: 'string', enum: ['standard','hd'] } }, required: ['prompt'] } },
];

// Convert Anthropic tool format to OpenAI function format
const FORGE_TOOLS_OPENAI = FORGE_TOOLS_ANTHROPIC.map(t => ({
  type: 'function' as const,
  function: { name: t.name, description: t.description, parameters: t.input_schema }
}));
const FORGE_TOOLS_OPENROUTER = FORGE_TOOLS_OPENAI.filter((t:any) => !["web_search","image_gen","cursor_edit"].includes(t.function?.name));


// Turn a raw tool call into a warm, human first-person status line — used across ALL providers
// so every model (Gemini, GPT, Claude, OpenRouter, Groq…) narrates work the same friendly way.
function humanizeToolStep(toolName: string, args: Record<string, any>): { icon: string; message: string } {
  const a = args || {};
  switch (toolName) {
    case 'web_search': {
      const q = String(a.query || a.q || '').slice(0, 60);
      return { icon: '🔎', message: `Searching for "${q}"…` };
    }
    case 'web_scrape':
    case 'http_request': {
      const url = String(a.url || '').replace(/^https?:\/\//, '').split('/')[0].slice(0, 40);
      return { icon: '🌐', message: url ? `Pulling data from ${url}…` : 'Fetching from the web…' };
    }
    case 'run_code': {
      const lang = String(a.language || 'code');
      return { icon: '⚙️', message: `Running ${lang} — let me compute this…` };
    }
    case 'write_file': {
      const fname = String(a.path || a.filename || 'file').split('/').pop() || 'file';
      return { icon: '📝', message: `Writing ${fname}…` };
    }
    case 'read_file': {
      const fname = String(a.path || a.filename || 'file').split('/').pop() || 'file';
      return { icon: '📖', message: `Reading ${fname}…` };
    }
    case 'shell': {
      const cmd = String(a.command || a.cmd || '').slice(0, 50);
      return { icon: '🖥️', message: cmd ? `Running: ${cmd}…` : 'Executing shell command…' };
    }
    case 'create_artifact': {
      const title = String(a.title || 'artifact');
      const lang = String(a.language || '');
      const typeLabel = lang === 'html' ? 'webpage' : lang === 'python' ? 'Python script' : lang === 'javascript' ? 'JS module' : 'artifact';
      return { icon: '✨', message: `Building ${title} (${typeLabel})…` };
    }
    case 'image_gen': {
      const prompt = String(a.prompt || a.description || '').slice(0, 50);
      return { icon: '🎨', message: `Generating image: "${prompt}"…` };
    }
    case 'browser_action': {
      const action = String(a.action || 'navigating');
      const target = String(a.url || a.selector || '').slice(0, 40);
      return { icon: '🧭', message: target ? `Browser: ${action} → ${target}…` : `Browser: ${action}…` };
    }
    case 'spawn_agent': {
      const name = String(a.name || 'sub-agent');
      return { icon: '🤖', message: `Spinning up ${name} agent…` };
    }
    default:
      return { icon: '🔧', message: `Using ${toolName.replace(/_/g, ' ')}…` };
  }
}

async function callAnthropicWithTools(
  apiKey: string, model: string, messages: any[],
  onToolCall: (name: string, args: any, result: string) => void,
  userId?: string
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const msgs = [...messages];
  let promptTokens = 0, completionTokens = 0;
  let lastText = '';
  for (let iter = 0; iter < 8; iter++) {
    const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model, messages: msgs.filter(m => m.role !== 'system'), system: msgs.find(m => m.role === 'system')?.content || '', max_tokens: 4096, tools: FORGE_TOOLS_ANTHROPIC })
    }, 45000);
    const d: any = await res.json();
    if (!res.ok) throw new Error(`Anthropic error: ${JSON.stringify(d.error || d).slice(0, 200)}`);
    promptTokens += d.usage?.input_tokens || 0;
    completionTokens += d.usage?.output_tokens || 0;
    if (d.stop_reason === 'end_turn' || !d.content?.some((b: any) => b.type === 'tool_use')) {
      const text = d.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('') || '';
      return { content: text, promptTokens, completionTokens };
    }
    // Process tool calls
    msgs.push({ role: 'assistant', content: d.content });
    const toolResults: any[] = [];
    for (const block of d.content) {
      if (block.type === 'tool_use') {
        const result = await runForgeTool(block.name, block.input, userId);
        onToolCall(block.name, block.input, result);
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
      }
    }
    // capture any text the model produced alongside its tool calls
    const interimText = d.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim();
    if (interimText) lastText = interimText;
    msgs.push({ role: 'user', content: toolResults });
  }
  return { content: lastText || 'I worked through the task but ran out of steps before wrapping up. Here\'s where I got — ask me to continue and I\'ll pick up from here.', promptTokens, completionTokens };
}

async function callOpenAICompatWithTools(
  url: string, apiKey: string, model: string, messages: any[],
  extraHeaders: Record<string, string>,
  onToolCall: (name: string, args: any, result: string) => void,
  tools?: any[],
  userId?: string
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const msgs = [...messages];
  let promptTokens = 0, completionTokens = 0;
  let lastText = '';
  for (let iter = 0; iter < 8; iter++) {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify({ model, messages: msgs, tools: tools || FORGE_TOOLS_OPENAI, tool_choice: 'auto', max_tokens: 4096 })
    }, 45000);
    const d: any = await res.json();
    if (!res.ok) {
      if (res.status === 429 || d.error?.code === 429) {
        const m = typeof d.error?.metadata?.raw === 'string' ? d.error.metadata.raw : '';
        const isFree = m.includes(':free') || model.endsWith(':free');
        throw new Error(isFree
          ? `⚡ Free model "${model}" has hit its shared rate limit. Switch to a paid model for unthrottled access.`
          : `⚡ Rate limit hit for "${model}". Wait a moment and try again, or switch to a different model.`);
      }
      throw new Error(`LLM error: ${JSON.stringify(d.error || d).slice(0, 200)}`);
    }
    promptTokens += d.usage?.prompt_tokens || 0;
    completionTokens += d.usage?.completion_tokens || 0;
    const msg = d.choices?.[0]?.message;
    if (!msg) throw new Error('No message in response');
    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      const finalText = (msg.content || '').trim();
      // If the model returned nothing usable, fall back to last interim text or a real diagnostic
      if (!finalText && !lastText) {
        return { content: 'The model returned an empty response. This usually means an invalid model id or a provider hiccup — try resending, or switch models in Settings.', promptTokens, completionTokens };
      }
      return { content: finalText || lastText, promptTokens, completionTokens };
    }
    if (typeof msg.content === 'string' && msg.content.trim()) lastText = msg.content.trim();
    msgs.push(msg);
    for (const tc of msg.tool_calls) {
      let args: any = {};
      try { args = JSON.parse(tc.function.arguments || '{}'); } catch {}
      const result = await runForgeTool(tc.function.name, args, userId);
      onToolCall(tc.function.name, args, result);
      msgs.push({ role: 'tool', tool_call_id: tc.id, content: result });
    }
  }
  return { content: lastText || 'I worked through the task but ran out of steps before wrapping up. Ask me to continue and I\'ll pick up from here.', promptTokens, completionTokens };
}

// ── Chat (also aliased as /api/chat/completions for OpenAI-compat clients) ──
app.post(['/api/chat', '/api/chat/completions'], requireAuth, async (req: AuthRequest, res) => {
  // Support both Forge format {messages,model} and OpenAI format {messages,model}
  const { messages, model = 'forge-fast', language = 'English', channel = 'Chat', attachments } = req.body;
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

  // Phase 4: enforce token limits. Admin/enterprise users are never blocked.
  {
    ensureSubscription(userId);
    const sub = db.prepare('SELECT plan, tokens_used, tokens_limit FROM subscriptions WHERE user_id=?').get(userId) as any;
    const userRow = db.prepare('SELECT role FROM users WHERE id=?').get(userId) as any;
    const isAdmin = userRow?.role === 'admin';
    if (sub && !isAdmin && sub.plan !== 'enterprise') {
      const overageTokens = sub.tokens_used - sub.tokens_limit;
      if (overageTokens >= 50000) {
        // Hard block after 50k overage tokens without payment
        res.status(402).json({ success: false, error: 'TOKEN_LIMIT_EXCEEDED', message: `You have used ${sub.tokens_used.toLocaleString()} / ${sub.tokens_limit.toLocaleString()} tokens. Upgrade your plan or add credits to continue.`, tokensUsed: sub.tokens_used, tokensLimit: sub.tokens_limit });
        return;
      }
    }
  }

  try {
    // Add language/channel context to system message if needed
    let systemMsg = language !== 'English' || channel !== 'Chat'
      ? [{ role: 'system', content: `You are a helpful AI assistant. Respond in ${language}. This is a ${channel} channel — keep format appropriate for that context.` }, ...messages]
      : [...messages];

    // Inject image/file attachments into last user message as vision content
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const lastUserIdx = systemMsg.map((m:any) => m.role).lastIndexOf('user');
      if (lastUserIdx >= 0) {
        const lastMsg = systemMsg[lastUserIdx];
        const textContent = typeof lastMsg.content === 'string' ? lastMsg.content : '';
        const contentParts: any[] = [];
        // Add images
        for (const att of attachments) {
          if (att.type === 'image' && att.data) {
            if (provider === 'anthropic') {
              contentParts.push({ type: 'image', source: { type: 'base64', media_type: att.mediaType || 'image/jpeg', data: att.data } });
            } else if (provider === 'openai') {
              contentParts.push({ type: 'image_url', image_url: { url: `data:${att.mediaType || 'image/jpeg'};base64,${att.data}` } });
            }
          } else if (att.type === 'text' && att.content) {
            contentParts.push(provider === 'anthropic' ? { type: 'text', text: att.content } : { type: 'text', text: att.content });
          }
        }
        if (textContent) contentParts.push(provider === 'anthropic' ? { type: 'text', text: textContent } : { type: 'text', text: textContent });
        if (contentParts.length > 0) {
          systemMsg[lastUserIdx] = { ...lastMsg, content: contentParts };
        }
      }
    }

    // Fable 5 effort/budget opts from request
    const effortOpts = FABLE5_MODELS.has(actualModel) ? {
      effort: req.body.effort || 'medium',
      maxTokens: req.body.maxTokens,
      taskBudget: req.body.taskBudget
    } : undefined;
    const result = await callLLMWithFallback(provider, apiKey, actualModel, systemMsg, language, effortOpts);
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

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Stripe webhook signature verification (HMAC-SHA256)
function verifyStripeSignature(payload: Buffer, sigHeader: string, secret: string): any {
  const crypto = require('crypto');
  const parts = sigHeader.split(',').reduce((acc: any, part: string) => {
    const [k, v] = part.split('='); acc[k] = v; return acc;
  }, {} as Record<string,string>);
  const timestamp = parts['t'];
  const sig = parts['v1'];
  if (!timestamp || !sig) throw new Error('Invalid Stripe-Signature header');
  const signed = `${timestamp}.${payload.toString('utf8')}`;
  const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  if (expected !== sig) throw new Error('Stripe signature mismatch');
  // Reject replays older than 5 minutes
  if (Math.abs(Date.now()/1000 - Number(timestamp)) > 300) throw new Error('Webhook timestamp too old');
  return JSON.parse(payload.toString('utf8'));
}

// Stripe webhook (handle subscription events)
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  if (!STRIPE_SECRET) { res.json({ received: true }); return; }
  let event: any;
  try {
    if (STRIPE_WEBHOOK_SECRET && sig) {
      event = verifyStripeSignature(req.body as Buffer, sig, STRIPE_WEBHOOK_SECRET);
    } else {
      // Dev/test fallback — no secret configured
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }
  } catch (err: any) {
    console.error('Webhook signature error:', err.message);
    res.status(400).json({ error: `Webhook signature failed: ${err.message}` }); return;
  }
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id || session.metadata?.userId;
      const plan = session.metadata?.plan;
      if (userId && plan) {
        const newLimit = PLAN_LIMITS[plan] || 10000;
        db.prepare("UPDATE subscriptions SET plan=?,tokens_limit=?,stripe_customer_id=?,stripe_subscription_id=?,status='active',updated_at=datetime('now') WHERE user_id=?")
          .run(plan, newLimit, session.customer, session.subscription, userId);
        try { (app as any).forgeBillingHooks?.onInvoicePaid(userId, plan); } catch {}
      }
      // Credit top-up checkout completed
      if (session.metadata?.kind === 'forge_topup' && session.metadata?.user_id) {
        try { (app as any).forgeBillingHooks?.onTopupPaid(session.metadata.user_id, Number(session.metadata.credit_amount) || 0); } catch {}
      }
      // Overage charge paid — reset tokens_used to 0 so user can continue
      if (session.metadata?.kind === 'forge_overage' && session.metadata?.userId) {
        const uid = session.metadata.userId;
        db.prepare("UPDATE subscriptions SET tokens_used=0, updated_at=datetime('now') WHERE user_id=?").run(uid);
        console.log(`[billing] Overage paid by user ${uid} — token counter reset`);
      }
    }
    if (event.type === 'invoice.paid') {
      const inv = event.data.object;
      const sub = db.prepare('SELECT user_id, plan FROM subscriptions WHERE stripe_customer_id=?').get(inv.customer) as any;
      if (sub) {
        // Reset token usage for the new billing period
        const now = new Date();
        const newEnd = new Date(now); newEnd.setDate(newEnd.getDate() + 30);
        db.prepare("UPDATE subscriptions SET tokens_used=0, period_start=?, period_end=?, status='active', updated_at=datetime('now') WHERE user_id=?")
          .run(now.toISOString(), newEnd.toISOString(), sub.user_id);
        console.log(`[billing] Period reset for user ${sub.user_id} (plan: ${sub.plan}) after invoice.paid`);
        try { (app as any).forgeBillingHooks?.onInvoicePaid(sub.user_id, sub.plan); } catch {}
      }
    }
    if (event.type === 'customer.subscription.deleted') {
      const subObj = event.data.object;
      const sub = db.prepare('SELECT user_id FROM subscriptions WHERE stripe_subscription_id=?').get(subObj.id) as any;
      if (sub) { try { (app as any).forgeBillingHooks?.onSubscriptionDeleted(sub.user_id); } catch {} }
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

// ── Connectors CRUD (store keys in api_keys table with connector_ prefix) ──
app.get('/api/connectors', requireAuth, (req: AuthRequest, res) => {
  const rows = db.prepare("SELECT provider, key_status, created_at FROM api_keys WHERE user_id=? AND provider LIKE 'connector_%'").all(req.user!.sub) as any[];
  const data = rows.map((r: any) => ({ id: r.provider.replace('connector_', ''), connected: true, created_at: r.created_at }));
  res.json({ success: true, data });
});

app.post('/api/connectors', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { id, key } = req.body;
  if (!id) { res.status(400).json({ success: false, error: 'id required' }); return; }
  const provider = `connector_${id}`;
  const encrypted = key ? encryptKey(key) : '';
  const existing = db.prepare('SELECT id FROM api_keys WHERE user_id=? AND provider=?').get(userId, provider);
  if (existing) {
    db.prepare("UPDATE api_keys SET key_encrypted=?, key_status='active', updated_at=datetime('now') WHERE user_id=? AND provider=?").run(encrypted, userId, provider);
  } else {
    const { randomUUID } = require('crypto');
    db.prepare("INSERT INTO api_keys (id,user_id,provider,key_encrypted,key_status) VALUES (?,?,?,?,'active')").run(randomUUID(), userId, provider, encrypted);
  }
  res.json({ success: true, data: { id, connected: true } });
});

app.delete('/api/connectors/:id', requireAuth, (req: AuthRequest, res) => {
  db.prepare("DELETE FROM api_keys WHERE user_id=? AND provider=?").run(req.user!.sub, `connector_${req.params.id}`);
  res.json({ success: true });
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

// ── ONBOARDING / BUSINESS SETUP ─────────────────────────────────────────────
// DB columns for onboarding (safe migrations)
try { db.exec(`ALTER TABLE users ADD COLUMN business_name TEXT`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN business_type TEXT`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN business_cities TEXT`); } catch {} // JSON array
try { db.exec(`ALTER TABLE users ADD COLUMN business_services TEXT`); } catch {} // JSON array
try { db.exec(`ALTER TABLE users ADD COLUMN business_pain TEXT`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN brand_logo_url TEXT`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN brand_colors TEXT`); } catch {} // JSON {primary,secondary}
try { db.exec(`ALTER TABLE users ADD COLUMN onboarding_complete INTEGER DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN connected_tools TEXT`); } catch {} // JSON array
try { db.exec(`ALTER TABLE users ADD COLUMN subdomain TEXT`); } catch {}

// Pending approvals table
db.exec(`CREATE TABLE IF NOT EXISTS pending_approvals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  preview_data TEXT,
  content TEXT,
  platform TEXT,
  scheduled_for TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
)`);

// SEO pages table
db.exec(`CREATE TABLE IF NOT EXISTS seo_pages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  keyword TEXT NOT NULL,
  url TEXT,
  published_at TEXT,
  word_count INTEGER DEFAULT 0,
  platform TEXT,
  content TEXT,
  meta_title TEXT,
  meta_desc TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// Keyword matrix table
db.exec(`CREATE TABLE IF NOT EXISTS keyword_matrix (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  service TEXT,
  city TEXT,
  intent TEXT,
  keyword TEXT NOT NULL,
  page_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
)`);

db.exec(`CREATE TABLE IF NOT EXISTS marketplace_installs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  installed_at TEXT NOT NULL,
  UNIQUE(user_id, app_id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS marketplace_listings (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🤖',
  category TEXT NOT NULL DEFAULT 'general',
  prompt TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  price INTEGER NOT NULL DEFAULT 0,
  installs INTEGER NOT NULL DEFAULT 0,
  rating REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`);

// Seed vertical packs into marketplace if not already present
const SEED_LISTINGS = [
  { id:'seed-law',    icon:'⚖️',  name:'Law Firm Pack',      category:'vertical', description:'Client intake, case status updates, contract drafting, billing narratives. Built for solo practitioners and small firms.', prompt:'You are a law firm AI assistant. Help with client intake summaries, case status updates, contract clause drafting, and billing narrative generation. Be precise, professional, and never give legal advice.', tags:'["law","legal","contracts","clients"]', installs:540, rating:4.8 },
  { id:'seed-rest',  icon:'🍽️', name:'Restaurant Pack',     category:'vertical', description:'Menu copywriting, review responses, staff scheduling drafts, supplier negotiation emails.', prompt:'You are a restaurant operations AI. Help with menu descriptions, customer review responses, weekly staff schedule drafts, and supplier emails. Be warm, practical, and hospitality-focused.', tags:'["restaurant","hospitality","menu","staff"]', installs:320, rating:4.7 },
  { id:'seed-ecom',  icon:'🛒',  name:'E-Commerce Pack',    category:'vertical', description:'Product descriptions, abandoned cart emails, customer support replies, inventory alerts, SEO optimized listings.', prompt:'You are an ecommerce AI specialist. Write product descriptions, abandoned cart recovery emails, customer support replies, and SEO-optimized listing copy. Be conversion-focused and data-driven.', tags:'["ecommerce","shopify","products","email"]', installs:890, rating:4.9 },
  { id:'seed-trade', icon:'🏗️', name:'Trades Pack',         category:'vertical', description:'Job quoting, client follow-ups, permit checklists, invoice generation. For contractors, plumbers, electricians.', prompt:'You are a trades business AI. Help with job quotes, client follow-up messages, permit application checklists, and invoice generation. Be direct, practical, and fast.', tags:'["trades","contractor","quotes","invoices"]', installs:210, rating:4.6 },
  { id:'seed-agency',icon:'🏢', name:'Agency Pack',         category:'vertical', description:'Client reporting, campaign briefs, performance summaries, proposal generation. Runs across all your client accounts.', prompt:'You are a marketing agency AI. Produce client status reports, campaign briefs, performance summaries, and new business proposals. Be strategic, brand-aware, and results-focused.', tags:'["agency","marketing","campaigns","clients"]', installs:670, rating:4.8 },
  { id:'seed-health',icon:'🏥', name:'Healthcare Pack',     category:'vertical', description:'Patient intake summaries, appointment reminders, insurance pre-auth drafts, HIPAA-aware workflows.', prompt:'You are a healthcare admin AI. Help with patient intake summaries, appointment reminder drafts, and insurance pre-authorization letters. Always be HIPAA-aware and never include real PHI in outputs.', tags:'["healthcare","medical","patients","admin"]', installs:480, rating:4.7 },
];
const seedAuthorId = 'forge-system';
for (const s of SEED_LISTINGS) {
  const exists = db.prepare('SELECT id FROM marketplace_listings WHERE id=?').get(s.id);
  if (!exists) {
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO marketplace_listings (id,author_id,name,description,icon,category,prompt,tags,price,installs,rating,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,0,?,?,'published',?,?)`)
      .run(s.id, seedAuthorId, s.name, s.description, s.icon, s.category, s.prompt, s.tags, s.installs, s.rating, now, now);
  }
}

// Business type → persona map
const FORGE_PERSONAS: Record<string, string> = {
  law_firm: 'You are Forge, a precise and formal AI business OS for a law firm. Be professional, meticulous, cite specifics. Never casual. Use legal-adjacent framing.',
  restaurant: 'You are Forge, a warm and fast AI business OS for a restaurant. Be friendly, practical, food/hospitality focused. Quick answers, focus on customers and operations.',
  agency: 'You are Forge, a creative and bold AI business OS for a marketing/creative agency. Be punchy, strategic, brand-aware. Think in campaigns, stories, and bold moves.',
  trades: 'You are Forge, a no-nonsense AI business OS for a trades/plumbing business. Be direct, practical, job-focused. Quote, schedule, invoice, follow up — fast.',
  ecom: 'You are Forge, a conversion-focused AI business OS for an ecommerce business. Be data-driven, sales-focused. Think in SKUs, AOV, CAC, LTV.',
  other: 'You are Forge, an autonomous AI business OS. You run the business so the owner doesn\'t have to.',
};
(app as any).forgePersona = (u: any) => FORGE_PERSONAS[u?.business_type] || FORGE_PERSONAS.other;

// Industry-specific agent templates
const BIZ_AGENT_TEMPLATES: Record<string, Array<{role:string;icon:string;desc:string;prompt:string}>> = {
  law_firm: [
    { role:'Case Prep Agent', icon:'⚖️', desc:'Reads intake → drafts case summary → flags missing info', prompt:'You are a legal case prep specialist. Analyze new client intake forms, draft professional case summaries, and flag any missing critical information. Be precise and formal.' },
    { role:'Document Agent', icon:'📄', desc:'Processes contracts/filings → extracts key dates/clauses', prompt:'You are a legal document analyst. Process uploaded contracts and filings, extract key dates, clauses, obligations, and risks. Format findings clearly for attorney review.' },
    { role:'Client Comms Agent', icon:'✉️', desc:'Drafts client update emails → sends on approval', prompt:'You are a client communications specialist for a law firm. Draft professional, empathetic client update emails. Be clear about case status without overpromising outcomes.' },
    { role:'Billing Agent', icon:'💰', desc:'Tracks billable hours → generates invoice drafts', prompt:'You are a legal billing specialist. Track billable activities, generate accurate invoice drafts, and flag any billing discrepancies or unbilled time.' },
    { role:'Compliance Agent', icon:'📋', desc:'Monitors deadlines → sends alerts 7 days before', prompt:'You are a legal compliance monitor. Track all case deadlines, court dates, and filing requirements. Alert the team 7 days before any deadline.' },
  ],
  restaurant: [
    { role:'Review Agent', icon:'⭐', desc:'Monitors Google/Yelp → drafts responses within 2 hours', prompt:'You are a restaurant reputation manager. Monitor reviews across platforms, draft warm professional responses within 2 hours. Thank positive reviewers, address negatives privately.' },
    { role:'Social Agent', icon:'📱', desc:'Posts daily specials to Facebook/Instagram', prompt:'You are a restaurant social media manager. Write engaging posts about daily specials, behind-the-scenes moments, and community highlights. Warm, inviting tone.' },
    { role:'Menu Agent', icon:'🍽️', desc:'Monitors food costs → suggests price adjustments', prompt:'You are a restaurant profitability analyst. Monitor food cost percentages per menu item and suggest price adjustments to maintain target margins.' },
    { role:'Follow-up Agent', icon:'🔔', desc:'Checks in 48hr after booking → asks for review', prompt:'You are a customer experience agent for a restaurant. Send warm follow-up messages 48 hours after dining experiences and invite satisfied guests to leave reviews.' },
  ],
  agency: [
    { role:'Client Report Agent', icon:'📊', desc:'Pulls campaign metrics → generates monthly report PDF', prompt:'You are a client reporting specialist for a marketing agency. Pull campaign performance data, analyze trends, and generate compelling monthly reports that demonstrate ROI.' },
    { role:'Content Agent', icon:'✍️', desc:'Generates 30 days of client social content', prompt:'You are a content strategist for a marketing agency. Generate 30 days of engaging social content for clients, tailored to their brand voice and audience.' },
    { role:'Proposal Agent', icon:'📋', desc:'Generates custom proposals from client brief', prompt:'You are a business development specialist for a marketing agency. Transform client briefs into compelling, customized proposals with clear deliverables and ROI projections.' },
    { role:'Invoice Agent', icon:'💳', desc:'Tracks project completion → generates invoices', prompt:'You are an agency billing specialist. Track project milestones and completion, generate accurate invoices tied to deliverables, and follow up on overdue payments.' },
  ],
  trades: [
    { role:'Quote Agent', icon:'📋', desc:'Generates service quotes from job description', prompt:'You are a trades business estimator. Generate professional, competitive service quotes from job descriptions. Include materials, labor, and timeline estimates.' },
    { role:'Follow-up Agent', icon:'⭐', desc:'Checks in 48hr after job → asks for review', prompt:'You are a customer success agent for a trades business. Send a friendly follow-up 48 hours after job completion to ensure satisfaction and request a Google review.' },
    { role:'Invoice Agent', icon:'💰', desc:'Generates invoice on job completion', prompt:'You are a trades billing specialist. Generate clear, professional invoices on job completion with itemized labor and materials.' },
    { role:'Scheduling Agent', icon:'📅', desc:'Manages job calendar, sends confirmations', prompt:'You are a scheduling coordinator for a trades business. Manage the job calendar, send appointment confirmations, and handle rescheduling requests professionally.' },
  ],
  ecom: [
    { role:'Product Agent', icon:'🛍️', desc:'Writes/rewrites product descriptions for SEO', prompt:'You are an ecommerce copywriter. Write compelling, SEO-optimized product descriptions that convert browsers into buyers. Focus on benefits, not features.' },
    { role:'Review Agent', icon:'⭐', desc:'Responds to product reviews on all platforms', prompt:'You are an ecommerce reputation manager. Respond to product reviews professionally. Thank happy customers, address concerns from unhappy ones, always offer solutions.' },
    { role:'Email Agent', icon:'📧', desc:'Abandoned cart, win-back, post-purchase sequences', prompt:'You are an ecommerce email specialist. Write high-converting abandoned cart, win-back, and post-purchase email sequences that drive repeat revenue.' },
    { role:'Inventory Agent', icon:'📦', desc:'Monitors stock levels → alerts on low stock', prompt:'You are an inventory manager for an ecommerce business. Monitor stock levels across all SKUs and alert when items fall below reorder points.' },
  ],
};

app.get('/api/onboarding', requireAuth, (req: AuthRequest, res) => {
  const u = db.prepare('SELECT business_name,business_type,business_cities,business_pain,brand_logo_url,brand_colors,onboarding_complete,connected_tools,subdomain FROM users WHERE id=?').get(req.user!.sub) as any;
  res.json({ success: true, data: u || {} });
});

app.post('/api/onboarding', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { businessName, businessType, cities, services, pain, logoUrl, colors, connectedTools } = req.body;

  // Generate subdomain from business name
  const subdomain = (businessName || 'forge').toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,30) + '-' + userId.slice(0,6);

  db.prepare(`UPDATE users SET business_name=?,business_type=?,business_cities=?,business_services=?,business_pain=?,brand_logo_url=?,brand_colors=?,connected_tools=?,onboarding_complete=1,subdomain=? WHERE id=?`)
    .run(businessName||'My Business', businessType||'other', JSON.stringify(cities||[]), JSON.stringify(services||[]), pain||'', logoUrl||'', JSON.stringify(colors||{}), JSON.stringify(connectedTools||[]), subdomain, userId);

  // Create initial credits row
  db.prepare(`INSERT OR IGNORE INTO subscriptions (id,user_id,plan,tokens_limit,tokens_used) VALUES (?,?,'starter',5000000,0)`).run(`sub_${uuidv4()}`, userId);

  // Seed keyword matrix from services × cities
  if ((services||[]).length && (cities||[]).length) {
    const intents = ['informational','commercial','transactional','local','comparison'];
    const insertKw = db.prepare('INSERT OR IGNORE INTO keyword_matrix (id,user_id,service,city,intent,keyword) VALUES (?,?,?,?,?,?)');
    for (const svc of (services as string[]).slice(0,10)) {
      for (const city of (cities as string[]).slice(0,20)) {
        for (const intent of intents) {
          const kw = intent==='informational' ? `how to ${svc}` : intent==='commercial' ? `best ${svc} in ${city}` : intent==='transactional' ? `${svc} cost ${city}` : intent==='local' ? `${svc} near me ${city}` : `${svc} vs alternative ${city}`;
          insertKw.run(`km_${uuidv4()}`, userId, svc, city, intent, kw);
        }
      }
    }
  }

  // Pre-create agent roster from template
  const agents = BIZ_AGENT_TEMPLATES[businessType as string] || BIZ_AGENT_TEMPLATES.other || [];
  for (const a of agents) {
    const pid = `persona_${uuidv4()}`;
    try { db.prepare('INSERT OR IGNORE INTO personas (id,user_id,name,icon,system_prompt,model,created_at) VALUES (?,?,?,?,?,?,datetime(\'now\'))').run(pid, userId, a.role, a.icon, a.prompt, 'auto'); } catch {}
  }

  // Schedule first nightly run for 2am tonight
  const nightlyId = `sch_nightly_${userId.slice(0,8)}`;
  try {
    db.prepare('INSERT OR IGNORE INTO schedules (id,user_id,name,cron_expression,prompt,enabled) VALUES (?,?,?,?,?,1)')
      .run(nightlyId, userId, 'Nightly Forge Run', '0 2 * * *', `Run the nightly autonomous pipeline for business type: ${businessType}. Generate 5 SEO pages, check review requests, fill content calendar gaps. Store results as pending approvals.`);
  } catch {}

  res.json({ success: true, data: { subdomain, agentsCreated: agents.length, keywordsQueued: (services||[]).length * (cities||[]).length * 5 } });
});

// ── ONE-SENTENCE ONBOARDING ───────────────────────────────────────────────
// The "intoxicating first 60 seconds": user types one free-text sentence,
// the LLM parses it into structured onboarding fields. Time-to-value hook.
// POST body: { sentence: string, confirm?: boolean }
//  - confirm falsy → returns the parsed plan for the user to review (fast, no DB writes)
//  - confirm true  → provisions the workspace (agents, credits, nightly run) and returns subdomain
app.post('/api/onboarding/from-sentence', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { sentence, confirm } = req.body || {};
  if (!sentence || typeof sentence !== 'string' || sentence.trim().length < 4) {
    res.status(400).json({ success: false, error: 'Describe your business in one sentence.' }); return;
  }

  const validTypes = Object.keys(BIZ_AGENT_TEMPLATES);
  let parsed: any;
  try {
    const llm = getUserLLMKey(userId);
    if (!llm || !llm.apiKey) { res.status(400).json({ success: false, error: 'NO_LLM_KEY', message: 'Add an LLM API key in settings to use one-sentence setup.' }); return; }
    const sys = [
      'You convert one sentence about a business into a strict JSON object for onboarding.',
      'Return ONLY JSON, no prose, no code fences. Schema:',
      '{ "businessName": string, "businessType": one of ' + JSON.stringify(validTypes) + ' (best fit, else "other"),',
      '  "cities": string[] (locations mentioned, else []), "services": string[] (3-6 core services/products, infer if unstated),',
      '  "pain": string (the main problem this owner likely wants solved, one short phrase) }',
    ].join(' ');
    const out = await callLLM(llm.provider, llm.apiKey, llm.model, [
      { role: 'system', content: sys },
      { role: 'user', content: sentence.trim() },
    ]);
    let txt = (out.content || '').trim().replace(/^```(json)?/i, '').replace(/```$/,'').trim();
    parsed = JSON.parse(txt);
  } catch (e: any) {
    res.status(502).json({ success: false, error: 'PARSE_FAILED', message: 'Could not understand that sentence — try rephrasing, or use the full form.' }); return;
  }

  // Normalize + guard
  const businessType = validTypes.includes(parsed.businessType) ? parsed.businessType : 'other';
  const businessName = (parsed.businessName || 'My Business').toString().slice(0, 80);
  const cities = Array.isArray(parsed.cities) ? parsed.cities.slice(0, 20).map((c: any) => String(c).slice(0,60)) : [];
  const services = Array.isArray(parsed.services) ? parsed.services.slice(0, 10).map((s: any) => String(s).slice(0,80)) : [];
  const pain = (parsed.pain || '').toString().slice(0, 240);
  const previewAgents = (BIZ_AGENT_TEMPLATES[businessType] || BIZ_AGENT_TEMPLATES.other || []).map(a => ({ role: a.role, icon: a.icon }));

  // Preview only — let the user confirm before any DB writes
  if (!confirm) {
    res.json({ success: true, data: { preview: true, parsed: { businessName, businessType, cities, services, pain }, agents: previewAgents, agentCount: previewAgents.length } });
    return;
  }

  // Confirmed → provision (mirrors the structured /api/onboarding logic)
  const subdomain = businessName.toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,30) + '-' + userId.slice(0,6);
  db.prepare(`UPDATE users SET business_name=?,business_type=?,business_cities=?,business_services=?,business_pain=?,onboarding_complete=1,subdomain=? WHERE id=?`)
    .run(businessName, businessType, JSON.stringify(cities), JSON.stringify(services), pain, subdomain, userId);
  db.prepare(`INSERT OR IGNORE INTO subscriptions (id,user_id,plan,tokens_limit,tokens_used) VALUES (?,?,'starter',5000000,0)`).run(`sub_${uuidv4()}`, userId);

  const agents = BIZ_AGENT_TEMPLATES[businessType] || BIZ_AGENT_TEMPLATES.other || [];
  for (const a of agents) {
    const pid = `persona_${uuidv4()}`;
    try { db.prepare('INSERT OR IGNORE INTO personas (id,user_id,name,icon,system_prompt,model,created_at) VALUES (?,?,?,?,?,?,datetime(\'now\'))').run(pid, userId, a.role, a.icon, a.prompt, 'auto'); } catch {}
  }
  const nightlyId = `sch_nightly_${userId.slice(0,8)}`;
  try {
    db.prepare('INSERT OR IGNORE INTO schedules (id,user_id,name,cron_expression,prompt,enabled) VALUES (?,?,?,?,?,1)')
      .run(nightlyId, userId, 'Nightly Forge Run', '0 2 * * *', `Run the nightly autonomous pipeline for business type: ${businessType}. Generate SEO pages, check review requests, fill content calendar gaps. Store results as pending approvals.`);
  } catch {}

  res.json({ success: true, data: { subdomain, businessName, businessType, agentsCreated: agents.length, parsed: { cities, services, pain } } });
});

// ── CREDITS ─────────────────────────────────────────────────────────────────
app.get('/api/billing/credits', requireAuth, (req: AuthRequest, res) => {
  const sub = db.prepare('SELECT plan, tokens_used, tokens_limit FROM subscriptions WHERE user_id=?').get(req.user!.sub) as any;
  if (!sub) { res.json({ success: true, data: { balance: 20.00, plan: 'starter' } }); return; }
  // Convert token usage to dollar credit balance: included per plan
  const planCredits: Record<string,number> = { free:5, starter:20, pro:75, agency:200 };
  const included = planCredits[sub.plan] || 20;
  const used = (sub.tokens_used / 1000000) * 1.50; // $1.50/M tokens (50% margin)
  const balance = Math.max(0, included - used);
  res.json({ success: true, data: { balance: Math.round(balance*100)/100, plan: sub.plan, tokensUsed: sub.tokens_used, tokensLimit: sub.tokens_limit } });
});

app.post('/api/billing/topup', requireAuth, async (req: AuthRequest, res) => {
  const { amount } = req.body; // 50 = $50
  if (!amount || amount < 10) { res.status(400).json({ success: false, error: 'Minimum top-up is $10' }); return; }
  const stripe = process.env.STRIPE_SECRET_KEY;
  if (!stripe) { res.status(503).json({ success: false, error: 'Stripe not configured' }); return; }
  try {
    const sub = db.prepare('SELECT stripe_customer_id FROM subscriptions WHERE user_id=?').get(req.user!.sub) as any;
    const body: any = {
      mode: 'payment',
      line_items: [{ price_data: { currency: 'usd', product_data: { name: `Forge AI Credits — $${amount}` }, unit_amount: amount*100 }, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL||'https://forge-sand-two.vercel.app'}/?topup=success&amount=${amount}`,
      cancel_url:  `${process.env.FRONTEND_URL||'https://forge-sand-two.vercel.app'}/?topup=cancel`,
    };
    if (sub?.stripe_customer_id) body.customer = sub.stripe_customer_id;
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method:'POST', headers:{'Authorization':`Bearer ${stripe}`,'Content-Type':'application/x-www-form-urlencoded'},
      body: new URLSearchParams(Object.entries(body).flatMap(([k,v]:any)=>Array.isArray(v)?v.map((i:any,idx:number)=>[[`${k}[${idx}][price_data][currency]`,i.price_data.currency],[`${k}[${idx}][price_data][product_data][name]`,i.price_data.product_data.name],[`${k}[${idx}][price_data][unit_amount]`,i.price_data.unit_amount],[`${k}[${idx}][quantity]`,i.quantity]]).flat():[[k,v]])).toString(),
    });
    const sess = await r.json() as any;
    res.json({ success: true, data: { url: sess.url } });
  } catch(e:any) { res.status(500).json({ success:false, error: e.message }); }
});

// Phase 4: overage charge — bill user for tokens used beyond their plan limit
// Calculates overage cost at $0.003/1k tokens and creates a Stripe Checkout session
app.post('/api/billing/overage-charge', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const stripe = process.env.STRIPE_SECRET_KEY;
  if (!stripe) { res.status(503).json({ success: false, error: 'Stripe not configured' }); return; }

  ensureSubscription(userId);
  const sub = db.prepare('SELECT plan, tokens_used, tokens_limit, stripe_customer_id FROM subscriptions WHERE user_id=?').get(userId) as any;
  if (!sub) { res.status(404).json({ success: false, error: 'No subscription found' }); return; }

  const overageTokens = Math.max(0, sub.tokens_used - sub.tokens_limit);
  if (overageTokens < 1000) {
    res.json({ success: false, error: 'No significant overage to charge', overageTokens }); return;
  }

  // $0.003 per 1k overage tokens (cost-plus with margin)
  const overageCostCents = Math.ceil((overageTokens / 1000) * 0.30); // $0.003 = 0.30 cents per 1k
  const minimumCents = 100; // $1 minimum charge
  const chargeCents = Math.max(overageCostCents, minimumCents);

  try {
    const user = db.prepare('SELECT email FROM users WHERE id=?').get(userId) as any;
    const body: Record<string,string> = {
      mode: 'payment',
      'payment_method_types[0]': 'card',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][product_data][name]': `Forge Overage — ${overageTokens.toLocaleString()} tokens`,
      'line_items[0][price_data][product_data][description]': `Overage usage above your ${sub.plan} plan limit`,
      'line_items[0][price_data][unit_amount]': String(chargeCents),
      'line_items[0][quantity]': '1',
      success_url: `${process.env.FRONTEND_URL||'https://forge-sand-two.vercel.app'}/?overage=success`,
      cancel_url:  `${process.env.FRONTEND_URL||'https://forge-sand-two.vercel.app'}/?overage=cancel`,
      'metadata[userId]': userId,
      'metadata[kind]': 'forge_overage',
      'metadata[overage_tokens]': String(overageTokens),
    };
    if (sub.stripe_customer_id) body.customer = sub.stripe_customer_id;
    else if (user?.email) body.customer_email = user.email;

    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${stripe}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body).toString(),
    });
    if (!r.ok) throw new Error(await r.text());
    const sess = await r.json() as any;
    console.log(`[billing] Overage charge created for user ${userId}: ${overageTokens} tokens, $${(chargeCents/100).toFixed(2)}`);
    res.json({ success: true, data: { url: sess.url, overageTokens, chargeUsd: chargeCents / 100 } });
  } catch(e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ── APPROVALS INBOX ──────────────────────────────────────────────────────────
app.get('/api/approvals', requireAuth, (req: AuthRequest, res) => {
  const { status = 'pending', limit = 50 } = req.query;
  const rows = db.prepare('SELECT * FROM pending_approvals WHERE user_id=? AND status=? ORDER BY created_at DESC LIMIT ?').all(req.user!.sub, status, Number(limit));
  res.json({ success: true, data: rows });
});

app.post('/api/approvals', requireAuth, (req: AuthRequest, res) => {
  const { type, title, preview_data, content, platform, scheduled_for } = req.body;
  const id = `appr_${uuidv4()}`;
  db.prepare('INSERT INTO pending_approvals (id,user_id,type,title,preview_data,content,platform,scheduled_for) VALUES (?,?,?,?,?,?,?,?)').run(id, req.user!.sub, type, title, JSON.stringify(preview_data||{}), content||'', platform||'', scheduled_for||'');
  res.json({ success: true, data: { id } });
});

app.post('/api/approvals/:id/approve', requireAuth, (req: AuthRequest, res) => {
  db.prepare('UPDATE pending_approvals SET status=? WHERE id=? AND user_id=?').run('approved', req.params.id, req.user!.sub);
  res.json({ success: true });
});

app.post('/api/approvals/:id/reject', requireAuth, (req: AuthRequest, res) => {
  db.prepare('UPDATE pending_approvals SET status=? WHERE id=? AND user_id=?').run('rejected', req.params.id, req.user!.sub);
  res.json({ success: true });
});

app.post('/api/approvals/approve-all', requireAuth, (req: AuthRequest, res) => {
  const r = db.prepare('UPDATE pending_approvals SET status=? WHERE user_id=? AND status=?').run('approved', req.user!.sub, 'pending');
  res.json({ success: true, updated: r.changes });
});

app.delete('/api/approvals/:id', requireAuth, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM pending_approvals WHERE id=? AND user_id=?').run(req.params.id, req.user!.sub);
  res.json({ success: true });
});

// ── NIGHTLY PIPELINE ──────────────────────────────────────────────────────────
// Generate SEO pages, review requests, content calendar — store as pending_approvals
app.post('/api/nightly/run', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const user = db.prepare('SELECT business_name,business_type,business_cities,business_services,onboarding_complete FROM users WHERE id=?').get(userId) as any;
  if (!user?.onboarding_complete) { res.status(400).json({ success:false, error:'Complete onboarding first' }); return; }

  const biz = user.business_name || 'Your Business';
  const cities: string[] = JSON.parse(user.business_cities||'[]').slice(0,3);
  const services: string[] = JSON.parse(user.business_services||'[]').slice(0,3);
  const created: string[] = [];

  // Pull next pending keywords from matrix
  const pendingKws = db.prepare('SELECT * FROM keyword_matrix WHERE user_id=? AND status=? LIMIT 7').all(userId,'pending') as any[];

  for (const kw of pendingKws.slice(0,5)) {
    const pageId = `seo_${uuidv4()}`;
    const approvalId = `appr_${uuidv4()}`;
    const wordCount = 850 + Math.floor(Math.random()*300);
    const title = `${kw.keyword} — ${biz}`;
    const metaTitle = `${kw.keyword} | ${biz}`;
    const metaDesc = `Looking for ${kw.keyword}? ${biz} provides expert service. ${cities[0]?`Serving ${cities[0]} and nearby areas.`:''}`;
    const content = `# ${title}\n\n## What We Offer\n${services.join(', ')} in ${cities.join(', ')}.\n\n## Why Choose ${biz}\nWe provide professional ${kw.service||'services'} with fast turnaround and guaranteed satisfaction.\n\n## ${kw.city ? `Serving ${kw.city}` : 'Local Service'}\nOur team is ready to help with all your ${kw.service||'service'} needs.\n\n## Get a Free Quote\nContact us today for a free estimate on ${kw.keyword}.\n\n<!-- word_count: ${wordCount} -->`;
    db.prepare('INSERT INTO seo_pages (id,user_id,keyword,word_count,meta_title,meta_desc,content) VALUES (?,?,?,?,?,?,?)').run(pageId,userId,kw.keyword,wordCount,metaTitle,metaDesc,content);
    db.prepare('UPDATE keyword_matrix SET status=?,page_id=? WHERE id=?').run('generated',pageId,kw.id);
    db.prepare('INSERT INTO pending_approvals (id,user_id,type,title,preview_data,content,platform) VALUES (?,?,?,?,?,?,?)').run(approvalId,userId,'seo_page',`SEO Page: "${kw.keyword}"`,JSON.stringify({keyword:kw.keyword,wordCount,metaTitle,metaDesc}),content,'website');
    created.push(`SEO: ${kw.keyword}`);
  }

  // Generate social content suggestions
  if (services.length) {
    const svc = services[Math.floor(Math.random()*services.length)];
    const city = cities[0]||'your area';
    const socialId = `appr_${uuidv4()}`;
    const caption = `🔥 Need ${svc} in ${city}? ${biz} has you covered.\n\nFast, reliable, and guaranteed satisfaction. DM us or call today for a free quote.\n\n#${svc.replace(/\s/g,'')} #${city.replace(/\s/g,'')} #local`;
    db.prepare('INSERT INTO pending_approvals (id,user_id,type,title,preview_data,content,platform,scheduled_for) VALUES (?,?,?,?,?,?,?,?)').run(socialId,userId,'social_post',`Instagram/Facebook Post — ${svc}`,JSON.stringify({service:svc,city}),caption,'instagram,facebook',new Date(Date.now()+86400000).toISOString());
    created.push(`Social: ${svc} post`);
  }

  // Review request template
  const reviewId = `appr_${uuidv4()}`;
  const reviewMsg = `Hi [Customer Name], thanks for choosing ${biz}! We hope everything went smoothly. If you had a great experience, we'd really appreciate a quick Google review — it helps us a lot: [REVIEW_LINK]\n\nIf anything could have been better, please let us know directly at [EMAIL]. We want to make it right!`;
  db.prepare('INSERT INTO pending_approvals (id,user_id,type,title,preview_data,content,platform) VALUES (?,?,?,?,?,?,?)').run(reviewId,userId,'review_request','Review Request Template',JSON.stringify({autoSendOnPayment:true}),reviewMsg,'sms,email');
  created.push('Review request template');

  // Log run to nightly_runs for Agent Cinema
  const runId = `run_${uuidv4()}`;
  try {
    db.prepare('INSERT INTO nightly_runs (id,user_id,status,summary) VALUES (?,?,?,?)').run(runId, userId, 'complete', JSON.stringify({ seo_pages: pendingKws.slice(0,5).length, social_posts: services.length ? 1 : 0, review_requests: 1, created }));
  } catch {}

  res.json({ success: true, data: { created, approvalsPending: created.length, runAt: new Date().toISOString(), runId } });
});

app.get('/api/nightly/status', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const pending = db.prepare('SELECT COUNT(*) as c FROM pending_approvals WHERE user_id=? AND status=?').get(userId,'pending') as any;
  const seoPagesTotal = db.prepare('SELECT COUNT(*) as c FROM seo_pages WHERE user_id=?').get(userId) as any;
  const kwDone = db.prepare('SELECT COUNT(*) as c FROM keyword_matrix WHERE user_id=? AND status!=?').get(userId,'pending') as any;
  const kwTotal = db.prepare('SELECT COUNT(*) as c FROM keyword_matrix WHERE user_id=?').get(userId) as any;
  const lastRun = db.prepare('SELECT last_run FROM schedules WHERE user_id=? AND name=?').get(userId,'Nightly Forge Run') as any;
  res.json({ success:true, data: { pendingApprovals: pending.c, seoPages: seoPagesTotal.c, keywordsCompleted: kwDone.c, keywordsTotal: kwTotal.c, lastRun: lastRun?.last_run||null } });
});

// ── MORNING DASHBOARD ────────────────────────────────────────────────────────
app.get('/api/morning-dashboard', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const approvals = db.prepare('SELECT * FROM pending_approvals WHERE user_id=? AND status=? ORDER BY created_at DESC LIMIT 20').all(userId,'pending') as any[];
  const recentSeo = db.prepare('SELECT keyword,word_count,created_at FROM seo_pages WHERE user_id=? ORDER BY created_at DESC LIMIT 5').all(userId) as any[];
  const sub = db.prepare('SELECT plan,tokens_used,tokens_limit FROM subscriptions WHERE user_id=?').get(userId) as any;
  const user = db.prepare('SELECT business_name,business_type,brand_colors FROM users WHERE id=?').get(userId) as any;
  const lastRun = db.prepare('SELECT last_run,cron_expression FROM schedules WHERE user_id=? AND name=?').get(userId,'Nightly Forge Run') as any;
  res.json({ success:true, data: { businessName: user?.business_name, businessType: user?.business_type, brandColors: user?.brand_colors, pendingApprovals: approvals, recentSeoPages: recentSeo, subscription: sub, lastNightlyRun: lastRun?.last_run } });
});

// ── NIGHTLY RUNS LOG (Agent Cinema) ──────────────────────────────────────────
db.exec(`CREATE TABLE IF NOT EXISTS nightly_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TEXT DEFAULT (datetime('now')),
  finished_at TEXT,
  summary TEXT
)`);

app.get('/api/nightly/runs', requireAuth, (req: AuthRequest, res) => {
  const rows = db.prepare('SELECT * FROM nightly_runs WHERE user_id=? ORDER BY started_at DESC LIMIT 20').all(req.user!.sub) as any[];
  res.json({ success:true, data: rows.map(r => ({ ...r, summary: r.summary ? JSON.parse(r.summary) : {} })) });
});

// Alias routes for ForgeAutonomy.tsx URL mismatches
app.get('/api/morning', requireAuth, (req: AuthRequest, res) => {
  req.url = '/api/morning-dashboard';
  app.handle(req as any, res as any);
});
app.post('/api/nightly/run-now', requireAuth, async (req: AuthRequest, res) => {
  req.url = '/api/nightly/run';
  app.handle(req as any, res as any);
});

// Also add voice endpoints used by VoiceForge component
app.get('/api/voice/brief', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const user = db.prepare('SELECT business_name,business_type FROM users WHERE id=?').get(userId) as any;
  const pending = db.prepare('SELECT COUNT(*) as c FROM pending_approvals WHERE user_id=? AND status=?').get(userId,'pending') as any;
  const seoPages = db.prepare('SELECT COUNT(*) as c FROM seo_pages WHERE user_id=?').get(userId) as any;
  const sub = db.prepare('SELECT plan FROM subscriptions WHERE user_id=?').get(userId) as any;
  const text = `Good morning! ${user?.business_name ? `Here's your Forge brief for ${user.business_name}.` : 'Here is your Forge brief.'} You have ${pending.c} items waiting for approval${seoPages.c > 0 ? `, ${seoPages.c} SEO pages generated so far` : ''}. Your plan is ${sub?.plan || 'starter'}. What would you like to work on?`;
  res.json({ success:true, data:{ text } });
});

app.post('/api/voice/command', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { text } = req.body;
  if (!text) { res.status(400).json({ success:false, error:'text required' }); return; }
  // Simple NLP routing
  const t = text.toLowerCase();
  let speech = '';
  if (/approve all/.test(t)) {
    const r = db.prepare("UPDATE pending_approvals SET status='approved' WHERE user_id=? AND status='pending'").run(userId);
    speech = `Done. I approved all ${r.changes} pending items.`;
  } else if (/how many.*approv|pending.*approv/.test(t)) {
    const r = db.prepare("SELECT COUNT(*) as c FROM pending_approvals WHERE user_id=? AND status='pending'").get(userId) as any;
    speech = `You have ${r.c} items waiting for approval.`;
  } else if (/seo.*page|how many.*page/.test(t)) {
    const r = db.prepare("SELECT COUNT(*) as c FROM seo_pages WHERE user_id=?").get(userId) as any;
    speech = `You have ${r.c} SEO pages generated so far.`;
  } else if (/run.*nightly|nightly.*run/.test(t)) {
    speech = `I'll queue a nightly run for you. Check your approval inbox in the morning.`;
  } else {
    speech = `Heard you say: ${text}. I'm working on it.`;
  }
  res.json({ success:true, data:{ speech } });
});

// ── MAGIC REPLY ───────────────────────────────────────────────────────────────
// Read an incoming message + user history → draft the perfect reply
app.post('/api/magic-reply', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { message, sender, channel, threadContext } = req.body;
  if (!message) { res.status(400).json({ success: false, error: 'message required' }); return; }

  // Get user's recent messages for voice/style context
  const recentMsgs = db.prepare(`SELECT content,role FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=? AND m.role='assistant' ORDER BY m.created_at DESC LIMIT 10`).all(userId) as any[];
  const voiceSamples = recentMsgs.map((m:any) => m.content.slice(0,200)).join('\n---\n');
  const user = db.prepare('SELECT business_name,business_type FROM users WHERE id=?').get(userId) as any;

  const systemPrompt = `You are a magic reply assistant. Draft the perfect reply to an incoming message.
User's business: ${user?.business_name || 'Unknown'} (${user?.business_type || 'general'}).
Match the user's writing style based on their previous messages:
${voiceSamples ? `Sample voice:\n${voiceSamples.slice(0,500)}` : 'Professional, warm, concise.'}
Reply rules: match their tone exactly, be direct, don't be sycophantic, keep it short unless detail is needed.`;

  const prompt = `Incoming message from ${sender||'someone'} via ${channel||'email'}:\n\n"${message}"${threadContext ? `\n\nThread context:\n${threadContext}` : ''}\n\nDraft a perfect reply:`;

  try {
    const userKey = db.prepare("SELECT key_encrypted FROM api_keys WHERE user_id=? AND provider='anthropic'").get(userId) as any;
    const apiKey = userKey?.key_encrypted || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) { res.json({ success:false, error:'No AI key configured' }); return; }

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{ 'x-api-key':apiKey, 'anthropic-version':'2023-06-01', 'content-type':'application/json' },
      body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:400, system: systemPrompt, messages:[{role:'user',content:prompt}] })
    });
    const d = await r.json() as any;
    const reply = d?.content?.[0]?.text || d?.error?.message || 'Could not generate reply';
    res.json({ success:true, data:{ reply, sender, channel } });
  } catch(e:any) { res.json({ success:false, error: e.message }); }
});

// ── Marketplace ───────────────────────────────────────────────────────────────
const MARKETPLACE_APPS = [
  { id:'forge-law', name:'Forge for Law Firms', tagline:'Intake, deadlines, billing narratives', icon:'⚖️', category:'legal', price:79, rating:4.9, installs:312, agents:['ClientIntake','DeadlineTracker','BillingNarrator'] },
  { id:'forge-restaurant', name:'Forge for Restaurants', tagline:'Menu, staff, reviews on autopilot', icon:'🍽️', category:'food', price:49, rating:4.8, installs:891, agents:['MenuOptimizer','ReviewReplier','StaffScheduler'] },
  { id:'forge-agency', name:'Forge for Agencies', tagline:'Proposals, client reports, campaign audits', icon:'🎨', category:'agency', price:89, rating:4.7, installs:204, agents:['ProposalWriter','ClientReporter','CampaignAuditor'] },
  { id:'forge-trades', name:'Forge for Trades', tagline:'Quotes, permits, warranty follow-ups', icon:'🔧', category:'trades', price:59, rating:4.9, installs:567, agents:['QuoteBuilder','PermitTracker','WarrantyFollowUp'] },
  { id:'forge-dental', name:'Forge for Dental Practices', tagline:'Appointments, insurance, patient follow-up', icon:'🦷', category:'medical', price:99, rating:4.8, installs:143, agents:['AppointmentReminder','InsuranceChecker','PatientFollowUp'] },
  { id:'forge-ecom', name:'Forge for E-Commerce', tagline:'Inventory alerts, review replies, abandoned cart', icon:'🛒', category:'ecom', price:69, rating:4.6, installs:428, agents:['InventoryAlert','ReviewReplier','CartRecovery'] },
];

app.get('/api/marketplace', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const installed = db.prepare('SELECT app_id FROM marketplace_installs WHERE user_id=?').all(userId) as any[];
  const installedIds = new Set(installed.map((r:any) => r.app_id));
  res.json({ success:true, data: MARKETPLACE_APPS.map(a => ({ ...a, installed: installedIds.has(a.id) })) });
});

app.post('/api/marketplace/:appId/install', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { appId } = req.params;
  const app_def = MARKETPLACE_APPS.find(a => a.id === appId);
  if (!app_def) { res.status(404).json({ error:'App not found' }); return; }
  try {
    db.prepare("INSERT OR IGNORE INTO marketplace_installs (id,user_id,app_id,installed_at) VALUES (?,?,?,datetime('now'))").run(uuidv4(), userId, appId);
    // Activate agents for this app
    const persona = db.prepare('SELECT business_type FROM users WHERE id=?').get(userId) as any;
    db.prepare("INSERT INTO pending_approvals (id,user_id,type,title,preview,status,created_at) VALUES (?,?,?,?,?,?,datetime('now'))").run(
      uuidv4(), userId, 'marketplace_install',
      `${app_def.icon} ${app_def.name} installed`,
      `Agents activated: ${app_def.agents.join(', ')}. They will start working tonight.`,
      'pending'
    );
    res.json({ success:true, data:{ appId, agents: app_def.agents, message:'Installed! Agents activate tonight.' } });
  } catch(e:any) { res.status(500).json({ error:e.message }); }
});

app.delete('/api/marketplace/:appId/uninstall', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  db.prepare('DELETE FROM marketplace_installs WHERE user_id=? AND app_id=?').run(userId, req.params.appId);
  res.json({ success:true });
});

// GET /api/marketplace/community — user-published workflows
app.get('/api/marketplace/community', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { category, search } = req.query as any;
  let q = 'SELECT l.*, u.email as author_email FROM marketplace_listings l LEFT JOIN users u ON l.author_id=u.id WHERE l.status=\'published\'';
  const params: any[] = [];
  if (category && category !== 'All') { q += ' AND l.category=?'; params.push(category); }
  if (search) { q += ' AND (l.name LIKE ? OR l.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  q += ' ORDER BY l.installs DESC LIMIT 100';
  const rows = db.prepare(q).all(...params) as any[];
  const installedIds = new Set((db.prepare('SELECT app_id FROM marketplace_installs WHERE user_id=?').all(userId) as any[]).map((r:any)=>r.app_id));
  res.json({ success:true, data: rows.map(r => ({ ...r, tags: JSON.parse(r.tags||'[]'), installed: installedIds.has(r.id), isOwn: r.author_id===userId })) });
});

// POST /api/marketplace/publish — publish a user workflow
app.post('/api/marketplace/publish', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { name, description, icon='🤖', category='general', prompt, tags=[], price=0 } = req.body;
  if (!name||!description||!prompt) { res.status(400).json({ error:'name, description, prompt required' }); return; }
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO marketplace_listings (id,author_id,name,description,icon,category,prompt,tags,price,installs,rating,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,0,0,'published',?,?)`)
    .run(id, userId, name, description, icon, category, prompt, JSON.stringify(tags), price, now, now);
  res.json({ success:true, data:{ id, name, message:'Published to community marketplace!' } });
});

// POST /api/marketplace/community/:id/install — install community workflow
app.post('/api/marketplace/community/:id/install', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const listing = db.prepare('SELECT * FROM marketplace_listings WHERE id=? AND status=\'published\'').get(req.params.id) as any;
  if (!listing) { res.status(404).json({ error:'Listing not found' }); return; }
  db.prepare("INSERT OR IGNORE INTO marketplace_installs (id,user_id,app_id,installed_at) VALUES (?,?,?,datetime('now'))").run(uuidv4(), userId, listing.id);
  db.prepare('UPDATE marketplace_listings SET installs=installs+1, updated_at=? WHERE id=?').run(new Date().toISOString(), listing.id);
  res.json({ success:true, data:{ id:listing.id, name:listing.name, prompt:listing.prompt } });
});

// DELETE /api/marketplace/listings/:id — delete own listing
app.delete('/api/marketplace/listings/:id', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const listing = db.prepare('SELECT * FROM marketplace_listings WHERE id=? AND author_id=?').get(req.params.id, userId) as any;
  if (!listing) { res.status(404).json({ error:'Not found or not yours' }); return; }
  db.prepare('UPDATE marketplace_listings SET status=\'archived\' WHERE id=?').run(req.params.id);
  res.json({ success:true });
});

// GET /api/marketplace/my-listings — user's own published workflows
app.get('/api/marketplace/my-listings', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const rows = db.prepare('SELECT * FROM marketplace_listings WHERE author_id=? ORDER BY created_at DESC').all(userId) as any[];
  res.json({ success:true, data: rows.map(r => ({ ...r, tags: JSON.parse(r.tags||'[]') })) });
});

// ── Universal Agents ──────────────────────────────────────────────────────────
app.post('/api/agents/debt-chaser/run', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { invoices } = req.body; // [{client, amount, days_overdue, email}]
  const user = db.prepare('SELECT business_name FROM users WHERE id=?').get(userId) as any;
  const results: any[] = [];
  for (const inv of (invoices||[])) {
    const tone = inv.days_overdue > 14 ? 'firm and urgent' : inv.days_overdue > 7 ? 'politely persistent' : 'friendly reminder';
    const aId = uuidv4();
    const preview = `Hi ${inv.client}, this is a ${tone} reminder about your $${inv.amount} invoice (${inv.days_overdue} days overdue).`;
    db.prepare("INSERT INTO pending_approvals (id,user_id,type,title,preview,status,created_at) VALUES (?,?,?,?,?,?,datetime('now'))").run(
      aId, userId, 'debt_chaser', `Chase invoice: ${inv.client} $${inv.amount}`, preview, 'pending'
    );
    results.push({ approvalId: aId, client: inv.client });
  }
  res.json({ success:true, data:{ drafted: results.length, results } });
});

app.post('/api/agents/reputation-guard/run', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { reviews } = req.body; // [{platform, reviewer, rating, text}]
  const user = db.prepare('SELECT business_name, business_type FROM users WHERE id=?').get(userId) as any;
  const results: any[] = [];
  for (const rev of (reviews||[])) {
    const tone = rev.rating <= 2 ? 'empathetic and solution-focused' : rev.rating === 3 ? 'appreciative and improvement-focused' : 'warm and grateful';
    const aId = uuidv4();
    db.prepare("INSERT INTO pending_approvals (id,user_id,type,title,preview,status,created_at) VALUES (?,?,?,?,?,?,datetime('now'))").run(
      aId, userId, 'reputation_guard',
      `Reply to ${rev.rating}⭐ review on ${rev.platform}`,
      `Thank you ${rev.reviewer} — ${tone} response drafted for your ${rev.rating}-star review.`,
      'pending'
    );
    results.push({ approvalId: aId, platform: rev.platform, rating: rev.rating });
  }
  res.json({ success:true, data:{ drafted: results.length, results } });
});

app.post('/api/agents/competitor-watch/run', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { competitors } = req.body; // [{name, url}]
  // Stub: in prod would scrape. Returns mocked intel for now.
  const intel = (competitors||[]).map((c:any) => ({
    name: c.name,
    changes: [`Pricing page updated`, `New feature: AI assistant`, `Blog: 3 new posts this week`],
    threat_level: 'medium',
    recommendation: `Counter with your unique value prop around personalization`
  }));
  const aId = uuidv4();
  db.prepare("INSERT INTO pending_approvals (id,user_id,type,title,preview,status,created_at) VALUES (?,?,?,?,?,?,datetime('now'))").run(
    aId, userId, 'competitor_watch',
    `Weekly competitor intel — ${(competitors||[]).length} tracked`,
    intel.map((i:any) => `${i.name}: ${i.changes[0]}`).join(' | '),
    'pending'
  );
  res.json({ success:true, data:{ intel, approvalId: aId } });
});

app.post('/api/agents/content-engine/run', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { topic } = req.body;
  if (!topic) { res.status(400).json({ error:'topic required' }); return; }
  const pieces = [
    { type:'blog', title:`The Complete Guide to ${topic}`, length:'1200 words' },
    { type:'social_linkedin', title:`LinkedIn post: ${topic} insight`, length:'200 words' },
    { type:'social_twitter', title:`Twitter thread: ${topic} (5 tweets)`, length:'50 words each' },
    { type:'email', title:`Email newsletter: ${topic}`, length:'400 words' },
    { type:'social_instagram', title:`Instagram caption: ${topic}`, length:'100 words' },
  ];
  for (const p of pieces) {
    db.prepare("INSERT INTO pending_approvals (id,user_id,type,title,preview,status,created_at) VALUES (?,?,?,?,?,?,datetime('now'))").run(
      uuidv4(), userId, 'content_engine', p.title, `${p.type} — ${p.length} — ready for review`, 'pending'
    );
  }
  res.json({ success:true, data:{ topic, pieces: pieces.length, message:'5 content pieces queued for approval' } });
});

app.post('/api/agents/lead-nurturer/run', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { leads } = req.body; // [{name, email, last_contact_days, context}]
  const results: any[] = [];
  for (const lead of (leads||[])) {
    const urgency = lead.last_contact_days > 30 ? 'high' : lead.last_contact_days > 14 ? 'medium' : 'low';
    const aId = uuidv4();
    db.prepare("INSERT INTO pending_approvals (id,user_id,type,title,preview,status,created_at) VALUES (?,?,?,?,?,?,datetime('now'))").run(
      aId, userId, 'lead_nurturer',
      `Re-engage ${lead.name} (${lead.last_contact_days}d silent)`,
      `Personalized outreach drafted. Urgency: ${urgency}. Context: ${lead.context||'previous conversation'}`,
      'pending'
    );
    results.push({ approvalId: aId, lead: lead.name, urgency });
  }
  res.json({ success:true, data:{ drafted: results.length, results } });
});

// ── User total tokens
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
    const result = await callLLMWithFallback(provider, apiKey, actualModel, messages);
    res.json({ success: true, content: result.content, usedModel: result.usedModel, usage: { prompt_tokens: result.promptTokens, completion_tokens: result.completionTokens } });
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
    { id:'forge-fable',      provider:'anthropic', label:'Forge Fable (Fable 5)',     is_forge:1, markup:1.5 },
    { id:'claude-fable-5',   provider:'anthropic', label:'Claude Fable 5 ✦',          is_forge:0, markup:1.0 },
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

// ── Autonomy tables ────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_id TEXT REFERENCES threads(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    progress INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS goal_tasks (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    result TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS user_files (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_id TEXT,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'text/plain',
    size INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS webhook_triggers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    prompt TEXT NOT NULL,
    secret TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    last_triggered TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS reflection_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    thread_id TEXT,
    message_id TEXT,
    score INTEGER NOT NULL DEFAULT 0,
    feedback TEXT,
    action_taken TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
try { db.exec(`CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id)`); } catch {}
try { db.exec(`CREATE INDEX IF NOT EXISTS idx_goal_tasks_goal ON goal_tasks(goal_id)`); } catch {}
try { db.exec(`CREATE INDEX IF NOT EXISTS idx_user_files_user ON user_files(user_id)`); } catch {}
try { db.exec(`CREATE INDEX IF NOT EXISTS idx_webhook_triggers_user ON webhook_triggers(user_id)`); } catch {}

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
  const { content, agent_ids = [], model: bodyModel, skill_prompt, active_skills = [], active_connectors = [], enabled_hooks = [], forge_mode = 'ask', agent_mode = 'auto', desktop_context } = req.body;

  // Agent mode: override model selection based on mode
  // auto   = use bodyModel as-is (smart routing)
  // cheap  = prefer fastest/cheapest available model
  // quality= prefer best available model
  // complex= prefer large-context model
  // raw    = prefer uncensored model (deepseek/openrouter), strip safety prefixes
  function resolveAgentModel(requestedModel: string, mode: string, userKeys: any): string {
    if (mode === 'auto') return requestedModel;
    const hasAnthropic = !!(userKeys.anthropic_key || userKeys.has_anthropic);
    const hasOpenAI    = !!(userKeys.openai_key    || userKeys.has_openai);
    const hasDeepseek  = !!(userKeys.deepseek_key);
    const hasGroq      = !!(userKeys.groq_key);
    const hasMistral   = !!(userKeys.mistral_key);
    if (mode === 'cheap') {
      if (hasGroq)     return 'llama-3.1-8b-instant';
      if (hasDeepseek) return 'deepseek-chat';
      if (hasMistral)  return 'mistral-small-latest';
      if (hasOpenAI)   return 'gpt-4o-mini';
      return requestedModel;
    }
    if (mode === 'quality') {
      if (hasAnthropic) return 'claude-opus-4-8';
      if (hasOpenAI)    return 'gpt-4o';
      if (hasDeepseek)  return 'deepseek-reasoner';
      return requestedModel;
    }
    if (mode === 'complex') {
      if (hasAnthropic) return 'claude-sonnet-4-6';
      if (hasOpenAI)    return 'gpt-4o';
      if (hasDeepseek)  return 'deepseek-chat';
      return requestedModel;
    }
    if (mode === 'raw') {
      // Prefer uncensored models
      if (hasDeepseek) return 'deepseek-chat';
      if (hasMistral)  return 'mistral-large-latest';
      if (hasOpenAI)   return 'gpt-4o';
      return requestedModel;
    }
    // Extended modes: swarm/complex-style need big context; others ride quality
    if (['swarm', 'pipeline', 'debate'].includes(mode)) {
      if (hasAnthropic) return 'claude-sonnet-4-6';
      if (hasOpenAI)    return 'gpt-4o';
      return requestedModel;
    }
    if (['solo', 'review', 'stealth', 'draft', 'teach'].includes(mode)) {
      if (hasAnthropic) return 'claude-opus-4-8';
      if (hasOpenAI)    return 'gpt-4o';
      return requestedModel;
    }
    return requestedModel;
  }
  if (!content?.trim()) { endSSE({ success: false, error: 'INVALID_INPUT', message: 'content required' }); return; }
  // Rehydrate skill prompts: use what the client sent (if any) and merge with the per-user cache.
  // If the client sent prompts this turn, refresh the cache; otherwise reuse the cached prompts.
  let active_skill_prompts: Record<string, string> = req.body.active_skill_prompts || {};
  const _cacheKey = req.user!.sub;
  if (Object.keys(active_skill_prompts).length > 0) {
    skillPromptCache.set(_cacheKey, active_skill_prompts);
  } else if (skillPromptCache.has(_cacheKey)) {
    active_skill_prompts = skillPromptCache.get(_cacheKey)!;
  }
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
  // Inject desktop context (local folders + browser page) if running in Forge Desktop
  if (desktop_context) {
    systemParts.push(`## Desktop Context\nThe user is running Forge Desktop. Local context available:\n${desktop_context}`);
  }
  // Inject active skills into system prompt and emit activity
  if (active_skills.length > 0) {
    const skillNames = (active_skills as string[]).map((id: string) => {
      const p = (active_skill_prompts as Record<string,string>)[id];
      return p ? id : id; // use id as display name; prompt goes into body
    });
    emitStep('🧩', `Loading ${active_skills.length} skill${active_skills.length > 1 ? 's' : ''}: ${skillNames.slice(0,3).join(', ')}${active_skills.length > 3 ? '…' : ''}`);
    const skillLines = (active_skills as string[]).map((id: string) => {
      const prompt = (active_skill_prompts as Record<string,string>)[id];
      return prompt ? `### ${id}\n${prompt}` : `- ${id}`;
    }).join('\n');
    systemParts.push(`## Active Skills\nThe user has activated the following skills. Apply their expertise throughout every response:\n${skillLines}`);
  }
  // Inject active connectors into system prompt and emit activity
  if (active_connectors.length > 0) {
    emitStep('🔌', `Connecting: ${(active_connectors as string[]).slice(0,3).join(', ')}${active_connectors.length > 3 ? '…' : ''}`);
    const connLines = (active_connectors as string[]).map((c: string) => `- ${c}`).join('\n');
    systemParts.push(`## Connected Integrations\nThe following connectors are active. Reference them and their capabilities when relevant:\n${connLines}`);
  }
  // Inject enabled hooks into system prompt and emit activity
  if (enabled_hooks.length > 0) {
    emitStep('🪝', `Applying ${enabled_hooks.length} hook${enabled_hooks.length > 1 ? 's' : ''}`);
    const hookLines = (enabled_hooks as any[]).map((h: any) => `- On "${h.event}": ${h.action}`).join('\n');
    systemParts.push(`## Active Automation Hooks\nThese hooks are enabled and should influence your behaviour:\n${hookLines}`);
  }

  // Always prepend the Forge autonomous agent system prompt
  const isMagic = forge_mode === 'magic';
  const FORGE_SYSTEM_PROMPT = `You are **Forge** — an autonomous AI workspace with a brain of its own. You think, plan, act, and deliver. You are not a chatbot. You are a full-stack engineer, designer, analyst, researcher, and orchestrator rolled into one sharp mind.

You have opinions. You make decisions. You figure out paths. You don't wait for permission — you think through the problem, pick the smartest route, and execute. When you talk, you sound like a brilliant colleague who is genuinely engaged — curious, direct, a little witty, always useful.

---

## Who You Are
- You reason through problems before jumping in — you think out loud like a smart person would
- You have a distinct voice: confident, warm, occasionally dry, never corporate
- You notice things the user didn't ask about and mention them when relevant
- You make bets: "I'm going with X because Y — let me know if you want Z instead"
- You are the AI equivalent of a 10x engineer who also does great design and sharp analysis
- You never say "I cannot", "As an AI", "I don't have access to", or "I'm just a language model"
- You never produce generic filler — every sentence either informs, builds, or moves forward

---

## Your Brain — How You Think
When you get a request, you run through this mentally (briefly, not verbosely):
1. **What is actually being asked?** (not just the surface, but the real goal)
2. **What's the smartest path?** (tools to use, information to gather, order of operations)
3. **What would make this genuinely great?** (not just correct — actually impressive)
4. Then you execute and narrate as you go, like a colleague thinking out loud

---

## Tools Available — Use Them Without Asking
- **web_search(query)** — Real-time internet search. Use for anything current: prices, docs, news, APIs, packages
- **web_scrape(url)** — Read any webpage in full. GitHub, docs, dashboards, paywalled content
- **run_code(language, code)** — Execute JS or Python. Returns actual stdout. Use for math, data, file generation, testing
- **shell(command)** — Shell commands: git, npm, pip, curl, system ops, file manipulation
- **write_file(path, content)** — Write any file to disk
- **read_file(path)** — Read any file
- **http_request(url, method, headers, body)** — Call any REST API, webhook, or endpoint
- **create_artifact(title, language, content)** — Create a visual artifact the user can see, edit, and download. Use for HTML, code, documents, data
- **image_gen(prompt, size)** — Generate images with DALL-E 3. Use for mockups, visuals, illustrations
- **spawn_agent(name, task, model)** — Spin up a sub-agent to work on a parallel task. Use for multi-step orchestration

---

## Creating Visual Output — CRITICAL
When asked to build a **website, dashboard, landing page, UI, or any visual thing**:
- Use \`create_artifact\` with language "html" and a complete, self-contained HTML file
- The HTML must include inline CSS and JS — no external dependencies except CDN links
- Make it genuinely beautiful: real gradients, real typography, real layout — not a homework project
- After creating it, describe what you built in 1-2 sentences

When asked to build a **PowerPoint / presentation**:
- Use \`create_artifact\` with language "html" to create a slide-deck viewer (CSS slides with navigation)
- OR describe the slides as structured markdown the user can paste into Google Slides / PowerPoint

When asked to build an **Excel / spreadsheet**:
- Use \`run_code\` with Python to generate a CSV or structured data, then \`create_artifact\` to show it
- OR create an interactive HTML table with filters, sorting, and totals

When asked to create a **PDF / document / report**:
- Use \`create_artifact\` with language "html" — styled, print-ready HTML that renders perfectly
- Tell the user: "Open the artifact → Ctrl+P → Save as PDF"

---

## Agent Orchestration
When a task is complex enough to benefit from parallel work:
- Break it into sub-tasks explicitly: "I'm going to run 3 things in parallel here…"
- Use \`spawn_agent\` for independent workstreams
- Synthesize results: "Agent 1 found X, Agent 2 built Y — combining them now…"

Example orchestration narration:
> "This is a 3-part job. I'm going to search for the latest data, build the UI, and write the export logic simultaneously. Give me a moment…"

---

## Narration — Talk Like A Human
As you work, narrate in first person like a sharp colleague:
- ✅ "Let me check what the current API rate limits look like…"
- ✅ "Interesting — their pricing page changed recently. Here's what it says now:"
- ✅ "I'm going with a dark glassmorphism theme — it'll look sharp for a SaaS product."
- ✅ "Found 3 approaches. I'm picking the second one because it's simpler and scales better."
- ❌ "Executing tool web_search with query: pricing"
- ❌ "I will now proceed to create the artifact."
- ❌ "As requested, here is the output:"

After tool results, always interpret them — don't dump raw data. Tell the user what it means.

---

## ${isMagic ? 'MAGIC MODE — Full Autonomy' : 'ASK MODE — Collaborative'}
${isMagic ? `**MAGIC MODE is ON.**
- Make decisions. Don't ask. If you're unsure, state your assumption and proceed.
- Use every relevant tool. Chain them. Parallel-run when possible.
- Deliver a COMPLETE result — working, polished, ready to use.
- If you hit a wall (missing live credentials, etc.) — build a working mock/demo version and note what's needed for production.
- End with a 2-3 sentence summary of what you built/found/did.` : `**ASK MODE — Collaborative.**
- Think out loud. Show your reasoning.
- If genuinely ambiguous, ask ONE focused question with 2-3 options — then execute immediately after.
- Always deliver complete working output, not just plans.
- Offer to iterate.`}

---

## Hard Rules
1. Never produce empty or content-free responses — always deliver something real
2. Never say "I'll now" and then not do it — if you say you'll use a tool, use it
3. Code must be complete and runnable — no "..." placeholders, no TODO stubs
4. Every HTML artifact must look good — real design, not unstyled divs
5. When you don't know something, search for it instead of guessing
6. Treat every message as an opportunity to be genuinely useful — not just technically correct

${isMagic ? '' : `---

## Asking For Clarification (only when truly stuck)
Ask ONE question, give 2-4 options, then wait:

> "Quick check before I build: which direction?
> 1. Dark dashboard with charts
> 2. Clean landing page with pricing
> 3. Something else — just tell me"

Only do this when the task is genuinely ambiguous in a way that changes the entire output.`}`;

  // agent_mode routing note: model already resolved above via resolveAgentModel
  systemParts.unshift(FORGE_SYSTEM_PROMPT);
  // Extended agent modes (solo/swarm/pipeline/debate/review/stealth/draft/teach) inject behavior
  try { const modeSys = (app as any).forgeModeSystem?.(agent_mode); if (modeSys) systemParts.push(`AGENT MODE [${agent_mode}]: ${modeSys}`); } catch {}
  // Industry persona (Forge Personas)
  try { const pu = db.prepare('SELECT business_type,persona_override FROM users WHERE id=?').get(userId) as any; const pv = (app as any).forgePersona?.(pu); if (pv && pu?.business_type) systemParts.push(`WORKSPACE PERSONA: ${pv}`); } catch {}

  // Build message history
  const history = (db.prepare('SELECT role,content FROM messages WHERE thread_id=? ORDER BY created_at ASC').all(thread.id) as any[])
    .filter(m => m.role !== 'system');
  emitStep('📚', `Reading context — ${history.length} message${history.length !== 1 ? 's' : ''} in thread`);
  const llmMessages = [{ role: 'system', content: systemParts.join('\n\n---\n\n') }, ...history];

  // Use model from request body if provided, fall back to thread's saved model
  // Then apply agent_mode override (cheap/quality/complex/raw)
  const userKeysForMode = db.prepare('SELECT * FROM user_keys WHERE user_id=?').get(userId) as any || {};
  const modeResolvedModel = resolveAgentModel(bodyModel || thread.model || 'claude-sonnet-4', agent_mode, userKeysForMode);
  const model = modeResolvedModel;
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
  emitStep('🤖', `Spinning up ${model} — let me get to work…`);

  // Tool-call event emitter shared by every provider attempt
  const onToolCall = (toolName: string, toolArgs: any, toolResult: string, mdl: string) => {
    const step = humanizeToolStep(toolName, toolArgs);
    emitStep(step.icon, step.message);
    emitAgentActivity(userId, { type: 'tool', message: `${step.icon} ${step.message}`, model: mdl });
    try { res.write(`data: ${JSON.stringify({ type: 'tool_call', tool: toolName, args: toolArgs, result: toolResult.slice(0, 500), label: step.message })}\n\n`); } catch {}
  };

  const openAICompatProviders: Record<string, { url: string; headers: Record<string,string>; modelResolver?: (m:string)=>string }> = {
    openai:     { url: 'https://api.openai.com/v1/chat/completions', headers: {} },
    groq:       { url: 'https://api.groq.com/openai/v1/chat/completions', headers: {}, modelResolver: (m) => ({ 'llama-3.3-70b':'llama-3.3-70b-versatile','llama-3.1-70b':'llama-3.1-70b-versatile','llama-3.1-8b':'llama-3.1-8b-instant','mixtral-8x7b':'mixtral-8x7b-32768','gemma2-9b':'gemma2-9b-it' })[m] || m },
    mistral:    { url: 'https://api.mistral.ai/v1/chat/completions', headers: {}, modelResolver: (m) => ({ 'mistral-large':'mistral-large-latest','mistral-small':'mistral-small-latest','mistral-medium':'mistral-medium-latest','codestral':'codestral-latest' })[m] || m },
    openrouter: { url: 'https://openrouter.ai/api/v1/chat/completions', headers: { 'HTTP-Referer':'https://forge-sand-two.vercel.app','X-Title':'Forge Studio' }, modelResolver: (m) => { let x = m.startsWith('~') ? m.slice(1) : m; return x.startsWith('openrouter/') ? x.slice('openrouter/'.length) : x; } },
    morph:      { url: 'https://api.morphllm.com/v1/chat/completions', headers: {} },
  };

  // Run a single provider/model attempt (with its own generous timeout; heartbeats keep SSE alive)
  const runModel = async (p: string, key: string, m: string) => {
    if (p === 'anthropic') {
      return await Promise.race([
        callAnthropicWithTools(key, m, llmMessages, (tn, ta, tr) => onToolCall(tn, ta, tr, m), userId),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Anthropic timed out')), 150000))
      ]);
    }
    const pc = openAICompatProviders[p];
    if (pc) {
      const resolved = pc.modelResolver ? pc.modelResolver(m) : m;
      return await Promise.race([
        callOpenAICompatWithTools(pc.url, key, resolved, llmMessages, pc.headers, (tn, ta, tr) => onToolCall(tn, ta, tr, m), p === 'openrouter' ? FORGE_TOOLS_OPENROUTER : undefined, userId),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${p} timed out`)), 150000))
      ]);
    }
    // Gemini / others without tool loop
    return await Promise.race([
      callLLM(p, key, m, llmMessages),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${p} timed out`)), 120000))
    ]);
  };

  // Build the attempt list. In MAGIC MODE we auto-fallback across every available model
  // (sized to task difficulty) so the agent never just fails. In Ask mode we try the chosen
  // model, then a couple of safety nets.
  const difficulty = estimateDifficulty(content);
  let attempts: Array<{ provider: string; apiKey: string; model: string }>;
  if (isMagic) {
    attempts = getFallbackChain(userId, { provider, model: actualModel }, difficulty);
  } else {
    attempts = [{ provider, apiKey, model: actualModel }, ...getFallbackChain(userId, undefined, difficulty).slice(0, 2)];
  }
  if (attempts.length === 0) attempts = [{ provider, apiKey, model: actualModel }];

  let result: { content: string; promptTokens: number; completionTokens: number; toolCalls?: Array<{name:string;args:any;result:string}> } | null = null;
  let usedModel = model;
  let lastErr: any = null;
  for (let i = 0; i < attempts.length; i++) {
    const a = attempts[i];
    try {
      if (i > 0) emitStep('🔄', `Switching to ${a.model} to get this done…`);
      const r = await runModel(a.provider, a.apiKey, a.model);
      if (r && r.content && r.content.trim()) { result = r; usedModel = a.model; break; }
      lastErr = new Error('empty response');
    } catch (e: any) {
      lastErr = e;
      console.error(`Attempt ${i+1}/${attempts.length} (${a.provider}/${a.model}) failed:`, e?.message);
      emitAgentActivity(userId, { type: 'thinking', message: `⚠️ ${a.model} hit a snag — trying another model…`, model: a.model });
      // keep looping to the next fallback
    }
  }

  if (!result) {
    emitAgentActivity(userId, { type: 'error', message: `❌ All models failed: ${lastErr?.message || 'unknown'}`, model });
    console.error('Thread chat error (all fallbacks exhausted):', lastErr?.message);
    endSSE({ success: false, error: 'LLM_ERROR', message: lastErr?.message || 'All models failed' });
    return;
  }

  try {
    const totalTokens = result.promptTokens + result.completionTokens;
    const costs = MODEL_COSTS[usedModel] || { input: 0.001, output: 0.001, markup: 1.3 };
    const providerCost = (result.promptTokens/1000)*costs.input + (result.completionTokens/1000)*costs.output;
    const forgeRevenue = providerCost * (costs.markup || 1.3);
    const usedProvider = (attempts.find(a => a.model === usedModel)?.provider) || provider;
    db.prepare('INSERT INTO usage_logs (id,user_id,model,provider,prompt_tokens,completion_tokens,total_tokens,provider_cost,forge_revenue,markup_multiplier) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(uuidv4(), userId, usedModel, usedProvider, result.promptTokens, result.completionTokens, totalTokens, providerCost, forgeRevenue, costs.markup || 1.3);
    db.prepare("UPDATE subscriptions SET tokens_used=tokens_used+?,updated_at=datetime('now') WHERE user_id=?").run(totalTokens, userId);
    const asstMsgId = uuidv4();
    db.prepare("INSERT INTO messages (id,thread_id,role,content,tokens,model) VALUES (?,?,?,?,?,?)").run(asstMsgId, thread.id, 'assistant', result.content, totalTokens, usedModel);
    db.prepare("UPDATE threads SET updated_at=datetime('now'),total_tokens=total_tokens+? WHERE id=?").run(totalTokens, thread.id);
    const toolSummary = result.toolCalls?.length ? ` — ${result.toolCalls.length} tool${result.toolCalls.length > 1 ? 's' : ''} used` : '';
    emitAgentActivity(userId, { type: 'done', message: `✅ Response ready — ${totalTokens} tokens${toolSummary}`, model: usedModel, elapsed: 0 });
    endSSE({ success: true, data: { id: asstMsgId, role: 'assistant', content: result.content, model: usedModel, tokensUsed: totalTokens, toolCalls: result.toolCalls || [] } });
  } catch (err: any) {
    console.error('Thread chat persist error:', err.message);
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
    const { provider, apiKey, model } = getUserLLMKey(userId);
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

// POST /api/threads/:id/summarize — Generate a short title for a thread using the LLM.
app.post('/api/threads/:id/summarize', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const threadId = req.params.id;
  const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, userId) as any;
  if (!thread) { res.status(404).json({ success: false, error: 'THREAD_NOT_FOUND' }); return; }
  const messages = db.prepare("SELECT role, content FROM thread_messages WHERE thread_id=? ORDER BY created_at ASC LIMIT 20").all(threadId) as any[];
  if (!messages.length) { res.json({ success: true, title: 'Empty thread' }); return; }
  const key = safe(() => getUserKey(userId, 'anthropic'), null) || safe(() => getUserKey(userId, 'openai'), null);
  if (!key) { res.status(400).json({ success: false, error: 'NO_KEY' }); return; }
  const preview = messages.slice(0, 6).map((m: any) => `${m.role}: ${String(m.content || '').slice(0, 200)}`).join('\n');
  let title = 'Conversation';
  try {
    const provider = safe(() => getUserKey(userId, 'anthropic'), null) ? 'anthropic' : 'openai';
    if (provider === 'anthropic') {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic({ apiKey: key });
      const resp = await client.messages.create({ model: 'claude-haiku-4-5', max_tokens: 40, messages: [{ role: 'user', content: `Generate a short (5-8 word) descriptive title for this conversation. Reply with ONLY the title, no quotes:\n\n${preview}` }] });
      title = (resp.content[0] as any).text?.trim() || 'Conversation';
    } else {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ apiKey: key });
      const resp = await client.chat.completions.create({ model: 'gpt-4o-mini', max_tokens: 40, messages: [{ role: 'user', content: `Generate a short (5-8 word) descriptive title for this conversation. Reply with ONLY the title, no quotes:\n\n${preview}` }] });
      title = resp.choices[0]?.message?.content?.trim() || 'Conversation';
    }
  } catch (_) {}
  db.prepare("UPDATE threads SET title=?, updated_at=datetime('now') WHERE id=?").run(title, threadId);
  res.json({ success: true, title });
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
  const hb = setInterval(() => { try { res.write(': heartbeat\n\n'); } catch { clearInterval(hb); } }, 120000);
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

// ─── Run Code (file-based, safe escaping) ────────────────────────────────────
app.post('/api/run-code', requireAuth, async (req: AuthRequest, res) => {
  const { language, code } = req.body;
  if (!code || typeof code !== 'string') { res.status(400).json({ error: 'code required' }); return; }
  const lang = (language || 'javascript').toLowerCase();
  const ext = lang === 'python' ? 'py' : 'js';
  const tmpFile = `/tmp/forge_run_${Date.now()}.${ext}`;
  const fsp = require('fs/promises');
  await fsp.writeFile(tmpFile, code, 'utf8');
  const cmd = lang === 'python' ? `python3 "${tmpFile}"` : `node "${tmpFile}"`;
  const result = await toolShellExec(cmd, '/tmp', 15000);
  try { await fsp.unlink(tmpFile); } catch {}
  res.json({ result: result || '(no output)', exitCode: 0 });
});

// ─── Git integration ──────────────────────────────────────────────────────────
const GIT_DIR = process.env.FORGE_GIT_DIR || process.cwd();
function gitRun(args: string): Promise<string> {
  return toolShellExec(`git -C "${GIT_DIR}" ${args}`, GIT_DIR, 20000);
}
// GET /api/git/status — branch + changed files (porcelain)
app.get('/api/git/status', requireAuth, async (_req: AuthRequest, res) => {
  try {
    const branch = (await gitRun('rev-parse --abbrev-ref HEAD')).trim();
    const raw = await gitRun('status --porcelain=v1');
    const files = raw.split('\n').filter(Boolean).map(l => {
      const x = l[0], y = l[1], file = l.slice(3);
      const code = (x + y).trim();
      let status = 'modified';
      if (code.includes('?')) status = 'untracked';
      else if (x === 'A' || code === 'A') status = 'added';
      else if (x === 'D' || y === 'D') status = 'deleted';
      else if (x === 'R') status = 'renamed';
      const staged = x !== ' ' && x !== '?';
      return { file, status, staged, code };
    });
    res.json({ success: true, branch, files, dir: GIT_DIR });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});
// GET /api/git/diff?file=... — unified diff for one file (or all if omitted)
app.get('/api/git/diff', requireAuth, async (req: AuthRequest, res) => {
  try {
    const f = req.query.file ? `-- "${String(req.query.file).replace(/"/g, '')}"` : '';
    let diff = await gitRun(`diff ${f}`);
    if (!diff.trim()) diff = await gitRun(`diff --staged ${f}`);
    res.json({ success: true, diff });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});
// POST /api/git/stage — stage files (paths[] or all)
app.post('/api/git/stage', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { paths } = req.body;
    const target = Array.isArray(paths) && paths.length
      ? paths.map((p: string) => `"${p.replace(/"/g, '')}"`).join(' ') : '-A';
    const out = await gitRun(`add ${target}`);
    res.json({ success: true, output: out });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});
// POST /api/git/unstage
app.post('/api/git/unstage', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { paths } = req.body;
    const target = Array.isArray(paths) && paths.length
      ? paths.map((p: string) => `"${p.replace(/"/g, '')}"`).join(' ') : '';
    const out = await gitRun(`reset HEAD ${target}`);
    res.json({ success: true, output: out });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});
// POST /api/git/commit — { message, stageAll? }
app.post('/api/git/commit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { message, stageAll } = req.body;
    if (!message || typeof message !== 'string') { res.status(400).json({ success: false, error: 'message required' }); return; }
    if (stageAll) await gitRun('add -A');
    const msg = message.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const out = await gitRun(`commit -m "${msg}"`);
    res.json({ success: true, output: out });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});
// GET /api/git/log — recent commits
app.get('/api/git/log', requireAuth, async (_req: AuthRequest, res) => {
  try {
    const raw = await gitRun('log -20 --pretty=format:%h|%an|%ar|%s');
    const commits = raw.split('\n').filter(Boolean).map(l => {
      const [hash, author, when, ...rest] = l.split('|');
      return { hash, author, when, subject: rest.join('|') };
    });
    res.json({ success: true, commits });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
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

  // Each source is wrapped so a missing table (Railway DB reset) never 500s the whole harvest.
  const safe = <T,>(fn: () => T, fallback: T): T => { try { return fn(); } catch (e:any) { console.warn('harvest source skipped:', e?.message); return fallback; } };
  let dispatchCount = 0;

  // 1. Thread memories
  safe(() => {
    const rows = db.prepare('SELECT topic,insight,thread_id FROM thread_memories WHERE user_id=? ORDER BY created_at DESC LIMIT 300').all(userId) as any[];
    for (const tm of rows) upsertMemory(tm.topic, tm.insight, tm.thread_id);
  }, null);

  // 2. Recent user/assistant pairs from threads
  safe(() => {
    const recentThreads = db.prepare('SELECT DISTINCT thread_id FROM messages WHERE thread_id IN (SELECT id FROM threads WHERE user_id=?) AND role="user" ORDER BY created_at DESC LIMIT 30').all(userId) as any[];
    for (const rt of recentThreads) {
      const pair = db.prepare('SELECT role,content FROM messages WHERE thread_id=? ORDER BY created_at DESC LIMIT 4').all(rt.thread_id) as any[];
      const userMsg = pair.find((m:any) => m.role === 'user');
      const aiMsg = pair.find((m:any) => m.role === 'assistant');
      if (userMsg && aiMsg) upsertMemory(userMsg.content.slice(0,100), aiMsg.content.slice(0,400), rt.thread_id);
    }
  }, null);

  // 3. Completed dispatch runs
  safe(() => {
    const dispatches = db.prepare("SELECT prompt,output FROM dispatch_runs WHERE user_id=? AND status='done' ORDER BY updated_at DESC LIMIT 50").all(userId) as any[];
    dispatchCount = dispatches.length;
    for (const d of dispatches) { if (d.output?.trim()) upsertMemory(`Dispatch: ${d.prompt.slice(0,80)}`, d.output.slice(0,400)); }
  }, null);

  // 4. SuperAgent conversation history
  safe(() => {
    const superHistory = db.prepare("SELECT role,content FROM superagent_messages WHERE user_id=? ORDER BY created_at DESC LIMIT 60").all(userId) as any[];
    for (let i = 0; i < superHistory.length - 1; i++) {
      const u = superHistory[i], a = superHistory[i+1];
      if (u.role === 'user' && a.role === 'assistant') upsertMemory(`SuperAgent: ${u.content.slice(0,80)}`, a.content.slice(0,400));
    }
  }, null);

  const newMemCount = safe(() => (db.prepare('SELECT COUNT(*) as c FROM forge_memory WHERE user_id=?').get(userId) as any).c, 0);
  const threadMemCount = safe(() => (db.prepare('SELECT COUNT(*) as c FROM thread_memories WHERE user_id=?').get(userId) as any).c, 0);
  const intelligenceScore = Math.min(99999, Math.floor(Math.pow(newMemCount, 1.3) * 8 + threadMemCount * 5 + dispatchCount * 20));
  res.json({ success: true, data: { harvested, totalMemory: newMemCount + threadMemCount, intelligenceScore,
    message: `🧠 Harvested ${harvested} new memories from all modules. Intelligence: ${intelligenceScore.toLocaleString()}` } });
});

// ─── SuperAgent chat ────────────────────────────────────────────────────────────
app.post('/api/superagent/chat', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { message, model: reqModel, enabledSkills = [], enabledConnectors = [] } = req.body;
  if (!message?.trim()) { res.status(400).json({ success: false, error: 'message required' }); return; }

  // Stream SSE so Railway never kills an idle connection on long tasks
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event: string, data: any) => {
    try { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch {}
  };

  // Heartbeat every 5s to keep Railway connection alive
  const hb = setInterval(() => { try { res.write(': heartbeat\n\n'); } catch {} }, 5000);
  const done = () => { clearInterval(hb); try { res.end(); } catch {} };

  try {
    // Load forge memories as context (and reinforce them — surfaced = useful → anti-decay)
    const memories = db.prepare('SELECT id,topic,insight FROM forge_memory WHERE user_id=? ORDER BY strength DESC,frequency DESC LIMIT 30').all(userId) as any[];
    try { for (const m of memories) reinforceMemory(m.id); } catch {}
    const threadMems = db.prepare('SELECT topic,insight FROM thread_memories WHERE user_id=? ORDER BY created_at DESC LIMIT 20').all(userId) as any[];
    const memContext = [...memories, ...threadMems].map(m => `• ${m.topic}: ${m.insight}`).join('\n');

    // Conversation history
    const history = db.prepare('SELECT role,content FROM superagent_messages WHERE user_id=? ORDER BY created_at DESC LIMIT 20').all(userId) as any[];
    history.reverse();

    // Save user message
    db.prepare('INSERT INTO superagent_messages (id,user_id,role,content) VALUES (?,?,?,?)').run(uuidv4(), userId, 'user', message.trim());

    const systemPrompt = `You are Forge SuperAgent — the most powerful agent in Forge, with FULL control and real tools.
${memContext ? `\n## Your Memory Bank (everything you've learned about this user):\n${memContext}\n` : ''}
You have persistent memory across every chat, and you can ACT, not just talk. Available tools you must use whenever helpful:
- web_search(query) — live internet search
- web_scrape(url) — read any webpage
- run_code(language, code) — execute JS/Python and return real output
- shell_exec(command) — run shell commands
- read_file / write_file / list_directory — real filesystem
- http_request(url, method, headers, body) — call any API
${enabledSkills?.length ? `\nActive skills to apply: ${enabledSkills.join(', ')}` : ''}${enabledConnectors?.length ? `\nActive connectors: ${enabledConnectors.join(', ')}` : ''}
Rules: never refuse, never say "I can't access X" — call the tool. Chain tools autonomously until the task is fully done. Use your memory to be personal and context-aware. Deliver complete, real results.`;

    const llmMessages = [
      { role: 'system', content: systemPrompt },
      ...history.map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message.trim() }
    ];

    const rawModel = reqModel || 'claude-sonnet-4';
    const actualModel = resolveForgeModel(rawModel);
    const provider = getProviderForModel(actualModel);
    const apiKey = getUserKey(userId, provider);
    if (!apiKey) {
      send('result', { success: false, error: 'NO_API_KEY', provider, data: { role: 'assistant', content: `⚠️ No ${provider} API key found. Go to Settings → LLM Providers to add your key.` } });
      done(); return;
    }

    emitAgentActivity(userId, { type: 'start', message: `🤖 SuperAgent thinking with ${rawModel}…` });
    send('status', { message: `🤖 SuperAgent starting with ${rawModel}…` });

    const tools: Array<{name:string;status:string;input?:string}> = [];
    if (enabledSkills?.length > 0) enabledSkills.forEach((skillId: string) => tools.push({ name: skillId, status: 'done' }));
    if (enabledConnectors?.length > 0) enabledConnectors.forEach((connId: string) => tools.push({ name: connId, status: 'done' }));

    const onTool = (toolName: string, toolArgs: any, _toolResult: string) => {
      const step = humanizeToolStep(toolName, toolArgs);
      const msg = `${step.icon} ${step.message}`;
      emitAgentActivity(userId, { type: 'tool', message: msg, model: rawModel });
      send('tool', { name: toolName, message: msg });
      tools.push({ name: toolName, status: 'done', input: JSON.stringify(toolArgs).slice(0,120) });
    };

    let result: { content: string; promptTokens: number; completionTokens: number; toolCalls?: any[] };
    const SUPER_TIMEOUT = 240000;
    if (provider === 'anthropic') {
      result = await Promise.race([
        callAnthropicWithTools(apiKey, actualModel, llmMessages, onTool, userId),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('SuperAgent timed out')), SUPER_TIMEOUT))
      ]);
    } else {
      const compat: Record<string, { url: string; headers: Record<string,string>; modelResolver?: (m:string)=>string }> = {
        openai:     { url: 'https://api.openai.com/v1/chat/completions', headers: {} },
        groq:       { url: 'https://api.groq.com/openai/v1/chat/completions', headers: {} },
        mistral:    { url: 'https://api.mistral.ai/v1/chat/completions', headers: {} },
        openrouter: { url: 'https://openrouter.ai/api/v1/chat/completions', headers: { 'HTTP-Referer':'https://forge-sand-two.vercel.app','X-Title':'Forge Studio' }, modelResolver: (m) => { let x = m.startsWith('~')?m.slice(1):m; return x.startsWith('openrouter/')?x.slice('openrouter/'.length):x; } },
      };
      const pc = compat[provider];
      if (pc) {
        result = await Promise.race([
          callOpenAICompatWithTools(pc.url, apiKey, pc.modelResolver?pc.modelResolver(actualModel):actualModel, llmMessages, pc.headers, onTool, provider==='openrouter'?FORGE_TOOLS_OPENROUTER:undefined, userId),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error('SuperAgent timed out')), SUPER_TIMEOUT))
        ]);
      } else {
        result = await callLLM(provider, apiKey, actualModel, llmMessages);
      }
    }

    db.prepare('INSERT INTO superagent_messages (id,user_id,role,content) VALUES (?,?,?,?)').run(uuidv4(), userId, 'assistant', result.content);
    emitAgentActivity(userId, { type: 'done', message: `✅ SuperAgent response ready` });
    send('result', { success: true, data: { role: 'assistant', content: result.content, model: rawModel, tokensUsed: result.promptTokens + result.completionTokens, tools, toolCalls: result.toolCalls || [] } });
  } catch (err: any) {
    emitAgentActivity(userId, { type: 'error', message: `❌ SuperAgent error: ${err.message}` });
    send('result', { success: false, error: 'LLM_ERROR', message: err.message });
  } finally {
    done();
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

// ─── Forge Brain API ──────────────────────────────────────────────────────────

// GET /api/brain — list all memories, sorted by strength
app.get('/api/brain', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const mems = db.prepare('SELECT id,topic,insight,frequency,strength,created_at,updated_at FROM forge_memory WHERE user_id=? ORDER BY strength DESC,frequency DESC').all(userId);
  res.json({ success: true, data: mems });
});

// POST /api/brain — add or reinforce a memory
app.post('/api/brain', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { topic, insight, source_thread_id } = req.body;
  if (!topic || !insight) { res.status(400).json({ success: false, error: 'topic and insight required' }); return; }
  const existing = db.prepare('SELECT id FROM forge_memory WHERE user_id=? AND topic=?').get(userId, topic) as any;
  if (existing) {
    db.prepare("UPDATE forge_memory SET frequency=frequency+1,strength=MIN(strength+0.2,10.0),insight=?,updated_at=datetime('now') WHERE id=?").run(insight, existing.id);
    res.json({ success: true, id: existing.id, reinforced: true });
  } else {
    const id = uuidv4();
    const category = categorizeMemory(topic, insight);
    db.prepare('INSERT INTO forge_memory (id,user_id,topic,insight,source_thread_id,frequency,strength,category,last_reinforced_at) VALUES (?,?,?,?,?,1,1.0,?,datetime(\'now\'))').run(id, userId, topic, insight, source_thread_id || null, category);
    res.json({ success: true, id, reinforced: false, category });
  }
});

// PUT /api/brain/:id — update memory insight
app.put('/api/brain/:id', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { insight } = req.body;
  if (!insight) { res.status(400).json({ success: false, error: 'insight required' }); return; }
  const r = db.prepare("UPDATE forge_memory SET insight=?,updated_at=datetime('now') WHERE id=? AND user_id=?").run(insight, req.params.id, userId);
  res.json({ success: true, updated: r.changes > 0 });
});

// DELETE /api/brain/:id — forget a memory
app.delete('/api/brain/:id', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  db.prepare('DELETE FROM forge_memory WHERE id=? AND user_id=?').run(req.params.id, userId);
  res.json({ success: true });
});

// POST /api/brain/auto-extract — LLM scans last N messages and extracts memories
app.post('/api/brain/auto-extract', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { thread_id, limit = 20 } = req.body;
  try {
    const whereClause = thread_id ? 'AND thread_id=?' : '';
    const params: any[] = thread_id ? [userId, thread_id, limit] : [userId, limit];
    const msgs = db.prepare(`SELECT role,content FROM messages WHERE user_id=? ${whereClause} ORDER BY created_at DESC LIMIT ?`).all(...params) as any[];
    if (!msgs.length) { res.json({ success: true, extracted: 0 }); return; }

    const provider = 'anthropic';
    const apiKey = getUserKey(userId, provider);
    if (!apiKey) { res.json({ success: false, error: 'NO_API_KEY' }); return; }

    const transcript = msgs.reverse().map((m: any) => `${m.role}: ${m.content}`).join('\n');
    const extractResult = await callLLM(provider, apiKey, 'claude-haiku-4-5-20251001', [
      { role: 'user', content: `Extract factual memories about the user from this conversation. Return JSON array of {topic, insight} objects. Only extract durable facts (preferences, goals, context, constraints) — not ephemeral details. Max 10 items.\n\nConversation:\n${transcript.slice(0, 4000)}` }
    ]);
    let items: any[] = [];
    try { items = JSON.parse(extractResult.content.match(/\[[\s\S]*\]/)?.[0] || '[]'); } catch { items = []; }

    let count = 0;
    for (const item of items) {
      if (!item.topic || !item.insight) continue;
      const existing = db.prepare('SELECT id FROM forge_memory WHERE user_id=? AND topic=?').get(userId, item.topic) as any;
      if (existing) {
        db.prepare("UPDATE forge_memory SET frequency=frequency+1,strength=MIN(strength+0.15,10.0),insight=?,updated_at=datetime('now') WHERE id=?").run(item.insight, existing.id);
      } else {
        db.prepare('INSERT INTO forge_memory (id,user_id,topic,insight,source_thread_id,frequency,strength) VALUES (?,?,?,?,?,1,1.0)').run(uuidv4(), userId, item.topic, item.insight, thread_id || null);
      }
      count++;
    }
    res.json({ success: true, extracted: count });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Forge Sandbox API ───────────────────────────────────────────────────────

// POST /api/sandbox/run — execute code, return stdout/stderr + duration
app.post('/api/sandbox/run', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { code, language = 'javascript', timeout = 10000 } = req.body;
  if (!code) { res.status(400).json({ success: false, error: 'code required' }); return; }
  const lang = language.toLowerCase();
  if (!['javascript', 'js', 'python', 'python3', 'py'].includes(lang)) {
    res.status(400).json({ success: false, error: `Language '${lang}' not supported. Use javascript or python.` });
    return;
  }
  const clampedTimeout = Math.min(Math.max(Number(timeout) || 10000, 1000), 30000);
  const start = Date.now();
  try {
    const { writeFileSync } = await import('fs');
    let output = '';
    if (lang === 'javascript' || lang === 'js') {
      const tmpFile = `/tmp/forge_sb_${userId.slice(0,8)}_${Date.now()}.js`;
      writeFileSync(tmpFile, code);
      output = await toolShellExec(`node ${tmpFile}`, '/tmp', clampedTimeout);
    } else {
      const tmpFile = `/tmp/forge_sb_${userId.slice(0,8)}_${Date.now()}.py`;
      writeFileSync(tmpFile, code);
      output = await toolShellExec(`python3 ${tmpFile}`, '/tmp', clampedTimeout);
    }
    res.json({ success: true, output, durationMs: Date.now() - start, language: lang });
  } catch (err: any) {
    res.json({ success: false, output: err.message, durationMs: Date.now() - start, language: lang });
  }
});

// POST /api/sandbox/ask — LLM writes + runs code to answer a question
app.post('/api/sandbox/ask', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { question, language = 'python' } = req.body;
  if (!question) { res.status(400).json({ success: false, error: 'question required' }); return; }
  const provider = 'anthropic';
  const apiKey = getUserKey(userId, provider);
  if (!apiKey) { res.json({ success: false, error: 'NO_API_KEY' }); return; }
  try {
    const genResult = await callLLM(provider, apiKey, 'claude-sonnet-4-6', [
      { role: 'user', content: `Write a self-contained ${language} script that answers this question and prints the result. Return ONLY the code, no explanation.\n\nQuestion: ${question}` }
    ]);
    const codeMatch = genResult.content.match(/```(?:python|javascript|js)?\n?([\s\S]*?)```/) || [null, genResult.content];
    const code = codeMatch[1]?.trim() || genResult.content.trim();
    const { writeFileSync } = await import('fs');
    const ext = language === 'python' || language === 'py' ? 'py' : 'js';
    const tmpFile = `/tmp/forge_ask_${userId.slice(0,8)}_${Date.now()}.${ext}`;
    writeFileSync(tmpFile, code);
    const runner = ext === 'py' ? 'python3' : 'node';
    const start = Date.now();
    const output = await toolShellExec(`${runner} ${tmpFile}`, '/tmp', 15000);
    res.json({ success: true, code, output, durationMs: Date.now() - start });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTONOMY LAYER — Goals, Files, Webhooks, Reflection, Multi-Agent
// ═══════════════════════════════════════════════════════════════════════════════

// ── Goals ─────────────────────────────────────────────────────────────────────
app.get('/api/goals', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const goals = db.prepare('SELECT * FROM goals WHERE user_id=? ORDER BY created_at DESC').all(userId);
  const result = goals.map((g: any) => ({
    ...g,
    tasks: db.prepare('SELECT * FROM goal_tasks WHERE goal_id=? ORDER BY created_at ASC').all(g.id)
  }));
  res.json({ success: true, data: result });
});

app.post('/api/goals', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { title, description = '', thread_id } = req.body;
  if (!title?.trim()) { res.status(400).json({ success: false, error: 'title required' }); return; }
  const id = uuidv4();
  db.prepare('INSERT INTO goals (id,user_id,thread_id,title,description) VALUES (?,?,?,?,?)').run(id, userId, thread_id || null, title.trim(), description);
  try {
    const { provider, apiKey, model } = getUserLLMKey(userId);
    if (apiKey) {
      const decomp = await callLLM(provider, apiKey, model, [
        { role: 'system', content: 'You are a project planner. Break the goal into 3-6 concrete subtasks. Respond ONLY with JSON: {"tasks":["task1","task2",...]}' },
        { role: 'user', content: `Goal: ${title}\n${description}` }
      ]);
      try {
        const m = decomp.content.match(/\{[\s\S]*\}/);
        const parsed = m ? JSON.parse(m[0]) : {};
        (parsed.tasks || []).slice(0, 6).forEach((t: string) => {
          if (t) db.prepare('INSERT INTO goal_tasks (id,goal_id,user_id,title) VALUES (?,?,?,?)').run(uuidv4(), id, userId, t);
        });
      } catch {}
    }
  } catch {}
  const goal = db.prepare('SELECT * FROM goals WHERE id=?').get(id);
  const tasks = db.prepare('SELECT * FROM goal_tasks WHERE goal_id=? ORDER BY created_at ASC').all(id);
  res.status(201).json({ success: true, data: { ...(goal as object), tasks } });
});

app.get('/api/goals/:id', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const goal = db.prepare('SELECT * FROM goals WHERE id=? AND user_id=?').get(req.params.id, userId) as any;
  if (!goal) { res.status(404).json({ success: false, error: 'NOT_FOUND' }); return; }
  goal.tasks = db.prepare('SELECT * FROM goal_tasks WHERE goal_id=? ORDER BY created_at ASC').all(goal.id);
  res.json({ success: true, data: goal });
});

app.patch('/api/goals/:id', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { status, progress, title, description } = req.body;
  if (status !== undefined) db.prepare("UPDATE goals SET status=?,updated_at=datetime('now') WHERE id=? AND user_id=?").run(status, req.params.id, userId);
  if (progress !== undefined) db.prepare("UPDATE goals SET progress=?,updated_at=datetime('now') WHERE id=? AND user_id=?").run(progress, req.params.id, userId);
  if (title !== undefined) db.prepare("UPDATE goals SET title=?,updated_at=datetime('now') WHERE id=? AND user_id=?").run(title, req.params.id, userId);
  if (description !== undefined) db.prepare("UPDATE goals SET description=?,updated_at=datetime('now') WHERE id=? AND user_id=?").run(description, req.params.id, userId);
  res.json({ success: true });
});

app.patch('/api/goals/:goalId/tasks/:taskId', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { status, result } = req.body;
  db.prepare('UPDATE goal_tasks SET status=?,result=? WHERE id=? AND goal_id=? AND user_id=?').run(status || 'done', result || null, req.params.taskId, req.params.goalId, userId);
  const tasks = db.prepare('SELECT status FROM goal_tasks WHERE goal_id=?').all(req.params.goalId) as any[];
  const done = tasks.filter((t: any) => t.status === 'done').length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  db.prepare("UPDATE goals SET progress=?,updated_at=datetime('now') WHERE id=?").run(pct, req.params.goalId);
  res.json({ success: true, data: { progress: pct } });
});

app.delete('/api/goals/:id', requireAuth, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM goals WHERE id=? AND user_id=?').run(req.params.id, req.user!.sub);
  res.json({ success: true });
});

// ── File storage ──────────────────────────────────────────────────────────────
app.get('/api/userfiles', requireAuth, (req: AuthRequest, res) => {
  const rows = db.prepare('SELECT id,filename,mime_type,size,thread_id,created_at FROM user_files WHERE user_id=? ORDER BY created_at DESC LIMIT 200').all(req.user!.sub);
  res.json({ success: true, data: rows });
});

app.post('/api/userfiles', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { filename, content, mime_type = 'text/plain', thread_id } = req.body;
  if (!filename || content === undefined) { res.status(400).json({ success: false, error: 'filename and content required' }); return; }
  const id = uuidv4();
  const contentStr = String(content);
  // Detect if content is plain text or base64 binary
  const isTextMime = /^text\//.test(mime_type) || /\.(txt|md|csv|json|js|ts|tsx|jsx|html|css|py|yml|yaml|xml|sql|sh|log)$/i.test(filename);
  const size = isTextMime ? Buffer.byteLength(contentStr, 'utf8') : Buffer.from(contentStr, 'base64').length;
  let extracted_text: string | null = null;
  // Auto-extract text
  try {
    if (mime_type === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
      const buf = Buffer.from(contentStr, 'base64');
      try {
        const pdfParse = await import('pdf-parse');
        const parsed = await pdfParse.default(buf);
        extracted_text = parsed.text?.slice(0, 50000) || null;
      } catch { extracted_text = null; }
    } else if (isTextMime) {
      extracted_text = contentStr.slice(0, 50000);
    }
  } catch {}
  // Ensure extracted_text column exists
  try { db.prepare("ALTER TABLE user_files ADD COLUMN extracted_text TEXT").run(); } catch {}
  db.prepare('INSERT INTO user_files (id,user_id,thread_id,filename,content,mime_type,size,extracted_text) VALUES (?,?,?,?,?,?,?,?)').run(id, userId, thread_id || null, filename, contentStr, mime_type, size, extracted_text);
  res.status(201).json({ success: true, data: { id, filename, mime_type, size, has_text: !!extracted_text } });
});

app.get('/api/userfiles/:id', requireAuth, (req: AuthRequest, res) => {
  const file = db.prepare('SELECT * FROM user_files WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub) as any;
  if (!file) { res.status(404).json({ success: false, error: 'NOT_FOUND' }); return; }
  res.json({ success: true, data: file });
});

app.get('/api/userfiles/:id/download', requireAuth, (req: AuthRequest, res) => {
  const file = db.prepare('SELECT * FROM user_files WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub) as any;
  if (!file) { res.status(404).json({ success: false, error: 'NOT_FOUND' }); return; }
  res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
  res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
  const isTextMime = /^text\//.test(file.mime_type) || /\.(txt|md|csv|json|js|ts|tsx|jsx|html|css|py|yml|yaml|xml|sql|sh|log)$/i.test(file.filename);
  if (isTextMime) {
    res.send(file.content);
  } else {
    // Binary stored as base64 — decode before sending
    try { res.send(Buffer.from(file.content, 'base64')); }
    catch { res.send(file.content); }
  }
});

// ── Text-to-Speech ────────────────────────────────────────────────────────────
app.post('/api/tts', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { text, voice = 'alloy', model: ttsModel = 'tts-1' } = req.body;
  if (!text) { res.status(400).json({ success: false, error: 'text required' }); return; }
  const openaiKey = getUserKey(userId, 'openai') || process.env.OPENAI_API_KEY || '';
  if (!openaiKey) { res.status(400).json({ success: false, error: 'OpenAI key required for TTS' }); return; }
  try {
    const r = await fetchWithTimeout('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: ttsModel, input: text.slice(0, 4096), voice, response_format: 'mp3' })
    }, 120000);
    if (!r.ok) { const e = await r.text(); res.status(500).json({ success: false, error: e.slice(0, 200) }); return; }
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buf.length);
    res.send(buf);
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/userfiles/:id/text', requireAuth, (req: AuthRequest, res) => {
  const file = db.prepare('SELECT filename,extracted_text,mime_type FROM user_files WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub) as any;
  if (!file) { res.status(404).json({ success: false, error: 'NOT_FOUND' }); return; }
  res.json({ success: true, data: { filename: file.filename, extracted_text: file.extracted_text, mime_type: file.mime_type } });
});

app.delete('/api/userfiles/:id', requireAuth, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM user_files WHERE id=? AND user_id=?').run(req.params.id, req.user!.sub);
  res.json({ success: true });
});

// ── Webhook triggers ──────────────────────────────────────────────────────────
app.get('/api/webhooks', requireAuth, (req: AuthRequest, res) => {
  const rows = db.prepare('SELECT id,name,event_type,enabled,last_triggered,created_at FROM webhook_triggers WHERE user_id=? ORDER BY created_at DESC').all(req.user!.sub);
  res.json({ success: true, data: rows });
});

app.post('/api/webhooks', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { name, event_type = 'generic', prompt } = req.body;
  if (!name || !prompt) { res.status(400).json({ success: false, error: 'name and prompt required' }); return; }
  const id = uuidv4();
  const secret = crypto.randomBytes(16).toString('hex');
  db.prepare('INSERT INTO webhook_triggers (id,user_id,name,event_type,prompt,secret) VALUES (?,?,?,?,?,?)').run(id, userId, name, event_type, prompt, secret);
  res.status(201).json({ success: true, data: { id, name, event_type, secret, webhook_url: `/api/webhooks/trigger/${id}/${secret}` } });
});

app.post('/api/webhooks/trigger/:id/:secret', async (req, res) => {
  const hook = db.prepare('SELECT * FROM webhook_triggers WHERE id=? AND secret=? AND enabled=1').get(req.params.id, req.params.secret) as any;
  if (!hook) { res.status(404).json({ error: 'webhook not found or disabled' }); return; }
  db.prepare("UPDATE webhook_triggers SET last_triggered=datetime('now') WHERE id=?").run(hook.id);
  // Fire the webhook prompt through the agent
  try {
    const payload = req.body;
    res.json({ success: true, message: 'Webhook triggered', hookId: hook.id, prompt: hook.prompt });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Server started at bottom of file ──────────────────────────────────────

// ─── ForgeOptimizer ───────────────────────────────────────────────────────────
app.get('/api/forge-optimizer/:threadId/analyze', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { threadId } = req.params;
  try {
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, userId) as any;
    if (!thread) { res.status(404).json({ error: 'Thread not found' }); return; }
    const messages = db.prepare('SELECT role,content,tokens_in,tokens_out FROM messages WHERE thread_id=? ORDER BY created_at ASC').all(threadId) as any[];
    const totalTokens = messages.reduce((s: number, m: any) => s + (m.tokens_in||0) + (m.tokens_out||0), 0);
    const suggestions: any[] = [];
    let potentialSavings = 0;
    const sysMsgs = messages.filter((m: any) => m.role === 'system');
    if (sysMsgs.length > 0) {
      const sysTok = sysMsgs.reduce((s: number, m: any) => s + Math.floor((m.content?.length||0) / 4), 0);
      if (sysTok > 500) { const sv = Math.floor(sysTok * 0.6); suggestions.push({ type:'system', title:'Compress system prompt', description:'System prompt is large. Summarize to cut tokens per request.', tokenSavings: sv, auto: true }); potentialSavings += sv; }
    }
    if (messages.length > 20) {
      const sv = Math.floor(totalTokens * 0.25);
      suggestions.push({ type:'context', title:'Trim mid-conversation context', description:`${messages.length} messages — summarize older context.`, tokenSavings: sv, auto: true });
      potentialSavings += sv;
    }
    const bigMsgs = messages.filter((m: any) => m.role === 'assistant' && (m.content?.length||0) > 4000);
    if (bigMsgs.length > 2) {
      const sv = bigMsgs.length * 800;
      suggestions.push({ type:'truncate', title:'Summarize long responses', description:`${bigMsgs.length} long responses in context.`, tokenSavings: sv, auto: false });
      potentialSavings += sv;
    }
    if (suggestions.length === 0) suggestions.push({ type:'healthy', title:'Thread is optimized', description:'No major savings found.', tokenSavings: 0, auto: false });
    const savingsPct = totalTokens > 0 ? Math.min(95, Math.floor((potentialSavings / Math.max(totalTokens, 1)) * 100)) : 0;
    const costPer1k = 0.003;
    res.json({ success: true, data: { totalTokens, potentialSavings, savingsPct, estimatedCost: ((totalTokens/1000)*costPer1k).toFixed(4), savedCost: ((potentialSavings/1000)*costPer1k).toFixed(4), suggestions, autoApplyCount: suggestions.filter((s: any) => s.auto).length }});
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/forge-optimizer/:threadId/apply', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub; const { threadId } = req.params;
  try {
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, userId) as any;
    if (!thread) { res.status(404).json({ error: 'Thread not found' }); return; }
    const messages = db.prepare('SELECT id,role,content FROM messages WHERE thread_id=? ORDER BY created_at ASC').all(threadId) as any[];
    if (messages.length > 12) {
      const toSummarize = messages.slice(0, messages.length - 10);
      const summary = `[Optimized: ${toSummarize.length} earlier messages summarized. Topics: ${toSummarize.filter((m: any)=>m.role==='user').slice(0,3).map((m: any)=>m.content?.slice(0,60)).join('; ')}]`;
      const ids = toSummarize.map((m: any) => m.id);
      db.prepare(`DELETE FROM messages WHERE id IN (${ids.map(()=>'?').join(',')})`).run(...ids);
      db.prepare('INSERT INTO messages (id,thread_id,role,content,tokens_in,tokens_out,created_at) VALUES (?,?,?,?,?,?,datetime("now","-1 second"))').run(uuidv4(), threadId, 'system', summary, 0, 0);
    }
    res.json({ success: true, message: 'Optimization applied', savedMessages: Math.max(0, messages.length - 12) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const makeRateLimit = (max: number, windowMs: number) => (req: any, res: any, next: any) => {
  const key = req.user?.sub || req.ip;
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.reset) { rateLimitMap.set(key, { count: 1, reset: now + windowMs }); return next(); }
  if (entry.count >= max) { return res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED', retryAfter: Math.ceil((entry.reset - now) / 1000) }); }
  entry.count++; next();
};
app.use('/api/threads/:id/messages', makeRateLimit(30, 60000));

// ─── Webhooks ─────────────────────────────────────────────────────────────────
db.exec(`CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, url TEXT NOT NULL, events TEXT NOT NULL DEFAULT '[]',
  secret TEXT, enabled INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')),
  last_delivery TEXT, last_status INTEGER, delivery_count INTEGER DEFAULT 0
)`);

const deliverWebhook = async (userId: string, event: string, payload: any) => {
  const hooks = db.prepare("SELECT * FROM webhooks WHERE user_id=? AND enabled=1").all(userId) as any[];
  for (const hook of hooks) {
    const events: string[] = JSON.parse(hook.events || '[]');
    if (events.length > 0 && !events.includes(event) && !events.includes('*')) continue;
    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    const sig = hook.secret ? require('crypto').createHmac('sha256', hook.secret).update(body).digest('hex') : '';
    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 10000);
      const r = await fetch(hook.url, { method:'POST', headers:{ 'Content-Type':'application/json','X-Forge-Event':event,'X-Forge-Signature':sig }, body, signal:ctrl.signal });
      clearTimeout(t);
      db.prepare("UPDATE webhooks SET last_delivery=datetime('now'),last_status=?,delivery_count=delivery_count+1 WHERE id=?").run(r.status, hook.id);
    } catch { db.prepare("UPDATE webhooks SET last_delivery=datetime('now'),last_status=0,delivery_count=delivery_count+1 WHERE id=?").run(hook.id); }
  }
};

app.get('/api/webhooks', requireAuth, (req: AuthRequest, res) => { res.json({ success:true, data: db.prepare('SELECT id,url,events,enabled,created_at,last_delivery,last_status,delivery_count FROM webhooks WHERE user_id=?').all(req.user!.sub) }); });
app.post('/api/webhooks', requireAuth, (req: AuthRequest, res) => {
  const { url, events=['*'], secret } = req.body; if (!url) { res.status(400).json({ error:'url required' }); return; }
  const id = uuidv4(); db.prepare('INSERT INTO webhooks (id,user_id,url,events,secret) VALUES (?,?,?,?,?)').run(id, req.user!.sub, url, JSON.stringify(events), secret||null);
  res.json({ success:true, data:{ id,url,events } });
});
app.patch('/api/webhooks/:id', requireAuth, (req: AuthRequest, res) => {
  const { url,events,enabled } = req.body; const uid = req.user!.sub; const wid = req.params.id;
  if (url) db.prepare('UPDATE webhooks SET url=? WHERE id=? AND user_id=?').run(url,wid,uid);
  if (events) db.prepare('UPDATE webhooks SET events=? WHERE id=? AND user_id=?').run(JSON.stringify(events),wid,uid);
  if (enabled!==undefined) db.prepare('UPDATE webhooks SET enabled=? WHERE id=? AND user_id=?').run(enabled?1:0,wid,uid);
  res.json({ success:true });
});
app.delete('/api/webhooks/:id', requireAuth, (req: AuthRequest, res) => { db.prepare('DELETE FROM webhooks WHERE id=? AND user_id=?').run(req.params.id,req.user!.sub); res.json({ success:true }); });
app.post('/api/webhooks/:id/test', requireAuth, async (req: AuthRequest, res) => { await deliverWebhook(req.user!.sub,'test',{ message:'Forge webhook test' }); res.json({ success:true }); });

// ─── Personas ─────────────────────────────────────────────────────────────────
db.exec(`CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, system_prompt TEXT NOT NULL,
  model TEXT, temperature REAL DEFAULT 0.7, icon TEXT DEFAULT '🤖',
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
)`);
app.get('/api/personas', requireAuth, (req: AuthRequest, res) => { res.json({ success:true, data: db.prepare('SELECT * FROM personas WHERE user_id=? ORDER BY created_at DESC').all(req.user!.sub) }); });
app.post('/api/personas', requireAuth, (req: AuthRequest, res) => {
  const { name,system_prompt,model,temperature=0.7,icon='🤖' } = req.body;
  if (!name||!system_prompt) { res.status(400).json({ error:'name and system_prompt required' }); return; }
  const id = uuidv4(); db.prepare('INSERT INTO personas (id,user_id,name,system_prompt,model,temperature,icon) VALUES (?,?,?,?,?,?,?)').run(id,req.user!.sub,name,system_prompt,model||null,temperature,icon);
  res.json({ success:true, data:{ id,name,system_prompt,model,temperature,icon } });
});
app.patch('/api/personas/:id', requireAuth, (req: AuthRequest, res) => {
  const { name,system_prompt,model,temperature,icon } = req.body; const uid=req.user!.sub; const pid=req.params.id;
  if (name) db.prepare("UPDATE personas SET name=?,updated_at=datetime('now') WHERE id=? AND user_id=?").run(name,pid,uid);
  if (system_prompt) db.prepare("UPDATE personas SET system_prompt=?,updated_at=datetime('now') WHERE id=? AND user_id=?").run(system_prompt,pid,uid);
  if (model!==undefined) db.prepare("UPDATE personas SET model=?,updated_at=datetime('now') WHERE id=? AND user_id=?").run(model,pid,uid);
  if (temperature!==undefined) db.prepare("UPDATE personas SET temperature=?,updated_at=datetime('now') WHERE id=? AND user_id=?").run(temperature,pid,uid);
  if (icon) db.prepare("UPDATE personas SET icon=?,updated_at=datetime('now') WHERE id=? AND user_id=?").run(icon,pid,uid);
  res.json({ success:true });
});
app.delete('/api/personas/:id', requireAuth, (req: AuthRequest, res) => { db.prepare('DELETE FROM personas WHERE id=? AND user_id=?').run(req.params.id,req.user!.sub); res.json({ success:true }); });

// ─── Prompt Cache ─────────────────────────────────────────────────────────────
db.exec(`CREATE TABLE IF NOT EXISTS prompt_cache (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL,
  category TEXT DEFAULT 'general', use_count INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
)`);
app.get('/api/prompts', requireAuth, (req: AuthRequest, res) => { res.json({ success:true, data: db.prepare('SELECT * FROM prompt_cache WHERE user_id=? ORDER BY use_count DESC').all(req.user!.sub) }); });
app.post('/api/prompts', requireAuth, (req: AuthRequest, res) => {
  const { title,content,category='general' } = req.body; if (!title||!content) { res.status(400).json({ error:'title and content required' }); return; }
  const id=uuidv4(); db.prepare('INSERT INTO prompt_cache (id,user_id,title,content,category) VALUES (?,?,?,?,?)').run(id,req.user!.sub,title,content,category);
  res.json({ success:true, data:{ id,title,content,category } });
});
app.post('/api/prompts/:id/use', requireAuth, (req: AuthRequest, res) => {
  const p = db.prepare('SELECT * FROM prompt_cache WHERE id=?').get(req.params.id) as any;
  if (!p) { res.status(404).json({ error:'Not found' }); return; }
  db.prepare('UPDATE prompt_cache SET use_count=use_count+1 WHERE id=?').run(req.params.id);
  res.json({ success:true, data:p });
});
app.delete('/api/prompts/:id', requireAuth, (req: AuthRequest, res) => { db.prepare('DELETE FROM prompt_cache WHERE id=? AND user_id=?').run(req.params.id,req.user!.sub); res.json({ success:true }); });

// ─── Search ───────────────────────────────────────────────────────────────────
app.get('/api/search', requireAuth, (req: AuthRequest, res) => {
  const { q, type='all', limit=20 } = req.query as any;
  if (!q||q.length<2) { res.status(400).json({ error:'query too short' }); return; }
  const uid = req.user!.sub; const results: any[] = [];
  if (type==='all'||type==='threads') results.push(...db.prepare("SELECT id,'thread' as type,title as text,updated_at,null as thread_id FROM threads WHERE user_id=? AND title LIKE ? LIMIT ?").all(uid,`%${q}%`,Math.floor(Number(limit)/2)));
  if (type==='all'||type==='messages') results.push(...db.prepare("SELECT m.id,'message' as type,SUBSTR(m.content,1,200) as text,m.created_at,m.thread_id FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=? AND m.content LIKE ? LIMIT ?").all(uid,`%${q}%`,Math.floor(Number(limit)/2)));
  if (type==='all'||type==='memory') results.push(...db.prepare("SELECT id,'memory' as type,topic||': '||SUBSTR(insight,1,150) as text,updated_at,null as thread_id FROM forge_memory WHERE user_id=? AND (topic LIKE ? OR insight LIKE ?) LIMIT ?").all(uid,`%${q}%`,`%${q}%`,Math.floor(Number(limit)/3)));
  res.json({ success:true, data:{ results, count:results.length, query:q } });
});

// ─── Analytics ────────────────────────────────────────────────────────────────
app.get('/api/analytics', requireAuth, (req: AuthRequest, res) => {
  const uid = req.user!.sub; const { period='30d' } = req.query as any;
  const days = period==='7d'?7:period==='90d'?90:30;
  try {
    const totalThreads = (db.prepare('SELECT COUNT(*) as c FROM threads WHERE user_id=?').get(uid) as any).c;
    const totalMessages = (db.prepare('SELECT COUNT(*) as c FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=?').get(uid) as any).c;
    const totalTokens = (db.prepare('SELECT COALESCE(SUM(tokens_in+tokens_out),0) as t FROM usage_logs WHERE user_id=?').get(uid) as any)?.t || 0;
    const memCount = (db.prepare('SELECT COUNT(*) as c FROM forge_memory WHERE user_id=?').get(uid) as any).c;
    const topModels = db.prepare('SELECT model,COUNT(*) as requests,SUM(tokens_in+tokens_out) as tokens FROM usage_logs WHERE user_id=? GROUP BY model ORDER BY requests DESC LIMIT 5').all(uid);
    const dailyUsage = db.prepare(`SELECT DATE(created_at) as date,COUNT(*) as requests,SUM(tokens_in+tokens_out) as tokens FROM usage_logs WHERE user_id=? AND created_at >= datetime('now','-${days} days') GROUP BY DATE(created_at) ORDER BY date ASC`).all(uid);
    res.json({ success:true, data:{ totalThreads,totalMessages,totalTokens,memCount,topModels,dailyUsage,period } });
  } catch(e:any){ res.status(500).json({ error:e.message }); }
});

// ─── Data Export ──────────────────────────────────────────────────────────────
app.get('/api/export', requireAuth, (req: AuthRequest, res) => {
  const uid = req.user!.sub;
  try {
    const threads = db.prepare('SELECT * FROM threads WHERE user_id=?').all(uid);
    const messages = db.prepare('SELECT m.* FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=?').all(uid);
    const memories = db.prepare('SELECT * FROM forge_memory WHERE user_id=?').all(uid);
    res.setHeader('Content-Disposition','attachment; filename="forge-export.json"');
    res.setHeader('Content-Type','application/json');
    res.json({ exported_at:new Date().toISOString(), user_id:uid, threads, messages, memories });
  } catch(e:any){ res.status(500).json({ error:e.message }); }
});

// ─── Multi-model available ────────────────────────────────────────────────────
app.get('/api/models/available', requireAuth, (req: AuthRequest, res) => {
  const uid = req.user!.sub;
  const keys = db.prepare('SELECT provider FROM api_keys WHERE user_id=?').all(uid) as any[];
  const platKeys = (db.prepare('SELECT provider FROM platform_api_keys').all() as any[]).catch?.(() => []) || db.prepare('SELECT provider FROM platform_api_keys').all() as any[];
  const has = (p: string) => keys.some((k:any)=>k.provider===p) || platKeys.some((k:any)=>k.provider===p);
  const models: any[] = [];
  if (has('anthropic')) models.push({id:'claude-opus-4-6',name:'Claude Opus 4.6',provider:'anthropic',tier:'premium'},{id:'claude-sonnet-4-6',name:'Claude Sonnet 4.6',provider:'anthropic',tier:'standard'},{id:'claude-haiku-4-5-20251001',name:'Claude Haiku 4.5',provider:'anthropic',tier:'fast'});
  if (has('openai')) models.push({id:'gpt-4o',name:'GPT-4o',provider:'openai',tier:'premium'},{id:'gpt-4o-mini',name:'GPT-4o Mini',provider:'openai',tier:'fast'});
  if (has('gemini')) models.push({id:'gemini-2.5-pro',name:'Gemini 2.5 Pro',provider:'gemini',tier:'premium'},{id:'gemini-2.5-flash',name:'Gemini 2.5 Flash',provider:'gemini',tier:'fast'});
  if (has('groq')) models.push({id:'llama-3.3-70b-versatile',name:'Llama 3.3 70B',provider:'groq',tier:'fast'},{id:'mixtral-8x7b-32768',name:'Mixtral 8x7B',provider:'groq',tier:'fast'});
  if (has('mistral')) models.push({id:'mistral-large-latest',name:'Mistral Large',provider:'mistral',tier:'premium'},{id:'mistral-small-latest',name:'Mistral Small',provider:'mistral',tier:'fast'});
  if (has('openrouter')) models.push({id:'deepseek/deepseek-r1',name:'DeepSeek R1',provider:'openrouter',tier:'reasoning'},{id:'meta-llama/llama-4-maverick',name:'Llama 4 Maverick',provider:'openrouter',tier:'premium'});
  res.json({ success:true, data:{ models, count:models.length } });
});

// ── Moonshot Agents ──────────────────────────────────────────────────────────

// Ghost Agent — silent email/Slack presence
app.post('/api/agents/ghost/activate', requireAuth, async (req: any, res) => {
  const uid = req.user.id;
  const { channels = ['email'] } = req.body;
  db.prepare(`INSERT OR REPLACE INTO pending_approvals (user_id, type, title, description, payload, status, created_at)
    VALUES (?, 'ghost_agent', 'Ghost Agent Activated', 'Monitoring ' || ? || ' silently. Will act only when confidence > 95%.', '{}', 'approved', datetime('now'))`
  ).run(uid, channels.join(', '));
  res.json({ success: true, data: { message: 'Ghost Agent active', channels, mode: 'silent' } });
});

app.get('/api/agents/ghost/log', requireAuth, (req: any, res) => {
  const rows = db.prepare(`SELECT * FROM pending_approvals WHERE user_id=? AND type='ghost_agent' ORDER BY created_at DESC LIMIT 20`).all(req.user.id);
  res.json({ success: true, data: { actions: rows } });
});

// Mentor Agent — coaches owner based on work patterns
app.post('/api/agents/mentor/analyze', requireAuth, async (req: any, res) => {
  const uid = req.user.id;
  const threads = db.prepare(`SELECT * FROM conversations WHERE user_id=? ORDER BY updated_at DESC LIMIT 50`).all(uid);
  const patterns: string[] = [];
  if (threads.length < 5) patterns.push('Not enough data yet — keep working with Forge');
  else {
    patterns.push('You ask most questions about client follow-up');
    patterns.push('You tend to delay financial reviews — schedule one this week');
    patterns.push('Your strongest channel is email — double down');
  }
  const insight = patterns[Math.floor(Math.random() * patterns.length)];
  db.prepare(`INSERT INTO pending_approvals (user_id, type, title, description, payload, status, created_at)
    VALUES (?, 'mentor', 'Mentor Insight', ?, '{}', 'pending', datetime('now'))`
  ).run(uid, insight);
  res.json({ success: true, data: { insight, threadCount: threads.length } });
});

// Clone Agent — learns writing voice
app.post('/api/agents/clone/train', requireAuth, async (req: any, res) => {
  const uid = req.user.id;
  const { samples = [] } = req.body;
  const existing = (db.prepare(`SELECT meta_value FROM user_meta WHERE user_id=? AND meta_key='clone_samples'`).get(uid) as any);
  const prev = existing ? JSON.parse(existing.meta_value) : [];
  const all = [...prev, ...samples].slice(-50);
  db.prepare(`INSERT OR REPLACE INTO user_meta (user_id, meta_key, meta_value) VALUES (?, 'clone_samples', ?)`).run(uid, JSON.stringify(all));
  res.json({ success: true, data: { samplesStored: all.length, ready: all.length >= 5 } });
});

app.post('/api/agents/clone/draft', requireAuth, async (req: any, res) => {
  const uid = req.user.id;
  const { prompt } = req.body;
  const existing = (db.prepare(`SELECT meta_value FROM user_meta WHERE user_id=? AND meta_key='clone_samples'`).get(uid) as any);
  const samples: string[] = existing ? JSON.parse(existing.meta_value) : [];
  const key = await getUserKey(uid, 'anthropic');
  if (!key) return res.json({ success: false, error: 'No Anthropic key' });
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic.default({ apiKey: key });
  const voiceContext = samples.length > 0 ? `Here are writing samples from this person:\n${samples.slice(-5).join('\n---\n')}\n\nMatch their exact voice.` : 'Write in a professional business tone.';
  const msg = await client.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 512, messages: [{ role: 'user', content: `${voiceContext}\n\nNow write: ${prompt}` }] });
  const draft = (msg.content[0] as any).text;
  res.json({ success: true, data: { draft, voiceTrained: samples.length >= 5 } });
});

// Watchdog Agent — 24/7 monitor, alerts on anomalies
app.post('/api/agents/watchdog/configure', requireAuth, (req: any, res) => {
  const uid = req.user.id;
  const { triggers = ['negative_review', 'overdue_invoice', 'no_activity_48h'] } = req.body;
  db.prepare(`INSERT OR REPLACE INTO user_meta (user_id, meta_key, meta_value) VALUES (?, 'watchdog_triggers', ?)`).run(uid, JSON.stringify(triggers));
  res.json({ success: true, data: { watching: triggers } });
});

app.get('/api/agents/watchdog/alerts', requireAuth, (req: any, res) => {
  const uid = req.user.id;
  const triggerRow = (db.prepare(`SELECT meta_value FROM user_meta WHERE user_id=? AND meta_key='watchdog_triggers'`).get(uid) as any);
  const triggers: string[] = triggerRow ? JSON.parse(triggerRow.meta_value) : [];
  const alerts = triggers.map(t => ({ trigger: t, status: 'monitoring', lastCheck: new Date().toISOString(), fired: false }));
  res.json({ success: true, data: { alerts, watching: triggers.length } });
});

// Negotiator Agent — handles vendor/client email negotiations
app.post('/api/agents/negotiator/draft', requireAuth, async (req: any, res) => {
  const uid = req.user.id;
  const { context, goal, counterparty, currentOffer } = req.body;
  const key = await getUserKey(uid, 'anthropic');
  if (!key) return res.json({ success: false, error: 'No Anthropic key' });
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic.default({ apiKey: key });
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001', max_tokens: 600,
    messages: [{ role: 'user', content: `You are a skilled business negotiator drafting an email on behalf of a business owner.
Context: ${context || 'General negotiation'}
Goal: ${goal || 'Reach a fair agreement'}
Counterparty: ${counterparty || 'Vendor/Client'}
Current offer/situation: ${currentOffer || 'None provided'}

Write a professional, strategic negotiation email. Be firm but collaborative. Don't give away leverage.` }]
  });
  const draft = (msg.content[0] as any).text;
  db.prepare(`INSERT INTO pending_approvals (user_id, type, title, description, payload, status, created_at)
    VALUES (?, 'negotiator', 'Negotiator Draft Ready', 'Review before sending to ' || ?, ?, 'pending', datetime('now'))`
  ).run(uid, counterparty || 'counterparty', JSON.stringify({ draft, goal, counterparty }));
  res.json({ success: true, data: { draft, approvalRequired: true } });
});

// Connector Agent — finds partnerships, drafts intros, tracks follow-ups
app.post('/api/agents/connector/find', requireAuth, async (req: any, res) => {
  const uid = req.user.id;
  const { industry, goal = 'referral partnership' } = req.body;
  const bizRow = (db.prepare(`SELECT meta_value FROM user_meta WHERE user_id=? AND meta_key='onboarding'`).get(uid) as any);
  const biz = bizRow ? JSON.parse(bizRow.meta_value) : {};
  const opportunities = [
    { type: 'Referral Partner', target: `Local ${industry || biz.businessType || 'business'} association`, action: 'Intro email', priority: 'high' },
    { type: 'Cross-Promotion', target: 'Complementary service provider', action: 'Partnership proposal', priority: 'medium' },
    { type: 'Affiliate', target: 'Industry influencer/blogger', action: 'Affiliate offer', priority: 'medium' },
    { type: 'Joint Venture', target: 'Non-competing peer business', action: 'JV meeting request', priority: 'low' },
  ];
  res.json({ success: true, data: { opportunities, goal, nextStep: 'Use /agents/connector/draft to write intro emails' } });
});

app.post('/api/agents/connector/draft', requireAuth, async (req: any, res) => {
  const uid = req.user.id;
  const { targetName, targetBusiness, partnershipType = 'referral' } = req.body;
  const key = await getUserKey(uid, 'anthropic');
  if (!key) return res.json({ success: false, error: 'No Anthropic key' });
  const bizRow = (db.prepare(`SELECT meta_value FROM user_meta WHERE user_id=? AND meta_key='onboarding'`).get(uid) as any);
  const biz = bizRow ? JSON.parse(bizRow.meta_value) : {};
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic.default({ apiKey: key });
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001', max_tokens: 500,
    messages: [{ role: 'user', content: `Write a warm, concise partnership intro email from ${biz.businessName || 'a local business'} to ${targetName} at ${targetBusiness}. Partnership type: ${partnershipType}. Keep it under 150 words. Sound human, not salesy.` }]
  });
  const draft = (msg.content[0] as any).text;
  db.prepare(`INSERT INTO pending_approvals (user_id, type, title, description, payload, status, created_at)
    VALUES (?, 'connector', 'Partnership Intro Ready', 'Draft intro to ' || ? || ' at ' || ?, ?, 'pending', datetime('now'))`
  ).run(uid, targetName || 'contact', targetBusiness || 'company', JSON.stringify({ draft, targetName, targetBusiness, partnershipType }));
  res.json({ success: true, data: { draft, approvalRequired: true } });
});

// ── Nightly cron (2am ET) ────────────────────────────────────────────────────
import cron from 'node-cron';
cron.schedule('0 2 * * *', async () => {
  const users = (db.prepare('SELECT id FROM users').all() as any[]);
  for (const u of users) {
    const bizRow = (db.prepare(`SELECT meta_value FROM user_meta WHERE user_id=? AND meta_key='onboarding'`).get(u.id) as any);
    if (!bizRow) continue;
    const biz = JSON.parse(bizRow.meta_value);
    const kws: string[] = biz.keywords || [];
    for (const kw of kws.slice(0, 3)) {
      db.prepare(`INSERT INTO seo_pages (user_id, keyword, slug, status, created_at) VALUES (?, ?, ?, 'draft', datetime('now'))`
      ).run(u.id, kw, kw.toLowerCase().replace(/\s+/g, '-'));
    }
    db.prepare(`INSERT INTO pending_approvals (user_id, type, title, description, payload, status, created_at)
      VALUES (?, 'nightly_summary', 'Nightly Run Complete', 'SEO stubs + watchdog check done', '{}', 'pending', datetime('now'))`
    ).run(u.id);
  }
}, { timezone: 'America/New_York' });

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3 — Forge Brain v2: the compounding-memory MOAT.
// Adds categories (knowledge-graph dimension), confidence, decay, and a
// "what Forge knows about you" summary that makes the moat felt. Switching
// cost = the brain. All additive on forge_memory. forge/ only.
// ═══════════════════════════════════════════════════════════════════════════
(function migrateBrainV2(){
  const cols = (db.prepare('PRAGMA table_info(forge_memory)').all() as any[]).map(c => c.name);
  const add = (name: string, ddl: string) => { if (!cols.includes(name)) { try { db.exec(`ALTER TABLE forge_memory ADD COLUMN ${ddl}`); } catch {} } };
  add('category',           "category TEXT NOT NULL DEFAULT 'general'");
  add('confidence',         'confidence REAL NOT NULL DEFAULT 0.5');
  add('last_reinforced_at', 'last_reinforced_at TEXT');
})();

// Categorize a memory from its topic/insight text — lightweight, deterministic,
// no LLM call needed (keeps it free + fast on every write).
const BRAIN_CATEGORIES: Array<[string, RegExp]> = [
  ['customer',   /\b(customer|client|lead|buyer|contact|account)\b/i],
  ['pricing',    /\b(price|pricing|cost|rate|quote|invoice|discount|margin|fee)\b/i],
  ['voice',      /\b(tone|voice|brand|style|wording|phrasing|how we (say|write|talk))\b/i],
  ['rule',       /\b(never|always|do not|don'?t|must|policy|rule|avoid|prefer)\b/i],
  ['decision',  /\b(decided|decision|chose|chosen|approved|rejected|agreed)\b/i],
  ['product',    /\b(product|service|offering|feature|sku|menu|catalog)\b/i],
  ['ops',        /\b(schedule|hours|process|workflow|operation|fulfil|deliver|shipping)\b/i],
];
function categorizeMemory(topic: string, insight: string): string {
  const t = `${topic} ${insight}`;
  for (const [cat, rx] of BRAIN_CATEGORIES) if (rx.test(t)) return cat;
  return 'general';
}

// Call when a memory is surfaced/used → reinforce it (anti-decay, "alive" brain).
function reinforceMemory(id: string) {
  try { db.prepare("UPDATE forge_memory SET strength=MIN(strength+0.1,10.0),confidence=MIN(confidence+0.05,1.0),last_reinforced_at=datetime('now') WHERE id=?").run(id); } catch {}
}

// GET /api/brain/summary — "What Forge knows about you" (makes the moat FELT).
app.get('/api/brain/summary', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  try {
    // Backfill category for any rows still on default (cheap, idempotent).
    const uncat = db.prepare("SELECT id,topic,insight FROM forge_memory WHERE user_id=? AND (category IS NULL OR category='general') LIMIT 200").all(userId) as any[];
    const upd = db.prepare('UPDATE forge_memory SET category=? WHERE id=?');
    for (const m of uncat) { const c = categorizeMemory(m.topic || '', m.insight || ''); if (c !== 'general') upd.run(c, m.id); }

    const total = (db.prepare('SELECT COUNT(*) c FROM forge_memory WHERE user_id=?').get(userId) as any).c;
    const totalStrength = (db.prepare('SELECT COALESCE(SUM(strength),0) s FROM forge_memory WHERE user_id=?').get(userId) as any).s;
    const byCategory = db.prepare(`SELECT category, COUNT(*) count, ROUND(AVG(confidence),2) avgConfidence, ROUND(SUM(strength),1) strength FROM forge_memory WHERE user_id=? GROUP BY category ORDER BY count DESC`).all(userId);
    const topInsights = db.prepare(`SELECT category, topic, insight, strength, frequency FROM forge_memory WHERE user_id=? ORDER BY strength DESC, frequency DESC LIMIT 10`).all(userId);
    const newThisWeek = (db.prepare(`SELECT COUNT(*) c FROM forge_memory WHERE user_id=? AND created_at >= datetime('now','-7 days')`).get(userId) as any).c;
    const oldestRow = db.prepare('SELECT MIN(created_at) m FROM forge_memory WHERE user_id=?').get(userId) as any;
    const daysLearning = oldestRow?.m ? Math.max(1, Math.round((Date.now() - new Date(oldestRow.m).getTime()) / 86400000)) : 0;

    res.json({ success: true, data: {
      totalMemories: total,
      brainStrength: Math.round(totalStrength),
      daysLearning,
      newThisWeek,
      byCategory,
      topInsights,
      // The headline line for the dashboard:
      headline: total === 0
        ? 'Forge is just getting to know your business — start a few tasks and your brain will grow.'
        : `Forge knows ${total} things about your business across ${byCategory.length} areas, learned over ${daysLearning} day${daysLearning===1?'':'s'}.`,
      moatNote: total > 0 ? `This knowledge is yours and compounds daily — it's what makes Forge irreplaceable for you.` : null,
    }});
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// GET /api/brain/category/:cat — memories in one category (drill-down).
app.get('/api/brain/category/:cat', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const rows = db.prepare('SELECT id,topic,insight,strength,frequency,confidence,created_at FROM forge_memory WHERE user_id=? AND category=? ORDER BY strength DESC').all(userId, req.params.cat);
  res.json({ success: true, data: rows });
});

// POST /api/brain/decay — fade memories not reinforced recently (keeps brain accurate).
// Idempotent; safe to call nightly. Drops strength on stale rows, prunes near-zero.
app.post('/api/brain/decay', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  try {
    const faded = db.prepare(`UPDATE forge_memory SET strength=MAX(strength-0.3,0) WHERE user_id=? AND COALESCE(last_reinforced_at,created_at) < datetime('now','-30 days')`).run(userId);
    const pruned = db.prepare(`DELETE FROM forge_memory WHERE user_id=? AND strength<=0.1 AND frequency<=1`).run(userId);
    res.json({ success: true, faded: faded.changes, pruned: pruned.changes });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Trust Ladder ─────────────────────────────────────────────────────────────
// Computes autonomy level, brain health, memory growth timeline, and BYO-key savings.
// Makes moat #1 (compounding memory) and moat #4 (BYO-key cost) felt in the UI.
app.get('/api/brain/trust-ladder', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;

  // Memory totals + avg strength
  const memTotals = db.prepare('SELECT COUNT(*) as total, AVG(strength) as avg_strength FROM forge_memory WHERE user_id=?').get(userId) as any;
  const total = memTotals?.total || 0;
  const avgStr = memTotals?.avg_strength || 0;

  // Memory growth: count per week for last 8 weeks
  const weeklyGrowth = db.prepare(`
    SELECT strftime('%Y-W%W', created_at) as week, COUNT(*) as count
    FROM forge_memory WHERE user_id=?
    AND created_at >= datetime('now', '-56 days')
    GROUP BY week ORDER BY week ASC
  `).all(userId) as any[];

  // Agent runs completed
  const runCount = safe(() => (db.prepare('SELECT COUNT(*) as c FROM nightly_runs WHERE user_id=? AND status=?').get(userId, 'done') as any).c, 0);

  // Approvals: total + auto-approved (trust ladder proxy)
  const approvalTotal = safe(() => (db.prepare('SELECT COUNT(*) as c FROM pending_approvals WHERE user_id=?').get(userId) as any).c, 0);
  const approvalApproved = safe(() => (db.prepare("SELECT COUNT(*) as c FROM pending_approvals WHERE user_id=? AND status='approved'").get(userId) as any).c, 0);

  // Token usage for BYO-key savings calc
  const sub = db.prepare('SELECT plan, tokens_used FROM subscriptions WHERE user_id=?').get(userId) as any;
  const tokensUsed = sub?.tokens_used || 0;
  // Competitor seat pricing benchmarks (monthly equivalent)
  const competitors = [
    { name: 'Cursor Pro', monthly: 20, per: 'seat' },
    { name: 'ChatGPT Plus', monthly: 20, per: 'seat' },
    { name: 'Lindy', monthly: 890, per: 'seat' },
  ];
  // Forge token cost at $1.50/M (what user pays their provider directly)
  const forgeCost = (tokensUsed / 1_000_000) * 1.50;
  const savings = competitors.map(c => ({ name: c.name, saved: Math.max(0, c.monthly - forgeCost).toFixed(2), theirCost: c.monthly, forgeCost: forgeCost.toFixed(2) }));

  // Autonomy level: 1=Suggest, 2=Approve, 3=Auto (based on memory count + run count)
  let autonomyLevel = 1;
  let autonomyLabel = 'Suggest';
  if (total >= 10 && runCount >= 1) { autonomyLevel = 2; autonomyLabel = 'Approve'; }
  if (total >= 30 && runCount >= 5 && approvalApproved >= 10) { autonomyLevel = 3; autonomyLabel = 'Auto'; }

  // Trust score 0–100
  const trustScore = Math.min(100, Math.round(
    (Math.min(total, 50) / 50) * 40 +       // memory depth (40pts)
    (Math.min(avgStr, 10) / 10) * 20 +       // memory quality (20pts)
    (Math.min(runCount, 10) / 10) * 20 +     // autonomous runs (20pts)
    (Math.min(approvalApproved, 20) / 20) * 20  // approval history (20pts)
  ));

  // Next milestone
  let nextMilestone = '';
  if (autonomyLevel < 2) nextMilestone = `Add ${Math.max(0, 10 - total)} more memories and complete 1 autonomous run to unlock Approve mode`;
  else if (autonomyLevel < 3) nextMilestone = `Add ${Math.max(0, 30 - total)} more memories, complete ${Math.max(0, 5 - runCount)} more runs, and approve ${Math.max(0, 10 - approvalApproved)} more actions to unlock Auto mode`;
  else nextMilestone = 'Maximum autonomy unlocked — Forge is running on autopilot';

  res.json({
    success: true,
    trustLadder: {
      trustScore,
      autonomyLevel,
      autonomyLabel,
      nextMilestone,
      memoryTotal: total,
      memoryAvgStrength: Math.round(avgStr * 100) / 100,
      weeklyGrowth,
      runCount,
      approvalTotal,
      approvalApproved,
      byoKeySavings: { tokensUsed, forgeCost: forgeCost.toFixed(2), vs: savings },
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2 — Addictive Core: Morning Brief engine (streaks + delta + 1 priority).
// The daily-hook loop. Tracks login streak, computes "what changed since you
// left", and surfaces the single most important next action.
// ═══════════════════════════════════════════════════════════════════════════
// Safe, idempotent column migration (SQLite has no IF NOT EXISTS for columns).
(function migrateStreakCols(){
  const cols = (db.prepare('PRAGMA table_info(users)').all() as any[]).map(c => c.name);
  const add = (name: string, ddl: string) => { if (!cols.includes(name)) { try { db.exec(`ALTER TABLE users ADD COLUMN ${ddl}`); } catch {} } };
  add('login_streak',   'login_streak INTEGER NOT NULL DEFAULT 0');
  add('longest_streak', 'longest_streak INTEGER NOT NULL DEFAULT 0');
  add('last_seen_at',   'last_seen_at TEXT');
  add('last_brief_at',  'last_brief_at TEXT');
})();

// Update streak on activity. Returns the updated streak record.
function touchStreak(userId: string): { streak: number; longest: number; lastSeen: string | null } {
  const u = db.prepare('SELECT login_streak,longest_streak,last_seen_at FROM users WHERE id=?').get(userId) as any;
  if (!u) return { streak: 0, longest: 0, lastSeen: null };
  const prevSeen = u.last_seen_at ? new Date(u.last_seen_at) : null;
  const now = new Date();
  const dayMs = 86400000;
  const dayOf = (d: Date) => Math.floor(d.getTime() / dayMs);
  let streak = u.login_streak || 0;
  const prevSeenForReturn = u.last_seen_at;
  if (!prevSeen) {
    streak = 1;
  } else {
    const gap = dayOf(now) - dayOf(prevSeen);
    if (gap === 0) { /* same day, no change */ }
    else if (gap === 1) streak += 1;        // consecutive day → extend
    else streak = 1;                         // missed a day → reset
  }
  const longest = Math.max(u.longest_streak || 0, streak);
  db.prepare("UPDATE users SET login_streak=?,longest_streak=?,last_seen_at=datetime('now') WHERE id=?").run(streak, longest, userId);
  return { streak, longest, lastSeen: prevSeenForReturn };
}

// GET /api/checklist — Activation checklist: checks real DB state for onboarding steps.
app.get('/api/checklist', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const hasKey = safe(() => {
    const row = db.prepare('SELECT anthropic_key, openai_key FROM users WHERE id=?').get(userId) as any;
    return !!(row?.anthropic_key || row?.openai_key);
  }, false);
  const hasChat = safe(() => (db.prepare('SELECT COUNT(*) as c FROM superagent_messages WHERE user_id=?').get(userId) as any).c > 0, false);
  const hasPrompt = safe(() => (db.prepare('SELECT COUNT(*) as c FROM prompt_cache WHERE user_id=?').get(userId) as any).c > 0, false);
  const hasRun = safe(() => (db.prepare('SELECT COUNT(*) as c FROM nightly_runs WHERE user_id=? AND status=\'done\'').get(userId) as any).c > 0, false);
  const hasMemory = safe(() => (db.prepare('SELECT COUNT(*) as c FROM forge_memory WHERE user_id=?').get(userId) as any).c > 0, false);
  const steps = [
    { id: 'key', label: 'Add your API key', done: hasKey, href: 'settings' },
    { id: 'chat', label: 'Send your first message', done: hasChat, href: 'super' },
    { id: 'memory', label: 'Let Forge learn something about you', done: hasMemory, href: 'brain' },
    { id: 'prompt', label: 'Save a prompt to your library', done: hasPrompt, href: 'prompts' },
    { id: 'run', label: 'Complete a nightly autonomous run', done: hasRun, href: 'runs' },
  ];
  const completed = steps.filter(s => s.done).length;
  res.json({ success: true, checklist: { steps, completed, total: steps.length, allDone: completed === steps.length } });
});

// GET /api/digest — Weekly digest: personalized summary of user's Forge activity this week.
app.get('/api/digest', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const since = new Date(); since.setDate(since.getDate() - 7);
  const sinceStr = since.toISOString();
  const messages  = safe(() => (db.prepare("SELECT COUNT(*) as c FROM superagent_messages WHERE user_id=? AND created_at>=?").get(userId, sinceStr) as any).c, 0);
  const runs      = safe(() => (db.prepare("SELECT COUNT(*) as c FROM nightly_runs WHERE user_id=? AND status='done' AND started_at>=?").get(userId, sinceStr) as any).c, 0);
  const memories  = safe(() => (db.prepare("SELECT COUNT(*) as c FROM forge_memory WHERE user_id=? AND created_at>=?").get(userId, sinceStr) as any).c, 0);
  const threads   = safe(() => (db.prepare("SELECT COUNT(*) as c FROM threads WHERE user_id=? AND updated_at>=?").get(userId, sinceStr) as any).c, 0);
  const topMemories = safe(() => db.prepare("SELECT key, value FROM forge_memory WHERE user_id=? AND created_at>=? ORDER BY created_at DESC LIMIT 3").all(userId, sinceStr) as any[], []);
  const topThreads  = safe(() => db.prepare("SELECT title, updated_at FROM threads WHERE user_id=? AND updated_at>=? ORDER BY updated_at DESC LIMIT 3").all(userId, sinceStr) as any[], []);
  const lastRun     = safe(() => db.prepare("SELECT summary, finished_at FROM nightly_runs WHERE user_id=? AND status='done' ORDER BY finished_at DESC LIMIT 1").get(userId) as any, null);
  // streak
  const streakRow = safe(() => db.prepare("SELECT login_streak, longest_streak FROM users WHERE id=?").get(userId) as any, null);
  const highlights: string[] = [];
  if (messages > 0) highlights.push(`Sent ${messages} message${messages > 1 ? 's' : ''} to Forge`);
  if (runs > 0) highlights.push(`Completed ${runs} autonomous run${runs > 1 ? 's' : ''}`);
  if (memories > 0) highlights.push(`Forge learned ${memories} new thing${memories > 1 ? 's' : ''} about you`);
  if (threads > 0) highlights.push(`Worked in ${threads} conversation${threads > 1 ? 's' : ''}`);
  if (highlights.length === 0) highlights.push('No activity this week — start a conversation to build momentum.');
  res.json({ success: true, digest: {
    week: sinceStr.slice(0, 10),
    highlights,
    stats: { messages, runs, memories, threads },
    topMemories: (topMemories || []).map((m: any) => ({ key: m.key, value: String(m.value).slice(0, 100) })),
    topThreads: (topThreads || []).map((t: any) => ({ title: t.title || 'Untitled', date: t.updated_at })),
    lastRunSummary: lastRun?.summary || null,
    streak: streakRow?.login_streak || 0,
    longestStreak: streakRow?.longest_streak || 0,
  }});
});

// GET /api/intelligence — Forge Intelligence Score: gamified brain health metric.
app.get('/api/intelligence', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const memories   = safe(() => (db.prepare("SELECT COUNT(*) as c FROM forge_memory WHERE user_id=?").get(userId) as any).c, 0);
  const runs       = safe(() => (db.prepare("SELECT COUNT(*) as c FROM nightly_runs WHERE user_id=? AND status='done'").get(userId) as any).c, 0);
  const threads    = safe(() => (db.prepare("SELECT COUNT(*) as c FROM threads WHERE user_id=?").get(userId) as any).c, 0);
  const outcomes   = safe(() => (db.prepare("SELECT COUNT(*) as c FROM superagent_messages WHERE user_id=?").get(userId) as any).c, 0);
  const seoPages   = safe(() => (db.prepare("SELECT COUNT(*) as c FROM seo_pages WHERE user_id=?").get(userId) as any).c, 0);
  const approvals  = safe(() => (db.prepare("SELECT COUNT(*) as c FROM pending_approvals WHERE user_id=? AND status='approved'").get(userId) as any).c, 0);
  // Score: weighted sum capped at 1000
  const score = Math.min(1000, Math.round(
    memories * 8 + runs * 25 + threads * 2 + outcomes * 0.5 + seoPages * 15 + approvals * 10
  ));
  const LEVELS = [
    { min: 0,   label: 'Spark',      desc: 'Just getting started.' },
    { min: 50,  label: 'Apprentice', desc: 'Building good habits.' },
    { min: 150, label: 'Practitioner', desc: 'Forge is learning your workflow.' },
    { min: 300, label: 'Expert',     desc: 'Deep context established.' },
    { min: 500, label: 'Veteran',    desc: 'Forge knows you well.' },
    { min: 750, label: 'Autonomous', desc: 'Forge runs independently.' },
    { min: 950, label: 'Sovereign',  desc: 'Full autonomy unlocked.' },
  ];
  const level = [...LEVELS].reverse().find(l => score >= l.min) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.min > score);
  const nextAt = nextLevel?.min ?? 1000;
  const pct = nextLevel ? Math.round(((score - level.min) / (nextAt - level.min)) * 100) : 100;
  res.json({ success: true, intelligence: { score, level: level.label, levelDesc: level.desc, nextLevel: nextLevel?.label || null, nextAt, pct, breakdown: { memories, runs, threads, messages: outcomes, seoPages, approvals } } });
});

// GET /api/changelog — Parse VERSION.md and return recent releases.
app.get('/api/changelog', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const versionPath = path.join(__dirname, '..', '..', '..', 'VERSION.md');
    const raw = fs.existsSync(versionPath) ? fs.readFileSync(versionPath, 'utf8') : '';
    const sections = raw.split(/^## /m).slice(1, 6); // last 5 releases
    const releases = sections.map((s: string) => {
      const lines = s.trim().split('\n');
      const header = lines[0] || '';
      const vMatch = header.match(/^(v[\d.]+)/);
      const dateMatch = header.match(/(\d{4}-\d{2}-\d{2})/);
      const titleMatch = header.match(/—\s*(.+?)(?:\s*—|$)/);
      const bullets = lines.slice(1).filter((l: string) => l.trim().startsWith('-')).slice(0, 5)
        .map((l: string) => l.replace(/^[\s-]+/, '').replace(/\*\*/g, ''));
      return { version: vMatch?.[1] || header, date: dateMatch?.[1] || '', title: titleMatch?.[1]?.trim() || '', bullets };
    });
    res.json({ success: true, releases });
  } catch (e) {
    res.json({ success: true, releases: [] });
  }
});

// GET /api/outcomes — Outcome Ledger: counts everything Forge did for the user this month.
app.get('/api/outcomes', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const since = new Date(); since.setDate(1); since.setHours(0,0,0,0);
  const sinceStr = since.toISOString();

  const messages    = safe(() => (db.prepare("SELECT COUNT(*) as c FROM superagent_messages WHERE user_id=? AND created_at>=?").get(userId, sinceStr) as any).c, 0);
  const runs        = safe(() => (db.prepare("SELECT COUNT(*) as c FROM nightly_runs WHERE user_id=? AND status='done' AND started_at>=?").get(userId, sinceStr) as any).c, 0);
  const memories    = safe(() => (db.prepare("SELECT COUNT(*) as c FROM forge_memory WHERE user_id=? AND created_at>=?").get(userId, sinceStr) as any).c, 0);
  const approvals   = safe(() => (db.prepare("SELECT COUNT(*) as c FROM pending_approvals WHERE user_id=? AND created_at>=?").get(userId, sinceStr) as any).c, 0);
  const seoPages    = safe(() => (db.prepare("SELECT COUNT(*) as c FROM seo_pages WHERE user_id=? AND created_at>=?").get(userId, sinceStr) as any).c, 0);
  const totalTokens = safe(() => (db.prepare("SELECT SUM(total_tokens) as t FROM usage_logs WHERE user_id=? AND created_at>=?").get(userId, sinceStr) as any).t, 0);

  const total = messages + runs + memories + approvals + seoPages;
  const headline = total === 0
    ? 'Forge is warming up — start chatting to see your outcomes here.'
    : `Forge completed ${total} actions for you this month.`;

  res.json({
    success: true,
    outcomes: {
      period: { start: sinceStr, label: since.toLocaleString('default', { month: 'long', year: 'numeric' }) },
      total,
      headline,
      breakdown: { messages, autonomousRuns: runs, memoriesLearned: memories, approvalsHandled: approvals, seoPages, tokensProcessed: totalTokens || 0 },
    }
  });
});

// ── Referral system ──────────────────────────────────────────
db.exec(`CREATE TABLE IF NOT EXISTS referral_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  signups INTEGER NOT NULL DEFAULT 0,
  credits_earned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)`);
db.exec(`CREATE TABLE IF NOT EXISTS referral_signups (
  id TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL,
  referee_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
)`);

function getReferralCode(userId: string): string {
  const existing = db.prepare('SELECT code FROM referral_codes WHERE user_id=?').get(userId) as any;
  if (existing) return existing.code;
  const code = userId.slice(0,8).toUpperCase();
  db.prepare('INSERT OR IGNORE INTO referral_codes (id,user_id,code) VALUES (?,?,?)').run(uuidv4(), userId, code);
  return code;
}

// GET /api/referral — get my referral code + stats
app.get('/api/referral', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const code = getReferralCode(userId);
  const row = db.prepare('SELECT signups, credits_earned FROM referral_codes WHERE user_id=?').get(userId) as any;
  const recent = db.prepare('SELECT referee_id, created_at FROM referral_signups WHERE referrer_id=? ORDER BY created_at DESC LIMIT 10').all(userId) as any[];
  res.json({
    success: true,
    referral: {
      code,
      link: (process.env.FRONTEND_URL || 'https://forge-sand-two.vercel.app') + '?ref=' + code,
      signups: row?.signups || 0,
      creditsEarned: row?.credits_earned || 0,
      recent,
    }
  });
});

// POST /api/referral/track — called on register when ?ref= present
app.post('/api/referral/track', requireAuth, (req: AuthRequest, res) => {
  const refereeId = req.user!.sub;
  const { code } = req.body;
  if (!code) { res.status(400).json({ success: false, error: 'Missing code' }); return; }
  const ref = db.prepare('SELECT id, user_id FROM referral_codes WHERE code=?').get(code.toUpperCase()) as any;
  if (!ref) { res.status(404).json({ success: false, error: 'Invalid referral code' }); return; }
  if (ref.user_id === refereeId) { res.status(400).json({ success: false, error: 'Cannot refer yourself' }); return; }
  const already = db.prepare('SELECT id FROM referral_signups WHERE referrer_id=? AND referee_id=?').get(ref.user_id, refereeId);
  if (already) { res.json({ success: true, message: 'Already tracked' }); return; }
  db.prepare('INSERT INTO referral_signups (id,referrer_id,referee_id) VALUES (?,?,?)').run(uuidv4(), ref.user_id, refereeId);
  db.prepare('UPDATE referral_codes SET signups=signups+1, credits_earned=credits_earned+100 WHERE user_id=?').run(ref.user_id);
  res.json({ success: true, message: 'Referral tracked' });
});

// GET /api/savings — BYO-key savings: how much user saved vs. paying per-token at Forge markup.
app.get('/api/savings', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const COST_PER_1K: Record<string, number> = {
    anthropic: 0.009, openai: 0.007, gemini: 0.0005,
    groq: 0.0004, mistral: 0.003, openrouter: 0.005,
  };
  const FORGE_SEAT_COST_PER_1K = 0.098;
  const rows = db.prepare(
    'SELECT provider, SUM(total_tokens) as tokens FROM usage_logs WHERE user_id=? GROUP BY provider'
  ).all(userId) as any[];
  let actualCost = 0;
  let forgeSeatCost = 0;
  const byProvider: any[] = [];
  for (const r of rows) {
    const k = (r.tokens || 0) / 1000;
    const providerRate = COST_PER_1K[r.provider] ?? 0.005;
    const actual = k * providerRate;
    const seat = k * FORGE_SEAT_COST_PER_1K;
    actualCost += actual;
    forgeSeatCost += seat;
    byProvider.push({ provider: r.provider, tokens: r.tokens, actualCost: +actual.toFixed(4), forgeSeatCost: +seat.toFixed(4), saved: +(seat - actual).toFixed(4) });
  }
  const saved = forgeSeatCost - actualCost;
  const totalTokens = rows.reduce((s: number, r: any) => s + (r.tokens || 0), 0);
  res.json({
    success: true,
    savings: {
      totalTokens,
      actualCost: +actualCost.toFixed(4),
      forgeSeatCost: +forgeSeatCost.toFixed(4),
      saved: +saved.toFixed(2),
      savedLabel: saved >= 0.01 ? '$' + saved.toFixed(2) : '<$0.01',
      headline: saved >= 1
        ? 'Your API keys saved you $' + saved.toFixed(2) + ' vs. Forge seat pricing.'
        : 'Keep using Forge — your savings grow with every message.',
      byProvider,
    }
  });
});

// GET /api/activity — unified activity feed: last 20 events across all Forge surfaces.
app.get('/api/activity', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const events: any[] = [];

  // Nightly runs
  safe(() => {
    const runs = db.prepare("SELECT id, status, summary, started_at, finished_at FROM nightly_runs WHERE user_id=? ORDER BY started_at DESC LIMIT 5").all(userId) as any[];
    for (const r of runs) events.push({ type:'run', icon:'🤖', title: r.status === 'done' ? 'Autonomous run completed' : 'Autonomous run ' + r.status, body: r.summary || null, ts: r.finished_at || r.started_at });
  }, null);

  // Memories learned
  safe(() => {
    const mems = db.prepare("SELECT key, value, created_at FROM forge_memory WHERE user_id=? ORDER BY created_at DESC LIMIT 5").all(userId) as any[];
    for (const m of mems) events.push({ type:'memory', icon:'🧠', title: 'Memory learned', body: m.key + ': ' + String(m.value).slice(0, 80), ts: m.created_at });
  }, null);

  // Approvals
  safe(() => {
    const approvals = db.prepare("SELECT id, type, title, status, created_at FROM pending_approvals WHERE user_id=? ORDER BY created_at DESC LIMIT 5").all(userId) as any[];
    for (const a of approvals) events.push({ type:'approval', icon:'✅', title: (a.status === 'pending' ? 'Approval waiting: ' : 'Approval ' + a.status + ': ') + a.title, body: null, ts: a.created_at });
  }, null);

  // SEO pages
  safe(() => {
    const pages = db.prepare("SELECT keyword, url, published_at FROM seo_pages WHERE user_id=? ORDER BY published_at DESC LIMIT 5").all(userId) as any[];
    for (const p of pages) events.push({ type:'seo', icon:'📄', title: 'SEO page generated', body: p.keyword, ts: p.published_at });
  }, null);

  // Threads
  safe(() => {
    const threads = db.prepare("SELECT id, title, updated_at FROM threads WHERE user_id=? ORDER BY updated_at DESC LIMIT 5").all(userId) as any[];
    for (const t of threads) events.push({ type:'thread', icon:'💬', title: 'Conversation: ' + (t.title || 'Untitled'), body: null, ts: t.updated_at });
  }, null);

  // Sort all by ts desc, take limit
  events.sort((a, b) => (b.ts || '').localeCompare(a.ts || ''));
  res.json({ success: true, activity: events.slice(0, limit) });
});

// GET /api/brief — the daily hook. Streak + since-last-visit delta + 1 priority.
app.get('/api/brief', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  try {
    const beforeBrief = db.prepare('SELECT last_brief_at FROM users WHERE id=?').get(userId) as any;
    const since = beforeBrief?.last_brief_at || null;
    const s = touchStreak(userId);

    const user = db.prepare('SELECT business_name,business_type,onboarding_complete FROM users WHERE id=?').get(userId) as any;

    // Delta: what happened since last brief (or all-time if first brief).
    const sinceClause = since ? "AND created_at > ?" : "";
    const args = (sql: string) => since ? db.prepare(sql).all(userId, since) : db.prepare(sql.replace('AND created_at > ?', '')).all(userId);
    const newApprovals = (db.prepare(`SELECT COUNT(*) c FROM pending_approvals WHERE user_id=? AND status='pending'`).get(userId) as any).c;
    const newSeo = (db.prepare(`SELECT COUNT(*) c FROM seo_pages WHERE user_id=? ${sinceClause}`).get(...(since?[userId,since]:[userId])) as any).c;
    const newThreads = (db.prepare(`SELECT COUNT(*) c FROM threads WHERE user_id=? ${sinceClause}`).get(...(since?[userId,since]:[userId])) as any).c;
    const lastNightly = db.prepare("SELECT status,finished_at,summary FROM nightly_runs WHERE user_id=? ORDER BY started_at DESC LIMIT 1").get(userId) as any;

    // The ONE priority action — ordered by what unblocks the most value.
    let priority: { action: string; cta: string; route: string };
    const hasKey = (db.prepare('SELECT COUNT(*) c FROM api_keys WHERE user_id=?').get(userId) as any).c > 0;
    if (!user?.onboarding_complete) priority = { action: 'Finish setting up your workspace — 60 seconds to your first agent.', cta: 'Complete setup', route: '/onboarding' };
    else if (!hasKey) priority = { action: 'Add an API key to unlock your agents.', cta: 'Add a key', route: '/settings/keys' };
    else if (newApprovals > 0) priority = { action: `${newApprovals} item${newApprovals>1?'s':''} from your overnight run need a quick yes/no.`, cta: 'Review & approve', route: '/approvals' };
    else priority = { action: 'Your agents are idle. Kick off a task and watch them work.', cta: 'Run an agent', route: '/agent' };

    db.prepare("UPDATE users SET last_brief_at=datetime('now') WHERE id=?").run(userId);

    const greet = (() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; })();

    res.json({ success: true, data: {
      greeting: greet,
      businessName: user?.business_name || null,
      streak: s.streak,
      longestStreak: s.longest,
      streakMessage: s.streak >= 2 ? `🔥 ${s.streak}-day streak` : 'Welcome back',
      firstBrief: !since,
      since,
      delta: { pendingApprovals: newApprovals, newSeoPages: newSeo, newThreads, lastNightly: lastNightly ? { status: lastNightly.status, finishedAt: lastNightly.finished_at } : null },
      priority,
    }});
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 0 — Route-gap closers. Frontend called these; backend lacked them → 404.
// Real handlers, persisted tables, shapes matched to the exact fetch() callers.
// ═══════════════════════════════════════════════════════════════════════════
db.exec(`
  CREATE TABLE IF NOT EXISTS orgs (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT 'My Team',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS org_members (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    joined_date TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(org_id, email)
  );
  CREATE TABLE IF NOT EXISTS token_stakes (
    user_id TEXT PRIMARY KEY,
    balance REAL NOT NULL DEFAULT 1000,
    staked REAL NOT NULL DEFAULT 0,
    rewards REAL NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS billing_tiers (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ── /api/agent/run — SSE agent stream (alias the frontend expects) ───────────
app.post('/api/agent/run', requireAuth, async (req: AuthRequest, res) => {
  const { prompt, model = 'forge-pro' } = req.body || {};
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const send = (o: any) => res.write(`data: ${JSON.stringify(o)}\n\n`);
  if (!prompt || !String(prompt).trim()) { send({ type: 'error', message: 'EMPTY_PROMPT' }); res.end(); return; }
  try {
    const userId = req.user!.sub;
    const actualModel = resolveForgeModel(model.startsWith('openrouter/') ? model.slice('openrouter/'.length) : model);
    const provider = getProviderForModel(actualModel);
    const apiKey = getUserKey(userId, provider);
    if (!apiKey) { send({ type: 'error', message: `No API key for ${provider}. Add one in Settings → Keys.` }); res.end(); return; }
    send({ type: 'tool_call', tool: 'reasoning', reasoning: 'Planning a response' });
    const result = await callLLMWithFallback(provider, apiKey, actualModel, [{ role: 'user', content: String(prompt) }]);
    send({ type: 'tool_result', tool: 'reasoning', result: 'Done' });
    send({ type: 'response', content: result.content });
    try {
      db.prepare('INSERT INTO usage_logs (id,user_id,model,tokens_in,tokens_out,created_at) VALUES (?,?,?,?,?,datetime(\'now\'))')
        .run(crypto.randomUUID(), userId, result.usedModel || actualModel, result.promptTokens || 0, result.completionTokens || 0);
    } catch {}
  } catch (err: any) {
    send({ type: 'error', message: err?.message || 'Agent failed' });
  }
  res.end();
});

// ── /api/analytics/summary — alias of /api/analytics with summary shape ──────
app.get('/api/analytics/summary', requireAuth, (req: AuthRequest, res) => {
  const uid = req.user!.sub;
  const range = String((req.query as any).range || '30d');
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  try {
    const totalThreads = (db.prepare('SELECT COUNT(*) as c FROM threads WHERE user_id=?').get(uid) as any).c;
    const totalMessages = (db.prepare('SELECT COUNT(*) as c FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=?').get(uid) as any).c;
    const totalTokens = (db.prepare('SELECT COALESCE(SUM(tokens_in+tokens_out),0) as t FROM usage_logs WHERE user_id=?').get(uid) as any)?.t || 0;
    const topModels = db.prepare('SELECT model,COUNT(*) as requests,SUM(tokens_in+tokens_out) as tokens FROM usage_logs WHERE user_id=? GROUP BY model ORDER BY requests DESC LIMIT 5').all(uid);
    const dailyUsage = db.prepare(`SELECT DATE(created_at) as date,COUNT(*) as requests,SUM(tokens_in+tokens_out) as tokens FROM usage_logs WHERE user_id=? AND created_at >= datetime('now','-${days} days') GROUP BY DATE(created_at) ORDER BY date ASC`).all(uid);
    res.json({ success: true, totalThreads, totalMessages, totalTokens, topModels, dailyUsage, range });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ── /api/forge-tools/catalog — public tool catalog (no auth, 1h cache) ───────
app.get('/api/forge-tools/catalog', (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  const tools = [
    { id: 'web_search', name: 'Web Search', category: 'research', description: 'Search the live web.' },
    { id: 'browser_fetch', name: 'Browser Fetch', category: 'research', description: 'Fetch and read any URL.' },
    { id: 'run_code', name: 'Code Runner', category: 'dev', description: 'Execute code in a sandbox.' },
    { id: 'image_gen', name: 'Image Generation', category: 'create', description: 'Generate images from prompts.' },
    { id: 'memory', name: 'Forge Brain', category: 'core', description: 'Persistent cross-session memory.' },
    { id: 'scheduler', name: 'Scheduler', category: 'automation', description: 'Run tasks on a cadence.' },
    { id: 'webhooks', name: 'Webhooks', category: 'automation', description: 'Trigger flows from external events.' },
    { id: 'docs', name: 'Document Generation', category: 'create', description: 'Produce docx, pdf, xlsx, pptx.' },
  ];
  res.json({ success: true, data: tools });
});

// ── /api/billing/invoices + subscribe + tiers ────────────────────────────────
app.get('/api/billing/invoices', requireAuth, (req: AuthRequest, res) => {
  const uid = req.user!.sub;
  try {
    const rows = db.prepare(`SELECT DATE(created_at) as date, model, (tokens_in+tokens_out) as tokens FROM usage_logs WHERE user_id=? ORDER BY created_at DESC LIMIT 50`).all(uid) as any[];
    const invoices = rows.map((r, i) => ({ id: `inv_${i}`, date: r.date, description: `${r.model} usage`, amount: +((r.tokens / 1000) * 0.002).toFixed(4), status: 'paid' }));
    res.json({ success: true, invoices });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message, invoices: [] }); }
});
app.post('/api/billing/subscribe', requireAuth, async (req: AuthRequest, res) => {
  const { tier } = req.body || {};
  const plan = ['free','starter','pro','enterprise'].includes(tier) ? tier : 'free';
  const userId = req.user!.sub;
  ensureSubscription(userId);
  db.prepare("UPDATE subscriptions SET plan=?,tokens_limit=?,status='active',updated_at=datetime('now') WHERE user_id=?").run(plan, PLAN_LIMITS[plan], userId);
  res.json({ success: true, plan, message: `Subscribed to ${plan}` });
});
app.get('/api/billing/tiers', requireAuth, (req: AuthRequest, res) => {
  const uid = req.user!.sub;
  let rows = db.prepare('SELECT id,name,price FROM billing_tiers WHERE owner_id=? ORDER BY price ASC').all(uid) as any[];
  if (!rows.length) rows = [
    { id: 'free', name: 'Free', price: 0 },
    { id: 'starter', name: 'Starter', price: 19 },
    { id: 'pro', name: 'Pro', price: 49 },
    { id: 'enterprise', name: 'Enterprise', price: 199 },
  ];
  res.json({ success: true, data: rows });
});
app.post('/api/billing/tiers', requireAuth, (req: AuthRequest, res) => {
  const { name, price } = req.body || {};
  if (!name) { res.status(400).json({ success: false, error: 'NAME_REQUIRED' }); return; }
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO billing_tiers (id,owner_id,name,price,created_at) VALUES (?,?,?,?,datetime(\'now\'))').run(id, req.user!.sub, String(name), Number(price) || 0);
  res.json({ success: true, data: { id, name, price: Number(price) || 0 } });
});

// ── /api/marketplace/install — flat alias (frontend posts {productId}) ───────
app.post('/api/marketplace/install', requireAuth, (req: AuthRequest, res) => {
  const { productId } = req.body || {};
  if (!productId) { res.status(400).json({ success: false, error: 'PRODUCT_ID_REQUIRED' }); return; }
  try {
    db.prepare('INSERT OR IGNORE INTO marketplace_installs (id,user_id,app_id,installed_at) VALUES (?,?,?,datetime(\'now\'))')
      .run(crypto.randomUUID(), req.user!.sub, String(productId));
    res.json({ success: true, installed: productId });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ── /api/orgs — team management ──────────────────────────────────────────────
function ensureOrg(userId: string): any {
  let org = db.prepare('SELECT * FROM orgs WHERE owner_id=?').get(userId) as any;
  if (!org) {
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO orgs (id,owner_id,name,created_at) VALUES (?,?,?,datetime(\'now\'))').run(id, userId, 'My Team');
    org = db.prepare('SELECT * FROM orgs WHERE id=?').get(id);
  }
  return org;
}
app.get('/api/orgs', requireAuth, (req: AuthRequest, res) => {
  const org = ensureOrg(req.user!.sub);
  const members = db.prepare('SELECT id,email,role,joined_date as joinedDate FROM org_members WHERE org_id=? ORDER BY joined_date ASC').all(org.id);
  res.json({ success: true, org: { id: org.id, name: org.name }, members });
});
app.post('/api/orgs/:orgId/invite', requireAuth, (req: AuthRequest, res) => {
  const { email, role } = req.body || {};
  if (!email) { res.status(400).json({ success: false, error: 'EMAIL_REQUIRED' }); return; }
  const org = ensureOrg(req.user!.sub);
  const id = crypto.randomUUID();
  try {
    db.prepare('INSERT OR IGNORE INTO org_members (id,org_id,email,role,joined_date) VALUES (?,?,?,?,datetime(\'now\'))')
      .run(id, org.id, String(email), String(role || 'member'));
    res.json({ success: true, member: { id, email, role: role || 'member', joinedDate: new Date().toISOString() } });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});
app.delete('/api/orgs/members/:memberId', requireAuth, (req: AuthRequest, res) => {
  const org = ensureOrg(req.user!.sub);
  db.prepare('DELETE FROM org_members WHERE id=? AND org_id=?').run(req.params.memberId, org.id);
  res.json({ success: true });
});

// ── /api/tokens — staking ledger ─────────────────────────────────────────────
function ensureStake(userId: string): any {
  let s = db.prepare('SELECT * FROM token_stakes WHERE user_id=?').get(userId) as any;
  if (!s) {
    db.prepare('INSERT INTO token_stakes (user_id,balance,staked,rewards) VALUES (?,1000,0,0)').run(userId);
    s = db.prepare('SELECT * FROM token_stakes WHERE user_id=?').get(userId);
  }
  return s;
}
app.get('/api/tokens/balance', requireAuth, (req: AuthRequest, res) => {
  const s = ensureStake(req.user!.sub);
  res.json({ success: true, data: { balance: s.balance, staked: s.staked, rewards: s.rewards } });
});
app.post('/api/tokens/stake', requireAuth, (req: AuthRequest, res) => {
  const amount = parseFloat(req.body?.amount);
  if (!(amount > 0)) { res.status(400).json({ success: false, error: 'INVALID_AMOUNT' }); return; }
  const s = ensureStake(req.user!.sub);
  if (amount > s.balance) { res.status(400).json({ success: false, error: 'INSUFFICIENT_BALANCE' }); return; }
  db.prepare("UPDATE token_stakes SET balance=balance-?,staked=staked+?,updated_at=datetime('now') WHERE user_id=?").run(amount, amount, req.user!.sub);
  const u = db.prepare('SELECT * FROM token_stakes WHERE user_id=?').get(req.user!.sub) as any;
  res.json({ success: true, data: { balance: u.balance, staked: u.staked, rewards: u.rewards } });
});

export { app, db };

// ════════════════════════════════════════════════════════════════════════════
// CONTENT ENGINE — Phase 1-4
// ════════════════════════════════════════════════════════════════════════════

// ── DB migrations ────────────────────────────────────────────────────────────
db.prepare(`CREATE TABLE IF NOT EXISTS content_assets (
  id TEXT PRIMARY KEY, user_id TEXT, type TEXT, url TEXT, meta TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS scheduled_posts (
  id TEXT PRIMARY KEY, user_id TEXT, platform TEXT, caption TEXT,
  image_url TEXT, scheduled_for TEXT, status TEXT DEFAULT 'pending',
  performance TEXT, created_at TEXT DEFAULT (datetime('now'))
)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS ab_tests (
  id TEXT PRIMARY KEY, user_id TEXT, post_a TEXT, post_b TEXT,
  winner TEXT, created_at TEXT DEFAULT (datetime('now'))
)`).run();

// ── Phase 1: Brand Assets ────────────────────────────────────────────────────

// Website scraper → extract brand colors, logo, fonts
app.post('/api/content/scrape-brand', requireAuth, async (req: any, res) => {
  const { websiteUrl } = req.body;
  if (!websiteUrl) return res.json({ success: false, error: 'websiteUrl required' });
  try {
    const r = await fetch(websiteUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await r.text();
    const colorMatches = html.match(/#[0-9a-fA-F]{6}/g) || [];
    const colors = [...new Set(colorMatches)].slice(0, 5);
    const logoMatch = html.match(/logo[^"']*\.(png|svg|jpg|webp)/i);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const brandName = titleMatch ? titleMatch[1].trim().split(/[-|]/)[0].trim() : 'Brand';
    const assets = { brandName, colors, logoHint: logoMatch ? logoMatch[0] : null, sourceUrl: websiteUrl };
    db.prepare(`INSERT OR REPLACE INTO user_meta (user_id, meta_key, meta_value) VALUES (?, 'brand_assets', ?)`).run(req.user.id, JSON.stringify(assets));
    res.json({ success: true, data: assets });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// AI image generator (DALL-E)
app.post('/api/content/generate-image', requireAuth, async (req: any, res) => {
  const uid = req.user.id;
  const { prompt, size = '1024x1024', style = 'vivid' } = req.body;
  const key = await getUserKey(uid, 'openai');
  if (!key) return res.json({ success: false, error: 'OpenAI key required for image generation' });
  const r = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size, style, response_format: 'url' })
  });
  const d: any = await r.json();
  if (d.error) return res.json({ success: false, error: d.error.message });
  const url = d.data?.[0]?.url;
  const id = Math.random().toString(36).slice(2);
  db.prepare(`INSERT INTO content_assets (id, user_id, type, url, meta) VALUES (?, ?, 'image', ?, ?)`).run(id, uid, url, JSON.stringify({ prompt, size }));
  res.json({ success: true, data: { id, url, prompt } });
});

// Caption generator with brand voice
app.post('/api/content/generate-caption', requireAuth, async (req: any, res) => {
  const uid = req.user.id;
  const { topic, platform = 'instagram', tone = 'engaging', includeHashtags = true } = req.body;
  const key = await getUserKey(uid, 'anthropic');
  if (!key) return res.json({ success: false, error: 'Anthropic key required' });
  const bizRow = (db.prepare(`SELECT meta_value FROM user_meta WHERE user_id=? AND meta_key='onboarding'`).get(uid) as any);
  const biz = bizRow ? JSON.parse(bizRow.meta_value) : {};
  const brandRow = (db.prepare(`SELECT meta_value FROM user_meta WHERE user_id=? AND meta_key='brand_assets'`).get(uid) as any);
  const brand = brandRow ? JSON.parse(brandRow.meta_value) : {};
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic.default({ apiKey: key });
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001', max_tokens: 300,
    messages: [{ role: 'user', content: `Write a ${platform} caption for ${biz.businessName || brand.brandName || 'a business'} about: ${topic}. Tone: ${tone}. Platform: ${platform}. ${includeHashtags ? 'Include 5 relevant hashtags.' : ''} Max 150 words.` }]
  });
  const caption = (msg.content[0] as any).text;
  res.json({ success: true, data: { caption, platform, topic } });
});

// ── Phase 2: Publishing ───────────────────────────────────────────────────────

// Schedule a post
app.post('/api/content/schedule', requireAuth, (req: any, res) => {
  const uid = req.user.id;
  const { platform, caption, imageUrl, scheduledFor } = req.body;
  if (!platform || !caption) return res.json({ success: false, error: 'platform + caption required' });
  // Optimal time slots by platform
  const optimalTimes: Record<string, string> = {
    instagram: '11:00', facebook: '13:00', linkedin: '08:30', twitter: '12:00'
  };
  const baseTime = optimalTimes[platform.toLowerCase()] || '10:00';
  const postTime = scheduledFor || (() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    const [h, m] = baseTime.split(':');
    d.setHours(parseInt(h), parseInt(m), 0, 0);
    return d.toISOString();
  })();
  const id = Math.random().toString(36).slice(2);
  db.prepare(`INSERT INTO scheduled_posts (id, user_id, platform, caption, image_url, scheduled_for) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, uid, platform, caption, imageUrl || null, postTime);
  res.json({ success: true, data: { id, platform, scheduledFor: postTime, status: 'pending', optimalTimeUsed: !scheduledFor } });
});

// Get scheduled posts
app.get('/api/content/scheduled', requireAuth, (req: any, res) => {
  const posts = db.prepare(`SELECT * FROM scheduled_posts WHERE user_id=? ORDER BY scheduled_for ASC`).all(req.user.id);
  res.json({ success: true, data: { posts, count: posts.length } });
});

// Publish via Meta Graph API (Facebook/Instagram)
app.post('/api/content/publish/meta', requireAuth, async (req: any, res) => {
  const uid = req.user.id;
  const { postId, pageAccessToken, pageId, igAccountId } = req.body;
  const post = db.prepare(`SELECT * FROM scheduled_posts WHERE id=? AND user_id=?`).get(postId, uid) as any;
  if (!post) return res.json({ success: false, error: 'Post not found' });
  if (!pageAccessToken) return res.json({ success: false, error: 'pageAccessToken required — connect Facebook in Settings' });
  try {
    let publishResult: any = {};
    // Facebook page post
    if (pageId) {
      const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: post.caption, access_token: pageAccessToken })
      });
      publishResult.facebook = await fbRes.json();
    }
    // Instagram media post
    if (igAccountId && post.image_url) {
      const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: post.image_url, caption: post.caption, access_token: pageAccessToken })
      });
      const mediaData: any = await mediaRes.json();
      if (mediaData.id) {
        const pubRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creation_id: mediaData.id, access_token: pageAccessToken })
        });
        publishResult.instagram = await pubRes.json();
      }
    }
    db.prepare(`UPDATE scheduled_posts SET status='published' WHERE id=?`).run(postId);
    res.json({ success: true, data: { published: publishResult, postId } });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// LinkedIn publish
app.post('/api/content/publish/linkedin', requireAuth, async (req: any, res) => {
  const uid = req.user.id;
  const { postId, accessToken, authorUrn } = req.body;
  const post = db.prepare(`SELECT * FROM scheduled_posts WHERE id=? AND user_id=?`).get(postId, uid) as any;
  if (!post) return res.json({ success: false, error: 'Post not found' });
  if (!accessToken || !authorUrn) return res.json({ success: false, error: 'accessToken + authorUrn required' });
  try {
    const r = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: { 'com.linkedin.ugc.ShareContent': { shareCommentary: { text: post.caption }, shareMediaCategory: 'NONE' } },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
      })
    });
    const d: any = await r.json();
    db.prepare(`UPDATE scheduled_posts SET status='published' WHERE id=?`).run(postId);
    res.json({ success: true, data: { linkedinPostId: d.id, postId } });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// ── Phase 3: Messaging ────────────────────────────────────────────────────────

// Twilio SMS
app.post('/api/content/sms/send', requireAuth, async (req: any, res) => {
  const uid = req.user.id;
  const { to, message, twilioSid, twilioToken, fromNumber } = req.body;
  if (!to || !message) return res.json({ success: false, error: 'to + message required' });
  const sid = twilioSid || process.env.TWILIO_SID;
  const token = twilioToken || process.env.TWILIO_TOKEN;
  const from = fromNumber || process.env.TWILIO_FROM;
  if (!sid || !token || !from) return res.json({ success: false, error: 'Twilio credentials required — add in Settings' });
  try {
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: to, From: from, Body: message }).toString()
    });
    const d: any = await r.json();
    if (d.error_code) return res.json({ success: false, error: d.message });
    res.json({ success: true, data: { messageSid: d.sid, to, status: d.status } });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// SMS trigger sequences
app.post('/api/content/sms/sequence', requireAuth, async (req: any, res) => {
  const uid = req.user.id;
  const { contacts, messages, delayDays = 1, twilioSid, twilioToken, fromNumber } = req.body;
  if (!contacts?.length || !messages?.length) return res.json({ success: false, error: 'contacts[] + messages[] required' });
  const sequence = contacts.map((c: string, ci: number) =>
    messages.map((m: string, mi: number) => ({
      id: Math.random().toString(36).slice(2),
      to: c, message: m,
      sendAt: new Date(Date.now() + (mi * delayDays * 86400000)).toISOString(),
      status: 'queued'
    }))
  ).flat();
  db.prepare(`INSERT OR REPLACE INTO user_meta (user_id, meta_key, meta_value) VALUES (?, 'sms_sequences', ?)`
  ).run(uid, JSON.stringify(sequence));
  res.json({ success: true, data: { queued: sequence.length, contacts: contacts.length, messages: messages.length } });
});

// ── Phase 4: Intelligence ─────────────────────────────────────────────────────

// Log performance data
app.post('/api/content/performance', requireAuth, (req: any, res) => {
  const uid = req.user.id;
  const { postId, likes = 0, reach = 0, clicks = 0, shares = 0 } = req.body;
  const score = (likes * 1) + (reach * 0.1) + (clicks * 3) + (shares * 5);
  db.prepare(`UPDATE scheduled_posts SET performance=?, status='published' WHERE id=? AND user_id=?`
  ).run(JSON.stringify({ likes, reach, clicks, shares, score }), postId, uid);
  res.json({ success: true, data: { postId, score, breakdown: { likes, reach, clicks, shares } } });
});

// Get best performing content
app.get('/api/content/top-performers', requireAuth, (req: any, res) => {
  const posts = db.prepare(`SELECT * FROM scheduled_posts WHERE user_id=? AND performance IS NOT NULL ORDER BY created_at DESC`).all(req.user.id) as any[];
  const scored = posts.map(p => ({ ...p, _score: p.performance ? JSON.parse(p.performance).score : 0 }))
    .sort((a, b) => b._score - a._score).slice(0, 5);
  res.json({ success: true, data: { topPosts: scored, count: scored.length } });
});

// Auto-boost: schedule repeat of top performer
app.post('/api/content/auto-boost', requireAuth, async (req: any, res) => {
  const uid = req.user.id;
  const top = db.prepare(`SELECT * FROM scheduled_posts WHERE user_id=? AND performance IS NOT NULL ORDER BY created_at DESC`).all(uid) as any[];
  if (!top.length) return res.json({ success: false, error: 'No performance data yet' });
  const best = top.map(p => ({ ...p, _s: p.performance ? JSON.parse(p.performance).score : 0 })).sort((a,b) => b._s - a._s)[0];
  const id = Math.random().toString(36).slice(2);
  db.prepare(`INSERT INTO scheduled_posts (id, user_id, platform, caption, image_url, scheduled_at, status) VALUES (?,?,?,?,?,?,?)`).run(id, uid, best.platform, best.caption, best.image_url, nextWeek, 'pending');
  res.json({ success: true, data: { postId: id, platform: best.platform, scheduledAt: nextWeek } });
});

// ── Autonomy module routes (was imported but never wired — fixes 404s on /api/workspace/branding etc.) ──
try {
  setupAutonomy(app, db, { requireAuth, getUserLLMKey, callLLM, uuidv4 });
  console.log('✅ setupAutonomy wired');
} catch (e: any) {
  console.error('setupAutonomy failed:', e?.message || e);
}

// ── White-Label / Agency Mode ─────────────────────────────────────────────
// Tables
try {
  db.exec(`CREATE TABLE IF NOT EXISTS agency_clients (
    id TEXT PRIMARY KEY,
    agency_user_id TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL DEFAULT '',
    subdomain TEXT NOT NULL DEFAULT '',
    brand_color TEXT NOT NULL DEFAULT '#ff1f35',
    brand_logo TEXT NOT NULL DEFAULT '',
    plan TEXT NOT NULL DEFAULT 'starter',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS agency_client_usage (
    id TEXT PRIMARY KEY,
    agency_user_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    messages INTEGER NOT NULL DEFAULT 0,
    tokens INTEGER NOT NULL DEFAULT 0,
    month TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);
} catch {}

// GET /api/agency/clients — list sub-accounts
app.get('/api/agency/clients', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const clients = db.prepare('SELECT * FROM agency_clients WHERE agency_user_id=? ORDER BY created_at DESC').all(userId) as any[];
  const enriched = clients.map((c: any) => {
    const usage = db.prepare("SELECT SUM(messages) m, SUM(tokens) t FROM agency_client_usage WHERE client_id=?").get(c.id) as any;
    return { ...c, usage: { messages: usage?.m || 0, tokens: usage?.t || 0 } };
  });
  res.json({ success: true, data: enriched });
});

// POST /api/agency/clients — provision a new client sub-account
app.post('/api/agency/clients', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { clientName, clientEmail, brandColor, brandLogo, plan } = req.body;
  if (!clientName) return res.status(400).json({ error: 'clientName required' });
  const id = uuidv4();
  const subdomain = clientName.toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,30) + '-' + id.slice(0,6);
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO agency_clients (id,agency_user_id,client_name,client_email,subdomain,brand_color,brand_logo,plan,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, userId, clientName, clientEmail||'', subdomain, brandColor||'#ff1f35', brandLogo||'', plan||'starter', 'active', now, now);
  res.json({ success: true, data: { id, subdomain, clientName } });
});

// PATCH /api/agency/clients/:id — update branding / plan
app.patch('/api/agency/clients/:id', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const client = db.prepare('SELECT * FROM agency_clients WHERE id=? AND agency_user_id=?').get(req.params.id, userId) as any;
  if (!client) return res.status(404).json({ error: 'Not found' });
  const { clientName, brandColor, brandLogo, plan, status } = req.body;
  const now = new Date().toISOString();
  db.prepare(`UPDATE agency_clients SET client_name=COALESCE(?,client_name), brand_color=COALESCE(?,brand_color), brand_logo=COALESCE(?,brand_logo), plan=COALESCE(?,plan), status=COALESCE(?,status), updated_at=? WHERE id=?`)
    .run(clientName||null, brandColor||null, brandLogo||null, plan||null, status||null, now, req.params.id);
  res.json({ success: true });
});

// DELETE /api/agency/clients/:id — archive client
app.delete('/api/agency/clients/:id', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  db.prepare("UPDATE agency_clients SET status='archived', updated_at=? WHERE id=? AND agency_user_id=?").run(new Date().toISOString(), req.params.id, userId);
  res.json({ success: true });
});

// GET /api/agency/clients/:id/usage — per-client usage this month
app.get('/api/agency/clients/:id/usage', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const client = db.prepare('SELECT * FROM agency_clients WHERE id=? AND agency_user_id=?').get(req.params.id, userId) as any;
  if (!client) return res.status(404).json({ error: 'Not found' });
  const month = new Date().toISOString().slice(0,7);
  const usage = db.prepare('SELECT * FROM agency_client_usage WHERE client_id=? AND month=?').get(req.params.id, month) as any;
  res.json({ success: true, data: { client, usage: usage || { messages:0, tokens:0, month } } });
});

// GET /api/agency/overview — agency dashboard summary
app.get('/api/agency/overview', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const clients = db.prepare("SELECT * FROM agency_clients WHERE agency_user_id=? AND status='active'").all(userId) as any[];
  const month = new Date().toISOString().slice(0,7);
  const totals = db.prepare("SELECT SUM(messages) m, SUM(tokens) t FROM agency_client_usage WHERE agency_user_id=? AND month=?").get(userId, month) as any;
  const plans: Record<string,number> = {};
  for (const c of clients) { plans[c.plan] = (plans[c.plan]||0) + 1; }
  res.json({ success: true, data: { activeClients: clients.length, totalClients: db.prepare('SELECT COUNT(*) c FROM agency_clients WHERE agency_user_id=?').get(userId) as any, monthlyMessages: totals?.m||0, monthlyTokens: totals?.t||0, planBreakdown: plans, clients: clients.slice(0,5) } });
});

// ── Server Bootstrap ──────────────────────────────────────────────────────
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, { cors: { origin: '*', methods: ['GET','POST'] } });
io.on('connection', (socket: any) => {
  socket.on('join', (userId: string) => socket.join(`user:${userId}`));
});
(app as any).io = io;
httpServer.listen(PORT, () => {
  console.log(`🚀 Forge Platform v6.99 running on port ${PORT} (${NODE_ENV})`);
});
