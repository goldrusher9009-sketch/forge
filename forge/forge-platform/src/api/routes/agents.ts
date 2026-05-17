import { Router, Request, Response } from 'express';
import { Agent, ApiResponse } from '../../types';
import { verifyAuth } from '../middleware/auth';

const router = Router();

// Mock data
const agents = new Map<string, Agent>();

// Get all agents
router.get('/', async (req: Request, res: Response) => {
  try {
    const agentList = Array.from(agents.values());
    res.json({
      success: true,
      data: agentList,
      timestamp: new Date(),
    } as ApiResponse<Agent[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents',
      timestamp: new Date(),
    });
  }
});

// Get agent by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const agent = agents.get(req.params.id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
        timestamp: new Date(),
      });
    }
    res.json({
      success: true,
      data: agent,
      timestamp: new Date(),
    } as ApiResponse<Agent>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent',
      timestamp: new Date(),
    });
  }
});

// Create agent
router.post('/', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, model, provider, capabilities, systemPrompt, temperature, maxTokens, tools } = req.body;

    const agent: Agent = {
      id: `agent-${Date.now()}`,
      name,
      description,
      model,
      provider,
      capabilities,
      systemPrompt,
      temperature,
      maxTokens,
      tools,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    agents.set(agent.id, agent);

    res.status(201).json({
      success: true,
      data: agent,
      timestamp: new Date(),
    } as ApiResponse<Agent>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create agent',
      timestamp: new Date(),
    });
  }
});

// Update agent
router.put('/:id', verifyAuth, async (req: Request, res: Response) => {
  try {
    const agent = agents.get(req.params.id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
        timestamp: new Date(),
      });
    }

    const updated = { ...agent, ...req.body, updatedAt: new Date() };
    agents.set(agent.id, updated);

    res.json({
      success: true,
      data: updated,
      timestamp: new Date(),
    } as ApiResponse<Agent>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update agent',
      timestamp: new Date(),
    });
  }
});

// Delete agent
router.delete('/:id', verifyAuth, async (req: Request, res: Response) => {
  try {
    agents.delete(req.params.id);
    res.json({
      success: true,
      data: { id: req.params.id },
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete agent',
      timestamp: new Date(),
    });
  }
});

export default router;
