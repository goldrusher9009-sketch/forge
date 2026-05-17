// ============================================================================
// CONCURRENT OPERATIONS TESTS WITH SQLX AND REAL DATABASE LOCKING
// ============================================================================
// Real concurrent database operations with PostgreSQL transaction isolation
// and actual row-level locking to test race condition handling

#[cfg(test)]
mod tests {
    use crate::models::*;
    use crate::tests::integration::fixtures::TestContext;
    use serde_json::json;
    use sqlx::PgPool;
    use std::sync::atomic::{AtomicU32, Ordering};
    use std::sync::Arc;

    // ========================================================================
    // CONCURRENT AGENT CREATION WITH UNIQUE CONSTRAINT
    // ========================================================================

    #[sqlx::test(migrations = "./migrations")]
    async fn test_concurrent_agent_creation_unique_constraint(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);

        // Attempt to create 5 agents concurrently with same ID
        let agent_id = format!("concurrent-agent-{}", uuid::Uuid::new_v4());
        let agent_id_clone = agent_id.clone();
        let success_count = Arc::new(AtomicU32::new(0));
        let constraint_violations = Arc::new(AtomicU32::new(0));

        let mut handles = vec![];

        for i in 0..5 {
            let pool = ctx.pool.clone();
            let agent_id = agent_id.clone();
            let success = success_count.clone();
            let violations = constraint_violations.clone();

            let handle = tokio::spawn(async move {
                let config = AgentConfig {
                    model: "claude-opus".to_string(),
                    temperature: 0.7,
                    max_tokens: 2048,
                    timeout_seconds: 30,
                    retry_count: 3,
                    custom_params: json!({}),
                };

                let result = sqlx::query(
                    r#"
                    INSERT INTO agents (id, name, description, agent_type, enabled, config, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    "#,
                )
                .bind(&agent_id)
                .bind(format!("Concurrent Agent {}", i))
                .bind("Testing concurrent creation")
                .bind("Email")
                .bind(true)
                .bind(serde_json::to_string(&config).unwrap())
                .bind(chrono::Utc::now())
                .bind(chrono::Utc::now())
                .execute(&pool)
                .await;

                match result {
                    Ok(_) => {
                        success.fetch_add(1, Ordering::SeqCst);
                    }
                    Err(_) => {
                        violations.fetch_add(1, Ordering::SeqCst);
                    }
                }
            });

            handles.push(handle);
        }

        // Wait for all concurrent inserts
        for handle in handles {
            handle.await.unwrap();
        }

        let successful = success_count.load(Ordering::SeqCst);
        let failed = constraint_violations.load(Ordering::SeqCst);

        // Only 1 should succeed, 4 should fail with unique constraint
        assert_eq!(successful, 1, "Exactly one insert should succeed");
        assert_eq!(failed, 4, "Four inserts should fail with unique constraint");

        // Verify the successful insert is in database
        let row = sqlx::query!("SELECT id FROM agents WHERE id = $1", agent_id_clone)
            .fetch_one(&ctx.pool)
            .await
            .expect("Agent should exist");

        assert_eq!(row.id, agent_id_clone);

        ctx.cleanup().await;
    }

    // ========================================================================
    // CONCURRENT TASK UPDATES WITH OPTIMISTIC LOCKING
    // ========================================================================

