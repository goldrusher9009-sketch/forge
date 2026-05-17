use axum::{
    extract::DefaultBodyLimit,
    routing::{get, post, put, delete},
    Router,
};
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use sqlx::postgres::PgPoolOptions;

use crate::agents::handlers;
use crate::agents::tool_handlers;
use crate::agents::{ToolRegistry, register_builtin_tools};
use crate::executor::{DbPool, AgentCoordinator, ToolQueue};
use crate::executor::handlers as executor_handlers;
use crate::middleware;

/// Build the main application router with all endpoints
pub async fn build_router() -> Result<Router, Box<dyn std::error::Error>> {
    // Initialize database pool
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL environment variable must be set");

    let pool = PgPoolOptions::new()
        .max_connections(20)
        .acquire_timeout(std::time::Duration::from_secs(5))
        .idle_timeout(std::time::Duration::from_secs(600))
        .max_lifetime(std::time::Duration::from_secs(3600))
        .connect(&database_url)
        .await?;

    tracing::info!("Database connection pool initialized");

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;

    tracing::info!("Database migrations applied");

    // Initialize tool registry
    let registry = Arc::new(ToolRegistry::new());

    // Register built-in tools
    let _ = register_builtin_tools(&registry);

    // Initialize queue and coordinator
    let queue = Arc::new(ToolQueue::new(pool.clone()));
    let coordinator = Arc::new(AgentCoordinator::new(registry.clone(), queue.clone(), pool.clone()));

    // Spawn worker task for processing queued tasks
    spawn_worker_task(coordinator.clone());

    tracing::info!("Agent coordinator and worker task initialized");

    let router = Router::new()
        // Health & Status
        .route("/health", get(health_check))
        .route("/status", get(status_with_db))

        // Agent Management Routes
        .nest("/api/v1/agents", agent_routes())

        // Tool Management Routes
        .nest("/api/v1/tools", tool_routes(registry.clone(), coordinator.clone()))

        // Execution Routes
        .nest("/api/v1/execute", execution_routes(coordinator.clone(), queue.clone()))

        // Workflow Routes
        .nest("/api/v1/workflows", workflow_routes())

        // Task Routes
        .nest("/api/v1/tasks", task_routes(pool.clone()))

        // Memory Routes
        .nest("/api/v1/memory", memory_routes(pool.clone()))

        // Metrics Routes
        .nest("/api/v1/metrics", metrics_routes(pool.clone()))

        // WebSocket Routes (for real-time updates)
        .nest("/ws", websocket_routes())

        // Admin Routes
        .nest("/api/v1/admin", admin_routes(pool.clone()))

        // Middleware
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .layer(DefaultBodyLimit::max(50 * 1024 * 1024)) // 50MB max request size
        .fallback(not_found)
        .with_state(pool);

    Ok(router)
}

/// Health check endpoint
async fn health_check() -> &'static str {
    "OK"
}

/// Status endpoint with detailed info (database-backed)
async fn status_with_db(
    axum::extract::State(pool): axum::extract::State<DbPool>,
) -> axum::Json<StatusResponse> {
    let queued_count = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM tasks WHERE status = 'queued'")
        .fetch_optional(&pool.0)
        .await
        .ok()
        .flatten()
        .unwrap_or(0);

    let running_count = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM tasks WHERE status = 'running'")
        .fetch_optional(&pool.0)
        .await
        .ok()
        .flatten()
        .unwrap_or(0);

    axum::Json(StatusResponse {
        status: "operational".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        uptime_seconds: get_uptime_seconds(),
        active_agents: 0,
        queued_tasks: queued_count as u32,
        executing_tasks: running_count as u32,
    })
}

/// 404 handler
async fn not_found() -> (axum::http::StatusCode, String) {
    (
        axum::http::StatusCode::NOT_FOUND,
        "Endpoint not found".to_string(),
    )
}

fn get_uptime_seconds() -> u64 {
    // Placeholder - implement with actual uptime tracking
    0
}

#[derive(serde::Serialize)]
struct StatusResponse {
    status: String,
    version: String,
    uptime_seconds: u64,
    active_agents: u32,
    queued_tasks: u32,
    executing_tasks: u32,
}

