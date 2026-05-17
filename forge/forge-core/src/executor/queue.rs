use crate::executor::db::DbPool;
use serde_json::Value as JsonValue;
use std::sync::Arc;

/// Tool call specification within an execution plan
/// Captures the tool to execute and its input parameters
#[derive(Debug, Clone)]
pub struct ToolCall {
    pub tool_id: String,
    pub tool_name: String,
    pub input: JsonValue,
}

/// Execution plan for a task
/// Specifies which tools to execute and in what order
#[derive(Debug, Clone)]
pub struct ExecutionPlan {
    pub task_id: String,
    pub agent_id: String,
    pub tool_calls: Vec<ToolCall>,
}

/// Database-backed task queue for durable execution
/// Replaces in-memory DashMap with PostgreSQL for persistence
/// Tasks survive application restarts and are executed in priority order
#[derive(Clone)]
pub struct ToolQueue {
    db: DbPool,
}

impl ToolQueue {
    /// Create new database-backed queue
    pub fn new(db: DbPool) -> Self {
        ToolQueue { db }
    }

    /// Enqueue a new task
    /// Returns error if task already exists (prevents duplicate execution)
    pub async fn enqueue(
        &self,
        task_id: &str,
        agent_id: &str,
        input: JsonValue,
        priority: i32,
    ) -> Result<(), String> {
        self.db
            .create_task(task_id, agent_id, input, priority, None)
            .await
            .map_err(|e| format!("Failed to enqueue task: {}", e))
    }

    /// Dequeue one task (highest priority first)
    /// Returns the next task to execute and marks it as running
    pub async fn dequeue(&self, batch_size: usize) -> Result<Vec<TaskItem>, String> {
        let queued = self.db
            .get_queued_tasks(batch_size as i64)
            .await
            .map_err(|e| format!("Failed to dequeue tasks: {}", e))?;

        let mut results = Vec::new();

        for task in queued {
            // Mark task as running
            self.db
                .update_task_status(&task.id, "running")
                .await
                .map_err(|e| format!("Failed to update task status: {}", e))?;

            results.push(TaskItem {
                task_id: task.id,
                agent_id: task.agent_id,
                input: task.input,
                priority: task.priority,
                retry_count: task.retry_count,
                max_retries: task.max_retries,
            });
        }

        Ok(results)
    }

    /// Get queue size (number of queued tasks)
    pub async fn size(&self) -> Result<i64, String> {
        let tasks = self.db
            .get_queued_tasks(1000000) // Get all queued tasks (assuming limit < 1M)
            .await
            .map_err(|e| format!("Failed to get queue size: {}", e))?;

        Ok(tasks.len() as i64)
    }

    /// Mark task as completed successfully
    pub async fn complete_success(
        &self,
        task_id: &str,
        output: JsonValue,
        duration_ms: i64,
    ) -> Result<(), String> {
        self.db
            .complete_task(task_id, "completed", Some(output), None, duration_ms)
            .await
            .map_err(|e| format!("Failed to complete task: {}", e))
    }

    /// Mark task as failed
    pub async fn complete_failure(
        &self,
        task_id: &str,
        error: &str,
        duration_ms: i64,
    ) -> Result<(), String> {
        self.db
            .complete_task(task_id, "failed", None, Some(error), duration_ms)
            .await
            .map_err(|e| format!("Failed to mark task failed: {}", e))
    }

    /// Retry a failed task (increments retry_count)
    pub async fn retry_task(&self, task_id: &str) -> Result<(), String> {
        // Get current task
        let task = self.db
            .get_task(task_id)
            .await
            .map_err(|e| format!("Failed to get task for retry: {}", e))?
            .ok_or_else(|| format!("Task {} not found", task_id))?;

        // Check if retries remain
        if task.retry_count >= task.max_retries {
            return Err(format!(
                "Task {} exceeded max retries ({}/{})",
                task_id, task.retry_count, task.max_retries
            ));
        }

        // Reset status to queued for retry
        self.db
            .update_task_status(task_id, "queued")
            .await
            .map_err(|e| format!("Failed to reset task for retry: {}", e))
    }

    /// Get database handle for direct queries
    pub fn db(&self) -> &DbPool {
        &self.db
    }
}

/// Item returned from dequeue operation
#[derive(Debug, Clone)]
pub struct TaskItem {
    pub task_id: String,
    pub agent_id: String,
    pub input: JsonValue,
    pub priority: i32,
    pub retry_count: i32,
    pub max_retries: i32,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[tokio::test]
    #[ignore]  // Run with: cargo test -- --ignored --test-threads=1
    async fn test_queue_enqueue_dequeue() {
        // Integration test requires DATABASE_URL env var
        let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
        let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");
        let queue = ToolQueue::new(db);

        let task_id = format!("test-task-{}", uuid::Uuid::new_v4());
        let input = json!({"action": "test"});

        // Enqueue
        queue
            .enqueue(&task_id, "agent-1", input.clone(), 2)
            .await
            .expect("Failed to enqueue");

        // Verify size increased
        let size = queue.size().await.expect("Failed to get size");
        assert!(size > 0, "Queue should not be empty after enqueue");

        // Dequeue
        let items = queue.dequeue(1).await.expect("Failed to dequeue");
        assert!(!items.is_empty(), "Should have dequeued at least one task");
        assert_eq!(items[0].task_id, task_id);

        // Complete
        let output = json!({"result": "success"});
        queue
            .complete_success(&task_id, output, 100)
            .await
            .expect("Failed to complete");

        // Verify task is completed
        let task = queue
            .db()
            .get_task(&task_id)
            .await
            .expect("Failed to get task")
            .expect("Task should exist");
        assert_eq!(task.status, "completed");
    }
}
