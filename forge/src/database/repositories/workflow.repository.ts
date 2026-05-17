import { PoolClient } from 'pg';
import { getDatabase } from '../db';
import { Workflow, WorkflowExecution, WorkflowSchedule } from '../models/Workflow.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * Workflow Repository - Data access layer for workflow operations
 * Handles CRUD operations on workflows, executions, and schedules
 */

export class WorkflowRepository {
  /**
   * Create a new workflow
   */
  async createWorkflow(
    userId: string,
    organizationId: string,
    workflowData: {
      name: string;
      description?: string;
      definition: Record<string, any>;
      tags?: string[];
      enabled?: boolean;
    }
  ): Promise<Workflow> {
    const db = getDatabase();
    const workflowId = uuidv4();

    const result = await db.query(
      `
      INSERT INTO workflows (
        id, user_id, organization_id, name, description,
        definition, tags, enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        workflowId,
        userId,
        organizationId,
        workflowData.name,
        workflowData.description || null,
        JSON.stringify(workflowData.definition),
        workflowData.tags || [],
        workflowData.enabled ?? true,
      ]
    );

    return this.formatWorkflow(result.rows[0]);
  }

  /**
   * Get workflow by ID
   */
  async getWorkflowById(workflowId: string): Promise<Workflow | null> {
    const db = getDatabase();
    const result = await db.query(
      'SELECT * FROM workflows WHERE id = $1 AND deleted_at IS NULL',
      [workflowId]
    );
    return result.rows[0] ? this.formatWorkflow(result.rows[0]) : null;
  }

  /**
   * Update workflow
   */
  async updateWorkflow(
    workflowId: string,
    updates: Partial<Workflow>
  ): Promise<Workflow | null> {
    const db = getDatabase();
    const updateFields = Object.keys(updates)
      .map((key, idx) => `${key} = $${idx + 2}`)
      .join(', ');

    if (!updateFields) return this.getWorkflowById(workflowId);

    const values = [
      workflowId,
      ...Object.values(updates).map(v => 
        typeof v === 'object' ? JSON.stringify(v) : v
      ),
    ];

    const result = await db.query(
      `
      UPDATE workflows
      SET ${updateFields}
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
      `,
      values
    );

    return result.rows[0] ? this.formatWorkflow(result.rows[0]) : null;
  }

  /**
   * Delete workflow (soft delete)
   */
  async deleteWorkflow(workflowId: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.query(
      `
      UPDATE workflows
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      `,
      [workflowId]
    );
    return result.rowCount > 0;
  }

  /**
   * List workflows for user/organization
   */
  async listWorkflows(
    organizationId: string,
    offset: number = 0,
    limit: number = 50
  ): Promise<{ workflows: Workflow[]; total: number }> {
    const db = getDatabase();

    const countResult = await db.query(
      'SELECT COUNT(*) FROM workflows WHERE organization_id = $1 AND deleted_at IS NULL',
      [organizationId]
    );

    const result = await db.query(
      `
      SELECT * FROM workflows
      WHERE organization_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      OFFSET $2 LIMIT $3
      `,
      [organizationId, offset, limit]
    );

    return {
      workflows: result.rows.map(r => this.formatWorkflow(r)),
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  /**
   * Create workflow execution
   */
  async createExecution(
    workflowId: string,
    executionData: {
      status: 'pending' | 'running' | 'completed' | 'failed';
      inputs?: Record<string, any>;
      outputs?: Record<string, any>;
      errors?: string[];
      step_executions?: Record<string, any>;
    }
  ): Promise<WorkflowExecution> {
    const db = getDatabase();
    const executionId = uuidv4();

    const result = await db.query(
      `
      INSERT INTO workflow_executions (
        id, workflow_id, status, inputs, outputs, errors, step_executions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        executionId,
        workflowId,
        executionData.status,
        JSON.stringify(executionData.inputs || {}),
        JSON.stringify(executionData.outputs || {}),
        executionData.errors || [],
        JSON.stringify(executionData.step_executions || {}),
      ]
    );

    return this.formatExecution(result.rows[0]);
  }

  /**
   * Get execution by ID
   */
  async getExecutionById(executionId: string): Promise<WorkflowExecution | null> {
    const db = getDatabase();
    const result = await db.query(
      'SELECT * FROM workflow_executions WHERE id = $1',
      [executionId]
    );
    return result.rows[0] ? this.formatExecution(result.rows[0]) : null;
  }

