import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupRouterRoutes = (app: Express, db: Database, requireAuth: any) => {
  // Track routing decisions for ML training
  db.exec(`CREATE TABLE IF NOT EXISTS router_decisions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    complexity_score REAL NOT NULL,
    selected_model TEXT NOT NULL,
    success INTEGER,
    tokens_used INTEGER,
    cost REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Classify prompt complexity
  const classifyComplexity = (prompt: string): number => {
    // Simple heuristic: word count / reasoning keywords
    const words = prompt.split(/\s+/).length;
    const keywords = ['design', 'architect', 'implement', 'analyze', 'code', 'system'].filter(k => 
      prompt.toLowerCase().includes(k)
    ).length;
    return Math.min(1.0, (words / 50) * 0.5 + (keywords / 6) * 0.5);
  };

  // Route to cheapest capable model
  const routePrompt = (complexity: number): string => {
    if (complexity < 0.3) return 'groq'; // Fast, cheap
    if (complexity < 0.6) return 'openai'; // Balanced
    return 'anthropic'; // Powerful
  };

  // Log routing decision
  app.post('/api/router/route', requireAuth, (req: AuthRequest, res) => {
    const { prompt, model_override } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'prompt required' });
      return;
    }

    const complexity = classifyComplexity(prompt);
    const model = model_override || routePrompt(complexity);
    const id = uuidv4();

    db.prepare(
      'INSERT INTO router_decisions (id, user_id, prompt, complexity_score, selected_model) VALUES (?, ?, ?, ?, ?)'
    ).run(id, req.user!.sub, prompt, complexity, model);

    res.json({ 
      success: true, 
      data: { 
        id,
        model, 
        complexity,
        estimated_cost: complexity > 0.6 ? 0.015 : complexity > 0.3 ? 0.008 : 0.002
      } 
    });
  });

  // Log outcome (for training data)
  app.post('/api/router/log-outcome', requireAuth, (req: AuthRequest, res) => {
    const { decision_id, success, tokens_used, cost } = req.body;
    db.prepare(
      'UPDATE router_decisions SET success = ?, tokens_used = ?, cost = ? WHERE id = ? AND user_id = ?'
    ).run(success ? 1 : 0, tokens_used, cost, decision_id, req.user!.sub);
    res.json({ success: true });
  });

  // Get routing analytics
  app.get('/api/router/analytics', requireAuth, (req: AuthRequest, res) => {
    const stats = db.prepare(`
      SELECT 
        selected_model,
        COUNT(*) as count,
        AVG(complexity_score) as avg_complexity,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successes,
        AVG(cost) as avg_cost
      FROM router_decisions
      WHERE user_id = ?
      GROUP BY selected_model
    `).all(req.user!.sub) as any[];

    res.json({ success: true, data: stats });
  });
};
