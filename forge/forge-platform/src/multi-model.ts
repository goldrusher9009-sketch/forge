import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupMultiModelInference = (app: Express, db: Database, requireAuth: any) => {
  // Model performance tracking
  db.exec(`CREATE TABLE IF NOT EXISTS model_performance (
    id TEXT PRIMARY KEY,
    model_name TEXT NOT NULL,
    latency_ms REAL,
    cost_per_token REAL,
    quality_score REAL,
    tokens_used INTEGER,
    user_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Route to optimal model
  app.post('/api/models/infer', requireAuth, (req: AuthRequest, res) => {
    const { prompt, complexity, budget_limit } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'prompt required' });
      return;
    }

    // Model selection logic: cost vs quality vs latency
    const models = [
      { name: 'gpt-4o', cost: 0.03, quality: 0.95, latency: 2000 },
      { name: 'claude-3-5-sonnet', cost: 0.015, quality: 0.92, latency: 1500 },
      { name: 'llama-3-70b', cost: 0.008, quality: 0.85, latency: 1000 },
      { name: 'gpt-4o-mini', cost: 0.0005, quality: 0.75, latency: 800 }
    ];

    // Score models: (quality - cost) / latency
    const scored = models
      .filter(m => !budget_limit || m.cost <= budget_limit)
      .map(m => ({
        ...m,
        score: (m.quality - m.cost / 0.03) / (m.latency / 1000)
      }))
      .sort((a, b) => b.score - a.score);

    const selected = scored[0] || models[0];

    // Log inference
    db.prepare(
      'INSERT INTO model_performance (id, model_name, cost_per_token, quality_score, user_id) VALUES (?, ?, ?, ?, ?)'
    ).run(uuidv4(), selected.name, selected.cost, selected.quality, req.user!.sub);

    res.json({
      success: true,
      data: {
        model: selected.name,
        estimated_cost: selected.cost,
        quality_score: selected.quality,
        latency: selected.latency
      }
    });
  });

  // Get model recommendations
  app.get('/api/models/recommend', requireAuth, (req: AuthRequest, res) => {
    const { budget, quality_threshold } = req.query;
    
    const budget_limit = budget ? parseFloat(budget as string) : Infinity;
    const quality_min = quality_threshold ? parseFloat(quality_threshold as string) : 0;

    const recommendations = [
      { name: 'gpt-4o', cost: 0.03, quality: 0.95, use_case: 'Complex reasoning' },
      { name: 'claude-3-5-sonnet', cost: 0.015, quality: 0.92, use_case: 'Balanced' },
      { name: 'llama-3-70b', cost: 0.008, quality: 0.85, use_case: 'Cost-efficient' },
      { name: 'gpt-4o-mini', cost: 0.0005, quality: 0.75, use_case: 'Budget' }
    ]
      .filter(m => m.cost <= budget_limit && m.quality >= quality_min)
      .sort((a, b) => b.quality - a.quality);

    res.json({ success: true, data: recommendations });
  });

  // Get cost analysis
  app.get('/api/models/cost-analysis', requireAuth, (req: AuthRequest, res) => {
    const analysis = db.prepare(`
      SELECT 
        model_name,
        COUNT(*) as usage_count,
        AVG(cost_per_token) as avg_cost,
        AVG(quality_score) as avg_quality,
        SUM(tokens_used) as total_tokens
      FROM model_performance
      WHERE user_id = ?
      GROUP BY model_name
      ORDER BY avg_cost ASC
    `).all(req.user!.sub) as any[];

    const totalCost = analysis.reduce((sum, m) => sum + (m.avg_cost * m.total_tokens || 0), 0);

    res.json({
      success: true,
      data: {
        models: analysis,
        total_cost: totalCost,
        recommendations: 'Use lower-cost models for simple tasks'
      }
    });
  });
};
