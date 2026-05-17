/**
 * Queue Repository
 *
 * Data access layer for task queue entries and their state transitions.
 */

import { Repository, QueryOptions } from '../repository';
import { DatabaseConnection } from '../connection';

export interface QueueEntry {
  id: string;
  taskId: string;
  status: 'queued' | 'assigned' | 'processing' | 'completed' | 'failed' | 'retrying';
  priority: number;
  assignedAgentId?: string;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Queue Repository
 *
 * Manages persistence of queue entries and queue state transitions.
 */
export class QueueRepository extends Repository<QueueEntry> {
  constructor(connection: DatabaseConnection) {
    super('queue_entries', connection);
  }

  /**
   * Find queued entries ordered by priority
   */
  async findQueued(options?: Partial<QueryOptions>): Promise<QueueEntry[]> {
    return this.find({
      ...options,
      where: { ...options?.where, status: 'queued' },
      orderBy: { priority: 'desc', createdAt: 'asc' }
    });
  }

  /**
   * Find entries assigned to an agent
   */
  async findAssignedToAgent(agentId: string, options?: Partial<QueryOptions>): Promise<QueueEntry[]> {
    return this.find({
      ...options,
      where: { ...options?.where, assignedAgentId: agentId, status: 'processing' }
    });
  }

  /**
   * Find entries by status
   */
  async findByStatus(
    status: QueueEntry['status'],
    options?: Partial<QueryOptions>
  ): Promise<QueueEntry[]> {
    return this.find({
      ...options,
      where: { ...options?.where, status }
    });
  }

  /**
   * Find the next queued entry by priority
   */
  async nextQueued(): Promise<QueueEntry | null> {
    return this.findOne({
      where: { status: 'queued' },
      orderBy: { priority: 'desc', createdAt: 'asc' }
    });
  }

  /**
   * Assign a queued entry to an agent
   */
  async assignToAgent(entryId: string, agentId: string): Promise<void> {
    await this.update(
      { status: 'assigned', assignedAgentId: agentId, assignedAt: new Date(), updatedAt: new Date() },
      { where: { id: entryId } }
    );
  }

  /**
   * Mark entry as processing (agent started work)
   */
  async markProcessing(entryId: string): Promise<void> {
    await this.update(
      { status: 'processing', startedAt: new Date(), updatedAt: new Date() },
      { where: { id: entryId } }
    );
  }

  /**
   * Mark entry as completed
   */
  async markCompleted(entryId: string): Promise<void> {
    await this.update(
      { status: 'completed', completedAt: new Date(), updatedAt: new Date() },
      { where: { id: entryId } }
    );
  }

  /**
   * Mark entry as failed and check if retryable
   */
  async markFailed(entryId: string): Promise<boolean> {
    const entry = await this.findById(entryId);
    if (!entry) {
      throw new Error(`Queue entry ${entryId} not found`);
    }

    const canRetry = entry.retryCount < entry.maxRetries;
    const newStatus = canRetry ? 'retrying' : 'failed';

    await this.update(
      {
        status: newStatus,
        retryCount: entry.retryCount + 1,
        completedAt: new Date(),
        updatedAt: new Date()
      },
      { where: { id: entryId } }
    );

    return canRetry;
  }

  /**
   * Reset a retrying entry back to queued
   */
  async resetForRetry(entryId: string): Promise<void> {
    await this.update(
      { status: 'queued', assignedAgentId: null, assignedAt: null, startedAt: null, updatedAt: new Date() },
      { where: { id: entryId } }
    );
  }

  /**
   * Count entries by status
   */
  async countByStatus(status: QueueEntry['status']): Promise<number> {
    return this.count({ status });
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    queued: number;
    assigned: number;
    processing: number;
    completed: number;
    failed: number;
    retrying: number;
    avgPriority: number;
  }> {
    const queued = await this.countByStatus('queued');
    const assigned = await this.countByStatus('assigned');
    const processing = await this.countByStatus('processing');
    const completed = await this.countByStatus('completed');
    const failed = await this.countByStatus('failed');
    const retrying = await this.countByStatus('retrying');

    const entries = await this.find({
      where: { status: 'queued' }
    });

    const avgPriority = entries.length > 0
      ? entries.reduce((sum, e) => sum + e.priority, 0) / entries.length
      : 0;

    return {
      queued,
      assigned,
      processing,
      completed,
      failed,
      retrying,
      avgPriority
    };
  }

  /**
   * Get entries that have been assigned but not started (potential timeout)
   */
  async findAssignedTimeout(thresholdMs: number): Promise<QueueEntry[]> {
    const cutoffTime = new Date(Date.now() - thresholdMs);
    const sql = `
      SELECT * FROM queue_entries
      WHERE status = 'assigned'
      AND assignedAt < $1
      ORDER BY assignedAt ASC
    `;
    return this.query(sql, [cutoffTime]) as Promise<QueueEntry[]>;
  }

  /**
   * Get entries that have been processing too long (potential hang)
   */
  async findProcessingTimeout(thresholdMs: number): Promise<QueueEntry[]> {
    const cutoffTime = new Date(Date.now() - thresholdMs);
    const sql = `
      SELECT * FROM queue_entries
      WHERE status = 'processing'
      AND startedAt < $1
      ORDER BY startedAt ASC
    `;
    return this.query(sql, [cutoffTime]) as Promise<QueueEntry[]>;
  }

  /**
   * Clear completed entries older than retention period
   */
  async clearOldCompleted(retentionMs: number): Promise<number> {
    const cutoffTime = new Date(Date.now() - retentionMs);
    await this.delete({
      where: { status: 'completed', completedAt: cutoffTime }
    });

    const remaining = await this.count({ status: 'completed', completedAt: cutoffTime });
    return remaining;
  }

  /**
   * Bulk requeue failed entries that are still retryable
   */
  async requeue(entryIds: string[]): Promise<number> {
    let requeuedCount = 0;

    for (const entryId of entryIds) {
      const entry = await this.findById(entryId);
      if (entry && entry.retryCount < entry.maxRetries) {
        await this.resetForRetry(entryId);
        requeuedCount++;
      }
    }

    return requeuedCount;
  }
}

export default QueueRepository;
