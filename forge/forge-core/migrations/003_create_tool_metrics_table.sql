-- Tool metrics aggregation table
-- Denormalized for fast access to tool statistics and success rates
-- Updated incrementally as execution_history records are created

CREATE TABLE IF NOT EXISTS tool_metrics (
    tool_id TEXT PRIMARY KEY,
    tool_name TEXT NOT NULL,
    total_executions BIGINT NOT NULL DEFAULT 0,
    successful_executions BIGINT NOT NULL DEFAULT 0,
    failed_executions BIGINT NOT NULL DEFAULT 0,
    total_duration_ms BIGINT NOT NULL DEFAULT 0,
    min_duration_ms BIGINT,
    max_duration_ms BIGINT,
    avg_duration_ms FLOAT,
    success_rate FLOAT NOT NULL DEFAULT 0.0,
    last_execution_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    last_failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_tool_metrics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tool_metrics_timestamp_trigger
BEFORE UPDATE ON tool_metrics
FOR EACH ROW
EXECUTE FUNCTION update_tool_metrics_timestamp();

-- Function to update tool metrics when execution_history is inserted
CREATE OR REPLACE FUNCTION update_tool_metrics_on_execution()
RETURNS TRIGGER AS $$
DECLARE
    v_total_executions BIGINT;
    v_successful_executions BIGINT;
    v_failed_executions BIGINT;
    v_total_duration BIGINT;
BEGIN
    -- Get current counts from execution_history
    SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE success = true) as successful,
        COUNT(*) FILTER (WHERE success = false) as failed,
        COALESCE(SUM(duration_ms), 0) as total_duration
    INTO
        v_total_executions,
        v_successful_executions,
        v_failed_executions,
        v_total_duration
    FROM execution_history
    WHERE tool_id = NEW.tool_id;

    -- Insert or update metrics
    INSERT INTO tool_metrics (
        tool_id, tool_name, total_executions, successful_executions, failed_executions,
        total_duration_ms, min_duration_ms, max_duration_ms, avg_duration_ms,
        success_rate, last_execution_at,
        last_success_at, last_failure_at
    )
    SELECT
        NEW.tool_id,
        NEW.tool_name,
        v_total_executions,
        v_successful_executions,
        v_failed_executions,
        v_total_duration,
        (SELECT MIN(duration_ms) FROM execution_history WHERE tool_id = NEW.tool_id),
        (SELECT MAX(duration_ms) FROM execution_history WHERE tool_id = NEW.tool_id),
        CASE WHEN v_total_executions > 0 THEN v_total_duration::FLOAT / v_total_executions ELSE 0 END,
        CASE WHEN v_total_executions > 0 THEN (v_successful_executions::FLOAT / v_total_executions) ELSE 0 END,
        NOW(),
        CASE WHEN NEW.success THEN NOW() ELSE NULL END,
        CASE WHEN NOT NEW.success THEN NOW() ELSE NULL END
    ON CONFLICT (tool_id) DO UPDATE SET
        total_executions = v_total_executions,
        successful_executions = v_successful_executions,
        failed_executions = v_failed_executions,
        total_duration_ms = v_total_duration,
        min_duration_ms = (SELECT MIN(duration_ms) FROM execution_history WHERE tool_id = NEW.tool_id),
        max_duration_ms = (SELECT MAX(duration_ms) FROM execution_history WHERE tool_id = NEW.tool_id),
        avg_duration_ms = CASE WHEN v_total_executions > 0 THEN v_total_duration::FLOAT / v_total_executions ELSE 0 END,
        success_rate = CASE WHEN v_total_executions > 0 THEN (v_successful_executions::FLOAT / v_total_executions) ELSE 0 END,
        last_execution_at = NOW(),
        last_success_at = CASE WHEN NEW.success THEN NOW() ELSE tool_metrics.last_success_at END,
        last_failure_at = CASE WHEN NOT NEW.success THEN NOW() ELSE tool_metrics.last_failure_at END,
        last_failure_reason = CASE WHEN NOT NEW.success THEN NEW.error ELSE tool_metrics.last_failure_reason END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER execution_history_update_metrics_trigger
AFTER INSERT ON execution_history
FOR EACH ROW
EXECUTE FUNCTION update_tool_metrics_on_execution();
