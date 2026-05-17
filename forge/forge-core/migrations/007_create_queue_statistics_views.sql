-- Queue Statistics Views
-- These materialized views provide efficient query access to queue health metrics

-- View: Current queue status by task state
DROP VIEW IF EXISTS queue_status_summary CASCADE;

CREATE VIEW queue_status_summary AS
SELECT
    'queued' as status,
    COUNT(*) as task_count,
    AVG(priority) as avg_priority,
    MIN(created_at) as oldest_task_created,
    MAX(created_at) as newest_task_created
FROM tasks
WHERE status = 'queued'
GROUP BY status

UNION ALL

SELECT
    'running' as status,
    COUNT(*) as task_count,
    AVG(priority) as avg_priority,
    MIN(started_at) as oldest_task_created,
    MAX(started_at) as newest_task_created
FROM tasks
WHERE status = 'running'
GROUP BY status

UNION ALL

SELECT
    'completed' as status,
    COUNT(*) as task_count,
    AVG(priority) as avg_priority,
    MIN(completed_at) as oldest_task_created,
    MAX(completed_at) as newest_task_created
FROM tasks
WHERE status = 'completed'
GROUP BY status

UNION ALL

SELECT
    'failed' as status,
    COUNT(*) as task_count,
    AVG(priority) as avg_priority,
    MIN(completed_at) as oldest_task_created,
    MAX(completed_at) as newest_task_created
FROM tasks
WHERE status = 'failed'
GROUP BY status;

-- View: Task aging - how long tasks are waiting in each state
DROP VIEW IF EXISTS task_age_analysis CASCADE;

CREATE VIEW task_age_analysis AS
SELECT
    status,
    COUNT(*) as task_count,
    AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))) as avg_age_seconds,
    MIN(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))) as min_age_seconds,
    MAX(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))) as max_age_seconds,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)))
        as median_age_seconds
FROM tasks
WHERE status IN ('queued', 'running')
GROUP BY status;

-- View: Task completion time analysis
DROP VIEW IF EXISTS task_completion_analysis CASCADE;

CREATE VIEW task_completion_analysis AS
SELECT
    COUNT(*) as completed_tasks,
    AVG(duration_ms) as avg_duration_ms,
    MIN(duration_ms) as min_duration_ms,
    MAX(duration_ms) as max_duration_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) as median_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) as p99_duration_ms
FROM tasks
WHERE status IN ('completed', 'failed') AND duration_ms IS NOT NULL;

-- View: Agent-level queue statistics
DROP VIEW IF EXISTS agent_queue_statistics CASCADE;

CREATE VIEW agent_queue_statistics AS
SELECT
    agent_id,
    COUNT(*) FILTER (WHERE status = 'queued') as queued_count,
    COUNT(*) FILTER (WHERE status = 'running') as running_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
    COUNT(*) FILTER (WHERE status IN ('completed', 'failed')) as total_finished,
    AVG(duration_ms) FILTER (WHERE status IN ('completed', 'failed') AND duration_ms IS NOT NULL)
        as avg_duration_ms,
    COUNT(*) FILTER (WHERE status IN ('completed', 'failed') AND duration_ms IS NOT NULL) > 0
        as has_execution_data
FROM tasks
GROUP BY agent_id;

-- View: Priority-weighted queue depth (higher priority = earlier completion needed)
DROP VIEW IF EXISTS priority_weighted_queue_load CASCADE;

CREATE VIEW priority_weighted_queue_load AS
SELECT
    SUM(priority) as total_priority_weight,
    COUNT(*) as total_tasks,
    AVG(priority) as avg_priority,
    MAX(priority) as highest_priority,
    MIN(priority) as lowest_priority
FROM tasks
WHERE status IN ('queued', 'running');

-- View: Retry pattern analysis
DROP VIEW IF EXISTS retry_pattern_analysis CASCADE;

CREATE VIEW retry_pattern_analysis AS
SELECT
    agent_id,
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE retry_count > 0) as tasks_with_retries,
    AVG(retry_count) as avg_retry_count,
    MAX(retry_count) as max_retry_count,
    ROUND(100.0 * COUNT(*) FILTER (WHERE retry_count > 0) / COUNT(*), 2) as retry_percentage
FROM tasks
WHERE status IN ('completed', 'failed')
GROUP BY agent_id;
