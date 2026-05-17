import { Router, Request, Response } from 'express';
import { Workflow, ApiResponse } from '../../types';
import { verifyAuth } from '../middleware/auth';

const router = Router();

// Mock data
const workflows = new Map<string, Workflow>();

// Get all workflows
router.get('/', async (req: Request, res: Response) => {
  try {
    const workflowList = Array.from(workflows.values());
    res.json({
      success: true,
      data: workflowList,
      timestamp: new Date(),
    } as ApiResponse<Workflow[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflows',
      timestamp: new Date(),
    });
  }
});

// Get workflow by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const workflow = workflows.get(req.params.id);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
        timestamp: new Date(),
      });
    }
    res.json({
      success: true,
      data: workflow,
      timestamp: new Date(),
    } as ApiResponse<Workflow>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow',
      timestamp: new Date(),
    });
  }
});

// Create workflow
router.post('/', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, steps } = req.body;

    const workflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name,
      description,
      status: 'draft',
      steps: steps || [],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.userId || 'system',
    };

    workflows.set(workflow.id, workflow);

    res.status(201).json({
      success: true,
      data: workflow,
      timestamp: new Date(),
    } as ApiResponse<Workflow>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create workflow',
      timestamp: new Date(),
    });
  }
});

// Update workflow
router.put('/:id', verifyAuth, async (req: Request, res: Response) => {
  try {
    const workflow = workflows.get(req.params.id);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
        timestamp: new Date(),
      });
    }

    const updated = { ...workflow, ...req.body, updatedAt: new Date() };
    workflows.set(workflow.id, updated);

    res.json({
      success: true,
      data: updated,
      timestamp: new Date(),
    } as ApiResponse<Workflow>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update workflow',
      timestamp: new Date(),
    });
  }
});

// Delete workflow
router.delete('/:id', verifyAuth, async (req: Request, res: Response) => {
  try {
    workflows.delete(req.params.id);
    res.json({
      success: true,
      data: { id: req.params.id },
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete workflow',
      timestamp: new Date(),
    });
  }
});

export default router;
