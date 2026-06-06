import { Database } from 'better-sqlite3';
import { Express } from 'express';
import crypto from 'crypto';

interface AuthRequest {
  user?: { sub: string };
}

export const setupPromptCache = (app: Express, db: Database, requireAuth: any) => {
  // Prompt cache table
  db.exec(`CREATE TABLE IF NOT EXISTS prompt_cache (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    prompt_hash TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    model TEXT NOT NULL,
    cached_response TEXT,
    hit_count INTEGER DEFAULT 0,
    cache_tokens INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(prompt_hash, model)
  )`);

  // Cache hit tracking
  db.exec(`CREATE TABLE IF NOT EXISTS cache_stats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    total_requests INTEGER DEFAULT 0,
    cache_hits INTEGER DEFAULT 0,
    tokens_saved INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Hash prompt for caching
  const hashPrompt = (prompt: string): string => {
    return crypto.createHash('sha256').update(prompt).digest('hex');
  };

  // Check cache
  app.post('/api/cache/check', requireAuth, (req: AuthRequest, res) => {
    const { prompt, model } = req.body;
    if (!prompt || !model) {
      res.status(400).json({ error: 'prompt and model required' });
      return;
    }

    const hash = hashPrompt(prompt);
    const cached = db.prepare(
      'SELECT cached_response, cache_tokens, hit_count FROM prompt_cache WHERE prompt_hash = ? AND model = ? AND user_id = ?'
    ).get(hash, model, req.user!.sub) as any;

    if (cached) {
      // Update hit count
      db.prepare('UPDATE prompt_cache SET hit_count = hit_count + 1 WHERE prompt_hash = ?').run(hash);
      
      res.json({
        success: true,
        cached: true,
        data: {
          response: cached.cached_response,
          tokens_saved: cached.cache_tokens,
          hit_count: cached.hit_count + 1
        }
      });
    } else {
      res.json({ success: true, cached: false });
    }
  });

  // Store in cache
  app.post('/api/cache/store', requireAuth, (req: AuthRequest, res) => {
    const { prompt, model, response, cache_tokens } = req.body;
    if (!prompt || !model || !response) {
      res.status(400).json({ error: 'prompt, model, and response required' });
      return;
    }

    const hash = hashPrompt(prompt);
    db.prepare(
      'INSERT OR IGNORE INTO prompt_cache (id, user_id, prompt_hash, prompt_text, model, cached_response, cache_tokens) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(crypto.randomUUID(), req.user!.sub, hash, prompt, model, response, cache_tokens || 0);

    res.json({ success: true });
  });

  // Get cache stats
  app.get('/api/cache/stats', requireAuth, (req: AuthRequest, res) => {
    const stats = db.prepare(
      'SELECT total_requests, cache_hits, tokens_saved FROM cache_stats WHERE user_id = ?'
    ).get(req.user!.sub) as any;

    const totalCached = db.prepare(
      'SELECT COUNT(*) as count, SUM(cache_tokens) as total_tokens FROM prompt_cache WHERE user_id = ?'
    ).get(req.user!.sub) as any;

    res.json({
      success: true,
      data: {
        total_requests: stats?.total_requests || 0,
        cache_hits: stats?.cache_hits || 0,
        tokens_saved: stats?.tokens_saved || 0,
        cached_prompts: totalCached.count || 0,
        total_cached_tokens: totalCached.total_tokens || 0
      }
    });
  });
};
