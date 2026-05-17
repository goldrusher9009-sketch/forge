import { getDatabase } from '../db';
import { Agent, AgentExecution, AgentVersion } from '../models/Agent.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * Agent Repository - Data access layer for AI agent operations
 * Handles CRUD operations on agents, executions, and versions
 */

export class AgentRepository {
  /**
   * Create a new agent
   */
  async createAgent(
    userId: string,
    organizationId: string,
    agentData: {
      name: string;
      description?: string;
      model: string;
      system_prompt: string;
      tools?: any[];
      temperature?: number;
      max_tokens?: number;
      enabled?: boolean;
    }
  ): Promise<Agent> {
    const db = getDatabase();
    const agentId = uuidv4();
    const versionId = uuidv4();

    const result = await db.query(
      `
      INSERT INTO agents (
        id, user_id, organization_id, name, description,
        model, system_prompt, tools, temperature, max_tokens, enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
      `,
      [
        agentId,
        userId,
        organizationId,
        agentData.name,
        agentData.description || null,
        agentData.model,
        agentData.system_prompt,
        JSON.stringify(agentData.tools || []),
        agentData.temperature ?? 0.7,
        agentData.max_tokens ?? 4096,
        agentData.enabled ?? true,
      ]
    );

    const agent = this.formatAgent(result.rows[0]);

    // Create initial version
    await this.createVersion(agentId, agent);

    return agent;
  }

  /**
   * Get agent by ID
   */
  async getAgentById(agentId: string): Promise<Agent | null> {
    const db = getDatabase();
    const result = await db.query(
      'SELECT * FROM agents WHERE id = $1 AND deleted_at IS NULL',
      [agentId]
    );
    return result.rows[0] ? this.formatAgent(result.rows[0]) : null;
  }

  /**
   * Update agent
   */
  async updateAgent(
    agentId: string,
    updates: Partial<Agent>
  ): Promise<Agent | null> {
    const db = getDatabase();
    const fields = Object.keys(updates)
      .filter(key => updates[key as keyof Agent] !== undefined)
      .map((key, idx) => `${key} = $${idx + 2}`)
      .join(', ');

    if (!fields) return this.getAgentById(agentId);

    const values = [
      agentId,
      ...Object.values(updates)
        .filter(v => v !== undefined)
        .map(v => (typeof v === 'object' ? JSON.stringify(v) : v)),
    ];

    const result = await db.query(
      `
      UPDATE agents
      SET ${fields}
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
      `,
      values
    );

    return result.rows[0] ? this.formatAgent(result.rows[0]) : null;
  }

  /**
   * Delete agent (soft delete)
   */
  async deleteAgent(agentId: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.query(
      `
      UPDATE agents
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      `,
      [agentId]
    );
    return result.rowCount > 0;
  }

