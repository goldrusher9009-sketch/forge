/**
 * Execution Repository
 *
 * Data access layer for task execution records and their lifecycle.
 */

import { Repository, QueryOptions } from '../repository';
import { DatabaseConnection } from '../connection';

export interface Execution {
  id: string;
  taskId: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  result?: Record<string, unknown>;
  error?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Execution Repository
 *
 * Manages persistence of execution records and their lifecycle tracking.
 */
export class ExecutionRepository extends Repository<Execution> {
  constructor(connection: DatabaseConnection) {
    super('executions', connection);
  }

  /**
   * Find executions by task ID
   */
  async findByTaskId(taskId: string, options?: Partial<QueryOptions>): Promise<Execution[]> {
    return this.find({
      ...options,
      where: { ...options?.where, taskId }
    });
  }

  /**
   * Find executions by agent ID
   */
  async findByAgentId(agentId: string, options?: Partial<QueryOptions>): Promise<Execution[]> {
    return this.find({
      ...options,
      where: { ...options?.where, agentId }
    });
  }

  /**
   * Find executions by status
   */
  async findByStatus(
    status: Execution['status'],
    options?: Partial<QueryOptions>
  ): Promise<Execution[]> {
    return this.find({
      ...options,
      where: { ...options?.where, status }
    });
  }

  /**
   * Get the most recent execution for a task
   */
  async getLatestForTask(taskId: string): Promise<Execution | null> {
    return this.findOne({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      limit: 1
    });
  }

  /**
   * Mark execution as started
   */
  async markStarted(executionId: string, startedAt: Date): Promise<void> {
    await this.update(
      { status: 'running', startedAt, updatedAt: new Date() },
      { where: { id: executionId } }
    );
  }

  /**
   * Mark execution as completed
   */
  async markCompleted(
    executionId: string,
    completedAt: Date,
    result?: Record<string, unknown>
  ): Promise<void> {
    const execution = await this.findById(executionId);
    if (!execution || !execution.startedAt) {
      throw new Error(`Execution ${executionId} not found or not started`);
    }

    const duration = completedAt.getTime() - execution.startedAt.getTime();

    await this.update(
      {
        status: 'completed',
        completedAt,
        duration,
        result,
        updatedAt: new Date()
      },
      { where: { id: executionId } }
    );
  }

  /**
   * Mark execution as failed
   */
  async markFailed(
    executionId: string,
    error: string,
    completedAt?: Date
  ): Promise<void> {
    const execution = await this.findById(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    let duration: number | undefined;
    if (execution.startedAt && completedAt) {
      duration = completedAt.getTime() - execution.startedAt.getTime();
    }

    await this.update(
      {
        status: 'failed',
        error,
        completedAt: completedAt || new Date(),
        duration,
        updatedAt: new Date()
      },
      { where: { id: executionId } }
    );
  }

  /**
   * Mark execution as cancelled
   */
  async markCancelled(executionId: string): Promise<void> {
    await this.update(
      { status: 'cancelled', updatedAt: new Date() },
      { where: { id: executionId } }
    );
  }

  /**
   * Increment retry count for an execution
   */
  async incrementRetry(executionId: string): Promise<void> {
    const execution = await this.findById(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    await this.update(
      { retryCount: execution.retryCount + 1, updatedAt: new Date() },
      { where: { id: executionId } }
    );
  }

  /**
   * Find pending executions (not yet started)
   */
  async findPending(options?: Partial<QueryOptions>): Promise<Execution[]> {
    return this.find({
      ...options,
      where: { ...options?.where, status: 'pending' }
    });
  }

  /**
   * Find running executions
   */
  async findRunning(options?: Partial<QueryOptions>): Promise<Execution[]> {
    return this.find({
      ...options,
      where: { ...options?.where, status: 'running' }
    });
  }

  /**
   * Count executions by status
   */
  async countByStatus(status: Execution['status']): Promise<number> {
    return this.count({ status });
  }

  /**
   * Get execution statistics for a task
   */
  async getTaskStats(taskId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    cancelled: number;
    avgDuration: number;
  }> {
    const executions = await this.findByTaskId(taskId);

    const completed = executions.filter(e => e.status === 'completed').length;
    const failed = executions.filter(e => e.status === 'failed').length;
    const cancelled = executions.filter(e => e.status === 'cancelled').length;
    const avgDuration = executions
      .filter(e => e.duration)
      .reduce((sum, e) => sum + (e.duration || 0), 0) / Math.max(completed, 1);

    return {
      total: executions.length,
      completed,
      failed,
      cancelled,
      avgDuration
    };
  }

  /**
   * Get execution statistics for an agent
   */
  async getAgentStats(agentId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    cancelled: number;
    avgDuration: number;
  }> {
    const executions = await this.findByAgentId(agentId);

    const completed = executions.filter(e => e.status === 'completed').length;
    const failed = executions.filter(e => e.status === 'failed').length;
    const cancelled = executions.filter(e => e.status === 'cancelled').length;
    const avgDuration = executions
      .filter(e => e.duration)
      .reduce((sum, e) => sum + (e.duration || 0), 0) / Math.max(completed, 1);

    return {
      total: executions.length,
      completed,
      failed,
      cancelled,
      avgDuration
    };
  }
}

export default ExecutionRepository;
