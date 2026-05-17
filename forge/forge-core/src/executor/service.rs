use crate::models::*;
use crate::error::AppError;
use dashmap::DashMap;
use std::time::Instant;

/// Task execution service - orchestrates task execution and monitoring
pub struct ExecutorService {
    tasks: DashMap<String, Task>,
    executions: DashMap<String, ExecutionMetadata>,
}

struct ExecutionMetadata {
    start_time: Instant,
    priority: u32,
}

impl ExecutorService {
    pub fn new() -> Self {
        Self {
            tasks: DashMap::new(),
            executions: DashMap::new(),
        }
    }

    /// Submit a task for execution
    pub fn submit_task(&self, task: Task) -> Result<String, AppError> {
        let task_id = task.id.clone();

        self.tasks.insert(task_id.clone(), task);
        self.executions.insert(
            task_id.clone(),
            ExecutionMetadata {
                start_time: Instant::now(),
                priority: 0,
            },
        );

        Ok(task_id)
    }

    /// Get task status
    pub fn get_task_status(&self, id: &str) -> Result<Task, AppError> {
        self.tasks
            .get(id)
            .map(|t| t.clone())
            .ok_or_else(|| AppError::NotFound("Task not found".to_string()))
    }

    /// Update task status
    pub fn update_task_status(
        &self,
        id: &str,
        status: TaskStatus,
        output: Option<serde_json::Value>,
    ) -> Result<(), AppError> {
        if let Some(mut task) = self.tasks.get_mut(id) {
            task.status = status;
            task.output = output;

            if task.status == TaskStatus::Running && task.started_at.is_none() {
                task.started_at = Some(chrono::Utc::now());
            }

            if matches!(task.status, TaskStatus::Completed | TaskStatus::Failed | TaskStatus::Cancelled) {
                task.completed_at = Some(chrono::Utc::now());

                if let (Some(start), Some(end)) = (task.started_at, task.completed_at) {
                    task.duration_ms = Some(end.signed_duration_since(start).num_milliseconds() as u64);
                }
            }

            Ok(())
        } else {
            Err(AppError::NotFound("Task not found".to_string()))
        }
    }

    /// Mark task as failed
    pub fn mark_failed(&self, id: &str, error: String) -> Result<(), AppError> {
        if let Some(mut task) = self.tasks.get_mut(id) {
            task.status = TaskStatus::Failed;
            task.error = Some(error);
            task.completed_at = Some(chrono::Utc::now());

            if let Some(start) = task.started_at {
                task.duration_ms =
                    Some(task.completed_at.unwrap().signed_duration_since(start).num_milliseconds() as u64);
            }

            Ok(())
        } else {
            Err(AppError::NotFound("Task not found".to_string()))
        }
    }

    /// List all tasks
    pub fn list_tasks(&self) -> Vec<Task> {
        self.tasks
            .iter()
            .map(|entry| entry.value().clone())
            .collect()
    }

    /// List tasks by status
    pub fn list_by_status(&self, status: TaskStatus) -> Vec<Task> {
        self.tasks
            .iter()
            .filter(|entry| entry.value().status == status)
            .map(|entry| entry.value().clone())
            .collect()
    }

    /// Get queue statistics
    pub fn get_queue_stats(&self) -> QueueStatus {
        let queued = self.list_by_status(TaskStatus::Queued).len();
        let executing = self.list_by_status(TaskStatus::Running).len();
        let completed = self.list_by_status(TaskStatus::Completed).len();
        let failed = self.list_by_status(TaskStatus::Failed).len();

        let average_wait = self
            .executions
            .iter()
            .map(|entry| entry.value().start_time.elapsed().as_millis())
            .sum::<u128>() as f64
            / (queued + executing).max(1) as f64;

        QueueStatus {
            total_queued: queued,
            total_executing: executing,
            total_completed: completed,
            total_failed: failed,
            average_wait_time_ms: average_wait,
        }
    }
}

impl Default for ExecutorService {
    fn default() -> Self {
        Self::new()
    }
}

impl Clone for ExecutorService {
    fn clone(&self) -> Self {
        Self::new()
    }
}
