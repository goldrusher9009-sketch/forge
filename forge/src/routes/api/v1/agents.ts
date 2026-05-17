import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { db } from '../../../database/db';
import { AgentRepository } from '../../../database/repositories/agent.repository';
import { authenticateToken, requireRole } from '../../../middleware/auth';
import logger from '../../../utils/logger';

const router = Router();
const agentRepo = new AgentRepository(db);

// Validation schemas
const createAgentSchema = Joi.object({
  name: Joi.string().required().max(255),
  description: Joi.string().optional().max(1000),
  organization_id: Joi.string().uuid().required(),
  llm_model: Joi.string().required().valid('gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet'),
  tools: Joi.array().items(Joi.object()).optional(),
  system_prompt: Joi.string().optional().max(5000),
  is_active: Joi.boolean().optional().default(true),
});

const updateAgentSchema = Joi.object({
  name: Joi.string().optional().max(255),
  description: Joi.string().optional().max(1000),
  llm_model: Joi.string().optional().valid('gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet'),
  tools: Joi.array().items(Joi.object()).optional(),
  system_prompt: Joi.string().optional().max(5000),
  is_active: Joi.boolean().optional(),
});

const createExecutionSchema = Joi.object({
  agent_id: Joi.string().uuid().required(),
  messages: Joi.array().items(
    Joi.object({
      role: Joi.string().valid('user', 'assistant', 'system').required(),
      content: Joi.string().required(),
    })
  ).required(),
  max_tokens: Joi.number().optional().default(2000),
});

const createVersionSchema = Joi.object({
  agent_id: Joi.string().uuid().required(),
  changelog: Joi.string().optional().max(500),
});

const rollbackVersionSchema = Joi.object({
  version_number: Joi.number().required().min(1),
});

// POST /api/v1/agents - Create new agent
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { error, value } = createAgentSchema.validate(req.body);
    if (error) {
      logger.warn(`Agent creation validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    const agent = await agentRepo.createAgent(
      value.organization_id,
      value.name,
      value.description,
      value.llm_model,
      value.tools || [],
      value.system_prompt,
      req.user?.id as string,
      value.is_active
    );

    logger.info(`Agent created: ${agent.id} by user ${req.user?.id}`);
    res.status(201).json(agent);
  } catch (err: any) {
    logger.error(`Agent creation failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// GET /api/v1/agents/:id - Get agent by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const agent = await agentRepo.getAgentById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    logger.info(`Agent retrieved: ${agent.id}`);
    res.json(agent);
  } catch (err: any) {
    logger.error(`Agent retrieval failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to retrieve agent' });
  }
});

// GET /api/v1/agents - List agents by organization
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = req.query.organization_id as string;
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    if (!organizationId) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const agents = await agentRepo.listAgents(organizationId, offset, limit);
    res.json(agents);
  } catch (err: any) {
    logger.error(`Agent listing failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to list agents' });
  }
});

// PUT /api/v1/agents/:id - Update agent
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { error, value } = updateAgentSchema.validate(req.body);
    if (error) {
      logger.warn(`Agent update validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    const agent = await agentRepo.updateAgent(req.params.id, value);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    logger.info(`Agent updated: ${agent.id} by user ${req.user?.id}`);
    res.json(agent);
  } catch (err: any) {
    logger.error(`Agent update failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// DELETE /api/v1/agents/:id - Delete agent
router.delete('/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const deleted = await agentRepo.deleteAgent(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    logger.info(`Agent deleted: ${req.params.id} by user ${req.user?.id}`);
    res.json({ message: 'Agent deleted' });
  } catch (err: any) {
    logger.error(`Agent deletion failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

// POST /api/v1/agents/:id/executions - Create agent execution
router.post('/:id/executions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { error, value } = createExecutionSchema.validate(req.body);
    if (error) {
      logger.warn(`Execution creation validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    const execution = await agentRepo.createExecution(
      value.agent_id,
      req.user?.id as string,
      value.messages,
      value.max_tokens
    );

    logger.info(`Agent execution created: ${execution.id} for agent ${value.agent_id}`);
    res.status(201).json(execution);
  } catch (err: any) {
    logger.error(`Execution creation failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to create execution' });
  }
});

// GET /api/v1/agents/:id/executions - List agent executions
router.get('/:id/executions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const executions = await agentRepo.listExecutions(req.params.id, offset, limit);
    res.json(executions);
  } catch (err: any) {
    logger.error(`Execution listing failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to list executions' });
  }
});

// POST /api/v1/agents/:id/versions - Create agent version
router.post('/:id/versions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { error, value } = createVersionSchema.validate(req.body);
    if (error) {
      logger.warn(`Version creation validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    const version = await agentRepo.createVersion(
      value.agent_id,
      req.user?.id as string,
      value.changelog
    );

    logger.info(`Agent version created: ${version.id} for agent ${value.agent_id}`);
    res.status(201).json(version);
  } catch (err: any) {
    logger.error(`Version creation failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to create version' });
  }
});

// GET /api/v1/agents/:id/versions - List agent versions
router.get('/:id/versions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const versions = await agentRepo.listVersions(req.params.id);
    res.json(versions);
  } catch (err: any) {
    logger.error(`Version listing failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to list versions' });
  }
});

// POST /api/v1/agents/:id/rollback - Rollback to version
router.post('/:id/rollback', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { error, value } = rollbackVersionSchema.validate(req.body);
    if (error) {
      logger.warn(`Rollback validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    const agent = await agentRepo.rollbackToVersion(req.params.id, value.version_number);
    if (!agent) {
      return res.status(404).json({ error: 'Agent or version not found' });
    }

    logger.info(`Agent rolled back: ${req.params.id} to version ${value.version_number} by user ${req.user?.id}`);
    res.json(agent);
  } catch (err: any) {
    logger.error(`Rollback failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to rollback agent' });
  }
});

// GET /api/v1/agents/:id/stats - Get agent usage statistics
router.get('/:id/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const stats = await agentRepo.getUsageStats(req.params.id);
    res.json(stats);
  } catch (err: any) {
    logger.error(`Stats retrieval failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

export default router;
