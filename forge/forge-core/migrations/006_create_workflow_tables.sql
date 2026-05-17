-- Create workflows table to store workflow definitions
CREATE TABLE IF NOT EXISTS workflows (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    steps JSONB NOT NULL,  -- Array of WorkflowStep objects
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on enabled for quick filtering of active workflows
CREATE INDEX IF NOT EXISTS idx_workflows_enabled ON workflows(enabled);

-- Create workflow_executions table to track workflow execution instances
CREATE TABLE IF NOT EXISTS workflow_executions (
    id VARCHAR(36) PRIMARY KEY,
    workflow_id VARCHAR(36) NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'running',
    -- Status values: running, completed, failed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on workflow_id for querying executions by workflow
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id
    ON workflow_executions(workflow_id);

-- Index on status for quick filtering
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status
    ON workflow_executions(status);

-- Index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created_at
    ON workflow_executions(created_at);

-- Link tasks to workflow executions for step tracking
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workflow_execution_id VARCHAR(36)
    REFERENCES workflow_executions(id) ON DELETE CASCADE;

-- Index on workflow_execution_id for querying tasks in a workflow
CREATE INDEX IF NOT EXISTS idx_tasks_workflow_execution_id
    ON tasks(workflow_execution_id) WHERE workflow_execution_id IS NOT NULL;
