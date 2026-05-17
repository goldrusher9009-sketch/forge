use crate::executor::queue::ToolCall;
use serde_json::{json, Value as JsonValue};
use sqlx::postgres::{PgPool, PgPoolOptions};
use sqlx::Row;
use std::time::Duration;

/// Database connection and query layer for Forge persistence
/// Handles all database operations for tasks, execution history, metrics, and memory

#[derive(Clone, Debug)]
pub struct DbPool {
    pool: PgPool,
}

impl DbPool {
    /// Initialize database connection pool
    /// Creates a new pool with configured connection limits
    pub async fn new(database_url: &str) -> Result<Self, sqlx::Error> {
        let pool = PgPoolOptions::new()
            .max_connections(20)
            .acquire_timeout(Duration::from_secs(5))
            .idle_timeout(Duration::from_secs(600))
            .max_lifetime(Duration::from_secs(3600))
            .connect(database_url)
            .await?;

        Ok(DbPool { pool })
    }

    /// Get raw connection pool for direct sqlx operations
    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    // ============ TASK OPERATIONS ============

    /// Create a new task in the queue
    pub async fn create_task(
        &self,
        task_id: &str,
        agent_id: &str,
        input: JsonValue,
        priority: i32,
        created_by: Option<&str>,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            "INSERT INTO tasks (id, agent_id, input, status, priority, created_by)
             VALUES ($1, $2, $3, 'queued', $4, $5)
             ON CONFLICT (id) DO NOTHING"
        )
        .bind(task_id)
        .bind(agent_id)
        .bind(input)
        .bind(priority)
        .bind(created_by)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Get task by ID
    pub async fn get_task(&self, task_id: &str) -> Result<Option<TaskRow>, sqlx::Error> {
        let row = sqlx::query_as::<_, TaskRow>(
            "SELECT id, agent_id, input, status, output, error, priority, 
                    created_at, started_at, completed_at, duration_ms, retry_count, max_retries
             FROM tasks WHERE id = $1"
        )
        .bind(task_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row)
    }

