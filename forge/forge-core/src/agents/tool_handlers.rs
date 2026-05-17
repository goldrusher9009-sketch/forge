use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::agents::{AgentCoordinator, ExecutionPlan, ToolRegistry, ToolMetadata};
use crate::error::AppError;

// ============================================================================
// TOOL REGISTRY HANDLERS
// ============================================================================

/// List all registered tools
pub async fn list_tools(
    State(registry): State<Arc<ToolRegistry>>,
) -> Result<Json<Vec<ToolMetadata>>, AppError> {
    let tools = registry.list_tools();
    Ok(Json(tools))
}

/// Get a specific tool's metadata
pub async fn get_tool_metadata(
    State(registry): State<Arc<ToolRegistry>>,
    Path(tool_id): Path<String>,
) -> Result<Json<ToolMetadata>, AppError> {
    registry
        .get_metadata(&tool_id)
        .map(Json)
        .map_err(|_| AppError::NotFound(format!("Tool '{}' not found", tool_id)))
}

/// List tools by category
pub async fn list_tools_by_category(
    State(registry): State<Arc<ToolRegistry>>,
    Path(category): Path<String>,
) -> Result<Json<Vec<ToolMetadata>>, AppError> {
    let tools = registry.list_tools_by_category(&category);
    Ok(Json(tools))
}

/// List tools by tag
pub async fn list_tools_by_tag(
    State(registry): State<Arc<ToolRegistry>>,
    Path(tag): Path<String>,
) -> Result<Json<Vec<ToolMetadata>>, AppError> {
    let tools = registry.list_tools_by_tag(&tag);
    Ok(Json(tools))
}

/// Get available tools (enabled and healthy)
pub async fn list_available_tools(
    State(registry): State<Arc<ToolRegistry>>,
) -> Result<Json<Vec<ToolMetadata>>, AppError> {
    let tools = registry.get_available_tools();
    Ok(Json(tools))
}

/// Get tool statistics
pub async fn get_tool_stats(
    State(registry): State<Arc<ToolRegistry>>,
    Path(tool_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let stats = registry
        .get_stats(&tool_id)
        .map_err(|_| AppError::NotFound(format!("Stats for tool '{}' not found", tool_id)))?;

    Ok(Json(serde_json::json!({
        "tool_id": tool_id,
        "total_executions": stats.total_executions,
        "successful_executions": stats.successful_executions,
        "failed_executions": stats.failed_executions,
        "average_duration_ms": stats.average_duration_ms,
        "success_rate": stats.success_rate,
        "last_execution_time": stats.last_execution_time,
    })))
}

/// Get all tools statistics
pub async fn get_all_tools_stats(
    State(registry): State<Arc<ToolRegistry>>,
) -> Result<Json<Vec<serde_json::Value>>, AppError> {
    let all_stats = registry.get_all_stats();
    let stats_json: Vec<serde_json::Value> = all_stats
        .into_iter()
        .map(|(tool_id, stats)| {
            serde_json::json!({
                "tool_id": tool_id,
                "total_executions": stats.total_executions,
                "successful_executions": stats.successful_executions,
                "failed_executions": stats.failed_executions,
                "average_duration_ms": stats.average_duration_ms,
                "success_rate": stats.success_rate,
                "last_execution_time": stats.last_execution_time,
            })
        })
        .collect();

    Ok(Json(stats_json))
}

/// Check tool availability
pub async fn check_tool_availability(
    State(registry): State<Arc<ToolRegistry>>,
    Path(tool_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let available = registry
        .is_available(&tool_id)
        .map_err(|_| AppError::NotFound(format!("Tool '{}' not found", tool_id)))?;

    Ok(Json(serde_json::json!({
        "tool_id": tool_id,
        "available": available,
    })))
}

// ============================================================================
// COORDINATOR HANDLERS
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct ExecutePlanRequest {
    pub plan: ExecutionPlan,
}

/// Execute a tool execution plan
pub async fn execute_plan(
    State(coordinator): State<Arc<AgentCoordinator>>,
    Json(req): Json<ExecutePlanRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    match coordinator.execute_plan(req.plan).await {
        Ok(result) => Ok(Json(serde_json::json!({
            "task_id": result.task_id,
            "success": result.success,
            "total_duration_ms": result.total_duration_ms,
            "execution_order": result.execution_order,
            "results_count": result.results.len(),
            "errors_count": result.errors.len(),
            "errors": result.errors,
        }))),
        Err(e) => Err(AppError::BadRequest(e.to_string())),
    }
}

/// Get cached execution result
pub async fn get_execution_result(
    State(coordinator): State<Arc<AgentCoordinator>>,
    Path(task_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    match coordinator.get_cached_result(&task_id) {
        Some(result) => Ok(Json(serde_json::json!({
            "task_id": result.task_id,
            "success": result.success,
            "total_duration_ms": result.total_duration_ms,
            "execution_order": result.execution_order,
            "results_count": result.results.len(),
            "errors_count": result.errors.len(),
            "errors": result.errors,
        }))),
        None => Err(AppError::NotFound(format!("Execution result for task '{}' not found", task_id))),
    }
}

/// Clear execution cache
pub async fn clear_execution_cache(
    State(coordinator): State<Arc<AgentCoordinator>>,
) -> Result<Json<serde_json::Value>, AppError> {
    coordinator.clear_cache();
    Ok(Json(serde_json::json!({
        "status": "cache_cleared",
    })))
}

/// Get tool registry information
pub async fn get_registry_info(
    State(registry): State<Arc<ToolRegistry>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let available_tools = registry.get_available_tools();
    let tool_count = registry.tool_count();

    Ok(Json(serde_json::json!({
        "total_tools": tool_count,
        "available_tools": available_tools.len(),
        "tools": available_tools.iter().map(|t| serde_json::json!({
            "id": t.id,
            "name": t.name,
            "category": t.category,
            "tags": t.tags,
        })).collect::<Vec<_>>(),
    })))
}

// ============================================================================
// SYSTEM INFO HANDLERS
// ============================================================================

/// Get agent system health status
pub async fn get_system_health(
    State(registry): State<Arc<ToolRegistry>>,
    State(coordinator): State<Arc<AgentCoordinator>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let tool_count = registry.tool_count();
    let available_tools = registry.get_available_tools();
    let all_stats = registry.get_all_stats();

    let total_executions: u64 = all_stats.iter().map(|(_, s)| s.total_executions).sum();
    let successful_executions: u64 = all_stats.iter().map(|(_, s)| s.successful_executions).sum();
    let failed_executions: u64 = all_stats.iter().map(|(_, s)| s.failed_executions).sum();

    let overall_success_rate = if total_executions == 0 {
        1.0
    } else {
        successful_executions as f64 / total_executions as f64
    };

    Ok(Json(serde_json::json!({
        "status": "healthy",
        "tools": {
            "total": tool_count,
            "available": available_tools.len(),
        },
        "executions": {
            "total": total_executions,
            "successful": successful_executions,
            "failed": failed_executions,
            "success_rate": overall_success_rate,
        },
    })))
}
