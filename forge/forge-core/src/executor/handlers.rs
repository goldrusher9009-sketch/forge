use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde_json::json;
use uuid::Uuid;
use chrono::Utc;

use crate::models::*;
use crate::error::AppError;
use crate::executor::DbPool;

/// Submit a single task to the queue for execution
/// Creates task record in database with status='queued'
pub async fn submit_task(
    State(pool): State<DbPool>,
    Json(payload): Json<ExecuteTaskRequest>,
) -> Result<(StatusCode, Json<ExecuteTaskResponse>), AppError> {
    let task_id = Uuid::new_v4().to_string();
    let priority = payload.priority.unwrap_or(0) as i32;

    // Create task in database
    pool.create_task(&task_id, &payload.agent_id, payload.input, priority, None)
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to create task: {}", e)))?;

    Ok((
        StatusCode::ACCEPTED,
        Json(ExecuteTaskResponse {
            task_id,
            status: TaskStatus::Queued,
            created_at: Utc::now(),
        }),
    ))
}

/// Submit multiple tasks as a batch
/// Creates all task records atomically
pub async fn submit_batch(
    State(pool): State<DbPool>,
    Json(payload): Json<BatchExecuteRequest>,
) -> Result<(StatusCode, Json<BatchExecuteResponse>), AppError> {
    let batch_id = Uuid::new_v4().to_string();
    let mut task_ids = Vec::new();

    // Create each task in database
    for task_req in payload.tasks {
        let task_id = Uuid::new_v4().to_string();
        let priority = task_req.priority.unwrap_or(0) as i32;

        pool.create_task(&task_id, &task_req.agent_id, task_req.input, priority, Some(&batch_id))
            .await
            .map_err(|e| AppError::DatabaseError(format!("Failed to create batch task: {}", e)))?;

        task_ids.push(task_id);
    }

    Ok((
        StatusCode::ACCEPTED,
        Json(BatchExecuteResponse {
            batch_id,
            task_ids: task_ids.clone(),
            total_tasks: task_ids.len(),
        }),
    ))
}

/// Get the current status of a specific task
/// Queries database to return task state, progress, output/error
pub async fn get_task_status(
    State(pool): State<DbPool>,
    Path(task_id): Path<String>,
) -> Result<Json<TaskStatusResponse>, AppError> {
    let task_row = pool
        .get_task(&task_id)
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to fetch task: {}", e)))?
        .ok_or(AppError::NotFound(format!("Task {} not found", task_id)))?;

    // Calculate progress percentage based on task status
    let progress_percent = match task_row.status.as_str() {
        "queued" => 0,
        "running" => 50,
        "completed" => 100,
        "failed" => 100,
        "cancelled" => 100,
        _ => 0,
    };

    // Parse status string to TaskStatus enum
    let status = match task_row.status.as_str() {
        "queued" => TaskStatus::Queued,
        "running" => TaskStatus::Running,
        "completed" => TaskStatus::Completed,
        "failed" => TaskStatus::Failed,
        "cancelled" => TaskStatus::Cancelled,
        _ => TaskStatus::Queued,
    };

    Ok(Json(TaskStatusResponse {
        task_id,
        status,
        progress_percent,
        output: task_row.output,
        error: task_row.error,
    }))
}

/// Cancel a queued or running task
/// Updates task status to 'cancelled' if currently queued/running
pub async fn cancel_task(
    State(pool): State<DbPool>,
    Path(task_id): Path<String>,
) -> Result<StatusCode, AppError> {
    // Verify task exists
    let task = pool
        .get_task(&task_id)
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to fetch task: {}", e)))?
        .ok_or(AppError::NotFound(format!("Task {} not found", task_id)))?;

    // Only cancel if not already completed/failed
    match task.status.as_str() {
        "completed" | "failed" | "cancelled" => {
            Err(AppError::BadRequest(format!(
                "Cannot cancel task in {} state",
                task.status
            )))
        }
        _ => {
            pool.update_task_status(&task_id, "cancelled")
                .await
                .map_err(|e| AppError::DatabaseError(format!("Failed to cancel task: {}", e)))?;
            Ok(StatusCode::NO_CONTENT)
        }
    }
}

/// Get current queue statistics
/// Returns counts of queued/executing/completed/failed tasks and average wait time
pub async fn get_queue_status(
    State(pool): State<DbPool>,
) -> Result<Json<QueueStatus>, AppError> {
    // Query database for task counts by status
    let pool_ref = pool.pool();

    // Get counts by status
    let total_queued: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks WHERE status = 'queued'")
        .fetch_one(pool_ref)
        .await
        .unwrap_or(0);

    let total_executing: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks WHERE status = 'running'")
        .fetch_one(pool_ref)
        .await
        .unwrap_or(0);

    let total_completed: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks WHERE status = 'completed'")
        .fetch_one(pool_ref)
        .await
        .unwrap_or(0);

    let total_failed: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks WHERE status = 'failed'")
        .fetch_one(pool_ref)
        .await
        .unwrap_or(0);

    // Calculate average wait time for completed tasks (time from created_at to completed_at)
    let avg_wait: Option<f64> = sqlx::query_scalar(
        "SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) * 1000)::float8
         FROM tasks
         WHERE status IN ('completed', 'failed') AND completed_at IS NOT NULL"
    )
    .fetch_optional(pool_ref)
    .await
    .unwrap_or(None)
    .flatten();

    let average_wait_time_ms = avg_wait.unwrap_or(0.0);

    Ok(Json(QueueStatus {
        total_queued: total_queued as u32,
        total_executing: total_executing as u32,
        total_completed: total_completed as u32,
        total_failed: total_failed as u32,
        average_wait_time_ms,
    }))
}

/// Execute a workflow - submits the workflow's first step as a task
/// Workflow execution logic will be handled by the agent coordinator
pub async fn execute_workflow(
    State(pool): State<DbPool>,
    Path(id): Path<String>,
    Json(payload): Json<ExecuteWorkflowRequest>,
) -> Result<(StatusCode, Json<WorkflowExecutionResponse>), AppError> {
    let execution_id = Uuid::new_v4().to_string();

    // Fetch workflow definition from database
    let workflow = pool
        .get_workflow(&id)
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to fetch workflow: {}", e)))?
        .ok_or(AppError::NotFound(format!("Workflow {} not found", id)))?;

    // Create workflow execution record
    pool.create_workflow_execution(&execution_id, &id, "running")
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to create workflow execution: {}", e)))?;

    // Parse workflow steps and get the first step
    let steps: Vec<crate::models::WorkflowStep> = serde_json::from_value(workflow.steps.clone())
        .map_err(|e| AppError::ValidationError(format!("Invalid workflow steps: {}", e)))?;

    if steps.is_empty() {
        return Err(AppError::ValidationError("Workflow has no steps".to_string()));
    }

    let first_step = &steps[0];

    // Build input for the first step
    let step_input = if first_step.input_mapping.from_previous {
        // Use the provided workflow input as-is
        payload.input.clone()
    } else if let Some(static_input) = &first_step.input_mapping.static_input {
        // Use static input defined in the step
        static_input.clone()
    } else {
        json!({})
    };

    // Create initial task for first workflow step
    let task_id = Uuid::new_v4().to_string();
    pool.create_task(
        &task_id,
        &first_step.agent_id,
        step_input,
        0, // default priority
        Some(&execution_id),
    )
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create workflow task: {}", e)))?;

    Ok((
        StatusCode::ACCEPTED,
        Json(WorkflowExecutionResponse {
            execution_id,
            workflow_id: id,
            status: WorkflowStatus::Running,
            created_at: Utc::now(),
        }),
    ))
}
