use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Error type for tool execution failures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolError {
    pub code: String,
    pub message: String,
    pub details: Option<String>,
}

impl ToolError {
    pub fn new(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
            details: None,
        }
    }

    pub fn with_details(mut self, details: impl Into<String>) -> Self {
        self.details = Some(details.into());
        self
    }
}

impl std::fmt::Display for ToolError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{}] {}", self.code, self.message)
    }
}

impl std::error::Error for ToolError {}

/// Result of tool execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolResult {
    pub success: bool,
    pub data: Option<serde_json::Value>,
    pub error: Option<ToolError>,
    pub duration_ms: u128,
    pub tool_name: String,
    pub execution_id: String,
}

impl ToolResult {
    pub fn success(
        tool_name: impl Into<String>,
        execution_id: impl Into<String>,
        data: serde_json::Value,
        duration_ms: u128,
    ) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            duration_ms,
            tool_name: tool_name.into(),
            execution_id: execution_id.into(),
        }
    }

    pub fn failure(
        tool_name: impl Into<String>,
        execution_id: impl Into<String>,
        error: ToolError,
        duration_ms: u128,
    ) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(error),
            duration_ms,
            tool_name: tool_name.into(),
            execution_id: execution_id.into(),
        }
    }
}

/// Tool capability/feature descriptor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCapability {
    pub name: String,
    pub description: String,
    pub category: String,
    pub required_permissions: Vec<String>,
}

/// Tool input specification for schema validation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolInputSpec {
    pub required_fields: Vec<String>,
    pub optional_fields: Vec<String>,
    pub schema: Option<serde_json::Value>,
}

/// Metadata about an agent tool
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolMetadata {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub category: String,
    pub tags: Vec<String>,
    pub enabled: bool,
    pub timeout_seconds: u32,
    pub max_retries: u32,
    pub input_spec: ToolInputSpec,
    pub capabilities: Vec<ToolCapability>,
    pub dependencies: Vec<String>,
}

impl ToolMetadata {
    pub fn new(id: impl Into<String>, name: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            name: name.into(),
            version: "1.0.0".to_string(),
            description: String::new(),
            category: "general".to_string(),
            tags: Vec::new(),
            enabled: true,
            timeout_seconds: 30,
            max_retries: 3,
            input_spec: ToolInputSpec {
                required_fields: Vec::new(),
                optional_fields: Vec::new(),
                schema: None,
            },
            capabilities: Vec::new(),
            dependencies: Vec::new(),
        }
    }

    pub fn with_description(mut self, description: impl Into<String>) -> Self {
        self.description = description.into();
        self
    }

    pub fn with_category(mut self, category: impl Into<String>) -> Self {
        self.category = category.into();
        self
    }

    pub fn with_tags(mut self, tags: Vec<String>) -> Self {
        self.tags = tags;
        self
    }

    pub fn with_timeout(mut self, timeout_seconds: u32) -> Self {
        self.timeout_seconds = timeout_seconds;
        self
    }

    pub fn with_input_spec(mut self, input_spec: ToolInputSpec) -> Self {
        self.input_spec = input_spec;
        self
    }

    pub fn with_capabilities(mut self, capabilities: Vec<ToolCapability>) -> Self {
        self.capabilities = capabilities;
        self
    }
}

/// Trait for implementing agent tools
pub trait AgentTool: Send + Sync {
    /// Get tool metadata
    fn metadata(&self) -> &ToolMetadata;

    /// Execute the tool with provided input
    async fn execute(
        &self,
        input: serde_json::Value,
        execution_id: String,
    ) -> Result<ToolResult, ToolError>;

    /// Validate input before execution
    fn validate_input(&self, input: &serde_json::Value) -> Result<(), ToolError> {
        // Default implementation: return Ok
        Ok(())
    }

    /// Check if tool is available for execution
    fn is_available(&self) -> bool {
        self.metadata().enabled
    }

    /// Get tool's current health status
    fn health_status(&self) -> ToolHealthStatus {
        ToolHealthStatus::Healthy
    }
}

/// Health status of a tool
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ToolHealthStatus {
    Healthy,
    Degraded,
    Offline,
}

/// Tool execution statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolStats {
    pub total_executions: u64,
    pub successful_executions: u64,
    pub failed_executions: u64,
    pub average_duration_ms: f64,
    pub last_execution_time: Option<String>,
    pub success_rate: f64,
}

impl ToolStats {
    pub fn new() -> Self {
        Self {
            total_executions: 0,
            successful_executions: 0,
            failed_executions: 0,
            average_duration_ms: 0.0,
            last_execution_time: None,
            success_rate: 1.0,
        }
    }

    pub fn record_execution(&mut self, success: bool, duration_ms: u128) {
        self.total_executions += 1;

        if success {
            self.successful_executions += 1;
        } else {
            self.failed_executions += 1;
        }

        // Update average duration
        let total_duration = self.average_duration_ms * ((self.total_executions - 1) as f64)
            + duration_ms as f64;
        self.average_duration_ms = total_duration / self.total_executions as f64;

        // Update success rate
        self.success_rate =
            self.successful_executions as f64 / self.total_executions as f64;

        // Update last execution time
        self.last_execution_time = Some(chrono::Utc::now().to_rfc3339());
    }
}

impl Default for ToolStats {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tool_error_creation() {
        let error = ToolError::new("EXEC_ERROR", "Execution failed");
        assert_eq!(error.code, "EXEC_ERROR");
        assert_eq!(error.message, "Execution failed");
        assert!(error.details.is_none());
    }

    #[test]
    fn test_tool_error_with_details() {
        let error = ToolError::new("EXEC_ERROR", "Execution failed")
            .with_details("Additional context here");
        assert!(error.details.is_some());
    }

    #[test]
    fn test_tool_result_success() {
        let data = serde_json::json!({"status": "ok"});
        let result = ToolResult::success("test-tool", "exec-123", data, 100);

        assert!(result.success);
        assert!(result.data.is_some());
        assert!(result.error.is_none());
        assert_eq!(result.duration_ms, 100);
    }

    #[test]
    fn test_tool_metadata_builder() {
        let metadata = ToolMetadata::new("tool-1", "Test Tool")
            .with_description("A test tool")
            .with_category("testing")
            .with_timeout(60);

        assert_eq!(metadata.id, "tool-1");
        assert_eq!(metadata.name, "Test Tool");
        assert_eq!(metadata.description, "A test tool");
        assert_eq!(metadata.category, "testing");
        assert_eq!(metadata.timeout_seconds, 60);
    }

    #[test]
    fn test_tool_stats_recording() {
        let mut stats = ToolStats::new();

        stats.record_execution(true, 50);
        stats.record_execution(true, 100);
        stats.record_execution(false, 75);

        assert_eq!(stats.total_executions, 3);
        assert_eq!(stats.successful_executions, 2);
        assert_eq!(stats.failed_executions, 1);
        assert!(stats.last_execution_time.is_some());
        assert!((stats.success_rate - (2.0 / 3.0)).abs() < 0.01);
    }
}
