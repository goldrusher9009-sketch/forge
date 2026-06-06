import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupMonetizationRoutes = (app: Express, db: Database, requireAuth: any) => {
  // Track marketplace sales
  db.exec(`CREATE TABLE IF NOT EXISTS marketplace_sales (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    amount REAL NOT NULL,
    commission_rate REAL DEFAULT 0.75,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Track creator earnings
  db.exec(`CREATE TABLE IF NOT EXISTS creator_earnings (
    id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL,
    total_earned REAL DEFAULT 0,
    payout_status TEXT DEFAULT 'pending',
    last_payout TEXT
  )`);

  // Log marketplace sale
  app.post('/api/monetization/sale', requireAuth, (req: AuthRequest, res) => {
    const { product_id, amount } = req.body;
    if (!product_id || !amount) {
      res.status(400).json({ error: 'product_id and amount required' });
      return;
    }
    const id = uuidv4();
    db.prepare(
      'INSERT INTO marketplace_sales (id, user_id, product_id, amount) VALUES (?, ?, ?, ?)'
    ).run(id, req.user!.sub, product_id, amount);
    
    const creatorShare = amount * 0.75; // 75% to creator, 25% platform
    res.status(201).json({ success: true, data: { id, creatorShare } });
  });

  // Get creator earnings
  app.get('/api/monetization/earnings', requireAuth, (req: AuthRequest, res) => {
    const earnings = db.prepare(
      'SELECT * FROM creator_earnings WHERE creator_id = ?'
    ).get(req.user!.sub) as any;
    
    if (!earnings) {
      res.json({ success: true, data: { total_earned: 0, payout_status: 'none' } });
      return;
    }
    res.json({ success: true, data: earnings });
  });

  // Request payout
  app.post('/api/monetization/payout-request', requireAuth, (req: AuthRequest, res) => {
    const { amount } = req.body;
    const earnings = db.prepare(
      'SELECT * FROM creator_earnings WHERE creator_id = ?'
    ).get(req.user!.sub) as any;
    
    if (!earnings || earnings.total_earned < amount) {
      res.status(400).json({ error: 'Insufficient funds' });
      return;
    }
    
    db.prepare(
      'UPDATE creator_earnings SET payout_status = ? WHERE creator_id = ?'
    ).run('processing', req.user!.sub);
    
    res.json({ success: true, message: 'Payout initiated' });
  });
};
