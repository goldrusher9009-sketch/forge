import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { db } from '../../../database/db';
import { authenticateToken, requireRole } from '../../../middleware/auth';
import logger from '../../../utils/logger';

const router = Router();

// Validation schemas
const auditLogQuerySchema = Joi.object({
  entity_type: Joi.string().optional(),
  entity_id: Joi.string().uuid().optional(),
  action: Joi.string().optional(),
  user_id: Joi.string().uuid().optional(),
  offset: Joi.number().optional().default(0),
  limit: Joi.number().optional().default(50),
  start_date: Joi.date().optional(),
  end_date: Joi.date().optional(),
});

const organizationUpdateSchema = Joi.object({
  name: Joi.string().optional().max(255),
  description: Joi.string().optional().max(1000),
  website: Joi.string().optional().uri(),
  logo_url: Joi.string().optional().uri(),
});

// GET /api/v1/admin/audit-logs - Get audit logs (admin only)
router.get('/audit-logs', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { error, value } = auditLogQuerySchema.validate(req.query);
    if (error) {
      logger.warn(`Audit log query validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    // Build query
    let query = `
      SELECT
        id, entity_type, entity_id, action,
        user_id, changes, created_at, ip_address
      FROM audit_logs
      WHERE 1=1
    `;

    const params: any[] = [];

    if (value.entity_type) {
      query += ` AND entity_type = $${params.length + 1}`;
      params.push(value.entity_type);
    }

    if (value.entity_id) {
      query += ` AND entity_id = $${params.length + 1}`;
      params.push(value.entity_id);
    }

    if (value.action) {
      query += ` AND action = $${params.length + 1}`;
      params.push(value.action);
    }

    if (value.user_id) {
      query += ` AND user_id = $${params.length + 1}`;
      params.push(value.user_id);
    }

    if (value.start_date) {
      query += ` AND created_at >= $${params.length + 1}`;
      params.push(value.start_date);
    }

    if (value.end_date) {
      query += ` AND created_at <= $${params.length + 1}`;
      params.push(value.end_date);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(value.limit);
    params.push(value.offset);

    const result = await db.query<any>(query, params);

    logger.info(`Audit logs retrieved: ${result.length} records`);
    res.json({
      count: result.length,
      offset: value.offset,
      limit: value.limit,
      logs: result,
    });
  } catch (err: any) {
    logger.error(`Audit log retrieval failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
});

// GET /api/v1/admin/system-health - Get system health metrics
router.get('/system-health', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const dbHealth = await db.healthCheck();

    // Get user count
    const userCountResult = await db.query<any>(
      `SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL`
    );

    // Get active API keys
    const apiKeysResult = await db.query<any>(
      `SELECT COUNT(*) as count FROM api_keys WHERE is_active = true AND deleted_at IS NULL`
    );

    // Get recent errors (last 24 hours)
    const errorsResult = await db.query<any>(
      `SELECT COUNT(*) as count FROM audit_logs
       WHERE action = 'ERROR' AND created_at > NOW() - INTERVAL '24 hours'`
    );

    // Get workflow executions (last 24 hours)
    const workflowsResult = await db.query<any>(
      `SELECT COUNT(*) as count FROM workflow_executions
       WHERE created_at > NOW() - INTERVAL '24 hours'`
    );

    logger.info(`System health check completed`);
    res.json({
      timestamp: new Date().toISOString(),
      database: {
        connected: dbHealth,
        status: dbHealth ? 'healthy' : 'unhealthy',
      },
      metrics: {
        total_users: userCountResult[0]?.count || 0,
        active_api_keys: apiKeysResult[0]?.count || 0,
        recent_errors_24h: errorsResult[0]?.count || 0,
        workflow_executions_24h: workflowsResult[0]?.count || 0,
      },
    });
  } catch (err: any) {
    logger.error(`System health check failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to retrieve system health' });
  }
});

// GET /api/v1/admin/organizations/:id - Get organization details
router.get('/organizations/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const result = await db.query<any>(
      `SELECT id, name, description, website, logo_url, created_at, created_by
       FROM organizations WHERE id = $1 AND deleted_at IS NULL`,
      [req.params.id]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    logger.info(`Organization retrieved: ${req.params.id}`);
    res.json(result[0]);
  } catch (err: any) {
    logger.error(`Organization retrieval failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to retrieve organization' });
  }
});

