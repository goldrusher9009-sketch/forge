/**
 * Execution Repository Tests
 */

import { ExecutionRepository, Execution } from './execution';
import { DatabaseConnection } from '../connection';

describe('ExecutionRepository', () => {
  let repository: ExecutionRepository;
  let connection: DatabaseConnection;

  beforeEach(async () => {
    const config = {
      driver: 'sqlite' as const,
      database: ':memory:',
      poolSize: 5
    };
    connection = new DatabaseConnection(config);
    await connection.initialize();
    repository = new ExecutionRepository(connection);

    // Create test table
    const conn = await connection.acquire();
    try {
      await conn.exec(`
        CREATE TABLE IF NOT EXISTS executions (
          id TEXT PRIMARY KEY,
          taskId TEXT NOT NULL,
          agentId TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          startedAt TIMESTAMP,
          completedAt TIMESTAMP,
          duration INTEGER,
          result TEXT,
          error TEXT,
          retryCount INTEGER DEFAULT 0,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } finally {
      connection.release(conn);
    }
  });

  afterEach(async () => {
    await connection.drain();
  });

  describe('findByTaskId', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'exec-1',
        taskId: 'task-1',
        agentId: 'agent-1',
        status: 'completed',
        retryCount: 0
      });
      await repository.create({
        id: 'exec-2',
        taskId: 'task-1',
        agentId: 'agent-2',
        status: 'failed',
        retryCount: 1
      });
    });

    it('should find executions by task ID', async () => {
      const executions = await repository.findByTaskId('task-1');
      expect(executions.length).toBe(2);
      expect(executions.every(e => e.taskId === 'task-1')).toBe(true);
    });
  });

  describe('findByAgentId', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'exec-1',
        taskId: 'task-1',
        agentId: 'agent-1',
        status: 'completed',
        retryCount: 0
      });
      await repository.create({
        id: 'exec-2',
        taskId: 'task-2',
        agentId: 'agent-1',
        status: 'running',
        retryCount: 0
      });
    });

    it('should find executions by agent ID', async () => {
      const executions = await repository.findByAgentId('agent-1');
      expect(executions.length).toBe(2);
      expect(executions.every(e => e.agentId === 'agent-1')).toBe(true);
    });
  });

  describe('findByStatus', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'exec-1',
        taskId: 'task-1',
        agentId: 'agent-1',
        status: 'completed',
        retryCount: 0
      });
      await repository.create({
        id: 'exec-2',
        taskId: 'task-2',
        agentId: 'agent-2',
        status: 'failed',
        retryCount: 0
      });
    });

    it('should find executions by status', async () => {
      const completed = await repository.findByStatus('completed');
      expect(completed.length).toBe(1);
      expect(completed[0]?.status).toBe('completed');

      const failed = await repository.findByStatus('failed');
      expect(failed.length).toBe(1);
      expect(failed[0]?.status).toBe('failed');
    });
  });

  describe('getLatestForTask', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'exec-1',
        taskId: 'task-1',
        agentId: 'agent-1',
        status: 'completed',
        retryCount: 0
      });
      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      await repository.create({
        id: 'exec-2',
        taskId: 'task-1',
        agentId: 'agent-2',
        status: 'failed',
        retryCount: 1
      });
    });

    it('should get the latest execution for a task', async () => {
      const latest = await repository.getLatestForTask('task-1');
      expect(latest?.id).toBe('exec-2');
    });
  });

  describe('markStarted', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'exec-1',
        taskId: 'task-1',
        agentId: 'agent-1',
        status: 'pending',
        retryCount: 0
      });
    });

    it('should mark execution as started', async () => {
      const now = new Date();
      await repository.markStarted('exec-1', now);

      const exec = await repository.findById('exec-1');
      expect(exec?.status).toBe('running');
      expect(exec?.startedAt).toBeTruthy();
    });
  });

  describe('markCompleted', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'exec-1',
        taskId: 'task-1',
        agentId: 'agent-1',
        status: 'running',
        startedAt: new Date(Date.now() - 5000),
        retryCount: 0
      });
    });

    it('should mark execution as completed with result and duration', async () => {
      const completedAt = new Date();
      const result = { output: 'success' };

      await repository.markCompleted('exec-1', completedAt, result);

      const exec = await repository.findById('exec-1');
      expect(exec?.status).toBe('completed');
      expect(exec?.completedAt).toBeTruthy();
      expect(exec?.duration).toBeGreaterThan(0);
      expect(exec?.result).toEqual(result);
    });
  });

  describe('markFailed', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'exec-1',
        taskId: 'task-1',
        agentId: 'agent-1',
        status: 'running',
        startedAt: new Date(Date.now() - 5000),
        retryCount: 0
      });
    });

    it('should mark execution as failed with error message', async () => {
      const completedAt = new Date();
      await repository.markFailed('exec-1', 'Timeout error', completedAt);

      const exec = await repository.findById('exec-1');
      expect(exec?.status).toBe('failed');
      expect(exec?.error).toBe('Timeout error');
      expect(exec?.completedAt).toBeTruthy();
    });
  });

  describe('markCancelled', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'exec-1',
        taskId: 'task-1',
        agentId: 'agent-1',
        status: 'running',
        retryCount: 0
      });
    });

    it('should mark execution as cancelled', async () => {
      await repository.markCancelled('exec-1');

      const exec = await repository.findById('exec-1');
      expect(exec?.status).toBe('cancelled');
    });
  });

  describe('incrementRetry', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'exec-1',
        taskId: 'task-1',
        agentId: 'agent-1',
        status: 'failed',
        retryCount: 2
      });
    });

    it('should increment retry count', async () => {
      await repository.incrementRetry('exec-1');

      const exec = await repository.findById('exec-1');
      expect(exec?.retryCount).toBe(3);
    });
  });

  describe('findPending', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'exec-1',
        taskId: 'task-1',
        agentId: 'agent-1',
        status: 'pending',
        retryCount: 0
      });
      await repository.create({
        id: 'exec-2',
        taskId: 'task-2',
        agentId: 'agent-2',
        status: 'running',
        retryCount: 0
      });
    });

    it('should find pending executions', async () => {
      const pending = await repository.findPending();
      expect(pending.length).toBe(1);
      expect(pending[0]?.status).toBe('pending');
    });
  });

  describe('countByStatus', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'exec-1',
        taskId: 'task-1',
        agentId: 'agent-1',
        status: 'completed',
        retryCount: 0
      });
      await repository.create({
        id: 'exec-2',
        taskId: 'task-2',
        agentId: 'agent-2',
        status: 'completed',
        retryCount: 0
      });
      await repository.create({
        id: 'exec-3',
        taskId: 'task-3',
        agentId: 'agent-3',
        status: 'failed',
        retryCount: 0
      });
    });

    it('should count executions by status', async () => {
      const completedCount = await repository.countByStatus('completed');
      expect(completedCount).toBe(2);

      const failedCount = await repository.countByStatus('failed');
      expect(failedCount).toBe(1);
    });
  });

  describe('getTaskStats', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'exec-1',
        taskId: 'task-1',
        agentId: 'agent-1',
        status: 'completed',
        duration: 1000,
        retryCount: 0
      });
      await repository.create({
        id: 'exec-2',
        taskId: 'task-1',
        agentId: 'agent-2',
        status: 'completed',
        duration: 2000,
        retryCount: 1
      });
      await repository.create({
        id: 'exec-3',
        taskId: 'task-1',
        agentId: 'agent-3',
        status: 'failed',
        retryCount: 0
      });
    });

    it('should calculate task statistics', async () => {
      const stats = await repository.getTaskStats('task-1');
      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.cancelled).toBe(0);
    });
  });
});
