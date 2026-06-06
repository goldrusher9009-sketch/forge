import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupTokenomicsRoutes = (app: Express, db: Database, requireAuth: any) => {
  // FORGE token balance
  db.exec(`CREATE TABLE IF NOT EXISTS token_balance (
    user_id TEXT PRIMARY KEY,
    balance REAL DEFAULT 0,
    staked REAL DEFAULT 0,
    earned REAL DEFAULT 0
  )`);

  // Token transactions
  db.exec(`CREATE TABLE IF NOT EXISTS token_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Get token balance
  app.get('/api/tokens/balance', requireAuth, (req: AuthRequest, res) => {
    let balance = db.prepare(
      'SELECT * FROM token_balance WHERE user_id = ?'
    ).get(req.user!.sub) as any;
    
    if (!balance) {
      db.prepare(
        'INSERT INTO token_balance (user_id, balance) VALUES (?, ?)'
      ).run(req.user!.sub, 0);
      balance = { user_id: req.user!.sub, balance: 0, staked: 0, earned: 0 };
    }
    res.json({ success: true, data: balance });
  });

  // Stake tokens
  app.post('/api/tokens/stake', requireAuth, (req: AuthRequest, res) => {
    const { amount } = req.body;
    if (amount <= 0) {
      res.status(400).json({ error: 'Amount must be positive' });
      return;
    }
    
    const balance = db.prepare(
      'SELECT balance FROM token_balance WHERE user_id = ?'
    ).get(req.user!.sub) as any;
    
    if (!balance || balance.balance < amount) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
    }
    
    db.prepare(
      'UPDATE token_balance SET balance = balance - ?, staked = staked + ? WHERE user_id = ?'
    ).run(amount, amount, req.user!.sub);
    
    db.prepare(
      'INSERT INTO token_transactions (id, user_id, type, amount) VALUES (?, ?, ?, ?)'
    ).run(uuidv4(), req.user!.sub, 'stake', amount);
    
    res.json({ success: true, message: 'Tokens staked', amount });
  });

  // Unstake tokens
  app.post('/api/tokens/unstake', requireAuth, (req: AuthRequest, res) => {
    const { amount } = req.body;
    const balance = db.prepare(
      'SELECT staked FROM token_balance WHERE user_id = ?'
    ).get(req.user!.sub) as any;
    
    if (!balance || balance.staked < amount) {
      res.status(400).json({ error: 'Insufficient staked tokens' });
      return;
    }
    
    db.prepare(
      'UPDATE token_balance SET balance = balance + ?, staked = staked - ? WHERE user_id = ?'
    ).run(amount, amount, req.user!.sub);
    
    db.prepare(
      'INSERT INTO token_transactions (id, user_id, type, amount) VALUES (?, ?, ?, ?)'
    ).run(uuidv4(), req.user!.sub, 'unstake', amount);
    
    res.json({ success: true, message: 'Tokens unstaked', amount });
  });

  // Get transaction history
  app.get('/api/tokens/history', requireAuth, (req: AuthRequest, res) => {
    const history = db.prepare(
      'SELECT * FROM token_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).all(req.user!.sub);
    
    res.json({ success: true, data: history });
  });
};
