import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { db } from '../../../database/db';
import { ApiKeyRepository } from '../../../database/repositories/api-key.repository';
import { authenticateToken, requireRole } from '../../../middleware/auth';
import logger from '../../../utils/logger';

const router = Router();
const apiKeyRepo = new ApiKeyRepository(db);

// Validation schemas
const createApiKeySchema = Joi.object({
  name: Joi.string().required().max(255),
  organization_id: Joi.string().uuid().required(),
  expires_at: Joi.date().optional(),
  rate_limit: Joi.object({
    max_requests: Joi.number().required().min(1),
    window_ms: Joi.number().required().min(1000),
  }).optional(),
});

const rotateKeySchema = Joi.object({
  api_key_id: Joi.string().uuid().required(),
});

const updateKeySchema = Joi.object({
  name: Joi.string().optional().max(255),
  expires_at: Joi.date().optional(),
  rate_limit: Joi.object({
    max_requests: Joi.number().optional().min(1),
    window_ms: Joi.number().optional().min(1000),
  }).optional(),
});

// POST /api/v1/api-keys - Create new API key
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { error, value } = createApiKeySchema.validate(req.body);
    if (error) {
      logger.warn(`API key creation validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    const { plaintext_key, api_key } = await apiKeyRepo.createKey(
      value.organization_id,
      req.user?.id as string,
      value.name,
      value.expires_at,
      value.rate_limit || { max_requests: 1000, window_ms: 60000 }
    );

    logger.info(`API key created: ${api_key.id} by user ${req.user?.id}`);

    // Return plaintext key only once
    res.status(201).json({
      id: api_key.id,
      name: api_key.name,
      plaintext_key, // Only returned here
      organization_id: api_key.organization_id,
      created_at: api_key.created_at,
      expires_at: api_key.expires_at,
      rate_limit: api_key.rate_limit,
    });
  } catch (err: any) {
    logger.error(`API key creation failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// GET /api/v1/api-keys/:id - Get API key (hashed, not plaintext)
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const apiKey = await apiKeyRepo.getKeyById(req.params.id);
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Never return hashed key to user, just metadata
    logger.info(`API key retrieved: ${apiKey.id}`);
    res.json({
      id: apiKey.id,
      name: apiKey.name,
      organization_id: apiKey.organization_id,
      created_at: apiKey.created_at,
      expires_at: apiKey.expires_at,
      last_used_at: apiKey.last_used_at,
      is_active: apiKey.is_active,
      rate_limit: apiKey.rate_limit,
    });
  } catch (err: any) {
    logger.error(`API key retrieval failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to retrieve API key' });
  }
});

// GET /api/v1/api-keys - List API keys by organization
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = req.query.organization_id as string;
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    if (!organizationId) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const keys = await apiKeyRepo.listKeys(organizationId, offset, limit);

    // Remove hashed keys from response, only return metadata
    const safeKeys = keys.map(key => ({
      id: key.id,
      name: key.name,
      organization_id: key.organization_id,
      created_at: key.created_at,
      expires_at: key.expires_at,
      last_used_at: key.last_used_at,
      is_active: key.is_active,
      rate_limit: key.rate_limit,
    }));

    res.json(safeKeys);
  } catch (err: any) {
    logger.error(`API key listing failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to list API keys' });
  }
});

// PUT /api/v1/api-keys/:id - Update API key metadata
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { error, value } = updateKeySchema.validate(req.body);
    if (error) {
      logger.warn(`API key update validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    const apiKey = await apiKeyRepo.updateKey(req.params.id, value);
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    logger.info(`API key updated: ${apiKey.id} by user ${req.user?.id}`);
    res.json({
      id: apiKey.id,
      name: apiKey.name,
      organization_id: apiKey.organization_id,
      created_at: apiKey.created_at,
      expires_at: apiKey.expires_at,
      last_used_at: apiKey.last_used_at,
      is_active: apiKey.is_active,
      rate_limit: apiKey.rate_limit,
    });
  } catch (err: any) {
    logger.error(`API key update failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

// DELETE /api/v1/api-keys/:id - Revoke/delete API key
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const deleted = await apiKeyRepo.deleteKey(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'API key not found' });
    }

    logger.info(`API key revoked: ${req.params.id} by user ${req.user?.id}`);
    res.json({ message: 'API key revoked' });
  } catch (err: any) {
    logger.error(`API key revocation failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

// POST /api/v1/api-keys/:id/rotate - Rotate API key
router.post('/:id/rotate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { plaintext_key, api_key } = await apiKeyRepo.rotateKey(req.params.id);

    if (!api_key) {
      return res.status(404).json({ error: 'API key not found' });
    }

    logger.info(`API key rotated: ${req.params.id} by user ${req.user?.id}`);

    // Return plaintext key only on rotation
    res.json({
      id: api_key.id,
      name: api_key.name,
      plaintext_key, // New plaintext key
      organization_id: api_key.organization_id,
      created_at: api_key.created_at,
      expires_at: api_key.expires_at,
      rate_limit: api_key.rate_limit,
    });
  } catch (err: any) {
    logger.error(`API key rotation failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to rotate API key' });
  }
});

// GET /api/v1/api-keys/:id/audit - Get API key audit history
router.get('/:id/audit', authenticateToken, async (req: Request, res: Response) => {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const auditEntries = await apiKeyRepo.getAuditHistory(req.params.id, offset, limit);

    logger.info(`API key audit history retrieved: ${req.params.id}`);
    res.json(auditEntries);
  } catch (err: any) {
    logger.error(`Audit history retrieval failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to retrieve audit history' });
  }
});

// GET /api/v1/api-keys/:id/usage - Get API key usage statistics
router.get('/:id/usage', authenticateToken, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const usage = await apiKeyRepo.getKeyUsageStats(req.params.id, days);

    logger.info(`API key usage stats retrieved: ${req.params.id}`);
    res.json(usage);
  } catch (err: any) {
    logger.error(`Usage stats retrieval failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to retrieve usage statistics' });
  }
});

export default router;
