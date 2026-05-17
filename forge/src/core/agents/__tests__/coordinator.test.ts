/**
 * Agent Coordinator Tests
 */

import { AgentCoordinator, type ExecutionRequest } from '../coordinator';
import { createDefaultRegistry, type AgentConfig } from '../registry';

describe('AgentCoordinator', () => {
  let coordinator: AgentCoordinator;

  beforeEach(() => {
    const registry = createDefaultRegistry();

    // Register a test agent
    const testConfig: AgentConfig = {
      name: 'Test Agent',
      description: 'Test agent for testing',
      model: registry.getModels()[0],
      capabilities: ['code_generation', 'reasoning'],
      maxConcurrentTasks: 5,
      timeoutMs: 30000,
      retryPolicy: {
        maxRetries: 3,
        initialBackoffMs: 100,
        maxBackoffMs: 5000
      }
    };

    registry.register(testConfig);
    coordinator = new AgentCoordinator(registry);
  });

  describe('selectAgent', () => {
    it('should select agent with required capabilities', () => {
      const request: ExecutionRequest = {
        taskId: 'task-1',
        description: 'Generate code',
        requiredCapabilities: ['code_generation'],
        priority: 'normal'
      };

      const selection = coordinator.selectAgent(request);
      expect(selection).not.toBeNull();
      expect(selection?.agent.config.capabilities).toContain('code_generation');
    });

    it('should return null when no suitable agent found', () => {
      const request: ExecutionRequest = {
        taskId: 'task-1',
        description: 'Do impossible task',
        requiredCapabilities: ['nonexistent_capability'],
        priority: 'normal'
      };

      const selection = coordinator.selectAgent(request);
      expect(selection).toBeNull();
    });

    it('should prefer agents with better health', () => {
      const request: ExecutionRequest = {
        taskId: 'task-1',
        description: 'Test task',
        requiredCapabilities: ['reasoning'],
        priority: 'normal'
      };

      const selection = coordinator.selectAgent(request);
      expect(selection).not.toBeNull();
      expect(selection?.score).toBeGreaterThan(0);
    });
  });

  describe('selectAgents', () => {
    it('should select multiple agents', () => {
      const request: ExecutionRequest = {
        taskId: 'task-1',
        description: 'Test task',
        requiredCapabilities: ['code_generation'],
        priority: 'high'
      };

      const selections = coordinator.selectAgents(request, 3);
      expect(selections.length).toBeGreaterThan(0);
    });

    it('should respect count limit', () => {
      const request: ExecutionRequest = {
        taskId: 'task-1',
        description: 'Test task',
        requiredCapabilities: ['reasoning'],
        priority: 'normal'
      };

      const selections = coordinator.selectAgents(request, 2);
      expect(selections.length).toBeLessThanOrEqual(2);
    });
  });

  describe('execute', () => {
    it('should execute task and return result', async () => {
      const request: ExecutionRequest = {
        taskId: 'task-1',
        description: 'Generate code',
        requiredCapabilities: ['code_generation'],
        priority: 'normal'
      };

      const result = await coordinator.execute(request);
      expect(result.taskId).toBe('task-1');
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing capabilities gracefully', async () => {
      const request: ExecutionRequest = {
        taskId: 'task-2',
        description: 'Do impossible task',
        requiredCapabilities: ['nonexistent_capability'],
        priority: 'normal'
      };

      const result = await coordinator.execute(request);
      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
    });

    it('should record execution in history', async () => {
      const request: ExecutionRequest = {
        taskId: 'task-3',
        description: 'Test task',
        requiredCapabilities: ['reasoning'],
        priority: 'normal'
      };

      await coordinator.execute(request);
      const history = coordinator.getExecutionHistory();
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('executeWithFallback', () => {
    it('should retry with different agents on failure', async () => {
      const request: ExecutionRequest = {
        taskId: 'task-4',
        description: 'Test task with fallback',
        requiredCapabilities: ['code_generation'],
        priority: 'high'
      };

      const result = await coordinator.executeWithFallback(request, 3);
      expect(result.taskId).toBe('task-4');
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('executeParallel', () => {
    it('should execute with multiple agents in parallel', async () => {
      const request: ExecutionRequest = {
        taskId: 'task-5',
        description: 'Parallel execution test',
        requiredCapabilities: ['reasoning'],
        priority: 'normal'
      };

      const results = await coordinator.executeParallel(request);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].executionTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getStats', () => {
    it('should return coordinator statistics', async () => {
      const request: ExecutionRequest = {
        taskId: 'task-6',
        description: 'Stats test',
        requiredCapabilities: ['code_generation'],
        priority: 'normal'
      };

      await coordinator.execute(request);
      const stats = coordinator.getStats();

      expect(stats.totalExecutions).toBeGreaterThan(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.avgExecutionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('clearHistory', () => {
    it('should clear execution history', async () => {
      const request: ExecutionRequest = {
        taskId: 'task-7',
        description: 'Clear history test',
        requiredCapabilities: ['reasoning'],
        priority: 'normal'
      };

      await coordinator.execute(request);
      let history = coordinator.getExecutionHistory();
      expect(history.length).toBeGreaterThan(0);

      coordinator.clearHistory();
      history = coordinator.getExecutionHistory();
      expect(history.length).toBe(0);
    });
  });
});
