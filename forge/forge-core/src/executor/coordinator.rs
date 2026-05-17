use crate::agents::tools::ToolRegistry;
use crate::executor::db::DbPool;
use crate::executor::queue::{TaskItem, ToolQueue};
use serde_json::{json, Value as JsonValue};
use std::sync::Arc;
use std::time::Instant;

/// Coordinates task execution across the agent platform
/// Integrates tool execution, database persistence, and outcome tracking
/// Forms the outcome data flywheel: execution → history → metrics → router learning
pub struct AgentCoordinator {
    tool_registry: Arc<ToolRegistry>,
    queue: ToolQueue,
    db: DbPool,
}

impl AgentCoordinator {
    pub fn new(tool_registry: Arc<ToolRegistry>, queue: ToolQueue, db: DbPool) -> Self {
        AgentCoordinator {
            tool_registry,
            queue,
            db,
        }
    }

    /// Execute a single tool with full persistence and outcome tracking
    /// Records execution in database, feeding the outcome data flywheel
    pub async fn execute_tool(
        &self,
        task_id: &str,
        tool_id: &str,
        tool_name: &str,
        input: JsonValue,
        model_used: Option<&str>,
        input_complexity: Option<f64>,
    ) -> Result<ExecutionOutcome, String> {
        let start = Instant::now();
        let execution_id = uuid::Uuid::new_v4().to_string();

        // Get tool from registry
        let tool = self
            .tool_registry
            .get_tool(tool_id)
            .map_err(|e| format!("Tool not found: {}", e))?;

        // Execute tool
        let result = tool
            .execute(input.clone())
            .await
            .map_err(|e| format!("Tool execution failed: {}", e))?;

        let duration_ms = start.elapsed().as_millis() as i64;
        let success = result.success;
        let output = result.data;
        let error = result.error;

        // Calculate output complexity (simple heuristic)
        let output_complexity = calculate_complexity(&output);

        // Record in execution history (feeds outcome data flywheel)
        let history_id = self
            .db
            .record_execution(
                task_id,
                tool_id,
                tool_name,
                &execution_id,
                input,
                output.clone(),
                error.as_deref(),
                success,
                duration_ms,
                model_used,
                input_complexity,
                Some(output_complexity),
                1, // retry_attempt - starting at 1
            )
            .await
            .map_err(|e| format!("Failed to record execution: {}", e))?;

        // Database triggers automatically:
        // 1. Update tool_metrics (success_rate, duration stats, etc)
        // 2. Create episodic_memory record (if outcome significant)
        // 3. Aggregate into semantic_memory (if pattern detected)
        // 4. Create memory_relationships (linking memories)

        Ok(ExecutionOutcome {
            execution_id,
            tool_id: tool_id.to_string(),
            task_id: task_id.to_string(),
            success,
            output,
            error,
            duration_ms,
            history_id,
        })
    }

