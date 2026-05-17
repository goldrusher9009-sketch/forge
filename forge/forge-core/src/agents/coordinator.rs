use crate::agents::tool_interface::{AgentTool, ToolError, ToolResult};
use crate::agents::tool_registry::ToolRegistry;
use dashmap::DashMap;
use futures::future;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// Execution plan describing which tools to use and in what order
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionPlan {
    pub task_id: String,
    pub tools: Vec<ToolCall>,
    pub metadata: serde_json::Value,
}

/// A single tool call in an execution plan
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCall {
    pub tool_id: String,
    pub input: serde_json::Value,
    pub dependencies: Vec<usize>, // Indices of tools this depends on
    pub priority: u32,
}

/// Result of coordinated execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoordinatedResult {
    pub task_id: String,
    pub success: bool,
    pub results: Vec<ToolResult>,
    pub errors: Vec<String>,
    pub total_duration_ms: u128,
    pub execution_order: Vec<String>,
}

/// Agent Coordinator - orchestrates tool selection and execution
pub struct AgentCoordinator {
    registry: Arc<ToolRegistry>,
    execution_cache: DashMap<String, CoordinatedResult>,
}

impl AgentCoordinator {
    /// Create a new coordinator with a tool registry
    pub fn new(registry: Arc<ToolRegistry>) -> Self {
        Self {
            registry,
            execution_cache: DashMap::new(),
        }
    }

    /// Execute a plan in sequence
    pub async fn execute_plan(&self, plan: ExecutionPlan) -> Result<CoordinatedResult, ToolError> {
        let mut results = Vec::new();
        let mut errors = Vec::new();
        let mut execution_order = Vec::new();
        let start_time = std::time::Instant::now();

        // Validate plan before execution
        self.validate_plan(&plan)?;

        // Execute tools in order, respecting dependencies
        for (idx, tool_call) in plan.tools.iter().enumerate() {
            // Check if all dependencies have been satisfied
            if !tool_call.dependencies.is_empty() {
                for dep_idx in &tool_call.dependencies {
                    if *dep_idx >= idx {
                        return Err(ToolError::new(
                            "INVALID_DEPENDENCY",
                            format!("Tool {} has invalid forward dependency", idx),
                        ));
                    }

                    // Check if dependency was successful
                    if *dep_idx < results.len() && !results[*dep_idx].success {
                        return Err(ToolError::new(
                            "DEPENDENCY_FAILED",
                            format!("Dependency tool {} failed", dep_idx),
                        ));
                    }
                }
            }

            // Get and execute tool
            match self.registry.get_tool(&tool_call.tool_id) {
                Ok(tool) => {
                    if !self.registry.is_available(&tool_call.tool_id).unwrap_or(false) {
                        let error = format!("Tool {} is not available", tool_call.tool_id);
                        errors.push(error.clone());
                        results.push(ToolResult {
                            success: false,
                            data: None,
                            error: Some(ToolError::new("TOOL_UNAVAILABLE", error)),
                            duration_ms: 0,
                            tool_name: tool_call.tool_id.clone(),
                            execution_id: format!("{}-{}", plan.task_id, idx),
                        });
                        continue;
                    }

                    let execution_id = format!("{}-{}", plan.task_id, idx);
                    let call_start = std::time::Instant::now();

                    match tool.execute(tool_call.input.clone(), execution_id.clone()).await {
                        Ok(mut result) => {
                            let duration_ms = call_start.elapsed().as_millis();
                            result.duration_ms = duration_ms;

                            // Update tool statistics
                            let _ = self.registry.update_stats(&tool_call.tool_id, true, duration_ms);

                            execution_order.push(tool_call.tool_id.clone());
                            results.push(result);
                        }
                        Err(e) => {
                            let duration_ms = call_start.elapsed().as_millis();
                            let error = format!("Tool {} execution failed: {}", tool_call.tool_id, e);
                            errors.push(error.clone());

                            // Update tool statistics
                            let _ = self.registry.update_stats(&tool_call.tool_id, false, duration_ms);

                            results.push(ToolResult {
                                success: false,
                                data: None,
                                error: Some(e),
                                duration_ms,
                                tool_name: tool_call.tool_id.clone(),
                                execution_id,
                            });
                        }
                    }
                }
                Err(e) => {
                    let error = format!("Tool {} not found: {}", tool_call.tool_id, e);
                    errors.push(error.clone());
                    results.push(ToolResult {
                        success: false,
                        data: None,
                        error: Some(e),
                        duration_ms: 0,
                        tool_name: tool_call.tool_id.clone(),
                        execution_id: format!("{}-{}", plan.task_id, idx),
                    });
                }
            }
        }

        let total_duration_ms = start_time.elapsed().as_millis();
        let success = errors.is_empty() && results.iter().all(|r| r.success);

        let result = CoordinatedResult {
            task_id: plan.task_id.clone(),
            success,
            results,
            errors,
            total_duration_ms,
            execution_order,
        };

        // Cache result
        self.execution_cache
            .insert(plan.task_id.clone(), result.clone());

        Ok(result)
    }

    /// Execute multiple plans in parallel
    pub async fn execute_plans_parallel(
        &self,
        plans: Vec<ExecutionPlan>,
    ) -> Vec<Result<CoordinatedResult, ToolError>> {
        future::join_all(
            plans
                .into_iter()
                .map(|plan| self.execute_plan(plan))
        )
        .await
    }

