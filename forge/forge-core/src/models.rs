use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

// ============================================================================
// AGENT MODELS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub description: String,
    pub agent_type: AgentType,
    pub enabled: bool,
    pub config: AgentConfig,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AgentType {
    Email,
    DataAnalysis,
    Integration,
    ContentGeneration,
    Scheduling,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    pub model: String,
    pub temperature: f32,
    pub max_tokens: u32,
    pub timeout_seconds: u32,
    pub retry_count: u32,
    pub custom_params: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentStats {
    pub total_executions: u64,
    pub successful_executions: u64,
    pub failed_executions: u64,
    pub average_duration_ms: f64,
    pub success_rate: f64,
    pub last_execution: Option<DateTime<Utc>>,
}

// ============================================================================
// TASK MODELS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub agent_id: String,
    pub input: serde_json::Value,
    pub status: TaskStatus,
    pub output: Option<serde_json::Value>,
    pub error: Option<String>,
    pub created_at: DateTime<Utc>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub duration_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    Queued,
    Running,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExecuteTaskRequest {
    pub agent_id: String,
    pub input: serde_json::Value,
    pub priority: Option<u32>,
    pub timeout_seconds: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExecuteTaskResponse {
    pub task_id: String,
    pub status: TaskStatus,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskStatusResponse {
    pub task_id: String,
    pub status: TaskStatus,
    pub progress_percent: u32,
    pub output: Option<serde_json::Value>,
    pub error: Option<String>,
}

// ============================================================================
// WORKFLOW MODELS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workflow {
    pub id: String,
    pub name: String,
    pub description: String,
    pub steps: Vec<WorkflowStep>,
    pub enabled: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowStep {
    pub id: String,
    pub agent_id: String,
    pub input_mapping: InputMapping,
    pub on_success: Option<String>, // next step id
    pub on_failure: Option<String>, // next step id
    pub timeout_seconds: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InputMapping {
    pub from_previous: bool,
    pub static_input: Option<serde_json::Value>,
    pub field_mapping: Option<std::collections::HashMap<String, String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExecuteWorkflowRequest {
    pub workflow_id: String,
    pub input: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowExecutionResponse {
    pub execution_id: String,
    pub workflow_id: String,
    pub status: WorkflowStatus,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum WorkflowStatus {
    Running,
    Completed,
    Failed,
    Cancelled,
}

// ============================================================================
// BATCH EXECUTION MODELS
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchExecuteRequest {
    pub tasks: Vec<ExecuteTaskRequest>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchExecuteResponse {
    pub batch_id: String,
    pub task_ids: Vec<String>,
    pub total_tasks: usize,
}

// ============================================================================
// QUEUE MODELS
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct QueueStatus {
    pub total_queued: usize,
    pub total_executing: usize,
    pub total_completed: usize,
    pub total_failed: usize,
    pub average_wait_time_ms: f64,
}

// ============================================================================
// ERROR MODELS
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
    pub code: String,
}

// ============================================================================
// STATS MODELS
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemStats {
    pub uptime_seconds: u64,
    pub total_agents: usize,
    pub active_agents: usize,
    pub total_tasks_executed: u64,
    pub success_rate: f64,
    pub average_execution_time_ms: f64,
    pub queue_status: QueueStatus,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MetricsData {
    pub timestamp: DateTime<Utc>,
    pub cpu_percent: f32,
    pub memory_percent: f32,
    pub active_connections: u32,
    pub requests_per_second: f32,
    pub average_latency_ms: f64,
}