    #[sqlx::test(migrations = "./migrations")]
    async fn test_concurrent_task_status_updates(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;
        let task = ctx.create_test_task(&agent.id).await;

        // Multiple workers trying to transition task status concurrently
        // Queued (0) -> Running (1) -> Completed (2)
        let task_id = task.id.clone();
        let successful_transitions = Arc::new(AtomicU32::new(0));
        let failed_transitions = Arc::new(AtomicU32::new(0));

        let mut handles = vec![];

        for _ in 0..5 {
            let pool = ctx.pool.clone();
            let task_id = task_id.clone();
            let success = successful_transitions.clone();
            let failures = failed_transitions.clone();

            let handle = tokio::spawn(async move {
                let now = chrono::Utc::now();

                // Try to transition from Queued to Running
                let result = sqlx::query(
                    "UPDATE tasks SET status = $1, started_at = $2, updated_at = $3 WHERE id = $4 AND status = $5",
                )
                .bind("Running")
                .bind(now)
                .bind(now)
                .bind(&task_id)
                .bind("Queued")
                .execute(&pool)
                .await;

                match result {
                    Ok(result) => {
                        if result.rows_affected() > 0 {
                            success.fetch_add(1, Ordering::SeqCst);
                        } else {
                            failures.fetch_add(1, Ordering::SeqCst);
                        }
                    }
                    Err(_) => {
                        failures.fetch_add(1, Ordering::SeqCst);
                    }
                }
            });

            handles.push(handle);
        }

        for handle in handles {
            handle.await.unwrap();
        }

        let successful = successful_transitions.load(Ordering::SeqCst);
        let failed = failed_transitions.load(Ordering::SeqCst);

        // Only 1 should successfully update (move from Queued to Running)
        assert_eq!(successful, 1, "Only one transition should succeed");
        assert_eq!(failed, 4, "Four transitions should fail (task already running)");

        // Verify final task status
        let final_task = sqlx::query!(
            "SELECT status, started_at FROM tasks WHERE id = $1",
            task_id
        )
        .fetch_one(&ctx.pool)
        .await
        .expect("Task should exist");

        assert_eq!(final_task.status, "Running");
        assert!(final_task.started_at.is_some());

        ctx.cleanup().await;
    }

    // ========================================================================
    // CONCURRENT READS ON SAME AGENT (SHARED LOCK)
    // ========================================================================

    #[sqlx::test(migrations = "./migrations")]
    async fn test_concurrent_read_same_agent(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;

        let agent_id = agent.id.clone();
        let successful_reads = Arc::new(AtomicU32::new(0));
        let read_errors = Arc::new(AtomicU32::new(0));

        let mut handles = vec![];

        // 20 concurrent read operations on same agent
        for _ in 0..20 {
            let pool = ctx.pool.clone();
            let agent_id = agent_id.clone();
            let reads = successful_reads.clone();
            let errors = read_errors.clone();

            let handle = tokio::spawn(async move {
                let result = sqlx::query!(
                    "SELECT id, name, enabled FROM agents WHERE id = $1",
                    agent_id
                )
                .fetch_optional(&pool)
                .await;

                match result {
                    Ok(Some(_)) => {
                        reads.fetch_add(1, Ordering::SeqCst);
                    }
                    Ok(None) => {
                        errors.fetch_add(1, Ordering::SeqCst);
                    }
                    Err(_) => {
                        errors.fetch_add(1, Ordering::SeqCst);
                    }
                }
            });

            handles.push(handle);
        }

        for handle in handles {
            handle.await.unwrap();
        }

        let successful = successful_reads.load(Ordering::SeqCst);
        let failed = read_errors.load(Ordering::SeqCst);

        // All 20 reads should succeed (reads don't block each other)
        assert_eq!(successful, 20, "All concurrent reads should succeed");
        assert_eq!(failed, 0, "No reads should fail");

        ctx.cleanup().await;
    }

    // ========================================================================
    // CONCURRENT READ AND WRITE ON SAME TASK
    // ========================================================================