    /// Get cached execution result
    pub fn get_cached_result(&self, task_id: &str) -> Option<CoordinatedResult> {
        self.execution_cache
            .get(task_id)
            .map(|entry| entry.value().clone())
    }

    /// Clear execution cache
    pub fn clear_cache(&self) {
        self.execution_cache.clear();
    }

    /// Get tool registry reference
    pub fn registry(&self) -> &ToolRegistry {
        &self.registry
    }

    /// Validate an execution plan
    fn validate_plan(&self, plan: &ExecutionPlan) -> Result<(), ToolError> {
        // Check plan has tools
        if plan.tools.is_empty() {
            return Err(ToolError::new("INVALID_PLAN", "Execution plan must contain at least one tool"));
        }

        // Check task ID is not empty
        if plan.task_id.is_empty() {
            return Err(ToolError::new("INVALID_PLAN", "Task ID cannot be empty"));
        }

        // Validate each tool call
        for (idx, tool_call) in plan.tools.iter().enumerate() {
            // Check tool exists
            if !self.registry.tool_exists(&tool_call.tool_id) {
                return Err(ToolError::new(
                    "TOOL_NOT_FOUND",
                    format!("Tool '{}' in plan does not exist", tool_call.tool_id),
                ));
            }

            // Check dependencies are valid
            for dep_idx in &tool_call.dependencies {
                if *dep_idx >= idx {
                    return Err(ToolError::new(
                        "INVALID_DEPENDENCY",
                        format!("Tool at index {} has invalid forward dependency", idx),
                    ));
                }
            }
        }

        Ok(())
    }
}

impl Clone for AgentCoordinator {
    fn clone(&self) -> Self {
        Self {
            registry: self.registry.clone(),
            execution_cache: DashMap::new(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agents::tool_interface::{ToolMetadata, AgentTool};

    struct TestTool {
        metadata: ToolMetadata,
    }

    impl TestTool {
        fn new(id: &str) -> Self {
            Self {
                metadata: ToolMetadata::new(id, format!("Tool {}", id))
                    .with_category("test"),
            }
        }
    }

    impl AgentTool for TestTool {
        fn metadata(&self) -> &ToolMetadata {
            &self.metadata
        }

        async fn execute(
            &self,
            input: serde_json::Value,
            execution_id: String,
        ) -> Result<ToolResult, ToolError> {
            Ok(ToolResult::success(
                &self.metadata.name,
                execution_id,
                input,
                10,
            ))
        }
    }

    #[tokio::test]
    async fn test_execute_single_tool_plan() {
        let registry = Arc::new(ToolRegistry::new());
        registry.register_tool(Arc::new(TestTool::new("tool-1"))).unwrap();

        let coordinator = AgentCoordinator::new(registry);

        let plan = ExecutionPlan {
            task_id: "task-1".to_string(),
            tools: vec![
                ToolCall {
                    tool_id: "tool-1".to_string(),
                    input: serde_json::json!({"param": "value"}),
                    dependencies: vec![],
                    priority: 0,
                },
            ],
            metadata: serde_json::json!({}),
        };

        let result = coordinator.execute_plan(plan).await;
        assert!(result.is_ok());

        let coordinated = result.unwrap();
        assert!(coordinated.success);
        assert_eq!(coordinated.results.len(), 1);
        assert_eq!(coordinated.execution_order.len(), 1);
    }

    #[tokio::test]
    async fn test_execute_plan_with_invalid_tool() {
        let registry = Arc::new(ToolRegistry::new());
        let coordinator = AgentCoordinator::new(registry);

        let plan = ExecutionPlan {
            task_id: "task-1".to_string(),
            tools: vec![
                ToolCall {
                    tool_id: "nonexistent-tool".to_string(),
                    input: serde_json::json!({}),
                    dependencies: vec![],
                    priority: 0,
                },
            ],
            metadata: serde_json::json!({}),
        };

        let result = coordinator.execute_plan(plan).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_execute_plan_empty() {
        let registry = Arc::new(ToolRegistry::new());
        let coordinator = AgentCoordinator::new(registry);

        let plan = ExecutionPlan {
            task_id: "task-1".to_string(),
            tools: vec![],
            metadata: serde_json::json!({}),
        };

        let result = coordinator.execute_plan(plan).await;
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_plan_with_forward_dependency() {
        let registry = Arc::new(ToolRegistry::new());
        registry.register_tool(Arc::new(TestTool::new("tool-1"))).unwrap();
        registry.register_tool(Arc::new(TestTool::new("tool-2"))).unwrap();

        let coordinator = AgentCoordinator::new(registry);

        let plan = ExecutionPlan {
            task_id: "task-1".to_string(),
            tools: vec![
                ToolCall {
                    tool_id: "tool-1".to_string(),
                    input: serde_json::json!({}),
                    dependencies: vec![1], // Forward dependency on tool-2
                    priority: 0,
                },
                ToolCall {
                    tool_id: "tool-2".to_string(),
                    input: serde_json::json!({}),
                    dependencies: vec![],
                    priority: 0,
                },
            ],
            metadata: serde_json::json!({}),
        };

        let result = coordinator.validate_plan(&plan);
        assert!(result.is_err());
    }
}