    /// Execute an entire task with multiple tool calls
    /// Orchestrates sequence of tool executions, handles retries and failures
    pub async fn execute_task(&self, task: TaskItem) -> Result<TaskExecution, String> {
        // Mark task as running (already done by dequeue, but confirm)
        self.db
            .update_task_status(&task.task_id, "running")
            .await?;

        // Store working memory for task context
        self.db
            .set_working_memory(
                &task.agent_id,
                &task.task_id,
                "execution_context",
                json!({
                    "priority": task.priority,
                    "retry_count": task.retry_count,
                    "max_retries": task.max_retries
                }),
                None, // No expiry for task context
            )
            .await?;

        let start = Instant::now();

        // For now, treat task input as a single tool call
        // Future: expand to parse ExecutionPlan with multiple tool calls
        
        match task.input {
            JsonValue::Object(map) if map.contains_key("tool_id") => {
                let tool_id = map
                    .get("tool_id")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| "Missing tool_id".to_string())?
                    .to_string();

                let tool_name = map
                    .get("tool_name")
                    .and_then(|v| v.as_str())
                    .unwrap_or(&tool_id)
                    .to_string();

                let input = map
                    .get("input")
                    .cloned()
                    .unwrap_or(JsonValue::Null);

                let input_complexity = calculate_complexity(&input);

                // Execute the tool
                let outcome = self
                    .execute_tool(
                        &task.task_id,
                        &tool_id,
                        &tool_name,
                        input,
                        None, // model_used
                        Some(input_complexity),
                    )
                    .await?;

                let duration_ms = start.elapsed().as_millis() as i64;

                if outcome.success {
                    // Mark task as completed
                    self.queue
                        .complete_success(&task.task_id, outcome.output.clone(), duration_ms)
                        .await?;

                    Ok(TaskExecution {
                        task_id: task.task_id,
                        success: true,
                        output: Some(outcome.output),
                        error: None,
                        duration_ms,
                        executions: vec![outcome],
                    })
                } else {
                    // Check if we can retry
                    if task.retry_count < task.max_retries {
                        self.queue.retry_task(&task.task_id).await?;
                        Err(format!("Task failed, queued for retry"))
                    } else {
                        // Mark as failed
                        let error_msg = outcome.error.unwrap_or_else(|| "Unknown error".to_string());
                        self.queue
                            .complete_failure(&task.task_id, &error_msg, duration_ms)
                            .await?;

                        Ok(TaskExecution {
                            task_id: task.task_id,
                            success: false,
                            output: None,
                            error: Some(error_msg),
                            duration_ms,
                            executions: vec![outcome],
                        })
                    }
                }
            }
            _ => Err("Invalid task input format".to_string()),
        }
    }

    /// Process queued tasks in a batch
    /// Typical worker loop: dequeue → execute → record outcome
    pub async fn process_batch(&self, batch_size: usize) -> Result<BatchResult, String> {
        let tasks = self.queue.dequeue(batch_size).await?;

        let mut results = Vec::new();
        let mut succeeded = 0;
        let mut failed = 0;

        for task in tasks {
            match self.execute_task(task).await {
                Ok(execution) => {
                    if execution.success {
                        succeeded += 1;
                    } else {
                        failed += 1;
                    }
                    results.push(execution);
                }
                Err(e) => {
                    // Log error but continue processing batch
                    tracing::error!("Task execution error: {}", e);
                    failed += 1;
                }
            }
        }

        Ok(BatchResult {
            processed: results.len(),
            succeeded,
            failed,
            executions: results,
        })
    }

    /// Get database handle for direct memory queries
    pub fn db(&self) -> &DbPool {
        &self.db
    }

    /// Get queue handle for status queries
    pub fn queue(&self) -> &ToolQueue {
        &self.queue
    }
}

#[derive(Debug, Clone)]
pub struct ExecutionOutcome {
    pub execution_id: String,
    pub tool_id: String,
    pub task_id: String,
    pub success: bool,
    pub output: Option<JsonValue>,
    pub error: Option<String>,
    pub duration_ms: i64,
    pub history_id: i64,
}

#[derive(Debug, Clone)]
pub struct TaskExecution {
    pub task_id: String,
    pub success: bool,
    pub output: Option<JsonValue>,
    pub error: Option<String>,
    pub duration_ms: i64,
    pub executions: Vec<ExecutionOutcome>,
}

#[derive(Debug, Clone)]
pub struct BatchResult {
    pub processed: usize,
    pub succeeded: usize,
    pub failed: usize,
    pub executions: Vec<TaskExecution>,
}

/// Simple complexity heuristic based on JSON structure
/// Used to track input/output complexity for router training data
fn calculate_complexity(value: &JsonValue) -> f64 {
    match value {
        JsonValue::Null => 0.0,
        JsonValue::Bool(_) => 0.1,
        JsonValue::Number(_) => 0.15,
        JsonValue::String(s) => {
            // Length-based: short strings are simple, long are complex
            let len = s.len() as f64;
            (len.log10() / 10.0).min(0.5) // Cap at 0.5 for strings
        }
        JsonValue::Array(arr) => {
            // Arrays: base 0.6 + avg element complexity
            if arr.is_empty() {
                0.6
            } else {
                let avg = arr.iter().map(calculate_complexity).sum::<f64>() / arr.len() as f64;
                0.6 + (avg * 0.3)
            }
        }
        JsonValue::Object(obj) => {
            // Objects: base 0.7 + avg value complexity
            if obj.is_empty() {
                0.7
            } else {
                let avg = obj
                    .values()
                    .map(calculate_complexity)
                    .sum::<f64>()
                    / obj.len() as f64;
                0.7 + (avg * 0.25)
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_complexity_calculation() {
        assert_eq!(calculate_complexity(&JsonValue::Null), 0.0);
        assert_eq!(calculate_complexity(&JsonValue::Bool(true)), 0.1);
        
        let obj = json!({"key": "value"});
        let complexity = calculate_complexity(&obj);
        assert!(complexity > 0.7 && complexity < 1.0);
    }

    #[test]
    fn test_complexity_array() {
        let arr = json!([1, 2, 3]);
        let complexity = calculate_complexity(&arr);
        assert!(complexity > 0.6 && complexity < 0.9);
    }
}
