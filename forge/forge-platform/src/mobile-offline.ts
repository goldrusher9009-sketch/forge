import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupMobileOffline = (app: Express, db: Database, requireAuth: any) => {
  // Offline sync queue
  db.exec(`CREATE TABLE IF NOT EXISTS offline_sync_queue (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    payload TEXT NOT NULL,
    synced INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Offline cache
  db.exec(`CREATE TABLE IF NOT EXISTS offline_cache (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    data TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Queue offline action
  app.post('/api/mobile/offline/queue', requireAuth, (req: AuthRequest, res) => {
    const { action, resource_type, resource_id, payload } = req.body;

    const queueId = uuidv4();
    db.prepare(`
      INSERT INTO offline_sync_queue
      (id, user_id, action, resource_type, resource_id, payload)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(queueId, req.user!.sub, action, resource_type, resource_id || null, JSON.stringify(payload));

    res.status(201).json({
      success: true,
      data: { queue_id: queueId, status: 'queued' }
    });
  });

  // Sync offline queue
  app.post('/api/mobile/offline/sync', requireAuth, (req: AuthRequest, res) => {
    const queue = db.prepare(
      'SELECT * FROM offline_sync_queue WHERE user_id = ? AND synced = 0 ORDER BY created_at ASC'
    ).all(req.user!.sub) as any[];

    const results = queue.map(item => {
      db.prepare('UPDATE offline_sync_queue SET synced = 1 WHERE id = ?').run(item.id);
      return {
        queue_id: item.id,
        status: 'synced',
        action: item.action,
        resource_type: item.resource_type
      };
    });

    res.json({
      success: true,
      data: {
        synced_count: results.length,
        items: results
      }
    });
  });

  // Get pending offline actions
  app.get('/api/mobile/offline/pending', requireAuth, (req: AuthRequest, res) => {
    const pending = db.prepare(
      'SELECT id, action, resource_type, created_at FROM offline_sync_queue WHERE user_id = ? AND synced = 0'
    ).all(req.user!.sub) as any[];

    res.json({
      success: true,
      data: {
        pending_count: pending.length,
        items: pending
      }
    });
  });

  // Cache for offline
  app.post('/api/mobile/cache/:resourceType', requireAuth, (req: AuthRequest, res) => {
    const { data, ttl_hours = 24 } = req.body;

    const cacheId = uuidv4();
    const expiresAt = new Date(Date.now() + ttl_hours * 3600000).toISOString();

    db.prepare(`
      INSERT OR REPLACE INTO offline_cache
      (id, user_id, resource_type, data, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(cacheId, req.user!.sub, req.params.resourceType, JSON.stringify(data), expiresAt);

    res.json({
      success: true,
      data: {
        cache_id: cacheId,
        resource_type: req.params.resourceType,
        ttl_hours
      }
    });
  });

  // Get offline cache
  app.get('/api/mobile/cache/:resourceType', requireAuth, (req: AuthRequest, res) => {
    const cached = db.prepare(`
      SELECT data FROM offline_cache
      WHERE user_id = ? AND resource_type = ? AND expires_at > datetime('now')
      ORDER BY created_at DESC LIMIT 1
    `).get(req.user!.sub, req.params.resourceType) as any;

    if (!cached) {
      res.status(404).json({ error: 'CACHE_EXPIRED_OR_NOT_FOUND' });
      return;
    }

    res.json({
      success: true,
      data: JSON.parse(cached.data)
    });
  });

  // Mobile metrics
  app.get('/api/mobile/metrics', requireAuth, (req: AuthRequest, res) => {
    const pendingSync = db.prepare(
      'SELECT COUNT(*) as count FROM offline_sync_queue WHERE user_id = ? AND synced = 0'
    ).get(req.user!.sub) as any;

    const cacheSize = db.prepare(
      'SELECT SUM(length(data)) as bytes FROM offline_cache WHERE user_id = ? AND expires_at > datetime("now")'
    ).get(req.user!.sub) as any;

    res.json({
      success: true,
      data: {
        pending_sync_items: pendingSync.count,
        offline_cache_size_kb: cacheSize.bytes ? Math.round(cacheSize.bytes / 1024) : 0,
        ready_for_offline: true
      }
    });
  });
};
