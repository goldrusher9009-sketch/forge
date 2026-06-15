const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'forge-platform', 'src', 'index.ts');
let src = fs.readFileSync(filePath, 'utf8');

if (src.includes('POST /api/messages/:id/rate')) { console.log('Already patched'); process.exit(0); }

const anchor = '// GET /api/brain/category/:cat';

const patch = `
// ── Message Ratings (thumbs up/down → router flywheel) ────────────────────────
// POST /api/messages/:id/rate
app.post('/api/messages/:id/rate', requireAuth, (req: any, res: any) => {
  try {
    const msgId = Number(req.params.id);
    const { rating } = req.body; // 1 = thumbs up, -1 = thumbs down, 0 = clear
    if (![1, -1, 0].includes(rating)) return res.status(400).json({ error: 'rating must be 1, -1, or 0' });
    const msg = db.prepare('SELECT * FROM messages WHERE id=?').get(msgId) as any;
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    const thread = db.prepare('SELECT * FROM threads WHERE id=? AND user_id=?').get(msg.thread_id, req.user.id) as any;
    if (!thread) return res.status(403).json({ error: 'Forbidden' });
    // Store rating in message metadata
    db.prepare("UPDATE messages SET metadata = json_set(COALESCE(metadata,'{}'), '$.rating', ?) WHERE id=?").run(rating, msgId);
    // Write back to routing_log if we can find the matching log entry
    try {
      db.exec(\`
        CREATE TABLE IF NOT EXISTS routing_log (
          id TEXT PRIMARY KEY,
          user_id INTEGER,
          model_requested TEXT,
          model_resolved TEXT,
          provider TEXT,
          prompt_complexity TEXT,
          prompt_tokens INTEGER,
          completion_tokens INTEGER,
          latency_ms INTEGER,
          rating INTEGER,
          created_at TEXT
        )
      \`);
      // Try to find the most recent routing_log entry for this user near this message's time
      const logEntry = db.prepare(
        'SELECT id FROM routing_log WHERE user_id=? ORDER BY created_at DESC LIMIT 1'
      ).get(req.user.id) as any;
      if (logEntry) {
        db.prepare('UPDATE routing_log SET rating=? WHERE id=?').run(rating, logEntry.id);
      }
    } catch {}
    res.json({ success: true, rating });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/messages/:id/rate
app.get('/api/messages/:id/rate', requireAuth, (req: any, res: any) => {
  try {
    const msg = db.prepare('SELECT metadata FROM messages WHERE id=?').get(Number(req.params.id)) as any;
    if (!msg) return res.status(404).json({ error: 'Not found' });
    const meta = JSON.parse(msg.metadata || '{}');
    res.json({ rating: meta.rating ?? 0 });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Usage Alerts ───────────────────────────────────────────────────────────────
// Called internally after each chat completion to check budget thresholds
function checkUsageAlert(db: any, userId: number, usedTokens: number, limitTokens: number) {
  if (!limitTokens || limitTokens <= 0) return;
  const pct = usedTokens / limitTokens;
  try {
    db.exec(\`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'info', title TEXT NOT NULL, body TEXT,
      read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )\`);
    // 80% alert — only once per month
    if (pct >= 0.8 && pct < 1.0) {
      const existing = db.prepare(
        "SELECT id FROM notifications WHERE user_id=? AND title='Token budget at 80%' AND created_at > datetime('now','-30 days')"
      ).get(userId);
      if (!existing) {
        db.prepare('INSERT INTO notifications (user_id,type,title,body) VALUES (?,?,?,?)').run(
          userId, 'warning', 'Token budget at 80%',
          \`You've used \${Math.round(pct*100)}% of your monthly token budget. Consider upgrading or reducing usage.\`
        );
      }
    }
    // 100% alert
    if (pct >= 1.0) {
      const existing = db.prepare(
        "SELECT id FROM notifications WHERE user_id=? AND title='Token budget exceeded' AND created_at > datetime('now','-7 days')"
      ).get(userId);
      if (!existing) {
        db.prepare('INSERT INTO notifications (user_id,type,title,body) VALUES (?,?,?,?)').run(
          userId, 'error', 'Token budget exceeded',
          'You have exceeded your monthly token budget. New requests may be blocked until you upgrade.'
        );
      }
    }
  } catch {}
}

// GET /api/usage/alert-check — manual trigger for testing
app.get('/api/usage/alert-check', requireAuth, (req: any, res: any) => {
  try {
    const usage = db.prepare("SELECT COALESCE(SUM(prompt_tokens+completion_tokens),0) as used FROM routing_log WHERE user_id=? AND created_at > datetime('now','start of month')").get(req.user.id) as any;
    const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id=? ORDER BY created_at DESC LIMIT 1').get(req.user.id) as any;
    const limit = sub?.monthly_token_limit || 0;
    const used = usage?.used || 0;
    checkUsageAlert(db, req.user.id, used, limit);
    res.json({ used, limit, pct: limit > 0 ? Math.round(used/limit*100) : 0 });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

`;

src = src.replace(anchor, patch + anchor);
fs.writeFileSync(filePath, src, 'utf8');
console.log('Ratings + usage alerts routes added');
