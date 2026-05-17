/**
 * Agent Repository
 *
 * Data access layer for agent entities and their configurations.
 */

import { Repository, QueryOptions } from '../repository';
import { DatabaseConnection } from '../connection';

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  config: Record<string, unknown>;
  capabilityIds: string[];
  createdAt: Date;
  updatedAt: Date;
  lastHeartbeat?: Date;
  errorMessage?: string;
}

/**
 * Agent Repository
 *
 * Manages persistence of agent entities and their lifecycle.
 */
export class AgentRepository extends Repository<Agent> {
  constructor(connection: DatabaseConnection) {
    super('agents', connection);
  }

  /**
   * Find all active agents
   */
  async findActive(options?: Partial<QueryOptions>): Promise<Agent[]> {
    return this.find({
      ...options,
      where: { ...options?.where, status: 'active' }
    });
  }

  /**
   * Find agents by status
   */
  async findByStatus(
    status: 'active' | 'inactive' | 'error',
    options?: Partial<QueryOptions>
  ): Promise<Agent[]> {
    return this.find({
      ...options,
      where: { ...options?.where, status }
    });
  }

  /**
   * Update agent heartbeat timestamp
   */
  async updateHeartbeat(agentId: string, timestamp: Date): Promise<void> {
    await this.update(
      { lastHeartbeat: timestamp },
      { where: { id: agentId } }
    );
  }

  /**
   * Mark agent as errored
   */
  async recordError(agentId: string, errorMessage: string): Promise<void> {
    await this.update(
      { status: 'error', errorMessage, updatedAt: new Date() },
      { where: { id: agentId } }
    );
  }

  /**
   * Clear agent error state
   */
  async clearError(agentId: string): Promise<void> {
    await this.update(
      { status: 'active', errorMessage: null, updatedAt: new Date() },
      { where: { id: agentId } }
    );
  }

  /**
   * Update agent capabilities
   */
  async updateCapabilities(agentId: string, capabilityIds: string[]): Promise<void> {
    await this.update(
      { capabilityIds, updatedAt: new Date() },
      { where: { id: agentId } }
    );
  }

  /**
   * Count agents by status
   */
  async countByStatus(status: 'active' | 'inactive' | 'error'): Promise<number> {
    return this.count({ status });
  }

  /**
   * Find agents with stale heartbeats (last heartbeat older than threshold)
   */
  async findStaleAgents(thresholdMs: number): Promise<Agent[]> {
    const cutoffTime = new Date(Date.now() - thresholdMs);
    const sql = `
      SELECT * FROM agents
      WHERE lastHeartbeat < $1
      OR lastHeartbeat IS NULL
      ORDER BY lastHeartbeat ASC
    `;
    return this.query(sql, [cutoffTime]) as Promise<Agent[]>;
  }
}

export default AgentRepository;
