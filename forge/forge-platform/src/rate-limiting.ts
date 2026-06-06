import { Database } from 'better-sqlite3';
import { Express, Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: { sub: string };
}

const TIER_LIMITS: Record<string, number> = {
  free: 100,
  starter: 1000,
  pro: 5000,
  enterprise: 50000
};

const RATE_WINDOW_MS = 60000; // 1 minute

export const setupRateLimiting = (app: Express, db: Database) => {
  // Rate limit tracking table
  db.exec(`CREATE TABLE IF NOT EXISTS rate_limit_tracker (
    user_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 0,
    window_start TEXT NOT NULL,
    PRIMARY KEY (user_id, endpoint)
  )`);

  // Rate limiting middleware
  app.use((req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.sub;
    const endpoint = req.path;
    const now = new Date();

    // Get user subscription plan
    const subscription = db.prepare('SELECT plan FROM subscriptions WHERE user_id = ?').get(userId) as any;
    const plan = subscription?.plan || 'free';
    const limit = TIER_LIMITS[plan] || TIER_LIMITS.free;

    // Check/update rate limit
    const tracker = db.prepare(
      'SELECT * FROM rate_limit_tracker WHERE user_id = ? AND endpoint = ?'
    ).get(userId, endpoint) as any;

    let requestCount = 0;
    if (tracker) {
      const windowStart = new Date(tracker.window_start).getTime();
      if (now.getTime() - windowStart < RATE_WINDOW_MS) {
        requestCount = tracker.request_count + 1;
      } else {
        requestCount = 1;
      }
    } else {
      requestCount = 1;
    }

    // Update tracker
    db.prepare(
      'INSERT OR REPLACE INTO rate_limit_tracker (user_id, endpoint, request_count, window_start) VALUES (?, ?, ?, ?)'
    ).run(userId, endpoint, requestCount, now.toISOString());

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - requestCount));
    res.setHeader('X-RateLimit-Reset', Math.floor(new Date(now.getTime() + RATE_WINDOW_MS).getTime() / 1000));

    // Check if limit exceeded
    if (requestCount > limit) {
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit of ${limit} requests/minute exceeded for plan: ${plan}`,
        retry_after: RATE_WINDOW_MS / 1000
      });
    }

    next();
  });

  // Rate limit status endpoint
  app.get('/api/rate-limit/status', (req: AuthRequest, res) => {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const subscription = db.prepare('SELECT plan FROM subscriptions WHERE user_id = ?').get(req.user.sub) as any;
    const plan = subscription?.plan || 'free';
    const limit = TIER_LIMITS[plan];

    res.json({
      success: true,
      data: {
        plan,
        requests_per_minute: limit,
        current_window_requests: db.prepare(
          'SELECT SUM(request_count) as total FROM rate_limit_tracker WHERE user_id = ?'
        ).get(req.user.sub) as any
      }
    });
  });
};
