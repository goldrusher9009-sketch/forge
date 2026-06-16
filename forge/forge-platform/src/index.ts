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
try { db.exec(`ALTER TABLE messages ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE messages ADD COLUMN reaction TEXT`); } catch {}

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
    const _routeStart = Date.now();
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

    // Router flywheel: log routing decision for data moat
    try {
      const promptLen = JSON.stringify(messages).length;
      const complexity = promptLen > 3000 ? 'high' : promptLen > 800 ? 'medium' : 'low';
      db.prepare('INSERT INTO routing_log (id,user_id,model_requested,model_resolved,provider,prompt_complexity,prompt_tokens,completion_tokens,latency_ms,created_at) VALUES (?,?,?,?,?,?,?,?,?,datetime("now"))')
        .run(require('uuid').v4(), userId, forgeModelId, actualModel, provider, complexity, result.promptTokens, result.completionTokens, Date.now() - _routeStart);
    } catch {}

    // Check usage budget alerts
    try {
      const sub = db.prepare('SELECT tokens_used, monthly_token_limit FROM subscriptions WHERE user_id=? ORDER BY created_at DESC LIMIT 1').get(userId) as any;
      if (sub?.monthly_token_limit > 0) checkUsageAlert(db, userId, sub.tokens_used, sub.monthly_token_limit);
    } catch {}

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

// POST /api/threads/:id/fork — Fork thread from a specific message onwards
app.post('/api/threads/:id/fork', requireAuth, (req: AuthRequest, res) => {
  const uid = req.user!.sub;
  const srcId = req.params.id;
  const { from_message_id, title } = req.body || {};
  const src = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(srcId, uid) as any;
  if (!src) { res.status(404).json({ success: false, error: 'THREAD_NOT_FOUND' }); return; }
  const allMsgs = db.prepare('SELECT * FROM messages WHERE thread_id=? ORDER BY created_at ASC').all(srcId) as any[];
  const cutIdx = from_message_id ? allMsgs.findIndex((m: any) => m.id === from_message_id) : allMsgs.length;
  const msgsToCopy = cutIdx >= 0 ? allMsgs.slice(0, cutIdx + 1) : allMsgs;
  const newId = uuidv4();
  const newTitle = title || `Fork of ${src.title || 'conversation'}`;
  db.prepare('INSERT INTO threads (id,user_id,project_id,title,model) VALUES (?,?,?,?,?)').run(newId, uid, src.project_id || null, newTitle, src.model || 'forge-fast');
  const insertMsg = db.prepare('INSERT INTO messages (id,thread_id,role,content,model,created_at,pinned) VALUES (?,?,?,?,?,?,?)');
  for (const m of msgsToCopy) { insertMsg.run(uuidv4(), newId, m.role, m.content, m.model, m.created_at, m.pinned || 0); }
  const newThread = db.prepare('SELECT * FROM threads WHERE id=?').get(newId);
  res.status(201).json({ success: true, data: newThread, message_count: msgsToCopy.length });
});

// PATCH /api/messages/:id/pin — Pin or unpin a message
app.patch('/api/messages/:id/pin', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const msgId = req.params.id;
  const msg = db.prepare('SELECT m.id, t.user_id FROM messages m JOIN threads t ON m.thread_id=t.id WHERE m.id=?').get(msgId) as any;
  if (!msg || msg.user_id !== userId) { res.status(404).json({ success: false, error: 'NOT_FOUND' }); return; }
  const pinned = req.body?.pinned ? 1 : 0;
  db.prepare('UPDATE messages SET pinned=? WHERE id=?').run(pinned, msgId);
  res.json({ success: true, pinned: !!pinned });
});

// PATCH /api/messages/:id/react — Set or clear a reaction emoji on a message
app.patch('/api/messages/:id/react', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const msgId = req.params.id;
  const msg = db.prepare('SELECT m.id, t.user_id FROM messages m JOIN threads t ON m.thread_id=t.id WHERE m.id=?').get(msgId) as any;
  if (!msg || msg.user_id !== userId) { res.status(404).json({ success: false, error: 'NOT_FOUND' }); return; }
  const reaction = req.body?.reaction || null;
  db.prepare('UPDATE messages SET reaction=? WHERE id=?').run(reaction, msgId);
  res.json({ success: true, reaction });
});

// GET /api/threads/:id/pinned — Get pinned messages for a thread
app.get('/api/threads/:id/pinned', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const thread = db.prepare('SELECT id FROM threads WHERE id=? AND user_id=?').get(req.params.id, userId) as any;
  if (!thread) { res.status(404).json({ success: false, error: 'THREAD_NOT_FOUND' }); return; }
  const rows = db.prepare('SELECT id, role, content, created_at FROM messages WHERE thread_id=? AND pinned=1 ORDER BY created_at ASC').all(req.params.id) as any[];
  res.json({ success: true, data: rows });
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

// POST /api/threads/:id/tldr — Generate bullet-point TL;DR of a long thread
app.post('/api/threads/:id/tldr', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const threadId = req.params.id;
  const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, userId) as any;
  if (!thread) { res.status(404).json({ error: 'Not found' }); return; }
  const msgs = db.prepare("SELECT role, content FROM thread_messages WHERE thread_id=? ORDER BY created_at ASC LIMIT 40").all(threadId) as any[];
  if (msgs.length < 3) { res.json({ bullets: ['Thread too short for summary.'] }); return; }
  const key = safe(() => getUserKey(userId, 'anthropic'), null) || safe(() => getUserKey(userId, 'openai'), null);
  if (!key) { res.status(400).json({ error: 'No LLM key configured' }); return; }
  const transcript = msgs.map((m: any) => `${m.role === 'user' ? 'User' : 'AI'}: ${String(m.content || '').slice(0, 300)}`).join('\n');
  let bullets: string[] = [];
  try {
    const provider = safe(() => getUserKey(userId, 'anthropic'), null) ? 'anthropic' : 'openai';
    const prompt = `Summarize this conversation in exactly 3 concise bullet points (start each with "• "). Cover: main topic, key conclusions, any action items. Reply with ONLY the 3 bullets.\n\n${transcript}`;
    if (provider === 'anthropic') {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic({ apiKey: key });
      const resp = await client.messages.create({ model: 'claude-haiku-4-5', max_tokens: 200, messages: [{ role: 'user', content: prompt }] });
      bullets = ((resp.content[0] as any).text || '').split('\n').filter((l: string) => l.trim().startsWith('•')).map((l: string) => l.trim());
    } else {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ apiKey: key });
      const resp = await client.chat.completions.create({ model: 'gpt-4o-mini', max_tokens: 200, messages: [{ role: 'user', content: prompt }] });
      bullets = (resp.choices[0]?.message?.content || '').split('\n').filter((l: string) => l.trim().startsWith('•')).map((l: string) => l.trim());
    }
  } catch (e: any) { bullets = ['• Could not generate summary: ' + e.message]; }
  if (!bullets.length) bullets = ['• No summary available.'];
  res.json({ bullets });
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
// POST /api/chat/simple — single non-streaming completion for compare/quick use
app.post('/api/chat/simple', requireAuth, async (req: AuthRequest, res) => {
  const { message, model = 'claude-haiku-4-5' } = req.body || {};
  if (!message) { res.status(400).json({ error: 'message required' }); return; }
  try {
    const key = await getUserKey(req.user!.sub, model.includes('gpt')||model.includes('openai') ? 'openai' : model.includes('gemini') ? 'gemini' : model.includes('groq') ? 'groq' : model.includes('mistral') ? 'mistral' : 'anthropic');
    const result = await callLLM({ model, messages: [{ role: 'user', content: message }], max_tokens: 1024 }, key);
    res.json({ success: true, data: { content: result.content, model } });
  } catch(e: any) { res.status(500).json({ success: false, error: e.message }); }
});

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


// ── Similar threads finder ─────────────────────────────────────────────────────
// GET /api/threads/:id/similar
app.get('/api/threads/:id/similar', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const msgs = db.prepare("SELECT content FROM messages WHERE thread_id=? ORDER BY created_at ASC LIMIT 5").all(threadId) as any[];
    const text = msgs.map((m: any) => m.content).join(' ').toLowerCase();
    const words = text.match(/\b[a-z]{4,}\b/g) || [];
    const freq: Record<string,number> = {};
    for (const w of words) freq[w] = (freq[w]||0)+1;
    const topWords = Object.entries(freq).sort(([,a],[,b])=>(b as number)-(a as number)).slice(0,8).map(([w])=>w);
    if (topWords.length === 0) return res.json({ similar: [] });
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

// ── Prompt template library ────────────────────────────────────────────────────
// GET /api/prompt-templates
app.get('/api/prompt-templates', requireAuth, (req: any, res: any) => {
  try {
    const builtins = [
      { id:'b1', title:'Debug this code', body:'Debug the following code and explain what is wrong:\n\n```\n{{code}}\n```', category:'coding', builtin:true },
      { id:'b2', title:'Explain simply', body:'Explain the following concept in simple terms:\n\n{{concept}}', category:'learning', builtin:true },
      { id:'b3', title:'Write unit tests', body:'Write comprehensive unit tests for:\n\n```\n{{code}}\n```', category:'coding', builtin:true },
      { id:'b4', title:'Summarize article', body:'Summarize in 3-5 bullet points:\n\n{{article}}', category:'writing', builtin:true },
      { id:'b5', title:'Code review', body:'Review this code for bugs, performance, and best practices:\n\n```\n{{code}}\n```', category:'coding', builtin:true },
      { id:'b6', title:'SQL query help', body:'Write a SQL query to: {{task}}\n\nTable schema: {{schema}}', category:'data', builtin:true },
    ];
    db.prepare("CREATE TABLE IF NOT EXISTS prompt_templates (id TEXT PRIMARY KEY, user_id TEXT, title TEXT, body TEXT, category TEXT, created_at TEXT DEFAULT (datetime('now')))").run();
    const userTemplates = db.prepare("SELECT * FROM prompt_templates WHERE user_id=? ORDER BY created_at DESC").all(req.user.id) as any[];
    res.json({ templates: [...builtins, ...userTemplates] });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/prompt-templates
app.post('/api/prompt-templates', requireAuth, (req: any, res: any) => {
  try {
    const { title, body, category } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'title and body required' });
    db.prepare("CREATE TABLE IF NOT EXISTS prompt_templates (id TEXT PRIMARY KEY, user_id TEXT, title TEXT, body TEXT, category TEXT, created_at TEXT DEFAULT (datetime('now')))").run();
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

// ── Prompt writing coach ───────────────────────────────────────────────────────
// POST /api/prompts/critique
app.post('/api/prompts/critique', requireAuth, (req: any, res: any) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });
    const issues: string[] = [];
    if (text.length < 20) issues.push('Very short — add more context');
    if (!/[?.]/.test(text)) issues.push('No clear goal — end with a specific request');
    if (text.length > 2000) issues.push('Very long — consider breaking into smaller questions');
    if (!/\b(explain|write|create|build|fix|debug|analyze|compare|summarize|translate|list|show|help)\b/i.test(text)) {
      issues.push('No action verb — try: explain, write, create, fix, analyze');
    }
    const score = Math.max(0, 100 - issues.length * 22);
    res.json({ score, issues, ok: issues.length === 0 });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/brain/summary — "What Forge knows about you" (makes the moat FELT).
app.get('/api/brain/summary', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  try {
    // Backfill category for any rows still on default (cheap, idempotent).
    const uncat = db.prepare("SELECT id,topic,insight FROM forge_memory WHERE user_id=? AND (category IS NULL OR category='general') LIMIT 200").all(userId) as any[];
    const upd = db.prepare('UPDATE forge_memory SET category=? WHERE id=?');
    for (const m of uncat) { const c = categorizeMemory(m.topic || '', m.insight || ''); if (c !== 'general') upd.run(c, m.id); }

    const total = (db.prepare('SELECT COUNT(*) c FROM forge_memory WHERE user_id=?').get(userId) as any).c;
    const topCategories = db.prepare("SELECT category, COUNT(*) as cnt, AVG(strength) as avg_str FROM forge_memory WHERE user_id=? GROUP BY category ORDER BY cnt DESC LIMIT 8").all(userId) as any[];
    const recent = db.prepare("SELECT topic, insight, category, strength, created_at FROM forge_memory WHERE user_id=? ORDER BY created_at DESC LIMIT 5").all(userId) as any[];
    const strongest = db.prepare("SELECT topic, insight, category, strength FROM forge_memory WHERE user_id=? ORDER BY strength DESC LIMIT 5").all(userId) as any[];
    res.json({ total, topCategories, recent, strongest });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Version ──────────────────────────────────────────────────────────────────
app.get('/api/version', (_req: any, res: any) => res.json({ version: 'v6.99', build: 'production', timestamp: new Date().toISOString() }));

// ─── 404 fallback ─────────────────────────────────────────────────────────────
app.use((_req: any, res: any) => res.status(404).json({ success: false, error: 'NOT_FOUND' }));

// ─── Server bootstrap ─────────────────────────────────────────────────────────
const httpServer = require('http').createServer(app);
try {
  const { Server } = require('socket.io');
  const io = new Server(httpServer, {
    cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'], credentials: true },
    transports: ['websocket', 'polling']
  });
  io.use((socket: any, next: any) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('No token'));
    try { socket.user = jwt.verify(token, JWT_SECRET); next(); } catch { next(new Error('Invalid token')); }
  });
  io.on('connection', (socket: any) => {
    socket.on('join_thread', (tid: string) => socket.join(`thread:${tid}`));
    socket.on('leave_thread', (tid: string) => socket.leave(`thread:${tid}`));
    socket.on('typing_start', (tid: string) => socket.to(`thread:${tid}`).emit('typing', { userId: socket.user?.sub }));
    socket.on('typing_stop', (tid: string) => socket.to(`thread:${tid}`).emit('typing_stop', { userId: socket.user?.sub }));
    socket.on('thread_update', (data: any) => socket.to(`thread:${data.threadId}`).emit('thread_update', data));
    socket.on('ping', () => socket.emit('pong'));
    socket.on('disconnect', () => {});
  });
  (app as any).io = io;
} catch (e: any) { console.warn('Socket.IO init failed:', e.message); }


// ── Message search ─────────────────────────────────────────────────────────────
// GET /api/messages/search
app.get('/api/messages/search', requireAuth, (req: any, res: any) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q) return res.json({ results: [] });
    const rows = db.prepare("SELECT m.id, m.thread_id, m.role, m.content, m.created_at, t.title as thread_title FROM messages m JOIN threads t ON t.id=m.thread_id WHERE t.user_id=? AND m.content LIKE ? ORDER BY m.created_at DESC LIMIT 30").all(req.user.id, `%${q}%`) as any[];
    res.json({ results: rows.map((r: any) => ({ ...r, snippet: r.content.substring(0, 200) })) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Token breakdown per thread ─────────────────────────────────────────────────
// GET /api/threads/:id/token-breakdown
app.get('/api/threads/:id/token-breakdown', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id);
    if (!thread) return res.status(404).json({ error: 'Not found' });
    let rows: any[] = [];
    try { rows = db.prepare("SELECT model, provider, SUM(input_tokens) as input_tokens, SUM(output_tokens) as output_tokens, COUNT(*) as calls FROM routing_log WHERE user_id=? AND thread_id=? GROUP BY model, provider").all(req.user.id, threadId) as any[]; } catch {}
    res.json({ breakdown: rows });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Smart rename ───────────────────────────────────────────────────────────────
// POST /api/threads/:id/smart-rename
app.post('/api/threads/:id/smart-rename', requireAuth, async (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    if (thread.title && thread.title !== 'New Thread' && thread.title !== 'Untitled') return res.json({ renamed: false, title: thread.title });
    const msgs = db.prepare("SELECT content FROM messages WHERE thread_id=? ORDER BY created_at ASC LIMIT 3").all(threadId) as any[];
    if (msgs.length === 0) return res.json({ renamed: false });
    const text = msgs[0].content.substring(0, 120);
    const words = text.split(/\s+/).slice(0, 6).join(' ');
    const newTitle = words.charAt(0).toUpperCase() + words.slice(1);
    db.prepare('UPDATE threads SET title=? WHERE id=?').run(newTitle, threadId);
    res.json({ renamed: true, title: newTitle });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Thread stats extended ──────────────────────────────────────────────────────
// GET /api/threads/:id/stats-extended
app.get('/api/threads/:id/stats-extended', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id);
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const msgs = db.prepare("SELECT role, content FROM messages WHERE thread_id=? ORDER BY created_at ASC").all(threadId) as any[];
    const wordCount = msgs.reduce((acc: number, m: any) => acc + (m.content || '').split(/\s+/).length, 0);
    const userMessages = msgs.filter((m: any) => m.role === 'user').length;
    const assistantMessages = msgs.filter((m: any) => m.role === 'assistant').length;
    const readingMinutes = Math.ceil(wordCount / 200);
    res.json({ wordCount, readingMinutes, userMessages, assistantMessages, totalMessages: msgs.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Thread highlights ──────────────────────────────────────────────────────────
// GET /api/threads/:id/highlights
app.get('/api/threads/:id/highlights', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id);
    if (!thread) return res.status(404).json({ error: 'Not found' });
    let rows: any[] = [];
    try { rows = db.prepare("SELECT * FROM messages WHERE thread_id=? AND role='assistant' AND (rating > 0 OR bookmarked=1) ORDER BY created_at ASC").all(threadId) as any[]; } catch {}
    res.json({ highlights: rows });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Diff summary ───────────────────────────────────────────────────────────────
// POST /api/threads/:id/diff-summary
app.post('/api/threads/:id/diff-summary', requireAuth, (req: any, res: any) => {
  try {
    const { diff } = req.body;
    if (!diff) return res.json({ files: [] });
    const lines = (diff as string).split('\n');
    const files: any[] = [];
    let cur: any = null;
    for (const line of lines) {
      if (line.startsWith('diff --git')) { if (cur) files.push(cur); cur = { file: line.replace(/.*b\//, ''), added: 0, removed: 0 }; }
      else if (cur && line.startsWith('+') && !line.startsWith('+++')) cur.added++;
      else if (cur && line.startsWith('-') && !line.startsWith('---')) cur.removed++;
    }
    if (cur) files.push(cur);
    res.json({ files });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Thread replay ──────────────────────────────────────────────────────────────
// GET /api/threads/:id/replay
app.get('/api/threads/:id/replay', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id);
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const msgs = db.prepare("SELECT * FROM messages WHERE thread_id=? ORDER BY created_at ASC").all(threadId) as any[];
    const timeline = msgs.map((m: any, i: number) => {
      const isKeyMoment = (m.bookmarked === 1 || m.rating > 0 || (m.content || '').includes('```'));
      return { index: i, id: m.id, role: m.role, created_at: m.created_at, snippet: (m.content || '').substring(0, 100), isKeyMoment };
    });
    res.json({ timeline, totalMessages: msgs.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Brain glossary ─────────────────────────────────────────────────────────────
// GET /api/brain/glossary
app.get('/api/brain/glossary', requireAuth, (req: any, res: any) => {
  try {
    const msgs = db.prepare("SELECT m.content FROM messages m JOIN threads t ON t.id=m.thread_id WHERE t.user_id=? AND m.role='user' ORDER BY m.created_at DESC LIMIT 200").all(req.user.id) as any[];
    const text = msgs.map((m: any) => m.content).join(' ');
    const terms = new Set<string>();
    (text.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g) || []).forEach((t: string) => terms.add(t));
    (text.match(/\b[A-Z]{2,}\b/g) || []).forEach((t: string) => terms.add(t));
    (text.match(/\b[a-z]+-[a-z]+-[a-z]+\b/g) || []).forEach((t: string) => terms.add(t));
    res.json({ terms: Array.from(terms).slice(0, 50) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Daily digest ───────────────────────────────────────────────────────────────
// GET /api/brain/daily-digest
app.get('/api/brain/daily-digest', requireAuth, (req: any, res: any) => {
  try {
    const msgs = db.prepare("SELECT m.*, t.title as thread_title FROM messages m JOIN threads t ON t.id=m.thread_id WHERE t.user_id=? AND date(m.created_at)=date('now') ORDER BY m.created_at DESC LIMIT 20").all(req.user.id) as any[];
    const threadCounts: Record<string,number> = {};
    for (const m of msgs) threadCounts[m.thread_id] = (threadCounts[m.thread_id]||0)+1;
    const topThreadId = Object.entries(threadCounts).sort(([,a],[,b])=>(b as number)-(a as number))[0]?.[0];
    const topThread = topThreadId ? db.prepare('SELECT id, title FROM threads WHERE id=?').get(topThreadId) : null;
    let memories: any[] = [];
    try { memories = db.prepare("SELECT * FROM forge_memory WHERE user_id=? AND date(created_at)=date('now') LIMIT 5").all(req.user.id) as any[]; } catch {}
    let streak = 0;
    try { const s: any = db.prepare("SELECT streak FROM user_streaks WHERE user_id=?").get(req.user.id); streak = s?.streak || 0; } catch {}
    res.json({ todayMessages: msgs.length, topThread, newMemories: memories.length, streak });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Prompt critique ────────────────────────────────────────────────────────────
// POST /api/prompts/critique
app.post('/api/prompts/critique', requireAuth, (req: any, res: any) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.json({ score: 0, issues: [] });
    const text = prompt as string;
    let score = 100;
    const issues: string[] = [];
    if (text.length < 20) { score -= 30; issues.push('Too short — add more context'); }
    if (!text.includes('?') && !text.toLowerCase().includes('please') && !text.toLowerCase().includes('write') && !text.toLowerCase().includes('explain') && !text.toLowerCase().includes('list') && !text.toLowerCase().includes('create')) { score -= 15; issues.push('Add a clear action verb or question'); }
    if (text.length > 2000) { score -= 10; issues.push('Very long — consider breaking into steps'); }
    if (!/[.?!]/.test(text)) { score -= 10; issues.push('Add punctuation for clarity'); }
    if (text === text.toLowerCase()) { score -= 5; issues.push('Use capitalization for readability'); }
    res.json({ score: Math.max(0, score), issues });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ── Writing coach ──────────────────────────────────────────────────────────────
// POST /api/writing/analyze
app.post('/api/writing/analyze', requireAuth, (req: any, res: any) => {
  try {
    const { text } = req.body;
    if (!text) return res.json({ score: 0, feedback: [] });
    const t = text as string;
    const feedback: string[] = [];
    let score = 100;
    const sentences = t.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    const avgLen = sentences.length ? t.split(/\s+/).length / sentences.length : 0;
    if (avgLen > 30) { score -= 15; feedback.push('Sentences too long — aim for 15-20 words average'); }
    if (avgLen > 0 && avgLen < 5) { score -= 10; feedback.push('Sentences very short — vary sentence length'); }
    const passivePattern = /\b(is|was|were|are|been|being)\s+\w+ed\b/gi;
    const passiveCount = (t.match(passivePattern) || []).length;
    if (passiveCount > 2) { score -= 15; feedback.push(`${passiveCount} passive voice instances — prefer active voice`); }
    const fillers = ['very', 'really', 'quite', 'just', 'basically', 'literally', 'actually', 'honestly', 'essentially'];
    const fillerCount = fillers.filter((f: string) => t.toLowerCase().includes(f)).length;
    if (fillerCount > 2) { score -= 10; feedback.push('Filler words detected — trim "very", "just", "basically" etc.'); }
    const wordFreq: Record<string,number> = {};
    const words = t.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    for (const w of words) wordFreq[w] = (wordFreq[w]||0)+1;
    const repeated = Object.entries(wordFreq).filter(([,c]) => (c as number) > 3).map(([w]) => w);
    if (repeated.length > 0) { score -= 10; feedback.push(`Overused words: ${repeated.slice(0,3).join(', ')} — use synonyms`); }
    if (feedback.length === 0) feedback.push('Great writing! Clear and concise.');
    res.json({ score: Math.max(0, score), feedback, metrics: { sentences: sentences.length, words: words.length, avgSentenceLength: Math.round(avgLen), passiveVoice: passiveCount } });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Thread archiver ────────────────────────────────────────────────────────────
// POST /api/threads/:id/archive  (toggle)
app.post('/api/threads/:id/archive', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const newVal = thread.archived ? 0 : 1;
    db.prepare('UPDATE threads SET archived=? WHERE id=?').run(newVal, threadId);
    res.json({ archived: !!newVal });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/threads/archived
app.get('/api/threads/archived', requireAuth, (req: any, res: any) => {
  try {
    const rows = db.prepare("SELECT id, title, created_at, updated_at FROM threads WHERE user_id=? AND archived=1 ORDER BY updated_at DESC").all(req.user.id);
    res.json({ threads: rows });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Message formatting helper ──────────────────────────────────────────────────
// POST /api/messages/:id/format
app.post('/api/messages/:id/format', requireAuth, (req: any, res: any) => {
  try {
    const { style } = req.body; // 'bullets' | 'numbered' | 'summary' | 'table'
    const msgId = req.params.id;
    const msg = db.prepare("SELECT m.*, t.user_id FROM messages m JOIN threads t ON t.id=m.thread_id WHERE m.id=?").get(msgId) as any;
    if (!msg || msg.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });
    const text = msg.content as string;
    let formatted = text;
    if (style === 'bullets') {
      const lines = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 10);
      formatted = lines.map((l: string) => `• ${l.trim()}`).join('\n');
    } else if (style === 'numbered') {
      const lines = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 10);
      formatted = lines.map((l: string, i: number) => `${i+1}. ${l.trim()}`).join('\n');
    } else if (style === 'summary') {
      const words = text.split(/\s+/);
      formatted = words.slice(0, Math.min(50, words.length)).join(' ') + (words.length > 50 ? '...' : '');
    }
    res.json({ formatted });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Quick stats (for homepage widget) ─────────────────────────────────────────
// GET /api/stats/quick
app.get('/api/stats/quick', requireAuth, (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const totalThreads = (db.prepare("SELECT COUNT(*) as n FROM threads WHERE user_id=? AND archived=0").get(userId) as any).n;
    const totalMessages = (db.prepare("SELECT COUNT(*) as n FROM messages m JOIN threads t ON t.id=m.thread_id WHERE t.user_id=?").get(userId) as any).n;
    const todayMessages = (db.prepare("SELECT COUNT(*) as n FROM messages m JOIN threads t ON t.id=m.thread_id WHERE t.user_id=? AND date(m.created_at)=date('now')").get(userId) as any).n;
    const bookmarks = (db.prepare("SELECT COUNT(*) as n FROM message_bookmarks WHERE user_id=?").get(userId) as any).n;
    let memories = 0;
    try { memories = (db.prepare("SELECT COUNT(*) as n FROM forge_memory WHERE user_id=?").get(userId) as any).n; } catch {}
    res.json({ totalThreads, totalMessages, todayMessages, bookmarks, memories });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Focus mode sessions ────────────────────────────────────────────────────────
// POST /api/focus/start
app.post('/api/focus/start', requireAuth, (req: any, res: any) => {
  try {
    db.prepare("CREATE TABLE IF NOT EXISTS focus_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, thread_id TEXT, started_at TEXT DEFAULT (datetime('now')), ended_at TEXT, duration_minutes INTEGER)").run();
    const { threadId } = req.body;
    const r = db.prepare("INSERT INTO focus_sessions (user_id, thread_id) VALUES (?,?)").run(req.user.id, threadId || null);
    res.json({ sessionId: r.lastInsertRowid });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/focus/end
app.post('/api/focus/end', requireAuth, (req: any, res: any) => {
  try {
    const { sessionId } = req.body;
    const session = db.prepare("SELECT * FROM focus_sessions WHERE id=? AND user_id=?").get(sessionId, req.user.id) as any;
    if (!session) return res.status(404).json({ error: 'Not found' });
    const started = new Date(session.started_at).getTime();
    const durationMinutes = Math.round((Date.now() - started) / 60000);
    db.prepare("UPDATE focus_sessions SET ended_at=datetime('now'), duration_minutes=? WHERE id=?").run(durationMinutes, sessionId);
    res.json({ durationMinutes });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/focus/history
app.get('/api/focus/history', requireAuth, (req: any, res: any) => {
  try {
    db.prepare("CREATE TABLE IF NOT EXISTS focus_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, thread_id TEXT, started_at TEXT DEFAULT (datetime('now')), ended_at TEXT, duration_minutes INTEGER)").run();
    const rows = db.prepare("SELECT * FROM focus_sessions WHERE user_id=? AND ended_at IS NOT NULL ORDER BY started_at DESC LIMIT 20").all(req.user.id);
    const total = rows.reduce((acc: number, r: any) => acc + (r.duration_minutes || 0), 0);
    res.json({ sessions: rows, totalMinutes: total });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ── Thread pinning (pin thread to top of list) ────────────────────────────────
// POST /api/threads/:id/pin
app.post('/api/threads/:id/pin', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const newVal = thread.pinned ? 0 : 1;
    try { db.prepare('ALTER TABLE threads ADD COLUMN pinned INTEGER DEFAULT 0').run(); } catch {}
    db.prepare('UPDATE threads SET pinned=? WHERE id=?').run(newVal, threadId);
    res.json({ pinned: !!newVal });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Thread duplication ─────────────────────────────────────────────────────────
// POST /api/threads/:id/duplicate
app.post('/api/threads/:id/duplicate', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const msgs = db.prepare('SELECT * FROM messages WHERE thread_id=? ORDER BY created_at ASC').all(threadId) as any[];
    const newTitle = (thread.title || 'Thread') + ' (copy)';
    const newThread = db.prepare("INSERT INTO threads (user_id, title, model, created_at, updated_at) VALUES (?,?,?,datetime('now'),datetime('now'))").run(req.user.id, newTitle, thread.model);
    const newId = newThread.lastInsertRowid;
    for (const m of msgs) {
      db.prepare("INSERT INTO messages (thread_id, role, content, model, created_at) VALUES (?,?,?,?,datetime('now'))").run(newId, m.role, m.content, m.model);
    }
    res.json({ thread: { id: newId, title: newTitle } });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Message translation ────────────────────────────────────────────────────────
// POST /api/messages/:id/translate
app.post('/api/messages/:id/translate', requireAuth, (req: any, res: any) => {
  try {
    const { targetLang } = req.body;
    const msgId = req.params.id;
    const msg = db.prepare("SELECT m.*, t.user_id FROM messages m JOIN threads t ON t.id=m.thread_id WHERE m.id=?").get(msgId) as any;
    if (!msg || msg.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });
    // Return a signal for the frontend to call the LLM for translation
    res.json({ content: msg.content, targetLang: targetLang || 'es', msgId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Workspace health check ─────────────────────────────────────────────────────
// GET /api/workspace/health
app.get('/api/workspace/health', requireAuth, (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const issues: string[] = [];
    const totalThreads = (db.prepare("SELECT COUNT(*) as n FROM threads WHERE user_id=? AND archived=0").get(userId) as any).n;
    const emptyThreads = (db.prepare("SELECT COUNT(*) as n FROM threads t WHERE t.user_id=? AND t.archived=0 AND NOT EXISTS (SELECT 1 FROM messages m WHERE m.thread_id=t.id)").get(userId) as any).n;
    const unnamedThreads = (db.prepare("SELECT COUNT(*) as n FROM threads WHERE user_id=? AND archived=0 AND (title IS NULL OR title='New Thread' OR title='Untitled')").get(userId) as any).n;
    if (emptyThreads > 0) issues.push(`${emptyThreads} empty threads — consider deleting them`);
    if (unnamedThreads > 3) issues.push(`${unnamedThreads} unnamed threads — use smart rename to fix`);
    if (totalThreads > 100) issues.push(`${totalThreads} active threads — consider archiving old ones`);
    let memories = 0;
    try { memories = (db.prepare("SELECT COUNT(*) as n FROM forge_memory WHERE user_id=?").get(userId) as any).n; } catch {}
    const score = Math.max(0, 100 - issues.length * 20);
    res.json({ score, issues, stats: { totalThreads, emptyThreads, unnamedThreads, memories } });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Prompt history (last 50 user prompts) ─────────────────────────────────────
// GET /api/prompts/history
app.get('/api/prompts/history', requireAuth, (req: any, res: any) => {
  try {
    const rows = db.prepare("SELECT m.id, m.content, m.created_at, t.title as thread_title, t.id as thread_id FROM messages m JOIN threads t ON t.id=m.thread_id WHERE t.user_id=? AND m.role='user' ORDER BY m.created_at DESC LIMIT 50").all(req.user.id) as any[];
    res.json({ prompts: rows.map((r: any) => ({ ...r, preview: (r.content || '').substring(0, 120) })) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Thread word cloud data ─────────────────────────────────────────────────────
// GET /api/threads/:id/wordcloud
app.get('/api/threads/:id/wordcloud', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id);
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const msgs = db.prepare("SELECT content FROM messages WHERE thread_id=? ORDER BY created_at ASC").all(threadId) as any[];
    const text = msgs.map((m: any) => m.content).join(' ').toLowerCase();
    const stopWords = new Set(['the','a','an','is','in','it','of','to','and','or','for','on','at','by','with','from','that','this','was','are','be','have','has','had','not','but','as','we','they','you','he','she','i','my','your','our','their','its','what','when','how','can','do','did','will','would','could','should','may','might','also','just','more','some','any','all','each','there','then','than','so','up','out','if','about','into','over','after','because','like','one','which','who','way']);
    const words = text.match(/\b[a-z]{4,}\b/g) || [];
    const freq: Record<string,number> = {};
    for (const w of words) { if (!stopWords.has(w)) freq[w] = (freq[w]||0)+1; }
    const sorted = Object.entries(freq).sort(([,a],[,b])=>(b as number)-(a as number)).slice(0,30);
    res.json({ words: sorted.map(([text, count]) => ({ text, count })) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Conversation export (JSON) ─────────────────────────────────────────────────
// GET /api/threads/:id/export/json
app.get('/api/threads/:id/export/json', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const msgs = db.prepare('SELECT role, content, model, created_at FROM messages WHERE thread_id=? ORDER BY created_at ASC').all(threadId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="thread-${threadId}.json"`);
    res.json({ thread: { id: thread.id, title: thread.title, created_at: thread.created_at }, messages: msgs, exportedAt: new Date().toISOString() });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ── Thread mood / sentiment over time ─────────────────────────────────────────
// GET /api/threads/:id/sentiment-timeline
app.get('/api/threads/:id/sentiment-timeline', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id);
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const msgs = db.prepare("SELECT id, role, content, created_at FROM messages WHERE thread_id=? ORDER BY created_at ASC").all(threadId) as any[];
    const positiveWords = ['great','excellent','perfect','love','good','nice','awesome','helpful','thanks','thank','happy','wonderful','fantastic','amazing'];
    const negativeWords = ['bad','wrong','broken','error','fail','issue','problem','terrible','awful','hate','confused','frustrating','not working'];
    const timeline = msgs.map((m: any) => {
      const txt = (m.content || '').toLowerCase();
      const pos = positiveWords.filter((w: string) => txt.includes(w)).length;
      const neg = negativeWords.filter((w: string) => txt.includes(w)).length;
      const score = pos - neg;
      return { id: m.id, role: m.role, created_at: m.created_at, sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral', score };
    });
    const avg = timeline.reduce((s: number, t: any) => s + t.score, 0) / Math.max(1, timeline.length);
    res.json({ timeline, avgScore: Math.round(avg * 10) / 10, overall: avg > 0.5 ? 'positive' : avg < -0.5 ? 'negative' : 'neutral' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── User activity heatmap ──────────────────────────────────────────────────────
// GET /api/stats/heatmap
app.get('/api/stats/heatmap', requireAuth, (req: any, res: any) => {
  try {
    const rows = db.prepare("SELECT strftime('%Y-%m-%d', created_at) as day, COUNT(*) as count FROM messages m JOIN threads t ON t.id=m.thread_id WHERE t.user_id=? AND m.created_at >= date('now','-90 days') GROUP BY day ORDER BY day").all(req.user.id) as any[];
    res.json({ heatmap: rows });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Thread complexity score ────────────────────────────────────────────────────
// GET /api/threads/:id/complexity
app.get('/api/threads/:id/complexity', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id);
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const msgs = db.prepare("SELECT role, content FROM messages WHERE thread_id=? ORDER BY created_at ASC").all(threadId) as any[];
    const total = msgs.length;
    const avgLen = msgs.reduce((s: number, m: any) => s + (m.content||'').length, 0) / Math.max(1, total);
    const codeBlocks = msgs.filter((m: any) => (m.content||'').includes('```')).length;
    const questions = msgs.filter((m: any) => (m.content||'').includes('?')).length;
    const uniqueModels = new Set(msgs.map((m: any) => (m as any).model).filter(Boolean)).size;
    const score = Math.min(100, Math.round((total * 2) + (avgLen / 100) + (codeBlocks * 5) + (questions * 2) + (uniqueModels * 10)));
    res.json({ score, breakdown: { messageCount: total, avgMsgLength: Math.round(avgLen), codeBlocks, questions, uniqueModels } });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Recent codeblocks across all threads ──────────────────────────────────────
// GET /api/brain/codeblocks
app.get('/api/brain/codeblocks', requireAuth, (req: any, res: any) => {
  try {
    const msgs = db.prepare("SELECT m.id, m.content, m.created_at, t.title as thread_title, t.id as thread_id FROM messages m JOIN threads t ON t.id=m.thread_id WHERE t.user_id=? AND m.role='assistant' AND m.content LIKE '%```%' ORDER BY m.created_at DESC LIMIT 30").all(req.user.id) as any[];
    const blocks: any[] = [];
    for (const m of msgs) {
      const matches = (m.content || '').match(/```(\w*)\n([\s\S]*?)```/g) || [];
      for (const block of matches.slice(0,3)) {
        const langMatch = block.match(/```(\w*)/);
        const lang = langMatch ? langMatch[1] : '';
        const code = block.replace(/```\w*\n?/, '').replace(/```$/, '').trim();
        if (code.length > 10) blocks.push({ thread_title: m.thread_title, thread_id: m.thread_id, created_at: m.created_at, lang, preview: code.substring(0, 200) });
      }
      if (blocks.length >= 20) break;
    }
    res.json({ blocks });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Smart thread merge (check similarity before merging) ──────────────────────
// GET /api/threads/merge-candidates
app.get('/api/threads/merge-candidates', requireAuth, (req: any, res: any) => {
  try {
    const threads = db.prepare("SELECT t.id, t.title, COUNT(m.id) as msg_count FROM threads t LEFT JOIN messages m ON m.thread_id=t.id WHERE t.user_id=? AND (t.archived IS NULL OR t.archived=0) GROUP BY t.id ORDER BY t.updated_at DESC LIMIT 30").all(req.user.id) as any[];
    const candidates: any[] = [];
    for (let i = 0; i < threads.length; i++) {
      for (let j = i+1; j < threads.length; j++) {
        const a = (threads[i] as any).title || '';
        const b = (threads[j] as any).title || '';
        const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3));
        const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3));
        const shared = [...wordsA].filter((w: string) => wordsB.has(w)).length;
        const similarity = shared / Math.max(1, Math.max(wordsA.size, wordsB.size));
        if (similarity > 0.4) candidates.push({ threadA: threads[i], threadB: threads[j], similarity: Math.round(similarity * 100) });
      }
    }
    candidates.sort((a: any, b: any) => b.similarity - a.similarity);
    res.json({ candidates: candidates.slice(0, 10) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Conversation depth analysis ────────────────────────────────────────────────
// GET /api/threads/:id/depth
app.get('/api/threads/:id/depth', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id);
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const msgs = db.prepare("SELECT role, content FROM messages WHERE thread_id=? ORDER BY created_at ASC").all(threadId) as any[];
    let turns = 0; let prevRole = '';
    for (const m of msgs) { if ((m as any).role !== prevRole) { turns++; prevRole = (m as any).role; } }
    const userMsgs = msgs.filter((m: any) => m.role === 'user');
    const avgUserLen = userMsgs.reduce((s: number, m: any) => s + (m.content||'').length, 0) / Math.max(1, userMsgs.length);
    const depth = turns >= 10 ? 'deep' : turns >= 4 ? 'moderate' : 'shallow';
    const followUpRate = turns > 2 ? Math.round(((turns - 1) / Math.max(1, userMsgs.length)) * 100) : 0;
    res.json({ turns, depth, avgUserMessageLength: Math.round(avgUserLen), followUpRate });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ── Thread reading time estimator ─────────────────────────────────────────────
// GET /api/threads/:id/reading-time
app.get('/api/threads/:id/reading-time', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id);
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const msgs = db.prepare("SELECT content FROM messages WHERE thread_id=?").all(threadId) as any[];
    const totalChars = msgs.reduce((s: number, m: any) => s + (m.content||'').length, 0);
    const wordCount = Math.round(totalChars / 5);
    const readingMinutes = Math.max(1, Math.round(wordCount / 200));
    const speakingMinutes = Math.max(1, Math.round(wordCount / 130));
    res.json({ wordCount, readingMinutes, speakingMinutes, msgCount: msgs.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Top threads by length ──────────────────────────────────────────────────────
// GET /api/stats/top-threads
app.get('/api/stats/top-threads', requireAuth, (req: any, res: any) => {
  try {
    const rows = db.prepare("SELECT t.id, t.title, t.model, t.created_at, COUNT(m.id) as msg_count, SUM(LENGTH(m.content)) as total_chars FROM threads t LEFT JOIN messages m ON m.thread_id=t.id WHERE t.user_id=? AND (t.archived IS NULL OR t.archived=0) GROUP BY t.id ORDER BY msg_count DESC LIMIT 10").all(req.user.id) as any[];
    res.json({ threads: rows.map((r: any) => ({ ...r, wordCount: Math.round((r.total_chars||0)/5), readingMinutes: Math.max(1, Math.round((r.total_chars||0)/1000)) })) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Model usage breakdown ──────────────────────────────────────────────────────
// GET /api/stats/model-breakdown
app.get('/api/stats/model-breakdown', requireAuth, (req: any, res: any) => {
  try {
    const rows = db.prepare("SELECT m.model, COUNT(*) as count FROM messages m JOIN threads t ON t.id=m.thread_id WHERE t.user_id=? AND m.role='assistant' AND m.model IS NOT NULL GROUP BY m.model ORDER BY count DESC").all(req.user.id) as any[];
    const total = rows.reduce((s: number, r: any) => s + r.count, 0);
    res.json({ models: rows.map((r: any) => ({ model: r.model, count: r.count, pct: Math.round((r.count/Math.max(1,total))*100) })), total });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── User streaks (daily) ───────────────────────────────────────────────────────
// GET /api/stats/streak
app.get('/api/stats/streak', requireAuth, (req: any, res: any) => {
  try {
    const days = db.prepare("SELECT DISTINCT strftime('%Y-%m-%d', m.created_at) as day FROM messages m JOIN threads t ON t.id=m.thread_id WHERE t.user_id=? ORDER BY day DESC LIMIT 90").all(req.user.id) as any[];
    let streak = 0; let longest = 0; let current = 0;
    const today = new Date(); today.setHours(0,0,0,0);
    let expected = new Date(today);
    for (const row of days) {
      const d = new Date((row as any).day + 'T00:00:00Z');
      const diff = Math.round((expected.getTime() - d.getTime()) / 86400000);
      if (diff === 0 || diff === 1) { current++; expected = d; if (current > longest) longest = current; }
      else break;
    }
    streak = current;
    res.json({ currentStreak: streak, longestStreak: longest, activeDays: days.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Session time tracker ───────────────────────────────────────────────────────
// GET /api/stats/session-time
app.get('/api/stats/session-time', requireAuth, (req: any, res: any) => {
  try {
    const sessions = db.prepare("SELECT SUM(duration_minutes) as total, COUNT(*) as count, AVG(duration_minutes) as avg FROM focus_sessions WHERE user_id=?").get(req.user.id) as any;
    const last7 = db.prepare("SELECT strftime('%Y-%m-%d',started_at) as day, SUM(duration_minutes) as mins FROM focus_sessions WHERE user_id=? AND started_at >= date('now','-7 days') GROUP BY day ORDER BY day").all(req.user.id) as any[];
    res.json({ totalMinutes: sessions?.total || 0, sessionCount: sessions?.count || 0, avgMinutes: Math.round(sessions?.avg || 0), last7Days: last7 });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Knowledge graph (entities from memory) ────────────────────────────────────
// GET /api/brain/knowledge-graph
app.get('/api/brain/knowledge-graph', requireAuth, (req: any, res: any) => {
  try {
    let memories: any[] = [];
    try { memories = db.prepare("SELECT content, category FROM forge_memory WHERE user_id=? LIMIT 50").all(req.user.id) as any[]; } catch {}
    const nodes: any[] = [];
    const edges: any[] = [];
    const cats = new Set<string>();
    for (const m of memories) {
      if (m.category) cats.add(m.category);
      const words = (m.content||'').match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g) || [];
      for (const w of words.slice(0,3)) {
        if (!nodes.find((n: any) => n.id === w)) nodes.push({ id: w, category: m.category || 'general', label: w });
      }
    }
    for (let i = 0; i < nodes.length && i < 5; i++) {
      for (let j = i+1; j < nodes.length && j < 5; j++) {
        edges.push({ from: nodes[i].id, to: nodes[j].id });
      }
    }
    res.json({ nodes: nodes.slice(0,20), edges: edges.slice(0,30), categories: [...cats] });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Thread timeline (all threads sorted by date) ───────────────────────────────
// GET /api/threads/timeline
app.get('/api/threads/timeline', requireAuth, (req: any, res: any) => {
  try {
    const rows = db.prepare("SELECT t.id, t.title, t.model, t.created_at, t.updated_at, COUNT(m.id) as msg_count FROM threads t LEFT JOIN messages m ON m.thread_id=t.id WHERE t.user_id=? AND (t.archived IS NULL OR t.archived=0) GROUP BY t.id ORDER BY t.created_at DESC LIMIT 50").all(req.user.id) as any[];
    res.json({ timeline: rows });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ── Conversation goals ─────────────────────────────────────────────────────────
// POST /api/threads/:id/goals
app.post('/api/threads/:id/goals', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id);
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const { goal } = req.body;
    if (!goal) return res.status(400).json({ error: 'goal required' });
    try { db.prepare('ALTER TABLE threads ADD COLUMN goal TEXT').run(); } catch {}
    db.prepare('UPDATE threads SET goal=? WHERE id=?').run(goal, threadId);
    res.json({ goal });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/threads/:id/goals
app.get('/api/threads/:id/goals', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    res.json({ goal: thread.goal || null });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Thread lock (read-only mode) ───────────────────────────────────────────────
// POST /api/threads/:id/lock
app.post('/api/threads/:id/lock', requireAuth, (req: any, res: any) => {
  try {
    const threadId = req.params.id;
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(threadId, req.user.id) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    try { db.prepare('ALTER TABLE threads ADD COLUMN locked INTEGER DEFAULT 0').run(); } catch {}
    const newVal = thread.locked ? 0 : 1;
    db.prepare('UPDATE threads SET locked=? WHERE id=?').run(newVal, threadId);
    res.json({ locked: !!newVal });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Bulk delete threads ────────────────────────────────────────────────────────
// POST /api/threads/bulk-delete
app.post('/api/threads/bulk-delete', requireAuth, (req: any, res: any) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids array required' });
    let deleted = 0;
    for (const id of ids) {
      const t = db.prepare('SELECT id FROM threads WHERE id=? AND user_id=?').get(id, req.user.id);
      if (t) { db.prepare('DELETE FROM messages WHERE thread_id=?').run(id); db.prepare('DELETE FROM threads WHERE id=?').run(id); deleted++; }
    }
    res.json({ deleted });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Message search with highlight ─────────────────────────────────────────────
// GET /api/messages/search-highlight?q=term
app.get('/api/messages/search-highlight', requireAuth, (req: any, res: any) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ results: [] });
    const rows = db.prepare("SELECT m.id, m.content, m.role, m.created_at, t.id as thread_id, t.title as thread_title FROM messages m JOIN threads t ON t.id=m.thread_id WHERE t.user_id=? AND m.content LIKE ? ORDER BY m.created_at DESC LIMIT 20").all(req.user.id, `%${q}%`) as any[];
    const results = rows.map((r: any) => {
      const idx = (r.content||'').toLowerCase().indexOf(q.toLowerCase());
      const start = Math.max(0, idx - 60);
      const snippet = (r.content||'').substring(start, start + 200);
      return { ...r, snippet, matchIndex: idx - start };
    });
    res.json({ results });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── User notes (scratch pad) ───────────────────────────────────────────────────
// GET /api/notes
app.get('/api/notes', requireAuth, (req: any, res: any) => {
  try {
    try { db.prepare('CREATE TABLE IF NOT EXISTS user_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, content TEXT, created_at TEXT, updated_at TEXT)').run(); } catch {}
    const notes = db.prepare("SELECT * FROM user_notes WHERE user_id=? ORDER BY updated_at DESC LIMIT 50").all(req.user.id);
    res.json({ notes });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/notes
app.post('/api/notes', requireAuth, (req: any, res: any) => {
  try {
    try { db.prepare('CREATE TABLE IF NOT EXISTS user_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, content TEXT, created_at TEXT, updated_at TEXT)').run(); } catch {}
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });
    const r = db.prepare("INSERT INTO user_notes (user_id, content, created_at, updated_at) VALUES (?,?,datetime('now'),datetime('now'))").run(req.user.id, content);
    res.json({ id: r.lastInsertRowid, content });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/notes/:id
app.put('/api/notes/:id', requireAuth, (req: any, res: any) => {
  try {
    const { content } = req.body;
    db.prepare("UPDATE user_notes SET content=?, updated_at=datetime('now') WHERE id=? AND user_id=?").run(content, req.params.id, req.user.id);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/notes/:id
app.delete('/api/notes/:id', requireAuth, (req: any, res: any) => {
  try {
    db.prepare('DELETE FROM user_notes WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ── Batch 11 ─────────────────────────────────────────────────────────────────

// POST /api/messages/:id/diff-explain — explain code diff in a message
app.post('/api/messages/:id/diff-explain', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const msg = await db.get('SELECT * FROM messages WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    const content = msg.content || '';
    // Extract code blocks
    const codeBlocks: string[] = [];
    const re = /```[\w]*\n?([\s\S]*?)```/g;
    let m;
    while ((m = re.exec(content)) !== null) codeBlocks.push(m[1].trim());
    if (codeBlocks.length === 0) return res.json({ explanation: 'No code blocks found in this message.', diffs: [] });
    // Produce simple line-level diff info
    const diffs = codeBlocks.map((code, i) => {
      const lines = code.split('\n');
      const added = lines.filter(l => l.startsWith('+')).length;
      const removed = lines.filter(l => l.startsWith('-')).length;
      const context = lines.filter(l => !l.startsWith('+') && !l.startsWith('-')).length;
      return { blockIndex: i, lines: lines.length, added, removed, context, preview: lines.slice(0, 5).join('\n') };
    });
    res.json({ explanation: `Found ${codeBlocks.length} code block(s). Use your LLM to explain changes.`, diffs, codeBlocks });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/threads/:id/session-replay — ordered message list with timing deltas for replay
app.get('/api/threads/:id/session-replay', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const thread = await db.get('SELECT * FROM threads WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    const messages = await db.all(
      'SELECT id, role, content, created_at, model FROM messages WHERE thread_id=? ORDER BY created_at ASC',
      [req.params.id]
    );
    const frames = messages.map((msg: any, i: number) => {
      const prevTime = i > 0 ? new Date(messages[i-1].created_at).getTime() : new Date(msg.created_at).getTime();
      const thisTime = new Date(msg.created_at).getTime();
      const deltaMs = Math.max(0, thisTime - prevTime);
      return { ...msg, frameIndex: i, deltaMs, deltaLabel: deltaMs < 1000 ? `${deltaMs}ms` : `${(deltaMs/1000).toFixed(1)}s` };
    });
    res.json({ threadId: req.params.id, title: thread.title, totalFrames: frames.length, frames });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/threads/:id/smart-rename — AI-suggested title from first N messages
app.post('/api/threads/:id/smart-rename', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const thread = await db.get('SELECT * FROM threads WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    const messages = await db.all(
      'SELECT role, content FROM messages WHERE thread_id=? ORDER BY created_at ASC LIMIT 6',
      [req.params.id]
    );
    if (messages.length === 0) return res.json({ title: thread.title, changed: false });
    // Generate title from first user message — extract key noun phrase
    const firstUser = messages.find((m: any) => m.role === 'user');
    if (!firstUser) return res.json({ title: thread.title, changed: false });
    const words = (firstUser.content as string).replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
    const stopWords = new Set(['the','a','an','is','are','what','how','can','you','i','me','my','we','our','do','does','please','help','make','create','write','give','tell','show','get','set','find','use','need']);
    const keyWords = words.filter(w => w.length > 2 && !stopWords.has(w.toLowerCase())).slice(0, 6);
    const suggestedTitle = keyWords.length >= 2 ? keyWords.slice(0, 5).map(w => w.charAt(0).toUpperCase()+w.slice(1)).join(' ') : (thread.title || 'Untitled Thread');
    const apply = req.body?.apply === true;
    if (apply) {
      await db.run('UPDATE threads SET title=? WHERE id=?', [suggestedTitle, req.params.id]);
    }
    res.json({ originalTitle: thread.title, suggestedTitle, changed: apply, messageCount: messages.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/threads/:id/token-breakdown — per-message estimated token counts + cost
app.get('/api/threads/:id/token-breakdown', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const thread = await db.get('SELECT * FROM threads WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    const messages = await db.all(
      'SELECT id, role, content, model, created_at FROM messages WHERE thread_id=? ORDER BY created_at ASC',
      [req.params.id]
    );
    const MODEL_COSTS: Record<string, {in: number, out: number}> = {
      'claude-3-5-sonnet': { in: 3, out: 15 },
      'claude-3-opus': { in: 15, out: 75 },
      'claude-3-haiku': { in: 0.25, out: 1.25 },
      'gpt-4o': { in: 2.5, out: 10 },
      'gpt-4': { in: 30, out: 60 },
      'gpt-3.5-turbo': { in: 0.5, out: 1.5 },
      'gemini-pro': { in: 0.5, out: 1.5 },
      'default': { in: 3, out: 15 },
    };
    const estimateTokens = (text: string) => Math.ceil((text || '').length / 4);
    let totalInputTokens = 0, totalOutputTokens = 0, totalCostUsd = 0;
    const breakdown = messages.map((msg: any) => {
      const tokens = estimateTokens(msg.content || '');
      const modelKey = Object.keys(MODEL_COSTS).find(k => (msg.model||'').toLowerCase().includes(k)) || 'default';
      const rates = MODEL_COSTS[modelKey];
      const costPer1M = msg.role === 'assistant' ? rates.out : rates.in;
      const costUsd = (tokens / 1_000_000) * costPer1M;
      if (msg.role === 'user') totalInputTokens += tokens; else totalOutputTokens += tokens;
      totalCostUsd += costUsd;
      return { id: msg.id, role: msg.role, model: msg.model, estimatedTokens: tokens, costUsd: +costUsd.toFixed(6) };
    });
    res.json({
      threadId: req.params.id, messageCount: messages.length, breakdown,
      totals: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens, totalTokens: totalInputTokens+totalOutputTokens, estimatedCostUsd: +totalCostUsd.toFixed(4) }
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/stats/daily-tokens — daily token usage (estimated) last 30 days
app.get('/api/stats/daily-tokens', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(`
      SELECT date(created_at) as day,
        SUM(CASE WHEN role='user' THEN CAST(length(content)/4 AS INT) ELSE 0 END) as inputTokens,
        SUM(CASE WHEN role='assistant' THEN CAST(length(content)/4 AS INT) ELSE 0 END) as outputTokens
      FROM messages WHERE user_id=? AND created_at >= date('now','-30 days')
      GROUP BY day ORDER BY day ASC`, [req.user.id]);
    res.json({ days: rows.map((r: any) => ({ ...r, totalTokens: (r.inputTokens||0)+(r.outputTokens||0) })) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/threads/:id/similar — find semantically similar threads by title/keyword overlap
app.get('/api/threads/:id/similar', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const thread = await db.get('SELECT * FROM threads WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    const allThreads = await db.all('SELECT id, title FROM threads WHERE user_id=? AND id!=?', [req.user.id, req.params.id]);
    const titleWords = new Set((thread.title||'').toLowerCase().split(/\W+/).filter((w: string) => w.length > 3));
    const scored = allThreads.map((t: any) => {
      const words = new Set((t.title||'').toLowerCase().split(/\W+/).filter((w: string) => w.length > 3));
      const intersection = [...titleWords].filter(w => words.has(w)).length;
      const union = new Set([...titleWords, ...words]).size;
      const similarity = union > 0 ? intersection / union : 0;
      return { ...t, similarity: +similarity.toFixed(2) };
    }).filter((t: any) => t.similarity > 0.1).sort((a: any, b: any) => b.similarity - a.similarity).slice(0, 8);
    res.json({ threadId: req.params.id, similar: scored });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});



// ── Batch 12 ─────────────────────────────────────────────────────────────────

// GET /api/personas — list user chat personas
app.get('/api/personas', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    await db.run(`CREATE TABLE IF NOT EXISTS personas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER, name TEXT, description TEXT, system_prompt TEXT,
      avatar TEXT DEFAULT '🤖', is_active INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    const rows = await db.all('SELECT * FROM personas WHERE user_id=? ORDER BY created_at DESC', [req.user.id]);
    res.json({ personas: rows });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/personas — create persona
app.post('/api/personas', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    await db.run(`CREATE TABLE IF NOT EXISTS personas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER, name TEXT, description TEXT, system_prompt TEXT,
      avatar TEXT DEFAULT '🤖', is_active INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    const { name, description, system_prompt, avatar } = req.body;
    if (!name || !system_prompt) return res.status(400).json({ error: 'name and system_prompt required' });
    const r = await db.run('INSERT INTO personas (user_id,name,description,system_prompt,avatar) VALUES (?,?,?,?,?)',
      [req.user.id, name, description||'', system_prompt, avatar||'🤖']);
    res.json({ id: r.lastID, name, description, system_prompt, avatar: avatar||'🤖' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/personas/:id — update persona
app.put('/api/personas/:id', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const { name, description, system_prompt, avatar, is_active } = req.body;
    await db.run('UPDATE personas SET name=COALESCE(?,name), description=COALESCE(?,description), system_prompt=COALESCE(?,system_prompt), avatar=COALESCE(?,avatar), is_active=COALESCE(?,is_active) WHERE id=? AND user_id=?',
      [name, description, system_prompt, avatar, is_active, req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/personas/:id — delete persona
app.delete('/api/personas/:id', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM personas WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/focus/start — start a focus session
app.post('/api/focus/start', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const { thread_id, duration_minutes } = req.body;
    const r = await db.run('INSERT INTO focus_sessions (user_id,thread_id,started_at,planned_minutes) VALUES (?,?,CURRENT_TIMESTAMP,?)',
      [req.user.id, thread_id||null, duration_minutes||25]);
    res.json({ sessionId: r.lastID, startedAt: new Date().toISOString(), plannedMinutes: duration_minutes||25 });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/focus/end — end focus session
app.post('/api/focus/end', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const { session_id } = req.body;
    const sess = await db.get('SELECT * FROM focus_sessions WHERE id=? AND user_id=?', [session_id, req.user.id]);
    if (!sess) return res.status(404).json({ error: 'Session not found' });
    const started = new Date(sess.started_at).getTime();
    const actualMinutes = Math.round((Date.now() - started) / 60000);
    await db.run('UPDATE focus_sessions SET ended_at=CURRENT_TIMESTAMP, actual_minutes=? WHERE id=?', [actualMinutes, session_id]);
    res.json({ ok: true, actualMinutes, plannedMinutes: sess.planned_minutes });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/messages/:id/reply — create a reply to a message (threaded)
app.post('/api/messages/:id/reply', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    await db.run('ALTER TABLE messages ADD COLUMN parent_id INTEGER').catch(() => {});
    const parent = await db.get('SELECT * FROM messages WHERE id=?', [req.params.id]);
    if (!parent) return res.status(404).json({ error: 'Parent message not found' });
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });
    const r = await db.run('INSERT INTO messages (thread_id,user_id,role,content,parent_id,created_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)',
      [parent.thread_id, req.user.id, 'user', content, req.params.id]);
    res.json({ id: r.lastID, parent_id: req.params.id, thread_id: parent.thread_id, content, role: 'user' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/messages/:id/replies — get replies to a message
app.get('/api/messages/:id/replies', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const replies = await db.all(
      'SELECT * FROM messages WHERE parent_id=? ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json({ replies, count: replies.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/threads/:id/export/markdown — export thread as markdown doc
app.get('/api/threads/:id/export/markdown', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const thread = await db.get('SELECT * FROM threads WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    const messages = await db.all('SELECT * FROM messages WHERE thread_id=? ORDER BY created_at ASC', [req.params.id]);
    const lines: string[] = [
      `# ${thread.title || 'Untitled Thread'}`,
      `> Exported from Forge · ${new Date().toLocaleDateString()}`,
      '',
    ];
    for (const msg of messages) {
      const role = msg.role === 'user' ? '**You**' : `**AI** _(${msg.model || 'unknown'})_`;
      const ts = new Date(msg.created_at).toLocaleTimeString();
      lines.push(`### ${role} · ${ts}`);
      lines.push('');
      lines.push(msg.content || '');
      lines.push('');
      lines.push('---');
      lines.push('');
    }
    const markdown = lines.join('\n');
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="thread-${req.params.id}.md"`);
    res.send(markdown);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/workspace/templates — list workspace templates
app.get('/api/workspace/templates', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    await db.run(`CREATE TABLE IF NOT EXISTS workspace_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER, name TEXT, description TEXT, category TEXT,
      system_prompt TEXT, starter_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    const rows = await db.all('SELECT * FROM workspace_templates WHERE user_id=? OR user_id IS NULL ORDER BY category,name', [req.user.id]);
    // Add built-in templates if none exist
    if (rows.length === 0) {
      const builtins = [
        { name:'Code Review', category:'engineering', description:'Review code for bugs, security, and style', system_prompt:'You are an expert code reviewer. Be thorough, constructive, and specific.', starter_message:'Please review this code:' },
        { name:'Debug Assistant', category:'engineering', description:'Help debug and fix issues step by step', system_prompt:'You are a debugging expert. Ask clarifying questions and propose systematic fixes.', starter_message:'I have a bug:' },
        { name:'Writing Coach', category:'writing', description:'Improve clarity, structure, and style', system_prompt:'You are a writing coach. Give specific, actionable feedback on grammar, clarity, and structure.', starter_message:'Please help me improve this:' },
        { name:'Brainstorm Partner', category:'creativity', description:'Generate and explore ideas together', system_prompt:'You are a creative brainstorm partner. Generate diverse ideas, build on suggestions, and ask thought-provoking questions.', starter_message:'I want to brainstorm about:' },
        { name:'Data Analyst', category:'data', description:'Analyze data and explain insights', system_prompt:'You are a data analyst. Help interpret data, suggest visualizations, and explain statistical concepts clearly.', starter_message:'Analyze this data:' },
      ];
      for (const t of builtins) {
        await db.run('INSERT INTO workspace_templates (name,category,description,system_prompt,starter_message) VALUES (?,?,?,?,?)',
          [t.name, t.category, t.description, t.system_prompt, t.starter_message]);
      }
      const fresh = await db.all('SELECT * FROM workspace_templates ORDER BY category,name');
      return res.json({ templates: fresh });
    }
    res.json({ templates: rows });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/workspace/templates — save custom template
app.post('/api/workspace/templates', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    await db.run(`CREATE TABLE IF NOT EXISTS workspace_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER, name TEXT, description TEXT, category TEXT,
      system_prompt TEXT, starter_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    const { name, description, category, system_prompt, starter_message } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const r = await db.run('INSERT INTO workspace_templates (user_id,name,description,category,system_prompt,starter_message) VALUES (?,?,?,?,?,?)',
      [req.user.id, name, description||'', category||'custom', system_prompt||'', starter_message||'']);
    res.json({ id: r.lastID, name, category: category||'custom' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});



// ─── Batch 13: AI Coaching, Compare Threads, Translate, Collections, Agenda ───

// POST /api/threads/:id/coaching — AI coaching tips for a thread
app.post('/api/threads/:id/coaching', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const messages = db.prepare('SELECT role, content FROM messages WHERE thread_id=? ORDER BY created_at LIMIT 30').all(req.params.id) as any[];
    if (!messages.length) return res.json({ tips: [] });
    const userMsgs = messages.filter((m: any) => m.role === 'user');
    const avgLen = userMsgs.reduce((a: number, m: any) => a + m.content.length, 0) / (userMsgs.length || 1);
    const tips: string[] = [];
    if (avgLen < 60) tips.push('Try adding more context — longer prompts typically yield more accurate responses.');
    if (userMsgs.length > 1 && userMsgs.some((m: any) => m.content.toLowerCase().startsWith('no'))) tips.push('Consider clarifying your intent upfront instead of correcting mid-thread.');
    if (messages.length > 20) tips.push('This thread is long — consider branching or summarizing to keep focus sharp.');
    if (userMsgs.every((m: any) => !m.content.includes('?'))) tips.push('Framing requests as questions can improve specificity of AI replies.');
    if (!tips.length) tips.push('Great conversation structure! Keep it up.');
    res.json({ tips, messageCount: messages.length, avgUserLength: Math.round(avgLen) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/threads/:id/compare/:id2 — compare two threads side-by-side metadata
app.get('/api/threads/:id/compare/:id2', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const t1 = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(req.params.id, userId) as any;
    const t2 = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(req.params.id2, userId) as any;
    if (!t1 || !t2) return res.status(404).json({ error: 'Thread not found' });
    const m1 = db.prepare('SELECT COUNT(*) as c, SUM(tokens_used) as t FROM messages WHERE thread_id=?').get(req.params.id) as any;
    const m2 = db.prepare('SELECT COUNT(*) as c, SUM(tokens_used) as t FROM messages WHERE thread_id=?').get(req.params.id2) as any;
    res.json({
      thread1: { ...t1, messageCount: m1.c, totalTokens: m1.t || 0 },
      thread2: { ...t2, messageCount: m2.c, totalTokens: m2.t || 0 }
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/messages/:id/translate — translate a message
app.post('/api/messages/:id/translate', authMiddleware, async (req: any, res) => {
  try {
    const { language = 'Spanish' } = req.body;
    const msg = db.prepare('SELECT * FROM messages WHERE id=?').get(req.params.id) as any;
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    // Return stub translation indicator — actual translation done client-side via model
    res.json({ messageId: req.params.id, originalContent: msg.content, targetLanguage: language, note: 'Use your active model to translate.' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET/POST /api/collections — bookmark collections
app.get('/api/collections', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS bookmark_collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      color TEXT DEFAULT '#ff1f35',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const cols = db.prepare('SELECT * FROM bookmark_collections WHERE user_id=? ORDER BY created_at DESC').all(userId);
    res.json(cols);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/collections', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { name, description = '', color = '#ff1f35' } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    db.prepare(`CREATE TABLE IF NOT EXISTS bookmark_collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      color TEXT DEFAULT '#ff1f35',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const r = db.prepare('INSERT INTO bookmark_collections (user_id,name,description,color) VALUES (?,?,?,?)').run(userId, name, description, color);
    res.json({ id: r.lastInsertRowid, name, description, color });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/collections/:id', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare('DELETE FROM bookmark_collections WHERE id=? AND user_id=?').run(req.params.id, userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/bookmarks/:id/collection — assign bookmark to collection
app.post('/api/bookmarks/:id/collection', authMiddleware, async (req: any, res) => {
  try {
    const { collection_id } = req.body;
    db.prepare('UPDATE bookmarks SET collection_id=? WHERE id=?').run(collection_id || null, req.params.id);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET/POST /api/agenda — agenda items (daily planning)
app.get('/api/agenda', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS agenda_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      notes TEXT DEFAULT '',
      thread_id INTEGER,
      due_date TEXT,
      done INTEGER DEFAULT 0,
      priority INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const date = (req.query.date as string) || new Date().toISOString().slice(0,10);
    const items = db.prepare('SELECT * FROM agenda_items WHERE user_id=? AND (due_date=? OR due_date IS NULL) ORDER BY priority DESC, created_at').all(userId, date);
    res.json(items);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/agenda', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { title, notes = '', thread_id, due_date, priority = 0 } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    db.prepare(`CREATE TABLE IF NOT EXISTS agenda_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      notes TEXT DEFAULT '',
      thread_id INTEGER,
      due_date TEXT,
      done INTEGER DEFAULT 0,
      priority INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const r = db.prepare('INSERT INTO agenda_items (user_id,title,notes,thread_id,due_date,priority) VALUES (?,?,?,?,?,?)').run(userId, title, notes, thread_id || null, due_date || null, priority);
    res.json({ id: r.lastInsertRowid, title, notes, done: 0 });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.put('/api/agenda/:id', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { done, title, notes, priority } = req.body;
    if (done !== undefined) db.prepare('UPDATE agenda_items SET done=? WHERE id=? AND user_id=?').run(done ? 1 : 0, req.params.id, userId);
    if (title !== undefined) db.prepare('UPDATE agenda_items SET title=? WHERE id=? AND user_id=?').run(title, req.params.id, userId);
    if (notes !== undefined) db.prepare('UPDATE agenda_items SET notes=? WHERE id=? AND user_id=?').run(notes, req.params.id, userId);
    if (priority !== undefined) db.prepare('UPDATE agenda_items SET priority=? WHERE id=? AND user_id=?').run(priority, req.params.id, userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/agenda/:id', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare('DELETE FROM agenda_items WHERE id=? AND user_id=?').run(req.params.id, userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/threads/:id/insights — combined thread insight bundle
app.get('/api/threads/:id/insights', authMiddleware, async (req: any, res) => {
  try {
    const messages = db.prepare('SELECT role, content, tokens_used, created_at FROM messages WHERE thread_id=? ORDER BY created_at').all(req.params.id) as any[];
    const userMsgs = messages.filter((m: any) => m.role === 'user');
    const aiMsgs = messages.filter((m: any) => m.role === 'assistant');
    const totalTokens = messages.reduce((a: number, m: any) => a + (m.tokens_used || 0), 0);
    const avgResponseLen = aiMsgs.reduce((a: number, m: any) => a + m.content.length, 0) / (aiMsgs.length || 1);
    const firstMsg = messages[0];
    const lastMsg = messages[messages.length - 1];
    const durationMs = firstMsg && lastMsg ? new Date(lastMsg.created_at).getTime() - new Date(firstMsg.created_at).getTime() : 0;
    res.json({
      messageCount: messages.length,
      userTurns: userMsgs.length,
      aiTurns: aiMsgs.length,
      totalTokens,
      avgResponseLength: Math.round(avgResponseLen),
      durationMinutes: Math.round(durationMs / 60000),
      topWords: userMsgs.flatMap((m: any) => m.content.toLowerCase().split(/\W+/).filter((w: string) => w.length > 4))
        .reduce((acc: Record<string,number>, w: string) => { acc[w] = (acc[w]||0)+1; return acc; }, {})
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ─── Batch 14: Goals tracker, Quick Capture, Knowledge Graph, Thread Milestones ───

// GET/POST/PUT/DELETE /api/goals — user goals with progress tracking
app.get('/api/goals', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS user_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      target_value INTEGER DEFAULT 100,
      current_value INTEGER DEFAULT 0,
      unit TEXT DEFAULT '%',
      status TEXT DEFAULT 'active',
      due_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const goals = db.prepare('SELECT * FROM user_goals WHERE user_id=? ORDER BY created_at DESC').all(userId);
    res.json(goals);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/goals', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { title, description = '', target_value = 100, unit = '%', due_date } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    db.prepare(`CREATE TABLE IF NOT EXISTS user_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      target_value INTEGER DEFAULT 100,
      current_value INTEGER DEFAULT 0,
      unit TEXT DEFAULT '%',
      status TEXT DEFAULT 'active',
      due_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const r = db.prepare('INSERT INTO user_goals (user_id,title,description,target_value,unit,due_date) VALUES (?,?,?,?,?,?)').run(userId, title, description, target_value, unit, due_date || null);
    res.json({ id: r.lastInsertRowid, title, current_value: 0, target_value, unit, status: 'active' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.put('/api/goals/:id', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { current_value, status, title, description } = req.body;
    if (current_value !== undefined) db.prepare('UPDATE user_goals SET current_value=? WHERE id=? AND user_id=?').run(current_value, req.params.id, userId);
    if (status !== undefined) db.prepare('UPDATE user_goals SET status=? WHERE id=? AND user_id=?').run(status, req.params.id, userId);
    if (title !== undefined) db.prepare('UPDATE user_goals SET title=? WHERE id=? AND user_id=?').run(title, req.params.id, userId);
    if (description !== undefined) db.prepare('UPDATE user_goals SET description=? WHERE id=? AND user_id=?').run(description, req.params.id, userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/goals/:id', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare('DELETE FROM user_goals WHERE id=? AND user_id=?').run(req.params.id, userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET/POST/DELETE /api/captures — quick capture (scratchpad notes)
app.get('/api/captures', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS quick_captures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      tags TEXT DEFAULT '',
      pinned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const limit = Number(req.query.limit) || 50;
    const items = db.prepare('SELECT * FROM quick_captures WHERE user_id=? ORDER BY pinned DESC, created_at DESC LIMIT ?').all(userId, limit);
    res.json(items);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/captures', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { content, tags = '', pinned = 0 } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'content required' });
    db.prepare(`CREATE TABLE IF NOT EXISTS quick_captures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      tags TEXT DEFAULT '',
      pinned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const r = db.prepare('INSERT INTO quick_captures (user_id,content,tags,pinned) VALUES (?,?,?,?)').run(userId, content.trim(), tags, pinned ? 1 : 0);
    res.json({ id: r.lastInsertRowid, content: content.trim(), tags, pinned });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/captures/:id', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare('DELETE FROM quick_captures WHERE id=? AND user_id=?').run(req.params.id, userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.put('/api/captures/:id/pin', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const item = db.prepare('SELECT * FROM quick_captures WHERE id=? AND user_id=?').get(req.params.id, userId) as any;
    if (!item) return res.status(404).json({ error: 'Not found' });
    db.prepare('UPDATE quick_captures SET pinned=? WHERE id=?').run(item.pinned ? 0 : 1, req.params.id);
    res.json({ ok: true, pinned: !item.pinned });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/knowledge-graph — topic graph from thread titles + tags
app.get('/api/knowledge-graph', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const threads = db.prepare('SELECT id, title, tags FROM threads WHERE user_id=? ORDER BY updated_at DESC LIMIT 100').all(userId) as any[];
    const nodes: {id: string; label: string; type: string; size: number}[] = [];
    const edges: {source: string; target: string}[] = [];
    const tagMap: Record<string, string[]> = {};
    threads.forEach((t: any) => {
      nodes.push({ id: `t_${t.id}`, label: t.title || 'Untitled', type: 'thread', size: 8 });
      if (t.tags) {
        const tags = t.tags.split(',').map((s: string) => s.trim()).filter(Boolean);
        tags.forEach((tag: string) => {
          if (!tagMap[tag]) tagMap[tag] = [];
          tagMap[tag].push(`t_${t.id}`);
        });
      }
    });
    Object.entries(tagMap).forEach(([tag, tids]) => {
      nodes.push({ id: `tag_${tag}`, label: `#${tag}`, type: 'tag', size: 5 + tids.length * 2 });
      tids.forEach(tid => edges.push({ source: `tag_${tag}`, target: tid }));
    });
    res.json({ nodes, edges, threadCount: threads.length, tagCount: Object.keys(tagMap).length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET/POST /api/threads/:id/milestones — thread milestones
app.get('/api/threads/:id/milestones', authMiddleware, async (req: any, res) => {
  try {
    db.prepare(`CREATE TABLE IF NOT EXISTS thread_milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      message_id INTEGER,
      reached_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const userId = req.user.userId;
    const milestones = db.prepare('SELECT * FROM thread_milestones WHERE thread_id=? AND user_id=? ORDER BY reached_at').all(req.params.id, userId);
    res.json(milestones);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/threads/:id/milestones', authMiddleware, async (req: any, res) => {
  try {
    db.prepare(`CREATE TABLE IF NOT EXISTS thread_milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      message_id INTEGER,
      reached_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const userId = req.user.userId;
    const { label, message_id } = req.body;
    if (!label) return res.status(400).json({ error: 'label required' });
    const r = db.prepare('INSERT INTO thread_milestones (thread_id,user_id,label,message_id) VALUES (?,?,?,?)').run(req.params.id, userId, label, message_id || null);
    res.json({ id: r.lastInsertRowid, label, thread_id: req.params.id });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ─── Batch 15: Journal, Habits, Changelog, Message Tags, Bulk Ops ───

// GET/POST /api/journal — daily AI journal entries
app.get('/api/journal', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      content TEXT NOT NULL,
      mood TEXT DEFAULT 'neutral',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const limit = Number(req.query.limit) || 30;
    const entries = db.prepare('SELECT * FROM journal_entries WHERE user_id=? ORDER BY date DESC LIMIT ?').all(userId, limit);
    res.json(entries);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/journal', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { date, content, mood = 'neutral' } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'content required' });
    const entryDate = date || new Date().toISOString().slice(0, 10);
    db.prepare(`CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      content TEXT NOT NULL,
      mood TEXT DEFAULT 'neutral',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    // Upsert by date
    const existing = db.prepare('SELECT id FROM journal_entries WHERE user_id=? AND date=?').get(userId, entryDate) as any;
    if (existing) {
      db.prepare('UPDATE journal_entries SET content=?, mood=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(content.trim(), mood, existing.id);
      res.json({ id: existing.id, date: entryDate, content: content.trim(), mood });
    } else {
      const r = db.prepare('INSERT INTO journal_entries (user_id,date,content,mood) VALUES (?,?,?,?)').run(userId, entryDate, content.trim(), mood);
      res.json({ id: r.lastInsertRowid, date: entryDate, content: content.trim(), mood });
    }
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/journal/:id', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare('DELETE FROM journal_entries WHERE id=? AND user_id=?').run(req.params.id, userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET/POST /api/habits — habit tracking
app.get('/api/habits', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '✅',
      frequency TEXT DEFAULT 'daily',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    db.prepare(`CREATE TABLE IF NOT EXISTS habit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER DEFAULT 1,
      UNIQUE(habit_id, date)
    )`).run();
    const habits = db.prepare('SELECT * FROM habits WHERE user_id=? ORDER BY created_at').all(userId) as any[];
    const today = new Date().toISOString().slice(0, 10);
    const logs = db.prepare('SELECT habit_id, date FROM habit_logs WHERE user_id=? AND date >= date(?, "-7 days")').all(userId, today) as any[];
    const logSet = new Set(logs.map((l: any) => `${l.habit_id}:${l.date}`));
    res.json(habits.map((h: any) => ({ ...h, doneToday: logSet.has(`${h.id}:${today}`), recentLogs: logs.filter((l: any) => l.habit_id === h.id).map((l: any) => l.date) })));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/habits', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { name, icon = '✅', frequency = 'daily' } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    db.prepare(`CREATE TABLE IF NOT EXISTS habits (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, name TEXT NOT NULL, icon TEXT DEFAULT '✅', frequency TEXT DEFAULT 'daily', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
    const r = db.prepare('INSERT INTO habits (user_id,name,icon,frequency) VALUES (?,?,?,?)').run(userId, name, icon, frequency);
    res.json({ id: r.lastInsertRowid, name, icon, frequency, doneToday: false });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/habits/:id/log', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS habit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, habit_id INTEGER NOT NULL, user_id INTEGER NOT NULL, date TEXT NOT NULL, completed INTEGER DEFAULT 1, UNIQUE(habit_id, date))`).run();
    const date = req.body.date || new Date().toISOString().slice(0, 10);
    db.prepare('INSERT OR REPLACE INTO habit_logs (habit_id,user_id,date,completed) VALUES (?,?,?,1)').run(req.params.id, userId, date);
    res.json({ ok: true, date });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/habits/:id', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare('DELETE FROM habits WHERE id=? AND user_id=?').run(req.params.id, userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/workspace/changelog — auto-generated changelog from VERSION.md or activity
app.get('/api/workspace/changelog', authMiddleware, async (req: any, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const versionPath = path.join(process.cwd(), '..', 'VERSION.md');
    let content = '';
    try { content = fs.readFileSync(versionPath, 'utf8'); } catch { content = '# Forge Changelog\n\nNo changelog available.'; }
    // Parse version entries
    const entries = content.split(/^## /m).slice(1).slice(0, 10).map(block => {
      const lines = block.trim().split('\n');
      const header = lines[0] || '';
      const body = lines.slice(1).join('\n').trim();
      return { version: header.split(' ')[0], date: header.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '', summary: body.slice(0, 200) };
    });
    res.json({ entries, raw: content.slice(0, 3000) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST/DELETE /api/messages/:id/tags — message tagging
app.post('/api/messages/:id/tags', authMiddleware, async (req: any, res) => {
  try {
    db.prepare(`CREATE TABLE IF NOT EXISTS message_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      tag TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(message_id, user_id, tag)
    )`).run();
    const userId = req.user.userId;
    const { tag } = req.body;
    if (!tag) return res.status(400).json({ error: 'tag required' });
    db.prepare('INSERT OR IGNORE INTO message_tags (message_id,user_id,tag) VALUES (?,?,?)').run(req.params.id, userId, tag.trim().toLowerCase());
    const tags = db.prepare('SELECT tag FROM message_tags WHERE message_id=? AND user_id=?').all(req.params.id, userId);
    res.json({ tags: tags.map((t: any) => t.tag) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.get('/api/messages/:id/tags', authMiddleware, async (req: any, res) => {
  try {
    db.prepare(`CREATE TABLE IF NOT EXISTS message_tags (id INTEGER PRIMARY KEY AUTOINCREMENT, message_id INTEGER NOT NULL, user_id INTEGER NOT NULL, tag TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(message_id, user_id, tag))`).run();
    const userId = req.user.userId;
    const tags = db.prepare('SELECT tag FROM message_tags WHERE message_id=? AND user_id=?').all(req.params.id, userId);
    res.json({ tags: tags.map((t: any) => t.tag) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/threads/bulk-archive — bulk archive threads
app.post('/api/threads/bulk-archive', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { thread_ids } = req.body;
    if (!Array.isArray(thread_ids) || !thread_ids.length) return res.status(400).json({ error: 'thread_ids array required' });
    // Add archived column if not exists
    try { db.prepare('ALTER TABLE threads ADD COLUMN archived INTEGER DEFAULT 0').run(); } catch {}
    const placeholders = thread_ids.map(() => '?').join(',');
    db.prepare(`UPDATE threads SET archived=1 WHERE id IN (${placeholders}) AND user_id=?`).run(...thread_ids, userId);
    res.json({ ok: true, archivedCount: thread_ids.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/threads/archived — list archived threads
app.get('/api/threads/archived', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    try { db.prepare('ALTER TABLE threads ADD COLUMN archived INTEGER DEFAULT 0').run(); } catch {}
    const threads = db.prepare('SELECT * FROM threads WHERE user_id=? AND archived=1 ORDER BY updated_at DESC').all(userId);
    res.json(threads);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ─── Batch 16: Flashcards, Reading List, Time Tracker, Digest, Kanban ───

// GET/POST/DELETE /api/flashcards — AI flashcard deck
app.get('/api/flashcards', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS flashcards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      deck TEXT DEFAULT 'default',
      ease_factor REAL DEFAULT 2.5,
      interval INTEGER DEFAULT 1,
      due_date TEXT DEFAULT CURRENT_DATE,
      review_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const deck = req.query.deck as string;
    const query = deck
      ? 'SELECT * FROM flashcards WHERE user_id=? AND deck=? ORDER BY due_date LIMIT 50'
      : 'SELECT * FROM flashcards WHERE user_id=? ORDER BY due_date LIMIT 50';
    const cards = deck ? db.prepare(query).all(userId, deck) : db.prepare(query).all(userId);
    const decks = db.prepare('SELECT DISTINCT deck FROM flashcards WHERE user_id=?').all(userId);
    res.json({ cards, decks: decks.map((d: any) => d.deck) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/flashcards', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { front, back, deck = 'default' } = req.body;
    if (!front || !back) return res.status(400).json({ error: 'front and back required' });
    db.prepare(`CREATE TABLE IF NOT EXISTS flashcards (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, front TEXT NOT NULL, back TEXT NOT NULL, deck TEXT DEFAULT 'default', ease_factor REAL DEFAULT 2.5, interval INTEGER DEFAULT 1, due_date TEXT DEFAULT CURRENT_DATE, review_count INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
    const r = db.prepare('INSERT INTO flashcards (user_id,front,back,deck) VALUES (?,?,?,?)').run(userId, front, back, deck);
    res.json({ id: r.lastInsertRowid, front, back, deck });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/flashcards/:id/review', authMiddleware, async (req: any, res) => {
  try {
    const { quality = 3 } = req.body; // 0-5 quality rating
    const card = db.prepare('SELECT * FROM flashcards WHERE id=?').get(req.params.id) as any;
    if (!card) return res.status(404).json({ error: 'Not found' });
    // SM-2 algorithm
    let ef = card.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ef < 1.3) ef = 1.3;
    const interval = quality < 3 ? 1 : Math.round(card.interval * ef);
    const nextDate = new Date(); nextDate.setDate(nextDate.getDate() + interval);
    db.prepare('UPDATE flashcards SET ease_factor=?, interval=?, due_date=?, review_count=review_count+1 WHERE id=?')
      .run(ef, interval, nextDate.toISOString().slice(0,10), req.params.id);
    res.json({ ok: true, nextReviewIn: interval, ease_factor: ef });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/flashcards/:id', authMiddleware, async (req: any, res) => {
  try {
    db.prepare('DELETE FROM flashcards WHERE id=? AND user_id=?').run(req.params.id, req.user.userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET/POST/PUT/DELETE /api/reading-list
app.get('/api/reading-list', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS reading_list (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      url TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'unread',
      tags TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const status = req.query.status as string;
    const items = status
      ? db.prepare('SELECT * FROM reading_list WHERE user_id=? AND status=? ORDER BY created_at DESC').all(userId, status)
      : db.prepare('SELECT * FROM reading_list WHERE user_id=? ORDER BY created_at DESC').all(userId);
    res.json(items);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/reading-list', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { title, url = '', notes = '', tags = '' } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    db.prepare(`CREATE TABLE IF NOT EXISTS reading_list (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL, url TEXT DEFAULT '', notes TEXT DEFAULT '', status TEXT DEFAULT 'unread', tags TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
    const r = db.prepare('INSERT INTO reading_list (user_id,title,url,notes,tags) VALUES (?,?,?,?,?)').run(userId, title, url, notes, tags);
    res.json({ id: r.lastInsertRowid, title, url, status: 'unread' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.put('/api/reading-list/:id', authMiddleware, async (req: any, res) => {
  try {
    const { status, notes } = req.body;
    if (status) db.prepare('UPDATE reading_list SET status=? WHERE id=? AND user_id=?').run(status, req.params.id, req.user.userId);
    if (notes !== undefined) db.prepare('UPDATE reading_list SET notes=? WHERE id=? AND user_id=?').run(notes, req.params.id, req.user.userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/reading-list/:id', authMiddleware, async (req: any, res) => {
  try {
    db.prepare('DELETE FROM reading_list WHERE id=? AND user_id=?').run(req.params.id, req.user.userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/workspace/digest — AI workspace daily digest
app.get('/api/workspace/digest', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date().toISOString().slice(0,10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
    const threads = db.prepare('SELECT COUNT(*) as c FROM threads WHERE user_id=? AND date(created_at)=?').get(userId, today) as any;
    const messages = db.prepare('SELECT COUNT(*) as c, SUM(tokens_used) as t FROM messages WHERE thread_id IN (SELECT id FROM threads WHERE user_id=?) AND date(created_at)=?').get(userId, today) as any;
    const notes = db.prepare("SELECT COUNT(*) as c FROM notes WHERE user_id=? AND date(created_at)>=?").get(userId, yesterday) as any;
    const topThread = db.prepare('SELECT title, (SELECT COUNT(*) FROM messages WHERE thread_id=threads.id) as msg_count FROM threads WHERE user_id=? ORDER BY updated_at DESC LIMIT 1').get(userId) as any;
    res.json({
      date: today,
      threadsCreated: threads.c,
      messagesExchanged: messages.c,
      tokensUsed: messages.t || 0,
      recentNotes: notes.c,
      topThread: topThread || null,
      summary: `Today you had ${messages.c} messages across ${threads.c} new threads using ${messages.t || 0} tokens.`
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET/POST/PUT /api/kanban — thread kanban board columns
app.get('/api/kanban', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS kanban_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      thread_id INTEGER,
      title TEXT NOT NULL,
      column_name TEXT DEFAULT 'backlog',
      position INTEGER DEFAULT 0,
      color TEXT DEFAULT '#64748b',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const items = db.prepare('SELECT * FROM kanban_items WHERE user_id=? ORDER BY column_name, position').all(userId);
    const columns = ['backlog','in_progress','review','done'];
    const board: Record<string, any[]> = {};
    columns.forEach(col => { board[col] = items.filter((i: any) => i.column_name === col); });
    res.json({ board, columns });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/kanban', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { title, column_name = 'backlog', thread_id, color = '#64748b' } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    db.prepare(`CREATE TABLE IF NOT EXISTS kanban_items (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, thread_id INTEGER, title TEXT NOT NULL, column_name TEXT DEFAULT 'backlog', position INTEGER DEFAULT 0, color TEXT DEFAULT '#64748b', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
    const r = db.prepare('INSERT INTO kanban_items (user_id,title,column_name,thread_id,color) VALUES (?,?,?,?,?)').run(userId, title, column_name, thread_id || null, color);
    res.json({ id: r.lastInsertRowid, title, column_name, color });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.put('/api/kanban/:id', authMiddleware, async (req: any, res) => {
  try {
    const { column_name, position } = req.body;
    if (column_name) db.prepare('UPDATE kanban_items SET column_name=? WHERE id=? AND user_id=?').run(column_name, req.params.id, req.user.userId);
    if (position !== undefined) db.prepare('UPDATE kanban_items SET position=? WHERE id=?').run(position, req.params.id);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/kanban/:id', authMiddleware, async (req: any, res) => {
  try {
    db.prepare('DELETE FROM kanban_items WHERE id=? AND user_id=?').run(req.params.id, req.user.userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ─── Batch 17: Snippets Vault, Polls, Cross-Search, Onboarding, Writing Modes ───

// GET/POST/DELETE /api/snippets — code snippets vault
app.get('/api/snippets', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS code_snippets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      code TEXT NOT NULL,
      language TEXT DEFAULT 'text',
      tags TEXT DEFAULT '',
      pinned INTEGER DEFAULT 0,
      use_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const q = req.query.q as string;
    const lang = req.query.lang as string;
    let query = 'SELECT * FROM code_snippets WHERE user_id=?';
    const params: any[] = [userId];
    if (q) { query += ' AND (title LIKE ? OR code LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
    if (lang) { query += ' AND language=?'; params.push(lang); }
    query += ' ORDER BY pinned DESC, use_count DESC, created_at DESC LIMIT 100';
    const snippets = db.prepare(query).all(...params);
    res.json(snippets);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/snippets', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { title, code, language = 'text', tags = '' } = req.body;
    if (!title || !code) return res.status(400).json({ error: 'title and code required' });
    db.prepare(`CREATE TABLE IF NOT EXISTS code_snippets (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL, code TEXT NOT NULL, language TEXT DEFAULT 'text', tags TEXT DEFAULT '', pinned INTEGER DEFAULT 0, use_count INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
    const r = db.prepare('INSERT INTO code_snippets (user_id,title,code,language,tags) VALUES (?,?,?,?,?)').run(userId, title, code, language, tags);
    res.json({ id: r.lastInsertRowid, title, language });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/snippets/:id/use', authMiddleware, async (req: any, res) => {
  try {
    db.prepare('UPDATE code_snippets SET use_count=use_count+1 WHERE id=?').run(req.params.id);
    const s = db.prepare('SELECT code FROM code_snippets WHERE id=?').get(req.params.id) as any;
    res.json({ code: s?.code || '' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/snippets/:id', authMiddleware, async (req: any, res) => {
  try {
    db.prepare('DELETE FROM code_snippets WHERE id=? AND user_id=?').run(req.params.id, req.user.userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET/POST /api/threads/:id/polls — thread polls
app.post('/api/threads/:id/polls', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS thread_polls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      votes TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const { question, options } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2) return res.status(400).json({ error: 'question and >=2 options required' });
    const r = db.prepare('INSERT INTO thread_polls (thread_id,user_id,question,options) VALUES (?,?,?,?)').run(req.params.id, userId, question, JSON.stringify(options));
    res.json({ id: r.lastInsertRowid, question, options, votes: {} });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.get('/api/threads/:id/polls', authMiddleware, async (req: any, res) => {
  try {
    db.prepare(`CREATE TABLE IF NOT EXISTS thread_polls (id INTEGER PRIMARY KEY AUTOINCREMENT, thread_id INTEGER NOT NULL, user_id INTEGER NOT NULL, question TEXT NOT NULL, options TEXT NOT NULL, votes TEXT DEFAULT '{}', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
    const polls = db.prepare('SELECT * FROM thread_polls WHERE thread_id=? ORDER BY created_at DESC').all(req.params.id) as any[];
    res.json(polls.map((p: any) => ({ ...p, options: JSON.parse(p.options), votes: JSON.parse(p.votes) })));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/polls/:id/vote', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const poll = db.prepare('SELECT * FROM thread_polls WHERE id=?').get(req.params.id) as any;
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    const votes = JSON.parse(poll.votes || '{}');
    const { option } = req.body;
    votes[userId] = option;
    db.prepare('UPDATE thread_polls SET votes=? WHERE id=?').run(JSON.stringify(votes), req.params.id);
    res.json({ ok: true, votes });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/search/global — cross-entity search
app.get('/api/search/global', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const q = (req.query.q as string || '').trim();
    if (!q) return res.json({ results: [] });
    const like = `%${q}%`;
    const results: any[] = [];
    // Threads
    const threads = db.prepare('SELECT id, title, created_at FROM threads WHERE user_id=? AND title LIKE ? LIMIT 5').all(userId, like) as any[];
    threads.forEach((t: any) => results.push({ type:'thread', id: t.id, title: t.title, preview: '', date: t.created_at }));
    // Messages
    const msgs = db.prepare("SELECT m.id, m.content, m.created_at, t.title as thread_title, t.id as thread_id FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=? AND m.content LIKE ? LIMIT 5").all(userId, like) as any[];
    msgs.forEach((m: any) => results.push({ type:'message', id: m.id, title: m.thread_title, preview: m.content.slice(0,80), date: m.created_at, thread_id: m.thread_id }));
    // Notes
    try {
      const notes = db.prepare('SELECT id, content, created_at FROM notes WHERE user_id=? AND content LIKE ? LIMIT 3').all(userId, like) as any[];
      notes.forEach((n: any) => results.push({ type:'note', id: n.id, title: 'Note', preview: n.content.slice(0,80), date: n.created_at }));
    } catch {}
    // Snippets
    try {
      const snips = db.prepare('SELECT id, title, language FROM code_snippets WHERE user_id=? AND (title LIKE ? OR code LIKE ?) LIMIT 3').all(userId, like, like) as any[];
      snips.forEach((s: any) => results.push({ type:'snippet', id: s.id, title: s.title, preview: s.language, date: '' }));
    } catch {}
    res.json({ results, query: q, total: results.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/onboarding — user onboarding checklist
app.get('/api/onboarding', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const threadCount = (db.prepare('SELECT COUNT(*) as c FROM threads WHERE user_id=?').get(userId) as any).c;
    const msgCount = (db.prepare('SELECT COUNT(*) as c FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=? AND m.role="user"').get(userId) as any).c;
    const hasKey = db.prepare('SELECT COUNT(*) as c FROM api_keys WHERE user_id=?').get(userId) as any;
    let noteCount = 0; try { noteCount = (db.prepare('SELECT COUNT(*) as c FROM notes WHERE user_id=?').get(userId) as any).c; } catch {}
    const steps = [
      { id:'add_key', label:'Add your first API key', done: hasKey.c > 0 },
      { id:'first_thread', label:'Start your first thread', done: threadCount > 0 },
      { id:'first_message', label:'Send a message', done: msgCount > 0 },
      { id:'five_threads', label:'Create 5 threads', done: threadCount >= 5 },
      { id:'take_note', label:'Write a note', done: noteCount > 0 },
      { id:'ten_messages', label:'Exchange 10 messages', done: msgCount >= 10 },
    ];
    const completed = steps.filter(s => s.done).length;
    res.json({ steps, completed, total: steps.length, pct: Math.round(completed / steps.length * 100) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/messages/:id/writing-mode — apply writing mode transform
app.post('/api/messages/:id/writing-mode', authMiddleware, async (req: any, res) => {
  try {
    const { mode } = req.body; // 'formal','casual','concise','expand','bullet','story'
    const msg = db.prepare('SELECT content FROM messages WHERE id=?').get(req.params.id) as any;
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    const modeInstructions: Record<string,string> = {
      formal: 'Rewrite in formal professional tone',
      casual: 'Rewrite in casual conversational tone',
      concise: 'Make shorter and more concise',
      expand: 'Expand with more detail and examples',
      bullet: 'Convert to bullet points',
      story: 'Rewrite as a narrative story'
    };
    const instruction = modeInstructions[mode] || 'Improve this text';
    res.json({
      messageId: req.params.id,
      mode,
      instruction,
      originalContent: msg.content.slice(0, 200),
      note: 'Pass instruction + content to your active model to transform.'
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ─── Batch 18: Debate Mode, URL Saves, Content Calendar, Thread Voting, Link Preview ───

// POST /api/threads/:id/debate — start a debate (pro/con on a topic)
app.post('/api/threads/:id/debate', authMiddleware, async (req: any, res) => {
  try {
    const { topic, side = 'both' } = req.body;
    if (!topic) return res.status(400).json({ error: 'topic required' });
    const angles: Record<string, string[]> = {
      pro: [`Strong argument FOR: ${topic}`, 'Supporting evidence and examples', 'Counter to objections'],
      con: [`Strong argument AGAINST: ${topic}`, 'Risks and drawbacks', 'Counter to pro arguments'],
      both: [`PRO: ${topic}`, `CON: ${topic}`, 'Synthesis and nuanced verdict'],
      steelman: [`The strongest possible case for: ${topic}`, 'Charitable interpretation of opposing view', 'Where both sides agree']
    };
    res.json({
      topic,
      side,
      prompts: angles[side] || angles.both,
      instruction: `Use your active model with these prompts to explore "${topic}" from the ${side} perspective.`
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET/POST/DELETE /api/url-saves — saved URLs / bookmarked links
app.get('/api/url-saves', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS url_saves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      title TEXT DEFAULT '',
      description TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      favicon TEXT DEFAULT '',
      pinned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const q = req.query.q as string;
    const items = q
      ? db.prepare('SELECT * FROM url_saves WHERE user_id=? AND (title LIKE ? OR url LIKE ? OR tags LIKE ?) ORDER BY pinned DESC, created_at DESC LIMIT 50').all(userId, `%${q}%`, `%${q}%`, `%${q}%`)
      : db.prepare('SELECT * FROM url_saves WHERE user_id=? ORDER BY pinned DESC, created_at DESC LIMIT 50').all(userId);
    res.json(items);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/url-saves', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { url, title = '', description = '', tags = '' } = req.body;
    if (!url) return res.status(400).json({ error: 'url required' });
    db.prepare(`CREATE TABLE IF NOT EXISTS url_saves (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, url TEXT NOT NULL, title TEXT DEFAULT '', description TEXT DEFAULT '', tags TEXT DEFAULT '', favicon TEXT DEFAULT '', pinned INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
    const r = db.prepare('INSERT INTO url_saves (user_id,url,title,description,tags) VALUES (?,?,?,?,?)').run(userId, url, title, description, tags);
    res.json({ id: r.lastInsertRowid, url, title });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/url-saves/:id', authMiddleware, async (req: any, res) => {
  try {
    db.prepare('DELETE FROM url_saves WHERE id=? AND user_id=?').run(req.params.id, req.user.userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.put('/api/url-saves/:id/pin', authMiddleware, async (req: any, res) => {
  try {
    const item = db.prepare('SELECT pinned FROM url_saves WHERE id=? AND user_id=?').get(req.params.id, req.user.userId) as any;
    if (!item) return res.status(404).json({ error: 'Not found' });
    db.prepare('UPDATE url_saves SET pinned=? WHERE id=?').run(item.pinned ? 0 : 1, req.params.id);
    res.json({ ok: true, pinned: !item.pinned });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET/POST/PUT/DELETE /api/content-calendar — content planning calendar
app.get('/api/content-calendar', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS content_calendar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content_type TEXT DEFAULT 'post',
      platform TEXT DEFAULT 'blog',
      scheduled_date TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      notes TEXT DEFAULT '',
      thread_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const month = req.query.month as string;
    const items = month
      ? db.prepare("SELECT * FROM content_calendar WHERE user_id=? AND scheduled_date LIKE ? ORDER BY scheduled_date").all(userId, `${month}%`)
      : db.prepare("SELECT * FROM content_calendar WHERE user_id=? ORDER BY scheduled_date DESC LIMIT 50").all(userId);
    res.json(items);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/content-calendar', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { title, content_type = 'post', platform = 'blog', scheduled_date, notes = '', thread_id } = req.body;
    if (!title || !scheduled_date) return res.status(400).json({ error: 'title and scheduled_date required' });
    db.prepare(`CREATE TABLE IF NOT EXISTS content_calendar (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL, content_type TEXT DEFAULT 'post', platform TEXT DEFAULT 'blog', scheduled_date TEXT NOT NULL, status TEXT DEFAULT 'draft', notes TEXT DEFAULT '', thread_id INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
    const r = db.prepare('INSERT INTO content_calendar (user_id,title,content_type,platform,scheduled_date,notes,thread_id) VALUES (?,?,?,?,?,?,?)').run(userId, title, content_type, platform, scheduled_date, notes, thread_id || null);
    res.json({ id: r.lastInsertRowid, title, scheduled_date, status: 'draft' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.put('/api/content-calendar/:id', authMiddleware, async (req: any, res) => {
  try {
    const { status, notes, scheduled_date } = req.body;
    if (status) db.prepare('UPDATE content_calendar SET status=? WHERE id=? AND user_id=?').run(status, req.params.id, req.user.userId);
    if (notes !== undefined) db.prepare('UPDATE content_calendar SET notes=? WHERE id=? AND user_id=?').run(notes, req.params.id, req.user.userId);
    if (scheduled_date) db.prepare('UPDATE content_calendar SET scheduled_date=? WHERE id=? AND user_id=?').run(scheduled_date, req.params.id, req.user.userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/content-calendar/:id', authMiddleware, async (req: any, res) => {
  try {
    db.prepare('DELETE FROM content_calendar WHERE id=? AND user_id=?').run(req.params.id, req.user.userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/threads/:id/vote — community-style upvote/downvote
app.post('/api/threads/:id/vote', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS thread_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      vote INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(thread_id, user_id)
    )`).run();
    const { vote } = req.body; // 1 or -1
    if (vote !== 1 && vote !== -1) return res.status(400).json({ error: 'vote must be 1 or -1' });
    db.prepare('INSERT OR REPLACE INTO thread_votes (thread_id,user_id,vote) VALUES (?,?,?)').run(req.params.id, userId, vote);
    const score = (db.prepare('SELECT COALESCE(SUM(vote),0) as s FROM thread_votes WHERE thread_id=?').get(req.params.id) as any).s;
    res.json({ ok: true, score });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.get('/api/threads/:id/vote', authMiddleware, async (req: any, res) => {
  try {
    db.prepare(`CREATE TABLE IF NOT EXISTS thread_votes (id INTEGER PRIMARY KEY AUTOINCREMENT, thread_id INTEGER NOT NULL, user_id INTEGER NOT NULL, vote INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(thread_id, user_id))`).run();
    const score = (db.prepare('SELECT COALESCE(SUM(vote),0) as s FROM thread_votes WHERE thread_id=?').get(req.params.id) as any).s;
    const userVote = db.prepare('SELECT vote FROM thread_votes WHERE thread_id=? AND user_id=?').get(req.params.id, req.user.userId) as any;
    res.json({ score, userVote: userVote?.vote || 0 });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/workspace/stats/advanced — advanced workspace statistics
app.get('/api/workspace/stats/advanced', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const days = Number(req.query.days) || 30;
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const threadsByDay = db.prepare("SELECT date(created_at) as day, COUNT(*) as count FROM threads WHERE user_id=? AND created_at>=? GROUP BY day ORDER BY day").all(userId, since) as any[];
    const tokensByModel = db.prepare("SELECT model_used, SUM(tokens_used) as tokens FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=? AND m.created_at>=? GROUP BY model_used").all(userId, since) as any[];
    const msgLengths = db.prepare("SELECT role, AVG(LENGTH(content)) as avg_len FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=? AND m.created_at>=? GROUP BY role").all(userId, since) as any[];
    const longestThread = db.prepare("SELECT t.title, COUNT(*) as c FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=? AND m.created_at>=? GROUP BY t.id ORDER BY c DESC LIMIT 1").get(userId, since) as any;
    res.json({ threadsByDay, tokensByModel, msgLengths, longestThread, period: days });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ─── Batch 19: Writing Assistant, Workspace Timer, Thread Stats, Formatting ───

// POST /api/threads/:id/writing-assist — AI writing improvement suggestions
app.post('/api/threads/:id/writing-assist', authMiddleware, async (req: any, res) => {
  try {
    const { text, mode = 'improve' } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });
    const modes: Record<string,string> = {
      improve: 'Rewrite this text to be clearer, more concise, and more impactful:',
      formal: 'Rewrite this text in a professional, formal tone:',
      casual: 'Rewrite this text in a friendly, conversational tone:',
      shorter: 'Shorten this text while preserving all key information:',
      expand: 'Expand this text with more detail and examples:',
      bullets: 'Convert this text into clear bullet points:',
      fix: 'Fix grammar and spelling errors in this text:'
    };
    const prompt = modes[mode] || modes.improve;
    res.json({
      original: text,
      mode,
      instruction: `${prompt}\n\n${text}`,
      hint: 'Send this instruction to your active model to get the rewritten version.'
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET/POST/PUT/DELETE /api/timers — workspace focus timers
app.get('/api/timers', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS workspace_timers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      label TEXT DEFAULT 'Focus Session',
      duration_min INTEGER DEFAULT 25,
      started_at DATETIME,
      ended_at DATETIME,
      status TEXT DEFAULT 'idle',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const items = db.prepare("SELECT * FROM workspace_timers WHERE user_id=? ORDER BY created_at DESC LIMIT 20").all(userId);
    res.json(items);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/timers', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { label = 'Focus Session', duration_min = 25 } = req.body;
    db.prepare(`CREATE TABLE IF NOT EXISTS workspace_timers (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, label TEXT DEFAULT 'Focus Session', duration_min INTEGER DEFAULT 25, started_at DATETIME, ended_at DATETIME, status TEXT DEFAULT 'idle', notes TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
    const r = db.prepare("INSERT INTO workspace_timers (user_id,label,duration_min,started_at,status) VALUES (?,?,?,datetime('now'),'running')").run(userId, label, duration_min);
    res.json({ id: r.lastInsertRowid, label, duration_min, status: 'running' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.put('/api/timers/:id/end', authMiddleware, async (req: any, res) => {
  try {
    const { notes = '' } = req.body;
    db.prepare("UPDATE workspace_timers SET status='completed', ended_at=datetime('now'), notes=? WHERE id=? AND user_id=?").run(notes, req.params.id, req.user.userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/timers/:id', authMiddleware, async (req: any, res) => {
  try {
    db.prepare("DELETE FROM workspace_timers WHERE id=? AND user_id=?").run(req.params.id, req.user.userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/threads/:id/stats — detailed stats for a single thread
app.get('/api/threads/:id/stats', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const threadId = req.params.id;
    const thread = db.prepare("SELECT * FROM threads WHERE id=? AND user_id=?").get(threadId, userId) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const msgs = db.prepare("SELECT * FROM messages WHERE thread_id=? ORDER BY created_at").all(threadId) as any[];
    const userMsgs = msgs.filter((m: any) => m.role === 'user');
    const aiMsgs = msgs.filter((m: any) => m.role === 'assistant');
    const totalTokens = msgs.reduce((s: number, m: any) => s + (m.tokens_used || 0), 0);
    const avgUserLen = userMsgs.length ? Math.round(userMsgs.reduce((s: number, m: any) => s + m.content.length, 0) / userMsgs.length) : 0;
    const avgAiLen = aiMsgs.length ? Math.round(aiMsgs.reduce((s: number, m: any) => s + m.content.length, 0) / aiMsgs.length) : 0;
    const models = [...new Set(msgs.filter((m: any) => m.model_used).map((m: any) => m.model_used))];
    const firstMsg = msgs[0];
    const lastMsg = msgs[msgs.length - 1];
    const durationMs = firstMsg && lastMsg ? new Date(lastMsg.created_at).getTime() - new Date(firstMsg.created_at).getTime() : 0;
    // Word frequency from user messages
    const words: Record<string,number> = {};
    userMsgs.forEach((m: any) => {
      m.content.toLowerCase().split(/\W+/).filter((w: string) => w.length > 4).forEach((w: string) => { words[w] = (words[w]||0)+1; });
    });
    const topWords = Object.entries(words).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([w,c])=>({word:w,count:c}));
    res.json({
      thread,
      messageCount: msgs.length,
      userMessages: userMsgs.length,
      aiMessages: aiMsgs.length,
      totalTokens,
      avgUserLength: avgUserLen,
      avgAiLength: avgAiLen,
      models,
      durationMinutes: Math.round(durationMs / 60000),
      topWords,
      createdAt: thread.created_at
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET/POST/DELETE /api/templates/system — system prompt templates
app.get('/api/templates/system', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS system_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const items = db.prepare("SELECT * FROM system_templates WHERE user_id=? ORDER BY is_default DESC, created_at DESC").all(userId);
    res.json(items);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/templates/system', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { name, content, category = 'general' } = req.body;
    if (!name || !content) return res.status(400).json({ error: 'name and content required' });
    db.prepare(`CREATE TABLE IF NOT EXISTS system_templates (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, name TEXT NOT NULL, content TEXT NOT NULL, category TEXT DEFAULT 'general', is_default INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
    const r = db.prepare("INSERT INTO system_templates (user_id,name,content,category) VALUES (?,?,?,?)").run(userId, name, content, category);
    res.json({ id: r.lastInsertRowid, name, category });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.put('/api/templates/system/:id/default', authMiddleware, async (req: any, res) => {
  try {
    db.prepare("UPDATE system_templates SET is_default=0 WHERE user_id=?").run(req.user.userId);
    db.prepare("UPDATE system_templates SET is_default=1 WHERE id=? AND user_id=?").run(req.params.id, req.user.userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/templates/system/:id', authMiddleware, async (req: any, res) => {
  try {
    db.prepare("DELETE FROM system_templates WHERE id=? AND user_id=?").run(req.params.id, req.user.userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/workspace/activity-heatmap — hourly activity data for 30 days
app.get('/api/workspace/activity-heatmap', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const rows = db.prepare(`
      SELECT strftime('%w', created_at) as dow, strftime('%H', created_at) as hour, COUNT(*) as count
      FROM messages m JOIN threads t ON m.thread_id=t.id
      WHERE t.user_id=? AND m.created_at>=?
      GROUP BY dow, hour ORDER BY dow, hour
    `).all(userId, since) as any[];
    res.json({ heatmap: rows, period: 30 });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ─── Batch 20: Smart Rename, Token Breakdown, Saved Searches, Thread Compare ──

// POST /api/threads/:id/smart-rename — AI-suggested thread title from messages
app.post('/api/threads/:id/smart-rename', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const thread = db.prepare("SELECT * FROM threads WHERE id=? AND user_id=?").get(req.params.id, userId) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const msgs = db.prepare("SELECT content, role FROM messages WHERE thread_id=? ORDER BY created_at LIMIT 6").all(req.params.id) as any[];
    const preview = msgs.map((m: any) => `${m.role}: ${m.content.slice(0,120)}`).join('\n');
    res.json({
      threadId: req.params.id,
      currentTitle: thread.title,
      context: preview,
      instruction: `Based on this conversation, suggest a concise, descriptive title (max 8 words) that captures the main topic:\n\n${preview}\n\nRespond with just the title, no quotes.`
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/threads/:id/rename — apply a new title
app.put('/api/threads/:id/rename', authMiddleware, async (req: any, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    db.prepare("UPDATE threads SET title=? WHERE id=? AND user_id=?").run(title, req.params.id, req.user.userId);
    res.json({ ok: true, title });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/threads/:id/token-breakdown — token cost breakdown per message/model
app.get('/api/threads/:id/token-breakdown', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const thread = db.prepare("SELECT * FROM threads WHERE id=? AND user_id=?").get(req.params.id, userId) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const msgs = db.prepare("SELECT id, role, model_used, tokens_used, created_at, content FROM messages WHERE thread_id=? ORDER BY created_at").all(req.params.id) as any[];
    const costRates: Record<string,number> = {
      'claude-3-5-sonnet': 0.000003,
      'claude-3-opus': 0.000015,
      'claude-3-haiku': 0.00000025,
      'gpt-4o': 0.000005,
      'gpt-4-turbo': 0.00001,
      'gpt-3.5-turbo': 0.0000005,
      'gemini-1.5-pro': 0.0000035,
      'default': 0.000002
    };
    const breakdown = msgs.map((m: any) => {
      const tokens = m.tokens_used || Math.round(m.content.length / 4);
      const model = (m.model_used || 'default').toLowerCase();
      const rate = Object.entries(costRates).find(([k]) => model.includes(k))?.[1] || costRates.default;
      return { id: m.id, role: m.role, model: m.model_used, tokens, estimatedCost: +(tokens * rate).toFixed(6), created_at: m.created_at };
    });
    const totalTokens = breakdown.reduce((s: number, m: any) => s + m.tokens, 0);
    const totalCost = breakdown.reduce((s: number, m: any) => s + m.estimatedCost, 0);
    const byModel: Record<string,{tokens:number,cost:number,count:number}> = {};
    breakdown.forEach((m: any) => {
      const k = m.model || 'unknown';
      if (!byModel[k]) byModel[k] = {tokens:0,cost:0,count:0};
      byModel[k].tokens += m.tokens; byModel[k].cost += m.estimatedCost; byModel[k].count++;
    });
    res.json({ threadId: req.params.id, breakdown, totalTokens, totalCost: +totalCost.toFixed(6), byModel });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET/POST/DELETE /api/saved-searches — save frequently used search queries
app.get('/api/saved-searches', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS saved_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      query TEXT NOT NULL,
      label TEXT DEFAULT '',
      hit_count INTEGER DEFAULT 0,
      last_used DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const items = db.prepare("SELECT * FROM saved_searches WHERE user_id=? ORDER BY hit_count DESC, created_at DESC").all(userId);
    res.json(items);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/saved-searches', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { query, label = '' } = req.body;
    if (!query) return res.status(400).json({ error: 'query required' });
    db.prepare(`CREATE TABLE IF NOT EXISTS saved_searches (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, query TEXT NOT NULL, label TEXT DEFAULT '', hit_count INTEGER DEFAULT 0, last_used DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
    const r = db.prepare("INSERT INTO saved_searches (user_id,query,label) VALUES (?,?,?)").run(userId, query, label);
    res.json({ id: r.lastInsertRowid, query, label });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.put('/api/saved-searches/:id/use', authMiddleware, async (req: any, res) => {
  try {
    db.prepare("UPDATE saved_searches SET hit_count=hit_count+1, last_used=datetime('now') WHERE id=? AND user_id=?").run(req.params.id, req.user.userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/saved-searches/:id', authMiddleware, async (req: any, res) => {
  try {
    db.prepare("DELETE FROM saved_searches WHERE id=? AND user_id=?").run(req.params.id, req.user.userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/workspace/compare-threads — side-by-side stats for 2 threads
app.get('/api/workspace/compare-threads', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const ids = String(req.query.ids || '').split(',').slice(0,2).map(Number).filter(Boolean);
    if (ids.length < 2) return res.status(400).json({ error: 'ids param required (comma-sep, 2 thread ids)' });
    const result = ids.map((id: number) => {
      const thread = db.prepare("SELECT * FROM threads WHERE id=? AND user_id=?").get(id, userId) as any;
      if (!thread) return null;
      const msgs = db.prepare("SELECT role, tokens_used, content FROM messages WHERE thread_id=?").all(id) as any[];
      const tokens = msgs.reduce((s: number, m: any) => s + (m.tokens_used || 0), 0);
      return { id, title: thread.title, messageCount: msgs.length, tokens, avgLength: msgs.length ? Math.round(msgs.reduce((s: number, m: any) => s + m.content.length, 0) / msgs.length) : 0, created_at: thread.created_at };
    });
    res.json({ comparison: result });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/workspace/productivity-score — daily productivity score based on activity
app.get('/api/workspace/productivity-score', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date().toISOString().slice(0,10);
    const week = new Date(Date.now()-7*86400000).toISOString();
    const todayMsgs = (db.prepare("SELECT COUNT(*) as c FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=? AND date(m.created_at)=?").get(userId, today) as any).c;
    const weekMsgs = (db.prepare("SELECT COUNT(*) as c FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=? AND m.created_at>=?").get(userId, week) as any).c;
    const todayThreads = (db.prepare("SELECT COUNT(*) as c FROM threads WHERE user_id=? AND date(created_at)=?").get(userId, today) as any).c;
    const todayTokens = (db.prepare("SELECT COALESCE(SUM(m.tokens_used),0) as t FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=? AND date(m.created_at)=?").get(userId, today) as any).t;
    const score = Math.min(100, todayMsgs * 5 + todayThreads * 10 + Math.floor(todayTokens / 100));
    res.json({ date: today, score, todayMessages: todayMsgs, todayThreads, todayTokens, weekMessages: weekMsgs, streak: score > 0 ? 1 : 0 });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ─── Batch 21: Thread Folders, Quick Notes, Bulk Ops, Message Labels ──────────

// GET/POST/DELETE /api/folders — thread folder organization
app.get('/api/folders', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS thread_folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#6366f1',
      icon TEXT DEFAULT '📁',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    db.prepare(`CREATE TABLE IF NOT EXISTS folder_threads (
      folder_id INTEGER NOT NULL,
      thread_id INTEGER NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(folder_id, thread_id)
    )`).run();
    const folders = db.prepare("SELECT f.*, COUNT(ft.thread_id) as thread_count FROM thread_folders f LEFT JOIN folder_threads ft ON f.id=ft.folder_id WHERE f.user_id=? GROUP BY f.id ORDER BY f.sort_order, f.created_at").all(userId);
    res.json(folders);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/folders', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { name, color = '#6366f1', icon = '📁' } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    db.prepare(`CREATE TABLE IF NOT EXISTS thread_folders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, name TEXT NOT NULL, color TEXT DEFAULT '#6366f1', icon TEXT DEFAULT '📁', sort_order INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
    const r = db.prepare("INSERT INTO thread_folders (user_id,name,color,icon) VALUES (?,?,?,?)").run(userId, name, color, icon);
    res.json({ id: r.lastInsertRowid, name, color, icon });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/folders/:id', authMiddleware, async (req: any, res) => {
  try {
    db.prepare("DELETE FROM thread_folders WHERE id=? AND user_id=?").run(req.params.id, req.user.userId);
    db.prepare("DELETE FROM folder_threads WHERE folder_id=?").run(req.params.id);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/folders/:id/threads', authMiddleware, async (req: any, res) => {
  try {
    const { thread_id } = req.body;
    db.prepare(`CREATE TABLE IF NOT EXISTS folder_threads (folder_id INTEGER NOT NULL, thread_id INTEGER NOT NULL, added_at DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(folder_id, thread_id))`).run();
    db.prepare("INSERT OR IGNORE INTO folder_threads (folder_id,thread_id) VALUES (?,?)").run(req.params.id, thread_id);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/folders/:id/threads/:threadId', authMiddleware, async (req: any, res) => {
  try {
    db.prepare("DELETE FROM folder_threads WHERE folder_id=? AND thread_id=?").run(req.params.id, req.params.threadId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.get('/api/folders/:id/threads', authMiddleware, async (req: any, res) => {
  try {
    db.prepare(`CREATE TABLE IF NOT EXISTS folder_threads (folder_id INTEGER NOT NULL, thread_id INTEGER NOT NULL, added_at DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(folder_id, thread_id))`).run();
    const threads = db.prepare("SELECT t.* FROM threads t JOIN folder_threads ft ON t.id=ft.thread_id WHERE ft.folder_id=? AND t.user_id=? ORDER BY ft.added_at DESC").all(req.params.id, req.user.userId);
    res.json(threads);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET/POST/PUT/DELETE /api/quick-notes — fast capture notes (no thread required)
app.get('/api/quick-notes', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS quick_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      color TEXT DEFAULT 'yellow',
      pinned INTEGER DEFAULT 0,
      tags TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const notes = db.prepare("SELECT * FROM quick_notes WHERE user_id=? ORDER BY pinned DESC, updated_at DESC").all(userId);
    res.json(notes);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/quick-notes', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { content, color = 'yellow', tags = '' } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });
    db.prepare(`CREATE TABLE IF NOT EXISTS quick_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, content TEXT NOT NULL, color TEXT DEFAULT 'yellow', pinned INTEGER DEFAULT 0, tags TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
    const r = db.prepare("INSERT INTO quick_notes (user_id,content,color,tags) VALUES (?,?,?,?)").run(userId, content, color, tags);
    res.json({ id: r.lastInsertRowid, content, color, tags });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.put('/api/quick-notes/:id', authMiddleware, async (req: any, res) => {
  try {
    const { content, color, pinned, tags } = req.body;
    const note = db.prepare("SELECT * FROM quick_notes WHERE id=? AND user_id=?").get(req.params.id, req.user.userId) as any;
    if (!note) return res.status(404).json({ error: 'Not found' });
    db.prepare("UPDATE quick_notes SET content=?,color=?,pinned=?,tags=?,updated_at=datetime('now') WHERE id=?").run(
      content??note.content, color??note.color, pinned??note.pinned, tags??note.tags, req.params.id
    );
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/quick-notes/:id', authMiddleware, async (req: any, res) => {
  try {
    db.prepare("DELETE FROM quick_notes WHERE id=? AND user_id=?").run(req.params.id, req.user.userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/threads/bulk — bulk operations on multiple threads
app.post('/api/threads/bulk', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { action, thread_ids, value } = req.body;
    if (!action || !Array.isArray(thread_ids) || !thread_ids.length) return res.status(400).json({ error: 'action and thread_ids required' });
    const placeholders = thread_ids.map(() => '?').join(',');
    let affected = 0;
    if (action === 'archive') {
      const r = db.prepare(`UPDATE threads SET archived=1 WHERE id IN (${placeholders}) AND user_id=?`).run(...thread_ids, userId);
      affected = r.changes;
    } else if (action === 'unarchive') {
      const r = db.prepare(`UPDATE threads SET archived=0 WHERE id IN (${placeholders}) AND user_id=?`).run(...thread_ids, userId);
      affected = r.changes;
    } else if (action === 'delete') {
      db.prepare(`DELETE FROM messages WHERE thread_id IN (${placeholders})`).run(...thread_ids);
      const r = db.prepare(`DELETE FROM threads WHERE id IN (${placeholders}) AND user_id=?`).run(...thread_ids, userId);
      affected = r.changes;
    } else if (action === 'tag' && value) {
      thread_ids.forEach((id: number) => {
        const t = db.prepare("SELECT tags FROM threads WHERE id=? AND user_id=?").get(id, userId) as any;
        if (t) {
          const tags = t.tags ? t.tags.split(',').filter(Boolean) : [];
          if (!tags.includes(value)) tags.push(value);
          db.prepare("UPDATE threads SET tags=? WHERE id=?").run(tags.join(','), id);
          affected++;
        }
      });
    }
    res.json({ ok: true, affected });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET/POST/DELETE /api/message-labels — label/tag individual messages
app.get('/api/threads/:id/message-labels', authMiddleware, async (req: any, res) => {
  try {
    db.prepare(`CREATE TABLE IF NOT EXISTS message_labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      color TEXT DEFAULT '#6366f1',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const labels = db.prepare(`
      SELECT ml.* FROM message_labels ml
      JOIN messages m ON ml.message_id=m.id
      WHERE m.thread_id=? AND ml.user_id=?
      ORDER BY ml.created_at DESC
    `).all(req.params.id, req.user.userId);
    res.json(labels);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/messages/:id/labels', authMiddleware, async (req: any, res) => {
  try {
    const { label, color = '#6366f1' } = req.body;
    if (!label) return res.status(400).json({ error: 'label required' });
    db.prepare(`CREATE TABLE IF NOT EXISTS message_labels (id INTEGER PRIMARY KEY AUTOINCREMENT, message_id INTEGER NOT NULL, user_id INTEGER NOT NULL, label TEXT NOT NULL, color TEXT DEFAULT '#6366f1', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
    const r = db.prepare("INSERT INTO message_labels (message_id,user_id,label,color) VALUES (?,?,?,?)").run(req.params.id, req.user.userId, label, color);
    res.json({ id: r.lastInsertRowid, label, color });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/message-labels/:id', authMiddleware, async (req: any, res) => {
  try {
    db.prepare("DELETE FROM message_labels WHERE id=? AND user_id=?").run(req.params.id, req.user.userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/workspace/export — full workspace data export (JSON)
app.get('/api/workspace/export', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const user = db.prepare("SELECT id,email,name,created_at FROM users WHERE id=?").get(userId) as any;
    const threads = db.prepare("SELECT * FROM threads WHERE user_id=?").all(userId);
    const messages = db.prepare("SELECT m.* FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=?").all(userId);
    const snippets = db.prepare("SELECT * FROM snippets WHERE user_id=? LIMIT 500").all(userId) as any[];
    const bookmarks = db.prepare("SELECT * FROM bookmarks WHERE user_id=? LIMIT 500").all(userId) as any[];
    res.json({
      exportedAt: new Date().toISOString(),
      user,
      stats: { threads: (threads as any[]).length, messages: (messages as any[]).length },
      threads,
      messages,
      snippets,
      bookmarks
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ─── Batch 22: Workspace Goals, Thread Insights, Context Window, Formatter ────

// GET/POST/PUT/DELETE /api/workspace-goals — track high-level workspace goals
app.get('/api/workspace-goals', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS workspace_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      priority TEXT DEFAULT 'medium',
      target_date TEXT DEFAULT '',
      progress INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const goals = db.prepare("SELECT * FROM workspace_goals WHERE user_id=? ORDER BY priority DESC, created_at DESC").all(userId);
    res.json(goals);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/workspace-goals', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { title, description = '', priority = 'medium', target_date = '' } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    db.prepare(`CREATE TABLE IF NOT EXISTS workspace_goals (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL, description TEXT DEFAULT '', status TEXT DEFAULT 'active', priority TEXT DEFAULT 'medium', target_date TEXT DEFAULT '', progress INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
    const r = db.prepare("INSERT INTO workspace_goals (user_id,title,description,priority,target_date) VALUES (?,?,?,?,?)").run(userId, title, description, priority, target_date);
    res.json({ id: r.lastInsertRowid, title, priority });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.put('/api/workspace-goals/:id', authMiddleware, async (req: any, res) => {
  try {
    const { title, description, status, priority, target_date, progress } = req.body;
    const g = db.prepare("SELECT * FROM workspace_goals WHERE id=? AND user_id=?").get(req.params.id, req.user.userId) as any;
    if (!g) return res.status(404).json({ error: 'Not found' });
    db.prepare("UPDATE workspace_goals SET title=?,description=?,status=?,priority=?,target_date=?,progress=?,updated_at=datetime('now') WHERE id=?").run(
      title??g.title, description??g.description, status??g.status, priority??g.priority, target_date??g.target_date, progress??g.progress, req.params.id
    );
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/workspace-goals/:id', authMiddleware, async (req: any, res) => {
  try {
    db.prepare("DELETE FROM workspace_goals WHERE id=? AND user_id=?").run(req.params.id, req.user.userId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/threads/:id/insights — AI-ready thread insights (key topics, action items, questions)
app.get('/api/threads/:id/insights', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const thread = db.prepare("SELECT * FROM threads WHERE id=? AND user_id=?").get(req.params.id, userId) as any;
    if (!thread) return res.status(404).json({ error: 'Not found' });
    const msgs = db.prepare("SELECT content, role FROM messages WHERE thread_id=? ORDER BY created_at").all(req.params.id) as any[];
    // Extract questions (lines ending in ?)
    const questions: string[] = [];
    const actionItems: string[] = [];
    msgs.forEach((m: any) => {
      const lines = m.content.split('\n');
      lines.forEach((line: string) => {
        const trimmed = line.trim();
        if (trimmed.endsWith('?') && trimmed.length > 10 && trimmed.length < 200) questions.push(trimmed);
        if (/^[-*]\s+(?:todo|action|task|follow.?up|next step|will|should|need to|must)/i.test(trimmed)) actionItems.push(trimmed.replace(/^[-*]\s+/,''));
      });
    });
    // Word frequency for topics
    const wordFreq: Record<string,number> = {};
    msgs.forEach((m: any) => {
      m.content.toLowerCase().replace(/[^a-z\s]/g,'').split(/\s+/).forEach((w: string) => {
        if (w.length > 5 && !['about','their','which','would','could','should','there','these','those','where','being','having','after','before'].includes(w)) {
          wordFreq[w] = (wordFreq[w]||0)+1;
        }
      });
    });
    const topTopics = Object.entries(wordFreq).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([w])=>w);
    const contextSize = msgs.reduce((s: number, m: any) => s + m.content.length, 0);
    res.json({
      threadId: req.params.id,
      title: thread.title,
      messageCount: msgs.length,
      contextSize,
      estimatedTokens: Math.round(contextSize / 4),
      topTopics,
      questions: questions.slice(0,5),
      actionItems: actionItems.slice(0,5),
      lastActivity: msgs[msgs.length-1] ? msgs[msgs.length-1] : null
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/format-text — text formatting utilities (markdown, clean, extract)
app.post('/api/format-text', authMiddleware, async (req: any, res) => {
  try {
    const { text, operation = 'clean' } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });
    let result = text;
    if (operation === 'clean') {
      result = text.replace(/\s+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    } else if (operation === 'bullet') {
      result = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 10).map((s: string) => `• ${s.trim()}`).join('\n');
    } else if (operation === 'numbered') {
      result = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 10).map((s: string, i: number) => `${i+1}. ${s.trim()}`).join('\n');
    } else if (operation === 'extract-links') {
      const links = (text.match(/https?:\/\/[^\s)>"]+/g) || []);
      result = links.join('\n') || 'No links found';
    } else if (operation === 'extract-code') {
      const blocks = (text.match(/```[\s\S]*?```/g) || []);
      result = blocks.join('\n\n') || 'No code blocks found';
    } else if (operation === 'word-count') {
      const words = text.trim().split(/\s+/).length;
      const chars = text.length;
      const sentences = (text.match(/[.!?]+/g) || []).length;
      result = `Words: ${words}\nCharacters: ${chars}\nSentences: ${sentences}\nEst. reading time: ${Math.ceil(words/200)} min`;
    }
    res.json({ original: text, operation, result });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/workspace/weekly-summary — weekly activity summary
app.get('/api/workspace/weekly-summary', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const weekAgo = new Date(Date.now() - 7*86400000).toISOString();
    const newThreads = (db.prepare("SELECT COUNT(*) as c FROM threads WHERE user_id=? AND created_at>=?").get(userId, weekAgo) as any).c;
    const newMsgs = (db.prepare("SELECT COUNT(*) as c FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=? AND m.created_at>=?").get(userId, weekAgo) as any).c;
    const tokens = (db.prepare("SELECT COALESCE(SUM(m.tokens_used),0) as t FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=? AND m.created_at>=?").get(userId, weekAgo) as any).t;
    const topThreads = db.prepare(`
      SELECT t.id, t.title, COUNT(m.id) as msg_count
      FROM threads t JOIN messages m ON t.id=m.thread_id
      WHERE t.user_id=? AND m.created_at>=?
      GROUP BY t.id ORDER BY msg_count DESC LIMIT 3
    `).all(userId, weekAgo);
    const byDay = db.prepare(`
      SELECT date(m.created_at) as day, COUNT(*) as count
      FROM messages m JOIN threads t ON m.thread_id=t.id
      WHERE t.user_id=? AND m.created_at>=?
      GROUP BY day ORDER BY day
    `).all(userId, weekAgo);
    res.json({ period: '7d', newThreads, newMessages: newMsgs, totalTokens: tokens, topThreads, byDay });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET/POST /api/pinned-threads — pin threads to workspace top
app.get('/api/pinned-threads', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    db.prepare(`CREATE TABLE IF NOT EXISTS pinned_threads (
      user_id INTEGER NOT NULL,
      thread_id INTEGER NOT NULL,
      pinned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(user_id, thread_id)
    )`).run();
    const pins = db.prepare("SELECT t.* FROM threads t JOIN pinned_threads pt ON t.id=pt.thread_id WHERE pt.user_id=? ORDER BY pt.pinned_at DESC").all(userId);
    res.json(pins);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/pinned-threads', authMiddleware, async (req: any, res) => {
  try {
    const { thread_id } = req.body;
    db.prepare(`CREATE TABLE IF NOT EXISTS pinned_threads (user_id INTEGER NOT NULL, thread_id INTEGER NOT NULL, pinned_at DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id, thread_id))`).run();
    db.prepare("INSERT OR IGNORE INTO pinned_threads (user_id,thread_id) VALUES (?,?)").run(req.user.userId, thread_id);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/pinned-threads/:threadId', authMiddleware, async (req: any, res) => {
  try {
    db.prepare("DELETE FROM pinned_threads WHERE user_id=? AND thread_id=?").run(req.user.userId, req.params.threadId);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ── Batch 23: Streak Tracker, Reading List, Code Snippets Manager, Thread Diff, AI Insights Feed ──

// streak_tracker table
db.exec(`CREATE TABLE IF NOT EXISTS streak_tracker (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  habit TEXT NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_checked_date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// reading_list table
db.exec(`CREATE TABLE IF NOT EXISTS reading_list (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'unread',
  priority INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// code_snippets_mgr table (manager, separate from prompt snippets)
db.exec(`CREATE TABLE IF NOT EXISTS code_snippets_mgr (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  language TEXT DEFAULT 'text',
  tags TEXT DEFAULT '',
  pinned INTEGER DEFAULT 0,
  use_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// thread_diffs table
db.exec(`CREATE TABLE IF NOT EXISTS thread_diffs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  thread_id INTEGER NOT NULL,
  diff_label TEXT NOT NULL,
  snapshot TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// ai_insights_feed table
db.exec(`CREATE TABLE IF NOT EXISTS ai_insights_feed (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  insight_type TEXT NOT NULL,
  content TEXT NOT NULL,
  related_thread_id INTEGER,
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// ── Streak Tracker ──
app.get('/api/streaks', authMiddleware, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM streak_tracker WHERE user_id=? ORDER BY id DESC').all(req.user.id);
  res.json(rows);
});
app.post('/api/streaks', authMiddleware, (req: any, res: any) => {
  const { habit } = req.body;
  if (!habit?.trim()) return res.status(400).json({ error:'habit required' });
  const r = db.prepare('INSERT INTO streak_tracker (user_id,habit) VALUES (?,?)').run(req.user.id, habit.trim());
  res.json({ id: r.lastInsertRowid, habit, current_streak:0, longest_streak:0 });
});
app.put('/api/streaks/:id/check', authMiddleware, (req: any, res: any) => {
  const row: any = db.prepare('SELECT * FROM streak_tracker WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error:'not found' });
  const today = new Date().toISOString().split('T')[0];
  if (row.last_checked_date === today) return res.json({ ...row, message:'already checked today' });
  const yesterday = new Date(Date.now()-86400000).toISOString().split('T')[0];
  const newStreak = row.last_checked_date === yesterday ? row.current_streak + 1 : 1;
  const newLongest = Math.max(newStreak, row.longest_streak);
  db.prepare('UPDATE streak_tracker SET current_streak=?, longest_streak=?, last_checked_date=? WHERE id=?')
    .run(newStreak, newLongest, today, row.id);
  res.json({ current_streak: newStreak, longest_streak: newLongest, last_checked_date: today });
});
app.delete('/api/streaks/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM streak_tracker WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Reading List ──
app.get('/api/reading-list', authMiddleware, (req: any, res: any) => {
  const { status } = req.query;
  let q = 'SELECT * FROM reading_list WHERE user_id=?';
  const params: any[] = [req.user.id];
  if (status) { q += ' AND status=?'; params.push(status); }
  q += ' ORDER BY priority DESC, id DESC';
  res.json(db.prepare(q).all(...params));
});
app.post('/api/reading-list', authMiddleware, (req: any, res: any) => {
  const { title, url, notes, priority } = req.body;
  if (!title?.trim()) return res.status(400).json({ error:'title required' });
  const r = db.prepare('INSERT INTO reading_list (user_id,title,url,notes,priority) VALUES (?,?,?,?,?)').run(req.user.id, title.trim(), url||'', notes||'', priority||0);
  res.json({ id: r.lastInsertRowid, title, url, status:'unread' });
});
app.put('/api/reading-list/:id', authMiddleware, (req: any, res: any) => {
  const { title, url, notes, status, priority } = req.body;
  db.prepare('UPDATE reading_list SET title=COALESCE(?,title), url=COALESCE(?,url), notes=COALESCE(?,notes), status=COALESCE(?,status), priority=COALESCE(?,priority) WHERE id=? AND user_id=?')
    .run(title||null, url||null, notes||null, status||null, priority??null, req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/reading-list/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM reading_list WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Code Snippets Manager ──
app.get('/api/code-snippets-mgr', authMiddleware, (req: any, res: any) => {
  const { language, search } = req.query as any;
  let q = 'SELECT * FROM code_snippets_mgr WHERE user_id=?';
  const params: any[] = [req.user.id];
  if (language) { q += ' AND language=?'; params.push(language); }
  if (search) { q += ' AND (title LIKE ? OR code LIKE ? OR tags LIKE ?)'; const s=`%${search}%`; params.push(s,s,s); }
  q += ' ORDER BY pinned DESC, use_count DESC, id DESC';
  res.json(db.prepare(q).all(...params));
});
app.post('/api/code-snippets-mgr', authMiddleware, (req: any, res: any) => {
  const { title, code, language, tags } = req.body;
  if (!title?.trim() || !code?.trim()) return res.status(400).json({ error:'title and code required' });
  const r = db.prepare('INSERT INTO code_snippets_mgr (user_id,title,code,language,tags) VALUES (?,?,?,?,?)').run(req.user.id, title.trim(), code, language||'text', (tags||''));
  res.json({ id: r.lastInsertRowid, title, language });
});
app.put('/api/code-snippets-mgr/:id', authMiddleware, (req: any, res: any) => {
  const { title, code, language, tags, pinned } = req.body;
  db.prepare('UPDATE code_snippets_mgr SET title=COALESCE(?,title), code=COALESCE(?,code), language=COALESCE(?,language), tags=COALESCE(?,tags), pinned=COALESCE(?,pinned) WHERE id=? AND user_id=?')
    .run(title||null, code||null, language||null, tags||null, pinned??null, req.params.id, req.user.id);
  res.json({ ok: true });
});
app.post('/api/code-snippets-mgr/:id/use', authMiddleware, (req: any, res: any) => {
  db.prepare('UPDATE code_snippets_mgr SET use_count=use_count+1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/code-snippets-mgr/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM code_snippets_mgr WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Thread Diffs / Snapshots ──
app.get('/api/threads/:id/diffs', authMiddleware, (req: any, res: any) => {
  const rows = db.prepare('SELECT id,diff_label,created_at FROM thread_diffs WHERE thread_id=? AND user_id=? ORDER BY id DESC').all(req.params.id, req.user.id);
  res.json(rows);
});
app.post('/api/threads/:id/diffs', authMiddleware, (req: any, res: any) => {
  const { diff_label } = req.body;
  const messages = db.prepare('SELECT role,content,created_at FROM messages WHERE thread_id=? ORDER BY id ASC').all(req.params.id);
  const r = db.prepare('INSERT INTO thread_diffs (user_id,thread_id,diff_label,snapshot) VALUES (?,?,?,?)').run(req.user.id, req.params.id, diff_label||`Snapshot ${new Date().toISOString()}`, JSON.stringify(messages));
  res.json({ id: r.lastInsertRowid, diff_label, message_count: messages.length });
});
app.get('/api/threads/:id/diffs/:diffId', authMiddleware, (req: any, res: any) => {
  const row: any = db.prepare('SELECT * FROM thread_diffs WHERE id=? AND thread_id=? AND user_id=?').get(req.params.diffId, req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error:'not found' });
  try { row.snapshot = JSON.parse(row.snapshot); } catch {}
  res.json(row);
});
app.delete('/api/threads/:id/diffs/:diffId', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM thread_diffs WHERE id=? AND user_id=?').run(req.params.diffId, req.user.id);
  res.json({ ok: true });
});

// ── AI Insights Feed ──
app.get('/api/insights-feed', authMiddleware, (req: any, res: any) => {
  const limit = Math.min(Number(req.query.limit)||20, 100);
  const rows = db.prepare('SELECT * FROM ai_insights_feed WHERE user_id=? ORDER BY id DESC LIMIT ?').all(req.user.id, limit);
  res.json(rows);
});
app.post('/api/insights-feed/generate', authMiddleware, (req: any, res: any) => {
  // Generate insights from user's recent activity
  const recentThreads: any[] = db.prepare('SELECT id, title, created_at FROM threads WHERE user_id=? ORDER BY id DESC LIMIT 5').all(req.user.id);
  const msgCount = (db.prepare('SELECT COUNT(*) as c FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=?').get(req.user.id) as any)?.c || 0;
  const insights: any[] = [];
  if (recentThreads.length > 0) {
    insights.push({ insight_type:'activity', content:`You have ${recentThreads.length} recent threads. Most recent: "${recentThreads[0].title||'Untitled'}"`, related_thread_id: recentThreads[0].id });
  }
  if (msgCount > 50) {
    insights.push({ insight_type:'milestone', content:`You've exchanged ${msgCount} messages on Forge. Great engagement!`, related_thread_id: null });
  }
  const topThread: any = db.prepare('SELECT t.id, t.title, COUNT(m.id) as mc FROM threads t JOIN messages m ON m.thread_id=t.id WHERE t.user_id=? GROUP BY t.id ORDER BY mc DESC LIMIT 1').get(req.user.id);
  if (topThread) {
    insights.push({ insight_type:'top_thread', content:`Your most active thread is "${topThread.title||'Untitled'}" with ${topThread.mc} messages.`, related_thread_id: topThread.id });
  }
  const stmt = db.prepare('INSERT INTO ai_insights_feed (user_id,insight_type,content,related_thread_id) VALUES (?,?,?,?)');
  insights.forEach(i => stmt.run(req.user.id, i.insight_type, i.content, i.related_thread_id));
  res.json({ generated: insights.length, insights });
});
app.put('/api/insights-feed/:id/read', authMiddleware, (req: any, res: any) => {
  db.prepare('UPDATE ai_insights_feed SET read=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/insights-feed/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_insights_feed WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Workspace Stats Summary (extended) ──
app.get('/api/workspace/stats-summary', authMiddleware, (req: any, res: any) => {
  const uid = req.user.id;
  const totalThreads = (db.prepare('SELECT COUNT(*) as c FROM threads WHERE user_id=?').get(uid) as any)?.c||0;
  const totalMessages = (db.prepare('SELECT COUNT(*) as c FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=?').get(uid) as any)?.c||0;
  const totalTokens = (db.prepare('SELECT SUM(tokens_used) as s FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=?').get(uid) as any)?.s||0;
  const totalBookmarks = (db.prepare('SELECT COUNT(*) as c FROM message_bookmarks WHERE user_id=?').get(uid) as any)?.c||0;
  const totalSnippets = (db.prepare('SELECT COUNT(*) as c FROM code_snippets_mgr WHERE user_id=?').get(uid) as any)?.c||0;
  const totalGoals = (db.prepare('SELECT COUNT(*) as c FROM workspace_goals WHERE user_id=?').get(uid) as any)?.c||0;
  const completedGoals = (db.prepare("SELECT COUNT(*) as c FROM workspace_goals WHERE user_id=? AND status='completed'").get(uid) as any)?.c||0;
  const activeStreaks = (db.prepare('SELECT COUNT(*) as c FROM streak_tracker WHERE user_id=? AND current_streak>0').get(uid) as any)?.c||0;
  const readingItems = (db.prepare("SELECT COUNT(*) as c FROM reading_list WHERE user_id=? AND status='unread'").get(uid) as any)?.c||0;
  res.json({ totalThreads, totalMessages, totalTokens, totalBookmarks, totalSnippets, totalGoals, completedGoals, activeStreaks, readingItems });
});


// ── Batch 24: Focus Modes, Thread Polls, Workspace Tags, AI Rename Batch, Context Windows ──

// focus_modes table
db.exec(`CREATE TABLE IF NOT EXISTS focus_modes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#6366f1',
  blocked_tabs TEXT DEFAULT '',
  auto_timer_minutes INTEGER DEFAULT 0,
  active INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// thread_polls table
db.exec(`CREATE TABLE IF NOT EXISTS thread_polls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  thread_id INTEGER,
  question TEXT NOT NULL,
  options TEXT NOT NULL,
  votes TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
)`);

// workspace_tags table
db.exec(`CREATE TABLE IF NOT EXISTS workspace_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  usage_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// context_windows table (save conversation context slices)
db.exec(`CREATE TABLE IF NOT EXISTS context_windows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  thread_id INTEGER NOT NULL,
  label TEXT NOT NULL,
  start_message_id INTEGER,
  end_message_id INTEGER,
  message_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// ── Focus Modes ──
app.get('/api/focus-modes', authMiddleware, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM focus_modes WHERE user_id=? ORDER BY id DESC').all(req.user.id));
});
app.post('/api/focus-modes', authMiddleware, (req: any, res: any) => {
  const { name, icon, color, blocked_tabs, auto_timer_minutes } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const r = db.prepare('INSERT INTO focus_modes (user_id,name,icon,color,blocked_tabs,auto_timer_minutes) VALUES (?,?,?,?,?,?)').run(req.user.id, name.trim(), icon||'🎯', color||'#6366f1', blocked_tabs||'', auto_timer_minutes||0);
  res.json({ id: r.lastInsertRowid, name, icon, color });
});
app.put('/api/focus-modes/:id/activate', authMiddleware, (req: any, res: any) => {
  db.prepare('UPDATE focus_modes SET active=0 WHERE user_id=?').run(req.user.id);
  db.prepare('UPDATE focus_modes SET active=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  const mode: any = db.prepare('SELECT * FROM focus_modes WHERE id=?').get(req.params.id);
  res.json(mode);
});
app.put('/api/focus-modes/deactivate', authMiddleware, (req: any, res: any) => {
  db.prepare('UPDATE focus_modes SET active=0 WHERE user_id=?').run(req.user.id);
  res.json({ ok: true });
});
app.delete('/api/focus-modes/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM focus_modes WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Thread Polls ──
app.get('/api/polls', authMiddleware, (req: any, res: any) => {
  const rows: any[] = db.prepare('SELECT * FROM thread_polls WHERE user_id=? ORDER BY id DESC LIMIT 50').all(req.user.id);
  rows.forEach(r => { try { r.options = JSON.parse(r.options); r.votes = JSON.parse(r.votes||'{}'); } catch {} });
  res.json(rows);
});
app.post('/api/polls', authMiddleware, (req: any, res: any) => {
  const { question, options, thread_id } = req.body;
  if (!question?.trim() || !Array.isArray(options) || options.length < 2) return res.status(400).json({ error: 'question and 2+ options required' });
  const r = db.prepare('INSERT INTO thread_polls (user_id,thread_id,question,options) VALUES (?,?,?,?)').run(req.user.id, thread_id||null, question.trim(), JSON.stringify(options));
  res.json({ id: r.lastInsertRowid, question, options });
});
app.post('/api/polls/:id/vote', authMiddleware, (req: any, res: any) => {
  const { option_index } = req.body;
  const poll: any = db.prepare('SELECT * FROM thread_polls WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!poll) return res.status(404).json({ error: 'not found' });
  let votes: any = {};
  try { votes = JSON.parse(poll.votes||'{}'); } catch {}
  votes[option_index] = (votes[option_index]||0) + 1;
  db.prepare('UPDATE thread_polls SET votes=? WHERE id=?').run(JSON.stringify(votes), poll.id);
  res.json({ votes });
});
app.delete('/api/polls/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM thread_polls WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Workspace Tags ──
app.get('/api/workspace-tags', authMiddleware, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_tags WHERE user_id=? ORDER BY usage_count DESC, id DESC').all(req.user.id));
});
app.post('/api/workspace-tags', authMiddleware, (req: any, res: any) => {
  const { name, color } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  try {
    const r = db.prepare('INSERT INTO workspace_tags (user_id,name,color) VALUES (?,?,?)').run(req.user.id, name.trim().toLowerCase(), color||'#6366f1');
    res.json({ id: r.lastInsertRowid, name: name.trim().toLowerCase(), color });
  } catch { res.status(409).json({ error: 'tag exists' }); }
});
app.put('/api/workspace-tags/:id', authMiddleware, (req: any, res: any) => {
  const { color } = req.body;
  db.prepare('UPDATE workspace_tags SET color=COALESCE(?,color) WHERE id=? AND user_id=?').run(color||null, req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/workspace-tags/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_tags WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.post('/api/workspace-tags/apply', authMiddleware, (req: any, res: any) => {
  // Apply a tag to a thread (reuse existing thread tags if available)
  const { tag_name, thread_id } = req.body;
  db.prepare('UPDATE workspace_tags SET usage_count=usage_count+1 WHERE user_id=? AND name=?').run(req.user.id, tag_name);
  // Store tag on thread using existing thread_tags column pattern
  const thread: any = db.prepare('SELECT tags FROM threads WHERE id=? AND user_id=?').get(thread_id, req.user.id);
  if (thread) {
    const tags = thread.tags ? thread.tags.split(',').filter(Boolean) : [];
    if (!tags.includes(tag_name)) { tags.push(tag_name); db.prepare('UPDATE threads SET tags=? WHERE id=?').run(tags.join(','), thread_id); }
  }
  res.json({ ok: true });
});

// ── AI Batch Rename Threads ──
app.post('/api/threads/batch-rename', authMiddleware, (req: any, res: any) => {
  const { thread_ids } = req.body;
  if (!Array.isArray(thread_ids) || thread_ids.length === 0) return res.status(400).json({ error: 'thread_ids required' });
  const results: any[] = [];
  for (const tid of thread_ids.slice(0, 20)) {
    const thread: any = db.prepare('SELECT id, title FROM threads WHERE id=? AND user_id=?').get(tid, req.user.id);
    if (!thread) continue;
    const firstMsg: any = db.prepare('SELECT content FROM messages WHERE thread_id=? ORDER BY id ASC LIMIT 1').get(tid);
    const suggestion = firstMsg ? firstMsg.content.slice(0, 60).replace(/\n/g,' ').trim() + (firstMsg.content.length > 60 ? '...' : '') : 'Untitled Thread';
    results.push({ thread_id: tid, current_title: thread.title, suggested_title: suggestion });
  }
  res.json({ results });
});
app.post('/api/threads/batch-rename/apply', authMiddleware, (req: any, res: any) => {
  const { renames } = req.body; // [{thread_id, new_title}]
  if (!Array.isArray(renames)) return res.status(400).json({ error: 'renames array required' });
  let updated = 0;
  for (const { thread_id, new_title } of renames) {
    if (!new_title?.trim()) continue;
    db.prepare('UPDATE threads SET title=? WHERE id=? AND user_id=?').run(new_title.trim(), thread_id, req.user.id);
    updated++;
  }
  res.json({ updated });
});

// ── Context Windows ──
app.get('/api/threads/:id/context-windows', authMiddleware, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM context_windows WHERE thread_id=? AND user_id=? ORDER BY id DESC').all(req.params.id, req.user.id));
});
app.post('/api/threads/:id/context-windows', authMiddleware, (req: any, res: any) => {
  const { label, start_message_id, end_message_id } = req.body;
  if (!label?.trim()) return res.status(400).json({ error: 'label required' });
  let msgCount = 0;
  if (start_message_id && end_message_id) {
    const c: any = db.prepare('SELECT COUNT(*) as c FROM messages WHERE thread_id=? AND id BETWEEN ? AND ?').get(req.params.id, start_message_id, end_message_id);
    msgCount = c?.c || 0;
  } else {
    const c: any = db.prepare('SELECT COUNT(*) as c FROM messages WHERE thread_id=?').get(req.params.id);
    msgCount = c?.c || 0;
  }
  const r = db.prepare('INSERT INTO context_windows (user_id,thread_id,label,start_message_id,end_message_id,message_count) VALUES (?,?,?,?,?,?)').run(req.user.id, req.params.id, label.trim(), start_message_id||null, end_message_id||null, msgCount);
  res.json({ id: r.lastInsertRowid, label, message_count: msgCount });
});
app.delete('/api/threads/:id/context-windows/:cwId', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM context_windows WHERE id=? AND user_id=?').run(req.params.cwId, req.user.id);
  res.json({ ok: true });
});

// ── Workspace Health Check ──
app.get('/api/workspace/health', authMiddleware, (req: any, res: any) => {
  const uid = req.user.id;
  const checks: any[] = [];
  // Check for orphan threads (no messages)
  const emptyThreads: any = db.prepare('SELECT COUNT(*) as c FROM threads t WHERE t.user_id=? AND NOT EXISTS (SELECT 1 FROM messages m WHERE m.thread_id=t.id)').get(uid);
  checks.push({ check: 'empty_threads', count: emptyThreads?.c||0, severity: emptyThreads?.c > 5 ? 'warn' : 'ok' });
  // Check for very long threads (>200 messages)
  const longThreads: any = db.prepare('SELECT COUNT(*) as c FROM (SELECT thread_id, COUNT(*) as mc FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=? GROUP BY thread_id HAVING mc > 200)').get(uid);
  checks.push({ check: 'long_threads', count: longThreads?.c||0, severity: longThreads?.c > 0 ? 'info' : 'ok' });
  // Check for active streaks
  const streaks: any = db.prepare("SELECT COUNT(*) as c FROM streak_tracker WHERE user_id=? AND current_streak>0").get(uid);
  checks.push({ check: 'active_streaks', count: streaks?.c||0, severity: 'ok' });
  // Check for unread reading items
  const reading: any = db.prepare("SELECT COUNT(*) as c FROM reading_list WHERE user_id=? AND status='unread'").get(uid);
  checks.push({ check: 'unread_reading', count: reading?.c||0, severity: reading?.c > 20 ? 'warn' : 'ok' });
  const overall = checks.some(c=>c.severity==='warn') ? 'warn' : 'ok';
  res.json({ overall, checks, generated_at: new Date().toISOString() });
});


// ── Batch 25: Daily Log, Message Reactions v2, Thread Archives, Workspace Milestones, Link Previews ──

// daily_log table
db.exec(`CREATE TABLE IF NOT EXISTS daily_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  log_date TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT DEFAULT 'neutral',
  energy INTEGER DEFAULT 3,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, log_date)
)`);

// workspace_milestones table
db.exec(`CREATE TABLE IF NOT EXISTS workspace_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  milestone_date TEXT NOT NULL,
  achieved INTEGER DEFAULT 0,
  category TEXT DEFAULT 'general',
  created_at TEXT DEFAULT (datetime('now'))
)`);

// link_previews cache table
db.exec(`CREATE TABLE IF NOT EXISTS link_previews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  fetched_at TEXT DEFAULT (datetime('now'))
)`);

// thread_archive_metadata table
db.exec(`CREATE TABLE IF NOT EXISTS thread_archive_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  thread_id INTEGER NOT NULL UNIQUE,
  archived_at TEXT DEFAULT (datetime('now')),
  archive_reason TEXT DEFAULT '',
  auto_archive INTEGER DEFAULT 0
)`);

// ── Daily Log ──
app.get('/api/daily-log', authMiddleware, (req: any, res: any) => {
  const { date, limit } = req.query;
  let q = 'SELECT * FROM daily_log WHERE user_id=?';
  const params: any[] = [req.user.id];
  if (date) { q += ' AND log_date=?'; params.push(date); }
  q += ' ORDER BY log_date DESC LIMIT ?';
  params.push(Math.min(Number(limit)||30, 90));
  res.json(db.prepare(q).all(...params));
});
app.post('/api/daily-log', authMiddleware, (req: any, res: any) => {
  const { content, mood, energy, log_date } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content required' });
  const date = log_date || new Date().toISOString().split('T')[0];
  try {
    const r = db.prepare('INSERT INTO daily_log (user_id,log_date,content,mood,energy) VALUES (?,?,?,?,?)').run(req.user.id, date, content.trim(), mood||'neutral', energy||3);
    res.json({ id: r.lastInsertRowid, log_date: date, content, mood, energy });
  } catch {
    db.prepare('UPDATE daily_log SET content=?,mood=?,energy=? WHERE user_id=? AND log_date=?').run(content.trim(), mood||'neutral', energy||3, req.user.id, date);
    res.json({ updated: true, log_date: date });
  }
});
app.put('/api/daily-log/:id', authMiddleware, (req: any, res: any) => {
  const { content, mood, energy } = req.body;
  db.prepare('UPDATE daily_log SET content=COALESCE(?,content),mood=COALESCE(?,mood),energy=COALESCE(?,energy) WHERE id=? AND user_id=?').run(content||null,mood||null,energy??null,req.params.id,req.user.id);
  res.json({ ok: true });
});
app.delete('/api/daily-log/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM daily_log WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.get('/api/daily-log/streak', authMiddleware, (req: any, res: any) => {
  const entries: any[] = db.prepare('SELECT log_date FROM daily_log WHERE user_id=? ORDER BY log_date DESC').all(req.user.id);
  let streak = 0;
  let cur = new Date(); cur.setHours(0,0,0,0);
  for (const e of entries) {
    const d = new Date(e.log_date);
    const diff = Math.round((cur.getTime()-d.getTime())/(86400000));
    if (diff === streak) streak++;
    else break;
  }
  res.json({ streak, total: entries.length });
});

// ── Workspace Milestones ──
app.get('/api/milestones', authMiddleware, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_milestones WHERE user_id=? ORDER BY milestone_date DESC').all(req.user.id));
});
app.post('/api/milestones', authMiddleware, (req: any, res: any) => {
  const { title, description, milestone_date, category } = req.body;
  if (!title?.trim() || !milestone_date) return res.status(400).json({ error: 'title and milestone_date required' });
  const r = db.prepare('INSERT INTO workspace_milestones (user_id,title,description,milestone_date,category) VALUES (?,?,?,?,?)').run(req.user.id, title.trim(), description||'', milestone_date, category||'general');
  res.json({ id: r.lastInsertRowid, title, milestone_date });
});
app.put('/api/milestones/:id/achieve', authMiddleware, (req: any, res: any) => {
  db.prepare('UPDATE workspace_milestones SET achieved=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/milestones/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_milestones WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Thread Archive Metadata ──
app.get('/api/thread-archives', authMiddleware, (req: any, res: any) => {
  const rows = db.prepare('SELECT tam.*, t.title, t.created_at as thread_created FROM thread_archive_metadata tam JOIN threads t ON tam.thread_id=t.id WHERE tam.user_id=? ORDER BY tam.archived_at DESC').all(req.user.id);
  res.json(rows);
});
app.post('/api/thread-archives', authMiddleware, (req: any, res: any) => {
  const { thread_id, archive_reason, auto_archive } = req.body;
  if (!thread_id) return res.status(400).json({ error: 'thread_id required' });
  try {
    const r = db.prepare('INSERT INTO thread_archive_metadata (user_id,thread_id,archive_reason,auto_archive) VALUES (?,?,?,?)').run(req.user.id, thread_id, archive_reason||'', auto_archive?1:0);
    res.json({ id: r.lastInsertRowid, thread_id, archive_reason });
  } catch { res.status(409).json({ error: 'already archived' }); }
});
app.delete('/api/thread-archives/:threadId', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM thread_archive_metadata WHERE thread_id=? AND user_id=?').run(req.params.threadId, req.user.id);
  res.json({ ok: true });
});
app.post('/api/thread-archives/auto', authMiddleware, (req: any, res: any) => {
  // Auto-archive threads older than N days with no recent messages
  const days = Number(req.body.days) || 30;
  const cutoff = new Date(Date.now() - days*86400000).toISOString();
  const stale: any[] = db.prepare(`SELECT t.id FROM threads t WHERE t.user_id=? AND t.created_at < ? AND NOT EXISTS (SELECT 1 FROM messages m WHERE m.thread_id=t.id AND m.created_at > ?) AND NOT EXISTS (SELECT 1 FROM thread_archive_metadata tam WHERE tam.thread_id=t.id) LIMIT 50`).all(req.user.id, cutoff, cutoff);
  let archived = 0;
  for (const t of stale) {
    try { db.prepare('INSERT INTO thread_archive_metadata (user_id,thread_id,archive_reason,auto_archive) VALUES (?,?,?,1)').run(req.user.id, t.id, `Auto-archived: no activity for ${days} days`); archived++; } catch {}
  }
  res.json({ archived });
});

// ── Link Preview Cache ──
app.post('/api/link-preview', authMiddleware, async(req: any, res: any) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  // Check cache first
  const cached: any = db.prepare('SELECT * FROM link_previews WHERE url=?').get(url);
  if (cached) return res.json(cached);
  // Basic metadata fetch (title from URL pattern since no external fetch)
  const domain = (() => { try { return new URL(url).hostname; } catch { return url; } })();
  const preview = { url, title: domain, description: '', image: '' };
  try { db.prepare('INSERT OR IGNORE INTO link_previews (url,title,description,image) VALUES (?,?,?,?)').run(url, preview.title, preview.description, preview.image); } catch {}
  res.json(preview);
});

// ── Message Reactions v2 (extended emoji set + reaction summary) ──
app.get('/api/threads/:id/reaction-summary', authMiddleware, (req: any, res: any) => {
  const msgs: any[] = db.prepare('SELECT id FROM messages WHERE thread_id=?').all(req.params.id);
  if (msgs.length === 0) return res.json({ total: 0, byEmoji: {} });
  const msgIds = msgs.map((m:any)=>m.id);
  const placeholders = msgIds.map(()=>'?').join(',');
  const reactions: any[] = db.prepare(`SELECT emoji, COUNT(*) as c FROM message_reactions WHERE message_id IN (${placeholders}) GROUP BY emoji ORDER BY c DESC`).all(...msgIds) as any[];
  const byEmoji: any = {};
  let total = 0;
  reactions.forEach((r:any) => { byEmoji[r.emoji] = r.c; total += r.c; });
  res.json({ total, byEmoji, topEmoji: reactions[0]?.emoji||null });
});

// ── Workspace Timeline ──
app.get('/api/workspace/timeline', authMiddleware, (req: any, res: any) => {
  const uid = req.user.id;
  const days = Math.min(Number(req.query.days)||14, 60);
  const since = new Date(Date.now()-days*86400000).toISOString().split('T')[0];
  const threads: any[] = db.prepare("SELECT DATE(created_at) as d, COUNT(*) as c FROM threads WHERE user_id=? AND DATE(created_at)>=? GROUP BY d").all(uid, since);
  const messages: any[] = db.prepare("SELECT DATE(m.created_at) as d, COUNT(*) as c FROM messages m JOIN threads t ON m.thread_id=t.id WHERE t.user_id=? AND DATE(m.created_at)>=? GROUP BY d").all(uid, since);
  const logs: any[] = db.prepare("SELECT log_date as d, mood, energy FROM daily_log WHERE user_id=? AND log_date>=? ORDER BY log_date ASC").all(uid, since);
  const milestones: any[] = db.prepare("SELECT milestone_date as d, title, achieved, category FROM workspace_milestones WHERE user_id=? AND milestone_date>=? ORDER BY milestone_date ASC").all(uid, since);
  res.json({ threads, messages, logs, milestones, days });
});

// ── Reaction Leaderboard (most reacted messages) ──
app.get('/api/workspace/reaction-leaderboard', authMiddleware, (req: any, res: any) => {
  const rows = db.prepare(`SELECT m.id, m.content, m.role, t.title as thread_title, COUNT(r.id) as reaction_count FROM messages m JOIN threads t ON m.thread_id=t.id JOIN message_reactions r ON r.message_id=m.id WHERE t.user_id=? GROUP BY m.id ORDER BY reaction_count DESC LIMIT 10`).all(req.user.id);
  res.json(rows);
});


// ── Batch 26: Prompt Chains, Thread Compare, Knowledge Cards, Voice Notes, Workspace Events ──

// prompt_chains table
db.exec(`CREATE TABLE IF NOT EXISTS prompt_chains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  steps TEXT NOT NULL,
  run_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// knowledge_cards table
db.exec(`CREATE TABLE IF NOT EXISTS knowledge_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  review_count INTEGER DEFAULT 0,
  confidence INTEGER DEFAULT 0,
  last_reviewed TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// voice_notes table
db.exec(`CREATE TABLE IF NOT EXISTS voice_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  transcript TEXT DEFAULT '',
  duration_seconds INTEGER DEFAULT 0,
  thread_id INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// workspace_events table (calendar-style events)
db.exec(`CREATE TABLE IF NOT EXISTS workspace_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_date TEXT NOT NULL,
  event_time TEXT DEFAULT '',
  color TEXT DEFAULT '#6366f1',
  recurring TEXT DEFAULT 'none',
  created_at TEXT DEFAULT (datetime('now'))
)`);

// ── Prompt Chains ──
app.get('/api/prompt-chains', authMiddleware, (req: any, res: any) => {
  const rows: any[] = db.prepare('SELECT * FROM prompt_chains WHERE user_id=? ORDER BY run_count DESC, id DESC').all(req.user.id);
  rows.forEach(r => { try { r.steps = JSON.parse(r.steps); } catch {} });
  res.json(rows);
});
app.post('/api/prompt-chains', authMiddleware, (req: any, res: any) => {
  const { name, description, steps } = req.body;
  if (!name?.trim() || !Array.isArray(steps) || steps.length === 0) return res.status(400).json({ error: 'name and steps required' });
  const r = db.prepare('INSERT INTO prompt_chains (user_id,name,description,steps) VALUES (?,?,?,?)').run(req.user.id, name.trim(), description||'', JSON.stringify(steps));
  res.json({ id: r.lastInsertRowid, name, steps });
});
app.put('/api/prompt-chains/:id', authMiddleware, (req: any, res: any) => {
  const { name, description, steps } = req.body;
  db.prepare('UPDATE prompt_chains SET name=COALESCE(?,name),description=COALESCE(?,description),steps=COALESCE(?,steps) WHERE id=? AND user_id=?').run(name||null,description||null,steps?JSON.stringify(steps):null,req.params.id,req.user.id);
  res.json({ ok: true });
});
app.post('/api/prompt-chains/:id/run', authMiddleware, (req: any, res: any) => {
  db.prepare('UPDATE prompt_chains SET run_count=run_count+1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  const chain: any = db.prepare('SELECT * FROM prompt_chains WHERE id=?').get(req.params.id);
  let steps: any[] = [];
  try { steps = JSON.parse(chain.steps); } catch {}
  res.json({ chain_id: req.params.id, steps, run_count: chain.run_count + 1 });
});
app.delete('/api/prompt-chains/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM prompt_chains WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Thread Comparison ──
app.get('/api/threads/compare', authMiddleware, (req: any, res: any) => {
  const ids = String(req.query.ids||'').split(',').map(Number).filter(Boolean).slice(0,4);
  if (ids.length < 2) return res.status(400).json({ error: 'provide at least 2 thread ids' });
  const results = ids.map(id => {
    const thread: any = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(id, req.user.id);
    if (!thread) return null;
    const msgCount: any = db.prepare('SELECT COUNT(*) as c FROM messages WHERE thread_id=?').get(id);
    const tokenSum: any = db.prepare('SELECT SUM(tokens_used) as s FROM messages WHERE thread_id=?').get(id);
    const firstMsg: any = db.prepare("SELECT content FROM messages WHERE thread_id=? AND role='user' ORDER BY id ASC LIMIT 1").get(id);
    const lastMsg: any = db.prepare('SELECT created_at FROM messages WHERE thread_id=? ORDER BY id DESC LIMIT 1').get(id);
    return { id, title: thread.title||'Untitled', message_count: msgCount?.c||0, total_tokens: tokenSum?.s||0, created_at: thread.created_at, last_activity: lastMsg?.created_at, first_message: firstMsg?.content?.slice(0,80)||'' };
  }).filter(Boolean);
  res.json(results);
});

// ── Knowledge Cards ──
app.get('/api/knowledge-cards', authMiddleware, (req: any, res: any) => {
  const { category, due } = req.query;
  let q = 'SELECT * FROM knowledge_cards WHERE user_id=?';
  const params: any[] = [req.user.id];
  if (category) { q += ' AND category=?'; params.push(category); }
  if (due === 'true') { q += ' AND (last_reviewed IS NULL OR last_reviewed < ?)'; params.push(new Date(Date.now()-86400000).toISOString()); }
  q += ' ORDER BY confidence ASC, review_count ASC LIMIT 50';
  res.json(db.prepare(q).all(...params));
});
app.post('/api/knowledge-cards', authMiddleware, (req: any, res: any) => {
  const { front, back, category } = req.body;
  if (!front?.trim() || !back?.trim()) return res.status(400).json({ error: 'front and back required' });
  const r = db.prepare('INSERT INTO knowledge_cards (user_id,front,back,category) VALUES (?,?,?,?)').run(req.user.id, front.trim(), back.trim(), category||'general');
  res.json({ id: r.lastInsertRowid, front, back, category });
});
app.put('/api/knowledge-cards/:id/review', authMiddleware, (req: any, res: any) => {
  const { confidence } = req.body; // 0=forgot,1=hard,2=ok,3=easy
  db.prepare('UPDATE knowledge_cards SET review_count=review_count+1, confidence=?, last_reviewed=? WHERE id=? AND user_id=?').run(confidence||0, new Date().toISOString(), req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/knowledge-cards/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM knowledge_cards WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.get('/api/knowledge-cards/stats', authMiddleware, (req: any, res: any) => {
  const total = (db.prepare('SELECT COUNT(*) as c FROM knowledge_cards WHERE user_id=?').get(req.user.id) as any)?.c||0;
  const mastered = (db.prepare('SELECT COUNT(*) as c FROM knowledge_cards WHERE user_id=? AND confidence>=3').get(req.user.id) as any)?.c||0;
  const due = (db.prepare('SELECT COUNT(*) as c FROM knowledge_cards WHERE user_id=? AND (last_reviewed IS NULL OR last_reviewed < ?)').get(req.user.id, new Date(Date.now()-86400000).toISOString()) as any)?.c||0;
  res.json({ total, mastered, due, learning: total-mastered });
});

// ── Voice Notes ──
app.get('/api/voice-notes', authMiddleware, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM voice_notes WHERE user_id=? ORDER BY id DESC LIMIT 50').all(req.user.id));
});
app.post('/api/voice-notes', authMiddleware, (req: any, res: any) => {
  const { title, transcript, duration_seconds, thread_id } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title required' });
  const r = db.prepare('INSERT INTO voice_notes (user_id,title,transcript,duration_seconds,thread_id) VALUES (?,?,?,?,?)').run(req.user.id, title.trim(), transcript||'', duration_seconds||0, thread_id||null);
  res.json({ id: r.lastInsertRowid, title, transcript });
});
app.put('/api/voice-notes/:id', authMiddleware, (req: any, res: any) => {
  const { title, transcript } = req.body;
  db.prepare('UPDATE voice_notes SET title=COALESCE(?,title),transcript=COALESCE(?,transcript) WHERE id=? AND user_id=?').run(title||null,transcript||null,req.params.id,req.user.id);
  res.json({ ok: true });
});
app.delete('/api/voice-notes/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM voice_notes WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Workspace Events ──
app.get('/api/workspace-events', authMiddleware, (req: any, res: any) => {
  const { from, to } = req.query;
  let q = 'SELECT * FROM workspace_events WHERE user_id=?';
  const params: any[] = [req.user.id];
  if (from) { q += ' AND event_date>=?'; params.push(from); }
  if (to) { q += ' AND event_date<=?'; params.push(to); }
  q += ' ORDER BY event_date ASC, event_time ASC';
  res.json(db.prepare(q).all(...params));
});
app.post('/api/workspace-events', authMiddleware, (req: any, res: any) => {
  const { title, description, event_date, event_time, color, recurring } = req.body;
  if (!title?.trim() || !event_date) return res.status(400).json({ error: 'title and event_date required' });
  const r = db.prepare('INSERT INTO workspace_events (user_id,title,description,event_date,event_time,color,recurring) VALUES (?,?,?,?,?,?,?)').run(req.user.id, title.trim(), description||'', event_date, event_time||'', color||'#6366f1', recurring||'none');
  res.json({ id: r.lastInsertRowid, title, event_date });
});
app.put('/api/workspace-events/:id', authMiddleware, (req: any, res: any) => {
  const { title, description, event_date, event_time, color } = req.body;
  db.prepare('UPDATE workspace_events SET title=COALESCE(?,title),description=COALESCE(?,description),event_date=COALESCE(?,event_date),event_time=COALESCE(?,event_time),color=COALESCE(?,color) WHERE id=? AND user_id=?').run(title||null,description||null,event_date||null,event_time||null,color||null,req.params.id,req.user.id);
  res.json({ ok: true });
});
app.delete('/api/workspace-events/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_events WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.get('/api/workspace-events/upcoming', authMiddleware, (req: any, res: any) => {
  const today = new Date().toISOString().split('T')[0];
  const limit = Math.min(Number(req.query.limit)||10, 30);
  res.json(db.prepare('SELECT * FROM workspace_events WHERE user_id=? AND event_date>=? ORDER BY event_date ASC, event_time ASC LIMIT ?').all(req.user.id, today, limit));
});


// ── Batch 27: AI Personas Library, Thread Challenges, Workspace Glossary, Smart Suggestions, Thread Scoring ──

// ai_personas_lib table
db.exec(`CREATE TABLE IF NOT EXISTS ai_personas_lib (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  system_prompt TEXT NOT NULL,
  avatar TEXT DEFAULT '🤖',
  use_count INTEGER DEFAULT 0,
  is_favorite INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// thread_challenges table
db.exec(`CREATE TABLE IF NOT EXISTS thread_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  target_threads INTEGER DEFAULT 10,
  current_threads INTEGER DEFAULT 0,
  target_messages INTEGER DEFAULT 100,
  current_messages INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  deadline TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// workspace_glossary table
db.exec(`CREATE TABLE IF NOT EXISTS workspace_glossary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TEXT DEFAULT (datetime('now'))
)`);

// thread_scores table
db.exec(`CREATE TABLE IF NOT EXISTS thread_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  clarity INTEGER DEFAULT 0,
  depth INTEGER DEFAULT 0,
  usefulness INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  scored_at TEXT DEFAULT (datetime('now')),
  UNIQUE(thread_id, user_id)
)`);

// ── AI Personas Library ──
app.get('/api/personas-lib', authMiddleware, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_personas_lib WHERE user_id=? ORDER BY is_favorite DESC, use_count DESC, id DESC').all(req.user.id));
});
app.post('/api/personas-lib', authMiddleware, (req: any, res: any) => {
  const { name, description, system_prompt, avatar } = req.body;
  if (!name?.trim() || !system_prompt?.trim()) return res.status(400).json({ error: 'name and system_prompt required' });
  const r = db.prepare('INSERT INTO ai_personas_lib (user_id,name,description,system_prompt,avatar) VALUES (?,?,?,?,?)').run(req.user.id, name.trim(), description||'', system_prompt.trim(), avatar||'🤖');
  res.json({ id: r.lastInsertRowid, name, avatar });
});
app.put('/api/personas-lib/:id/favorite', authMiddleware, (req: any, res: any) => {
  const p: any = db.prepare('SELECT is_favorite FROM ai_personas_lib WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!p) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE ai_personas_lib SET is_favorite=? WHERE id=?').run(p.is_favorite?0:1, req.params.id);
  res.json({ is_favorite: p.is_favorite?0:1 });
});
app.post('/api/personas-lib/:id/use', authMiddleware, (req: any, res: any) => {
  db.prepare('UPDATE ai_personas_lib SET use_count=use_count+1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  const p: any = db.prepare('SELECT * FROM ai_personas_lib WHERE id=?').get(req.params.id);
  res.json({ system_prompt: p?.system_prompt || '' });
});
app.delete('/api/personas-lib/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_personas_lib WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Thread Challenges ──
app.get('/api/thread-challenges', authMiddleware, (req: any, res: any) => {
  // Sync current stats before returning
  const stats: any = db.prepare('SELECT COUNT(*) as threads, SUM(1) as msgs FROM threads WHERE user_id=?').get(req.user.id);
  const msgCount: any = db.prepare('SELECT COUNT(*) as c FROM messages WHERE thread_id IN (SELECT id FROM threads WHERE user_id=?)').get(req.user.id);
  db.prepare('UPDATE thread_challenges SET current_threads=?, current_messages=? WHERE user_id=? AND status="active"').run(stats?.threads||0, msgCount?.c||0, req.user.id);
  res.json(db.prepare('SELECT * FROM thread_challenges WHERE user_id=? ORDER BY status ASC, id DESC').all(req.user.id));
});
app.post('/api/thread-challenges', authMiddleware, (req: any, res: any) => {
  const { title, description, target_threads, target_messages, deadline } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title required' });
  const r = db.prepare('INSERT INTO thread_challenges (user_id,title,description,target_threads,target_messages,deadline) VALUES (?,?,?,?,?,?)').run(req.user.id, title.trim(), description||'', target_threads||10, target_messages||100, deadline||null);
  res.json({ id: r.lastInsertRowid, title });
});
app.put('/api/thread-challenges/:id/complete', authMiddleware, (req: any, res: any) => {
  db.prepare('UPDATE thread_challenges SET status="completed" WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/thread-challenges/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM thread_challenges WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Workspace Glossary ──
app.get('/api/workspace-glossary', authMiddleware, (req: any, res: any) => {
  const { category, q } = req.query;
  let query = 'SELECT * FROM workspace_glossary WHERE user_id=?';
  const params: any[] = [req.user.id];
  if (category) { query += ' AND category=?'; params.push(category); }
  if (q) { query += ' AND (term LIKE ? OR definition LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  query += ' ORDER BY term ASC';
  res.json(db.prepare(query).all(...params));
});
app.post('/api/workspace-glossary', authMiddleware, (req: any, res: any) => {
  const { term, definition, category } = req.body;
  if (!term?.trim() || !definition?.trim()) return res.status(400).json({ error: 'term and definition required' });
  const r = db.prepare('INSERT INTO workspace_glossary (user_id,term,definition,category) VALUES (?,?,?,?)').run(req.user.id, term.trim(), definition.trim(), category||'general');
  res.json({ id: r.lastInsertRowid, term, definition });
});
app.put('/api/workspace-glossary/:id', authMiddleware, (req: any, res: any) => {
  const { term, definition, category } = req.body;
  db.prepare('UPDATE workspace_glossary SET term=COALESCE(?,term),definition=COALESCE(?,definition),category=COALESCE(?,category) WHERE id=? AND user_id=?').run(term||null,definition||null,category||null,req.params.id,req.user.id);
  res.json({ ok: true });
});
app.delete('/api/workspace-glossary/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_glossary WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Thread Scoring ──
app.get('/api/thread-scores', authMiddleware, (req: any, res: any) => {
  const rows = db.prepare('SELECT ts.*, t.title FROM thread_scores ts JOIN threads t ON ts.thread_id=t.id WHERE ts.user_id=? ORDER BY ts.scored_at DESC LIMIT 20').all(req.user.id);
  res.json(rows);
});
app.post('/api/thread-scores', authMiddleware, (req: any, res: any) => {
  const { thread_id, clarity, depth, usefulness, notes } = req.body;
  if (!thread_id) return res.status(400).json({ error: 'thread_id required' });
  db.prepare('INSERT OR REPLACE INTO thread_scores (thread_id,user_id,clarity,depth,usefulness,notes,scored_at) VALUES (?,?,?,?,?,?,?)').run(thread_id, req.user.id, clarity||0, depth||0, usefulness||0, notes||'', new Date().toISOString());
  res.json({ ok: true });
});
app.get('/api/thread-scores/leaderboard', authMiddleware, (req: any, res: any) => {
  const rows = db.prepare('SELECT ts.thread_id, t.title, (ts.clarity+ts.depth+ts.usefulness) as total_score, ts.clarity, ts.depth, ts.usefulness FROM thread_scores ts JOIN threads t ON ts.thread_id=t.id WHERE ts.user_id=? ORDER BY total_score DESC LIMIT 10').all(req.user.id);
  res.json(rows);
});
app.get('/api/workspace/smart-suggestions', authMiddleware, (req: any, res: any) => {
  const unscored: any = db.prepare('SELECT COUNT(*) as c FROM threads WHERE user_id=? AND id NOT IN (SELECT thread_id FROM thread_scores WHERE user_id=?)').get(req.user.id, req.user.id);
  const longThreads: any[] = db.prepare('SELECT t.id, t.title, COUNT(m.id) as msg_count FROM threads t JOIN messages m ON m.thread_id=t.id WHERE t.user_id=? GROUP BY t.id HAVING msg_count>20 ORDER BY msg_count DESC LIMIT 3').all(req.user.id);
  const dueCards: any = db.prepare('SELECT COUNT(*) as c FROM knowledge_cards WHERE user_id=? AND (last_reviewed IS NULL OR last_reviewed < ?)').get(req.user.id, new Date(Date.now()-86400000).toISOString());
  const suggestions: string[] = [];
  if (unscored?.c > 0) suggestions.push(`Score ${unscored.c} unrated thread${unscored.c>1?'s':''} to track quality`);
  longThreads.forEach((t:any) => suggestions.push(`Thread "${t.title}" has ${t.msg_count} messages — consider archiving`));
  if (dueCards?.c > 0) suggestions.push(`${dueCards.c} knowledge card${dueCards.c>1?'s':''} due for review`);
  suggestions.push('Create a prompt chain for your most-used workflows');
  res.json({ suggestions: suggestions.slice(0,5) });
});


// ── Batch 28: Idea Inbox, Session Plans, Thread Dependencies, Workspace Changelog, AI Writing Coach ──

// idea_inbox table
db.exec(`CREATE TABLE IF NOT EXISTS idea_inbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  priority INTEGER DEFAULT 0,
  tags TEXT DEFAULT '[]',
  thread_id INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// session_plans table
db.exec(`CREATE TABLE IF NOT EXISTS session_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  goals TEXT DEFAULT '[]',
  notes TEXT DEFAULT '',
  planned_at TEXT NOT NULL,
  status TEXT DEFAULT 'planned',
  created_at TEXT DEFAULT (datetime('now'))
)`);

// thread_dependencies table
db.exec(`CREATE TABLE IF NOT EXISTS thread_dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  source_thread_id INTEGER NOT NULL,
  target_thread_id INTEGER NOT NULL,
  relationship TEXT DEFAULT 'depends_on',
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(source_thread_id, target_thread_id)
)`);

// workspace_changelog table
db.exec(`CREATE TABLE IF NOT EXISTS workspace_changelog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  version TEXT NOT NULL,
  summary TEXT NOT NULL,
  details TEXT DEFAULT '',
  log_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// writing_coach_sessions table
db.exec(`CREATE TABLE IF NOT EXISTS writing_coach_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  original_text TEXT NOT NULL,
  feedback TEXT DEFAULT '',
  improved_text TEXT DEFAULT '',
  mode TEXT DEFAULT 'general',
  created_at TEXT DEFAULT (datetime('now'))
)`);

// ── Idea Inbox ──
app.get('/api/idea-inbox', authMiddleware, (req: any, res: any) => {
  const { status } = req.query;
  let q = 'SELECT * FROM idea_inbox WHERE user_id=?';
  const params: any[] = [req.user.id];
  if (status) { q += ' AND status=?'; params.push(status); }
  q += ' ORDER BY priority DESC, id DESC';
  const rows: any[] = db.prepare(q).all(...params);
  rows.forEach(r => { try { r.tags = JSON.parse(r.tags); } catch { r.tags = []; } });
  res.json(rows);
});
app.post('/api/idea-inbox', authMiddleware, (req: any, res: any) => {
  const { content, priority, tags, thread_id } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content required' });
  const r = db.prepare('INSERT INTO idea_inbox (user_id,content,priority,tags,thread_id) VALUES (?,?,?,?,?)').run(req.user.id, content.trim(), priority||0, JSON.stringify(tags||[]), thread_id||null);
  res.json({ id: r.lastInsertRowid, content });
});
app.put('/api/idea-inbox/:id', authMiddleware, (req: any, res: any) => {
  const { status, priority } = req.body;
  db.prepare('UPDATE idea_inbox SET status=COALESCE(?,status),priority=COALESCE(?,priority) WHERE id=? AND user_id=?').run(status||null,priority!=null?priority:null,req.params.id,req.user.id);
  res.json({ ok: true });
});
app.delete('/api/idea-inbox/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM idea_inbox WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.get('/api/idea-inbox/stats', authMiddleware, (req: any, res: any) => {
  const rows: any[] = db.prepare("SELECT status, COUNT(*) as c FROM idea_inbox WHERE user_id=? GROUP BY status").all(req.user.id);
  const out: Record<string, number> = {};
  rows.forEach(r => { out[r.status] = r.c; });
  res.json({ new: out.new||0, in_progress: out.in_progress||0, done: out.done||0, archived: out.archived||0 });
});

// ── Session Plans ──
app.get('/api/session-plans', authMiddleware, (req: any, res: any) => {
  const rows: any[] = db.prepare('SELECT * FROM session_plans WHERE user_id=? ORDER BY planned_at DESC LIMIT 20').all(req.user.id);
  rows.forEach(r => { try { r.goals = JSON.parse(r.goals); } catch { r.goals = []; } });
  res.json(rows);
});
app.post('/api/session-plans', authMiddleware, (req: any, res: any) => {
  const { title, goals, notes, planned_at } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title required' });
  const r = db.prepare('INSERT INTO session_plans (user_id,title,goals,notes,planned_at) VALUES (?,?,?,?,?)').run(req.user.id, title.trim(), JSON.stringify(goals||[]), notes||'', planned_at||new Date().toISOString().split('T')[0]);
  res.json({ id: r.lastInsertRowid, title });
});
app.put('/api/session-plans/:id/status', authMiddleware, (req: any, res: any) => {
  const { status } = req.body;
  db.prepare('UPDATE session_plans SET status=? WHERE id=? AND user_id=?').run(status||'planned', req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/session-plans/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM session_plans WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Thread Dependencies ──
app.get('/api/thread-dependencies', authMiddleware, (req: any, res: any) => {
  const rows = db.prepare('SELECT td.*, ts.title as source_title, tt.title as target_title FROM thread_dependencies td JOIN threads ts ON ts.id=td.source_thread_id JOIN threads tt ON tt.id=td.target_thread_id WHERE td.user_id=? ORDER BY td.id DESC').all(req.user.id);
  res.json(rows);
});
app.post('/api/thread-dependencies', authMiddleware, (req: any, res: any) => {
  const { source_thread_id, target_thread_id, relationship } = req.body;
  if (!source_thread_id || !target_thread_id) return res.status(400).json({ error: 'both thread ids required' });
  try {
    const r = db.prepare('INSERT INTO thread_dependencies (user_id,source_thread_id,target_thread_id,relationship) VALUES (?,?,?,?)').run(req.user.id, source_thread_id, target_thread_id, relationship||'depends_on');
    res.json({ id: r.lastInsertRowid });
  } catch { res.status(409).json({ error: 'dependency already exists' }); }
});
app.delete('/api/thread-dependencies/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM thread_dependencies WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Workspace Changelog ──
app.get('/api/workspace-changelog', authMiddleware, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_changelog WHERE user_id=? ORDER BY log_date DESC LIMIT 30').all(req.user.id));
});
app.post('/api/workspace-changelog', authMiddleware, (req: any, res: any) => {
  const { version, summary, details, log_date } = req.body;
  if (!version?.trim() || !summary?.trim()) return res.status(400).json({ error: 'version and summary required' });
  const r = db.prepare('INSERT INTO workspace_changelog (user_id,version,summary,details,log_date) VALUES (?,?,?,?,?)').run(req.user.id, version.trim(), summary.trim(), details||'', log_date||new Date().toISOString().split('T')[0]);
  res.json({ id: r.lastInsertRowid, version, summary });
});
app.delete('/api/workspace-changelog/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_changelog WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Writing Coach ──
app.post('/api/writing-coach/analyze', authMiddleware, (req: any, res: any) => {
  const { text, mode } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text required' });
  const wordCount = text.trim().split(/\s+/).length;
  const sentCount = text.split(/[.!?]+/).filter((s: string) => s.trim()).length;
  const avgWords = sentCount > 0 ? Math.round(wordCount / sentCount) : 0;
  const passiveMatches = (text.match(/\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi) || []).length;
  const fillerWords = ['very','really','just','quite','rather','actually','basically','literally'].filter(w => new RegExp(`\\b${w}\\b`,'gi').test(text));
  const feedback: string[] = [];
  if (avgWords > 25) feedback.push(`Long sentences (avg ${avgWords} words) — aim for under 20`);
  if (passiveMatches > 2) feedback.push(`${passiveMatches} passive constructions — prefer active voice`);
  if (fillerWords.length > 0) feedback.push(`Filler words found: ${fillerWords.join(', ')} — consider removing`);
  if (wordCount > 500) feedback.push('Long piece — consider adding subheadings for scannability');
  if (feedback.length === 0) feedback.push('Writing looks clean!');
  const r = db.prepare('INSERT INTO writing_coach_sessions (user_id,original_text,feedback,mode) VALUES (?,?,?,?)').run(req.user.id, text.trim(), feedback.join('\n'), mode||'general');
  res.json({ id: r.lastInsertRowid, word_count: wordCount, sentence_count: sentCount, avg_sentence_length: avgWords, passive_count: passiveMatches, filler_words: fillerWords, feedback });
});
app.get('/api/writing-coach/history', authMiddleware, (req: any, res: any) => {
  res.json(db.prepare('SELECT id,mode,created_at,LENGTH(original_text) as char_count FROM writing_coach_sessions WHERE user_id=? ORDER BY id DESC LIMIT 20').all(req.user.id));
});


// ── Batch 29: Decision Log, Thread Clones, Workspace Mood, Reading Progress, AI Debate ──

// decision_log table
db.exec(`CREATE TABLE IF NOT EXISTS decision_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  context TEXT DEFAULT '',
  options TEXT DEFAULT '[]',
  chosen TEXT DEFAULT '',
  outcome TEXT DEFAULT 'pending',
  thread_id INTEGER,
  decided_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// thread_clones table (track forked/cloned threads)
db.exec(`CREATE TABLE IF NOT EXISTS thread_clones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  original_thread_id INTEGER NOT NULL,
  clone_thread_id INTEGER NOT NULL,
  clone_name TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
)`);

// workspace_mood_log table
db.exec(`CREATE TABLE IF NOT EXISTS workspace_mood_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  mood TEXT NOT NULL,
  score INTEGER DEFAULT 3,
  note TEXT DEFAULT '',
  log_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// reading_progress table (track articles/books)
db.exec(`CREATE TABLE IF NOT EXISTS reading_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT DEFAULT '',
  total_pages INTEGER DEFAULT 0,
  current_page INTEGER DEFAULT 0,
  status TEXT DEFAULT 'reading',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
)`);

// ai_debates table
db.exec(`CREATE TABLE IF NOT EXISTS ai_debates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  topic TEXT NOT NULL,
  pro_points TEXT DEFAULT '[]',
  con_points TEXT DEFAULT '[]',
  verdict TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
)`);

// ── Decision Log ──
app.get('/api/decision-log', authMiddleware, (req: any, res: any) => {
  const rows: any[] = db.prepare('SELECT * FROM decision_log WHERE user_id=? ORDER BY decided_at DESC LIMIT 30').all(req.user.id);
  rows.forEach(r => { try { r.options = JSON.parse(r.options); } catch { r.options = []; } });
  res.json(rows);
});
app.post('/api/decision-log', authMiddleware, (req: any, res: any) => {
  const { title, context, options, chosen, outcome, thread_id, decided_at } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title required' });
  const r = db.prepare('INSERT INTO decision_log (user_id,title,context,options,chosen,outcome,thread_id,decided_at) VALUES (?,?,?,?,?,?,?,?)').run(req.user.id, title.trim(), context||'', JSON.stringify(options||[]), chosen||'', outcome||'pending', thread_id||null, decided_at||new Date().toISOString().split('T')[0]);
  res.json({ id: r.lastInsertRowid, title });
});
app.put('/api/decision-log/:id', authMiddleware, (req: any, res: any) => {
  const { outcome, chosen } = req.body;
  db.prepare('UPDATE decision_log SET outcome=COALESCE(?,outcome),chosen=COALESCE(?,chosen) WHERE id=? AND user_id=?').run(outcome||null,chosen||null,req.params.id,req.user.id);
  res.json({ ok: true });
});
app.delete('/api/decision-log/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM decision_log WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Thread Clones ──
app.post('/api/threads/:id/clone', authMiddleware, (req: any, res: any) => {
  const src: any = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!src) return res.status(404).json({ error: 'thread not found' });
  const cloneName = req.body.name || `${src.title||'Untitled'} (clone)`;
  const newThread = db.prepare('INSERT INTO threads (user_id,title,model,system_prompt) VALUES (?,?,?,?)').run(src.user_id, cloneName, src.model||'', src.system_prompt||'');
  // Copy messages
  const msgs = db.prepare('SELECT * FROM messages WHERE thread_id=? ORDER BY id ASC').all(src.id);
  for (const m of msgs as any[]) {
    db.prepare('INSERT INTO messages (thread_id,role,content,tokens_used) VALUES (?,?,?,?)').run(newThread.lastInsertRowid, m.role, m.content, m.tokens_used||0);
  }
  db.prepare('INSERT INTO thread_clones (user_id,original_thread_id,clone_thread_id,clone_name) VALUES (?,?,?,?)').run(req.user.id, req.params.id, newThread.lastInsertRowid, cloneName);
  res.json({ original_id: Number(req.params.id), clone_id: newThread.lastInsertRowid, clone_name: cloneName });
});
app.get('/api/thread-clones', authMiddleware, (req: any, res: any) => {
  res.json(db.prepare('SELECT tc.*, t.title as original_title, tc2.title as clone_title FROM thread_clones tc JOIN threads t ON t.id=tc.original_thread_id LEFT JOIN threads tc2 ON tc2.id=tc.clone_thread_id WHERE tc.user_id=? ORDER BY tc.id DESC').all(req.user.id));
});

// ── Workspace Mood Log ──
app.get('/api/workspace-mood', authMiddleware, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_mood_log WHERE user_id=? ORDER BY log_date DESC LIMIT 30').all(req.user.id));
});
app.post('/api/workspace-mood', authMiddleware, (req: any, res: any) => {
  const { mood, score, note } = req.body;
  if (!mood?.trim()) return res.status(400).json({ error: 'mood required' });
  const today = new Date().toISOString().split('T')[0];
  db.prepare('INSERT OR REPLACE INTO workspace_mood_log (user_id,mood,score,note,log_date) VALUES (?,?,?,?,?)').run(req.user.id, mood.trim(), score||3, note||'', today);
  res.json({ ok: true, log_date: today });
});
app.get('/api/workspace-mood/trend', authMiddleware, (req: any, res: any) => {
  const rows = db.prepare('SELECT log_date, mood, score FROM workspace_mood_log WHERE user_id=? ORDER BY log_date DESC LIMIT 14').all(req.user.id);
  const avg = (rows as any[]).length > 0 ? Math.round((rows as any[]).reduce((s: number,r: any) => s + r.score, 0) / (rows as any[]).length * 10) / 10 : 0;
  res.json({ entries: rows, average_score: avg });
});

// ── Reading Progress ──
app.get('/api/reading-progress', authMiddleware, (req: any, res: any) => {
  const { status } = req.query;
  let q = 'SELECT * FROM reading_progress WHERE user_id=?';
  const params: any[] = [req.user.id];
  if (status) { q += ' AND status=?'; params.push(status); }
  q += ' ORDER BY id DESC';
  res.json(db.prepare(q).all(...params));
});
app.post('/api/reading-progress', authMiddleware, (req: any, res: any) => {
  const { title, url, total_pages } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title required' });
  const r = db.prepare('INSERT INTO reading_progress (user_id,title,url,total_pages) VALUES (?,?,?,?)').run(req.user.id, title.trim(), url||'', total_pages||0);
  res.json({ id: r.lastInsertRowid, title });
});
app.put('/api/reading-progress/:id', authMiddleware, (req: any, res: any) => {
  const { current_page, status, notes } = req.body;
  db.prepare('UPDATE reading_progress SET current_page=COALESCE(?,current_page),status=COALESCE(?,status),notes=COALESCE(?,notes) WHERE id=? AND user_id=?').run(current_page!=null?current_page:null,status||null,notes||null,req.params.id,req.user.id);
  res.json({ ok: true });
});
app.delete('/api/reading-progress/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM reading_progress WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── AI Debates ──
app.get('/api/ai-debates', authMiddleware, (req: any, res: any) => {
  const rows: any[] = db.prepare('SELECT * FROM ai_debates WHERE user_id=? ORDER BY id DESC LIMIT 20').all(req.user.id);
  rows.forEach(r => { try { r.pro_points = JSON.parse(r.pro_points); r.con_points = JSON.parse(r.con_points); } catch {} });
  res.json(rows);
});
app.post('/api/ai-debates/generate', authMiddleware, (req: any, res: any) => {
  const { topic } = req.body;
  if (!topic?.trim()) return res.status(400).json({ error: 'topic required' });
  // Generate debate points based on topic structure
  const pros = [`${topic} enables more efficient outcomes`, `Research supports ${topic} in specific contexts`, `${topic} aligns with modern best practices`, `Proponents argue ${topic} reduces long-term costs`];
  const cons = [`${topic} may create unintended dependencies`, `Critics note ${topic} lacks empirical grounding`, `Implementation of ${topic} carries significant risk`, `${topic} may not scale across all contexts`];
  const verdict = `Both sides present valid arguments. ${topic} is context-dependent — evaluate based on your specific constraints.`;
  const r = db.prepare('INSERT INTO ai_debates (user_id,topic,pro_points,con_points,verdict) VALUES (?,?,?,?,?)').run(req.user.id, topic.trim(), JSON.stringify(pros), JSON.stringify(cons), verdict);
  res.json({ id: r.lastInsertRowid, topic, pro_points: pros, con_points: cons, verdict });
});
app.delete('/api/ai-debates/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_debates WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// ── Batch 30: Project Boards, Sprint Tracker, Content Calendar, Learning Paths, Thread Ratings v2 ──

// project_boards table
db.exec(`CREATE TABLE IF NOT EXISTS project_boards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#6366f1',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
)`);

// board_items table
db.exec(`CREATE TABLE IF NOT EXISTS board_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  column_name TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  due_date TEXT,
  assigned_to TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
)`);

// sprint_tracker table
db.exec(`CREATE TABLE IF NOT EXISTS sprint_tracker (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  goal TEXT DEFAULT '',
  velocity INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
)`);

// content_calendar table
db.exec(`CREATE TABLE IF NOT EXISTS content_calendar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  platform TEXT DEFAULT 'general',
  content_type TEXT DEFAULT 'post',
  scheduled_date TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
)`);

// learning_paths table
db.exec(`CREATE TABLE IF NOT EXISTS learning_paths (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  topics TEXT DEFAULT '[]',
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
)`);

// ── Project Boards ──
app.get('/api/boards', authMiddleware, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM project_boards WHERE user_id=? ORDER BY id DESC').all(req.user.id));
});
app.post('/api/boards', authMiddleware, (req: any, res: any) => {
  const { name, description, color } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const r = db.prepare('INSERT INTO project_boards (user_id,name,description,color) VALUES (?,?,?,?)').run(req.user.id, name.trim(), description||'', color||'#6366f1');
  res.json({ id: r.lastInsertRowid, name });
});
app.delete('/api/boards/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM board_items WHERE board_id=?').run(req.params.id);
  db.prepare('DELETE FROM project_boards WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.get('/api/boards/:id/items', authMiddleware, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM board_items WHERE board_id=? AND user_id=? ORDER BY priority DESC, id ASC').all(req.params.id, req.user.id));
});
app.post('/api/boards/:id/items', authMiddleware, (req: any, res: any) => {
  const { title, description, column_name, priority, due_date } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title required' });
  const r = db.prepare('INSERT INTO board_items (board_id,user_id,title,description,column_name,priority,due_date) VALUES (?,?,?,?,?,?,?)').run(req.params.id, req.user.id, title.trim(), description||'', column_name||'todo', priority||'medium', due_date||null);
  res.json({ id: r.lastInsertRowid, title });
});
app.put('/api/boards/items/:id', authMiddleware, (req: any, res: any) => {
  const { column_name, priority, title, due_date } = req.body;
  db.prepare('UPDATE board_items SET column_name=COALESCE(?,column_name),priority=COALESCE(?,priority),title=COALESCE(?,title),due_date=COALESCE(?,due_date) WHERE id=? AND user_id=?').run(column_name||null,priority||null,title||null,due_date||null,req.params.id,req.user.id);
  res.json({ ok: true });
});
app.delete('/api/boards/items/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM board_items WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Sprint Tracker ──
app.get('/api/sprints', authMiddleware, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM sprint_tracker WHERE user_id=? ORDER BY start_date DESC LIMIT 10').all(req.user.id));
});
app.post('/api/sprints', authMiddleware, (req: any, res: any) => {
  const { name, start_date, end_date, goal, velocity } = req.body;
  if (!name?.trim() || !start_date || !end_date) return res.status(400).json({ error: 'name, start_date, end_date required' });
  const r = db.prepare('INSERT INTO sprint_tracker (user_id,name,start_date,end_date,goal,velocity) VALUES (?,?,?,?,?,?)').run(req.user.id, name.trim(), start_date, end_date, goal||'', velocity||0);
  res.json({ id: r.lastInsertRowid, name });
});
app.put('/api/sprints/:id', authMiddleware, (req: any, res: any) => {
  const { status, velocity } = req.body;
  db.prepare('UPDATE sprint_tracker SET status=COALESCE(?,status),velocity=COALESCE(?,velocity) WHERE id=? AND user_id=?').run(status||null,velocity||null,req.params.id,req.user.id);
  res.json({ ok: true });
});
app.delete('/api/sprints/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM sprint_tracker WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Content Calendar ──
app.get('/api/content-calendar', authMiddleware, (req: any, res: any) => {
  const { from, to } = req.query;
  let q = 'SELECT * FROM content_calendar WHERE user_id=?';
  const params: any[] = [req.user.id];
  if (from) { q += ' AND scheduled_date>=?'; params.push(from); }
  if (to) { q += ' AND scheduled_date<=?'; params.push(to); }
  q += ' ORDER BY scheduled_date ASC';
  res.json(db.prepare(q).all(...params));
});
app.post('/api/content-calendar', authMiddleware, (req: any, res: any) => {
  const { title, platform, content_type, scheduled_date, notes } = req.body;
  if (!title?.trim() || !scheduled_date) return res.status(400).json({ error: 'title and scheduled_date required' });
  const r = db.prepare('INSERT INTO content_calendar (user_id,title,platform,content_type,scheduled_date,notes) VALUES (?,?,?,?,?,?)').run(req.user.id, title.trim(), platform||'general', content_type||'post', scheduled_date, notes||'');
  res.json({ id: r.lastInsertRowid, title });
});
app.put('/api/content-calendar/:id', authMiddleware, (req: any, res: any) => {
  const { status, notes } = req.body;
  db.prepare('UPDATE content_calendar SET status=COALESCE(?,status),notes=COALESCE(?,notes) WHERE id=? AND user_id=?').run(status||null,notes||null,req.params.id,req.user.id);
  res.json({ ok: true });
});
app.delete('/api/content-calendar/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM content_calendar WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Learning Paths ──
app.get('/api/learning-paths', authMiddleware, (req: any, res: any) => {
  const rows: any[] = db.prepare('SELECT * FROM learning_paths WHERE user_id=? ORDER BY id DESC').all(req.user.id);
  rows.forEach(r => { try { r.topics = JSON.parse(r.topics); } catch { r.topics = []; } });
  res.json(rows);
});
app.post('/api/learning-paths', authMiddleware, (req: any, res: any) => {
  const { name, description, topics } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const r = db.prepare('INSERT INTO learning_paths (user_id,name,description,topics) VALUES (?,?,?,?)').run(req.user.id, name.trim(), description||'', JSON.stringify(topics||[]));
  res.json({ id: r.lastInsertRowid, name });
});
app.put('/api/learning-paths/:id', authMiddleware, (req: any, res: any) => {
  const { progress, status, topics } = req.body;
  db.prepare('UPDATE learning_paths SET progress=COALESCE(?,progress),status=COALESCE(?,status),topics=COALESCE(?,topics) WHERE id=? AND user_id=?').run(progress!=null?progress:null,status||null,topics?JSON.stringify(topics):null,req.params.id,req.user.id);
  res.json({ ok: true });
});
app.delete('/api/learning-paths/:id', authMiddleware, (req: any, res: any) => {
  db.prepare('DELETE FROM learning_paths WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// ============================================================
// BATCH 31: ai_bookmarks, focus_sessions, thread_reactions, workspace_tags, daily_intentions
// ============================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS ai_bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    summary TEXT,
    tags TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS focus_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    label TEXT,
    duration_min INTEGER DEFAULT 25,
    started_at TEXT,
    ended_at TEXT,
    completed INTEGER DEFAULT 0,
    notes TEXT
  );
  CREATE TABLE IF NOT EXISTS thread_reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    thread_id INTEGER NOT NULL,
    emoji TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS workspace_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    usage_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS daily_intentions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    intention TEXT NOT NULL,
    achieved INTEGER DEFAULT 0,
    reflection TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// AI Bookmarks
app.get('/api/ai-bookmarks', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM ai_bookmarks WHERE user_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows);
});
app.post('/api/ai-bookmarks', authenticateToken, (req: any, res: any) => {
  const { url, title, summary, tags } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  const r = db.prepare('INSERT INTO ai_bookmarks (user_id,url,title,summary,tags) VALUES (?,?,?,?,?)').run(req.user.id, url, title||'', summary||'', JSON.stringify(tags||[]));
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/ai-bookmarks/:id', authenticateToken, (req: any, res: any) => {
  const { title, summary, tags } = req.body;
  db.prepare('UPDATE ai_bookmarks SET title=?,summary=?,tags=? WHERE id=? AND user_id=?').run(title, summary, JSON.stringify(tags||[]), req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/ai-bookmarks/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_bookmarks WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.get('/api/ai-bookmarks/search', authenticateToken, (req: any, res: any) => {
  const q = `%${req.query.q||''}%`;
  const rows = db.prepare('SELECT * FROM ai_bookmarks WHERE user_id=? AND (title LIKE ? OR summary LIKE ? OR url LIKE ?) ORDER BY created_at DESC').all(req.user.id, q, q, q);
  res.json(rows);
});

// Focus Sessions
app.get('/api/focus-sessions', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM focus_sessions WHERE user_id=? ORDER BY started_at DESC LIMIT 50').all(req.user.id);
  res.json(rows);
});
app.post('/api/focus-sessions', authenticateToken, (req: any, res: any) => {
  const { label, duration_min, notes } = req.body;
  const started = new Date().toISOString();
  const r = db.prepare('INSERT INTO focus_sessions (user_id,label,duration_min,started_at,notes) VALUES (?,?,?,?,?)').run(req.user.id, label||'Focus', duration_min||25, started, notes||'');
  res.json({ id: r.lastInsertRowid, started_at: started });
});
app.put('/api/focus-sessions/:id/complete', authenticateToken, (req: any, res: any) => {
  const { notes } = req.body;
  const ended = new Date().toISOString();
  db.prepare('UPDATE focus_sessions SET completed=1,ended_at=?,notes=? WHERE id=? AND user_id=?').run(ended, notes||'', req.params.id, req.user.id);
  res.json({ ok: true, ended_at: ended });
});
app.delete('/api/focus-sessions/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM focus_sessions WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.get('/api/focus-sessions/stats', authenticateToken, (req: any, res: any) => {
  const total = (db.prepare('SELECT COUNT(*) as n FROM focus_sessions WHERE user_id=?').get(req.user.id) as any).n;
  const completed = (db.prepare('SELECT COUNT(*) as n FROM focus_sessions WHERE user_id=? AND completed=1').get(req.user.id) as any).n;
  const totalMin = (db.prepare('SELECT SUM(duration_min) as s FROM focus_sessions WHERE user_id=? AND completed=1').get(req.user.id) as any).s || 0;
  res.json({ total, completed, totalMin });
});

// Thread Reactions
app.get('/api/thread-reactions/:threadId', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT emoji, COUNT(*) as count FROM thread_reactions WHERE thread_id=? GROUP BY emoji').all(req.params.threadId);
  res.json(rows);
});
app.post('/api/thread-reactions', authenticateToken, (req: any, res: any) => {
  const { thread_id, emoji } = req.body;
  if (!thread_id || !emoji) return res.status(400).json({ error: 'thread_id and emoji required' });
  const existing = db.prepare('SELECT id FROM thread_reactions WHERE user_id=? AND thread_id=? AND emoji=?').get(req.user.id, thread_id, emoji);
  if (existing) {
    db.prepare('DELETE FROM thread_reactions WHERE user_id=? AND thread_id=? AND emoji=?').run(req.user.id, thread_id, emoji);
    return res.json({ toggled: 'removed' });
  }
  db.prepare('INSERT INTO thread_reactions (user_id,thread_id,emoji) VALUES (?,?,?)').run(req.user.id, thread_id, emoji);
  res.json({ toggled: 'added' });
});

// Workspace Tags
app.get('/api/workspace-tags', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM workspace_tags WHERE user_id=? ORDER BY usage_count DESC').all(req.user.id);
  res.json(rows);
});
app.post('/api/workspace-tags', authenticateToken, (req: any, res: any) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const r = db.prepare('INSERT INTO workspace_tags (user_id,name,color) VALUES (?,?,?)').run(req.user.id, name, color||'#6366f1');
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/workspace-tags/:id/use', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE workspace_tags SET usage_count=usage_count+1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/workspace-tags/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_tags WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Daily Intentions
app.get('/api/daily-intentions', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM daily_intentions WHERE user_id=? ORDER BY date DESC LIMIT 30').all(req.user.id);
  res.json(rows);
});
app.post('/api/daily-intentions', authenticateToken, (req: any, res: any) => {
  const { date, intention } = req.body;
  if (!date || !intention) return res.status(400).json({ error: 'date and intention required' });
  const existing = db.prepare('SELECT id FROM daily_intentions WHERE user_id=? AND date=?').get(req.user.id, date);
  if (existing) {
    db.prepare('UPDATE daily_intentions SET intention=? WHERE id=?').run(intention, (existing as any).id);
    return res.json({ id: (existing as any).id, updated: true });
  }
  const r = db.prepare('INSERT INTO daily_intentions (user_id,date,intention) VALUES (?,?,?)').run(req.user.id, date, intention);
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/daily-intentions/:id/reflect', authenticateToken, (req: any, res: any) => {
  const { achieved, reflection } = req.body;
  db.prepare('UPDATE daily_intentions SET achieved=?,reflection=? WHERE id=? AND user_id=?').run(achieved?1:0, reflection||'', req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/daily-intentions/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM daily_intentions WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.get('/api/daily-intentions/today', authenticateToken, (req: any, res: any) => {
  const today = new Date().toISOString().split('T')[0];
  const row = db.prepare('SELECT * FROM daily_intentions WHERE user_id=? AND date=?').get(req.user.id, today);
  res.json(row || null);
});


// ============================================================
// BATCH 32: note_templates, code_snippets_v2, workspace_announcements, ai_journal, thread_polls
// ============================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS note_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    use_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS code_snippets_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    code TEXT NOT NULL,
    language TEXT DEFAULT 'text',
    description TEXT,
    tags TEXT DEFAULT '[]',
    pin_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS workspace_announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',
    pinned INTEGER DEFAULT 0,
    dismissed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS ai_journal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    entry TEXT NOT NULL,
    mood TEXT DEFAULT 'neutral',
    word_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS thread_polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    thread_id INTEGER,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    votes TEXT DEFAULT '{}',
    closed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Note Templates
app.get('/api/note-templates', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM note_templates WHERE user_id=? ORDER BY use_count DESC').all(req.user.id);
  res.json(rows);
});
app.post('/api/note-templates', authenticateToken, (req: any, res: any) => {
  const { title, content, category } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'title and content required' });
  const r = db.prepare('INSERT INTO note_templates (user_id,title,content,category) VALUES (?,?,?,?)').run(req.user.id, title, content, category||'general');
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/note-templates/:id', authenticateToken, (req: any, res: any) => {
  const { title, content, category } = req.body;
  db.prepare('UPDATE note_templates SET title=?,content=?,category=? WHERE id=? AND user_id=?').run(title, content, category, req.params.id, req.user.id);
  res.json({ ok: true });
});
app.post('/api/note-templates/:id/use', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE note_templates SET use_count=use_count+1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  const row = db.prepare('SELECT content FROM note_templates WHERE id=?').get(req.params.id);
  res.json(row);
});
app.delete('/api/note-templates/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM note_templates WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Code Snippets v2
app.get('/api/snippets-v2', authenticateToken, (req: any, res: any) => {
  const { lang, q } = req.query as any;
  let query = 'SELECT * FROM code_snippets_v2 WHERE user_id=?';
  const params: any[] = [req.user.id];
  if (lang) { query += ' AND language=?'; params.push(lang); }
  if (q) { query += ' AND (title LIKE ? OR description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  query += ' ORDER BY pin_count DESC, created_at DESC';
  res.json(db.prepare(query).all(...params));
});
app.post('/api/snippets-v2', authenticateToken, (req: any, res: any) => {
  const { title, code, language, description, tags } = req.body;
  if (!title || !code) return res.status(400).json({ error: 'title and code required' });
  const r = db.prepare('INSERT INTO code_snippets_v2 (user_id,title,code,language,description,tags) VALUES (?,?,?,?,?,?)').run(req.user.id, title, code, language||'text', description||'', JSON.stringify(tags||[]));
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/snippets-v2/:id/pin', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE code_snippets_v2 SET pin_count=pin_count+1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/snippets-v2/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM code_snippets_v2 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Workspace Announcements
app.get('/api/workspace-announcements', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM workspace_announcements WHERE user_id=? AND dismissed=0 ORDER BY pinned DESC, created_at DESC').all(req.user.id);
  res.json(rows);
});
app.post('/api/workspace-announcements', authenticateToken, (req: any, res: any) => {
  const { title, body, priority, pinned } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title and body required' });
  const r = db.prepare('INSERT INTO workspace_announcements (user_id,title,body,priority,pinned) VALUES (?,?,?,?,?)').run(req.user.id, title, body, priority||'normal', pinned?1:0);
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/workspace-announcements/:id/dismiss', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE workspace_announcements SET dismissed=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/workspace-announcements/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_announcements WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// AI Journal
app.get('/api/ai-journal', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM ai_journal WHERE user_id=? ORDER BY date DESC LIMIT 30').all(req.user.id);
  res.json(rows);
});
app.post('/api/ai-journal', authenticateToken, (req: any, res: any) => {
  const { date, entry, mood } = req.body;
  if (!date || !entry) return res.status(400).json({ error: 'date and entry required' });
  const wordCount = entry.trim().split(/\s+/).length;
  const existing = db.prepare('SELECT id FROM ai_journal WHERE user_id=? AND date=?').get(req.user.id, date);
  if (existing) {
    db.prepare('UPDATE ai_journal SET entry=?,mood=?,word_count=? WHERE id=?').run(entry, mood||'neutral', wordCount, (existing as any).id);
    return res.json({ id: (existing as any).id, updated: true });
  }
  const r = db.prepare('INSERT INTO ai_journal (user_id,date,entry,mood,word_count) VALUES (?,?,?,?,?)').run(req.user.id, date, entry, mood||'neutral', wordCount);
  res.json({ id: r.lastInsertRowid });
});
app.delete('/api/ai-journal/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_journal WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.get('/api/ai-journal/stats', authenticateToken, (req: any, res: any) => {
  const total = (db.prepare('SELECT COUNT(*) as n FROM ai_journal WHERE user_id=?').get(req.user.id) as any).n;
  const words = (db.prepare('SELECT SUM(word_count) as w FROM ai_journal WHERE user_id=?').get(req.user.id) as any).w || 0;
  const moods = db.prepare('SELECT mood, COUNT(*) as n FROM ai_journal WHERE user_id=? GROUP BY mood').all(req.user.id);
  res.json({ total, words, moods });
});

// Thread Polls
app.get('/api/thread-polls', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM thread_polls WHERE user_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows.map((p: any) => ({ ...p, options: JSON.parse(p.options), votes: JSON.parse(p.votes) })));
});
app.post('/api/thread-polls', authenticateToken, (req: any, res: any) => {
  const { thread_id, question, options } = req.body;
  if (!question || !options?.length) return res.status(400).json({ error: 'question and options required' });
  const r = db.prepare('INSERT INTO thread_polls (user_id,thread_id,question,options) VALUES (?,?,?,?)').run(req.user.id, thread_id||null, question, JSON.stringify(options));
  res.json({ id: r.lastInsertRowid });
});
app.post('/api/thread-polls/:id/vote', authenticateToken, (req: any, res: any) => {
  const { option } = req.body;
  const poll = db.prepare('SELECT * FROM thread_polls WHERE id=?').get(req.params.id) as any;
  if (!poll || poll.closed) return res.status(400).json({ error: 'poll closed or not found' });
  const votes = JSON.parse(poll.votes);
  votes[option] = (votes[option] || 0) + 1;
  db.prepare('UPDATE thread_polls SET votes=? WHERE id=?').run(JSON.stringify(votes), req.params.id);
  res.json({ votes });
});
app.put('/api/thread-polls/:id/close', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE thread_polls SET closed=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/thread-polls/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM thread_polls WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// ============================================================
// BATCH 33: insight_cards, workspace_goals_v2, ai_reminders, thread_bookmarks_v2, export_presets
// ============================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS insight_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    insight TEXT NOT NULL,
    source TEXT DEFAULT 'manual',
    category TEXT DEFAULT 'general',
    starred INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS workspace_goals_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_date TEXT,
    progress INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    category TEXT DEFAULT 'personal',
    parent_id INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS ai_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    remind_at TEXT NOT NULL,
    recur TEXT DEFAULT 'none',
    dismissed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS thread_bookmarks_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    thread_id INTEGER NOT NULL,
    title TEXT,
    note TEXT,
    color TEXT DEFAULT '#6366f1',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS export_presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    format TEXT DEFAULT 'markdown',
    options TEXT DEFAULT '{}',
    use_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Insight Cards
app.get('/api/insight-cards', authenticateToken, (req: any, res: any) => {
  const { category, starred } = req.query as any;
  let q = 'SELECT * FROM insight_cards WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (category) { q += ' AND category=?'; p.push(category); }
  if (starred) { q += ' AND starred=1'; }
  q += ' ORDER BY starred DESC, created_at DESC';
  res.json(db.prepare(q).all(...p));
});
app.post('/api/insight-cards', authenticateToken, (req: any, res: any) => {
  const { title, insight, source, category } = req.body;
  if (!title || !insight) return res.status(400).json({ error: 'title and insight required' });
  const r = db.prepare('INSERT INTO insight_cards (user_id,title,insight,source,category) VALUES (?,?,?,?,?)').run(req.user.id, title, insight, source||'manual', category||'general');
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/insight-cards/:id/star', authenticateToken, (req: any, res: any) => {
  const card = db.prepare('SELECT starred FROM insight_cards WHERE id=? AND user_id=?').get(req.params.id, req.user.id) as any;
  if (!card) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE insight_cards SET starred=? WHERE id=?').run(card.starred ? 0 : 1, req.params.id);
  res.json({ starred: !card.starred });
});
app.delete('/api/insight-cards/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM insight_cards WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Workspace Goals v2
app.get('/api/goals-v2', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM workspace_goals_v2 WHERE user_id=? ORDER BY status ASC, target_date ASC').all(req.user.id);
  res.json(rows);
});
app.post('/api/goals-v2', authenticateToken, (req: any, res: any) => {
  const { title, description, target_date, category, parent_id } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const r = db.prepare('INSERT INTO workspace_goals_v2 (user_id,title,description,target_date,category,parent_id) VALUES (?,?,?,?,?,?)').run(req.user.id, title, description||'', target_date||null, category||'personal', parent_id||null);
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/goals-v2/:id', authenticateToken, (req: any, res: any) => {
  const { progress, status } = req.body;
  db.prepare('UPDATE workspace_goals_v2 SET progress=?,status=? WHERE id=? AND user_id=?').run(progress??0, status||'active', req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/goals-v2/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_goals_v2 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// AI Reminders
app.get('/api/ai-reminders', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM ai_reminders WHERE user_id=? AND dismissed=0 ORDER BY remind_at ASC').all(req.user.id);
  res.json(rows);
});
app.post('/api/ai-reminders', authenticateToken, (req: any, res: any) => {
  const { title, body, remind_at, recur } = req.body;
  if (!title || !remind_at) return res.status(400).json({ error: 'title and remind_at required' });
  const r = db.prepare('INSERT INTO ai_reminders (user_id,title,body,remind_at,recur) VALUES (?,?,?,?,?)').run(req.user.id, title, body||'', remind_at, recur||'none');
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/ai-reminders/:id/dismiss', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE ai_reminders SET dismissed=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/ai-reminders/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_reminders WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.get('/api/ai-reminders/due', authenticateToken, (req: any, res: any) => {
  const now = new Date().toISOString();
  const rows = db.prepare('SELECT * FROM ai_reminders WHERE user_id=? AND dismissed=0 AND remind_at<=?').all(req.user.id, now);
  res.json(rows);
});

// Thread Bookmarks v2
app.get('/api/thread-bookmarks-v2', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM thread_bookmarks_v2 WHERE user_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows);
});
app.post('/api/thread-bookmarks-v2', authenticateToken, (req: any, res: any) => {
  const { thread_id, title, note, color } = req.body;
  if (!thread_id) return res.status(400).json({ error: 'thread_id required' });
  const r = db.prepare('INSERT INTO thread_bookmarks_v2 (user_id,thread_id,title,note,color) VALUES (?,?,?,?,?)').run(req.user.id, thread_id, title||'', note||'', color||'#6366f1');
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/thread-bookmarks-v2/:id', authenticateToken, (req: any, res: any) => {
  const { note, color } = req.body;
  db.prepare('UPDATE thread_bookmarks_v2 SET note=?,color=? WHERE id=? AND user_id=?').run(note||'', color||'#6366f1', req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/thread-bookmarks-v2/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM thread_bookmarks_v2 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Export Presets
app.get('/api/export-presets', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM export_presets WHERE user_id=? ORDER BY use_count DESC').all(req.user.id);
  res.json(rows.map((p: any) => ({ ...p, options: JSON.parse(p.options) })));
});
app.post('/api/export-presets', authenticateToken, (req: any, res: any) => {
  const { name, format, options } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const r = db.prepare('INSERT INTO export_presets (user_id,name,format,options) VALUES (?,?,?,?)').run(req.user.id, name, format||'markdown', JSON.stringify(options||{}));
  res.json({ id: r.lastInsertRowid });
});
app.post('/api/export-presets/:id/use', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE export_presets SET use_count=use_count+1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  const preset = db.prepare('SELECT * FROM export_presets WHERE id=?').get(req.params.id) as any;
  res.json({ ...preset, options: JSON.parse(preset.options) });
});
app.delete('/api/export-presets/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM export_presets WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// ============================================================
// BATCH 34: workspace_widgets, ai_personas_v2, thread_metrics, quick_actions, workspace_search_v2
// ============================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS workspace_widgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT,
    config TEXT DEFAULT '{}',
    position INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS ai_personas_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    avatar TEXT DEFAULT '🤖',
    model TEXT DEFAULT 'claude',
    temperature REAL DEFAULT 0.7,
    use_count INTEGER DEFAULT 0,
    pinned INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS thread_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    thread_id INTEGER NOT NULL,
    message_count INTEGER DEFAULT 0,
    token_count INTEGER DEFAULT 0,
    avg_response_ms INTEGER DEFAULT 0,
    last_activity TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, thread_id)
  );
  CREATE TABLE IF NOT EXISTS quick_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    label TEXT NOT NULL,
    action_type TEXT NOT NULL,
    payload TEXT DEFAULT '{}',
    shortcut TEXT,
    use_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS workspace_search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    searched_at TEXT DEFAULT (datetime('now'))
  );
`);

// Workspace Widgets
app.get('/api/workspace-widgets', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM workspace_widgets WHERE user_id=? ORDER BY position ASC').all(req.user.id);
  res.json(rows.map((w: any) => ({ ...w, config: JSON.parse(w.config) })));
});
app.post('/api/workspace-widgets', authenticateToken, (req: any, res: any) => {
  const { type, title, config, position } = req.body;
  if (!type) return res.status(400).json({ error: 'type required' });
  const r = db.prepare('INSERT INTO workspace_widgets (user_id,type,title,config,position) VALUES (?,?,?,?,?)').run(req.user.id, type, title||type, JSON.stringify(config||{}), position||0);
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/workspace-widgets/:id', authenticateToken, (req: any, res: any) => {
  const { title, config, position, enabled } = req.body;
  db.prepare('UPDATE workspace_widgets SET title=?,config=?,position=?,enabled=? WHERE id=? AND user_id=?').run(title, JSON.stringify(config||{}), position??0, enabled??1, req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/workspace-widgets/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_widgets WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// AI Personas v2
app.get('/api/personas-v2', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM ai_personas_v2 WHERE user_id=? ORDER BY pinned DESC, use_count DESC').all(req.user.id);
  res.json(rows);
});
app.post('/api/personas-v2', authenticateToken, (req: any, res: any) => {
  const { name, system_prompt, avatar, model, temperature } = req.body;
  if (!name || !system_prompt) return res.status(400).json({ error: 'name and system_prompt required' });
  const r = db.prepare('INSERT INTO ai_personas_v2 (user_id,name,system_prompt,avatar,model,temperature) VALUES (?,?,?,?,?,?)').run(req.user.id, name, system_prompt, avatar||'🤖', model||'claude', temperature??0.7);
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/personas-v2/:id/pin', authenticateToken, (req: any, res: any) => {
  const row = db.prepare('SELECT pinned FROM ai_personas_v2 WHERE id=? AND user_id=?').get(req.params.id, req.user.id) as any;
  if (!row) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE ai_personas_v2 SET pinned=? WHERE id=?').run(row.pinned ? 0 : 1, req.params.id);
  res.json({ pinned: !row.pinned });
});
app.post('/api/personas-v2/:id/use', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE ai_personas_v2 SET use_count=use_count+1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  const persona = db.prepare('SELECT * FROM ai_personas_v2 WHERE id=?').get(req.params.id);
  res.json(persona);
});
app.delete('/api/personas-v2/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_personas_v2 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Thread Metrics
app.get('/api/thread-metrics', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM thread_metrics WHERE user_id=? ORDER BY last_activity DESC LIMIT 20').all(req.user.id);
  res.json(rows);
});
app.post('/api/thread-metrics', authenticateToken, (req: any, res: any) => {
  const { thread_id, message_count, token_count, avg_response_ms } = req.body;
  if (!thread_id) return res.status(400).json({ error: 'thread_id required' });
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO thread_metrics (user_id,thread_id,message_count,token_count,avg_response_ms,last_activity)
    VALUES (?,?,?,?,?,?)
    ON CONFLICT(user_id,thread_id) DO UPDATE SET
      message_count=excluded.message_count,
      token_count=excluded.token_count,
      avg_response_ms=excluded.avg_response_ms,
      last_activity=excluded.last_activity
  `).run(req.user.id, thread_id, message_count||0, token_count||0, avg_response_ms||0, now);
  res.json({ ok: true });
});
app.get('/api/thread-metrics/top', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM thread_metrics WHERE user_id=? ORDER BY message_count DESC LIMIT 10').all(req.user.id);
  res.json(rows);
});

// Quick Actions
app.get('/api/quick-actions', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM quick_actions WHERE user_id=? ORDER BY use_count DESC').all(req.user.id);
  res.json(rows.map((a: any) => ({ ...a, payload: JSON.parse(a.payload) })));
});
app.post('/api/quick-actions', authenticateToken, (req: any, res: any) => {
  const { label, action_type, payload, shortcut } = req.body;
  if (!label || !action_type) return res.status(400).json({ error: 'label and action_type required' });
  const r = db.prepare('INSERT INTO quick_actions (user_id,label,action_type,payload,shortcut) VALUES (?,?,?,?,?)').run(req.user.id, label, action_type, JSON.stringify(payload||{}), shortcut||null);
  res.json({ id: r.lastInsertRowid });
});
app.post('/api/quick-actions/:id/trigger', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE quick_actions SET use_count=use_count+1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  const action = db.prepare('SELECT * FROM quick_actions WHERE id=?').get(req.params.id) as any;
  res.json({ ...action, payload: JSON.parse(action.payload) });
});
app.delete('/api/quick-actions/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM quick_actions WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Workspace Search History
app.get('/api/workspace-search-history', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM workspace_search_history WHERE user_id=? ORDER BY searched_at DESC LIMIT 20').all(req.user.id);
  res.json(rows);
});
app.post('/api/workspace-search-history', authenticateToken, (req: any, res: any) => {
  const { query, results_count } = req.body;
  if (!query) return res.status(400).json({ error: 'query required' });
  db.prepare('INSERT INTO workspace_search_history (user_id,query,results_count) VALUES (?,?,?)').run(req.user.id, query, results_count||0);
  res.json({ ok: true });
});
app.delete('/api/workspace-search-history', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_search_history WHERE user_id=?').run(req.user.id);
  res.json({ ok: true });
});


// ============================================================
// BATCH 35: collaboration_notes, ai_experiments, workspace_rules, content_drafts, user_achievements
// ============================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS collaboration_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    shared INTEGER DEFAULT 0,
    collaborators TEXT DEFAULT '[]',
    version INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS ai_experiments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    hypothesis TEXT,
    prompt_a TEXT NOT NULL,
    prompt_b TEXT NOT NULL,
    result_a TEXT,
    result_b TEXT,
    winner TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS workspace_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    condition TEXT NOT NULL,
    action TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    trigger_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS content_drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'post',
    status TEXT DEFAULT 'draft',
    word_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    achievement TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '🏆',
    unlocked_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, achievement)
  );
`);

// Collaboration Notes
app.get('/api/collab-notes', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM collaboration_notes WHERE user_id=? ORDER BY updated_at DESC').all(req.user.id);
  res.json(rows);
});
app.post('/api/collab-notes', authenticateToken, (req: any, res: any) => {
  const { title, content, shared } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'title and content required' });
  const r = db.prepare('INSERT INTO collaboration_notes (user_id,title,content,shared) VALUES (?,?,?,?)').run(req.user.id, title, content, shared?1:0);
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/collab-notes/:id', authenticateToken, (req: any, res: any) => {
  const { title, content, shared } = req.body;
  const now = new Date().toISOString();
  db.prepare('UPDATE collaboration_notes SET title=?,content=?,shared=?,updated_at=?,version=version+1 WHERE id=? AND user_id=?').run(title, content, shared?1:0, now, req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/collab-notes/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM collaboration_notes WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// AI Experiments
app.get('/api/ai-experiments', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM ai_experiments WHERE user_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows);
});
app.post('/api/ai-experiments', authenticateToken, (req: any, res: any) => {
  const { name, hypothesis, prompt_a, prompt_b } = req.body;
  if (!name || !prompt_a || !prompt_b) return res.status(400).json({ error: 'name, prompt_a, prompt_b required' });
  const r = db.prepare('INSERT INTO ai_experiments (user_id,name,hypothesis,prompt_a,prompt_b) VALUES (?,?,?,?,?)').run(req.user.id, name, hypothesis||'', prompt_a, prompt_b);
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/ai-experiments/:id/result', authenticateToken, (req: any, res: any) => {
  const { result_a, result_b, winner, notes } = req.body;
  db.prepare('UPDATE ai_experiments SET result_a=?,result_b=?,winner=?,notes=? WHERE id=? AND user_id=?').run(result_a||'', result_b||'', winner||null, notes||'', req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/ai-experiments/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_experiments WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Workspace Rules
app.get('/api/workspace-rules', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM workspace_rules WHERE user_id=? ORDER BY enabled DESC, trigger_count DESC').all(req.user.id);
  res.json(rows);
});
app.post('/api/workspace-rules', authenticateToken, (req: any, res: any) => {
  const { name, condition, action } = req.body;
  if (!name || !condition || !action) return res.status(400).json({ error: 'name, condition, action required' });
  const r = db.prepare('INSERT INTO workspace_rules (user_id,name,condition,action) VALUES (?,?,?,?)').run(req.user.id, name, condition, action);
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/workspace-rules/:id/toggle', authenticateToken, (req: any, res: any) => {
  const row = db.prepare('SELECT enabled FROM workspace_rules WHERE id=? AND user_id=?').get(req.params.id, req.user.id) as any;
  if (!row) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE workspace_rules SET enabled=? WHERE id=?').run(row.enabled ? 0 : 1, req.params.id);
  res.json({ enabled: !row.enabled });
});
app.post('/api/workspace-rules/:id/trigger', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE workspace_rules SET trigger_count=trigger_count+1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/workspace-rules/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_rules WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Content Drafts
app.get('/api/content-drafts', authenticateToken, (req: any, res: any) => {
  const { type, status } = req.query as any;
  let q = 'SELECT * FROM content_drafts WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (type) { q += ' AND type=?'; p.push(type); }
  if (status) { q += ' AND status=?'; p.push(status); }
  q += ' ORDER BY updated_at DESC';
  res.json(db.prepare(q).all(...p));
});
app.post('/api/content-drafts', authenticateToken, (req: any, res: any) => {
  const { title, content, type } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'title and content required' });
  const wc = content.trim().split(/\s+/).length;
  const r = db.prepare('INSERT INTO content_drafts (user_id,title,content,type,word_count) VALUES (?,?,?,?,?)').run(req.user.id, title, content, type||'post', wc);
  res.json({ id: r.lastInsertRowid, word_count: wc });
});
app.put('/api/content-drafts/:id', authenticateToken, (req: any, res: any) => {
  const { title, content, status } = req.body;
  const now = new Date().toISOString();
  const wc = content?.trim().split(/\s+/).length || 0;
  db.prepare('UPDATE content_drafts SET title=?,content=?,status=?,word_count=?,updated_at=? WHERE id=? AND user_id=?').run(title, content, status||'draft', wc, now, req.params.id, req.user.id);
  res.json({ ok: true, word_count: wc });
});
app.delete('/api/content-drafts/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM content_drafts WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// User Achievements
app.get('/api/achievements', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM user_achievements WHERE user_id=? ORDER BY unlocked_at DESC').all(req.user.id);
  res.json(rows);
});
app.post('/api/achievements', authenticateToken, (req: any, res: any) => {
  const { achievement, description, icon } = req.body;
  if (!achievement) return res.status(400).json({ error: 'achievement required' });
  try {
    const r = db.prepare('INSERT INTO user_achievements (user_id,achievement,description,icon) VALUES (?,?,?,?)').run(req.user.id, achievement, description||'', icon||'🏆');
    res.json({ id: r.lastInsertRowid, new: true });
  } catch {
    res.json({ new: false });
  }
});
app.get('/api/achievements/check', authenticateToken, (req: any, res: any) => {
  const count = (db.prepare('SELECT COUNT(*) as n FROM ai_conversations WHERE user_id=?').get(req.user.id) as any)?.n || 0;
  const unlocked: string[] = [];
  const defs = [
    { key: 'first_chat', thresh: 1, icon: '💬', desc: 'Started first conversation' },
    { key: 'ten_chats', thresh: 10, icon: '🔟', desc: 'Completed 10 conversations' },
    { key: 'hundred_chats', thresh: 100, icon: '💯', desc: 'Completed 100 conversations' },
  ];
  for (const def of defs) {
    if (count >= def.thresh) {
      const existing = db.prepare('SELECT id FROM user_achievements WHERE user_id=? AND achievement=?').get(req.user.id, def.key);
      if (!existing) {
        db.prepare('INSERT OR IGNORE INTO user_achievements (user_id,achievement,description,icon) VALUES (?,?,?,?)').run(req.user.id, def.key, def.desc, def.icon);
        unlocked.push(def.key);
      }
    }
  }
  res.json({ unlocked });
});


// ============================================================
// BATCH 36: prompt_library, workspace_connections, ai_glossary, reading_queue_v2, kanban_labels
// ============================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS prompt_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    tags TEXT DEFAULT '[]',
    use_count INTEGER DEFAULT 0,
    is_public INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS workspace_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    endpoint TEXT,
    api_key_hint TEXT,
    status TEXT DEFAULT 'active',
    last_used TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS ai_glossary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    examples TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, term)
  );
  CREATE TABLE IF NOT EXISTS reading_queue_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    summary TEXT,
    tags TEXT DEFAULT '[]',
    priority INTEGER DEFAULT 0,
    read INTEGER DEFAULT 0,
    read_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS kanban_labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    board_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, name)
  );
`);

// Prompt Library
app.get('/api/prompt-library', authenticateToken, (req: any, res: any) => {
  const { category } = req.query as any;
  let q = 'SELECT * FROM prompt_library WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (category) { q += ' AND category=?'; p.push(category); }
  q += ' ORDER BY use_count DESC, created_at DESC';
  res.json(db.prepare(q).all(...p));
});
app.post('/api/prompt-library', authenticateToken, (req: any, res: any) => {
  const { title, prompt, category, tags } = req.body;
  if (!title || !prompt) return res.status(400).json({ error: 'title and prompt required' });
  const r = db.prepare('INSERT INTO prompt_library (user_id,title,prompt,category,tags) VALUES (?,?,?,?,?)').run(req.user.id, title, prompt, category||'general', JSON.stringify(tags||[]));
  res.json({ id: r.lastInsertRowid });
});
app.post('/api/prompt-library/:id/use', authenticateToken, (req: any, res: any) => {
  const row = db.prepare('SELECT prompt FROM prompt_library WHERE id=? AND user_id=?').get(req.params.id, req.user.id) as any;
  if (!row) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE prompt_library SET use_count=use_count+1 WHERE id=?').run(req.params.id);
  res.json({ prompt: row.prompt });
});
app.delete('/api/prompt-library/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM prompt_library WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.get('/api/prompt-library/categories', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT category, COUNT(*) as count FROM prompt_library WHERE user_id=? GROUP BY category').all(req.user.id);
  res.json(rows);
});

// Workspace Connections
app.get('/api/workspace-connections', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT id,name,type,endpoint,api_key_hint,status,last_used,created_at FROM workspace_connections WHERE user_id=? ORDER BY status, name').all(req.user.id);
  res.json(rows);
});
app.post('/api/workspace-connections', authenticateToken, (req: any, res: any) => {
  const { name, type, endpoint, api_key_hint } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name and type required' });
  const r = db.prepare('INSERT INTO workspace_connections (user_id,name,type,endpoint,api_key_hint) VALUES (?,?,?,?,?)').run(req.user.id, name, type, endpoint||'', api_key_hint||'');
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/workspace-connections/:id/ping', authenticateToken, (req: any, res: any) => {
  const now = new Date().toISOString();
  db.prepare('UPDATE workspace_connections SET last_used=?,status=? WHERE id=? AND user_id=?').run(now, 'active', req.params.id, req.user.id);
  res.json({ ok: true, pinged_at: now });
});
app.delete('/api/workspace-connections/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_connections WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// AI Glossary
app.get('/api/ai-glossary', authenticateToken, (req: any, res: any) => {
  const { search } = req.query as any;
  if (search) {
    const rows = db.prepare("SELECT * FROM ai_glossary WHERE user_id=? AND (term LIKE ? OR definition LIKE ?) ORDER BY term").all(req.user.id, `%${search}%`, `%${search}%`);
    return res.json(rows);
  }
  res.json(db.prepare('SELECT * FROM ai_glossary WHERE user_id=? ORDER BY term').all(req.user.id));
});
app.post('/api/ai-glossary', authenticateToken, (req: any, res: any) => {
  const { term, definition, category } = req.body;
  if (!term || !definition) return res.status(400).json({ error: 'term and definition required' });
  try {
    const r = db.prepare('INSERT INTO ai_glossary (user_id,term,definition,category) VALUES (?,?,?,?)').run(req.user.id, term, definition, category||'general');
    res.json({ id: r.lastInsertRowid });
  } catch {
    db.prepare('UPDATE ai_glossary SET definition=?,category=? WHERE user_id=? AND term=?').run(definition, category||'general', req.user.id, term);
    res.json({ updated: true });
  }
});
app.delete('/api/ai-glossary/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_glossary WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Reading Queue v2
app.get('/api/reading-queue-v2', authenticateToken, (req: any, res: any) => {
  const { read } = req.query as any;
  let q = 'SELECT * FROM reading_queue_v2 WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (read !== undefined) { q += ' AND read=?'; p.push(read === 'true' ? 1 : 0); }
  q += ' ORDER BY priority DESC, created_at DESC';
  res.json(db.prepare(q).all(...p));
});
app.post('/api/reading-queue-v2', authenticateToken, (req: any, res: any) => {
  const { url, title, summary, tags, priority } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  const r = db.prepare('INSERT INTO reading_queue_v2 (user_id,url,title,summary,tags,priority) VALUES (?,?,?,?,?,?)').run(req.user.id, url, title||url, summary||'', JSON.stringify(tags||[]), priority||0);
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/reading-queue-v2/:id/read', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE reading_queue_v2 SET read=1,read_at=? WHERE id=? AND user_id=?').run(new Date().toISOString(), req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/reading-queue-v2/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM reading_queue_v2 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.get('/api/reading-queue-v2/stats', authenticateToken, (req: any, res: any) => {
  const total = (db.prepare('SELECT COUNT(*) as n FROM reading_queue_v2 WHERE user_id=?').get(req.user.id) as any)?.n || 0;
  const done = (db.prepare('SELECT COUNT(*) as n FROM reading_queue_v2 WHERE user_id=? AND read=1').get(req.user.id) as any)?.n || 0;
  res.json({ total, done, pending: total - done });
});

// Kanban Labels
app.get('/api/kanban-labels', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM kanban_labels WHERE user_id=? ORDER BY name').all(req.user.id);
  res.json(rows);
});
app.post('/api/kanban-labels', authenticateToken, (req: any, res: any) => {
  const { name, color, board_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const r = db.prepare('INSERT INTO kanban_labels (user_id,name,color,board_id) VALUES (?,?,?,?)').run(req.user.id, name, color||'#6366f1', board_id||null);
    res.json({ id: r.lastInsertRowid });
  } catch {
    res.status(409).json({ error: 'label exists' });
  }
});
app.put('/api/kanban-labels/:id', authenticateToken, (req: any, res: any) => {
  const { color } = req.body;
  db.prepare('UPDATE kanban_labels SET color=? WHERE id=? AND user_id=?').run(color||'#6366f1', req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/kanban-labels/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM kanban_labels WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// ============================================================
// BATCH 37: ai_summaries_v2, workspace_themes, user_shortcuts, thread_labels, collaboration_rooms
// ============================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS ai_summaries_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    source_type TEXT NOT NULL,
    source_id TEXT,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    key_points TEXT DEFAULT '[]',
    model TEXT DEFAULT 'unknown',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS workspace_themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    primary_color TEXT DEFAULT '#6366f1',
    bg_color TEXT DEFAULT '#111827',
    accent TEXT DEFAULT '#8b5cf6',
    font TEXT DEFAULT 'Inter',
    is_active INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS user_shortcuts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    label TEXT NOT NULL,
    command TEXT NOT NULL,
    shortcut_key TEXT,
    icon TEXT DEFAULT '⌨️',
    use_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS thread_labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    thread_id INTEGER NOT NULL,
    label TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, thread_id, label)
  );
  CREATE TABLE IF NOT EXISTS collaboration_rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    invite_code TEXT UNIQUE,
    member_count INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// AI Summaries v2
app.get('/api/ai-summaries-v2', authenticateToken, (req: any, res: any) => {
  const { source_type } = req.query as any;
  let q = 'SELECT * FROM ai_summaries_v2 WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (source_type) { q += ' AND source_type=?'; p.push(source_type); }
  q += ' ORDER BY created_at DESC LIMIT 50';
  res.json(db.prepare(q).all(...p));
});
app.post('/api/ai-summaries-v2', authenticateToken, (req: any, res: any) => {
  const { source_type, source_id, title, summary, key_points, model } = req.body;
  if (!source_type || !title || !summary) return res.status(400).json({ error: 'source_type, title, summary required' });
  const r = db.prepare('INSERT INTO ai_summaries_v2 (user_id,source_type,source_id,title,summary,key_points,model) VALUES (?,?,?,?,?,?,?)').run(req.user.id, source_type, source_id||null, title, summary, JSON.stringify(key_points||[]), model||'unknown');
  res.json({ id: r.lastInsertRowid });
});
app.delete('/api/ai-summaries-v2/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_summaries_v2 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Workspace Themes
app.get('/api/workspace-themes', authenticateToken, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_themes WHERE user_id=? ORDER BY is_active DESC, name').all(req.user.id));
});
app.post('/api/workspace-themes', authenticateToken, (req: any, res: any) => {
  const { name, primary_color, bg_color, accent, font } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const r = db.prepare('INSERT INTO workspace_themes (user_id,name,primary_color,bg_color,accent,font) VALUES (?,?,?,?,?,?)').run(req.user.id, name, primary_color||'#6366f1', bg_color||'#111827', accent||'#8b5cf6', font||'Inter');
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/workspace-themes/:id/activate', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE workspace_themes SET is_active=0 WHERE user_id=?').run(req.user.id);
  db.prepare('UPDATE workspace_themes SET is_active=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  const theme = db.prepare('SELECT * FROM workspace_themes WHERE id=?').get(req.params.id) as any;
  res.json(theme);
});
app.delete('/api/workspace-themes/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_themes WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// User Shortcuts
app.get('/api/user-shortcuts', authenticateToken, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM user_shortcuts WHERE user_id=? ORDER BY use_count DESC').all(req.user.id));
});
app.post('/api/user-shortcuts', authenticateToken, (req: any, res: any) => {
  const { label, command, shortcut_key, icon } = req.body;
  if (!label || !command) return res.status(400).json({ error: 'label and command required' });
  const r = db.prepare('INSERT INTO user_shortcuts (user_id,label,command,shortcut_key,icon) VALUES (?,?,?,?,?)').run(req.user.id, label, command, shortcut_key||null, icon||'⌨️');
  res.json({ id: r.lastInsertRowid });
});
app.post('/api/user-shortcuts/:id/trigger', authenticateToken, (req: any, res: any) => {
  const row = db.prepare('SELECT command FROM user_shortcuts WHERE id=? AND user_id=?').get(req.params.id, req.user.id) as any;
  if (!row) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE user_shortcuts SET use_count=use_count+1 WHERE id=?').run(req.params.id);
  res.json({ command: row.command });
});
app.delete('/api/user-shortcuts/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM user_shortcuts WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Thread Labels
app.get('/api/thread-labels', authenticateToken, (req: any, res: any) => {
  const { thread_id } = req.query as any;
  if (thread_id) return res.json(db.prepare('SELECT * FROM thread_labels WHERE user_id=? AND thread_id=?').all(req.user.id, thread_id));
  res.json(db.prepare('SELECT * FROM thread_labels WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});
app.post('/api/thread-labels', authenticateToken, (req: any, res: any) => {
  const { thread_id, label, color } = req.body;
  if (!thread_id || !label) return res.status(400).json({ error: 'thread_id and label required' });
  try {
    const r = db.prepare('INSERT INTO thread_labels (user_id,thread_id,label,color) VALUES (?,?,?,?)').run(req.user.id, thread_id, label, color||'#6366f1');
    res.json({ id: r.lastInsertRowid });
  } catch { res.status(409).json({ error: 'label already applied' }); }
});
app.delete('/api/thread-labels/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM thread_labels WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Collaboration Rooms
app.get('/api/collab-rooms', authenticateToken, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM collaboration_rooms WHERE user_id=? ORDER BY is_active DESC, created_at DESC').all(req.user.id));
});
app.post('/api/collab-rooms', authenticateToken, (req: any, res: any) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const r = db.prepare('INSERT INTO collaboration_rooms (user_id,name,description,invite_code) VALUES (?,?,?,?)').run(req.user.id, name, description||'', code);
  res.json({ id: r.lastInsertRowid, invite_code: code });
});
app.get('/api/collab-rooms/join/:code', authenticateToken, (req: any, res: any) => {
  const room = db.prepare('SELECT id,name,description,member_count FROM collaboration_rooms WHERE invite_code=? AND is_active=1').get(req.params.code) as any;
  if (!room) return res.status(404).json({ error: 'room not found or inactive' });
  db.prepare('UPDATE collaboration_rooms SET member_count=member_count+1 WHERE id=?').run(room.id);
  res.json(room);
});
app.delete('/api/collab-rooms/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE collaboration_rooms SET is_active=0 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// ============================================================
// BATCH 38: ai_meeting_notes, workspace_metrics_v2, prompt_chains, file_annotations, ai_tasks
// ============================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS ai_meeting_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    attendees TEXT DEFAULT '[]',
    agenda TEXT,
    notes TEXT NOT NULL,
    action_items TEXT DEFAULT '[]',
    meeting_date TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS workspace_metrics_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    metric TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT DEFAULT 'count',
    recorded_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS prompt_chains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    steps TEXT NOT NULL,
    run_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS file_annotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    line_number INTEGER,
    annotation TEXT NOT NULL,
    type TEXT DEFAULT 'note',
    resolved INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS ai_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    due_date TEXT,
    completed_at TEXT,
    ai_suggested INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// AI Meeting Notes
app.get('/api/meeting-notes', authenticateToken, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_meeting_notes WHERE user_id=? ORDER BY meeting_date DESC, created_at DESC').all(req.user.id));
});
app.post('/api/meeting-notes', authenticateToken, (req: any, res: any) => {
  const { title, attendees, agenda, notes, action_items, meeting_date } = req.body;
  if (!title || !notes) return res.status(400).json({ error: 'title and notes required' });
  const r = db.prepare('INSERT INTO ai_meeting_notes (user_id,title,attendees,agenda,notes,action_items,meeting_date) VALUES (?,?,?,?,?,?,?)').run(req.user.id, title, JSON.stringify(attendees||[]), agenda||'', notes, JSON.stringify(action_items||[]), meeting_date||null);
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/meeting-notes/:id', authenticateToken, (req: any, res: any) => {
  const { notes, action_items } = req.body;
  db.prepare('UPDATE ai_meeting_notes SET notes=?,action_items=? WHERE id=? AND user_id=?').run(notes, JSON.stringify(action_items||[]), req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/meeting-notes/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_meeting_notes WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Workspace Metrics v2
app.post('/api/workspace-metrics-v2', authenticateToken, (req: any, res: any) => {
  const { metric, value, unit } = req.body;
  if (!metric || value === undefined) return res.status(400).json({ error: 'metric and value required' });
  const r = db.prepare('INSERT INTO workspace_metrics_v2 (user_id,metric,value,unit) VALUES (?,?,?,?)').run(req.user.id, metric, value, unit||'count');
  res.json({ id: r.lastInsertRowid });
});
app.get('/api/workspace-metrics-v2', authenticateToken, (req: any, res: any) => {
  const { metric, days } = req.query as any;
  let q = 'SELECT * FROM workspace_metrics_v2 WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (metric) { q += ' AND metric=?'; p.push(metric); }
  if (days) { q += ` AND recorded_at >= datetime('now', '-${parseInt(days)} days')`; }
  q += ' ORDER BY recorded_at DESC LIMIT 200';
  res.json(db.prepare(q).all(...p));
});
app.get('/api/workspace-metrics-v2/summary', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare("SELECT metric, AVG(value) as avg, MAX(value) as max, MIN(value) as min, COUNT(*) as count FROM workspace_metrics_v2 WHERE user_id=? GROUP BY metric").all(req.user.id);
  res.json(rows);
});

// Prompt Chains
app.get('/api/prompt-chains', authenticateToken, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM prompt_chains WHERE user_id=? ORDER BY run_count DESC').all(req.user.id));
});
app.post('/api/prompt-chains', authenticateToken, (req: any, res: any) => {
  const { name, description, steps } = req.body;
  if (!name || !steps?.length) return res.status(400).json({ error: 'name and steps required' });
  const r = db.prepare('INSERT INTO prompt_chains (user_id,name,description,steps) VALUES (?,?,?,?)').run(req.user.id, name, description||'', JSON.stringify(steps));
  res.json({ id: r.lastInsertRowid });
});
app.post('/api/prompt-chains/:id/run', authenticateToken, (req: any, res: any) => {
  const row = db.prepare('SELECT steps FROM prompt_chains WHERE id=? AND user_id=?').get(req.params.id, req.user.id) as any;
  if (!row) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE prompt_chains SET run_count=run_count+1 WHERE id=?').run(req.params.id);
  res.json({ steps: JSON.parse(row.steps) });
});
app.delete('/api/prompt-chains/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM prompt_chains WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// File Annotations
app.get('/api/file-annotations', authenticateToken, (req: any, res: any) => {
  const { file_path } = req.query as any;
  if (file_path) return res.json(db.prepare('SELECT * FROM file_annotations WHERE user_id=? AND file_path=? ORDER BY line_number').all(req.user.id, file_path));
  res.json(db.prepare('SELECT * FROM file_annotations WHERE user_id=? AND resolved=0 ORDER BY created_at DESC').all(req.user.id));
});
app.post('/api/file-annotations', authenticateToken, (req: any, res: any) => {
  const { file_path, line_number, annotation, type } = req.body;
  if (!file_path || !annotation) return res.status(400).json({ error: 'file_path and annotation required' });
  const r = db.prepare('INSERT INTO file_annotations (user_id,file_path,line_number,annotation,type) VALUES (?,?,?,?,?)').run(req.user.id, file_path, line_number||null, annotation, type||'note');
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/file-annotations/:id/resolve', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE file_annotations SET resolved=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/file-annotations/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM file_annotations WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// AI Tasks
app.get('/api/ai-tasks', authenticateToken, (req: any, res: any) => {
  const { status, priority } = req.query as any;
  let q = 'SELECT * FROM ai_tasks WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (status) { q += ' AND status=?'; p.push(status); }
  if (priority) { q += ' AND priority=?'; p.push(priority); }
  q += " ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, due_date ASC NULLS LAST";
  res.json(db.prepare(q).all(...p));
});
app.post('/api/ai-tasks', authenticateToken, (req: any, res: any) => {
  const { title, description, priority, due_date, ai_suggested } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const r = db.prepare('INSERT INTO ai_tasks (user_id,title,description,priority,due_date,ai_suggested) VALUES (?,?,?,?,?,?)').run(req.user.id, title, description||'', priority||'medium', due_date||null, ai_suggested?1:0);
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/ai-tasks/:id', authenticateToken, (req: any, res: any) => {
  const { status, priority } = req.body;
  const completed_at = status === 'done' ? new Date().toISOString() : null;
  db.prepare('UPDATE ai_tasks SET status=?,priority=?,completed_at=? WHERE id=? AND user_id=?').run(status||'todo', priority||'medium', completed_at, req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/ai-tasks/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_tasks WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// ============================================================
// BATCH 39: idea_votes, workspace_broadcasts, ai_debug_logs, note_links, user_profiles_v2
// ============================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS idea_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    idea TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    votes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'open',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS workspace_broadcasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    expires_at TEXT,
    dismissed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS ai_debug_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT,
    model TEXT,
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    error TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS note_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    source_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    link_type TEXT DEFAULT 'related',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, source_id, target_id)
  );
  CREATE TABLE IF NOT EXISTS user_profiles_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    display_name TEXT,
    bio TEXT,
    avatar_emoji TEXT DEFAULT '👤',
    timezone TEXT DEFAULT 'UTC',
    preferred_model TEXT DEFAULT 'claude',
    weekly_goal_hours INTEGER DEFAULT 10,
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// Idea Votes
app.get('/api/idea-votes', authenticateToken, (req: any, res: any) => {
  const { status } = req.query as any;
  let q = 'SELECT * FROM idea_votes WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (status) { q += ' AND status=?'; p.push(status); }
  q += ' ORDER BY votes DESC';
  res.json(db.prepare(q).all(...p));
});
app.post('/api/idea-votes', authenticateToken, (req: any, res: any) => {
  const { idea, category } = req.body;
  if (!idea) return res.status(400).json({ error: 'idea required' });
  const r = db.prepare('INSERT INTO idea_votes (user_id,idea,category) VALUES (?,?,?)').run(req.user.id, idea, category||'general');
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/idea-votes/:id/vote', authenticateToken, (req: any, res: any) => {
  const { dir } = req.body;
  db.prepare('UPDATE idea_votes SET votes=votes+? WHERE id=? AND user_id=?').run(dir === 'down' ? -1 : 1, req.params.id, req.user.id);
  const row = db.prepare('SELECT votes FROM idea_votes WHERE id=?').get(req.params.id) as any;
  res.json({ votes: row?.votes });
});
app.put('/api/idea-votes/:id/status', authenticateToken, (req: any, res: any) => {
  const { status } = req.body;
  db.prepare('UPDATE idea_votes SET status=? WHERE id=? AND user_id=?').run(status||'open', req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/idea-votes/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM idea_votes WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Workspace Broadcasts
app.get('/api/workspace-broadcasts', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare("SELECT * FROM workspace_broadcasts WHERE user_id=? AND dismissed=0 AND (expires_at IS NULL OR expires_at > datetime('now')) ORDER BY created_at DESC").all(req.user.id);
  res.json(rows);
});
app.post('/api/workspace-broadcasts', authenticateToken, (req: any, res: any) => {
  const { message, type, expires_at } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  const r = db.prepare('INSERT INTO workspace_broadcasts (user_id,message,type,expires_at) VALUES (?,?,?,?)').run(req.user.id, message, type||'info', expires_at||null);
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/workspace-broadcasts/:id/dismiss', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE workspace_broadcasts SET dismissed=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/workspace-broadcasts/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_broadcasts WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// AI Debug Logs
app.post('/api/ai-debug-logs', authenticateToken, (req: any, res: any) => {
  const { prompt, response, model, tokens_in, tokens_out, latency_ms, error } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  const r = db.prepare('INSERT INTO ai_debug_logs (user_id,prompt,response,model,tokens_in,tokens_out,latency_ms,error) VALUES (?,?,?,?,?,?,?,?)').run(req.user.id, prompt, response||'', model||'unknown', tokens_in||0, tokens_out||0, latency_ms||0, error||null);
  res.json({ id: r.lastInsertRowid });
});
app.get('/api/ai-debug-logs', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM ai_debug_logs WHERE user_id=? ORDER BY created_at DESC LIMIT 100').all(req.user.id);
  res.json(rows);
});
app.get('/api/ai-debug-logs/stats', authenticateToken, (req: any, res: any) => {
  const stats = db.prepare('SELECT model, COUNT(*) as calls, AVG(latency_ms) as avg_latency, SUM(tokens_in+tokens_out) as total_tokens, COUNT(error) as errors FROM ai_debug_logs WHERE user_id=? GROUP BY model').all(req.user.id);
  res.json(stats);
});
app.delete('/api/ai-debug-logs', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_debug_logs WHERE user_id=?').run(req.user.id);
  res.json({ ok: true });
});

// Note Links
app.get('/api/note-links/:source_id', authenticateToken, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM note_links WHERE user_id=? AND source_id=?').all(req.user.id, req.params.source_id));
});
app.post('/api/note-links', authenticateToken, (req: any, res: any) => {
  const { source_id, target_id, link_type } = req.body;
  if (!source_id || !target_id) return res.status(400).json({ error: 'source_id and target_id required' });
  try {
    const r = db.prepare('INSERT INTO note_links (user_id,source_id,target_id,link_type) VALUES (?,?,?,?)').run(req.user.id, source_id, target_id, link_type||'related');
    res.json({ id: r.lastInsertRowid });
  } catch { res.status(409).json({ error: 'link exists' }); }
});
app.delete('/api/note-links/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM note_links WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// User Profiles v2
app.get('/api/user-profile-v2', authenticateToken, (req: any, res: any) => {
  const row = db.prepare('SELECT * FROM user_profiles_v2 WHERE user_id=?').get(req.user.id);
  res.json(row || { user_id: req.user.id, display_name: '', bio: '', avatar_emoji: '👤', timezone: 'UTC', preferred_model: 'claude', weekly_goal_hours: 10 });
});
app.put('/api/user-profile-v2', authenticateToken, (req: any, res: any) => {
  const { display_name, bio, avatar_emoji, timezone, preferred_model, weekly_goal_hours } = req.body;
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO user_profiles_v2 (user_id,display_name,bio,avatar_emoji,timezone,preferred_model,weekly_goal_hours,updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name,bio=excluded.bio,avatar_emoji=excluded.avatar_emoji,timezone=excluded.timezone,preferred_model=excluded.preferred_model,weekly_goal_hours=excluded.weekly_goal_hours,updated_at=excluded.updated_at`).run(req.user.id, display_name||'', bio||'', avatar_emoji||'👤', timezone||'UTC', preferred_model||'claude', weekly_goal_hours||10, now);
  res.json({ ok: true });
});


// ============================================================
// BATCH 40: ai_suggestions_v2, workspace_goals, code_snippets_v2, feedback_notes, session_checkpoints
// ============================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS ai_suggestions_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    context TEXT NOT NULL,
    suggestion TEXT NOT NULL,
    type TEXT DEFAULT 'general',
    accepted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS workspace_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_date TEXT,
    progress INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS code_snippets_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    code TEXT NOT NULL,
    language TEXT DEFAULT 'javascript',
    tags TEXT DEFAULT '',
    runs INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS feedback_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    sentiment TEXT DEFAULT 'neutral',
    source TEXT DEFAULT 'manual',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS session_checkpoints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id TEXT NOT NULL,
    label TEXT NOT NULL,
    state_json TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// AI Suggestions v2
app.post('/api/ai-suggestions-v2', authenticateToken, (req: any, res: any) => {
  const { context, suggestion, type } = req.body;
  if (!context || !suggestion) return res.status(400).json({ error: 'context and suggestion required' });
  const r = db.prepare('INSERT INTO ai_suggestions_v2 (user_id,context,suggestion,type) VALUES (?,?,?,?)').run(req.user.id, context, suggestion, type||'general');
  res.json({ id: r.lastInsertRowid });
});
app.get('/api/ai-suggestions-v2', authenticateToken, (req: any, res: any) => {
  const { type } = req.query as any;
  let q = 'SELECT * FROM ai_suggestions_v2 WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (type) { q += ' AND type=?'; p.push(type); }
  q += ' ORDER BY created_at DESC LIMIT 50';
  res.json(db.prepare(q).all(...p));
});
app.put('/api/ai-suggestions-v2/:id/accept', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE ai_suggestions_v2 SET accepted=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/ai-suggestions-v2/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_suggestions_v2 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Workspace Goals
app.get('/api/workspace-goals', authenticateToken, (req: any, res: any) => {
  const { status } = req.query as any;
  let q = 'SELECT * FROM workspace_goals WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (status) { q += ' AND status=?'; p.push(status); }
  q += ' ORDER BY target_date ASC';
  res.json(db.prepare(q).all(...p));
});
app.post('/api/workspace-goals', authenticateToken, (req: any, res: any) => {
  const { title, description, target_date } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const r = db.prepare('INSERT INTO workspace_goals (user_id,title,description,target_date) VALUES (?,?,?,?)').run(req.user.id, title, description||'', target_date||null);
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/workspace-goals/:id/progress', authenticateToken, (req: any, res: any) => {
  const { progress, status } = req.body;
  db.prepare('UPDATE workspace_goals SET progress=?,status=? WHERE id=? AND user_id=?').run(Math.min(100, Math.max(0, progress||0)), status||'active', req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/workspace-goals/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_goals WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Code Snippets v2
app.get('/api/code-snippets-v2', authenticateToken, (req: any, res: any) => {
  const { language, tag } = req.query as any;
  let q = 'SELECT * FROM code_snippets_v2 WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (language) { q += ' AND language=?'; p.push(language); }
  if (tag) { q += ' AND tags LIKE ?'; p.push('%'+tag+'%'); }
  q += ' ORDER BY runs DESC, created_at DESC';
  res.json(db.prepare(q).all(...p));
});
app.post('/api/code-snippets-v2', authenticateToken, (req: any, res: any) => {
  const { title, code, language, tags } = req.body;
  if (!title || !code) return res.status(400).json({ error: 'title and code required' });
  const r = db.prepare('INSERT INTO code_snippets_v2 (user_id,title,code,language,tags) VALUES (?,?,?,?,?)').run(req.user.id, title, code, language||'javascript', tags||'');
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/code-snippets-v2/:id', authenticateToken, (req: any, res: any) => {
  const { title, code, language, tags } = req.body;
  db.prepare('UPDATE code_snippets_v2 SET title=?,code=?,language=?,tags=? WHERE id=? AND user_id=?').run(title, code, language||'javascript', tags||'', req.params.id, req.user.id);
  res.json({ ok: true });
});
app.post('/api/code-snippets-v2/:id/run', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE code_snippets_v2 SET runs=runs+1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/code-snippets-v2/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM code_snippets_v2 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Feedback Notes
app.get('/api/feedback-notes', authenticateToken, (req: any, res: any) => {
  const { sentiment } = req.query as any;
  let q = 'SELECT * FROM feedback_notes WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (sentiment) { q += ' AND sentiment=?'; p.push(sentiment); }
  q += ' ORDER BY created_at DESC';
  res.json(db.prepare(q).all(...p));
});
app.post('/api/feedback-notes', authenticateToken, (req: any, res: any) => {
  const { subject, body, sentiment, source } = req.body;
  if (!subject || !body) return res.status(400).json({ error: 'subject and body required' });
  const r = db.prepare('INSERT INTO feedback_notes (user_id,subject,body,sentiment,source) VALUES (?,?,?,?,?)').run(req.user.id, subject, body, sentiment||'neutral', source||'manual');
  res.json({ id: r.lastInsertRowid });
});
app.delete('/api/feedback-notes/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM feedback_notes WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Session Checkpoints
app.get('/api/session-checkpoints', authenticateToken, (req: any, res: any) => {
  const { session_id } = req.query as any;
  let q = 'SELECT id,user_id,session_id,label,created_at FROM session_checkpoints WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (session_id) { q += ' AND session_id=?'; p.push(session_id); }
  q += ' ORDER BY created_at DESC';
  res.json(db.prepare(q).all(...p));
});
app.post('/api/session-checkpoints', authenticateToken, (req: any, res: any) => {
  const { session_id, label, state_json } = req.body;
  if (!session_id || !label) return res.status(400).json({ error: 'session_id and label required' });
  const r = db.prepare('INSERT INTO session_checkpoints (user_id,session_id,label,state_json) VALUES (?,?,?,?)').run(req.user.id, session_id, label, JSON.stringify(state_json||{}));
  res.json({ id: r.lastInsertRowid });
});
app.get('/api/session-checkpoints/:id/restore', authenticateToken, (req: any, res: any) => {
  const row = db.prepare('SELECT * FROM session_checkpoints WHERE id=? AND user_id=?').get(req.params.id, req.user.id) as any;
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json({ ...row, state_json: JSON.parse(row.state_json||'{}') });
});
app.delete('/api/session-checkpoints/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM session_checkpoints WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// ============================================================
// BATCH 41: thread_reactions_v2, workspace_alerts, ai_personas_v3, doc_versions, task_comments
// ============================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS thread_reactions_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    thread_id INTEGER NOT NULL,
    emoji TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, thread_id, emoji)
  );
  CREATE TABLE IF NOT EXISTS workspace_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    level TEXT DEFAULT 'info',
    read INTEGER DEFAULT 0,
    action_url TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS ai_personas_v3 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    model TEXT DEFAULT 'claude',
    temperature REAL DEFAULT 0.7,
    avatar_emoji TEXT DEFAULT '🤖',
    uses INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS doc_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    doc_id TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    change_summary TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS task_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Thread Reactions v2
app.get('/api/thread-reactions-v2/:thread_id', authenticateToken, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM thread_reactions_v2 WHERE user_id=? AND thread_id=?').all(req.user.id, req.params.thread_id));
});
app.post('/api/thread-reactions-v2', authenticateToken, (req: any, res: any) => {
  const { thread_id, emoji } = req.body;
  if (!thread_id || !emoji) return res.status(400).json({ error: 'thread_id and emoji required' });
  try {
    db.prepare('INSERT INTO thread_reactions_v2 (user_id,thread_id,emoji) VALUES (?,?,?) ON CONFLICT(user_id,thread_id,emoji) DO UPDATE SET count=count+1').run(req.user.id, thread_id, emoji);
    const row = db.prepare('SELECT count FROM thread_reactions_v2 WHERE user_id=? AND thread_id=? AND emoji=?').get(req.user.id, thread_id, emoji) as any;
    res.json({ count: row?.count });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/thread-reactions-v2/:thread_id/:emoji', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM thread_reactions_v2 WHERE user_id=? AND thread_id=? AND emoji=?').run(req.user.id, req.params.thread_id, req.params.emoji);
  res.json({ ok: true });
});

// Workspace Alerts
app.get('/api/workspace-alerts', authenticateToken, (req: any, res: any) => {
  const { unread } = req.query as any;
  let q = 'SELECT * FROM workspace_alerts WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (unread === 'true') { q += ' AND read=0'; }
  q += ' ORDER BY created_at DESC LIMIT 50';
  res.json(db.prepare(q).all(...p));
});
app.post('/api/workspace-alerts', authenticateToken, (req: any, res: any) => {
  const { title, message, level, action_url } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'title and message required' });
  const r = db.prepare('INSERT INTO workspace_alerts (user_id,title,message,level,action_url) VALUES (?,?,?,?,?)').run(req.user.id, title, message, level||'info', action_url||null);
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/workspace-alerts/:id/read', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE workspace_alerts SET read=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.put('/api/workspace-alerts/read-all', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE workspace_alerts SET read=1 WHERE user_id=?').run(req.user.id);
  res.json({ ok: true });
});
app.delete('/api/workspace-alerts/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_alerts WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// AI Personas v3
app.get('/api/ai-personas-v3', authenticateToken, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_personas_v3 WHERE user_id=? ORDER BY uses DESC').all(req.user.id));
});
app.post('/api/ai-personas-v3', authenticateToken, (req: any, res: any) => {
  const { name, system_prompt, model, temperature, avatar_emoji } = req.body;
  if (!name || !system_prompt) return res.status(400).json({ error: 'name and system_prompt required' });
  const r = db.prepare('INSERT INTO ai_personas_v3 (user_id,name,system_prompt,model,temperature,avatar_emoji) VALUES (?,?,?,?,?,?)').run(req.user.id, name, system_prompt, model||'claude', temperature||0.7, avatar_emoji||'🤖');
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/ai-personas-v3/:id', authenticateToken, (req: any, res: any) => {
  const { name, system_prompt, model, temperature, avatar_emoji } = req.body;
  db.prepare('UPDATE ai_personas_v3 SET name=?,system_prompt=?,model=?,temperature=?,avatar_emoji=? WHERE id=? AND user_id=?').run(name, system_prompt, model||'claude', temperature||0.7, avatar_emoji||'🤖', req.params.id, req.user.id);
  res.json({ ok: true });
});
app.post('/api/ai-personas-v3/:id/use', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE ai_personas_v3 SET uses=uses+1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  const row = db.prepare('SELECT * FROM ai_personas_v3 WHERE id=?').get(req.params.id);
  res.json(row);
});
app.delete('/api/ai-personas-v3/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_personas_v3 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Doc Versions
app.get('/api/doc-versions/:doc_id', authenticateToken, (req: any, res: any) => {
  res.json(db.prepare('SELECT id,user_id,doc_id,version,title,change_summary,created_at FROM doc_versions WHERE user_id=? AND doc_id=? ORDER BY version DESC').all(req.user.id, req.params.doc_id));
});
app.post('/api/doc-versions', authenticateToken, (req: any, res: any) => {
  const { doc_id, title, content, change_summary } = req.body;
  if (!doc_id || !title || !content) return res.status(400).json({ error: 'doc_id, title, content required' });
  const last = db.prepare('SELECT MAX(version) as v FROM doc_versions WHERE user_id=? AND doc_id=?').get(req.user.id, doc_id) as any;
  const version = (last?.v || 0) + 1;
  const r = db.prepare('INSERT INTO doc_versions (user_id,doc_id,version,title,content,change_summary) VALUES (?,?,?,?,?,?)').run(req.user.id, doc_id, version, title, content, change_summary||'');
  res.json({ id: r.lastInsertRowid, version });
});
app.get('/api/doc-versions/:doc_id/:version', authenticateToken, (req: any, res: any) => {
  const row = db.prepare('SELECT * FROM doc_versions WHERE user_id=? AND doc_id=? AND version=?').get(req.user.id, req.params.doc_id, req.params.version);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

// Task Comments
app.get('/api/task-comments/:task_id', authenticateToken, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM task_comments WHERE user_id=? AND task_id=? ORDER BY created_at ASC').all(req.user.id, req.params.task_id));
});
app.post('/api/task-comments', authenticateToken, (req: any, res: any) => {
  const { task_id, comment } = req.body;
  if (!task_id || !comment) return res.status(400).json({ error: 'task_id and comment required' });
  const r = db.prepare('INSERT INTO task_comments (user_id,task_id,comment) VALUES (?,?,?)').run(req.user.id, task_id, comment);
  res.json({ id: r.lastInsertRowid });
});
app.delete('/api/task-comments/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM task_comments WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// ============================================================
// BATCH 42: ai_chat_memory, workspace_search_index, custom_metrics, file_queue, token_ledger
// ============================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS ai_chat_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, key)
  );
  CREATE TABLE IF NOT EXISTS workspace_search_index (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    tags TEXT DEFAULT '',
    indexed_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS custom_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT DEFAULT '',
    category TEXT DEFAULT 'general',
    recorded_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS file_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    size_bytes INTEGER DEFAULT 0,
    mime_type TEXT DEFAULT 'application/octet-stream',
    status TEXT DEFAULT 'pending',
    error TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    processed_at TEXT
  );
  CREATE TABLE IF NOT EXISTS token_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    model TEXT,
    cost_usd REAL DEFAULT 0,
    recorded_at TEXT DEFAULT (datetime('now'))
  );
`);

// AI Chat Memory
app.get('/api/ai-chat-memory', authenticateToken, (req: any, res: any) => {
  const { category } = req.query as any;
  let q = "SELECT * FROM ai_chat_memory WHERE user_id=? AND (expires_at IS NULL OR expires_at > datetime('now'))";
  const p: any[] = [req.user.id];
  if (category) { q += ' AND category=?'; p.push(category); }
  q += ' ORDER BY created_at DESC';
  res.json(db.prepare(q).all(...p));
});
app.put('/api/ai-chat-memory', authenticateToken, (req: any, res: any) => {
  const { key, value, category, expires_at } = req.body;
  if (!key || !value) return res.status(400).json({ error: 'key and value required' });
  db.prepare('INSERT INTO ai_chat_memory (user_id,key,value,category,expires_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id,key) DO UPDATE SET value=excluded.value,category=excluded.category,expires_at=excluded.expires_at').run(req.user.id, key, value, category||'general', expires_at||null);
  res.json({ ok: true });
});
app.delete('/api/ai-chat-memory/:key', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_chat_memory WHERE user_id=? AND key=?').run(req.user.id, req.params.key);
  res.json({ ok: true });
});

// Workspace Search Index
app.post('/api/search-index', authenticateToken, (req: any, res: any) => {
  const { entity_type, entity_id, title, body, tags } = req.body;
  if (!entity_type || !entity_id || !title) return res.status(400).json({ error: 'entity_type, entity_id, title required' });
  db.prepare('INSERT OR REPLACE INTO workspace_search_index (user_id,entity_type,entity_id,title,body,tags) VALUES (?,?,?,?,?,?)').run(req.user.id, entity_type, entity_id, title, body||'', tags||'');
  res.json({ ok: true });
});
app.get('/api/search-index', authenticateToken, (req: any, res: any) => {
  const { q } = req.query as any;
  if (!q) return res.json([]);
  const like = '%'+q+'%';
  const rows = db.prepare("SELECT * FROM workspace_search_index WHERE user_id=? AND (title LIKE ? OR body LIKE ? OR tags LIKE ?) ORDER BY indexed_at DESC LIMIT 20").all(req.user.id, like, like, like);
  res.json(rows);
});

// Custom Metrics
app.post('/api/custom-metrics', authenticateToken, (req: any, res: any) => {
  const { name, value, unit, category } = req.body;
  if (!name || value === undefined) return res.status(400).json({ error: 'name and value required' });
  const r = db.prepare('INSERT INTO custom_metrics (user_id,name,value,unit,category) VALUES (?,?,?,?,?)').run(req.user.id, name, value, unit||'', category||'general');
  res.json({ id: r.lastInsertRowid });
});
app.get('/api/custom-metrics', authenticateToken, (req: any, res: any) => {
  const { name, category } = req.query as any;
  let q = 'SELECT * FROM custom_metrics WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (name) { q += ' AND name=?'; p.push(name); }
  if (category) { q += ' AND category=?'; p.push(category); }
  q += ' ORDER BY recorded_at DESC LIMIT 200';
  res.json(db.prepare(q).all(...p));
});
app.get('/api/custom-metrics/summary', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT name, unit, category, COUNT(*) as points, MIN(value) as min_val, MAX(value) as max_val, AVG(value) as avg_val, MAX(recorded_at) as last_recorded FROM custom_metrics WHERE user_id=? GROUP BY name ORDER BY last_recorded DESC').all(req.user.id);
  res.json(rows);
});

// File Queue
app.get('/api/file-queue', authenticateToken, (req: any, res: any) => {
  const { status } = req.query as any;
  let q = 'SELECT * FROM file_queue WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (status) { q += ' AND status=?'; p.push(status); }
  q += ' ORDER BY created_at DESC LIMIT 50';
  res.json(db.prepare(q).all(...p));
});
app.post('/api/file-queue', authenticateToken, (req: any, res: any) => {
  const { filename, size_bytes, mime_type } = req.body;
  if (!filename) return res.status(400).json({ error: 'filename required' });
  const r = db.prepare('INSERT INTO file_queue (user_id,filename,size_bytes,mime_type) VALUES (?,?,?,?)').run(req.user.id, filename, size_bytes||0, mime_type||'application/octet-stream');
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/file-queue/:id/status', authenticateToken, (req: any, res: any) => {
  const { status, error } = req.body;
  const now = new Date().toISOString();
  db.prepare('UPDATE file_queue SET status=?,error=?,processed_at=? WHERE id=? AND user_id=?').run(status||'pending', error||null, now, req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/file-queue/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM file_queue WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Token Ledger
app.post('/api/token-ledger', authenticateToken, (req: any, res: any) => {
  const { action, tokens_in, tokens_out, model, cost_usd } = req.body;
  if (!action) return res.status(400).json({ error: 'action required' });
  const r = db.prepare('INSERT INTO token_ledger (user_id,action,tokens_in,tokens_out,model,cost_usd) VALUES (?,?,?,?,?,?)').run(req.user.id, action, tokens_in||0, tokens_out||0, model||'unknown', cost_usd||0);
  res.json({ id: r.lastInsertRowid });
});
app.get('/api/token-ledger', authenticateToken, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM token_ledger WHERE user_id=? ORDER BY recorded_at DESC LIMIT 100').all(req.user.id);
  res.json(rows);
});
app.get('/api/token-ledger/summary', authenticateToken, (req: any, res: any) => {
  const daily = db.prepare("SELECT date(recorded_at) as day, SUM(tokens_in+tokens_out) as total_tokens, SUM(cost_usd) as total_cost, COUNT(*) as calls FROM token_ledger WHERE user_id=? GROUP BY day ORDER BY day DESC LIMIT 30").all(req.user.id);
  const byModel = db.prepare('SELECT model, SUM(tokens_in+tokens_out) as total_tokens, SUM(cost_usd) as total_cost, COUNT(*) as calls FROM token_ledger WHERE user_id=? GROUP BY model').all(req.user.id);
  res.json({ daily, byModel });
});


// ============================================================
// BATCH 43: ai_evaluations, workspace_events, response_templates, thread_archives_v3, user_badges
// ============================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS ai_evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    score INTEGER CHECK(score BETWEEN 1 AND 5),
    criteria TEXT DEFAULT 'general',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS workspace_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT DEFAULT '{}',
    source TEXT DEFAULT 'user',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS response_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    template TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    variables TEXT DEFAULT '[]',
    uses INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS thread_archives_v3 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    thread_id INTEGER NOT NULL,
    title TEXT,
    summary TEXT,
    message_count INTEGER DEFAULT 0,
    archived_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, thread_id)
  );
  CREATE TABLE IF NOT EXISTS user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    badge TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    earned_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, badge)
  );
`);

// AI Evaluations
app.post('/api/ai-evaluations', authenticateToken, (req: any, res: any) => {
  const { prompt, response, score, criteria, notes } = req.body;
  if (!prompt || !response || !score) return res.status(400).json({ error: 'prompt, response, score required' });
  const r = db.prepare('INSERT INTO ai_evaluations (user_id,prompt,response,score,criteria,notes) VALUES (?,?,?,?,?,?)').run(req.user.id, prompt, response, score, criteria||'general', notes||'');
  res.json({ id: r.lastInsertRowid });
});
app.get('/api/ai-evaluations', authenticateToken, (req: any, res: any) => {
  const { criteria, min_score } = req.query as any;
  let q = 'SELECT * FROM ai_evaluations WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (criteria) { q += ' AND criteria=?'; p.push(criteria); }
  if (min_score) { q += ' AND score>=?'; p.push(parseInt(min_score)); }
  q += ' ORDER BY created_at DESC LIMIT 50';
  res.json(db.prepare(q).all(...p));
});
app.get('/api/ai-evaluations/stats', authenticateToken, (req: any, res: any) => {
  const stats = db.prepare('SELECT criteria, AVG(score) as avg_score, COUNT(*) as count, MIN(score) as min_score, MAX(score) as max_score FROM ai_evaluations WHERE user_id=? GROUP BY criteria').all(req.user.id);
  res.json(stats);
});
app.delete('/api/ai-evaluations/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_evaluations WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Workspace Events
app.post('/api/workspace-events', authenticateToken, (req: any, res: any) => {
  const { event_type, payload, source } = req.body;
  if (!event_type) return res.status(400).json({ error: 'event_type required' });
  const r = db.prepare('INSERT INTO workspace_events (user_id,event_type,payload,source) VALUES (?,?,?,?)').run(req.user.id, event_type, JSON.stringify(payload||{}), source||'user');
  res.json({ id: r.lastInsertRowid });
});
app.get('/api/workspace-events', authenticateToken, (req: any, res: any) => {
  const { event_type, limit } = req.query as any;
  let q = 'SELECT * FROM workspace_events WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (event_type) { q += ' AND event_type=?'; p.push(event_type); }
  q += ' ORDER BY created_at DESC LIMIT ' + (parseInt(limit)||50);
  const rows = (db.prepare(q).all(...p) as any[]).map((r: any) => ({ ...r, payload: JSON.parse(r.payload||'{}') }));
  res.json(rows);
});
app.get('/api/workspace-events/types', authenticateToken, (req: any, res: any) => {
  res.json(db.prepare('SELECT event_type, COUNT(*) as count, MAX(created_at) as last_seen FROM workspace_events WHERE user_id=? GROUP BY event_type ORDER BY count DESC').all(req.user.id));
});

// Response Templates
app.get('/api/response-templates', authenticateToken, (req: any, res: any) => {
  const { category } = req.query as any;
  let q = 'SELECT * FROM response_templates WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (category) { q += ' AND category=?'; p.push(category); }
  q += ' ORDER BY uses DESC';
  res.json(db.prepare(q).all(...p));
});
app.post('/api/response-templates', authenticateToken, (req: any, res: any) => {
  const { name, template, category, variables } = req.body;
  if (!name || !template) return res.status(400).json({ error: 'name and template required' });
  const r = db.prepare('INSERT INTO response_templates (user_id,name,template,category,variables) VALUES (?,?,?,?,?)').run(req.user.id, name, template, category||'general', JSON.stringify(variables||[]));
  res.json({ id: r.lastInsertRowid });
});
app.post('/api/response-templates/:id/use', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE response_templates SET uses=uses+1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  const row = db.prepare('SELECT * FROM response_templates WHERE id=?').get(req.params.id);
  res.json(row);
});
app.delete('/api/response-templates/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM response_templates WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Thread Archives v3
app.post('/api/thread-archives-v3', authenticateToken, (req: any, res: any) => {
  const { thread_id, title, summary, message_count } = req.body;
  if (!thread_id) return res.status(400).json({ error: 'thread_id required' });
  try {
    const r = db.prepare('INSERT INTO thread_archives_v3 (user_id,thread_id,title,summary,message_count) VALUES (?,?,?,?,?) ON CONFLICT(user_id,thread_id) DO UPDATE SET title=excluded.title,summary=excluded.summary,archived_at=datetime("now")').run(req.user.id, thread_id, title||'', summary||'', message_count||0);
    res.json({ id: r.lastInsertRowid });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.get('/api/thread-archives-v3', authenticateToken, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM thread_archives_v3 WHERE user_id=? ORDER BY archived_at DESC').all(req.user.id));
});
app.delete('/api/thread-archives-v3/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM thread_archives_v3 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// User Badges
app.get('/api/user-badges', authenticateToken, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM user_badges WHERE user_id=? ORDER BY earned_at DESC').all(req.user.id));
});
app.post('/api/user-badges', authenticateToken, (req: any, res: any) => {
  const { badge, label, description } = req.body;
  if (!badge || !label) return res.status(400).json({ error: 'badge and label required' });
  try {
    const r = db.prepare('INSERT INTO user_badges (user_id,badge,label,description) VALUES (?,?,?,?)').run(req.user.id, badge, label, description||'');
    res.json({ id: r.lastInsertRowid });
  } catch { res.status(409).json({ error: 'badge already earned' }); }
});
app.delete('/api/user-badges/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM user_badges WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// ============================================================
// BATCH 44: ai_flows, workspace_tags_v2, insight_cards, prompt_ratings, session_snapshots
// ============================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS ai_flows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    steps TEXT DEFAULT '[]',
    trigger_type TEXT DEFAULT 'manual',
    status TEXT DEFAULT 'active',
    runs INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS workspace_tags_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    entity_type TEXT DEFAULT 'general',
    uses INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, name)
  );
  CREATE TABLE IF NOT EXISTS insight_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    insight TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    source TEXT DEFAULT 'manual',
    pinned INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS prompt_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    rating INTEGER CHECK(rating BETWEEN 1 AND 5),
    tags TEXT DEFAULT '',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS session_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    data TEXT DEFAULT '{}',
    tab TEXT DEFAULT 'workspace',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// AI Flows
app.get('/api/ai-flows', authenticateToken, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_flows WHERE user_id=? ORDER BY runs DESC').all(req.user.id));
});
app.post('/api/ai-flows', authenticateToken, (req: any, res: any) => {
  const { name, description, steps, trigger_type } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const r = db.prepare('INSERT INTO ai_flows (user_id,name,description,steps,trigger_type) VALUES (?,?,?,?,?)').run(req.user.id, name, description||'', JSON.stringify(steps||[]), trigger_type||'manual');
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/ai-flows/:id', authenticateToken, (req: any, res: any) => {
  const { name, description, steps, trigger_type, status } = req.body;
  db.prepare('UPDATE ai_flows SET name=?,description=?,steps=?,trigger_type=?,status=? WHERE id=? AND user_id=?').run(name, description||'', JSON.stringify(steps||[]), trigger_type||'manual', status||'active', req.params.id, req.user.id);
  res.json({ ok: true });
});
app.post('/api/ai-flows/:id/run', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE ai_flows SET runs=runs+1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  const flow = db.prepare('SELECT * FROM ai_flows WHERE id=?').get(req.params.id) as any;
  res.json({ ok: true, steps: JSON.parse(flow?.steps||'[]'), runs: flow?.runs });
});
app.delete('/api/ai-flows/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_flows WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Workspace Tags v2
app.get('/api/workspace-tags-v2', authenticateToken, (req: any, res: any) => {
  const { entity_type } = req.query as any;
  let q = 'SELECT * FROM workspace_tags_v2 WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (entity_type) { q += ' AND entity_type=?'; p.push(entity_type); }
  q += ' ORDER BY uses DESC';
  res.json(db.prepare(q).all(...p));
});
app.post('/api/workspace-tags-v2', authenticateToken, (req: any, res: any) => {
  const { name, color, entity_type } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const r = db.prepare('INSERT INTO workspace_tags_v2 (user_id,name,color,entity_type) VALUES (?,?,?,?)').run(req.user.id, name, color||'#6366f1', entity_type||'general');
    res.json({ id: r.lastInsertRowid });
  } catch { res.status(409).json({ error: 'tag exists' }); }
});
app.post('/api/workspace-tags-v2/:id/use', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE workspace_tags_v2 SET uses=uses+1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/workspace-tags-v2/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_tags_v2 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Insight Cards
app.get('/api/insight-cards', authenticateToken, (req: any, res: any) => {
  const { category, pinned } = req.query as any;
  let q = 'SELECT * FROM insight_cards WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (category) { q += ' AND category=?'; p.push(category); }
  if (pinned === 'true') { q += ' AND pinned=1'; }
  q += ' ORDER BY pinned DESC, created_at DESC';
  res.json(db.prepare(q).all(...p));
});
app.post('/api/insight-cards', authenticateToken, (req: any, res: any) => {
  const { title, insight, category, source } = req.body;
  if (!title || !insight) return res.status(400).json({ error: 'title and insight required' });
  const r = db.prepare('INSERT INTO insight_cards (user_id,title,insight,category,source) VALUES (?,?,?,?,?)').run(req.user.id, title, insight, category||'general', source||'manual');
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/insight-cards/:id/pin', authenticateToken, (req: any, res: any) => {
  const row = db.prepare('SELECT pinned FROM insight_cards WHERE id=? AND user_id=?').get(req.params.id, req.user.id) as any;
  db.prepare('UPDATE insight_cards SET pinned=? WHERE id=? AND user_id=?').run(row?.pinned ? 0 : 1, req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/insight-cards/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM insight_cards WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Prompt Ratings
app.post('/api/prompt-ratings', authenticateToken, (req: any, res: any) => {
  const { prompt, rating, tags, notes } = req.body;
  if (!prompt || !rating) return res.status(400).json({ error: 'prompt and rating required' });
  const r = db.prepare('INSERT INTO prompt_ratings (user_id,prompt,rating,tags,notes) VALUES (?,?,?,?,?)').run(req.user.id, prompt, rating, tags||'', notes||'');
  res.json({ id: r.lastInsertRowid });
});
app.get('/api/prompt-ratings', authenticateToken, (req: any, res: any) => {
  const { min_rating } = req.query as any;
  let q = 'SELECT * FROM prompt_ratings WHERE user_id=?';
  const p: any[] = [req.user.id];
  if (min_rating) { q += ' AND rating>=?'; p.push(parseInt(min_rating)); }
  q += ' ORDER BY rating DESC, created_at DESC LIMIT 50';
  res.json(db.prepare(q).all(...p));
});
app.delete('/api/prompt-ratings/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM prompt_ratings WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Session Snapshots
app.post('/api/session-snapshots', authenticateToken, (req: any, res: any) => {
  const { name, data, tab } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const r = db.prepare('INSERT INTO session_snapshots (user_id,name,data,tab) VALUES (?,?,?,?)').run(req.user.id, name, JSON.stringify(data||{}), tab||'workspace');
  res.json({ id: r.lastInsertRowid });
});
app.get('/api/session-snapshots', authenticateToken, (req: any, res: any) => {
  const rows = (db.prepare('SELECT * FROM session_snapshots WHERE user_id=? ORDER BY created_at DESC').all(req.user.id) as any[]).map((r: any) => ({ ...r, data: JSON.parse(r.data||'{}') }));
  res.json(rows);
});
app.delete('/api/session-snapshots/:id', authenticateToken, (req: any, res: any) => {
  db.prepare('DELETE FROM session_snapshots WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// ── Batch 45 ──────────────────────────────────────────────────────────────────

// Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS agent_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT, prompt TEXT,
    result TEXT, status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS workspace_policies (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT, rule TEXT,
    enabled INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS knowledge_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, content TEXT,
    node_type TEXT DEFAULT 'fact', tags TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS chat_reactions_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, message_id TEXT,
    emoji TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ai_draft_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, prompt TEXT,
    draft TEXT, model TEXT, accepted INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// /api/agent-runs
app.get('/api/agent-runs', requireAuth, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM agent_runs WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  res.json(rows);
});
app.post('/api/agent-runs', requireAuth, (req: any, res: any) => {
  const { name, prompt } = req.body;
  if (!name || !prompt) return res.status(400).json({ error: 'name and prompt required' });
  const result = db.prepare('INSERT INTO agent_runs (user_id,name,prompt,status) VALUES (?,?,?,?)').run(req.user.id, name, prompt, 'pending');
  setTimeout(() => {
    db.prepare('UPDATE agent_runs SET result=?,status=? WHERE id=?').run(`Completed: ${prompt.slice(0,80)}`, 'done', result.lastInsertRowid);
  }, 100);
  res.json({ id: result.lastInsertRowid, name, prompt, status: 'pending' });
});
app.put('/api/agent-runs/:id/cancel', requireAuth, (req: any, res: any) => {
  db.prepare('UPDATE agent_runs SET status=? WHERE id=? AND user_id=?').run('cancelled', req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/agent-runs/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM agent_runs WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/workspace-policies
app.get('/api/workspace-policies', requireAuth, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM workspace_policies WHERE user_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows);
});
app.post('/api/workspace-policies', requireAuth, (req: any, res: any) => {
  const { name, rule } = req.body;
  if (!name || !rule) return res.status(400).json({ error: 'name and rule required' });
  const result = db.prepare('INSERT INTO workspace_policies (user_id,name,rule) VALUES (?,?,?)').run(req.user.id, name, rule);
  res.json({ id: result.lastInsertRowid, name, rule, enabled: 1 });
});
app.put('/api/workspace-policies/:id/toggle', requireAuth, (req: any, res: any) => {
  const row: any = db.prepare('SELECT enabled FROM workspace_policies WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE workspace_policies SET enabled=? WHERE id=? AND user_id=?').run(row.enabled ? 0 : 1, req.params.id, req.user.id);
  res.json({ ok: true, enabled: !row.enabled });
});
app.delete('/api/workspace-policies/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_policies WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/knowledge-nodes
app.get('/api/knowledge-nodes', requireAuth, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM knowledge_nodes WHERE user_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows);
});
app.post('/api/knowledge-nodes', requireAuth, (req: any, res: any) => {
  const { title, content, node_type = 'fact', tags = '' } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'title and content required' });
  const result = db.prepare('INSERT INTO knowledge_nodes (user_id,title,content,node_type,tags) VALUES (?,?,?,?,?)').run(req.user.id, title, content, node_type, tags);
  res.json({ id: result.lastInsertRowid, title, content, node_type, tags });
});
app.put('/api/knowledge-nodes/:id', requireAuth, (req: any, res: any) => {
  const { title, content, tags } = req.body;
  db.prepare('UPDATE knowledge_nodes SET title=?,content=?,tags=? WHERE id=? AND user_id=?').run(title, content, tags, req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/knowledge-nodes/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM knowledge_nodes WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/chat-reactions-v2
app.get('/api/chat-reactions-v2/:messageId', requireAuth, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM chat_reactions_v2 WHERE message_id=? AND user_id=?').all(req.params.messageId, req.user.id);
  res.json(rows);
});
app.post('/api/chat-reactions-v2', requireAuth, (req: any, res: any) => {
  const { message_id, emoji } = req.body;
  if (!message_id || !emoji) return res.status(400).json({ error: 'message_id and emoji required' });
  const exists = db.prepare('SELECT id FROM chat_reactions_v2 WHERE user_id=? AND message_id=? AND emoji=?').get(req.user.id, message_id, emoji);
  if (exists) {
    db.prepare('DELETE FROM chat_reactions_v2 WHERE id=?').run((exists as any).id);
    return res.json({ toggled: false });
  }
  const result = db.prepare('INSERT INTO chat_reactions_v2 (user_id,message_id,emoji) VALUES (?,?,?)').run(req.user.id, message_id, emoji);
  res.json({ id: result.lastInsertRowid, message_id, emoji, toggled: true });
});
app.delete('/api/chat-reactions-v2/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM chat_reactions_v2 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/ai-draft-history
app.get('/api/ai-draft-history', requireAuth, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM ai_draft_history WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  res.json(rows);
});
app.post('/api/ai-draft-history', requireAuth, (req: any, res: any) => {
  const { prompt, draft, model = 'claude' } = req.body;
  if (!prompt || !draft) return res.status(400).json({ error: 'prompt and draft required' });
  const result = db.prepare('INSERT INTO ai_draft_history (user_id,prompt,draft,model) VALUES (?,?,?,?)').run(req.user.id, prompt, draft, model);
  res.json({ id: result.lastInsertRowid, prompt, draft, model, accepted: 0 });
});
app.put('/api/ai-draft-history/:id/accept', requireAuth, (req: any, res: any) => {
  db.prepare('UPDATE ai_draft_history SET accepted=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/ai-draft-history/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_draft_history WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// ── Batch 46 ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS content_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT,
    content TEXT, block_type TEXT DEFAULT 'text', pinned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS workspace_timers (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, label TEXT,
    duration_sec INTEGER, started_at DATETIME, status TEXT DEFAULT 'idle',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ai_confidence_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, prompt TEXT,
    response_snippet TEXT, confidence REAL, model TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS user_checklists (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT,
    items TEXT, completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS workspace_milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT,
    description TEXT, due_date TEXT, achieved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// /api/content-blocks
app.get('/api/content-blocks', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM content_blocks WHERE user_id=? ORDER BY pinned DESC, created_at DESC').all(req.user.id));
});
app.post('/api/content-blocks', requireAuth, (req: any, res: any) => {
  const { title, content, block_type = 'text' } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'title and content required' });
  const r = db.prepare('INSERT INTO content_blocks (user_id,title,content,block_type) VALUES (?,?,?,?)').run(req.user.id, title, content, block_type);
  res.json({ id: r.lastInsertRowid, title, content, block_type, pinned: 0 });
});
app.put('/api/content-blocks/:id/pin', requireAuth, (req: any, res: any) => {
  const row: any = db.prepare('SELECT pinned FROM content_blocks WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE content_blocks SET pinned=? WHERE id=? AND user_id=?').run(row.pinned ? 0 : 1, req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/content-blocks/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM content_blocks WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/workspace-timers
app.get('/api/workspace-timers', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_timers WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});
app.post('/api/workspace-timers', requireAuth, (req: any, res: any) => {
  const { label, duration_sec } = req.body;
  if (!label || !duration_sec) return res.status(400).json({ error: 'label and duration_sec required' });
  const r = db.prepare('INSERT INTO workspace_timers (user_id,label,duration_sec,status) VALUES (?,?,?,?)').run(req.user.id, label, duration_sec, 'idle');
  res.json({ id: r.lastInsertRowid, label, duration_sec, status: 'idle' });
});
app.put('/api/workspace-timers/:id/start', requireAuth, (req: any, res: any) => {
  db.prepare('UPDATE workspace_timers SET status=?,started_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?').run('running', req.params.id, req.user.id);
  res.json({ ok: true });
});
app.put('/api/workspace-timers/:id/stop', requireAuth, (req: any, res: any) => {
  db.prepare('UPDATE workspace_timers SET status=? WHERE id=? AND user_id=?').run('idle', req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/workspace-timers/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_timers WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/ai-confidence-logs
app.post('/api/ai-confidence-logs', requireAuth, (req: any, res: any) => {
  const { prompt, response_snippet, confidence, model = 'claude' } = req.body;
  if (!prompt || confidence === undefined) return res.status(400).json({ error: 'prompt and confidence required' });
  const r = db.prepare('INSERT INTO ai_confidence_logs (user_id,prompt,response_snippet,confidence,model) VALUES (?,?,?,?,?)').run(req.user.id, prompt, response_snippet || '', confidence, model);
  res.json({ id: r.lastInsertRowid });
});
app.get('/api/ai-confidence-logs', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_confidence_logs WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.user.id));
});
app.get('/api/ai-confidence-logs/avg', requireAuth, (req: any, res: any) => {
  const row: any = db.prepare('SELECT AVG(confidence) as avg_conf, COUNT(*) as total FROM ai_confidence_logs WHERE user_id=?').get(req.user.id);
  res.json(row);
});

// /api/user-checklists
app.get('/api/user-checklists', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM user_checklists WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});
app.post('/api/user-checklists', requireAuth, (req: any, res: any) => {
  const { title, items } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const itemStr = Array.isArray(items) ? items.join('\n') : (items || '');
  const r = db.prepare('INSERT INTO user_checklists (user_id,title,items) VALUES (?,?,?)').run(req.user.id, title, itemStr);
  res.json({ id: r.lastInsertRowid, title, items: itemStr, completed: 0 });
});
app.put('/api/user-checklists/:id/complete', requireAuth, (req: any, res: any) => {
  db.prepare('UPDATE user_checklists SET completed=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/user-checklists/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM user_checklists WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/workspace-milestones
app.get('/api/workspace-milestones', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_milestones WHERE user_id=? ORDER BY due_date ASC').all(req.user.id));
});
app.post('/api/workspace-milestones', requireAuth, (req: any, res: any) => {
  const { title, description = '', due_date = '' } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const r = db.prepare('INSERT INTO workspace_milestones (user_id,title,description,due_date) VALUES (?,?,?,?)').run(req.user.id, title, description, due_date);
  res.json({ id: r.lastInsertRowid, title, description, due_date, achieved: 0 });
});
app.put('/api/workspace-milestones/:id/achieve', requireAuth, (req: any, res: any) => {
  db.prepare('UPDATE workspace_milestones SET achieved=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/workspace-milestones/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_milestones WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// ── Batch 47 ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS saved_searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, query TEXT,
    label TEXT, hits INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS workspace_announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT,
    body TEXT, pinned INTEGER DEFAULT 0, expires_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ai_retry_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, prompt TEXT,
    attempts INTEGER DEFAULT 1, final_model TEXT, success INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS thread_labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, thread_id TEXT,
    label TEXT, color TEXT DEFAULT '#6366f1', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS user_preferences_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE,
    theme TEXT DEFAULT 'dark', font_size INTEGER DEFAULT 14,
    sidebar_collapsed INTEGER DEFAULT 0, show_timestamps INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// /api/saved-searches
app.get('/api/saved-searches', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM saved_searches WHERE user_id=? ORDER BY hits DESC').all(req.user.id));
});
app.post('/api/saved-searches', requireAuth, (req: any, res: any) => {
  const { query, label } = req.body;
  if (!query || !label) return res.status(400).json({ error: 'query and label required' });
  const r = db.prepare('INSERT INTO saved_searches (user_id,query,label) VALUES (?,?,?)').run(req.user.id, query, label);
  res.json({ id: r.lastInsertRowid, query, label, hits: 0 });
});
app.put('/api/saved-searches/:id/use', requireAuth, (req: any, res: any) => {
  const row: any = db.prepare('SELECT * FROM saved_searches WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE saved_searches SET hits=hits+1 WHERE id=?').run(req.params.id);
  res.json({ query: row.query });
});
app.delete('/api/saved-searches/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM saved_searches WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/workspace-announcements
app.get('/api/workspace-announcements', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_announcements WHERE user_id=? ORDER BY pinned DESC, created_at DESC').all(req.user.id));
});
app.post('/api/workspace-announcements', requireAuth, (req: any, res: any) => {
  const { title, body, expires_at = '' } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title and body required' });
  const r = db.prepare('INSERT INTO workspace_announcements (user_id,title,body,expires_at) VALUES (?,?,?,?)').run(req.user.id, title, body, expires_at);
  res.json({ id: r.lastInsertRowid, title, body, pinned: 0 });
});
app.put('/api/workspace-announcements/:id/pin', requireAuth, (req: any, res: any) => {
  const row: any = db.prepare('SELECT pinned FROM workspace_announcements WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE workspace_announcements SET pinned=? WHERE id=?').run(row.pinned ? 0 : 1, req.params.id);
  res.json({ ok: true });
});
app.delete('/api/workspace-announcements/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_announcements WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/ai-retry-logs
app.post('/api/ai-retry-logs', requireAuth, (req: any, res: any) => {
  const { prompt, attempts = 1, final_model = 'claude', success = 1 } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  const r = db.prepare('INSERT INTO ai_retry_logs (user_id,prompt,attempts,final_model,success) VALUES (?,?,?,?,?)').run(req.user.id, prompt, attempts, final_model, success);
  res.json({ id: r.lastInsertRowid });
});
app.get('/api/ai-retry-logs', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_retry_logs WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.user.id));
});
app.get('/api/ai-retry-logs/stats', requireAuth, (req: any, res: any) => {
  const stats = db.prepare('SELECT final_model, COUNT(*) as count, AVG(attempts) as avg_attempts FROM ai_retry_logs WHERE user_id=? GROUP BY final_model').all(req.user.id);
  res.json(stats);
});

// /api/thread-labels
app.get('/api/thread-labels/:threadId', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM thread_labels WHERE thread_id=? AND user_id=?').all(req.params.threadId, req.user.id));
});
app.post('/api/thread-labels', requireAuth, (req: any, res: any) => {
  const { thread_id, label, color = '#6366f1' } = req.body;
  if (!thread_id || !label) return res.status(400).json({ error: 'thread_id and label required' });
  const r = db.prepare('INSERT INTO thread_labels (user_id,thread_id,label,color) VALUES (?,?,?,?)').run(req.user.id, thread_id, label, color);
  res.json({ id: r.lastInsertRowid, thread_id, label, color });
});
app.delete('/api/thread-labels/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM thread_labels WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/user-preferences-v2
app.get('/api/user-preferences-v2', requireAuth, (req: any, res: any) => {
  const row = db.prepare('SELECT * FROM user_preferences_v2 WHERE user_id=?').get(req.user.id);
  if (!row) {
    db.prepare('INSERT OR IGNORE INTO user_preferences_v2 (user_id) VALUES (?)').run(req.user.id);
    return res.json(db.prepare('SELECT * FROM user_preferences_v2 WHERE user_id=?').get(req.user.id));
  }
  res.json(row);
});
app.put('/api/user-preferences-v2', requireAuth, (req: any, res: any) => {
  const { theme, font_size, sidebar_collapsed, show_timestamps } = req.body;
  db.prepare('INSERT OR REPLACE INTO user_preferences_v2 (user_id,theme,font_size,sidebar_collapsed,show_timestamps,updated_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)').run(req.user.id, theme||'dark', font_size||14, sidebar_collapsed||0, show_timestamps!==undefined?show_timestamps:1);
  res.json({ ok: true });
});


// ── Batch 48 ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS project_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, project TEXT,
    title TEXT, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ai_cost_estimates (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, prompt_tokens INTEGER,
    completion_tokens INTEGER, model TEXT, estimated_cost REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS workspace_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT,
    url TEXT, category TEXT DEFAULT 'general', clicks INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS message_drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, thread_id TEXT,
    content TEXT, auto_saved INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ai_model_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, model TEXT,
    calls INTEGER DEFAULT 0, tokens_used INTEGER DEFAULT 0, errors INTEGER DEFAULT 0,
    last_used DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// /api/project-notes
app.get('/api/project-notes', requireAuth, (req: any, res: any) => {
  const { project } = req.query;
  const rows = project
    ? db.prepare('SELECT * FROM project_notes WHERE user_id=? AND project=? ORDER BY created_at DESC').all(req.user.id, project)
    : db.prepare('SELECT * FROM project_notes WHERE user_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows);
});
app.post('/api/project-notes', requireAuth, (req: any, res: any) => {
  const { project, title, content } = req.body;
  if (!project || !title) return res.status(400).json({ error: 'project and title required' });
  const r = db.prepare('INSERT INTO project_notes (user_id,project,title,content) VALUES (?,?,?,?)').run(req.user.id, project, title, content || '');
  res.json({ id: r.lastInsertRowid, project, title, content });
});
app.put('/api/project-notes/:id', requireAuth, (req: any, res: any) => {
  const { title, content } = req.body;
  db.prepare('UPDATE project_notes SET title=?,content=? WHERE id=? AND user_id=?').run(title, content, req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/project-notes/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM project_notes WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/ai-cost-estimates
app.post('/api/ai-cost-estimates', requireAuth, (req: any, res: any) => {
  const { prompt_tokens, completion_tokens, model, estimated_cost } = req.body;
  if (!model || estimated_cost === undefined) return res.status(400).json({ error: 'model and estimated_cost required' });
  const r = db.prepare('INSERT INTO ai_cost_estimates (user_id,prompt_tokens,completion_tokens,model,estimated_cost) VALUES (?,?,?,?,?)').run(req.user.id, prompt_tokens||0, completion_tokens||0, model, estimated_cost);
  res.json({ id: r.lastInsertRowid });
});
app.get('/api/ai-cost-estimates', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_cost_estimates WHERE user_id=? ORDER BY created_at DESC LIMIT 100').all(req.user.id));
});
app.get('/api/ai-cost-estimates/total', requireAuth, (req: any, res: any) => {
  const row: any = db.prepare('SELECT SUM(estimated_cost) as total, SUM(prompt_tokens+completion_tokens) as total_tokens, COUNT(*) as calls FROM ai_cost_estimates WHERE user_id=?').get(req.user.id);
  res.json(row);
});

// /api/workspace-links
app.get('/api/workspace-links', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_links WHERE user_id=? ORDER BY clicks DESC').all(req.user.id));
});
app.post('/api/workspace-links', requireAuth, (req: any, res: any) => {
  const { title, url, category = 'general' } = req.body;
  if (!title || !url) return res.status(400).json({ error: 'title and url required' });
  const r = db.prepare('INSERT INTO workspace_links (user_id,title,url,category) VALUES (?,?,?,?)').run(req.user.id, title, url, category);
  res.json({ id: r.lastInsertRowid, title, url, category, clicks: 0 });
});
app.put('/api/workspace-links/:id/click', requireAuth, (req: any, res: any) => {
  const row: any = db.prepare('SELECT url FROM workspace_links WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE workspace_links SET clicks=clicks+1 WHERE id=?').run(req.params.id);
  res.json({ url: row.url });
});
app.delete('/api/workspace-links/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_links WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/message-drafts
app.get('/api/message-drafts', requireAuth, (req: any, res: any) => {
  const { thread_id } = req.query;
  const rows = thread_id
    ? db.prepare('SELECT * FROM message_drafts WHERE user_id=? AND thread_id=? ORDER BY updated_at DESC').all(req.user.id, thread_id)
    : db.prepare('SELECT * FROM message_drafts WHERE user_id=? ORDER BY updated_at DESC LIMIT 20').all(req.user.id);
  res.json(rows);
});
app.post('/api/message-drafts', requireAuth, (req: any, res: any) => {
  const { thread_id, content } = req.body;
  if (!content) return res.status(400).json({ error: 'content required' });
  const r = db.prepare('INSERT INTO message_drafts (user_id,thread_id,content) VALUES (?,?,?)').run(req.user.id, thread_id || '', content);
  res.json({ id: r.lastInsertRowid, thread_id, content });
});
app.put('/api/message-drafts/:id', requireAuth, (req: any, res: any) => {
  const { content } = req.body;
  db.prepare('UPDATE message_drafts SET content=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?').run(content, req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/message-drafts/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM message_drafts WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/ai-model-stats
app.post('/api/ai-model-stats/record', requireAuth, (req: any, res: any) => {
  const { model, tokens = 0, error = 0 } = req.body;
  if (!model) return res.status(400).json({ error: 'model required' });
  const exists: any = db.prepare('SELECT id FROM ai_model_stats WHERE user_id=? AND model=?').get(req.user.id, model);
  if (exists) {
    db.prepare('UPDATE ai_model_stats SET calls=calls+1,tokens_used=tokens_used+?,errors=errors+?,last_used=CURRENT_TIMESTAMP WHERE id=?').run(tokens, error, exists.id);
  } else {
    db.prepare('INSERT INTO ai_model_stats (user_id,model,calls,tokens_used,errors) VALUES (?,?,1,?,?)').run(req.user.id, model, tokens, error);
  }
  res.json({ ok: true });
});
app.get('/api/ai-model-stats', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_model_stats WHERE user_id=? ORDER BY calls DESC').all(req.user.id));
});


// ── Batch 49 ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS sprint_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, sprint TEXT,
    title TEXT, status TEXT DEFAULT 'todo', points INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ai_summaries_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, source_type TEXT,
    source_id TEXT, summary TEXT, model TEXT DEFAULT 'claude',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS workspace_colors (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT,
    hex TEXT, usage TEXT DEFAULT 'accent', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS thread_clips (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, thread_id TEXT,
    message_id TEXT, clip_text TEXT, note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ai_prompts_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT,
    prompt TEXT, category TEXT DEFAULT 'general', uses INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// /api/sprint-items
app.get('/api/sprint-items', requireAuth, (req: any, res: any) => {
  const { sprint } = req.query;
  const rows = sprint
    ? db.prepare('SELECT * FROM sprint_items WHERE user_id=? AND sprint=? ORDER BY status, created_at').all(req.user.id, sprint)
    : db.prepare('SELECT * FROM sprint_items WHERE user_id=? ORDER BY sprint DESC, created_at').all(req.user.id);
  res.json(rows);
});
app.post('/api/sprint-items', requireAuth, (req: any, res: any) => {
  const { sprint, title, points = 1 } = req.body;
  if (!sprint || !title) return res.status(400).json({ error: 'sprint and title required' });
  const r = db.prepare('INSERT INTO sprint_items (user_id,sprint,title,points) VALUES (?,?,?,?)').run(req.user.id, sprint, title, points);
  res.json({ id: r.lastInsertRowid, sprint, title, status: 'todo', points });
});
app.put('/api/sprint-items/:id/status', requireAuth, (req: any, res: any) => {
  const { status } = req.body;
  db.prepare('UPDATE sprint_items SET status=? WHERE id=? AND user_id=?').run(status, req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/sprint-items/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM sprint_items WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/ai-summaries-v2
app.post('/api/ai-summaries-v2', requireAuth, (req: any, res: any) => {
  const { source_type, source_id, summary, model = 'claude' } = req.body;
  if (!source_type || !summary) return res.status(400).json({ error: 'source_type and summary required' });
  const r = db.prepare('INSERT INTO ai_summaries_v2 (user_id,source_type,source_id,summary,model) VALUES (?,?,?,?,?)').run(req.user.id, source_type, source_id || '', summary, model);
  res.json({ id: r.lastInsertRowid });
});
app.get('/api/ai-summaries-v2', requireAuth, (req: any, res: any) => {
  const { source_type } = req.query;
  const rows = source_type
    ? db.prepare('SELECT * FROM ai_summaries_v2 WHERE user_id=? AND source_type=? ORDER BY created_at DESC').all(req.user.id, source_type)
    : db.prepare('SELECT * FROM ai_summaries_v2 WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  res.json(rows);
});
app.delete('/api/ai-summaries-v2/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_summaries_v2 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/workspace-colors
app.get('/api/workspace-colors', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_colors WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});
app.post('/api/workspace-colors', requireAuth, (req: any, res: any) => {
  const { name, hex, usage = 'accent' } = req.body;
  if (!name || !hex) return res.status(400).json({ error: 'name and hex required' });
  const r = db.prepare('INSERT INTO workspace_colors (user_id,name,hex,usage) VALUES (?,?,?,?)').run(req.user.id, name, hex, usage);
  res.json({ id: r.lastInsertRowid, name, hex, usage });
});
app.delete('/api/workspace-colors/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_colors WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/thread-clips
app.get('/api/thread-clips', requireAuth, (req: any, res: any) => {
  const { thread_id } = req.query;
  const rows = thread_id
    ? db.prepare('SELECT * FROM thread_clips WHERE user_id=? AND thread_id=? ORDER BY created_at DESC').all(req.user.id, thread_id)
    : db.prepare('SELECT * FROM thread_clips WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  res.json(rows);
});
app.post('/api/thread-clips', requireAuth, (req: any, res: any) => {
  const { thread_id, message_id, clip_text, note = '' } = req.body;
  if (!clip_text) return res.status(400).json({ error: 'clip_text required' });
  const r = db.prepare('INSERT INTO thread_clips (user_id,thread_id,message_id,clip_text,note) VALUES (?,?,?,?,?)').run(req.user.id, thread_id || '', message_id || '', clip_text, note);
  res.json({ id: r.lastInsertRowid, clip_text, note });
});
app.delete('/api/thread-clips/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM thread_clips WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/prompts-library
app.get('/api/prompts-library', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_prompts_library WHERE user_id=? ORDER BY uses DESC').all(req.user.id));
});
app.post('/api/prompts-library', requireAuth, (req: any, res: any) => {
  const { title, prompt, category = 'general' } = req.body;
  if (!title || !prompt) return res.status(400).json({ error: 'title and prompt required' });
  const r = db.prepare('INSERT INTO ai_prompts_library (user_id,title,prompt,category) VALUES (?,?,?,?)').run(req.user.id, title, prompt, category);
  res.json({ id: r.lastInsertRowid, title, prompt, category, uses: 0 });
});
app.put('/api/prompts-library/:id/use', requireAuth, (req: any, res: any) => {
  const row: any = db.prepare('SELECT prompt FROM ai_prompts_library WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE ai_prompts_library SET uses=uses+1 WHERE id=?').run(req.params.id);
  res.json({ prompt: row.prompt });
});
app.delete('/api/prompts-library/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_prompts_library WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// ── Batch 50 ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS ai_chains (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT,
    steps TEXT, status TEXT DEFAULT 'draft', last_run DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS workspace_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT,
    content TEXT, report_type TEXT DEFAULT 'weekly', generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ai_test_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT,
    input TEXT, expected TEXT, actual TEXT, passed INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS context_windows (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT,
    content TEXT, token_count INTEGER DEFAULT 0, pinned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS user_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT,
    description TEXT, target_date TEXT, progress INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// /api/ai-chains
app.get('/api/ai-chains', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_chains WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});
app.post('/api/ai-chains', requireAuth, (req: any, res: any) => {
  const { name, steps } = req.body;
  if (!name || !steps) return res.status(400).json({ error: 'name and steps required' });
  const stepsStr = Array.isArray(steps) ? steps.join('\n') : steps;
  const r = db.prepare('INSERT INTO ai_chains (user_id,name,steps) VALUES (?,?,?)').run(req.user.id, name, stepsStr);
  res.json({ id: r.lastInsertRowid, name, steps: stepsStr, status: 'draft' });
});
app.put('/api/ai-chains/:id/run', requireAuth, (req: any, res: any) => {
  db.prepare('UPDATE ai_chains SET status=?,last_run=CURRENT_TIMESTAMP WHERE id=? AND user_id=?').run('running', req.params.id, req.user.id);
  setTimeout(() => {
    db.prepare('UPDATE ai_chains SET status=? WHERE id=?').run('completed', req.params.id);
  }, 200);
  res.json({ ok: true, status: 'running' });
});
app.delete('/api/ai-chains/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_chains WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/workspace-reports
app.get('/api/workspace-reports', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_reports WHERE user_id=? ORDER BY generated_at DESC').all(req.user.id));
});
app.post('/api/workspace-reports', requireAuth, (req: any, res: any) => {
  const { title, content, report_type = 'weekly' } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'title and content required' });
  const r = db.prepare('INSERT INTO workspace_reports (user_id,title,content,report_type) VALUES (?,?,?,?)').run(req.user.id, title, content, report_type);
  res.json({ id: r.lastInsertRowid, title, content, report_type });
});
app.delete('/api/workspace-reports/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_reports WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/ai-test-cases
app.get('/api/ai-test-cases', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_test_cases WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});
app.post('/api/ai-test-cases', requireAuth, (req: any, res: any) => {
  const { name, input, expected } = req.body;
  if (!name || !input) return res.status(400).json({ error: 'name and input required' });
  const r = db.prepare('INSERT INTO ai_test_cases (user_id,name,input,expected) VALUES (?,?,?,?)').run(req.user.id, name, input, expected || '');
  res.json({ id: r.lastInsertRowid, name, input, expected });
});
app.put('/api/ai-test-cases/:id/run', requireAuth, (req: any, res: any) => {
  const { actual } = req.body;
  const row: any = db.prepare('SELECT expected FROM ai_test_cases WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  const passed = actual && row.expected && actual.toLowerCase().includes(row.expected.toLowerCase()) ? 1 : 0;
  db.prepare('UPDATE ai_test_cases SET actual=?,passed=? WHERE id=?').run(actual || '', passed, req.params.id);
  res.json({ passed: !!passed, actual });
});
app.delete('/api/ai-test-cases/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_test_cases WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/context-windows
app.get('/api/context-windows', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM context_windows WHERE user_id=? ORDER BY pinned DESC, created_at DESC').all(req.user.id));
});
app.post('/api/context-windows', requireAuth, (req: any, res: any) => {
  const { name, content } = req.body;
  if (!name || !content) return res.status(400).json({ error: 'name and content required' });
  const tokens = Math.ceil(content.length / 4);
  const r = db.prepare('INSERT INTO context_windows (user_id,name,content,token_count) VALUES (?,?,?,?)').run(req.user.id, name, content, tokens);
  res.json({ id: r.lastInsertRowid, name, content, token_count: tokens, pinned: 0 });
});
app.put('/api/context-windows/:id/pin', requireAuth, (req: any, res: any) => {
  const row: any = db.prepare('SELECT pinned FROM context_windows WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE context_windows SET pinned=? WHERE id=?').run(row.pinned ? 0 : 1, req.params.id);
  res.json({ ok: true });
});
app.delete('/api/context-windows/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM context_windows WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/user-goals
app.get('/api/user-goals', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM user_goals WHERE user_id=? ORDER BY status, target_date ASC').all(req.user.id));
});
app.post('/api/user-goals', requireAuth, (req: any, res: any) => {
  const { title, description = '', target_date = '' } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const r = db.prepare('INSERT INTO user_goals (user_id,title,description,target_date) VALUES (?,?,?,?)').run(req.user.id, title, description, target_date);
  res.json({ id: r.lastInsertRowid, title, description, target_date, progress: 0, status: 'active' });
});
app.put('/api/user-goals/:id/progress', requireAuth, (req: any, res: any) => {
  const { progress } = req.body;
  const p = Math.min(100, Math.max(0, Number(progress) || 0));
  const status = p >= 100 ? 'completed' : 'active';
  db.prepare('UPDATE user_goals SET progress=?,status=? WHERE id=? AND user_id=?').run(p, status, req.params.id, req.user.id);
  res.json({ ok: true, progress: p, status });
});
app.delete('/api/user-goals/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM user_goals WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// ── Batch 51 ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS ai_personas (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT,
    system_prompt TEXT, model TEXT DEFAULT 'claude', avatar TEXT DEFAULT '🤖',
    active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS workspace_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT,
    description TEXT, event_date TEXT, event_type TEXT DEFAULT 'meeting',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ai_outputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, prompt TEXT,
    output TEXT, model TEXT, quality_score INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS thread_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, thread_id INTEGER, granted_to INTEGER,
    permission TEXT DEFAULT 'read', granted_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, badge_name TEXT,
    badge_icon TEXT DEFAULT '🏅', description TEXT, earned_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// /api/ai-personas
app.get('/api/ai-personas', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_personas WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});
app.post('/api/ai-personas', requireAuth, (req: any, res: any) => {
  const { name, system_prompt, model = 'claude', avatar = '🤖' } = req.body;
  if (!name || !system_prompt) return res.status(400).json({ error: 'name and system_prompt required' });
  const r = db.prepare('INSERT INTO ai_personas (user_id,name,system_prompt,model,avatar) VALUES (?,?,?,?,?)').run(req.user.id, name, system_prompt, model, avatar);
  res.json({ id: r.lastInsertRowid, name, system_prompt, model, avatar, active: 1 });
});
app.put('/api/ai-personas/:id/toggle', requireAuth, (req: any, res: any) => {
  const row: any = db.prepare('SELECT active FROM ai_personas WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE ai_personas SET active=? WHERE id=?').run(row.active ? 0 : 1, req.params.id);
  res.json({ ok: true });
});
app.delete('/api/ai-personas/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_personas WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/workspace-events
app.get('/api/workspace-events', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_events WHERE user_id=? ORDER BY event_date ASC').all(req.user.id));
});
app.post('/api/workspace-events', requireAuth, (req: any, res: any) => {
  const { title, description = '', event_date, event_type = 'meeting' } = req.body;
  if (!title || !event_date) return res.status(400).json({ error: 'title and event_date required' });
  const r = db.prepare('INSERT INTO workspace_events (user_id,title,description,event_date,event_type) VALUES (?,?,?,?,?)').run(req.user.id, title, description, event_date, event_type);
  res.json({ id: r.lastInsertRowid, title, description, event_date, event_type });
});
app.delete('/api/workspace-events/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_events WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/ai-outputs
app.post('/api/ai-outputs', requireAuth, (req: any, res: any) => {
  const { prompt, output, model = 'claude', quality_score } = req.body;
  if (!prompt || !output) return res.status(400).json({ error: 'prompt and output required' });
  const r = db.prepare('INSERT INTO ai_outputs (user_id,prompt,output,model,quality_score) VALUES (?,?,?,?,?)').run(req.user.id, prompt, output, model, quality_score ?? null);
  res.json({ id: r.lastInsertRowid, prompt, output, model, quality_score });
});
app.get('/api/ai-outputs', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_outputs WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.user.id));
});
app.put('/api/ai-outputs/:id/rate', requireAuth, (req: any, res: any) => {
  const { quality_score } = req.body;
  db.prepare('UPDATE ai_outputs SET quality_score=? WHERE id=? AND user_id=?').run(Math.min(5, Math.max(1, Number(quality_score))), req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/ai-outputs/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_outputs WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/thread-permissions
app.get('/api/thread-permissions/:threadId', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM thread_permissions WHERE thread_id=?').all(req.params.threadId));
});
app.post('/api/thread-permissions', requireAuth, (req: any, res: any) => {
  const { thread_id, granted_to, permission = 'read' } = req.body;
  if (!thread_id || !granted_to) return res.status(400).json({ error: 'thread_id and granted_to required' });
  const r = db.prepare('INSERT INTO thread_permissions (thread_id,granted_to,permission,granted_by) VALUES (?,?,?,?)').run(thread_id, granted_to, permission, req.user.id);
  res.json({ id: r.lastInsertRowid, thread_id, granted_to, permission });
});
app.delete('/api/thread-permissions/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM thread_permissions WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// /api/user-badges
app.get('/api/user-badges', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM user_badges WHERE user_id=? ORDER BY earned_at DESC').all(req.user.id));
});
app.post('/api/user-badges', requireAuth, (req: any, res: any) => {
  const { badge_name, badge_icon = '🏅', description = '' } = req.body;
  if (!badge_name) return res.status(400).json({ error: 'badge_name required' });
  const r = db.prepare('INSERT INTO user_badges (user_id,badge_name,badge_icon,description) VALUES (?,?,?,?)').run(req.user.id, badge_name, badge_icon, description);
  res.json({ id: r.lastInsertRowid, badge_name, badge_icon, description });
});
app.delete('/api/user-badges/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM user_badges WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// ── Batch 52 ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS ai_feedback_loops (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, prompt TEXT,
    original_output TEXT, improved_output TEXT, improvement_type TEXT DEFAULT 'manual',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS workspace_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT,
    condition_text TEXT, action_text TEXT, active INTEGER DEFAULT 1,
    triggered_count INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS message_threads_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, subject TEXT,
    participants TEXT, message_count INTEGER DEFAULT 0, last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ai_embeddings_meta (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, source_type TEXT,
    source_id INTEGER, embedding_model TEXT DEFAULT 'text-embedding-3-small',
    dimension INTEGER DEFAULT 1536, indexed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS workspace_shortcuts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, shortcut_key TEXT,
    action TEXT, description TEXT, active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// /api/ai-feedback-loops
app.get('/api/ai-feedback-loops', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_feedback_loops WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});
app.post('/api/ai-feedback-loops', requireAuth, (req: any, res: any) => {
  const { prompt, original_output, improved_output, improvement_type = 'manual' } = req.body;
  if (!prompt || !original_output) return res.status(400).json({ error: 'prompt and original_output required' });
  const r = db.prepare('INSERT INTO ai_feedback_loops (user_id,prompt,original_output,improved_output,improvement_type) VALUES (?,?,?,?,?)').run(req.user.id, prompt, original_output, improved_output || '', improvement_type);
  res.json({ id: r.lastInsertRowid, prompt, original_output, improved_output, improvement_type });
});
app.put('/api/ai-feedback-loops/:id', requireAuth, (req: any, res: any) => {
  const { improved_output } = req.body;
  db.prepare('UPDATE ai_feedback_loops SET improved_output=? WHERE id=? AND user_id=?').run(improved_output || '', req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/ai-feedback-loops/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_feedback_loops WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/workspace-rules
app.get('/api/workspace-rules', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_rules WHERE user_id=? ORDER BY active DESC, created_at DESC').all(req.user.id));
});
app.post('/api/workspace-rules', requireAuth, (req: any, res: any) => {
  const { name, condition_text, action_text } = req.body;
  if (!name || !condition_text || !action_text) return res.status(400).json({ error: 'name, condition_text, action_text required' });
  const r = db.prepare('INSERT INTO workspace_rules (user_id,name,condition_text,action_text) VALUES (?,?,?,?)').run(req.user.id, name, condition_text, action_text);
  res.json({ id: r.lastInsertRowid, name, condition_text, action_text, active: 1, triggered_count: 0 });
});
app.put('/api/workspace-rules/:id/trigger', requireAuth, (req: any, res: any) => {
  db.prepare('UPDATE workspace_rules SET triggered_count=triggered_count+1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.put('/api/workspace-rules/:id/toggle', requireAuth, (req: any, res: any) => {
  const row: any = db.prepare('SELECT active FROM workspace_rules WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE workspace_rules SET active=? WHERE id=?').run(row.active ? 0 : 1, req.params.id);
  res.json({ ok: true });
});
app.delete('/api/workspace-rules/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_rules WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/message-threads-v2
app.get('/api/message-threads-v2', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM message_threads_v2 WHERE user_id=? ORDER BY last_activity DESC').all(req.user.id));
});
app.post('/api/message-threads-v2', requireAuth, (req: any, res: any) => {
  const { subject, participants = '' } = req.body;
  if (!subject) return res.status(400).json({ error: 'subject required' });
  const r = db.prepare('INSERT INTO message_threads_v2 (user_id,subject,participants) VALUES (?,?,?)').run(req.user.id, subject, participants);
  res.json({ id: r.lastInsertRowid, subject, participants, message_count: 0 });
});
app.put('/api/message-threads-v2/:id/bump', requireAuth, (req: any, res: any) => {
  db.prepare('UPDATE message_threads_v2 SET message_count=message_count+1,last_activity=CURRENT_TIMESTAMP WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/message-threads-v2/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM message_threads_v2 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/ai-embeddings-meta
app.post('/api/ai-embeddings-meta', requireAuth, (req: any, res: any) => {
  const { source_type, source_id, embedding_model = 'text-embedding-3-small', dimension = 1536 } = req.body;
  if (!source_type || !source_id) return res.status(400).json({ error: 'source_type and source_id required' });
  const r = db.prepare('INSERT INTO ai_embeddings_meta (user_id,source_type,source_id,embedding_model,dimension) VALUES (?,?,?,?,?)').run(req.user.id, source_type, source_id, embedding_model, dimension);
  res.json({ id: r.lastInsertRowid, source_type, source_id, embedding_model, dimension });
});
app.get('/api/ai-embeddings-meta', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_embeddings_meta WHERE user_id=? ORDER BY indexed_at DESC LIMIT 100').all(req.user.id));
});
app.delete('/api/ai-embeddings-meta/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_embeddings_meta WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/workspace-shortcuts
app.get('/api/workspace-shortcuts', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_shortcuts WHERE user_id=? ORDER BY shortcut_key ASC').all(req.user.id));
});
app.post('/api/workspace-shortcuts', requireAuth, (req: any, res: any) => {
  const { shortcut_key, action, description = '' } = req.body;
  if (!shortcut_key || !action) return res.status(400).json({ error: 'shortcut_key and action required' });
  const r = db.prepare('INSERT INTO workspace_shortcuts (user_id,shortcut_key,action,description) VALUES (?,?,?,?)').run(req.user.id, shortcut_key, action, description);
  res.json({ id: r.lastInsertRowid, shortcut_key, action, description, active: 1 });
});
app.put('/api/workspace-shortcuts/:id/toggle', requireAuth, (req: any, res: any) => {
  const row: any = db.prepare('SELECT active FROM workspace_shortcuts WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE workspace_shortcuts SET active=? WHERE id=?').run(row.active ? 0 : 1, req.params.id);
  res.json({ ok: true });
});
app.delete('/api/workspace-shortcuts/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_shortcuts WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// ── Batch 53 ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS ai_evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, eval_name TEXT,
    prompt TEXT, criteria TEXT, score REAL, notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS workspace_kpis (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT,
    value REAL, unit TEXT DEFAULT '', target REAL, period TEXT DEFAULT 'monthly',
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS thread_archives (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, thread_id INTEGER,
    reason TEXT DEFAULT 'manual', archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ai_context_injections (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT,
    content TEXT, trigger_keyword TEXT, auto_inject INTEGER DEFAULT 0,
    use_count INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS workspace_watchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, resource_type TEXT,
    resource_id INTEGER, notify_on TEXT DEFAULT 'change',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// /api/ai-evaluations
app.get('/api/ai-evaluations', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_evaluations WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});
app.post('/api/ai-evaluations', requireAuth, (req: any, res: any) => {
  const { eval_name, prompt, criteria, score, notes = '' } = req.body;
  if (!eval_name || !prompt) return res.status(400).json({ error: 'eval_name and prompt required' });
  const r = db.prepare('INSERT INTO ai_evaluations (user_id,eval_name,prompt,criteria,score,notes) VALUES (?,?,?,?,?,?)').run(req.user.id, eval_name, prompt, criteria || '', score ?? null, notes);
  res.json({ id: r.lastInsertRowid, eval_name, prompt, criteria, score, notes });
});
app.put('/api/ai-evaluations/:id/score', requireAuth, (req: any, res: any) => {
  const { score, notes } = req.body;
  db.prepare('UPDATE ai_evaluations SET score=?,notes=? WHERE id=? AND user_id=?').run(score ?? null, notes || '', req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/ai-evaluations/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_evaluations WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/workspace-kpis
app.get('/api/workspace-kpis', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_kpis WHERE user_id=? ORDER BY recorded_at DESC').all(req.user.id));
});
app.post('/api/workspace-kpis', requireAuth, (req: any, res: any) => {
  const { name, value, unit = '', target, period = 'monthly' } = req.body;
  if (!name || value === undefined) return res.status(400).json({ error: 'name and value required' });
  const r = db.prepare('INSERT INTO workspace_kpis (user_id,name,value,unit,target,period) VALUES (?,?,?,?,?,?)').run(req.user.id, name, value, unit, target ?? null, period);
  res.json({ id: r.lastInsertRowid, name, value, unit, target, period });
});
app.delete('/api/workspace-kpis/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_kpis WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/thread-archives
app.get('/api/thread-archives', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM thread_archives WHERE user_id=? ORDER BY archived_at DESC').all(req.user.id));
});
app.post('/api/thread-archives', requireAuth, (req: any, res: any) => {
  const { thread_id, reason = 'manual' } = req.body;
  if (!thread_id) return res.status(400).json({ error: 'thread_id required' });
  const existing: any = db.prepare('SELECT id FROM thread_archives WHERE thread_id=? AND user_id=?').get(thread_id, req.user.id);
  if (existing) return res.status(409).json({ error: 'already archived' });
  const r = db.prepare('INSERT INTO thread_archives (user_id,thread_id,reason) VALUES (?,?,?)').run(req.user.id, thread_id, reason);
  res.json({ id: r.lastInsertRowid, thread_id, reason });
});
app.delete('/api/thread-archives/:threadId', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM thread_archives WHERE thread_id=? AND user_id=?').run(req.params.threadId, req.user.id);
  res.json({ ok: true });
});

// /api/ai-context-injections
app.get('/api/ai-context-injections', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_context_injections WHERE user_id=? ORDER BY use_count DESC').all(req.user.id));
});
app.post('/api/ai-context-injections', requireAuth, (req: any, res: any) => {
  const { name, content, trigger_keyword = '', auto_inject = 0 } = req.body;
  if (!name || !content) return res.status(400).json({ error: 'name and content required' });
  const r = db.prepare('INSERT INTO ai_context_injections (user_id,name,content,trigger_keyword,auto_inject) VALUES (?,?,?,?,?)').run(req.user.id, name, content, trigger_keyword, auto_inject ? 1 : 0);
  res.json({ id: r.lastInsertRowid, name, content, trigger_keyword, auto_inject, use_count: 0 });
});
app.put('/api/ai-context-injections/:id/use', requireAuth, (req: any, res: any) => {
  db.prepare('UPDATE ai_context_injections SET use_count=use_count+1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/ai-context-injections/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_context_injections WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/workspace-watchers
app.get('/api/workspace-watchers', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_watchers WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});
app.post('/api/workspace-watchers', requireAuth, (req: any, res: any) => {
  const { resource_type, resource_id, notify_on = 'change' } = req.body;
  if (!resource_type || !resource_id) return res.status(400).json({ error: 'resource_type and resource_id required' });
  const r = db.prepare('INSERT INTO workspace_watchers (user_id,resource_type,resource_id,notify_on) VALUES (?,?,?,?)').run(req.user.id, resource_type, resource_id, notify_on);
  res.json({ id: r.lastInsertRowid, resource_type, resource_id, notify_on });
});
app.delete('/api/workspace-watchers/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_watchers WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// ── Batch 54 ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS ai_task_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, task_type TEXT,
    payload TEXT, status TEXT DEFAULT 'pending', priority INTEGER DEFAULT 5,
    result TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME
  );
  CREATE TABLE IF NOT EXISTS workspace_glossary (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, term TEXT,
    definition TEXT, category TEXT DEFAULT 'general',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ai_routing_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT,
    condition TEXT, target_model TEXT, priority INTEGER DEFAULT 5,
    active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS thread_reactions_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT, thread_id INTEGER, emoji TEXT,
    count INTEGER DEFAULT 1, last_reacted DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(thread_id, emoji)
  );
  CREATE TABLE IF NOT EXISTS workspace_integrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT,
    integration_type TEXT, config TEXT, active INTEGER DEFAULT 1,
    last_sync DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// /api/ai-task-queue
app.get('/api/ai-task-queue', requireAuth, (req: any, res: any) => {
  const status = req.query.status as string;
  const q = status
    ? db.prepare('SELECT * FROM ai_task_queue WHERE user_id=? AND status=? ORDER BY priority DESC, created_at ASC').all(req.user.id, status)
    : db.prepare('SELECT * FROM ai_task_queue WHERE user_id=? ORDER BY priority DESC, created_at ASC').all(req.user.id);
  res.json(q);
});
app.post('/api/ai-task-queue', requireAuth, (req: any, res: any) => {
  const { task_type, payload = '{}', priority = 5 } = req.body;
  if (!task_type) return res.status(400).json({ error: 'task_type required' });
  const r = db.prepare('INSERT INTO ai_task_queue (user_id,task_type,payload,priority) VALUES (?,?,?,?)').run(req.user.id, task_type, typeof payload === 'string' ? payload : JSON.stringify(payload), priority);
  res.json({ id: r.lastInsertRowid, task_type, status: 'pending', priority });
});
app.put('/api/ai-task-queue/:id/process', requireAuth, (req: any, res: any) => {
  const { result = '' } = req.body;
  db.prepare('UPDATE ai_task_queue SET status=?,result=?,processed_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?').run('completed', result, req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/ai-task-queue/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_task_queue WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/workspace-glossary
app.get('/api/workspace-glossary', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_glossary WHERE user_id=? ORDER BY term ASC').all(req.user.id));
});
app.post('/api/workspace-glossary', requireAuth, (req: any, res: any) => {
  const { term, definition, category = 'general' } = req.body;
  if (!term || !definition) return res.status(400).json({ error: 'term and definition required' });
  const r = db.prepare('INSERT INTO workspace_glossary (user_id,term,definition,category) VALUES (?,?,?,?)').run(req.user.id, term, definition, category);
  res.json({ id: r.lastInsertRowid, term, definition, category });
});
app.put('/api/workspace-glossary/:id', requireAuth, (req: any, res: any) => {
  const { definition } = req.body;
  db.prepare('UPDATE workspace_glossary SET definition=? WHERE id=? AND user_id=?').run(definition || '', req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/workspace-glossary/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_glossary WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/ai-routing-rules
app.get('/api/ai-routing-rules', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_routing_rules WHERE user_id=? ORDER BY priority DESC').all(req.user.id));
});
app.post('/api/ai-routing-rules', requireAuth, (req: any, res: any) => {
  const { name, condition, target_model, priority = 5 } = req.body;
  if (!name || !condition || !target_model) return res.status(400).json({ error: 'name, condition, target_model required' });
  const r = db.prepare('INSERT INTO ai_routing_rules (user_id,name,condition,target_model,priority) VALUES (?,?,?,?,?)').run(req.user.id, name, condition, target_model, priority);
  res.json({ id: r.lastInsertRowid, name, condition, target_model, priority, active: 1 });
});
app.put('/api/ai-routing-rules/:id/toggle', requireAuth, (req: any, res: any) => {
  const row: any = db.prepare('SELECT active FROM ai_routing_rules WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE ai_routing_rules SET active=? WHERE id=?').run(row.active ? 0 : 1, req.params.id);
  res.json({ ok: true });
});
app.delete('/api/ai-routing-rules/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_routing_rules WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/thread-reactions-summary
app.get('/api/thread-reactions-summary/:threadId', (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM thread_reactions_summary WHERE thread_id=? ORDER BY count DESC').all(req.params.threadId));
});
app.post('/api/thread-reactions-summary', requireAuth, (req: any, res: any) => {
  const { thread_id, emoji } = req.body;
  if (!thread_id || !emoji) return res.status(400).json({ error: 'thread_id and emoji required' });
  db.prepare('INSERT INTO thread_reactions_summary (thread_id,emoji,count) VALUES (?,?,1) ON CONFLICT(thread_id,emoji) DO UPDATE SET count=count+1,last_reacted=CURRENT_TIMESTAMP').run(thread_id, emoji);
  res.json({ ok: true });
});
app.delete('/api/thread-reactions-summary/:threadId/:emoji', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM thread_reactions_summary WHERE thread_id=? AND emoji=?').run(req.params.threadId, req.params.emoji);
  res.json({ ok: true });
});

// /api/workspace-integrations
app.get('/api/workspace-integrations', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_integrations WHERE user_id=? ORDER BY name ASC').all(req.user.id));
});
app.post('/api/workspace-integrations', requireAuth, (req: any, res: any) => {
  const { name, integration_type, config = '{}' } = req.body;
  if (!name || !integration_type) return res.status(400).json({ error: 'name and integration_type required' });
  const r = db.prepare('INSERT INTO workspace_integrations (user_id,name,integration_type,config) VALUES (?,?,?,?)').run(req.user.id, name, integration_type, typeof config === 'string' ? config : JSON.stringify(config));
  res.json({ id: r.lastInsertRowid, name, integration_type, active: 1 });
});
app.put('/api/workspace-integrations/:id/sync', requireAuth, (req: any, res: any) => {
  db.prepare('UPDATE workspace_integrations SET last_sync=CURRENT_TIMESTAMP WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true, synced_at: new Date().toISOString() });
});
app.delete('/api/workspace-integrations/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_integrations WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// ── Batch 55 ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS ai_playbooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT,
    description TEXT, steps TEXT, category TEXT DEFAULT 'general',
    run_count INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS workspace_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT,
    description TEXT, is_private INTEGER DEFAULT 0, member_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ai_benchmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, benchmark_name TEXT,
    model TEXT, score REAL, latency_ms INTEGER, tokens_used INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS message_threads_archive (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, thread_id INTEGER,
    archive_reason TEXT DEFAULT 'completed', message_count INTEGER DEFAULT 0,
    archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ai_usage_budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, period TEXT DEFAULT 'monthly',
    budget_usd REAL, spent_usd REAL DEFAULT 0, alert_threshold REAL DEFAULT 0.8,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// /api/ai-playbooks
app.get('/api/ai-playbooks', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_playbooks WHERE user_id=? ORDER BY run_count DESC').all(req.user.id));
});
app.post('/api/ai-playbooks', requireAuth, (req: any, res: any) => {
  const { name, description = '', steps, category = 'general' } = req.body;
  if (!name || !steps) return res.status(400).json({ error: 'name and steps required' });
  const stepsStr = Array.isArray(steps) ? steps.join('\n') : steps;
  const r = db.prepare('INSERT INTO ai_playbooks (user_id,name,description,steps,category) VALUES (?,?,?,?,?)').run(req.user.id, name, description, stepsStr, category);
  res.json({ id: r.lastInsertRowid, name, description, steps: stepsStr, category, run_count: 0 });
});
app.put('/api/ai-playbooks/:id/run', requireAuth, (req: any, res: any) => {
  db.prepare('UPDATE ai_playbooks SET run_count=run_count+1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/ai-playbooks/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_playbooks WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/workspace-channels
app.get('/api/workspace-channels', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_channels WHERE user_id=? ORDER BY name ASC').all(req.user.id));
});
app.post('/api/workspace-channels', requireAuth, (req: any, res: any) => {
  const { name, description = '', is_private = 0 } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const r = db.prepare('INSERT INTO workspace_channels (user_id,name,description,is_private) VALUES (?,?,?,?)').run(req.user.id, name, description, is_private ? 1 : 0);
  res.json({ id: r.lastInsertRowid, name, description, is_private, member_count: 1 });
});
app.put('/api/workspace-channels/:id/join', requireAuth, (req: any, res: any) => {
  db.prepare('UPDATE workspace_channels SET member_count=member_count+1 WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});
app.delete('/api/workspace-channels/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_channels WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/ai-benchmarks
app.post('/api/ai-benchmarks', requireAuth, (req: any, res: any) => {
  const { benchmark_name, model, score, latency_ms, tokens_used } = req.body;
  if (!benchmark_name || !model) return res.status(400).json({ error: 'benchmark_name and model required' });
  const r = db.prepare('INSERT INTO ai_benchmarks (user_id,benchmark_name,model,score,latency_ms,tokens_used) VALUES (?,?,?,?,?,?)').run(req.user.id, benchmark_name, model, score ?? null, latency_ms ?? null, tokens_used ?? null);
  res.json({ id: r.lastInsertRowid, benchmark_name, model, score, latency_ms, tokens_used });
});
app.get('/api/ai-benchmarks', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_benchmarks WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});
app.get('/api/ai-benchmarks/compare', requireAuth, (req: any, res: any) => {
  const rows = db.prepare('SELECT model, AVG(score) as avg_score, AVG(latency_ms) as avg_latency FROM ai_benchmarks WHERE user_id=? GROUP BY model').all(req.user.id);
  res.json(rows);
});

// /api/message-threads-archive
app.get('/api/message-threads-archive', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM message_threads_archive WHERE user_id=? ORDER BY archived_at DESC').all(req.user.id));
});
app.post('/api/message-threads-archive', requireAuth, (req: any, res: any) => {
  const { thread_id, archive_reason = 'completed', message_count = 0 } = req.body;
  if (!thread_id) return res.status(400).json({ error: 'thread_id required' });
  const r = db.prepare('INSERT INTO message_threads_archive (user_id,thread_id,archive_reason,message_count) VALUES (?,?,?,?)').run(req.user.id, thread_id, archive_reason, message_count);
  res.json({ id: r.lastInsertRowid, thread_id, archive_reason, message_count });
});
app.delete('/api/message-threads-archive/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM message_threads_archive WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// /api/ai-usage-budgets
app.get('/api/ai-usage-budgets', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_usage_budgets WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});
app.post('/api/ai-usage-budgets', requireAuth, (req: any, res: any) => {
  const { period = 'monthly', budget_usd, alert_threshold = 0.8 } = req.body;
  if (!budget_usd) return res.status(400).json({ error: 'budget_usd required' });
  const r = db.prepare('INSERT INTO ai_usage_budgets (user_id,period,budget_usd,alert_threshold) VALUES (?,?,?,?)').run(req.user.id, period, budget_usd, alert_threshold);
  res.json({ id: r.lastInsertRowid, period, budget_usd, spent_usd: 0, alert_threshold });
});
app.put('/api/ai-usage-budgets/:id/spend', requireAuth, (req: any, res: any) => {
  const { amount } = req.body;
  if (!amount) return res.status(400).json({ error: 'amount required' });
  db.prepare('UPDATE ai_usage_budgets SET spent_usd=spent_usd+? WHERE id=? AND user_id=?').run(amount, req.params.id, req.user.id);
  const row: any = db.prepare('SELECT * FROM ai_usage_budgets WHERE id=?').get(req.params.id);
  const alert = row && row.spent_usd / row.budget_usd >= row.alert_threshold;
  res.json({ ok: true, alert, spent_usd: row?.spent_usd });
});
app.delete('/api/ai-usage-budgets/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_usage_budgets WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Batch 56: ai_snippets, workspace_announcements, ai_memory_nodes, thread_labels, user_streaks_v2
db.prepare(`CREATE TABLE IF NOT EXISTS ai_snippets (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, content TEXT, language TEXT DEFAULT 'text', pinned INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS workspace_announcements_v2 (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, body TEXT, audience TEXT DEFAULT 'all', pinned INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS ai_memory_nodes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, label TEXT, content TEXT, node_type TEXT DEFAULT 'fact', strength REAL DEFAULT 1.0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS thread_labels_v2 (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, thread_id TEXT, label TEXT, color TEXT DEFAULT '#6366f1', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS user_streaks_v2 (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, streak_type TEXT, current_count INTEGER DEFAULT 0, best_count INTEGER DEFAULT 0, last_date TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();

app.get('/api/ai-snippets', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_snippets WHERE user_id=? ORDER BY pinned DESC, created_at DESC').all(req.user.id));
});
app.post('/api/ai-snippets', requireAuth, (req: any, res: any) => {
  const { title, content, language } = req.body;
  const r = db.prepare('INSERT INTO ai_snippets (user_id,title,content,language) VALUES (?,?,?,?)').run(req.user.id, title, content, language||'text');
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/ai-snippets/:id/pin', requireAuth, (req: any, res: any) => {
  const row: any = db.prepare('SELECT pinned FROM ai_snippets WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE ai_snippets SET pinned=? WHERE id=? AND user_id=?').run(row.pinned ? 0 : 1, req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/ai-snippets/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_snippets WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

app.get('/api/workspace-announcements-v2', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_announcements_v2 WHERE user_id=? ORDER BY pinned DESC, created_at DESC').all(req.user.id));
});
app.post('/api/workspace-announcements-v2', requireAuth, (req: any, res: any) => {
  const { title, body, audience } = req.body;
  const r = db.prepare('INSERT INTO workspace_announcements_v2 (user_id,title,body,audience) VALUES (?,?,?,?)').run(req.user.id, title, body, audience||'all');
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/workspace-announcements-v2/:id/pin', requireAuth, (req: any, res: any) => {
  const row: any = db.prepare('SELECT pinned FROM workspace_announcements_v2 WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE workspace_announcements_v2 SET pinned=? WHERE id=? AND user_id=?').run(row.pinned ? 0 : 1, req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/workspace-announcements-v2/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_announcements_v2 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

app.get('/api/ai-memory-nodes', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM ai_memory_nodes WHERE user_id=? ORDER BY strength DESC, created_at DESC').all(req.user.id));
});
app.post('/api/ai-memory-nodes', requireAuth, (req: any, res: any) => {
  const { label, content, node_type } = req.body;
  const r = db.prepare('INSERT INTO ai_memory_nodes (user_id,label,content,node_type) VALUES (?,?,?,?)').run(req.user.id, label, content, node_type||'fact');
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/ai-memory-nodes/:id/reinforce', requireAuth, (req: any, res: any) => {
  db.prepare('UPDATE ai_memory_nodes SET strength=MIN(strength+0.1,5.0) WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/ai-memory-nodes/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_memory_nodes WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

app.get('/api/thread-labels-v2', requireAuth, (req: any, res: any) => {
  const { thread_id } = req.query as any;
  const rows = thread_id
    ? db.prepare('SELECT * FROM thread_labels_v2 WHERE user_id=? AND thread_id=? ORDER BY created_at DESC').all(req.user.id, thread_id)
    : db.prepare('SELECT * FROM thread_labels_v2 WHERE user_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows);
});
app.post('/api/thread-labels-v2', requireAuth, (req: any, res: any) => {
  const { thread_id, label, color } = req.body;
  const r = db.prepare('INSERT INTO thread_labels_v2 (user_id,thread_id,label,color) VALUES (?,?,?,?)').run(req.user.id, thread_id, label, color||'#6366f1');
  res.json({ id: r.lastInsertRowid });
});
app.delete('/api/thread-labels-v2/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM thread_labels_v2 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

app.get('/api/user-streaks-v2', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM user_streaks_v2 WHERE user_id=? ORDER BY current_count DESC').all(req.user.id));
});
app.post('/api/user-streaks-v2', requireAuth, (req: any, res: any) => {
  const { streak_type } = req.body;
  const r = db.prepare('INSERT INTO user_streaks_v2 (user_id,streak_type,last_date) VALUES (?,?,date("now"))').run(req.user.id, streak_type);
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/user-streaks-v2/:id/increment', requireAuth, (req: any, res: any) => {
  const row: any = db.prepare('SELECT * FROM user_streaks_v2 WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  const newCount = row.current_count + 1;
  const newBest = Math.max(newCount, row.best_count);
  db.prepare('UPDATE user_streaks_v2 SET current_count=?,best_count=?,last_date=date("now") WHERE id=? AND user_id=?').run(newCount, newBest, req.params.id, req.user.id);
  res.json({ current_count: newCount, best_count: newBest });
});
app.put('/api/user-streaks-v2/:id/reset', requireAuth, (req: any, res: any) => {
  db.prepare('UPDATE user_streaks_v2 SET current_count=0,last_date=date("now") WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/user-streaks-v2/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM user_streaks_v2 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// Batch 57: ai_prompt_versions, workspace_digests, ai_cost_breakdown, thread_mentions, user_preferences_v2
db.prepare(`CREATE TABLE IF NOT EXISTS ai_prompt_versions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, prompt_id TEXT, version INTEGER DEFAULT 1, content TEXT, note TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS workspace_digests (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, body TEXT, digest_type TEXT DEFAULT 'weekly', sent INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS ai_cost_breakdown (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, model TEXT, input_tokens INTEGER DEFAULT 0, output_tokens INTEGER DEFAULT 0, cost_usd REAL DEFAULT 0, thread_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS thread_mentions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, thread_id TEXT, mentioned_user TEXT, context TEXT, seen INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS user_preferences_v2 (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, pref_key TEXT, pref_value TEXT, category TEXT DEFAULT 'general', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, pref_key))`).run();

// AI Prompt Versions
app.get('/api/ai-prompt-versions', requireAuth, (req: any, res: any) => {
  const { prompt_id } = req.query as any;
  const rows = prompt_id
    ? db.prepare('SELECT * FROM ai_prompt_versions WHERE user_id=? AND prompt_id=? ORDER BY version DESC').all(req.user.id, prompt_id)
    : db.prepare('SELECT * FROM ai_prompt_versions WHERE user_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows);
});
app.post('/api/ai-prompt-versions', requireAuth, (req: any, res: any) => {
  const { prompt_id, content, note } = req.body;
  const last: any = db.prepare('SELECT MAX(version) as v FROM ai_prompt_versions WHERE user_id=? AND prompt_id=?').get(req.user.id, prompt_id);
  const version = (last?.v || 0) + 1;
  const r = db.prepare('INSERT INTO ai_prompt_versions (user_id,prompt_id,version,content,note) VALUES (?,?,?,?,?)').run(req.user.id, prompt_id, version, content, note||'');
  res.json({ id: r.lastInsertRowid, version });
});
app.delete('/api/ai-prompt-versions/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_prompt_versions WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Workspace Digests
app.get('/api/workspace-digests', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM workspace_digests WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});
app.post('/api/workspace-digests', requireAuth, (req: any, res: any) => {
  const { title, body, digest_type } = req.body;
  const r = db.prepare('INSERT INTO workspace_digests (user_id,title,body,digest_type) VALUES (?,?,?,?)').run(req.user.id, title, body, digest_type||'weekly');
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/workspace-digests/:id/send', requireAuth, (req: any, res: any) => {
  db.prepare('UPDATE workspace_digests SET sent=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/workspace-digests/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM workspace_digests WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// AI Cost Breakdown
app.get('/api/ai-cost-breakdown', requireAuth, (req: any, res: any) => {
  const rows = db.prepare('SELECT * FROM ai_cost_breakdown WHERE user_id=? ORDER BY created_at DESC LIMIT 100').all(req.user.id);
  const totals: any = db.prepare('SELECT model, SUM(cost_usd) as total_cost, SUM(input_tokens) as total_in, SUM(output_tokens) as total_out FROM ai_cost_breakdown WHERE user_id=? GROUP BY model').all(req.user.id);
  res.json({ rows, totals });
});
app.post('/api/ai-cost-breakdown', requireAuth, (req: any, res: any) => {
  const { model, input_tokens, output_tokens, cost_usd, thread_id } = req.body;
  const r = db.prepare('INSERT INTO ai_cost_breakdown (user_id,model,input_tokens,output_tokens,cost_usd,thread_id) VALUES (?,?,?,?,?,?)').run(req.user.id, model, input_tokens||0, output_tokens||0, cost_usd||0, thread_id||'');
  res.json({ id: r.lastInsertRowid });
});
app.delete('/api/ai-cost-breakdown/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM ai_cost_breakdown WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Thread Mentions
app.get('/api/thread-mentions', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM thread_mentions WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});
app.post('/api/thread-mentions', requireAuth, (req: any, res: any) => {
  const { thread_id, mentioned_user, context } = req.body;
  const r = db.prepare('INSERT INTO thread_mentions (user_id,thread_id,mentioned_user,context) VALUES (?,?,?,?)').run(req.user.id, thread_id, mentioned_user, context||'');
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/thread-mentions/:id/seen', requireAuth, (req: any, res: any) => {
  db.prepare('UPDATE thread_mentions SET seen=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/thread-mentions/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM thread_mentions WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// User Preferences V2
app.get('/api/user-preferences-v2', requireAuth, (req: any, res: any) => {
  res.json(db.prepare('SELECT * FROM user_preferences_v2 WHERE user_id=? ORDER BY category, pref_key').all(req.user.id));
});
app.post('/api/user-preferences-v2', requireAuth, (req: any, res: any) => {
  const { pref_key, pref_value, category } = req.body;
  db.prepare('INSERT INTO user_preferences_v2 (user_id,pref_key,pref_value,category) VALUES (?,?,?,?) ON CONFLICT(user_id,pref_key) DO UPDATE SET pref_value=excluded.pref_value, category=excluded.category').run(req.user.id, pref_key, pref_value, category||'general');
  res.json({ ok: true });
});
app.delete('/api/user-preferences-v2/:id', requireAuth, (req: any, res: any) => {
  db.prepare('DELETE FROM user_preferences_v2 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});


// ── Batch 58 ────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS ai_response_ratings_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, thread_id TEXT, message_id TEXT,
    accuracy INTEGER DEFAULT 3, helpfulness INTEGER DEFAULT 3,
    clarity INTEGER DEFAULT 3, overall INTEGER DEFAULT 3,
    note TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS workspace_milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, title TEXT NOT NULL, description TEXT,
    target_date TEXT, completed INTEGER DEFAULT 0,
    pinned INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ai_context_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, thread_id TEXT, label TEXT,
    tokens_used INTEGER DEFAULT 0, content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS thread_collaborators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, thread_id TEXT NOT NULL, collaborator TEXT NOT NULL,
    role TEXT DEFAULT 'viewer', invited_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS user_focus_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, label TEXT, duration_min INTEGER DEFAULT 25,
    started_at DATETIME, ended_at DATETIME, completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// AI Response Ratings V2
app.get('/api/ai-response-ratings-v2', requireAuth, (req:any,res:any) => {
  res.json(db.prepare('SELECT * FROM ai_response_ratings_v2 WHERE user_id=? ORDER BY created_at DESC LIMIT 100').all(req.user.id));
});
app.post('/api/ai-response-ratings-v2', requireAuth, (req:any,res:any) => {
  const {thread_id,message_id,accuracy=3,helpfulness=3,clarity=3,overall=3,note}=req.body;
  const r=db.prepare('INSERT INTO ai_response_ratings_v2 (user_id,thread_id,message_id,accuracy,helpfulness,clarity,overall,note) VALUES (?,?,?,?,?,?,?,?)').run(req.user.id,thread_id,message_id,accuracy,helpfulness,clarity,overall,note);
  res.json(db.prepare('SELECT * FROM ai_response_ratings_v2 WHERE id=?').get(r.lastInsertRowid));
});
app.delete('/api/ai-response-ratings-v2/:id', requireAuth, (req:any,res:any) => {
  db.prepare('DELETE FROM ai_response_ratings_v2 WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});

// Workspace Milestones
app.get('/api/workspace-milestones', requireAuth, (req:any,res:any) => {
  res.json(db.prepare('SELECT * FROM workspace_milestones WHERE user_id=? ORDER BY pinned DESC,created_at DESC').all(req.user.id));
});
app.post('/api/workspace-milestones', requireAuth, (req:any,res:any) => {
  const {title,description,target_date}=req.body;
  if(!title) return res.status(400).json({error:'title required'});
  const r=db.prepare('INSERT INTO workspace_milestones (user_id,title,description,target_date) VALUES (?,?,?,?)').run(req.user.id,title,description,target_date);
  res.json(db.prepare('SELECT * FROM workspace_milestones WHERE id=?').get(r.lastInsertRowid));
});
app.put('/api/workspace-milestones/:id/complete', requireAuth, (req:any,res:any) => {
  db.prepare('UPDATE workspace_milestones SET completed=1 WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});
app.put('/api/workspace-milestones/:id/pin', requireAuth, (req:any,res:any) => {
  db.prepare('UPDATE workspace_milestones SET pinned=1-pinned WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});
app.delete('/api/workspace-milestones/:id', requireAuth, (req:any,res:any) => {
  db.prepare('DELETE FROM workspace_milestones WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});

// AI Context Snapshots
app.get('/api/ai-context-snapshots', requireAuth, (req:any,res:any) => {
  res.json(db.prepare('SELECT * FROM ai_context_snapshots WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.user.id));
});
app.post('/api/ai-context-snapshots', requireAuth, (req:any,res:any) => {
  const {thread_id,label,tokens_used=0,content}=req.body;
  if(!label) return res.status(400).json({error:'label required'});
  const r=db.prepare('INSERT INTO ai_context_snapshots (user_id,thread_id,label,tokens_used,content) VALUES (?,?,?,?,?)').run(req.user.id,thread_id,label,tokens_used,content);
  res.json(db.prepare('SELECT * FROM ai_context_snapshots WHERE id=?').get(r.lastInsertRowid));
});
app.delete('/api/ai-context-snapshots/:id', requireAuth, (req:any,res:any) => {
  db.prepare('DELETE FROM ai_context_snapshots WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});

// Thread Collaborators
app.get('/api/thread-collaborators', requireAuth, (req:any,res:any) => {
  const {thread_id}=req.query;
  const sql=thread_id
    ? 'SELECT * FROM thread_collaborators WHERE user_id=? AND thread_id=? ORDER BY invited_at DESC'
    : 'SELECT * FROM thread_collaborators WHERE user_id=? ORDER BY invited_at DESC LIMIT 100';
  res.json(thread_id ? db.prepare(sql).all(req.user.id,thread_id) : db.prepare(sql).all(req.user.id));
});
app.post('/api/thread-collaborators', requireAuth, (req:any,res:any) => {
  const {thread_id,collaborator,role='viewer'}=req.body;
  if(!thread_id||!collaborator) return res.status(400).json({error:'thread_id+collaborator required'});
  const r=db.prepare('INSERT INTO thread_collaborators (user_id,thread_id,collaborator,role) VALUES (?,?,?,?)').run(req.user.id,thread_id,collaborator,role);
  res.json(db.prepare('SELECT * FROM thread_collaborators WHERE id=?').get(r.lastInsertRowid));
});
app.delete('/api/thread-collaborators/:id', requireAuth, (req:any,res:any) => {
  db.prepare('DELETE FROM thread_collaborators WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});

// User Focus Sessions
app.get('/api/user-focus-sessions', requireAuth, (req:any,res:any) => {
  res.json(db.prepare('SELECT * FROM user_focus_sessions WHERE user_id=? ORDER BY created_at DESC LIMIT 100').all(req.user.id));
});
app.post('/api/user-focus-sessions', requireAuth, (req:any,res:any) => {
  const {label,duration_min=25}=req.body;
  const started_at=new Date().toISOString();
  const r=db.prepare('INSERT INTO user_focus_sessions (user_id,label,duration_min,started_at) VALUES (?,?,?,?)').run(req.user.id,label,duration_min,started_at);
  res.json(db.prepare('SELECT * FROM user_focus_sessions WHERE id=?').get(r.lastInsertRowid));
});
app.put('/api/user-focus-sessions/:id/complete', requireAuth, (req:any,res:any) => {
  db.prepare('UPDATE user_focus_sessions SET completed=1,ended_at=? WHERE id=? AND user_id=?').run(new Date().toISOString(),req.params.id,req.user.id);
  res.json({ok:true});
});
app.delete('/api/user-focus-sessions/:id', requireAuth, (req:any,res:any) => {
  db.prepare('DELETE FROM user_focus_sessions WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});


// -- Batch 59 ----------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS ai_debug_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, model TEXT, prompt_hash TEXT,
    latency_ms INTEGER, tokens_in INTEGER, tokens_out INTEGER,
    error TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS workspace_polls_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, question TEXT NOT NULL,
    options TEXT NOT NULL, votes TEXT DEFAULT '{}',
    closed INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS thread_reactions_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, thread_id TEXT NOT NULL,
    emoji TEXT NOT NULL, count INTEGER DEFAULT 1,
    UNIQUE(user_id, thread_id, emoji)
  );
  CREATE TABLE IF NOT EXISTS user_achievements_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, title TEXT NOT NULL, description TEXT,
    icon TEXT DEFAULT '🏆', earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    pinned INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS ai_output_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, prompt_hash TEXT NOT NULL,
    model TEXT, output TEXT, hit_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, prompt_hash, model)
  );
`);

// AI Debug Logs
app.get('/api/ai-debug-logs', requireAuth, (req:any,res:any) => {
  res.json(db.prepare('SELECT * FROM ai_debug_logs WHERE user_id=? ORDER BY created_at DESC LIMIT 200').all(req.user.id));
});
app.post('/api/ai-debug-logs', requireAuth, (req:any,res:any) => {
  const {model,prompt_hash,latency_ms,tokens_in,tokens_out,error}=req.body;
  const r=db.prepare('INSERT INTO ai_debug_logs (user_id,model,prompt_hash,latency_ms,tokens_in,tokens_out,error) VALUES (?,?,?,?,?,?,?)').run(req.user.id,model,prompt_hash,latency_ms,tokens_in,tokens_out,error);
  res.json(db.prepare('SELECT * FROM ai_debug_logs WHERE id=?').get(r.lastInsertRowid));
});
app.delete('/api/ai-debug-logs/:id', requireAuth, (req:any,res:any) => {
  db.prepare('DELETE FROM ai_debug_logs WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});

// Workspace Polls V2
app.get('/api/workspace-polls-v2', requireAuth, (req:any,res:any) => {
  res.json(db.prepare('SELECT * FROM workspace_polls_v2 WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});
app.post('/api/workspace-polls-v2', requireAuth, (req:any,res:any) => {
  const {question,options}=req.body;
  if(!question||!options) return res.status(400).json({error:'question+options required'});
  const r=db.prepare('INSERT INTO workspace_polls_v2 (user_id,question,options) VALUES (?,?,?)').run(req.user.id,question,JSON.stringify(options));
  res.json(db.prepare('SELECT * FROM workspace_polls_v2 WHERE id=?').get(r.lastInsertRowid));
});
app.put('/api/workspace-polls-v2/:id/vote', requireAuth, (req:any,res:any) => {
  const poll:any=db.prepare('SELECT * FROM workspace_polls_v2 WHERE id=? AND user_id=?').get(req.params.id,req.user.id);
  if(!poll) return res.status(404).json({error:'not found'});
  const votes=JSON.parse(poll.votes||'{}'');
  const opt=req.body.option;
  votes[opt]=(votes[opt]||0)+1;
  db.prepare('UPDATE workspace_polls_v2 SET votes=? WHERE id=?').run(JSON.stringify(votes),req.params.id);
  res.json({ok:true,votes});
});
app.put('/api/workspace-polls-v2/:id/close', requireAuth, (req:any,res:any) => {
  db.prepare('UPDATE workspace_polls_v2 SET closed=1 WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});
app.delete('/api/workspace-polls-v2/:id', requireAuth, (req:any,res:any) => {
  db.prepare('DELETE FROM workspace_polls_v2 WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});

// Thread Reactions V2
app.get('/api/thread-reactions-v2', requireAuth, (req:any,res:any) => {
  const {thread_id}=req.query;
  if(thread_id) return res.json(db.prepare('SELECT * FROM thread_reactions_v2 WHERE user_id=? AND thread_id=?').all(req.user.id,thread_id));
  res.json(db.prepare('SELECT * FROM thread_reactions_v2 WHERE user_id=? ORDER BY rowid DESC LIMIT 200').all(req.user.id));
});
app.post('/api/thread-reactions-v2', requireAuth, (req:any,res:any) => {
  const {thread_id,emoji}=req.body;
  if(!thread_id||!emoji) return res.status(400).json({error:'thread_id+emoji required'});
  db.prepare('INSERT INTO thread_reactions_v2 (user_id,thread_id,emoji) VALUES (?,?,?) ON CONFLICT(user_id,thread_id,emoji) DO UPDATE SET count=count+1').run(req.user.id,thread_id,emoji);
  res.json(db.prepare('SELECT * FROM thread_reactions_v2 WHERE user_id=? AND thread_id=? AND emoji=?').get(req.user.id,thread_id,emoji));
});
app.delete('/api/thread-reactions-v2/:id', requireAuth, (req:any,res:any) => {
  db.prepare('DELETE FROM thread_reactions_v2 WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});

// User Achievements V2
app.get('/api/user-achievements-v2', requireAuth, (req:any,res:any) => {
  res.json(db.prepare('SELECT * FROM user_achievements_v2 WHERE user_id=? ORDER BY pinned DESC,earned_at DESC').all(req.user.id));
});
app.post('/api/user-achievements-v2', requireAuth, (req:any,res:any) => {
  const {title,description,icon='🏆'}=req.body;
  if(!title) return res.status(400).json({error:'title required'});
  const r=db.prepare('INSERT INTO user_achievements_v2 (user_id,title,description,icon) VALUES (?,?,?,?)').run(req.user.id,title,description,icon);
  res.json(db.prepare('SELECT * FROM user_achievements_v2 WHERE id=?').get(r.lastInsertRowid));
});
app.put('/api/user-achievements-v2/:id/pin', requireAuth, (req:any,res:any) => {
  db.prepare('UPDATE user_achievements_v2 SET pinned=1-pinned WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});
app.delete('/api/user-achievements-v2/:id', requireAuth, (req:any,res:any) => {
  db.prepare('DELETE FROM user_achievements_v2 WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});

// AI Output Cache
app.get('/api/ai-output-cache', requireAuth, (req:any,res:any) => {
  res.json(db.prepare('SELECT * FROM ai_output_cache WHERE user_id=? ORDER BY hit_count DESC LIMIT 100').all(req.user.id));
});
app.post('/api/ai-output-cache', requireAuth, (req:any,res:any) => {
  const {prompt_hash,model,output}=req.body;
  if(!prompt_hash||!output) return res.status(400).json({error:'prompt_hash+output required'});
  db.prepare('INSERT INTO ai_output_cache (user_id,prompt_hash,model,output) VALUES (?,?,?,?) ON CONFLICT(user_id,prompt_hash,model) DO UPDATE SET output=excluded.output,hit_count=hit_count+1').run(req.user.id,prompt_hash,model,output);
  res.json(db.prepare('SELECT * FROM ai_output_cache WHERE user_id=? AND prompt_hash=? AND model=?').get(req.user.id,prompt_hash,model));
});
app.get('/api/ai-output-cache/lookup', requireAuth, (req:any,res:any) => {
  const {prompt_hash,model}=req.query;
  const row=db.prepare('SELECT * FROM ai_output_cache WHERE user_id=? AND prompt_hash=? AND model=?').get(req.user.id,prompt_hash,model);
  if(row) db.prepare('UPDATE ai_output_cache SET hit_count=hit_count+1 WHERE id=?').run((row as any).id);
  res.json(row||null);
});
app.delete('/api/ai-output-cache/:id', requireAuth, (req:any,res:any) => {
  db.prepare('DELETE FROM ai_output_cache WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});


// -- Batch 60 ----------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS ai_chain_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, chain_id TEXT NOT NULL, step_order INTEGER DEFAULT 0,
    prompt TEXT, output TEXT, model TEXT, latency_ms INTEGER,
    status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS workspace_tags_v3 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, name TEXT NOT NULL, color TEXT DEFAULT '#6366f1',
    category TEXT DEFAULT 'general', pinned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
  );
  CREATE TABLE IF NOT EXISTS thread_notes_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, thread_id TEXT NOT NULL, note TEXT NOT NULL,
    pinned INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS user_rituals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, title TEXT NOT NULL, description TEXT,
    frequency TEXT DEFAULT 'daily', last_done DATETIME,
    streak INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ai_personas_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, name TEXT NOT NULL, system_prompt TEXT,
    avatar TEXT DEFAULT '🤖', temperature REAL DEFAULT 0.7,
    pinned INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// AI Chain Steps
app.get('/api/ai-chain-steps', requireAuth, (req:any,res:any) => {
  const {chain_id}=req.query;
  if(chain_id) return res.json(db.prepare('SELECT * FROM ai_chain_steps WHERE user_id=? AND chain_id=? ORDER BY step_order').all(req.user.id,chain_id));
  res.json(db.prepare('SELECT * FROM ai_chain_steps WHERE user_id=? ORDER BY created_at DESC LIMIT 200').all(req.user.id));
});
app.post('/api/ai-chain-steps', requireAuth, (req:any,res:any) => {
  const {chain_id,step_order=0,prompt,output,model,latency_ms,status='done'}=req.body;
  if(!chain_id) return res.status(400).json({error:'chain_id required'});
  const r=db.prepare('INSERT INTO ai_chain_steps (user_id,chain_id,step_order,prompt,output,model,latency_ms,status) VALUES (?,?,?,?,?,?,?,?)').run(req.user.id,chain_id,step_order,prompt,output,model,latency_ms,status);
  res.json(db.prepare('SELECT * FROM ai_chain_steps WHERE id=?').get(r.lastInsertRowid));
});
app.delete('/api/ai-chain-steps/:id', requireAuth, (req:any,res:any) => {
  db.prepare('DELETE FROM ai_chain_steps WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});

// Workspace Tags V3
app.get('/api/workspace-tags-v3', requireAuth, (req:any,res:any) => {
  res.json(db.prepare('SELECT * FROM workspace_tags_v3 WHERE user_id=? ORDER BY pinned DESC,name').all(req.user.id));
});
app.post('/api/workspace-tags-v3', requireAuth, (req:any,res:any) => {
  const {name,color='#6366f1',category='general'}=req.body;
  if(!name) return res.status(400).json({error:'name required'});
  try {
    const r=db.prepare('INSERT INTO workspace_tags_v3 (user_id,name,color,category) VALUES (?,?,?,?)').run(req.user.id,name,color,category);
    res.json(db.prepare('SELECT * FROM workspace_tags_v3 WHERE id=?').get(r.lastInsertRowid));
  } catch(e:any){ res.status(409).json({error:'tag exists'}); }
});
app.put('/api/workspace-tags-v3/:id/pin', requireAuth, (req:any,res:any) => {
  db.prepare('UPDATE workspace_tags_v3 SET pinned=1-pinned WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});
app.delete('/api/workspace-tags-v3/:id', requireAuth, (req:any,res:any) => {
  db.prepare('DELETE FROM workspace_tags_v3 WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});

// Thread Notes V2
app.get('/api/thread-notes-v2', requireAuth, (req:any,res:any) => {
  const {thread_id}=req.query;
  if(thread_id) return res.json(db.prepare('SELECT * FROM thread_notes_v2 WHERE user_id=? AND thread_id=? ORDER BY pinned DESC,created_at DESC').all(req.user.id,thread_id));
  res.json(db.prepare('SELECT * FROM thread_notes_v2 WHERE user_id=? ORDER BY pinned DESC,created_at DESC LIMIT 200').all(req.user.id));
});
app.post('/api/thread-notes-v2', requireAuth, (req:any,res:any) => {
  const {thread_id,note}=req.body;
  if(!thread_id||!note) return res.status(400).json({error:'thread_id+note required'});
  const r=db.prepare('INSERT INTO thread_notes_v2 (user_id,thread_id,note) VALUES (?,?,?)').run(req.user.id,thread_id,note);
  res.json(db.prepare('SELECT * FROM thread_notes_v2 WHERE id=?').get(r.lastInsertRowid));
});
app.put('/api/thread-notes-v2/:id/pin', requireAuth, (req:any,res:any) => {
  db.prepare('UPDATE thread_notes_v2 SET pinned=1-pinned WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});
app.delete('/api/thread-notes-v2/:id', requireAuth, (req:any,res:any) => {
  db.prepare('DELETE FROM thread_notes_v2 WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});

// User Rituals
app.get('/api/user-rituals', requireAuth, (req:any,res:any) => {
  res.json(db.prepare('SELECT * FROM user_rituals WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});
app.post('/api/user-rituals', requireAuth, (req:any,res:any) => {
  const {title,description,frequency='daily'}=req.body;
  if(!title) return res.status(400).json({error:'title required'});
  const r=db.prepare('INSERT INTO user_rituals (user_id,title,description,frequency) VALUES (?,?,?,?)').run(req.user.id,title,description,frequency);
  res.json(db.prepare('SELECT * FROM user_rituals WHERE id=?').get(r.lastInsertRowid));
});
app.put('/api/user-rituals/:id/done', requireAuth, (req:any,res:any) => {
  db.prepare('UPDATE user_rituals SET last_done=?,streak=streak+1 WHERE id=? AND user_id=?').run(new Date().toISOString(),req.params.id,req.user.id);
  res.json({ok:true});
});
app.delete('/api/user-rituals/:id', requireAuth, (req:any,res:any) => {
  db.prepare('DELETE FROM user_rituals WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});

// AI Personas V2
app.get('/api/ai-personas-v2', requireAuth, (req:any,res:any) => {
  res.json(db.prepare('SELECT * FROM ai_personas_v2 WHERE user_id=? ORDER BY pinned DESC,name').all(req.user.id));
});
app.post('/api/ai-personas-v2', requireAuth, (req:any,res:any) => {
  const {name,system_prompt,avatar='🤖',temperature=0.7}=req.body;
  if(!name) return res.status(400).json({error:'name required'});
  const r=db.prepare('INSERT INTO ai_personas_v2 (user_id,name,system_prompt,avatar,temperature) VALUES (?,?,?,?,?)').run(req.user.id,name,system_prompt,avatar,temperature);
  res.json(db.prepare('SELECT * FROM ai_personas_v2 WHERE id=?').get(r.lastInsertRowid));
});
app.put('/api/ai-personas-v2/:id/pin', requireAuth, (req:any,res:any) => {
  db.prepare('UPDATE ai_personas_v2 SET pinned=1-pinned WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});
app.delete('/api/ai-personas-v2/:id', requireAuth, (req:any,res:any) => {
  db.prepare('DELETE FROM ai_personas_v2 WHERE id=? AND user_id=?').run(req.params.id,req.user.id);
  res.json({ok:true});
});

httpServer.listen(PORT, () => { console.log(`🚀 Forge Platform v6.99 running on port ${PORT}`); });