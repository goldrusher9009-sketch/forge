-- Execution history table - tracks tool executions for the outcome data flywheel
-- Each record captures (prompt, complexity, model, outcome, success) tuple
-- This is the core data that feeds the proprietary router's learning

CREATE TABLE IF NOT EXISTS execution_history (
    id BIGSERIAL PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tool_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    execution_id TEXT NOT NULL UNIQUE,
    input JSONB NOT NULL,
    output JSONB,
    error TEXT,
    success BOOLEAN NOT NULL,
    duration_ms BIGINT NOT NULL,
    -- Fields for router moat data collection
    model_used TEXT,
    input_complexity FLOAT,
    output_complexity FLOAT,
    retry_attempt INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes for querying execution history
CREATE INDEX idx_execution_history_task_id ON execution_history(task_id);
CREATE INDEX idx_execution_history_tool_id ON execution_history(tool_id);
CREATE INDEX idx_execution_history_created_at ON execution_history(created_at DESC);
CREATE INDEX idx_execution_history_success ON execution_history(success);
CREATE INDEX idx_execution_history_tool_success ON execution_history(tool_id, success);

-- Index for aggregating outcomes by tool/model/complexity
CREATE INDEX idx_execution_history_moat_data ON execution_history(tool_id, model_used, input_complexity, success, duration_ms);

-- Trigger for completed_at
CREATE OR REPLACE FUNCTION set_execution_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.success IS NOT NULL THEN
        NEW.completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER execution_history_completed_at_trigger
BEFORE INSERT ON execution_history
FOR EACH ROW
EXECUTE FUNCTION set_execution_completed_at();
