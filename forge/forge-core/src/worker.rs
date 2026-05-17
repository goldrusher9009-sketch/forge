use crate::config::Config;
use crate::error::ForgeError;
use crate::executor::coordinator::AgentCoordinator;
use crate::models::{Task, TaskStatus};
use sqlx::PgPool;
use std::sync::Arc;
use std::time::Duration;
use tokio::time::sleep;

pub struct Worker {
    db: Arc<PgPool>,
    coordinator: Arc<AgentCoordinator>,
    config: Config,
    tasks_processed: std::sync::atomic::AtomicU64,
    tasks_failed: std::sync::atomic::AtomicU64,
}

impl Worker {
    pub fn new(db: Arc<PgPool>, coordinator: Arc<AgentCoordinator>, config: Config) -> Self {
        Worker {
            db,
            coordinator,
            config,
            tasks_processed: std::sync::atomic::AtomicU64::new(0),
            tasks_failed: std::sync::atomic::AtomicU64::new(0),
        }
    }

    async fn dequeue_tasks(&self, batch_size: i64) -> Result<Vec<Task>, ForgeError> {
        let tasks = sqlx::query_as::<_, Task>(
            r#"
            UPDATE task_queue
            SET status = $1, updated_at = NOW(), worker_id = $2
            WHERE id = ANY(
                SELECT id FROM task_queue
                WHERE status = $3
                ORDER BY priority DESC, created_at ASC
                LIMIT $4
                FOR UPDATE SKIP LOCKED
            )
            RETURNING *
            "#,
        )
        .bind(TaskStatus::Processing.to_string())
        .bind(std::process::id().to_string())
        .bind(TaskStatus::Queued.to_string())
        .bind(batch_size)
        .fetch_all(self.db.as_ref())
        .await?;

        Ok(tasks)
    }

    async fn process_task(&self, task: Task) -> Result<(), ForgeError> {
        let start = std::time::Instant::now();
        tracing::debug!("Processing task: {}", task.id);

        match self.coordinator.execute_task(&task).await {
            Ok(result) => {
                sqlx::query(
                    "UPDATE task_queue SET status = $1, result = $2, completed_at = NOW() WHERE id = $3"
                )
                .bind(TaskStatus::Completed.to_string())
                .bind(serde_json::to_string(&result)?)
                .bind(&task.id)
                .execute(self.db.as_ref())
                .await?;

                let elapsed = start.elapsed().as_millis();
                self.tasks_processed.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                tracing::info!("Task {} completed in {}ms", task.id, elapsed);
                Ok(())
            }
            Err(e) => {
                let retry_count = task.retry_count.unwrap_or(0);
                let max_retries = self.config.max_retries.unwrap_or(3);

                if retry_count < max_retries {
                    sqlx::query(
                        "UPDATE task_queue SET status = $1, retry_count = $2, updated_at = NOW() WHERE id = $3"
                    )
                    .bind(TaskStatus::Queued.to_string())
                    .bind(retry_count + 1)
                    .bind(&task.id)
                    .execute(self.db.as_ref())
                    .await?;

                    tracing::warn!("Task {} queued for retry ({}/{})", task.id, retry_count + 1, max_retries);
                } else {
                    sqlx::query(
                        "UPDATE task_queue SET status = $1, error = $2, completed_at = NOW() WHERE id = $3"
                    )
                    .bind(TaskStatus::Failed.to_string())
                    .bind(e.to_string())
                    .bind(&task.id)
                    .execute(self.db.as_ref())
                    .await?;

                    self.tasks_failed.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    tracing::error!("Task {} failed after {} retries: {}", task.id, max_retries, e);
                }
                Ok(())
            }
        }
    }