    /// Get queued tasks in priority order, limited to batch_size
    pub async fn get_queued_tasks(&self, batch_size: i64) -> Result<Vec<TaskRow>, sqlx::Error> {
        let rows = sqlx::query_as::<_, TaskRow>(
            "SELECT id, agent_id, input, status, output, error, priority,
                    created_at, started_at, completed_at, duration_ms, retry_count, max_retries
             FROM tasks
             WHERE status = 'queued'
             ORDER BY priority DESC, created_at ASC
             LIMIT $1"
        )
        .bind(batch_size)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows)
    }

    /// Update task status
    pub async fn update_task_status(
        &self,
        task_id: &str,
        status: &str,
    ) -> Result<(), sqlx::Error> {
        let now = chrono::Utc::now();

        sqlx::query(
            "UPDATE tasks 
             SET status = $1,
                 started_at = CASE WHEN status = 'queued' AND $1 = 'running' THEN $3 ELSE started_at END
             WHERE id = $2"
        )
        .bind(status)
        .bind(task_id)
        .bind(now)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Complete a task with output
    pub async fn complete_task(
        &self,
        task_id: &str,
        status: &str,
        output: Option<JsonValue>,
        error: Option<&str>,
        duration_ms: i64,
    ) -> Result<(), sqlx::Error> {
        let now = chrono::Utc::now();

        sqlx::query(
            "UPDATE tasks
             SET status = $1, output = $2, error = $3, completed_at = $4, duration_ms = $5
             WHERE id = $6"
        )
        .bind(status)
        .bind(output)
        .bind(error)
        .bind(now)
        .bind(duration_ms)
        .bind(task_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    // ============ EXECUTION HISTORY ============

    /// Record tool execution in history (used for outcome data flywheel)
    pub async fn record_execution(
        &self,
        task_id: &str,
        tool_id: &str,
        tool_name: &str,
        execution_id: &str,
        input: JsonValue,
        output: Option<JsonValue>,
        error: Option<&str>,
        success: bool,
        duration_ms: i64,
        model_used: Option<&str>,
        input_complexity: Option<f64>,
        output_complexity: Option<f64>,
        retry_attempt: i32,
    ) -> Result<i64, sqlx::Error> {
        let now = chrono::Utc::now();

        let row = sqlx::query(
            "INSERT INTO execution_history 
             (task_id, tool_id, tool_name, execution_id, input, output, error, success, 
              duration_ms, model_used, input_complexity, output_complexity, retry_attempt, completed_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             RETURNING id"
        )
        .bind(task_id)
        .bind(tool_id)
        .bind(tool_name)
        .bind(execution_id)
        .bind(input)
        .bind(output)
        .bind(error)
        .bind(success)
        .bind(duration_ms)
        .bind(model_used)
        .bind(input_complexity)
        .bind(output_complexity)
        .bind(retry_attempt)
        .bind(now)
        .fetch_one(&self.pool)
        .await?;

        Ok(row.get::<i64, _>("id"))
    }

    /// Get execution history for a task
    pub async fn get_task_executions(
        &self,
        task_id: &str,
    ) -> Result<Vec<ExecutionRow>, sqlx::Error> {
        let rows = sqlx::query_as::<_, ExecutionRow>(
            "SELECT id, task_id, tool_id, tool_name, execution_id, input, output, error,
                    success, duration_ms, model_used, input_complexity, output_complexity,
                    retry_attempt, created_at, completed_at
             FROM execution_history
             WHERE task_id = $1
             ORDER BY created_at DESC"
        )
        .bind(task_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows)
    }

    // ============ TOOL METRICS ============

    /// Get tool metrics (auto-updated by database trigger)
    pub async fn get_tool_metrics(
        &self,
        tool_id: &str,
    ) -> Result<Option<ToolMetricsRow>, sqlx::Error> {
        let row = sqlx::query_as::<_, ToolMetricsRow>(
            "SELECT tool_id, tool_name, total_executions, successful_executions, failed_executions,
                    total_duration_ms, min_duration_ms, max_duration_ms, avg_duration_ms,
                    success_rate, last_execution_at, last_success_at, last_failure_at, last_failure_reason
             FROM tool_metrics
             WHERE tool_id = $1"
        )
        .bind(tool_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row)
    }

    /// Get all tool metrics
    pub async fn get_all_tool_metrics(&self) -> Result<Vec<ToolMetricsRow>, sqlx::Error> {
        let rows = sqlx::query_as::<_, ToolMetricsRow>(
            "SELECT tool_id, tool_name, total_executions, successful_executions, failed_executions,
                    total_duration_ms, min_duration_ms, max_duration_ms, avg_duration_ms,
                    success_rate, last_execution_at, last_success_at, last_failure_at, last_failure_reason
             FROM tool_metrics
             ORDER BY total_executions DESC"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows)
    }

    // ============ WORKING MEMORY ============

    /// Store working memory context for a task
    pub async fn set_working_memory(
        &self,
        agent_id: &str,
        task_id: &str,
        context_key: &str,
        context_value: JsonValue,
        expires_in_seconds: Option<i32>,
    ) -> Result<(), sqlx::Error> {
        let expires_at = expires_in_seconds.map(|secs| {
            chrono::Utc::now() + chrono::Duration::seconds(secs as i64)
        });

        sqlx::query(
            "INSERT INTO working_memory (agent_id, task_id, context_key, context_value, expires_at)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (agent_id, task_id, context_key) 
             DO UPDATE SET context_value = $4, expires_at = $5"
        )
        .bind(agent_id)
        .bind(task_id)
        .bind(context_key)
        .bind(context_value)
        .bind(expires_at)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Get working memory context
    pub async fn get_working_memory(
        &self,
        agent_id: &str,
        task_id: &str,
        context_key: &str,
    ) -> Result<Option<JsonValue>, sqlx::Error> {
        let row = sqlx::query(
            "SELECT context_value FROM working_memory 
             WHERE agent_id = $1 AND task_id = $2 AND context_key = $3
             AND (expires_at IS NULL OR expires_at > NOW())"
        )
        .bind(agent_id)
        .bind(task_id)
        .bind(context_key)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(|r| r.get::<JsonValue, _>("context_value")))
    }

    /// Get all working memory for a task
    pub async fn get_task_working_memory(
        &self,
        agent_id: &str,
        task_id: &str,
    ) -> Result<JsonValue, sqlx::Error> {
        let rows = sqlx::query(
            "SELECT context_key, context_value FROM working_memory
             WHERE agent_id = $1 AND task_id = $2
             AND (expires_at IS NULL OR expires_at > NOW())"
        )
        .bind(agent_id)
        .bind(task_id)
        .fetch_all(&self.pool)
        .await?;

        let mut result = json!({});
        for row in rows {
            let key: String = row.get("context_key");
            let value: JsonValue = row.get("context_value");
            result[key] = value;
        }

        Ok(result)
    }

    // ============ EPISODIC MEMORY ============

    /// Get episodic memories for an agent
    /// High-importance episodes are returned first
    pub async fn get_agent_episodes(
        &self,
        agent_id: &str,
        min_importance: f64,
        limit: i64,
    ) -> Result<Vec<EpisodicMemoryRow>, sqlx::Error> {
        let rows = sqlx::query_as::<_, EpisodicMemoryRow>(
            "SELECT id, agent_id, episode_id, task_id, episode_type, episode_context,
                    outcome, success, importance_score, created_at, recalled_count
             FROM episodic_memory
             WHERE agent_id = $1 AND importance_score >= $2
             ORDER BY importance_score DESC, created_at DESC
             LIMIT $3"
        )
        .bind(agent_id)
        .bind(min_importance)
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows)
    }

    /// Get episodic memory by ID and increment recall count
    pub async fn get_and_recall_episode(
        &self,
        episode_id: i64,
    ) -> Result<Option<EpisodicMemoryRow>, sqlx::Error> {
        let row = sqlx::query_as::<_, EpisodicMemoryRow>(
            "UPDATE episodic_memory
             SET recalled_count = recalled_count + 1
             WHERE id = $1
             RETURNING id, agent_id, episode_id, task_id, episode_type, episode_context,
                       outcome, success, importance_score, created_at, recalled_count"
        )
        .bind(episode_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row)
    }

    // ============ SEMANTIC MEMORY ============

    /// Get semantic knowledge for an agent
    /// Higher confidence knowledge returned first
    pub async fn get_agent_semantic_memory(
        &self,
        agent_id: &str,
        min_confidence: f64,
        limit: i64,
    ) -> Result<Vec<SemanticMemoryRow>, sqlx::Error> {
        let rows = sqlx::query_as::<_, SemanticMemoryRow>(
            "SELECT id, agent_id, semantic_key, semantic_value, confidence, 
                    supported_by_episodes, created_at, updated_at, last_used_at
             FROM semantic_memory
             WHERE agent_id = $1 AND confidence >= $2
             ORDER BY confidence DESC, updated_at DESC
             LIMIT $3"
        )
        .bind(agent_id)
        .bind(min_confidence)
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows)
    }

    /// Store semantic knowledge
    pub async fn set_semantic_memory(
        &self,
        agent_id: &str,
        semantic_key: &str,
        semantic_value: JsonValue,
        confidence: f64,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            "INSERT INTO semantic_memory (agent_id, semantic_key, semantic_value, confidence)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (agent_id, semantic_key)
             DO UPDATE SET semantic_value = $3, confidence = $4, updated_at = NOW()"
        )
        .bind(agent_id)
        .bind(semantic_key)
        .bind(semantic_value)
        .bind(confidence)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Update last_used_at for semantic memory (for decay and freshness metrics)
    pub async fn touch_semantic_memory(&self, semantic_key: &str) -> Result<(), sqlx::Error> {
        sqlx::query("UPDATE semantic_memory SET last_used_at = NOW() WHERE semantic_key = $1")
            .bind(semantic_key)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    // ============ MEMORY RELATIONSHIPS ============

    /// Get memory relationships connecting two memory types
    pub async fn get_memory_relationships(
        &self,
        agent_id: &str,
        from_type: &str,
        to_type: &str,
    ) -> Result<Vec<MemoryRelationshipRow>, sqlx::Error> {
        let rows = sqlx::query_as::<_, MemoryRelationshipRow>(
            "SELECT id, agent_id, from_memory_type, from_memory_id,
                    to_memory_type, to_memory_id, relationship_type, strength, created_at
             FROM memory_relationships
             WHERE agent_id = $1 AND from_memory_type = $2 AND to_memory_type = $3
             ORDER BY ABS(strength) DESC"
        )
        .bind(agent_id)
        .bind(from_type)
        .bind(to_type)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows)
    }

    // ============ WORKFLOW OPERATIONS ============

    /// Get workflow definition by ID
    pub async fn get_workflow(&self, workflow_id: &str) -> Result<Option<WorkflowRow>, sqlx::Error> {
        let row = sqlx::query_as::<_, WorkflowRow>(
            "SELECT id, name, description, steps, enabled, created_at, updated_at
             FROM workflows WHERE id = $1"
        )
        .bind(workflow_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row)
    }

    /// Create a workflow execution record
    pub async fn create_workflow_execution(
        &self,
        execution_id: &str,
        workflow_id: &str,
        status: &str,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            "INSERT INTO workflow_executions (id, workflow_id, status, created_at)
             VALUES ($1, $2, $3, NOW())"
        )
        .bind(execution_id)
        .bind(workflow_id)
        .bind(status)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Update workflow execution status
    pub async fn update_workflow_execution_status(
        &self,
        execution_id: &str,
        status: &str,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            "UPDATE workflow_executions SET status = $1, updated_at = NOW() WHERE id = $2"
        )
        .bind(status)
        .bind(execution_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Get workflow execution by ID
    pub async fn get_workflow_execution(
        &self,
        execution_id: &str,
    ) -> Result<Option<WorkflowExecutionRow>, sqlx::Error> {
        let row = sqlx::query_as::<_, WorkflowExecutionRow>(
            "SELECT id, workflow_id, status, created_at, updated_at
             FROM workflow_executions WHERE id = $1"
        )
        .bind(execution_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row)
    }
}

// ============ ROW STRUCTS (for sqlx query_as) ============

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct TaskRow {
    pub id: String,
    pub agent_id: String,
    pub input: JsonValue,
    pub status: String,
    pub output: Option<JsonValue>,
    pub error: Option<String>,
    pub priority: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub started_at: Option<chrono::DateTime<chrono::Utc>>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub duration_ms: Option<i64>,
    pub retry_count: i32,
    pub max_retries: i32,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct ExecutionRow {
    pub id: i64,
    pub task_id: String,
    pub tool_id: String,
    pub tool_name: String,
    pub execution_id: String,
    pub input: JsonValue,
    pub output: Option<JsonValue>,
    pub error: Option<String>,
    pub success: bool,
    pub duration_ms: i64,
    pub model_used: Option<String>,
    pub input_complexity: Option<f64>,
    pub output_complexity: Option<f64>,
    pub retry_attempt: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct ToolMetricsRow {
    pub tool_id: String,
    pub tool_name: String,
    pub total_executions: i64,
    pub successful_executions: i64,
    pub failed_executions: i64,
    pub total_duration_ms: i64,
    pub min_duration_ms: Option<i64>,
    pub max_duration_ms: Option<i64>,
    pub avg_duration_ms: Option<f64>,
    pub success_rate: f64,
    pub last_execution_at: Option<chrono::DateTime<chrono::Utc>>,
    pub last_success_at: Option<chrono::DateTime<chrono::Utc>>,
    pub last_failure_at: Option<chrono::DateTime<chrono::Utc>>,
    pub last_failure_reason: Option<String>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct EpisodicMemoryRow {
    pub id: i64,
    pub agent_id: String,
    pub episode_id: String,
    pub task_id: String,
    pub episode_type: String,
    pub episode_context: JsonValue,
    pub outcome: Option<JsonValue>,
    pub success: Option<bool>,
    pub importance_score: f64,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub recalled_count: i32,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct SemanticMemoryRow {
    pub id: i64,
    pub agent_id: String,
    pub semantic_key: String,
    pub semantic_value: JsonValue,
    pub confidence: f64,
    pub supported_by_episodes: Vec<i64>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub last_used_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct MemoryRelationshipRow {
    pub id: i64,
    pub agent_id: String,
    pub from_memory_type: String,
    pub from_memory_id: i64,
    pub to_memory_type: String,
    pub to_memory_id: i64,
    pub relationship_type: String,
    pub strength: f64,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct WorkflowRow {
    pub id: String,
    pub name: String,
    pub description: String,
    pub steps: JsonValue,
    pub enabled: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct WorkflowExecutionRow {
    pub id: String,
    pub workflow_id: String,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    #[ignore]  // Run with: cargo test -- --ignored --test-threads=1
    async fn test_db_connection() {
        // Integration test requires DATABASE_URL env var pointing to test database
        let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
        let pool = DbPool::new(&db_url).await;
        assert!(pool.is_ok(), "Failed to create database pool");
    }
}
