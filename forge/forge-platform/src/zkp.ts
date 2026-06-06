import { Database } from 'better-sqlite3';
import { Express } from 'express';
import crypto from 'crypto';

interface AuthRequest {
  user?: { sub: string };
}

export const setupZKP = (app: Express, db: Database, requireAuth: any) => {
  // ZKP proofs table
  db.exec(`CREATE TABLE IF NOT EXISTS zkp_proofs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    claim_type TEXT NOT NULL,
    proof_hash TEXT NOT NULL,
    verified INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Generate ZKP proof
  app.post('/api/zkp/generate-proof', requireAuth, (req: AuthRequest, res) => {
    const { claim_type, secret_data } = req.body;
    if (!claim_type || !secret_data) {
      res.status(400).json({ error: 'claim_type and secret_data required' });
      return;
    }

    // Generate proof hash without storing secret
    const proofHash = crypto
      .createHash('sha256')
      .update(secret_data + claim_type)
      .digest('hex');

    const id = crypto.randomUUID();
    db.prepare(
      'INSERT INTO zkp_proofs (id, user_id, claim_type, proof_hash) VALUES (?, ?, ?, ?)'
    ).run(id, req.user!.sub, claim_type, proofHash);

    res.json({
      success: true,
      data: {
        proof_id: id,
        claim_type,
        proof_hash: proofHash.substring(0, 16) + '...'
      }
    });
  });

  // Verify ZKP proof
  app.post('/api/zkp/verify-proof', requireAuth, (req: AuthRequest, res) => {
    const { proof_id, claim_type, secret_data } = req.body;
    
    const proof = db.prepare(
      'SELECT * FROM zkp_proofs WHERE id = ? AND user_id = ?'
    ).get(proof_id, req.user!.sub) as any;

    if (!proof) {
      res.status(404).json({ error: 'Proof not found' });
      return;
    }

    const verifyHash = crypto
      .createHash('sha256')
      .update(secret_data + claim_type)
      .digest('hex');

    const verified = verifyHash === proof.proof_hash;
    if (verified) {
      db.prepare('UPDATE zkp_proofs SET verified = 1 WHERE id = ?').run(proof_id);
    }

    res.json({ success: true, verified });
  });
};
