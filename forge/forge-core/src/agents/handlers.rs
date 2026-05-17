use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde_json::json;
use sqlx::PgPool;

use crate::models::*;
use crate::error::AppError;

// ============================================================================
// AGENT HANDLERS
// ============================================================================

/// List all agents
pub async fn list_agents(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<Agent>>, AppError> {
    let agents = sqlx::query_as::<_, Agent>(
        "SELECT id, name, description, agent_type, enabled, config, created_at, updated_at
         FROM agents ORDER BY created_at DESC"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok(Json(agents))
}

/// Create a new agent
pub async fn create_agent(
    State(pool): State<PgPool>,
    Json(payload): Json<Agent>,
) -> Result<(StatusCode, Json<Agent>), AppError> {
    let now = chrono::Utc::now();

    let agent = sqlx::query_as::<_, Agent>(
        "INSERT INTO agents (id, name, description, agent_type, enabled, config, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, name, description, agent_type, enabled, config, created_at, updated_at"
    )
    .bind(&payload.id)
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(&payload.agent_type)
    .bind(payload.enabled)
    .bind(serde_json::to_value(&payload.config).map_err(|e| AppError::SerializationError(e.to_string()))?)
    .bind(now)
    .bind(now)
    .fetch_one(&pool)
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok((StatusCode::CREATED, Json(agent)))
}

/// Get a specific agent
pub async fn get_agent(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
) -> Result<Json<Agent>, AppError> {
    let agent = sqlx::query_as::<_, Agent>(
        "SELECT id, name, description, agent_type, enabled, config, created_at, updated_at
         FROM agents WHERE id = $1"
    )
    .bind(&id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?
    .ok_or_else(|| AppError::NotFound(format!("Agent '{}' not found", id)))?;

    Ok(Json(agent))
}

/// Update an agent
pub async fn update_agent(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
    Json(payload): Json<Agent>,
) -> Result<Json<Agent>, AppError> {
    let now = chrono::Utc::now();

    let agent = sqlx::query_as::<_, Agent>(
        "UPDATE agents
         SET name = $1, description = $2, agent_type = $3, enabled = $4, config = $5, updated_at = $6
         WHERE id = $7
         RETURNING id, name, description, agent_type, enabled, config, created_at, updated_at"
    )
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(&payload.agent_type)
    .bind(payload.enabled)
    .bind(serde_json::to_value(&payload.config).map_err(|e| AppError::SerializationError(e.to_string()))?)
    .bind(now)
    .bind(&id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?
    .ok_or_else(|| AppError::NotFound(format!("Agent '{}' not found", id)))?;

    Ok(Json(agent))
}

/// Delete an agent
pub async fn delete_agent(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
) -> Result<StatusCode, AppError> {
    let result = sqlx::query("DELETE FROM agents WHERE id = $1")
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Agent '{}' not found", id)));
    }

    Ok(StatusCode::NO_CONTENT)
}

/// Enable an agent
pub async fn enable_agent(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query("UPDATE agents SET enabled = true, updated_at = $1 WHERE id = $2")
        .bind(chrono::Utc::now())
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Agent '{}' not found", id)));
    }

    Ok(Json(json!({"status": "enabled", "agent_id": id})))
}

/// Disable an agent
pub async fn disable_agent(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query("UPDATE agents SET enabled = false, updated_at = $1 WHERE id = $2")
        .bind(chrono::Utc::now())
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Agent '{}' not found", id)));
    }

    Ok(Json(json!({"status": "disabled", "agent_id": id})))
}

/// Get agent statistics
pub async fn get_agent_stats(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
) -> Result<Json<AgentStats>, AppError> {
    let stats = sqlx::query!(
        "SELECT
            COUNT(*) as total_executions,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::BIGINT as successful_executions,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)::BIGINT as failed_executions,
            AVG(duration_ms)::FLOAT as average_duration_ms,
            MAX(completed_at) as last_execution
         FROM tasks
         WHERE agent_id = $1",
        &id
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    let total = stats.total_executions.unwrap_or(0) as i64;
    let successful = stats.successful_executions.unwrap_or(0);
    let failed = stats.failed_executions.unwrap_or(0);
    let success_rate = if total > 0 { successful as f64 / total as f64 } else { 0.0 };

    Ok(Json(AgentStats {
        total_executions: total as u64,
        successful_executions: successful as u64,
        failed_executions: failed as u64,
        average_duration_ms: stats.average_duration_ms.unwrap_or(0.0),
        success_rate,
        last_execution: stats.last_execution,
    }))
}

// ============================================================================
// WORKFLOW HANDLERS
// ============================================================================

/// List all workflows
pub async fn list_workflows(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<Workflow>>, AppError> {
    let workflows = sqlx::query_as::<_, Workflow>(
        "SELECT id, name, description, steps, enabled, created_at, updated_at
         FROM workflows ORDER BY created_at DESC"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok(Json(workflows))
}

/// Create a new workflow
pub async fn create_workflow(
    State(pool): State<PgPool>,
    Json(payload): Json<Workflow>,
) -> Result<(StatusCode, Json<Workflow>), AppError> {
    let now = chrono::Utc::now();

    let workflow = sqlx::query_as::<_, Workflow>(
        "INSERT INTO workflows (id, name, description, steps, enabled, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, description, steps, enabled, created_at, updated_at"
    )
    .bind(&payload.id)
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(serde_json::to_value(&payload.steps).map_err(|e| AppError::SerializationError(e.to_string()))?)
    .bind(payload.enabled)
    .bind(now)
    .bind(now)
    .fetch_one(&pool)
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok((StatusCode::CREATED, Json(workflow)))
}

/// Get a specific workflow
pub async fn get_workflow(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
) -> Result<Json<Workflow>, AppError> {
    let workflow = sqlx::query_as::<_, Workflow>(
        "SELECT id, name, description, steps, enabled, created_at, updated_at
         FROM workflows WHERE id = $1"
    )
    .bind(&id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?
    .ok_or_else(|| AppError::NotFound(format!("Workflow '{}' not found", id)))?;

    Ok(Json(workflow))
}

/// Update a workflow
pub async fn update_workflow(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
    Json(payload): Json<Workflow>,
) -> Result<Json<Workflow>, AppError> {
    let now = chrono::Utc::now();

    let workflow = sqlx::query_as::<_, Workflow>(
        "UPDATE workflows
         SET name = $1, description = $2, steps = $3, enabled = $4, updated_at = $5
         WHERE id = $6
         RETURNING id, name, description, steps, enabled, created_at, updated_at"
    )
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(serde_json::to_value(&payload.steps).map_err(|e| AppError::SerializationError(e.to_string()))?)
    .bind(payload.enabled)
    .bind(now)
    .bind(&id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?
    .ok_or_else(|| AppError::NotFound(format!("Workflow '{}' not found", id)))?;

    Ok(Json(workflow))
}

/// Delete a workflow
pub async fn delete_workflow(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
) -> Result<StatusCode, AppError> {
    let result = sqlx::query("DELETE FROM workflows WHERE id = $1")
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Workflow '{}' not found", id)));
    }

    Ok(StatusCode::NO_CONTENT)
}

// ============================================================================
// TASK HANDLERS
// ============================================================================

/// List all tasks
pub async fn list_tasks(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<Task>>, AppError> {
    let tasks = sqlx::query_as::<_, Task>(
        "SELECT id, agent_id, workflow_id, status, input, output, error_message,
                duration_ms, created_at, started_at, completed_at
         FROM tasks ORDER BY created_at DESC"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok(Json(tasks))
}

/// Get task details
pub async fn get_task_details(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
) -> Result<Json<Task>, AppError> {
    let task = sqlx::query_as::<_, Task>(
        "SELECT id, agent_id, workflow_id, status, input, output, error_message,
                duration_ms, created_at, started_at, completed_at
         FROM tasks WHERE id = $1"
    )
    .bind(&id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?
    .ok_or_else(|| AppError::NotFound(format!("Task '{}' not found", id)))?;

    Ok(Json(task))
}

/// List tasks by status
pub async fn list_tasks_by_status(
    State(pool): State<PgPool>,
    Path(status): Path<String>,
) -> Result<Json<Vec<Task>>, AppError> {
    let tasks = sqlx::query_as::<_, Task>(
        "SELECT id, agent_id, workflow_id, status, input, output, error_message,
                duration_ms, created_at, started_at, completed_at
         FROM tasks WHERE status = $1 ORDER BY created_at DESC"
    )
    .bind(&status)
    .fetch_all(&pool)
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok(Json(tasks))
}

// ============================================================================
// WEBSOCKET HANDLERS
// ============================================================================

/// Subscribe to real-time updates
pub async fn websocket_subscribe() -> Result<String, AppError> {
    // WebSocket upgrade is handled by Axum's extract::ws::WebSocketUpgrade
    // This handler would typically accept a WebSocketUpgrade extractor
    // For now, return a placeholder response
    Ok("WebSocket connection established".to_string())
}

/// Subscribe to agent updates
pub async fn websocket_agent_updates(Path(id): Path<String>) -> Result<String, AppError> {
    // WebSocket upgrade with agent-specific filtering
    // Would subscribe to agent_id = id in the real implementation
    Ok(format!("Subscribed to agent updates: {}", id))
}

/// Subscribe to task updates
pub async fn websocket_task_updates(Path(id): Path<String>) -> Result<String, AppError> {
    // WebSocket upgrade with task-specific filtering
    // Would subscribe to task_id = id in the real implementation
    Ok(format!("Subscribed to task updates: {}", id))
}

// ============================================================================
// ADMIN HANDLERS
// ============================================================================

/// Get system statistics
pub async fn get_system_stats(
    State(pool): State<PgPool>,
) -> Result<Json<SystemStats>, AppError> {
    let stats = sqlx::query!(
        "SELECT
            COUNT(DISTINCT a.id)::BIGINT as total_agents,
            COUNT(DISTINCT CASE WHEN a.enabled THEN a.id END)::BIGINT as active_agents,
            COUNT(t.id)::BIGINT as total_tasks,
            SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END)::BIGINT as completed_tasks,
            SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END)::BIGINT as failed_tasks,
            SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END)::BIGINT as queued_tasks,
            SUM(CASE WHEN t.status = 'executing' THEN 1 ELSE 0 END)::BIGINT as executing_tasks,
            AVG(t.duration_ms)::FLOAT as avg_duration_ms
         FROM agents a
         LEFT JOIN tasks t ON t.agent_id = a.id"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    let total_agents = stats.total_agents.unwrap_or(0) as u64;
    let active_agents = stats.active_agents.unwrap_or(0) as u64;
    let completed = stats.completed_tasks.unwrap_or(0) as u64;
    let failed = stats.failed_tasks.unwrap_or(0) as u64;
    let total_executed = completed + failed;
    let success_rate = if total_executed > 0 { completed as f64 / total_executed as f64 } else { 0.0 };

    Ok(Json(SystemStats {
        uptime_seconds: 86400, // Would be calculated from service start time in real implementation
        total_agents,
        active_agents,
        total_tasks_executed: total_executed,
        success_rate,
        average_execution_time_ms: stats.avg_duration_ms.unwrap_or(0.0),
        queue_status: QueueStatus {
            total_queued: stats.queued_tasks.unwrap_or(0) as u64,
            total_executing: stats.executing_tasks.unwrap_or(0) as u64,
            total_completed: completed,
            total_failed: failed,
            average_wait_time_ms: 0.0, // Would calculate from queue tables
        },
    }))
}

/// Get performance metrics
pub async fn get_metrics(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<MetricsData>>, AppError> {
    let metrics = sqlx::query_as::<_, MetricsData>(
        "SELECT agent_id, metric_name, metric_value, measurement_timestamp
         FROM metrics ORDER BY measurement_timestamp DESC LIMIT 1000"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok(Json(metrics))
}

/// Admin reset
pub async fn admin_reset(
    State(pool): State<PgPool>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Delete all tasks and reset queue state
    sqlx::query("DELETE FROM tasks")
        .execute(&pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    sqlx::query("DELETE FROM metrics")
        .execute(&pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok(Json(json!({
        "status": "reset_completed",
        "message": "All tasks and metrics have been cleared",
        "timestamp": chrono::Utc::now()
    })))
}

/// Get system logs
pub async fn get_logs(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<serde_json::Value>>, AppError> {
    let logs = sqlx::query!(
        "SELECT id, level, message, timestamp FROM system_logs
         ORDER BY timestamp DESC LIMIT 500"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    let json_logs: Vec<serde_json::Value> = logs
        .into_iter()
        .map(|log| {
            json!({
                "id": log.id,
                "level": log.level,
                "message": log.message,
                "timestamp": log.timestamp
            })
        })
        .collect();

    Ok(Json(json_logs))
}