  /**
   * List agents for organization
   */
  async listAgents(
    organizationId: string,
    offset: number = 0,
    limit: number = 50
  ): Promise<{ agents: Agent[]; total: number }> {
    const db = getDatabase();

    const countResult = await db.query(
      'SELECT COUNT(*) FROM agents WHERE organization_id = $1 AND deleted_at IS NULL',
      [organizationId]
    );

    const result = await db.query(
      `
      SELECT * FROM agents
      WHERE organization_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      OFFSET $2 LIMIT $3
      `,
      [organizationId, offset, limit]
    );

    return {
      agents: result.rows.map(r => this.formatAgent(r)),
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  /**
   * Create execution (conversation/interaction with agent)
   */
  async createExecution(
    agentId: string,
    executionData: {
      user_id: string;
      messages: any[];
      tool_calls?: any[];
      status?: string;
      tokens_used?: number;
      cost?: number;
    }
  ): Promise<AgentExecution> {
    const db = getDatabase();
    const executionId = uuidv4();

    const result = await db.query(
      `
      INSERT INTO agent_executions (
        id, agent_id, user_id, messages, tool_calls, status, tokens_used, cost
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        executionId,
        agentId,
        executionData.user_id,
        JSON.stringify(executionData.messages || []),
        JSON.stringify(executionData.tool_calls || []),
        executionData.status || 'completed',
        executionData.tokens_used || 0,
        executionData.cost || 0,
      ]
    );

    return this.formatExecution(result.rows[0]);
  }

  /**
   * Get execution by ID
   */
  async getExecutionById(executionId: string): Promise<AgentExecution | null> {
    const db = getDatabase();
    const result = await db.query(
      'SELECT * FROM agent_executions WHERE id = $1',
      [executionId]
    );
    return result.rows[0] ? this.formatExecution(result.rows[0]) : null;
  }

  /**
   * Update execution
   */
  async updateExecution(
    executionId: string,
    updates: Partial<AgentExecution>
  ): Promise<AgentExecution | null> {
    const db = getDatabase();
    const fields = Object.keys(updates)
      .map((key, idx) => `${key} = $${idx + 2}`)
      .join(', ');

    if (!fields) return this.getExecutionById(executionId);

    const values = [
      executionId,
      ...Object.values(updates).map(v => 
        typeof v === 'object' ? JSON.stringify(v) : v
      ),
    ];

    const result = await db.query(
      `
      UPDATE agent_executions
      SET ${fields}
      WHERE id = $1
      RETURNING *
      `,
      values
    );

    return result.rows[0] ? this.formatExecution(result.rows[0]) : null;
  }

  /**
   * List executions for agent
   */
  async listExecutions(
    agentId: string,
    offset: number = 0,
    limit: number = 50
  ): Promise<{ executions: AgentExecution[]; total: number }> {
    const db = getDatabase();

    const countResult = await db.query(
      'SELECT COUNT(*) FROM agent_executions WHERE agent_id = $1',
      [agentId]
    );

    const result = await db.query(
      `
      SELECT * FROM agent_executions
      WHERE agent_id = $1
      ORDER BY created_at DESC
      OFFSET $2 LIMIT $3
      `,
      [agentId, offset, limit]
    );

    return {
      executions: result.rows.map(r => this.formatExecution(r)),
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  /**
   * Create version (snapshot of agent configuration)
   */
  async createVersion(agentId: string, agent: Agent): Promise<AgentVersion> {
    const db = getDatabase();
    const versionId = uuidv4();

    const result = await db.query(
      `
      INSERT INTO agent_versions (
        id, agent_id, version_number, configuration
      ) VALUES ($1, $2, (
        SELECT COALESCE(MAX(version_number), 0) + 1 FROM agent_versions WHERE agent_id = $2
      ), $3)
      RETURNING *
      `,
      [
        versionId,
        agentId,
        JSON.stringify({
          name: agent.name,
          model: agent.model,
          system_prompt: agent.system_prompt,
          tools: agent.tools,
          temperature: agent.temperature,
          max_tokens: agent.max_tokens,
        }),
      ]
    );

    return result.rows[0];
  }

  /**
   * Get version
   */
  async getVersion(versionId: string): Promise<AgentVersion | null> {
    const db = getDatabase();
    const result = await db.query(
      'SELECT * FROM agent_versions WHERE id = $1',
      [versionId]
    );
    
    if (!result.rows[0]) return null;
    
    return {
      ...result.rows[0],
      configuration: typeof result.rows[0].configuration === 'string' 
        ? JSON.parse(result.rows[0].configuration) 
        : result.rows[0].configuration,
    };
  }

  /**
   * List versions for agent
   */
  async listVersions(agentId: string): Promise<AgentVersion[]> {
    const db = getDatabase();
    const result = await db.query(
      `
      SELECT * FROM agent_versions
      WHERE agent_id = $1
      ORDER BY version_number DESC
      `,
      [agentId]
    );

    return result.rows.map(row => ({
      ...row,
      configuration: typeof row.configuration === 'string' 
        ? JSON.parse(row.configuration) 
        : row.configuration,
    }));
  }

  /**
   * Rollback to previous version
   */
  async rollbackToVersion(agentId: string, versionId: string): Promise<Agent | null> {
    const db = getDatabase();

    const versionResult = await db.query(
      'SELECT configuration FROM agent_versions WHERE id = $1 AND agent_id = $2',
      [versionId, agentId]
    );

    if (versionResult.rows.length === 0) return null;

    const config = typeof versionResult.rows[0].configuration === 'string'
      ? JSON.parse(versionResult.rows[0].configuration)
      : versionResult.rows[0].configuration;

    const updateResult = await db.query(
      `
      UPDATE agents
      SET 
        name = $2,
        model = $3,
        system_prompt = $4,
        tools = $5,
        temperature = $6,
        max_tokens = $7
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
      `,
      [
        agentId,
        config.name,
        config.model,
        config.system_prompt,
        JSON.stringify(config.tools),
        config.temperature,
        config.max_tokens,
      ]
    );

    return updateResult.rows[0] ? this.formatAgent(updateResult.rows[0]) : null;
  }

  /**
   * Get agent usage statistics
   */
  async getUsageStats(agentId: string): Promise<{
    total_executions: number;
    total_tokens: number;
    total_cost: number;
    average_tokens_per_execution: number;
  }> {
    const db = getDatabase();
    const result = await db.query(
      `
      SELECT
        COUNT(*) as total_executions,
        SUM(tokens_used) as total_tokens,
        SUM(cost) as total_cost,
        AVG(tokens_used) as average_tokens_per_execution
      FROM agent_executions
      WHERE agent_id = $1
      `,
      [agentId]
    );

    const row = result.rows[0];
    return {
      total_executions: parseInt(row.total_executions, 10),
      total_tokens: parseInt(row.total_tokens || 0, 10),
      total_cost: parseFloat(row.total_cost || 0),
      average_tokens_per_execution: Math.round(row.average_tokens_per_execution || 0),
    };
  }

  /**
   * Format agent from database row
   */
  private formatAgent(row: any): Agent {
    return {
      ...row,
      tools: typeof row.tools === 'string' ? JSON.parse(row.tools) : row.tools,
    };
  }

  /**
   * Format execution from database row
   */
  private formatExecution(row: any): AgentExecution {
    return {
      ...row,
      messages: typeof row.messages === 'string' ? JSON.parse(row.messages) : row.messages,
      tool_calls: typeof row.tool_calls === 'string' ? JSON.parse(row.tool_calls) : row.tool_calls,
    };
  }
}

export const agentRepository = new AgentRepository();