  /**
   * Update execution status and results
   */
  async updateExecution(
    executionId: string,
    updates: Partial<WorkflowExecution>
  ): Promise<WorkflowExecution | null> {
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
      UPDATE workflow_executions
      SET ${fields}
      WHERE id = $1
      RETURNING *
      `,
      values
    );

    return result.rows[0] ? this.formatExecution(result.rows[0]) : null;
  }

  /**
   * List workflow executions
   */
  async listExecutions(
    workflowId: string,
    offset: number = 0,
    limit: number = 50
  ): Promise<{ executions: WorkflowExecution[]; total: number }> {
    const db = getDatabase();

    const countResult = await db.query(
      'SELECT COUNT(*) FROM workflow_executions WHERE workflow_id = $1',
      [workflowId]
    );

    const result = await db.query(
      `
      SELECT * FROM workflow_executions
      WHERE workflow_id = $1
      ORDER BY created_at DESC
      OFFSET $2 LIMIT $3
      `,
      [workflowId, offset, limit]
    );

    return {
      executions: result.rows.map(r => this.formatExecution(r)),
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  /**
   * Create workflow schedule
   */
  async createSchedule(
    workflowId: string,
    scheduleData: {
      cron_expression: string;
      timezone?: string;
      enabled?: boolean;
    }
  ): Promise<WorkflowSchedule> {
    const db = getDatabase();
    const scheduleId = uuidv4();

    const result = await db.query(
      `
      INSERT INTO workflow_schedules (
        id, workflow_id, cron_expression, timezone, enabled
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        scheduleId,
        workflowId,
        scheduleData.cron_expression,
        scheduleData.timezone || 'UTC',
        scheduleData.enabled ?? true,
      ]
    );

    return result.rows[0];
  }

  /**
   * Get schedule for workflow
   */
  async getSchedule(workflowId: string): Promise<WorkflowSchedule | null> {
    const db = getDatabase();
    const result = await db.query(
      'SELECT * FROM workflow_schedules WHERE workflow_id = $1',
      [workflowId]
    );
    return result.rows[0] || null;
  }

  /**
   * Update schedule
   */
  async updateSchedule(
    scheduleId: string,
    updates: Partial<WorkflowSchedule>
  ): Promise<WorkflowSchedule | null> {
    const db = getDatabase();
    const fields = Object.keys(updates)
      .map((key, idx) => `${key} = $${idx + 2}`)
      .join(', ');

    if (!fields) return null;

    const result = await db.query(
      `
      UPDATE workflow_schedules
      SET ${fields}
      WHERE id = $1
      RETURNING *
      `,
      [scheduleId, ...Object.values(updates)]
    );

    return result.rows[0] || null;
  }

  /**
   * Get all enabled schedules
   */
  async getEnabledSchedules(): Promise<(WorkflowSchedule & { workflow_id: string })[]> {
    const db = getDatabase();
    const result = await db.query(
      `
      SELECT * FROM workflow_schedules
      WHERE enabled = true
      `
    );
    return result.rows;
  }

  /**
   * Get execution statistics for workflow
   */
  async getExecutionStats(
    workflowId: string
  ): Promise<{
    total: number;
    succeeded: number;
    failed: number;
    average_duration_ms: number;
  }> {
    const db = getDatabase();
    const result = await db.query(
      `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as succeeded,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        EXTRACT(EPOCH FROM (AVG(updated_at - created_at))) * 1000 as average_duration_ms
      FROM workflow_executions
      WHERE workflow_id = $1
      `,
      [workflowId]
    );

    const row = result.rows[0];
    return {
      total: parseInt(row.total, 10),
      succeeded: parseInt(row.succeeded, 10),
      failed: parseInt(row.failed, 10),
      average_duration_ms: Math.round(row.average_duration_ms || 0),
    };
  }

  /**
   * Format workflow from database row
   */
  private formatWorkflow(row: any): Workflow {
    return {
      ...row,
      definition: typeof row.definition === 'string' ? JSON.parse(row.definition) : row.definition,
      tags: Array.isArray(row.tags) ? row.tags : [],
    };
  }

  /**
   * Format execution from database row
   */
  private formatExecution(row: any): WorkflowExecution {
    return {
      ...row,
      inputs: typeof row.inputs === 'string' ? JSON.parse(row.inputs) : row.inputs,
      outputs: typeof row.outputs === 'string' ? JSON.parse(row.outputs) : row.outputs,
      step_executions: typeof row.step_executions === 'string' ? JSON.parse(row.step_executions) : row.step_executions,
      errors: Array.isArray(row.errors) ? row.errors : [],
    };
  }
}

export const workflowRepository = new WorkflowRepository();