/// Agent management routes
fn agent_routes() -> Router {
    Router::new()
        // GET /api/v1/agents - List all agents
        .route("/", get(handlers::list_agents))

        // POST /api/v1/agents - Create new agent
        .route("/", post(handlers::create_agent))

        // GET /api/v1/agents/:id - Get specific agent
        .route("/:id", get(handlers::get_agent))

        // PUT /api/v1/agents/:id - Update agent
        .route("/:id", put(handlers::update_agent))

        // DELETE /api/v1/agents/:id - Delete agent
        .route("/:id", delete(handlers::delete_agent))

        // POST /api/v1/agents/:id/enable - Enable agent
        .route("/:id/enable", post(handlers::enable_agent))

        // POST /api/v1/agents/:id/disable - Disable agent
        .route("/:id/disable", post(handlers::disable_agent))

        // GET /api/v1/agents/:id/stats - Agent statistics
        .route("/:id/stats", get(handlers::get_agent_stats))
}

/// Task execution routes
fn execution_routes(coordinator: Arc<AgentCoordinator>, queue: Arc<ToolQueue>) -> Router {
    Router::new()
        // POST /api/v1/execute/task - Submit task to queue
        .route("/task", post(executor_handlers::submit_task))

        // POST /api/v1/execute/batch - Submit batch of tasks
        .route("/batch", post(executor_handlers::submit_batch))

        // GET /api/v1/execute/task/:id - Get task status from database
        .route("/task/:id", get(executor_handlers::get_task_status))

        // POST /api/v1/execute/task/:id/cancel - Cancel task
        .route("/task/:id/cancel", post(executor_handlers::cancel_task))

        // GET /api/v1/execute/queue - Get queue status
        .route("/queue", get(executor_handlers::get_queue_status))

        .with_state(coordinator)
        .with_state(queue)
}

/// Workflow management routes
fn workflow_routes() -> Router {
    Router::new()
        // GET /api/v1/workflows - List workflows
        .route("/", get(handlers::list_workflows))

        // POST /api/v1/workflows - Create workflow
        .route("/", post(handlers::create_workflow))

        // GET /api/v1/workflows/:id - Get workflow
        .route("/:id", get(handlers::get_workflow))

        // PUT /api/v1/workflows/:id - Update workflow
        .route("/:id", put(handlers::update_workflow))

        // DELETE /api/v1/workflows/:id - Delete workflow
        .route("/:id", delete(handlers::delete_workflow))

        // POST /api/v1/workflows/:id/execute - Execute workflow
        .route("/:id/execute", post(executor_handlers::execute_workflow))
}

/// Task management routes
fn task_routes(pool: DbPool) -> Router {
    Router::new()
        // GET /api/v1/tasks - List all tasks
        .route("/", get(handlers::list_tasks))

        // GET /api/v1/tasks/:id - Get task details
        .route("/:id", get(handlers::get_task_details))

        // GET /api/v1/tasks/status/:status - List tasks by status
        .route("/status/:status", get(handlers::list_tasks_by_status))

        // GET /api/v1/tasks/agent/:agent_id - List tasks by agent
        .route("/agent/:agent_id", get(handlers::list_tasks_by_agent))

        .with_state(pool)
}

/// WebSocket routes for real-time updates
fn websocket_routes() -> Router {
    Router::new()
        // WS /ws/subscribe - Subscribe to real-time updates
        .route("/subscribe", get(handlers::websocket_subscribe))

        // WS /ws/agent/:id - Subscribe to specific agent
        .route("/agent/:id", get(handlers::websocket_agent_updates))

        // WS /ws/task/:id - Subscribe to task progress
        .route("/task/:id", get(handlers::websocket_task_updates))
}

/// Memory query routes
fn memory_routes(pool: DbPool) -> Router {
    Router::new()
        // GET /api/v1/memory/agent/:agent_id/episodic - Get episodic memories
        .route("/agent/:agent_id/episodic", get(handlers::get_agent_episodic_memory))

        // GET /api/v1/memory/agent/:agent_id/semantic - Get semantic memories
        .route("/agent/:agent_id/semantic", get(handlers::get_agent_semantic_memory))

        // GET /api/v1/memory/agent/:agent_id/relationships - Get memory relationships
        .route("/agent/:agent_id/relationships", get(handlers::get_memory_relationships))

        .with_state(pool)
}

