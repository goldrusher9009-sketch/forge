use serde::{Deserialize, Serialize};

/// Agent capability traits
pub trait AgentCapability: Send + Sync {
    fn name(&self) -> &str;
    fn version(&self) -> &str;
    fn supported_formats(&self) -> Vec<&str>;
}

/// Execution context passed to agents
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionContext {
    pub task_id: String,
    pub agent_id: String,
    pub timeout_seconds: u32,
    pub metadata: serde_json::Value,
}

/// Execution result from agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub success: bool,
    pub output: Option<serde_json::Value>,
    pub error: Option<String>,
    pub duration_ms: u64,
    pub metadata: serde_json::Value,
}
