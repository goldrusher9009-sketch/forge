import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

interface AuthRequest {
  user?: { sub: string };
}

export const setupPerformance = (app: Express, db: Database, requireAuth: any) => {
  // Query cache table
  db.exec(`CREATE TABLE IF NOT EXISTS query_cache (
    id TEXT PRIMARY KEY,
    query_hash TEXT UNIQUE NOT NULL,
    result TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    hit_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Create indices for common queries
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_threads_user ON threads(user_id);
      CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
      CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
    `);
  } catch (e) {
    // Indices may already exist
  }

  // Cache helper
  const hashQuery = (query: string): string => {
    return crypto.createHash('sha256').update(query).digest('hex');
  };

  // Get from cache
  const getFromCache = (query: string): any | null => {
    const hash = hashQuery(query);
    const cached = db.prepare(
      'SELECT result, expires_at FROM query_cache WHERE query_hash = ? AND expires_at > datetime("now")'
    ).get(hash) as any;

    if (cached) {
      db.prepare('UPDATE query_cache SET hit_count = hit_count + 1 WHERE query_hash = ?').run(hash);
      return JSON.parse(cached.result);
    }
    return null;
  };

  // Set cache
  const setCache = (query: string, result: any, ttlSeconds: number = 300): void => {
    const hash = hashQuery(query);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    try {
      db.prepare(
        'INSERT OR REPLACE INTO query_cache (id, query_hash, result, expires_at) VALUES (?, ?, ?, ?)'
      ).run(uuidv4(), hash, JSON.stringify(result), expiresAt);
    } catch (e) {
      // Cache insertion failed, continue without caching
    }
  };

  // Performance stats endpoint
  app.get('/api/performance/stats', requireAuth, (req: AuthRequest, res) => {
    const cacheStats = db.prepare(
      'SELECT COUNT(*) as total_cached, SUM(hit_count) as total_hits FROM query_cache'
    ).get() as any;

    const dbSize = db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get() as any;

    res.json({
      success: true,
      data: {
        cache: {
          total_entries: cacheStats.total_cached || 0,
          total_hits: cacheStats.total_hits || 0,
          hit_rate: cacheStats.total_cached ? (cacheStats.total_hits / cacheStats.total_cached).toFixed(2) : 0
        },
        database: {
          size_bytes: dbSize?.size || 0,
          size_mb: dbSize ? (dbSize.size / 1024 / 1024).toFixed(2) : 0
        }
      }
    });
  });

  // Clear cache
  app.post('/api/performance/cache/clear', requireAuth, (req: AuthRequest, res) => {
    db.prepare('DELETE FROM query_cache WHERE expires_at <= datetime("now")').run();
    res.json({ success: true, message: 'Expired cache cleared' });
  });

  // Get cache health
  app.get('/api/performance/cache/health', requireAuth, (req: AuthRequest, res) => {
    const health = {
      status: 'healthy',
      expired_entries: db.prepare('SELECT COUNT(*) as count FROM query_cache WHERE expires_at <= datetime("now")').get() as any,
      active_entries: db.prepare('SELECT COUNT(*) as count FROM query_cache WHERE expires_at > datetime("now")').get() as any
    };

    res.json({ success: true, data: health });
  });

  // Export cache utilities
  return { getFromCache, setCache };
};