/// Metrics query routes
fn metrics_routes(pool: DbPool) -> Router {
    Router::new()
        // GET /api/v1/metrics/tools - Get all tool metrics
        .route("/tools", get(handlers::get_all_tool_metrics))

        // GET /api/v1/metrics/tools/:tool_id - Get specific tool metrics
        .route("/tools/:tool_id", get(handlers::get_tool_metrics))

        // GET /api/v1/metrics/execution/:task_id - Get execution details
        .route("/execution/:task_id", get(handlers::get_execution_details))

        .with_state(pool)
}

/// Admin routes
fn admin_routes(pool: DbPool) -> Router {
    Router::new()
        // GET /api/v1/admin/stats - System statistics
        .route("/stats", get(handlers::get_system_stats))

        // GET /api/v1/admin/metrics - Performance metrics
        .route("/metrics", get(handlers::get_metrics))

        // POST /api/v1/admin/reset - Reset system
        .route("/reset", post(handlers::admin_reset))

        // GET /api/v1/admin/logs - System logs
        .route("/logs", get(handlers::get_logs))

        .with_state(pool)
}

/// Tool management routes
fn tool_routes(registry: Arc<ToolRegistry>, coordinator: Arc<AgentCoordinator>) -> Router {
    Router::new()
        // GET /api/v1/tools - List all tools
        .route("/", get(tool_handlers::list_tools))

        // GET /api/v1/tools/available - List available tools
        .route("/available", get(tool_handlers::list_available_tools))

        // GET /api/v1/tools/:id - Get tool metadata
        .route("/:id", get(tool_handlers::get_tool_metadata))

        // GET /api/v1/tools/category/:category - List tools by category
        .route("/category/:category", get(tool_handlers::list_tools_by_category))

        // GET /api/v1/tools/tag/:tag - List tools by tag
        .route("/tag/:tag", get(tool_handlers::list_tools_by_tag))

        // GET /api/v1/tools/:id/stats - Get tool statistics
        .route("/:id/stats", get(tool_handlers::get_tool_stats))

        // GET /api/v1/tools/stats/all - Get all tools statistics
        .route("/stats/all", get(tool_handlers::get_all_tools_stats))

        // GET /api/v1/tools/:id/available - Check tool availability
        .route("/:id/available", get(tool_handlers::check_tool_availability))

        // GET /api/v1/tools/registry/info - Get registry information
        .route("/registry/info", get(tool_handlers::get_registry_info))

        // POST /api/v1/tools/execute - Execute a tool plan
        .route("/execute", post(tool_handlers::execute_plan))

        // GET /api/v1/tools/execution/:task_id - Get execution result
        .route("/execution/:task_id", get(tool_handlers::get_execution_result))

        // POST /api/v1/tools/execution/cache/clear - Clear execution cache
        .route("/execution/cache/clear", post(tool_handlers::clear_execution_cache))

        // GET /api/v1/tools/health - Get system health
        .route("/health", get(tool_handlers::get_system_health))

        .with_state(registry)
        .with_state(coordinator)
}

/// Spawn background worker task that continuously processes queued tasks
fn spawn_worker_task(coordinator: Arc<AgentCoordinator>) {
    tokio::spawn(async move {
        const BATCH_SIZE: u32 = 10;
        const POLL_INTERVAL_MS: u64 = 500;

        tracing::info!("Executor worker task started");

        loop {
            // Dequeue and execute batch of tasks
            match coordinator.process_batch(BATCH_SIZE).await {
                Ok(batch_result) => {
                    if batch_result.processed > 0 {
                        tracing::debug!(
                            processed = batch_result.processed,
                            succeeded = batch_result.succeeded,
                            failed = batch_result.failed,
                            "Batch execution completed"
                        );
                    }
                    // If batch was not empty, process immediately; else sleep
                    if batch_result.processed == 0 {
                        tokio::time::sleep(tokio::time::Duration::from_millis(POLL_INTERVAL_MS)).await;
                    }
                }
                Err(e) => {
                    tracing::error!("Batch processing error: {}", e);
                    tokio::time::sleep(tokio::time::Duration::from_millis(POLL_INTERVAL_MS)).await;
                }
            }
        }
    });
}