    #[sqlx::test(migrations = "./migrations")]
    async fn test_concurrent_read_write_same_task(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;
        let task = ctx.create_test_task(&agent.id).await;

        let task_id = task.id.clone();
        let write_count = Arc::new(AtomicU32::new(0));
        let read_count = Arc::new(AtomicU32::new(0));
        let write_errors = Arc::new(AtomicU32::new(0));
        let read_errors = Arc::new(AtomicU32::new(0));

        let mut handles = vec![];

        // 1 writer
        let pool = ctx.pool.clone();
        let task_id_write = task_id.clone();
        let writes = write_count.clone();
        let write_errs = write_errors.clone();

        let write_handle = tokio::spawn(async move {
            for i in 0..5 {
                let now = chrono::Utc::now();
                let output = json!({"iteration": i});

                let result = sqlx::query(
                    "UPDATE tasks SET output = $1, updated_at = $2 WHERE id = $3",
                )
                .bind(serde_json::to_string(&output).unwrap())
                .bind(now)
                .bind(&task_id_write)
                .execute(&pool)
                .await;

                match result {
                    Ok(_) => {
                        writes.fetch_add(1, Ordering::SeqCst);
                    }
                    Err(_) => {
                        write_errs.fetch_add(1, Ordering::SeqCst);
                    }
                }

                tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
            }
        });

        handles.push(write_handle);

        // 5 readers
        for _ in 0..5 {
            let pool = ctx.pool.clone();
            let task_id = task_id.clone();
            let reads = read_count.clone();
            let read_errs = read_errors.clone();

            let read_handle = tokio::spawn(async move {
                for _ in 0..5 {
                    let result = sqlx::query!("SELECT id, output FROM tasks WHERE id = $1", task_id)
                        .fetch_optional(&pool)
                        .await;

                    match result {
                        Ok(Some(_)) => {
                            reads.fetch_add(1, Ordering::SeqCst);
                        }
                        Ok(None) => {
                            read_errs.fetch_add(1, Ordering::SeqCst);
                        }
                        Err(_) => {
                            read_errs.fetch_add(1, Ordering::SeqCst);
                        }
                    }

                    tokio::time::sleep(tokio::time::Duration::from_millis(5)).await;
                }
            });

            handles.push(read_handle);
        }

        for handle in handles {
            handle.await.unwrap();
        }

        let writes = write_count.load(Ordering::SeqCst);
        let reads = read_count.load(Ordering::SeqCst);
        let write_fails = write_errors.load(Ordering::SeqCst);
        let read_fails = read_errors.load(Ordering::SeqCst);

        // 5 writes should succeed
        assert_eq!(writes, 5, "All writes should succeed");
        assert_eq!(write_fails, 0, "No writes should fail");

        // 25 reads (5 readers * 5 iterations) should succeed
        assert_eq!(reads, 25, "All concurrent reads should succeed");
        assert_eq!(read_fails, 0, "No reads should fail");

        ctx.cleanup().await;
    }

    // ========================================================================
    // CONCURRENT TASK CREATION FOR SAME AGENT (FOREIGN KEY)
    // ========================================================================

    #[sqlx::test(migrations = "./migrations")]
    async fn test_concurrent_task_creation_same_agent(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;

        let agent_id = agent.id.clone();
        let successful_creates = Arc::new(AtomicU32::new(0));
        let create_errors = Arc::new(AtomicU32::new(0));

        let mut handles = vec![];

        // 10 concurrent task creations for same agent
        for i in 0..10 {
            let pool = ctx.pool.clone();
            let agent_id = agent_id.clone();
            let success = successful_creates.clone();
            let errors = create_errors.clone();

            let handle = tokio::spawn(async move {
                let task_id = format!("concurrent-task-{}-{}", agent_id, i);

                let result = sqlx::query(
                    r#"
                    INSERT INTO tasks (id, agent_id, input, status, created_at)
                    VALUES ($1, $2, $3, $4, $5)
                    "#,
                )
                .bind(&task_id)
                .bind(&agent_id)
                .bind(serde_json::to_string(&json!({"iteration": i})).unwrap())
                .bind("Queued")
                .bind(chrono::Utc::now())
                .execute(&pool)
                .await;

                match result {
                    Ok(_) => {
                        success.fetch_add(1, Ordering::SeqCst);
                    }
                    Err(_) => {
                        errors.fetch_add(1, Ordering::SeqCst);
                    }
                }
            });

            handles.push(handle);
        }

        for handle in handles {
            handle.await.unwrap();
        }

        let successful = successful_creates.load(Ordering::SeqCst);
        let failed = create_errors.load(Ordering::SeqCst);

        // All 10 should succeed (different task IDs, valid agent_id)
        assert_eq!(successful, 10, "All task creations should succeed");
        assert_eq!(failed, 0, "No task creations should fail");

        // Verify all 10 tasks are in database
        let task_count = sqlx::query!("SELECT COUNT(*) as count FROM tasks WHERE agent_id = $1", agent_id)
            .fetch_one(&ctx.pool)
            .await
            .expect("Query should succeed");

        assert_eq!(task_count.count, Some(10), "All 10 tasks should be persisted");

        ctx.cleanup().await;
    }

    // ========================================================================
    // THUNDERING HERD: MULTIPLE WORKERS CLAIMING TASKS
    // ========================================================================

