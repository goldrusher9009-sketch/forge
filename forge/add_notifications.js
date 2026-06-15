const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'forge-platform', 'src', 'index.ts');
let src = fs.readFileSync(filePath, 'utf8');

const anchor = '// GET /api/brain/category/:cat';

const patch = `
// ── Notifications ─────────────────────────────────────────────────────────────
function initNotificationsTable(db: any) {
  db.exec(\`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      title TEXT NOT NULL,
      body TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  \`);
}

function seedNotification(db: any, userId: number, type: string, title: string, body: string) {
  try {
    db.prepare('INSERT INTO notifications (user_id, type, title, body) VALUES (?,?,?,?)').run(userId, type, title, body);
  } catch {}
}

// GET /api/notifications
app.get('/api/notifications', requireAuth, (req: any, res: any) => {
  try {
    initNotificationsTable(db);
    const rows = db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
    const unread = rows.filter((r: any) => !r.read).length;
    res.json({ notifications: rows, unread });
  } catch (e: any) { res.json({ notifications: [], unread: 0 }); }
});

// POST /api/notifications/read-all
app.post('/api/notifications/read-all', requireAuth, (req: any, res: any) => {
  try {
    initNotificationsTable(db);
    db.prepare('UPDATE notifications SET read=1 WHERE user_id=?').run(req.user.id);
    res.json({ success: true });
  } catch { res.json({ success: false }); }
});

// DELETE /api/notifications/:id
app.delete('/api/notifications/:id', requireAuth, (req: any, res: any) => {
  try {
    db.prepare('DELETE FROM notifications WHERE id=? AND user_id=?').run(Number(req.params.id), req.user.id);
    res.json({ success: true });
  } catch { res.json({ success: false }); }
});

// POST /api/notifications/seed (dev helper — creates sample notifications)
app.post('/api/notifications/seed', requireAuth, (req: any, res: any) => {
  try {
    initNotificationsTable(db);
    const uid = req.user.id;
    seedNotification(db, uid, 'success', 'Run completed', 'Your scheduled ForgeAuto run finished successfully.');
    seedNotification(db, uid, 'info', 'Memory saved', 'Forge Brain learned 3 new facts from your last conversation.');
    seedNotification(db, uid, 'warning', 'Token usage', 'You have used 80% of your monthly token budget.');
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

`;

if (src.includes('GET /api/notifications')) {
  console.log('Already patched');
  process.exit(0);
}

src = src.replace(anchor, patch + anchor);
fs.writeFileSync(filePath, src, 'utf8');
console.log('Notifications routes added');
