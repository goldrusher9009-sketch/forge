import { Database } from 'better-sqlite3';
import { Express } from 'express';
export const setupBillingRoutes = (app: Express, db: Database, requireAuth: any) => {
  app.get('/api/billing/status', requireAuth, (req: any, res) => {
    res.json({ success: true, status: 'active' });
  });
};