// GET /api/v1/admin/organizations - List all organizations
router.get('/organizations', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await db.query<any>(
      `SELECT id, name, description, website, logo_url, created_at, created_by
       FROM organizations WHERE deleted_at IS NULL
       ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    logger.info(`Organizations listed: ${result.length} records`);
    res.json({
      count: result.length,
      offset,
      limit,
      organizations: result,
    });
  } catch (err: any) {
    logger.error(`Organization listing failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to list organizations' });
  }
});

// PUT /api/v1/admin/organizations/:id - Update organization
router.put('/organizations/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { error, value } = organizationUpdateSchema.validate(req.body);
    if (error) {
      logger.warn(`Organization update validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    // Build update query
    let query = `UPDATE organizations SET updated_at = NOW()`;
    const params: any[] = [];

    if (value.name) {
      query += `, name = $${params.length + 1}`;
      params.push(value.name);
    }

    if (value.description) {
      query += `, description = $${params.length + 1}`;
      params.push(value.description);
    }

    if (value.website) {
      query += `, website = $${params.length + 1}`;
      params.push(value.website);
    }

    if (value.logo_url) {
      query += `, logo_url = $${params.length + 1}`;
      params.push(value.logo_url);
    }

    query += ` WHERE id = $${params.length + 1} AND deleted_at IS NULL RETURNING *`;
    params.push(req.params.id);

    const result = await db.query<any>(query, params);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    logger.info(`Organization updated: ${req.params.id} by user ${req.user?.id}`);
    res.json(result[0]);
  } catch (err: any) {
    logger.error(`Organization update failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

// DELETE /api/v1/admin/organizations/:id - Delete organization
router.delete('/organizations/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const result = await db.query<any>(
      `UPDATE organizations SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [req.params.id]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    logger.info(`Organization deleted: ${req.params.id} by user ${req.user?.id}`);
    res.json({ message: 'Organization deleted' });
  } catch (err: any) {
    logger.error(`Organization deletion failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to delete organization' });
  }
});

// GET /api/v1/admin/stats - Get comprehensive system statistics
router.get('/stats', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const startDate = req.query.start_date ? new Date(req.query.start_date as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.end_date ? new Date(req.query.end_date as string) : new Date();

    // User creation trend
    const userTrend = await db.query<any>(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM users
       WHERE deleted_at IS NULL AND created_at BETWEEN $1 AND $2
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [startDate, endDate]
    );

    // API key usage trend
    const apiKeyUsage = await db.query<any>(
      `SELECT api_key_id, COUNT(*) as total_requests,
              COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_requests
       FROM api_key_audit
       WHERE created_at BETWEEN $1 AND $2
       GROUP BY api_key_id
       ORDER BY total_requests DESC
       LIMIT 10`,
      [startDate, endDate]
    );

    // Workflow execution stats
    const workflowStats = await db.query<any>(
      `SELECT
              COUNT(*) as total_executions,
              COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
              COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
              COUNT(CASE WHEN status = 'running' THEN 1 END) as running
       FROM workflow_executions
       WHERE created_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    );

    logger.info(`System stats retrieved for period ${startDate} to ${endDate}`);
    res.json({
      period: {
        start: startDate,
        end: endDate,
      },
      user_trend: userTrend,
      api_key_usage: apiKeyUsage,
      workflow_stats: workflowStats[0],
    });
  } catch (err: any) {
    logger.error(`Stats retrieval failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

export default router;
