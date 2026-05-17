import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { db } from '../../../database/db';
import { WorkflowRepository } from '../../../database/repositories/workflow.repository';
import { authenticateToken, requireRole } from '../../../middleware/auth';
import logger from '../../../utils/logger';

const router = Router();
const workflowRepo = new WorkflowRepository(db);

// Validation schemas
const createWorkflowSchema = Joi.object({
  name: Joi.string().required().max(255),
  description: Joi.string().optional().max(1000),
  organization_id: Joi.string().uuid().required(),
  definition: Joi.object().required(), // Workflow definition in JSONB
  is_active: Joi.boolean().optional().default(true),
});

const updateWorkflowSchema = Joi.object({
  name: Joi.string().optional().max(255),
  description: Joi.string().optional().max(1000),
  definition: Joi.object().optional(),
  is_active: Joi.boolean().optional(),
});

const createExecutionSchema = Joi.object({
  workflow_id: Joi.string().uuid().required(),
  inputs: Joi.object().optional(),
});

const updateExecutionSchema = Joi.object({
  status: Joi.string().valid('pending', 'running', 'completed', 'failed').required(),
  outputs: Joi.object().optional(),
  error: Joi.string().optional(),
});

const createScheduleSchema = Joi.object({
  workflow_id: Joi.string().uuid().required(),
  cron_expression: Joi.string().required(),
  timezone: Joi.string().optional().default('UTC'),
  is_active: Joi.boolean().optional().default(true),
});

// POST /api/v1/workflows - Create new workflow
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { error, value } = createWorkflowSchema.validate(req.body);
    if (error) {
      logger.warn(`Workflow creation validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    const workflow = await workflowRepo.createWorkflow(
      value.organization_id,
      value.name,
      value.description,
      value.definition,
      req.user?.id as string,
      value.is_active
    );

    logger.info(`Workflow created: ${workflow.id} by user ${req.user?.id}`);
    res.status(201).json(workflow);
  } catch (err: any) {
    logger.error(`Workflow creation failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

// GET /api/v1/workflows/:id - Get workflow by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const workflow = await workflowRepo.getWorkflowById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    logger.info(`Workflow retrieved: ${workflow.id}`);
    res.json(workflow);
  } catch (err: any) {
    logger.error(`Workflow retrieval failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to retrieve workflow' });
  }
});

// GET /api/v1/workflows - List workflows by organization
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = req.query.organization_id as string;
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    if (!organizationId) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const workflows = await workflowRepo.listWorkflows(organizationId, offset, limit);
    res.json(workflows);
  } catch (err: any) {
    logger.error(`Workflow listing failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to list workflows' });
  }
});

// PUT /api/v1/workflows/:id - Update workflow
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { error, value } = updateWorkflowSchema.validate(req.body);
    if (error) {
      logger.warn(`Workflow update validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    const workflow = await workflowRepo.updateWorkflow(req.params.id, value);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    logger.info(`Workflow updated: ${workflow.id} by user ${req.user?.id}`);
    res.json(workflow);
  } catch (err: any) {
    logger.error(`Workflow update failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

// DELETE /api/v1/workflows/:id - Delete workflow
router.delete('/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const deleted = await workflowRepo.deleteWorkflow(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    logger.info(`Workflow deleted: ${req.params.id} by user ${req.user?.id}`);
    res.json({ message: 'Workflow deleted' });
  } catch (err: any) {
    logger.error(`Workflow deletion failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

// POST /api/v1/workflows/:id/executions - Create workflow execution
router.post('/:id/executions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { error, value } = createExecutionSchema.validate(req.body);
    if (error) {
      logger.warn(`Execution creation validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    const execution = await workflowRepo.createExecution(
      value.workflow_id,
      req.user?.id as string,
      value.inputs || {},
      'pending'
    );

    logger.info(`Workflow execution created: ${execution.id} for workflow ${value.workflow_id}`);
    res.status(201).json(execution);
  } catch (err: any) {
    logger.error(`Execution creation failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to create execution' });
  }
});

// GET /api/v1/workflows/:id/executions - List workflow executions
router.get('/:id/executions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const executions = await workflowRepo.listExecutions(req.params.id, offset, limit);
    res.json(executions);
  } catch (err: any) {
    logger.error(`Execution listing failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to list executions' });
  }
});

// PUT /api/v1/workflows/executions/:executionId - Update execution
router.put('/executions/:executionId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { error, value } = updateExecutionSchema.validate(req.body);
    if (error) {
      logger.warn(`Execution update validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    const execution = await workflowRepo.updateExecution(req.params.executionId, value);
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    logger.info(`Execution updated: ${execution.id} status=${value.status}`);
    res.json(execution);
  } catch (err: any) {
    logger.error(`Execution update failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to update execution' });
  }
});

// POST /api/v1/workflows/:id/schedules - Create workflow schedule
router.post('/:id/schedules', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { error, value } = createScheduleSchema.validate(req.body);
    if (error) {
      logger.warn(`Schedule creation validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    const schedule = await workflowRepo.createSchedule(
      value.workflow_id,
      value.cron_expression,
      value.timezone,
      value.is_active
    );

    logger.info(`Workflow schedule created: ${schedule.id} for workflow ${value.workflow_id}`);
    res.status(201).json(schedule);
  } catch (err: any) {
    logger.error(`Schedule creation failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
});

// GET /api/v1/workflows/:id/schedules - Get workflow schedules
router.get('/:id/schedules', authenticateToken, async (req: Request, res: Response) => {
  try {
    const schedules = await workflowRepo.getWorkflowSchedules(req.params.id);
    res.json(schedules);
  } catch (err: any) {
    logger.error(`Schedule retrieval failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to retrieve schedules' });
  }
});

// GET /api/v1/workflows/:id/stats - Get execution statistics
router.get('/:id/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const stats = await workflowRepo.getExecutionStats(req.params.id);
    res.json(stats);
  } catch (err: any) {
    logger.error(`Stats retrieval failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

export default router;
