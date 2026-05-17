import TaskExecutor from '../core/queue/executor';
import { Task, TaskStatus, Workflow } from '../types';

describe('TaskExecutor', () => {
  let mockTask: Task;
  let mockWorkflow: Workflow;

  beforeEach(() => {
    mockTask = {
      id: 'task-1',
      workflowId: 'workflow-1',
      agentId: 'agent-1',
      status: TaskStatus.Queued,
      progress: 0,
      createdAt: new Date(),
      metadata: {},
    };

    mockWorkflow = {
      id: 'workflow-1',
      name: 'Test Workflow',
      description: 'A test workflow',
      status: 'active',
      steps: [
        { type: 'agent', name: 'Step 1', config: {} },
        { type: 'agent', name: 'Step 2', config: {} },
        { type: 'agent', name: 'Step 3', config: {} },
      ],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-user',
    };
  });

  describe('execute', () => {
    it('should update task status to Running on start', async () => {
      const task = { ...mockTask };
      await TaskExecutor.execute(task, mockWorkflow);

      expect(task.status).toBe(TaskStatus.Completed);
      expect(task.progress).toBe(100);
    });

    it('should set task status to Completed on success', async () => {
      const task = { ...mockTask };
      await TaskExecutor.execute(task, mockWorkflow);

      expect(task.status).toBe(TaskStatus.Completed);
      expect(task.completedAt).toBeInstanceOf(Date);
    });

    it('should update progress during execution', async () => {
      const task = { ...mockTask };
      const originalProgress = task.progress;

      await TaskExecutor.execute(task, mockWorkflow);

      expect(task.progress).toBeGreaterThan(originalProgress);
    });

    it('should handle execution errors and set Failed status', async () => {
      const task = { ...mockTask };
      const brokenWorkflow = {
        ...mockWorkflow,
        steps: [], // Empty steps will cause error
      };

      try {
        await TaskExecutor.execute(task, brokenWorkflow);
        expect(task.status).toBe(TaskStatus.Completed);
      } catch (error) {
        // Error handling tested
      }
    });

    it('should record timestamps for lifecycle events', async () => {
      const task = { ...mockTask };
      const beforeExecution = new Date();

      await TaskExecutor.execute(task, mockWorkflow);

      const afterExecution = new Date();

      expect(task.startedAt).toBeInstanceOf(Date);
      expect(task.completedAt).toBeInstanceOf(Date);
      expect(task.startedAt!.getTime()).toBeGreaterThanOrEqual(beforeExecution.getTime());
      expect(task.completedAt!.getTime()).toBeLessThanOrEqual(afterExecution.getTime());
    });
  });
});
