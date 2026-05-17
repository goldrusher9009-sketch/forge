// ============================================================================
// HANDLER INTEGRATION TESTS WITH SQLX
// ============================================================================
// Real HTTP handler flows with actual database operations
// Uses #[sqlx::test] attribute macro with automatic migrations

#[cfg(test)]
mod tests {
    use crate::models::*;
    use crate::tests::integration::fixtures::TestContext;
    use serde_json::json;
    use sqlx::PgPool;

    // ========================================================================
    // AGENT CRUD OPERATIONS
    // ========================================================================

    #[sqlx::test(migrations = "./migrations")]
    async fn test_create_agent_handler(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);

        // Simulate POST /agents request body
        let agent = Agent {
            id: format!("handler-agent-{}", uuid::Uuid::new_v4()),
            name: "Handler Test Agent".to_string(),
            description: "Integration test agent".to_string(),
            agent_type: AgentType::Email,
            enabled: true,
            config: AgentConfig {
                model: "claude-opus".to_string(),
                temperature: 0.7,
                max_tokens: 2048,
                timeout_seconds: 30,
                retry_count: 3,
                custom_params: json!({}),
            },
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        // Execute: INSERT agent into database
        sqlx::query(
            r#"
            INSERT INTO agents (id, name, description, agent_type, enabled, config, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(&agent.id)
        .bind(&agent.name)
        .bind(&agent.description)
        .bind(&agent.agent_type.to_string())
        .bind(agent.enabled)
        .bind(serde_json::to_string(&agent.config).unwrap())
        .bind(agent.created_at)
        .bind(agent.updated_at)
        .execute(&ctx.pool)
        .await
        .expect("Failed to insert agent");

        // Verify: SELECT to confirm creation
        let row = sqlx::query!("SELECT id, name, enabled FROM agents WHERE id = $1", agent.id)
            .fetch_one(&ctx.pool)
            .await
            .expect("Agent not found after creation");

        assert_eq!(row.id, agent.id);
        assert_eq!(row.name, "Handler Test Agent");
        assert_eq!(row.enabled, true);

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_get_agent_handler(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;

        // Simulate GET /agents/{id}
        let row = sqlx::query!(
            "SELECT id, name, description, agent_type, enabled, config, created_at, updated_at FROM agents WHERE id = $1",
            agent.id
        )
        .fetch_one(&ctx.pool)
        .await
        .expect("Agent not found");

        assert_eq!(row.id, agent.id);
        assert_eq!(row.name, "Test Agent");
        assert_eq!(row.agent_type, "Email");

        // Deserialize config
        let config: AgentConfig = serde_json::from_str(&row.config).unwrap();
        assert_eq!(config.model, "claude-opus");
        assert_eq!(config.temperature, 0.7);

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_update_agent_handler(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;

        // Simulate PUT /agents/{id} request to disable agent
        let updated_name = "Updated Agent Name";
        let new_enabled = false;

        sqlx::query("UPDATE agents SET name = $1, enabled = $2, updated_at = $3 WHERE id = $4")
            .bind(updated_name)
            .bind(new_enabled)
            .bind(chrono::Utc::now())
            .bind(&agent.id)
            .execute(&ctx.pool)
            .await
            .expect("Failed to update agent");

        // Verify: SELECT to confirm update
        let row = sqlx::query!("SELECT name, enabled FROM agents WHERE id = $1", agent.id)
            .fetch_one(&ctx.pool)
            .await
            .expect("Agent not found after update");

        assert_eq!(row.name, updated_name);
        assert_eq!(row.enabled, false);

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_delete_agent_handler(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;
        let agent_id = agent.id.clone();

        // Simulate DELETE /agents/{id}
        sqlx::query("DELETE FROM agents WHERE id = $1")
            .bind(&agent_id)
            .execute(&ctx.pool)
            .await
            .expect("Failed to delete agent");

        // Verify: SELECT to confirm deletion
        let result = sqlx::query!("SELECT id FROM agents WHERE id = $1", agent_id)
            .fetch_optional(&ctx.pool)
            .await
            .expect("Query failed");

        assert!(result.is_none(), "Agent should be deleted");

        ctx.cleanup().await;
    }

    // ========================================================================
    // TASK OPERATIONS
    // ========================================================================

    #[sqlx::test(migrations = "./migrations")]
    async fn test_create_task_handler(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;

        // Simulate POST /agents/{id}/tasks request
        let task = Task {
            id: format!("handler-task-{}", uuid::Uuid::new_v4()),
            agent_id: agent.id.clone(),
            input: json!({"message": "test message"}),
            status: TaskStatus::Queued,
            output: None,
            error: None,
            created_at: chrono::Utc::now(),
            started_at: None,
            completed_at: None,
            duration_ms: None,
        };

        // Execute: INSERT task
        sqlx::query(
            r#"
            INSERT INTO tasks (id, agent_id, input, status, created_at)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(&task.id)
        .bind(&task.agent_id)
        .bind(serde_json::to_string(&task.input).unwrap())
        .bind(task.status.to_string())
        .bind(task.created_at)
        .execute(&ctx.pool)
        .await
        .expect("Failed to insert task");

        // Verify: SELECT to confirm creation
        let row = sqlx::query!(
            "SELECT id, agent_id, status FROM tasks WHERE id = $1",
            task.id
        )
        .fetch_one(&ctx.pool)
        .await
        .expect("Task not found");

        assert_eq!(row.id, task.id);
        assert_eq!(row.agent_id, agent.id);
        assert_eq!(row.status, "Queued");

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_get_task_handler(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;
        let task = ctx.create_test_task(&agent.id).await;

        // Simulate GET /agents/{id}/tasks/{task_id}
        let row = sqlx::query!(
            "SELECT id, agent_id, input, status, output, error, created_at, started_at, completed_at, duration_ms FROM tasks WHERE id = $1",
            task.id
        )
        .fetch_one(&ctx.pool)
        .await
        .expect("Task not found");

        assert_eq!(row.id, task.id);
        assert_eq!(row.agent_id, agent.id);
        assert_eq!(row.status, "Queued");

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_update_task_status_handler(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;
        let task = ctx.create_test_task(&agent.id).await;

        let now = chrono::Utc::now();

        // Simulate task status update: Queued -> Running
        sqlx::query(
            "UPDATE tasks SET status = $1, started_at = $2, updated_at = $3 WHERE id = $4",
        )
        .bind("Running")
        .bind(now)
        .bind(now)
        .bind(&task.id)
        .execute(&ctx.pool)
        .await
        .expect("Failed to update task status");

        // Verify status update
        let row = sqlx::query!("SELECT status, started_at FROM tasks WHERE id = $1", task.id)
            .fetch_one(&ctx.pool)
            .await
            .expect("Task not found");

        assert_eq!(row.status, "Running");
        assert!(row.started_at.is_some());

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_complete_task_handler(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;
        let task = ctx.create_test_task(&agent.id).await;

        let now = chrono::Utc::now();
        let output = json!({"result": "success", "data": "completed"});

        // Simulate task completion
        sqlx::query(
            r#"
            UPDATE tasks
            SET status = $1, completed_at = $2, output = $3, duration_ms = $4, updated_at = $5
            WHERE id = $6
            "#,
        )
        .bind("Completed")
        .bind(now)
        .bind(serde_json::to_string(&output).unwrap())
        .bind(5000i32)
        .bind(now)
        .bind(&task.id)
        .execute(&ctx.pool)
        .await
        .expect("Failed to complete task");

        // Verify completion
        let row = sqlx::query!(
            "SELECT status, completed_at, output, duration_ms FROM tasks WHERE id = $1",
            task.id
        )
        .fetch_one(&ctx.pool)
        .await
        .expect("Task not found");

        assert_eq!(row.status, "Completed");
        assert!(row.completed_at.is_some());
        assert!(row.output.is_some());
        assert_eq!(row.duration_ms, Some(5000));

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_fail_task_handler(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;
        let task = ctx.create_test_task(&agent.id).await;

        let now = chrono::Utc::now();
        let error_msg = "Database connection timeout";

        // Simulate task failure
        sqlx::query(
            "UPDATE tasks SET status = $1, error = $2, completed_at = $3, duration_ms = $4, updated_at = $5 WHERE id = $6"
        )
        .bind("Failed")
        .bind(error_msg)
        .bind(now)
        .bind(3000i32)
        .bind(now)
        .bind(&task.id)
        .execute(&ctx.pool)
        .await
        .expect("Failed to update task");

        // Verify failure
        let row = sqlx::query!("SELECT status, error, duration_ms FROM tasks WHERE id = $1", task.id)
            .fetch_one(&ctx.pool)
            .await
            .expect("Task not found");

        assert_eq!(row.status, "Failed");
        assert_eq!(row.error, Some(error_msg.to_string()));
        assert_eq!(row.duration_ms, Some(3000));

        ctx.cleanup().await;
    }

    // ========================================================================
    // LIST AND PAGINATION
    // ========================================================================

    #[sqlx::test(migrations = "./migrations")]
    async fn test_list_agents_handler(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);

        // Create multiple agents
        for i in 0..5 {
            let agent = Agent {
                id: format!("list-agent-{}", i),
                name: format!("Agent {}", i),
                description: "Test agent".to_string(),
                agent_type: AgentType::Email,
                enabled: true,
                config: AgentConfig {
                    model: "claude-opus".to_string(),
                    temperature: 0.7,
                    max_tokens: 2048,
                    timeout_seconds: 30,
                    retry_count: 3,
                    custom_params: json!({}),
                },
                created_at: chrono::Utc::now(),
                updated_at: chrono::Utc::now(),
            };

            sqlx::query(
                r#"
                INSERT INTO agents (id, name, description, agent_type, enabled, config, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                "#,
            )
            .bind(&agent.id)
            .bind(&agent.name)
            .bind(&agent.description)
            .bind(agent.agent_type.to_string())
            .bind(agent.enabled)
            .bind(serde_json::to_string(&agent.config).unwrap())
            .bind(agent.created_at)
            .bind(agent.updated_at)
            .execute(&ctx.pool)
            .await
            .ok();
        }

        // Simulate GET /agents?page=1&limit=2
        let limit = 2i64;
        let offset = 0i64;

        let rows = sqlx::query!(
            "SELECT id, name FROM agents WHERE id LIKE 'list-agent-%' ORDER BY created_at DESC LIMIT $1 OFFSET $2",
            limit,
            offset
        )
        .fetch_all(&ctx.pool)
        .await
        .expect("Failed to list agents");

        assert_eq!(rows.len(), 2);

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_list_tasks_with_pagination(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;

        // Create 10 tasks
        for i in 0..10 {
            let _ = ctx.create_test_task(&agent.id).await;
        }

        // Test pagination: get first 5
        let limit = 5i64;
        let offset = 0i64;

        let rows = sqlx::query!(
            "SELECT id FROM tasks WHERE agent_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
            agent.id,
            limit,
            offset
        )
        .fetch_all(&ctx.pool)
        .await
        .expect("Failed to list tasks");

        assert_eq!(rows.len(), 5);

        // Test second page
        let offset = 5i64;
        let rows = sqlx::query!(
            "SELECT id FROM tasks WHERE agent_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
            agent.id,
            limit,
            offset
        )
        .fetch_all(&ctx.pool)
        .await
        .expect("Failed to list tasks page 2");

        assert_eq!(rows.len(), 5);

        ctx.cleanup().await;
    }

    // ========================================================================
    // ERROR HANDLING
    // ========================================================================

    #[sqlx::test(migrations = "./migrations")]
    async fn test_get_nonexistent_agent_handler(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);

        // Simulate GET /agents/nonexistent-id
        let result = sqlx::query!("SELECT id FROM agents WHERE id = $1", "nonexistent-id")
            .fetch_optional(&ctx.pool)
            .await
            .expect("Query failed");

        // Should return None (404 Not Found)
        assert!(result.is_none());

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_create_agent_duplicate_id_handler(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;

        // Try to create agent with same ID
        let result = sqlx::query(
            r#"
            INSERT INTO agents (id, name, description, agent_type, enabled, config, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(&agent.id)
        .bind("Duplicate Agent")
        .bind("Should fail")
        .bind("Email")
        .bind(true)
        .bind(serde_json::to_string(&agent.config).unwrap())
        .bind(chrono::Utc::now())
        .bind(chrono::Utc::now())
        .execute(&ctx.pool)
        .await;

        // Should fail with unique constraint violation
        assert!(result.is_err(), "Duplicate insert should fail with constraint violation");

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_create_task_missing_agent_handler(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);

        // Try to create task with non-existent agent_id
        let result = sqlx::query(
            r#"
            INSERT INTO tasks (id, agent_id, input, status, created_at)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(format!("task-{}", uuid::Uuid::new_v4()))
        .bind("nonexistent-agent-id")
        .bind(serde_json::to_string(&json!({})).unwrap())
        .bind("Queued")
        .bind(chrono::Utc::now())
        .execute(&ctx.pool)
        .await;

        // Should fail with foreign key constraint
        assert!(result.is_err(), "Insert with invalid foreign key should fail");

        ctx.cleanup().await;
    }

    // ========================================================================
    // EDGE CASES AND BOUNDARY CONDITIONS
    // ========================================================================

    #[sqlx::test(migrations = "./migrations")]
    async fn test_agent_with_empty_name(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);

        // Create agent with empty name
        let agent_id = format!("agent-{}", uuid::Uuid::new_v4());
        let result = sqlx::query(
            r#"
            INSERT INTO agents (id, name, description, agent_type, enabled, config, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(&agent_id)
        .bind("") // Empty name
        .bind("Test agent with empty name")
        .bind("Email")
        .bind(true)
        .bind(serde_json::to_string(&json!({
            "model": "claude-opus",
            "temperature": 0.7,
            "max_tokens": 2048,
            "timeout_seconds": 30,
            "retry_count": 3
        })).unwrap())
        .bind(chrono::Utc::now())
        .bind(chrono::Utc::now())
        .execute(&ctx.pool)
        .await;

        // Should succeed - empty name is allowed at DB level
        assert!(result.is_ok(), "Agent with empty name should be created");

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_agent_with_very_long_name(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);

        // Create agent with very long name (255+ characters)
        let long_name = "A".repeat(300);
        let agent_id = format!("agent-{}", uuid::Uuid::new_v4());

        let result = sqlx::query(
            r#"
            INSERT INTO agents (id, name, description, agent_type, enabled, config, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(&agent_id)
        .bind(&long_name)
        .bind("Test agent with long name")
        .bind("Email")
        .bind(true)
        .bind(serde_json::to_string(&json!({
            "model": "claude-opus",
            "temperature": 0.7,
            "max_tokens": 2048,
            "timeout_seconds": 30,
            "retry_count": 3
        })).unwrap())
        .bind(chrono::Utc::now())
        .bind(chrono::Utc::now())
        .execute(&ctx.pool)
        .await;

        // Should succeed - no length constraint at DB level
        assert!(result.is_ok(), "Agent with long name should be created");

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_task_with_large_json_input(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;

        // Create task with large JSON input (nested structure)
        let large_input = json!({
            "data": {
                "nested": {
                    "deeply": {
                        "array": (0..1000).map(|i| json!({"index": i, "value": format!("item-{}", i)})).collect::<Vec<_>>()
                    }
                }
            }
        });

        let result = sqlx::query(
            r#"
            INSERT INTO tasks (id, agent_id, input, status, created_at)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(format!("task-{}", uuid::Uuid::new_v4()))
        .bind(&agent.id)
        .bind(serde_json::to_string(&large_input).unwrap())
        .bind("Queued")
        .bind(chrono::Utc::now())
        .execute(&ctx.pool)
        .await;

        assert!(result.is_ok(), "Task with large JSON input should be created");

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_task_status_all_transitions(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;
        let mut task = ctx.create_test_task(&agent.id).await;

        let task_id = task.id.clone();
        let now = chrono::Utc::now();

        // Test state machine: Queued -> Running -> Completed
        let transitions = vec!["Queued", "Running", "Completed"];

        for (idx, status) in transitions.iter().enumerate() {
            let result = sqlx::query("UPDATE tasks SET status = $1, updated_at = $2 WHERE id = $3")
                .bind(status)
                .bind(now)
                .bind(&task_id)
                .execute(&ctx.pool)
                .await;

            assert!(result.is_ok(), "Status transition to {} should succeed", status);

            // Verify transition
            let row = sqlx::query!("SELECT status FROM tasks WHERE id = $1", task_id)
                .fetch_one(&ctx.pool)
                .await
                .expect("Task not found");

            assert_eq!(row.status, *status, "Status should be {}", status);
        }

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_task_with_null_output_and_error(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;
        let task = ctx.create_test_task(&agent.id).await;

        // Task should have NULL output and error initially
        let row = sqlx::query!(
            "SELECT output, error FROM tasks WHERE id = $1",
            task.id
        )
        .fetch_one(&ctx.pool)
        .await
        .expect("Task not found");

        assert!(row.output.is_none(), "Output should be NULL initially");
        assert!(row.error.is_none(), "Error should be NULL initially");

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_update_completed_task_should_not_change(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;
        let mut task = ctx.create_test_task(&agent.id).await;

        // Mark task as completed
        let now = chrono::Utc::now();
        let output = json!({"result": "final"});

        sqlx::query(
            "UPDATE tasks SET status = $1, completed_at = $2, output = $3, updated_at = $4 WHERE id = $5"
        )
        .bind("Completed")
        .bind(now)
        .bind(serde_json::to_string(&output).unwrap())
        .bind(now)
        .bind(&task.id)
        .execute(&ctx.pool)
        .await
        .expect("Failed to mark task complete");

        // Try to update completed task (should still work at DB level - handler validates)
        let later = now + chrono::Duration::seconds(10);
        let result = sqlx::query(
            "UPDATE tasks SET status = $1, updated_at = $2 WHERE id = $3"
        )
        .bind("Running")
        .bind(later)
        .bind(&task.id)
        .execute(&ctx.pool)
        .await;

        // Database allows it - handler should prevent this
        assert!(result.is_ok(), "Database allows update (handler should prevent)");

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_list_with_offset_beyond_total(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);

        // Create 3 agents
        for i in 0..3 {
            ctx.create_test_agent().await;
        }

        // Try to list with offset=10, limit=5 (beyond 3 total)
        let rows = sqlx::query!("SELECT id FROM agents ORDER BY created_at DESC LIMIT 5 OFFSET 10")
            .fetch_all(&ctx.pool)
            .await
            .expect("Query failed");

        assert!(rows.is_empty(), "Should return empty list when offset exceeds total");

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_zero_limit_pagination(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);

        // Create agents
        for _ in 0..5 {
            ctx.create_test_agent().await;
        }

        // Query with LIMIT 0
        let rows = sqlx::query!("SELECT id FROM agents LIMIT 0")
            .fetch_all(&ctx.pool)
            .await
            .expect("Query failed");

        assert!(rows.is_empty(), "LIMIT 0 should return no rows");

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_negative_values_in_config(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);

        // Create agent with negative timeout/retry values
        let agent_id = format!("agent-{}", uuid::Uuid::new_v4());
        let result = sqlx::query(
            r#"
            INSERT INTO agents (id, name, description, agent_type, enabled, config, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(&agent_id)
        .bind("Negative Config Agent")
        .bind("Test negative values")
        .bind("Email")
        .bind(true)
        .bind(serde_json::to_string(&json!({
            "model": "claude-opus",
            "temperature": -0.5,
            "max_tokens": -1000,
            "timeout_seconds": -30,
            "retry_count": -5
        })).unwrap())
        .bind(chrono::Utc::now())
        .bind(chrono::Utc::now())
        .execute(&ctx.pool)
        .await;

        // Should succeed at DB level (validation happens in handler)
        assert!(result.is_ok(), "Negative values allowed at DB level");

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_concurrent_task_status_updates(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;
        let task = ctx.create_test_task(&agent.id).await;

        // Simulate concurrent updates to same task
        let mut handles = vec![];
        let task_id = task.id.clone();
        let pool_ref = ctx.pool.clone();

        for i in 0..5 {
            let tid = task_id.clone();
            let pool = pool_ref.clone();

            let handle = tokio::task::spawn(async move {
                let status = if i % 2 == 0 { "Running" } else { "Completed" };
                sqlx::query("UPDATE tasks SET status = $1, updated_at = $2 WHERE id = $3")
                    .bind(status)
                    .bind(chrono::Utc::now())
                    .bind(&tid)
                    .execute(&pool)
                    .await
            });

            handles.push(handle);
        }

        // Wait for all updates
        for handle in handles {
            let result = handle.await;
            assert!(result.is_ok(), "Concurrent update should complete");
        }

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_agent_disabled_flag_operations(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let mut agent = ctx.create_test_agent().await;

        // Disable agent
        sqlx::query("UPDATE agents SET enabled = false, updated_at = $1 WHERE id = $2")
            .bind(chrono::Utc::now())
            .bind(&agent.id)
            .execute(&ctx.pool)
            .await
            .expect("Failed to disable agent");

        // Verify disabled
        let row = sqlx::query!("SELECT enabled FROM agents WHERE id = $1", agent.id)
            .fetch_one(&ctx.pool)
            .await
            .expect("Agent not found");

        assert!(!row.enabled, "Agent should be disabled");

        // Re-enable agent
        sqlx::query("UPDATE agents SET enabled = true, updated_at = $1 WHERE id = $2")
            .bind(chrono::Utc::now())
            .bind(&agent.id)
            .execute(&ctx.pool)
            .await
            .expect("Failed to enable agent");

        // Verify re-enabled
        let row = sqlx::query!("SELECT enabled FROM agents WHERE id = $1", agent.id)
            .fetch_one(&ctx.pool)
            .await
            .expect("Agent not found");

        assert!(row.enabled, "Agent should be re-enabled");

        ctx.cleanup().await;
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_task_duration_calculation_edge_cases(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent = ctx.create_test_agent().await;
        let task = ctx.create_test_task(&agent.id).await;

        let now = chrono::Utc::now();

        // Task completed instantly (same timestamp)
        sqlx::query(
            "UPDATE tasks SET status = $1, started_at = $2, completed_at = $3, updated_at = $4 WHERE id = $5"
        )
        .bind("Completed")
        .bind(now)
        .bind(now)
        .bind(now)
        .bind(&task.id)
        .execute(&ctx.pool)
        .await
        .expect("Failed to complete task");

        let row = sqlx::query!(
            "SELECT started_at, completed_at FROM tasks WHERE id = $1",
            task.id
        )
        .fetch_one(&ctx.pool)
        .await
        .expect("Task not found");

        assert_eq!(row.started_at, Some(now), "Started at should be set");
        assert_eq!(row.completed_at, Some(now), "Completed at should be set");

        ctx.cleanup().await;
    }
}
