/**
 * Workflow Model
 * Represents workflow definitions, executions, and history
 */

export interface WorkflowTrigger {
  id: string;
  type: 'schedule' | 'webhook' | 'manual' | 'event';
  config: Record<string, any>;
  isActive: boolean;
}

export interface WorkflowStep {
  id: string;
  type: 'action' | 'condition' | 'loop' | 'parallel';
  name: string;
  config: Record<string, any>;
  nextStepIds?: string[];
  errorHandling?: {
    onError: 'retry' | 'skip' | 'fail';
    retryCount?: number;
    retryDelay?: number;
  };
}

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  definition: {
    version: string;
    triggers: WorkflowTrigger[];
    steps: WorkflowStep[];
    variables?: Record<string, any>;
  };
  enabled: boolean;
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  userId: string;
  triggeredBy: 'schedule' | 'webhook' | 'manual' | 'event';
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  errors?: Array<{
    step: string;
    message: string;
    timestamp: Date;
  }>;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
  stepExecutions: Array<{
    stepId: string;
    status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
    startedAt: Date;
    completedAt?: Date;
    duration?: number;
    output?: Record<string, any>;
    error?: string;
  }>;
  createdAt: Date;
}

export interface WorkflowSchedule {
  id: string;
  workflowId: string;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Database Table Schema for workflows
 */
export const WorkflowTableSchema = `
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  definition JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_public BOOLEAN DEFAULT false,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_enabled ON workflows(enabled);
CREATE INDEX IF NOT EXISTS idx_workflows_is_public ON workflows(is_public);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_deleted_at ON workflows(deleted_at);

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE
  ON workflows FOR EACH ROW EXECUTE FUNCTION update_workflows_updated_at_column();
`;

/**
 * Database Table Schema for workflow executions
 */
export const WorkflowExecutionTableSchema = `
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  triggered_by VARCHAR(50) NOT NULL CHECK (triggered_by IN ('schedule', 'webhook', 'manual', 'event')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed', 'cancelled')),
  inputs JSONB DEFAULT '{}',
  outputs JSONB,
  errors JSONB,
  step_executions JSONB DEFAULT '[]'::JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_user_id ON workflow_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created_at ON workflow_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at DESC);
`;

/**
 * Database Table Schema for workflow schedules
 */
export const WorkflowScheduleTableSchema = `
CREATE TABLE IF NOT EXISTS workflow_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL UNIQUE REFERENCES workflows(id) ON DELETE CASCADE,
  cron_expression VARCHAR(100) NOT NULL,
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_schedules_workflow_id ON workflow_schedules(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_enabled ON workflow_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_next_run_at ON workflow_schedules(next_run_at);
`;
