import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupGovernance = (app: Express, db: Database, requireAuth: any) => {
  // Governance proposals table
  db.exec(`CREATE TABLE IF NOT EXISTS governance_proposals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    proposer_id TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    votes_for INTEGER DEFAULT 0,
    votes_against INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT
  )`);

  // Votes table
  db.exec(`CREATE TABLE IF NOT EXISTS governance_votes (
    id TEXT PRIMARY KEY,
    proposal_id TEXT NOT NULL,
    voter_id TEXT NOT NULL,
    vote TEXT NOT NULL,
    weight REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Create proposal
  app.post('/api/governance/propose', requireAuth, (req: AuthRequest, res) => {
    const { title, description } = req.body;
    if (!title || !description) {
      res.status(400).json({ error: 'title and description required' });
      return;
    }

    const id = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    db.prepare(
      'INSERT INTO governance_proposals (id, title, description, proposer_id, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, title, description, req.user!.sub, expiresAt);

    res.status(201).json({ success: true, data: { id, title, status: 'active' } });
  });

  // List proposals
  app.get('/api/governance/proposals', (req: AuthRequest, res) => {
    const proposals = db.prepare(
      'SELECT * FROM governance_proposals WHERE status IN (?, ?) ORDER BY created_at DESC LIMIT 50'
    ).all('active', 'closed');

    res.json({ success: true, data: proposals });
  });

  // Vote on proposal
  app.post('/api/governance/vote/:proposalId', requireAuth, (req: AuthRequest, res) => {
    const { vote } = req.body;
    if (!['for', 'against'].includes(vote)) {
      res.status(400).json({ error: 'vote must be "for" or "against"' });
      return;
    }

    // Get voter's token weight (staked tokens)
    const balance = db.prepare(
      'SELECT staked FROM token_balance WHERE user_id = ?'
    ).get(req.user!.sub) as any;

    const weight = balance?.staked || 0;

    db.prepare(
      'INSERT INTO governance_votes (id, proposal_id, voter_id, vote, weight) VALUES (?, ?, ?, ?, ?)'
    ).run(uuidv4(), req.params.proposalId, req.user!.sub, vote, weight);

    // Update proposal vote counts
    if (vote === 'for') {
      db.prepare('UPDATE governance_proposals SET votes_for = votes_for + ? WHERE id = ?').run(weight, req.params.proposalId);
    } else {
      db.prepare('UPDATE governance_proposals SET votes_against = votes_against + ? WHERE id = ?').run(weight, req.params.proposalId);
    }

    res.json({ success: true, data: { vote, weight } });
  });

  // Get proposal details
  app.get('/api/governance/proposals/:id', (req: AuthRequest, res) => {
    const proposal = db.prepare('SELECT * FROM governance_proposals WHERE id = ?').get(req.params.id) as any;
    if (!proposal) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const votes = db.prepare('SELECT COUNT(*) as count FROM governance_votes WHERE proposal_id = ?').get(req.params.id) as any;
    res.json({ success: true, data: { ...proposal, total_votes: votes.count } });
  });
};
