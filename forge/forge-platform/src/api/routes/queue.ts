import { Router, Request, Response } from 'express';
import { Task, TaskStatus, QueueStatus, QueueStats, ApiResponse } from '../../types';
import { verifyAuth } from '../middleware/auth';

const router = Router();

// Mock data
const tasks = new Map<string, Task>();

// Get queue status
router.get('/', async (req: Request, res: Response) => {
  try {
    const taskList = Array.from(tasks.values());
    const stats: QueueStats = {
      total: taskList.length,
      running: taskList.filter(t => t.status === TaskStatus.Running).length,
      completed: taskList.filter(t => t.status === TaskStatus.Completed).length,
      failed: taskList.filter(t => t.status === TaskStatus.Failed).length,
      queued: taskList.filter(t => t.status === TaskStatus.Queued).length,
      avgDuration: taskList.filter(t => t.completedAt && t.startedAt)
        .reduce((sum, t) => sum + (t.completedAt!.getTime() - t.startedAt!.getTime()), 0) /
        Math.max(taskList.filter(t => t.completedAt).length, 1),
    };

    const status: QueueStatus = {
      healthy: true,
      stats,
      lastUpdate: new Date(),
    };

    res.json({
      success: true,
      data: {
        tasks: taskList,
        status,
        stats,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch queue status',
      timestamp: new Date(),
    });
  }
});

// Get task by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const task = tasks.get(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        timestamp: new Date(),
      });
    }
    res.json({
      success: true,
      data: task,
      timestamp: new Date(),
    } as ApiResponse<Task>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task',
      timestamp: new Date(),
    });
  }
});

// Cancel task
router.post('/:id/cancel', verifyAuth, async (req: Request, res: Response) => {
  try {
    const task = tasks.get(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        timestamp: new Date(),
      });
    }

    if (task.status === TaskStatus.Running || task.status === TaskStatus.Queued) {
      task.status = TaskStatus.Cancelled;
      tasks.set(task.id, task);
    }

    res.json({
      success: true,
      data: task,
      timestamp: new Date(),
    } as ApiResponse<Task>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to cancel task',
      timestamp: new Date(),
    });
  }
});

// Enqueue task
router.post('/', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { workflowId, agentId, metadata } = req.body;

    const task: Task = {
      id: `task-${Date.now()}`,
      workflowId,
      agentId,
      status: TaskStatus.Queued,
      progress: 0,
      createdAt: new Date(),
      metadata,
    };

    tasks.set(task.id, task);

    res.status(201).json({
      success: true,
      data: task,
      timestamp: new Date(),
    } as ApiResponse<Task>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to enqueue task',
      timestamp: new Date(),
    });
  }
});

export default router;