    async fn handle_stale_tasks(&self) -> Result<(), ForgeError> {
        let count = sqlx::query_scalar::<_, i64>(
            "UPDATE task_queue SET status = $1, retry_count = retry_count + 1 WHERE status = $2 AND updated_at < NOW() - INTERVAL '5 minutes' RETURNING COUNT(*)"
        )
        .bind(TaskStatus::Queued.to_string())
        .bind(TaskStatus::Processing.to_string())
        .fetch_optional(self.db.as_ref())
        .await?
        .unwrap_or(0);

        if count > 0 {
            tracing::warn!("Recovered {} stale tasks from processing state", count);
        }
        Ok(())
    }

    async fn update_worker_status(&self) -> Result<(), ForgeError> {
        let processed = self.tasks_processed.load(std::sync::atomic::Ordering::Relaxed);
        let failed = self.tasks_failed.load(std::sync::atomic::Ordering::Relaxed);

        sqlx::query(
            "UPDATE workers SET last_heartbeat = NOW(), tasks_processed = $1, tasks_failed = $2 WHERE id = $3"
        )
        .bind(processed as i64)
        .bind(failed as i64)
        .bind(std::process::id().to_string())
        .execute(self.db.as_ref())
        .await?;

        Ok(())
    }

    async fn heartbeat_loop(&self) -> Result<(), ForgeError> {
        let mut interval = tokio::time::interval(Duration::from_secs(30));

        loop {
            interval.tick().await;
            let _ = self.update_worker_status().await;
            let _ = self.handle_stale_tasks().await;
        }
    }

    async fn run(&self) -> Result<(), ForgeError> {
        tracing::info!("Worker started with batch size: {}", self.config.worker_batch_size);

        let heartbeat = tokio::spawn({
            let slf = self.clone_ref();
            async move {
                let _ = slf.heartbeat_loop().await;
            }
        });

        loop {
            match self.dequeue_tasks(self.config.worker_batch_size) {
                Ok(tasks) => {
                    if tasks.is_empty() {
                        sleep(Duration::from_millis(self.config.worker_poll_interval_ms)).await;
                        continue;
                    }

                    tracing::debug!("Dequeued {} tasks", tasks.len());

                    for task in tasks {
                        if let Err(e) = self.process_task(task).await {
                            tracing::error!("Error processing task: {}", e);
                        }
                    }
                }
                Err(e) => {
                    tracing::error!("Error dequeuing tasks: {}", e);
                    sleep(Duration::from_secs(1)).await;
                }
            }
        }
    }

    fn clone_ref(&self) -> Arc<Self> {
        Arc::new(Worker {
            db: self.db.clone(),
            coordinator: self.coordinator.clone(),
            config: self.config.clone(),
            tasks_processed: std::sync::atomic::AtomicU64::new(
                self.tasks_processed.load(std::sync::atomic::Ordering::Relaxed),
            ),
            tasks_failed: std::sync::atomic::AtomicU64::new(
                self.tasks_failed.load(std::sync::atomic::Ordering::Relaxed),
            ),
        })
    }
}

pub async fn start_worker(config: Config) -> Result<(), ForgeError> {
    let db = Arc::new(
        sqlx::PgPool::connect(&config.database_url)
            .await
            .map_err(|e| ForgeError::DatabaseError(e.to_string()))?,
    );

    let coordinator = Arc::new(AgentCoordinator::new(db.clone(), config.clone()).await?);
    let worker = Worker::new(db, coordinator, config);

    worker.run().await
}

pub async fn initialize_worker_pool(
    db: Arc<PgPool>,
    num_workers: usize,
    config: Config,
) -> Result<Vec<tokio::task::JoinHandle<Result<(), ForgeError>>>, ForgeError> {
    let mut handles = Vec::new();

    for i in 0..num_workers {
        let db_clone = db.clone();
        let config_clone = config.clone();

        let handle = tokio::spawn(async move {
            let coordinator = Arc::new(
                AgentCoordinator::new(db_clone.clone(), config_clone.clone()).await?
            );
            let worker = Worker::new(db_clone, coordinator, config_clone);

            tracing::info!("Worker {} starting", i);
            worker.run().await
        });

        handles.push(handle);
    }

    Ok(handles)
}
