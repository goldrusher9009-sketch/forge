/**
 * Forge Platform v6.71 — Documentation Generation + All Features
 * SQLite + JWT + bcrypt. All Phase 1-7 features integrated.
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
import crypto from 'crypto';
import fs from 'fs';
import vm from 'vm';
import { execFile, exec } from 'child_process';
import { promisify } from 'util';
import Database from 'better-sqlite3';
import { setupBillingRoutes } from './billing';
import { setupMonetizationRoutes } from './monetization';
import { setupTokenomicsRoutes } from './tokenomics';
import { setupRouterRoutes } from './router';
import { setupMemoryRoutes } from './memory';
import { setupRealtime } from './realtime';
import { setupAlertWorker } from './alerts';
import { setupWebhookRetry, setupWebhookLogging } from './webhooks';
import { setupGenesisBuilder } from './genesis';
import { setupAgentHarness } from './harness';
import { setupGovernance } from './governance';
import { setupEnterprise } from './enterprise';
import { setupWhiteLabel } from './whitelabel';
import { setupMetering } from './metering';
import { setupPromptCache } from './prompt-cache';
import { setupBatchJobs } from './batch-jobs';
import { setupMultiModelInference } from './multi-model';
import { setupZKP } from './zkp';
import { setupCompliance } from './compliance';
import { setupDocGen } from './doc-gen';
import { setupPersonas } from './personas';
import { setupContextManager } from './context-manager';
import { setupReplySuggestions } from './reply-suggestions';
import { setupAdvancedAnalytics } from './advanced-analytics';
import { setupRetentionAnalytics } from './retention-analytics';
import { setupPerformance } from './performance';
import { setupRateLimiting } from './rate-limiting';
import http from 'http';

const execAsync = promisify(exec);

// ── Config ────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'forge-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '30d';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://forge-sand-two.vercel.app';
const DB_PATH_PRIMARY = process.env.DB_PATH || (process.env.RAILWAY_ENVIRONMENT ? '/data/forge.db' : path.join(process.cwd(), 'forge.db'));
const DB_PATH_FALLBACK = path.join(process.cwd(), 'forge.db');

// ── Database ──────────────────────────────────────────────────
let db: Database.Database;
let DB_PATH = DB_PATH_PRIMARY;
try {
  db = new Database(DB_PATH_PRIMARY);
  console.log(`✅ Database opened at ${DB_PATH_PRIMARY}`);
} catch (e: any) {
  console.warn(`⚠️  Could not open DB at ${DB_PATH_PRIMARY}. Falling back to ${DB_PATH_FALLBACK}`);
  DB_PATH = DB_PATH_FALLBACK;
  db = new Database(DB_PATH_FALLBACK);
  console.log(`✅ Database opened at ${DB_PATH_FALLBACK}`);
}
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Core schema
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
    model TEXT NOT NULL DEFAULT 'claude-3-sonnet', temperature REAL NOT NULL DEFAULT 0.7,
    max_tokens INTEGER NOT NULL DEFAULT 2048, status TEXT NOT NULL DEFAULT 'inactive',
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
  CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New thread', model TEXT NOT NULL,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY, thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    role TEXT NOT NULL, content TEXT NOT NULL, tokens INTEGER NOT NULL DEFAULT 0,
    model TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, key_encrypted TEXT NOT NULL, key_preview TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, provider)
  );
  CREATE TABLE IF NOT EXISTS platform_api_keys (
    id TEXT PRIMARY KEY, provider TEXT UNIQUE NOT NULL, key_encrypted TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS usage_logs (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, model TEXT NOT NULL, provider TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL, completion_tokens INTEGER NOT NULL, total_tokens INTEGER NOT NULL,
    provider_cost REAL NOT NULL DEFAULT 0, forge_revenue REAL NOT NULL DEFAULT 0,
    markup_multiplier REAL NOT NULL DEFAULT 1.3, created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY, user_id TEXT UNIQUE NOT NULL, plan TEXT NOT NULL DEFAULT 'free',
    stripe_customer_id TEXT, stripe_subscription_id TEXT, tokens_used INTEGER NOT NULL DEFAULT 0,
    tokens_limit INTEGER NOT NULL DEFAULT 1000000, period_start TEXT NOT NULL DEFAULT (datetime('now')),
    period_end TEXT NOT NULL DEFAULT (datetime('now')), status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS user_files (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_id TEXT REFERENCES threads(id) ON DELETE SET NULL,
    filename TEXT NOT NULL, content TEXT NOT NULL, mime_type TEXT NOT NULL DEFAULT 'text/plain',
    size INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS webhook_triggers (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, event_type TEXT NOT NULL DEFAULT 'generic', prompt TEXT NOT NULL,
    secret TEXT NOT NULL UNIQUE, enabled INTEGER NOT NULL DEFAULT 1,
    last_triggered TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, description TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS org_members (
    id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member', created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(org_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL, resource_id TEXT NOT NULL,
    role TEXT NOT NULL, granted_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, resource_type, resource_id)
  );
  CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS metrics (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL, value REAL NOT NULL, recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL, description TEXT, status TEXT NOT NULL DEFAULT 'active',
    progress INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS goal_tasks (
    id TEXT PRIMARY KEY, goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', result TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ── App ───────────────────────────────────────────────────────
const app = express();
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'https://forge-sand-two.vercel.app'];
    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Health & SSE ──────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', environment: NODE_ENV, timestamp: new Date().toISOString(), version: 'v6.71' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── JWT ───────────────────────────────────────────────────────
interface TokenPayload { sub: string; email: string; role: string; }
function signAccess(payload: TokenPayload): string { return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }); }
function signRefresh(payload: TokenPayload): string { return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN }); }
function verifyToken(token: string): TokenPayload { return jwt.verify(token, JWT_SECRET) as TokenPayload; }

interface AuthRequest extends Request { user?: TokenPayload; }
const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : req.cookies?.accessToken;
  if (!token) { res.status(401).json({ success: false, error: 'UNAUTHORIZED' }); return; }
  try { req.user = verifyToken(token); next(); } catch { res.status(401).json({ success: false, error: 'INVALID_TOKEN' }); }
};

// ── Crypto ────────────────────────────────────────────────────
const encryptionKey = crypto.createHash('sha256').update(JWT_SECRET).digest();
function encryptKey(key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  let enc = cipher.update(key, 'utf8', 'hex');
  enc += cipher.final('hex');
  return iv.toString('hex') + ':' + enc;
}
function decryptKey(encrypted: string): string | null {
  try {
    const [ivHex, encData] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
    let dec = decipher.update(encData, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  } catch { return null; }
}

// ── Provider keys ─────────────────────────────────────────────
const PROVIDER_ENV_KEYS: Record<string, string> = {
  anthropic: process.env.ANTHROPIC_API_KEY || '',
  openai: process.env.OPENAI_API_KEY || '',
  gemini: process.env.GEMINI_API_KEY || '',
  groq: process.env.GROQ_API_KEY || '',
  mistral: process.env.MISTRAL_API_KEY || '',
  openrouter: process.env.OPENROUTER_API_KEY || '',
};

function getUserKey(userId: string, provider: string): string | null {
  const row = db.prepare('SELECT key_encrypted FROM api_keys WHERE user_id=? AND provider=?').get(userId, provider) as any;
  if (row) { const key = decryptKey(row.key_encrypted); if (key) return key; }
  const platformRow = db.prepare('SELECT key_encrypted FROM platform_api_keys WHERE provider=? AND enabled=1').get(provider) as any;
  if (platformRow) { const key = decryptKey(platformRow.key_encrypted); if (key) return key; }
  return PROVIDER_ENV_KEYS[provider] || null;
}

function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: controller.signal })
    .then(r => { clearTimeout(timer); return r; })
    .catch(e => { clearTimeout(timer); throw e; });
}

async function callLLM(provider: string, apiKey: string, model: string, messages: any[]): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  if (provider === 'anthropic') {
    const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model, messages, max_tokens: 4096 })
    }, 20000);
    if (!res.ok) throw new Error(`Anthropic error: ${await res.text()}`);
    const d: any = await res.json();
    return { content: d.content?.[0]?.text || '', promptTokens: d.usage?.input_tokens || 0, completionTokens: d.usage?.output_tokens || 0 };
  }
  if (provider === 'openai') {
    const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, max_tokens: 4096 })
    }, 20000);
    if (!res.ok) throw new Error(`OpenAI error: ${await res.text()}`);
    const d: any = await res.json();
    return { content: d.choices?.[0]?.message?.content || '', promptTokens: d.usage?.prompt_tokens || 0, completionTokens: d.usage?.completion_tokens || 0 };
  }
  return { content: 'Provider not yet implemented', promptTokens: 0, completionTokens: 0 };
}

// ── Auth Routes ───────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName = '', lastName = '' } = req.body;
  if (!email || !password) { res.status(400).json({ success: false, error: 'INVALID_INPUT' }); return; }
  if (db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase())) { res.status(409).json({ success: false, error: 'DUPLICATE_EMAIL' }); return; }
  const id = uuidv4();
  db.prepare('INSERT INTO users (id,email,password,first_name,last_name,role,verified) VALUES (?,?,?,?,?,?,?)')
    .run(id, email.toLowerCase(), bcrypt.hashSync(password, 10), firstName, lastName, 'user', 1);
  res.status(201).json({ success: true, data: { id, email: email.toLowerCase(), firstName, lastName } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ success: false, error: 'INVALID_INPUT' }); return; }
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email.toLowerCase()) as any;
  if (!user || !bcrypt.compareSync(password, user.password)) { res.status(401).json({ success: false, error: 'INVALID_CREDENTIALS' }); return; }
  const payload: TokenPayload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);
  db.prepare('INSERT INTO refresh_tokens (id,user_id,token,expires_at) VALUES (?,?,?,?)')
    .run(uuidv4(), user.id, refreshToken, new Date(Date.now() + 7 * 86400000).toISOString());
  res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 86400000 });
  res.json({ success: true, data: { accessToken, user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name } } });
});

// ── Phase 1: Billing ──────────────────────────────────────────
setupBillingRoutes(app, db, requireAuth);

// ── Phase 2: Monetization ─────────────────────────────────────
setupMonetizationRoutes(app, db, requireAuth);

// ── Phase 3: Tokenomics ───────────────────────────────────────
setupTokenomicsRoutes(app, db, requireAuth);

// ── Phase 4: Router ───────────────────────────────────────────
setupRouterRoutes(app, db, requireAuth);

// ── Phase 4: Memory ───────────────────────────────────────────
setupMemoryRoutes(app, db, requireAuth);

// ── Phase 5: Real-time ────────────────────────────────────────
const server = http.createServer(app);
setupRealtime(server, db, requireAuth);

// ── Phase 5: Alerts ───────────────────────────────────────────
setupAlertWorker(db);

// ── Phase 5: Webhooks ─────────────────────────────────────────
setupWebhookRetry(db);
setupWebhookLogging(app, db, requireAuth);

// ── Phase 6: Genesis ──────────────────────────────────────────
setupGenesisBuilder(app, db, requireAuth);

// ── Phase 6: Harness ──────────────────────────────────────────
setupAgentHarness(app, db, requireAuth);

// ── Phase 6: Governance ───────────────────────────────────────
setupGovernance(app, db, requireAuth);

// ── Phase 6: Enterprise ───────────────────────────────────────
setupEnterprise(app, db, requireAuth);

// ── Phase 6: White-label ──────────────────────────────────────
setupWhiteLabel(app, db, requireAuth);

// ── Phase 6: Metering ─────────────────────────────────────────
setupMetering(app, db, requireAuth);

// ── Phase 6: Prompt Cache ─────────────────────────────────────
setupPromptCache(app, db, requireAuth);

// ── Phase 6: Batch Jobs ───────────────────────────────────────
setupBatchJobs(app, db, requireAuth);

// ── Phase 6: Multi-Model ──────────────────────────────────────
setupMultiModelInference(app, db, requireAuth);

// ── Phase 7: Zero-Knowledge Proofs ───────────────────────────
setupZKP(app, db, requireAuth);

// ── Phase 7: Compliance ───────────────────────────────────────
setupCompliance(app, db, requireAuth);

// ── Phase 7: Documentation Generation ────────────────────────
setupDocGen(app, db, requireAuth);

// ── Phase 8: Chat Personas ────────────────────────────────────
setupPersonas(app, db, requireAuth);

// ── Phase 8: Context Management ───────────────────────────────
setupContextManager(app, db, requireAuth);

// ── Phase 8: Reply Suggestions ────────────────────────────────
setupReplySuggestions(app, db, requireAuth);

// ── Phase 9: Advanced Analytics ───────────────────────────────
setupAdvancedAnalytics(app, db, requireAuth);

// ── Phase 9: Retention Analytics ──────────────────────────────
setupRetentionAnalytics(app, db, requireAuth);

// ── Phase 10: Performance & Caching ────────────────────────────
setupPerformance(app, db, requireAuth);

// ── Phase 10: Rate Limiting ────────────────────────────────────
setupRateLimiting(app, db);

// ── Start Server ──────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🚀 Forge Platform v6.71 running on port ${PORT}`);
  console.log(`📊 Database: ${DB_PATH}`);
  console.log(`🔗 Frontend: ${FRONTEND_URL}\n`);
});

process.on('SIGINT', () => {
  console.log('\n⛔ Shutting down...');
  server.close(() => process.exit(0));
});