    #[sqlx::test(migrations = "./migrations")]
    async fn test_thundering_herd_task_claiming(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;

        // Create 20 queued tasks
        for i in 0..20 {
            let task_id = format!("herd-task-{}", i);
            sqlx::query(
                "INSERT INTO tasks (id, agent_id, input, status, created_at) VALUES ($1, $2, $3, $4, $5)",
            )
            .bind(&task_id)
            .bind(&agent.id)
            .bind(serde_json::to_string(&json!({})).unwrap())
            .bind("Queued")
            .bind(chrono::Utc::now())
            .execute(&ctx.pool)
            .await
            .ok();
        }

        let claimed_count = Arc::new(AtomicU32::new(0));
        let mut handles = vec![];

        // 5 workers trying to claim tasks concurrently
        for worker_id in 0..5 {
            let pool = ctx.pool.clone();
            let agent_id = agent.id.clone();
            let claimed = claimed_count.clone();

            let handle = tokio::spawn(async move {
                loop {
                    // Try to claim one "Queued" task
                    let result = sqlx::query(
                        "UPDATE tasks SET status = $1, updated_at = $2 WHERE id = (SELECT id FROM tasks WHERE agent_id = $3 AND status = $4 LIMIT 1) RETURNING id",
                    )
                    .bind("Running")
                    .bind(chrono::Utc::now())
                    .bind(&agent_id)
                    .bind("Queued")
                    .execute(&pool)
                    .await;

                    match result {
                        Ok(result) => {
                            if result.rows_affected() > 0 {
                                claimed.fetch_add(1, Ordering::SeqCst);
                            } else {
                                // No more tasks available
                                break;
                            }
                        }
                        Err(_) => {
                            // Error claiming task
                            break;
                        }
                    }

                    tokio::time::sleep(tokio::time::Duration::from_millis(1)).await;
                }
            });

            handles.push(handle);
        }

        for handle in handles {
            handle.await.unwrap();
        }

        let total_claimed = claimed_count.load(Ordering::SeqCst);

        // All 20 tasks should be claimed (exactly once)
        assert_eq!(total_claimed, 20, "All 20 tasks should be claimed exactly once");

        // Verify all tasks are now Running
        let running_count = sqlx::query!(
            "SELECT COUNT(*) as count FROM tasks WHERE agent_id = $1 AND status = $2",
            agent.id,
            "Running"
        )
        .fetch_one(&ctx.pool)
        .await
        .expect("Query should succeed");

        assert_eq!(running_count.count, Some(20), "All tasks should be Running");

        ctx.cleanup().await;
    }

    // ========================================================================
    // CONCURRENT AGENT STAT UPDATES
    // ========================================================================

    #[sqlx::test(migrations = "./migrations")]
    async fn test_concurrent_agent_field_updates(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;

        let agent_id = agent.id.clone();
        let successful_updates = Arc::new(AtomicU32::new(0));
        let update_errors = Arc::new(AtomicU32::new(0));

        let mut handles = vec![];

        // 10 workers trying to update different fields
        for i in 0..10 {
            let pool = ctx.pool.clone();
            let agent_id = agent_id.clone();
            let success = successful_updates.clone();
            let errors = update_errors.clone();

            let handle = tokio::spawn(async move {
                let updated_name = format!("Agent-Updated-{}", i);

                let result = sqlx::query(
                    "UPDATE agents SET name = $1, updated_at = $2 WHERE id = $3",
                )
                .bind(&updated_name)
                .bind(chrono::Utc::now())
                .bind(&agent_id)
                .execute(&pool)
                .await;

                match result {
                    Ok(_) => {
                        success.fetch_add(1, Ordering::SeqCst);
                    }
                    Err(_) => {
                        errors.fetch_add(1, Ordering::SeqCst);
                    }
                }
            });

            handles.push(handle);
        }

        for handle in handles {
            handle.await.unwrap();
        }

        let successful = successful_updates.load(Ordering::SeqCst);
        let failed = update_errors.load(Ordering::SeqCst);

        // All 10 updates should succeed (updates to same row are serialized)
        assert_eq!(successful, 10, "All updates should succeed");
        assert_eq!(failed, 0, "No updates should fail");

        // Verify agent still exists with updated name (last write wins)
        let final_agent = sqlx::query!("SELECT name FROM agents WHERE id = $1", agent_id)
            .fetch_one(&ctx.pool)
            .await
            .expect("Agent should exist");

        // Name should be one of the updated values
        assert!(final_agent.name.starts_with("Agent-Updated-"));

        ctx.cleanup().await;
    }
}
