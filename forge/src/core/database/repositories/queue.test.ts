/**
 * Queue Repository Tests
 */

import { QueueRepository, QueueEntry } from './queue';
import { DatabaseConnection } from '../connection';

describe('QueueRepository', () => {
  let repository: QueueRepository;
  let connection: DatabaseConnection;

  beforeEach(async () => {
    const config = {
      driver: 'sqlite' as const,
      database: ':memory:',
      poolSize: 5
    };
    connection = new DatabaseConnection(config);
    await connection.initialize();
    repository = new QueueRepository(connection);

    // Create test table
    const conn = await connection.acquire();
    try {
      await conn.exec(`
        CREATE TABLE IF NOT EXISTS queue_entries (
          id TEXT PRIMARY KEY,
          taskId TEXT NOT NULL,
          status TEXT DEFAULT 'queued',
          priority INTEGER NOT NULL,
          assignedAgentId TEXT,
          assignedAt TIMESTAMP,
          startedAt TIMESTAMP,
          completedAt TIMESTAMP,
          retryCount INTEGER DEFAULT 0,
          maxRetries INTEGER NOT NULL,
          metadata TEXT,
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

  describe('findQueued', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'queue-1',
        taskId: 'task-1',
        status: 'queued',
        priority: 10,
        retryCount: 0,
        maxRetries: 3
      });
      await repository.create({
        id: 'queue-2',
        taskId: 'task-2',
        status: 'queued',
        priority: 5,
        retryCount: 0,
        maxRetries: 3
      });
      await repository.create({
        id: 'queue-3',
        taskId: 'task-3',
        status: 'processing',
        priority: 15,
        retryCount: 0,
        maxRetries: 3
      });
    });

    it('should find queued entries ordered by priority descending', async () => {
      const queued = await repository.findQueued();
      expect(queued.length).toBe(2);
      expect(queued[0]?.id).toBe('queue-1'); // priority 10
      expect(queued[1]?.id).toBe('queue-2'); // priority 5
      expect(queued.every(e => e.status === 'queued')).toBe(true);
    });
  });

  describe('findAssignedToAgent', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'queue-1',
        taskId: 'task-1',
        status: 'processing',
        priority: 10,
        assignedAgentId: 'agent-1',
        assignedAt: new Date(),
        startedAt: new Date(),
        retryCount: 0,
        maxRetries: 3
      });
      await repository.create({
        id: 'queue-2',
        taskId: 'task-2',
        status: 'processing',
        priority: 5,
        assignedAgentId: 'agent-2',
        assignedAt: new Date(),
        startedAt: new Date(),
        retryCount: 0,
        maxRetries: 3
      });
    });

    it('should find entries assigned to a specific agent', async () => {
      const assigned = await repository.findAssignedToAgent('agent-1');
      expect(assigned.length).toBe(1);
      expect(assigned[0]?.assignedAgentId).toBe('agent-1');
    });
  });

  describe('findByStatus', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'queue-1',
        taskId: 'task-1',
        status: 'queued',
        priority: 10,
        retryCount: 0,
        maxRetries: 3
      });
      await repository.create({
        id: 'queue-2',
        taskId: 'task-2',
        status: 'completed',
        priority: 5,
        retryCount: 0,
        maxRetries: 3,
        completedAt: new Date()
      });
    });

    it('should find entries by specific status', async () => {
      const queued = await repository.findByStatus('queued');
      expect(queued.length).toBe(1);
      expect(queued[0]?.status).toBe('queued');

      const completed = await repository.findByStatus('completed');
      expect(completed.length).toBe(1);
      expect(completed[0]?.status).toBe('completed');
    });
  });

  describe('nextQueued', () => {
    beforeEach(async () => {
      // Add small delays to ensure different timestamps
      await repository.create({
        id: 'queue-1',
        taskId: 'task-1',
        status: 'queued',
        priority: 5,
        retryCount: 0,
        maxRetries: 3
      });
      await new Promise(resolve => setTimeout(resolve, 10));
      await repository.create({
        id: 'queue-2',
        taskId: 'task-2',
        status: 'queued',
        priority: 10,
        retryCount: 0,
        maxRetries: 3
      });
    });

    it('should get next queued entry by priority', async () => {
      const next = await repository.nextQueued();
      expect(next?.id).toBe('queue-2'); // priority 10
    });
  });

  describe('assignToAgent', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'queue-1',
        taskId: 'task-1',
        status: 'queued',
        priority: 10,
        retryCount: 0,
        maxRetries: 3
      });
    });

    it('should assign entry to an agent', async () => {
      await repository.assignToAgent('queue-1', 'agent-1');

      const entry = await repository.findById('queue-1');
      expect(entry?.status).toBe('assigned');
      expect(entry?.assignedAgentId).toBe('agent-1');
      expect(entry?.assignedAt).toBeTruthy();
    });
  });

  describe('markProcessing', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'queue-1',
        taskId: 'task-1',
        status: 'assigned',
        priority: 10,
        assignedAgentId: 'agent-1',
        assignedAt: new Date(),
        retryCount: 0,
        maxRetries: 3
      });
    });

    it('should mark entry as processing', async () => {
      await repository.markProcessing('queue-1');

      const entry = await repository.findById('queue-1');
      expect(entry?.status).toBe('processing');
      expect(entry?.startedAt).toBeTruthy();
    });
  });

  describe('markCompleted', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'queue-1',
        taskId: 'task-1',
        status: 'processing',
        priority: 10,
        assignedAgentId: 'agent-1',
        assignedAt: new Date(),
        startedAt: new Date(),
        retryCount: 0,
        maxRetries: 3
      });
    });

    it('should mark entry as completed', async () => {
      await repository.markCompleted('queue-1');

      const entry = await repository.findById('queue-1');
      expect(entry?.status).toBe('completed');
      expect(entry?.completedAt).toBeTruthy();
    });
  });

  describe('markFailed', () => {
    describe('when retries remaining', () => {
      beforeEach(async () => {
        await repository.create({
          id: 'queue-1',
          taskId: 'task-1',
          status: 'processing',
          priority: 10,
          assignedAgentId: 'agent-1',
          assignedAt: new Date(),
          startedAt: new Date(),
          retryCount: 0,
          maxRetries: 3
        });
      });

      it('should mark as retrying and increment retry count', async () => {
        const canRetry = await repository.markFailed('queue-1');

        expect(canRetry).toBe(true);
        const entry = await repository.findById('queue-1');
        expect(entry?.status).toBe('retrying');
        expect(entry?.retryCount).toBe(1);
        expect(entry?.completedAt).toBeTruthy();
      });
    });

    describe('when max retries exceeded', () => {
      beforeEach(async () => {
        await repository.create({
          id: 'queue-1',
          taskId: 'task-1',
          status: 'processing',
          priority: 10,
          assignedAgentId: 'agent-1',
          assignedAt: new Date(),
          startedAt: new Date(),
          retryCount: 3,
          maxRetries: 3
        });
      });

      it('should mark as failed and not allow retry', async () => {
        const canRetry = await repository.markFailed('queue-1');

        expect(canRetry).toBe(false);
        const entry = await repository.findById('queue-1');
        expect(entry?.status).toBe('failed');
        expect(entry?.retryCount).toBe(4);
      });
    });
  });

  describe('resetForRetry', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'queue-1',
        taskId: 'task-1',
        status: 'retrying',
        priority: 10,
        assignedAgentId: 'agent-1',
        assignedAt: new Date(),
        startedAt: new Date(),
        retryCount: 1,
        maxRetries: 3
      });
    });

    it('should reset entry back to queued for retry', async () => {
      await repository.resetForRetry('queue-1');

      const entry = await repository.findById('queue-1');
      expect(entry?.status).toBe('queued');
      expect(entry?.assignedAgentId).toBeNull();
      expect(entry?.assignedAt).toBeNull();
      expect(entry?.startedAt).toBeNull();
    });
  });

  describe('countByStatus', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'queue-1',
        taskId: 'task-1',
        status: 'completed',
        priority: 10,
        retryCount: 0,
        maxRetries: 3,
        completedAt: new Date()
      });
      await repository.create({
        id: 'queue-2',
        taskId: 'task-2',
        status: 'completed',
        priority: 5,
        retryCount: 0,
        maxRetries: 3,
        completedAt: new Date()
      });
      await repository.create({
        id: 'queue-3',
        taskId: 'task-3',
        status: 'failed',
        priority: 15,
        retryCount: 0,
        maxRetries: 3
      });
    });

    it('should count entries by status', async () => {
      const completedCount = await repository.countByStatus('completed');
      expect(completedCount).toBe(2);

      const failedCount = await repository.countByStatus('failed');
      expect(failedCount).toBe(1);
    });
  });

  describe('getQueueStats', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'queue-1',
        taskId: 'task-1',
        status: 'queued',
        priority: 10,
        retryCount: 0,
        maxRetries: 3
      });
      await repository.create({
        id: 'queue-2',
        taskId: 'task-2',
        status: 'queued',
        priority: 5,
        retryCount: 0,
        maxRetries: 3
      });
      await repository.create({
        id: 'queue-3',
        taskId: 'task-3',
        status: 'assigned',
        priority: 15,
        assignedAgentId: 'agent-1',
        assignedAt: new Date(),
        retryCount: 0,
        maxRetries: 3
      });
      await repository.create({
        id: 'queue-4',
        taskId: 'task-4',
        status: 'processing',
        priority: 8,
        assignedAgentId: 'agent-1',
        assignedAt: new Date(),
        startedAt: new Date(),
        retryCount: 0,
        maxRetries: 3
      });
      await repository.create({
        id: 'queue-5',
        taskId: 'task-5',
        status: 'completed',
        priority: 3,
        retryCount: 0,
        maxRetries: 3,
        completedAt: new Date()
      });
    });

    it('should calculate queue statistics', async () => {
      const stats = await repository.getQueueStats();

      expect(stats.queued).toBe(2);
      expect(stats.assigned).toBe(1);
      expect(stats.processing).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(0);
      expect(stats.retrying).toBe(0);
      expect(stats.avgPriority).toBeGreaterThan(0);
      expect(stats.avgPriority).toBeLessThanOrEqual(10); // Average of 10 and 5
    });
  });

  describe('findAssignedTimeout', () => {
    beforeEach(async () => {
      const oldTime = new Date(Date.now() - 30000); // 30 seconds ago
      const newTime = new Date(Date.now() - 5000);  // 5 seconds ago

      await repository.create({
        id: 'queue-1',
        taskId: 'task-1',
        status: 'assigned',
        priority: 10,
        assignedAgentId: 'agent-1',
        assignedAt: oldTime,
        retryCount: 0,
        maxRetries: 3
      });
      await repository.create({
        id: 'queue-2',
        taskId: 'task-2',
        status: 'assigned',
        priority: 5,
        assignedAgentId: 'agent-2',
        assignedAt: newTime,
        retryCount: 0,
        maxRetries: 3
      });
    });

    it('should find assigned entries that exceeded timeout threshold', async () => {
      const timeout = await repository.findAssignedTimeout(10000); // 10 second threshold
      expect(timeout.length).toBeGreaterThanOrEqual(1);
      expect(timeout[0]?.status).toBe('assigned');
    });
  });

  describe('findProcessingTimeout', () => {
    beforeEach(async () => {
      const oldTime = new Date(Date.now() - 30000); // 30 seconds ago
      const newTime = new Date(Date.now() - 5000);  // 5 seconds ago

      await repository.create({
        id: 'queue-1',
        taskId: 'task-1',
        status: 'processing',
        priority: 10,
        assignedAgentId: 'agent-1',
        assignedAt: oldTime,
        startedAt: oldTime,
        retryCount: 0,
        maxRetries: 3
      });
      await repository.create({
        id: 'queue-2',
        taskId: 'task-2',
        status: 'processing',
        priority: 5,
        assignedAgentId: 'agent-2',
        assignedAt: newTime,
        startedAt: newTime,
        retryCount: 0,
        maxRetries: 3
      });
    });

    it('should find processing entries that exceeded timeout threshold', async () => {
      const timeout = await repository.findProcessingTimeout(10000); // 10 second threshold
      expect(timeout.length).toBeGreaterThanOrEqual(1);
      expect(timeout[0]?.status).toBe('processing');
    });
  });

  describe('requeue', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'queue-1',
        taskId: 'task-1',
        status: 'failed',
        priority: 10,
        retryCount: 0,
        maxRetries: 3
      });
      await repository.create({
        id: 'queue-2',
        taskId: 'task-2',
        status: 'failed',
        priority: 5,
        retryCount: 3,
        maxRetries: 3
      });
      await repository.create({
        id: 'queue-3',
        taskId: 'task-3',
        status: 'failed',
        priority: 15,
        retryCount: 2,
        maxRetries: 3
      });
    });

    it('should requeue failed entries that are still retryable', async () => {
      const requeuedCount = await repository.requeue(['queue-1', 'queue-2', 'queue-3']);

      expect(requeuedCount).toBe(2); // queue-1 and queue-3

      const queue1 = await repository.findById('queue-1');
      expect(queue1?.status).toBe('queued');

      const queue2 = await repository.findById('queue-2');
      expect(queue2?.status).toBe('failed'); // Not requeued (max retries exceeded)

      const queue3 = await repository.findById('queue-3');
      expect(queue3?.status).toBe('queued');
    });
  });

  describe('clearOldCompleted', () => {
    beforeEach(async () => {
      const oldTime = new Date(Date.now() - 60000); // 60 seconds ago
      const newTime = new Date(Date.now() - 5000);  // 5 seconds ago

      await repository.create({
        id: 'queue-1',
        taskId: 'task-1',
        status: 'completed',
        priority: 10,
        retryCount: 0,
        maxRetries: 3,
        completedAt: oldTime
      });
      await repository.create({
        id: 'queue-2',
        taskId: 'task-2',
        status: 'completed',
        priority: 5,
        retryCount: 0,
        maxRetries: 3,
        completedAt: newTime
      });
    });

    it('should delete completed entries older than retention period', async () => {
      const beforeCount = await repository.countByStatus('completed');
      expect(beforeCount).toBe(2);

      await repository.clearOldCompleted(30000); // 30 second retention

      const afterCount = await repository.countByStatus('completed');
      expect(afterCount).toBeLessThan(beforeCount);
    });
  });
});
