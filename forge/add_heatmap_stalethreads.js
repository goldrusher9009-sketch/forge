const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'forge-platform', 'src', 'index.ts');
let src = fs.readFileSync(filePath, 'utf8');

if (src.includes('GET /api/analytics/heatmap')) { console.log('Already patched'); process.exit(0); }

const anchor = '// GET /api/brain/category/:cat';

const patch = `
// ── Workspace Usage Heatmap ────────────────────────────────────────────────────
// GET /api/analytics/heatmap — messages by hour-of-day (0-23) × day-of-week (0=Sun..6=Sat)
app.get('/api/analytics/heatmap', requireAuth, (req: any, res: any) => {
  try {
    const days = Number(req.query.days) || 90;
    const rows = db.prepare(\`
      SELECT
        CAST(strftime('%w', created_at) AS INTEGER) as dow,
        CAST(strftime('%H', created_at) AS INTEGER) as hour,
        COUNT(*) as count
      FROM messages
      WHERE user_id=? AND created_at > datetime('now', '-\${days} days')
      GROUP BY dow, hour
    \`).all(req.user.id) as any[];
    // Build 7×24 grid
    const grid: number[][] = Array.from({length:7}, () => Array(24).fill(0));
    for (const r of rows) { grid[r.dow][r.hour] = r.count; }
    res.json({ grid, days });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Stale Thread Follow-up Notifier ────────────────────────────────────────────
// GET /api/threads/stale — threads idle > 3 days with < resolution signal
app.get('/api/threads/stale', requireAuth, (req: any, res: any) => {
  try {
    const idleDays = Number(req.query.idle_days) || 3;
    const stale = db.prepare(\`
      SELECT t.id, t.title, t.updated_at,
        (SELECT COUNT(*) FROM messages m WHERE m.thread_id=t.id) as msg_count,
        (SELECT content FROM messages m WHERE m.thread_id=t.id AND m.role='user' ORDER BY m.created_at DESC LIMIT 1) as last_user_msg
      FROM threads t
      WHERE t.user_id=?
        AND t.updated_at < datetime('now', '-\${idleDays} days')
        AND (SELECT COUNT(*) FROM messages m WHERE m.thread_id=t.id) > 2
      ORDER BY t.updated_at DESC
      LIMIT 10
    \`).all(req.user.id) as any[];
    res.json({ stale });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/threads/stale/notify — seed stale-thread notifications (call on login)
app.post('/api/threads/stale/notify', requireAuth, (req: any, res: any) => {
  try {
    db.exec(\`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'info', title TEXT NOT NULL, body TEXT,
      read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )\`);
    const stale = db.prepare(\`
      SELECT t.id, t.title FROM threads t
      WHERE t.user_id=?
        AND t.updated_at < datetime('now', '-3 days')
        AND (SELECT COUNT(*) FROM messages m WHERE m.thread_id=t.id) > 2
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id=? AND n.title LIKE '%' || t.title || '%'
            AND n.created_at > datetime('now', '-3 days')
        )
      ORDER BY t.updated_at DESC LIMIT 3
    \`).all(req.user.id, req.user.id) as any[];
    for (const t of stale) {
      db.prepare('INSERT INTO notifications (user_id,type,title,body) VALUES (?,?,?,?)').run(
        req.user.id, 'info',
        \`Continue: \${t.title || 'Untitled thread'}\`,
        'This thread has been idle for 3+ days. Pick up where you left off.'
      );
    }
    res.json({ notified: stale.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

`;

src = src.replace(anchor, patch + anchor);
fs.writeFileSync(filePath, src, 'utf8');
console.log('Heatmap + stale thread routes added');
