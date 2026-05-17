// ============================================================================
// DATABASE INTERACTION TESTS WITH SQLX
// ============================================================================
// Real database tests using #[sqlx::test] attribute with automatic migrations
// These tests execute against a real PostgreSQL database with actual schema

#[cfg(test)]
mod tests {
    use crate::models::*;
    use crate::tests::integration::fixtures::*;
    use chrono::Utc;
    use serde_json::json;
    use sqlx::PgPool;

    // ========== CRUD OPERATIONS ==========

    #[sqlx::test(migrations = "./migrations")]
    async fn test_agent_crud_insert_and_retrieve(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent_id = "test-agent-crud-1";
        let name = "CRUD Test Agent";

        // CREATE: Insert agent
        sqlx::query(
            r#"
            INSERT INTO agents (id, name, description, agent_type, enabled, config, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(agent_id)
        .bind(name)
        .bind("Integration test agent")
        .bind("Email")
        .bind(true)
        .bind(r#"{"model":"claude-opus","temperature":0.7,"max_tokens":2048,"timeout_seconds":30,"retry_count":3,"custom_params":{}}"#)
        .bind(Utc::now())
        .bind(Utc::now())
        .execute(&ctx.pool)
        .await
        .expect("Failed to insert agent");

        // READ: Verify agent exists
        let result: (String,) = sqlx::query_as("SELECT name FROM agents WHERE id = $1")
            .bind(agent_id)
            .fetch_one(&ctx.pool)
            .await
            .expect("Failed to retrieve agent");

        assert_eq!(result.0, name);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_agent_update_fields(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent_id = "test-agent-update-1";

        // INSERT initial agent
        sqlx::query(
            r#"
            INSERT INTO agents (id, name, description, agent_type, enabled, config, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(agent_id)
        .bind("Original Name")
        .bind("Description")
        .bind("Email")
        .bind(true)
        .bind(r#"{"model":"claude-opus","temperature":0.7,"max_tokens":2048,"timeout_seconds":30,"retry_count":3,"custom_params":{}}"#)
        .bind(Utc::now())
        .bind(Utc::now())
        .execute(&ctx.pool)
        .await
        .expect("Failed to insert agent");

        // UPDATE agent name
        sqlx::query("UPDATE agents SET name = $1, updated_at = $2 WHERE id = $3")
            .bind("Updated Name")
            .bind(Utc::now())
            .bind(agent_id)
            .execute(&ctx.pool)
            .await
            .expect("Failed to update agent");

        // VERIFY update
        let result: (String,) = sqlx::query_as("SELECT name FROM agents WHERE id = $1")
            .bind(agent_id)
            .fetch_one(&ctx.pool)
            .await
            .expect("Failed to retrieve updated agent");

        assert_eq!(result.0, "Updated Name");
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_agent_delete(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent_id = "test-agent-delete-1";

        // INSERT agent
        sqlx::query(
            r#"
            INSERT INTO agents (id, name, description, agent_type, enabled, config, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(agent_id)
        .bind("To Delete")
        .bind("Description")
        .bind("Email")
        .bind(true)
        .bind(r#"{"model":"claude-opus","temperature":0.7,"max_tokens":2048,"timeout_seconds":30,"retry_count":3,"custom_params":{}}"#)
        .bind(Utc::now())
        .bind(Utc::now())
        .execute(&ctx.pool)
        .await
        .expect("Failed to insert agent");

        // DELETE agent
        let deleted_count = sqlx::query("DELETE FROM agents WHERE id = $1")
            .bind(agent_id)
            .execute(&ctx.pool)
            .await
            .expect("Failed to delete agent")
            .rows_affected();

        assert_eq!(deleted_count, 1);

        // VERIFY deletion
        let result = sqlx::query_as::<_, (String,)>("SELECT id FROM agents WHERE id = $1")
            .bind(agent_id)
            .fetch_optional(&ctx.pool)
            .await
            .expect("Failed to query after delete");

        assert!(result.is_none());
    }

    // ========== TASK STATUS TRANSITIONS ==========

    #[sqlx::test(migrations = "./migrations")]
    async fn test_task_status_transitions_queued_to_completed(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let task_id = "task-transitions-1";
        let agent_id = "test-agent-1";

        // INSERT agent first (required by foreign key)
        sqlx::query(
            r#"
            INSERT INTO agents (id, name, description, agent_type, enabled, config, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(agent_id)
        .bind("Test Agent")
        .bind("Description")
        .bind("Email")
        .bind(true)
        .bind(r#"{"model":"claude-opus","temperature":0.7,"max_tokens":2048,"timeout_seconds":30,"retry_count":3,"custom_params":{}}"#)
        .bind(Utc::now())
        .bind(Utc::now())
        .execute(&ctx.pool)
        .await
        .expect("Failed to insert agent");

        let created_at = Utc::now();

        // INSERT task in Queued state
        sqlx::query(
            r#"
            INSERT INTO tasks (id, agent_id, input, status, created_at)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(task_id)
        .bind(agent_id)
        .bind(r#"{"message":"test"}"#)
        .bind("Queued")
        .bind(created_at)
        .execute(&ctx.pool)
        .await
        .expect("Failed to insert task");

        // Transition to Running
        let started_at = Utc::now();
        sqlx::query("UPDATE tasks SET status = $1, started_at = $2 WHERE id = $3")
            .bind("Running")
            .bind(started_at)
            .bind(task_id)
            .execute(&ctx.pool)
            .await
            .expect("Failed to update to Running");

        // Transition to Completed
        let completed_at = Utc::now();
        sqlx::query(
            r#"
            UPDATE tasks
            SET status = $1, completed_at = $2, output = $3, duration_ms = $4
            WHERE id = $5
            "#,
        )
        .bind("Completed")
        .bind(completed_at)
        .bind(r#"{"result":"success"}"#)
        .bind(
            completed_at
                .signed_duration_since(created_at)
                .num_milliseconds(),
        )
        .bind(task_id)
        .execute(&ctx.pool)
        .await
        .expect("Failed to update to Completed");

        // VERIFY final state
        let result: (String, Option<String>) =
            sqlx::query_as("SELECT status, output FROM tasks WHERE id = $1")
                .bind(task_id)
                .fetch_one(&ctx.pool)
                .await
                .expect("Failed to retrieve task");

        assert_eq!(result.0, "Completed");
        assert!(result.1.is_some());
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_task_status_transitions_with_failure(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let task_id = "task-failure-1";
        let agent_id = "test-agent-failure";

        // INSERT agent
        sqlx::query(
            r#"
            INSERT INTO agents (id, name, description, agent_type, enabled, config, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(agent_id)
        .bind("Failure Test Agent")
        .bind("Description")
        .bind("Email")
        .bind(true)
        .bind(r#"{"model":"claude-opus","temperature":0.7,"max_tokens":2048,"timeout_seconds":30,"retry_count":3,"custom_params":{}}"#)
        .bind(Utc::now())
        .bind(Utc::now())
        .execute(&ctx.pool)
        .await
        .expect("Failed to insert agent");

        // INSERT task
        sqlx::query(
            r#"
            INSERT INTO tasks (id, agent_id, input, status, created_at)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(task_id)
        .bind(agent_id)
        .bind(r#"{"message":"test"}"#)
        .bind("Queued")
        .bind(Utc::now())
        .execute(&ctx.pool)
        .await
        .expect("Failed to insert task");

        // Transition to Running
        let started_at = Utc::now();
        sqlx::query("UPDATE tasks SET status = $1, started_at = $2 WHERE id = $3")
            .bind("Running")
            .bind(started_at)
            .bind(task_id)
            .execute(&ctx.pool)
            .await
            .expect("Failed to update to Running");

        // Transition to Failed with error
        sqlx::query(
            r#"
            UPDATE tasks
            SET status = $1, error = $2, duration_ms = $3
            WHERE id = $4
            "#,
        )
        .bind("Failed")
        .bind("Database connection timeout")
        .bind(500i64)
        .bind(task_id)
        .execute(&ctx.pool)
        .await
        .expect("Failed to update to Failed");

        // VERIFY failure state
        let result: (String, Option<String>) =
            sqlx::query_as("SELECT status, error FROM tasks WHERE id = $1")
                .bind(task_id)
                .fetch_one(&ctx.pool)
                .await
                .expect("Failed to retrieve task");

        assert_eq!(result.0, "Failed");
        assert_eq!(result.1, Some("Database connection timeout".to_string()));
    }

    // ========== AGGREGATE QUERIES ==========

    #[sqlx::test(migrations = "./migrations")]
    async fn test_aggregate_query_task_execution_times(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent_id = "test-agent-agg";

        // INSERT agent
        sqlx::query(
            r#"
            INSERT INTO agents (id, name, description, agent_type, enabled, config, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(agent_id)
        .bind("Aggregate Test Agent")
        .bind("Description")
        .bind("Email")
        .bind(true)
        .bind(r#"{"model":"claude-opus","temperature":0.7,"max_tokens":2048,"timeout_seconds":30,"retry_count":3,"custom_params":{}}"#)
        .bind(Utc::now())
        .bind(Utc::now())
        .execute(&ctx.pool)
        .await
        .expect("Failed to insert agent");

        let execution_times = vec![100i64, 250i64, 180i64, 320i64, 150i64, 200i64];

        // INSERT tasks with different execution times
        for (i, duration) in execution_times.iter().enumerate() {
            sqlx::query(
                r#"
                INSERT INTO tasks (id, agent_id, input, status, duration_ms, created_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                "#,
            )
            .bind(format!("task-agg-{}", i))
            .bind(agent_id)
            .bind(r#"{"message":"test"}"#)
            .bind("Completed")
            .bind(duration)
            .bind(Utc::now())
            .execute(&ctx.pool)
            .await
            .expect("Failed to insert task");
        }

        // Query aggregates
        let result: (Option<i64>, Option<i64>, Option<i64>, Option<i64>) = sqlx::query_as(
            "SELECT SUM(duration_ms), AVG(duration_ms), MIN(duration_ms), MAX(duration_ms) FROM tasks WHERE agent_id = $1",
        )
        .bind(agent_id)
        .fetch_one(&ctx.pool)
        .await
        .expect("Failed to query aggregates");

        let sum = result.0.unwrap_or(0);
        let avg = result.1.unwrap_or(0);
        let min = result.2.unwrap_or(0);
        let max = result.3.unwrap_or(0);

        assert_eq!(sum, 1200); // 100+250+180+320+150+200
        assert_eq!(avg, 200); // 1200/6
        assert_eq!(min, 100);
        assert_eq!(max, 320);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_aggregate_query_task_status_counts(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent_id = "test-agent-counts";

        // INSERT agent
        sqlx::query(
            r#"
            INSERT INTO agents (id, name, description, agent_type, enabled, config, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(agent_id)
        .bind("Count Test Agent")
        .bind("Description")
        .bind("Email")
        .bind(true)
        .bind(r#"{"model":"claude-opus","temperature":0.7,"max_tokens":2048,"timeout_seconds":30,"retry_count":3,"custom_params":{}}"#)
        .bind(Utc::now())
        .bind(Utc::now())
        .execute(&ctx.pool)
        .await
        .expect("Failed to insert agent");

        let statuses = vec!["Completed", "Completed", "Failed", "Running", "Queued", "Queued", "Completed", "Failed"];

        // INSERT tasks with different statuses
        for (i, status) in statuses.iter().enumerate() {
            sqlx::query(
                r#"
                INSERT INTO tasks (id, agent_id, input, status, created_at)
                VALUES ($1, $2, $3, $4, $5)
                "#,
            )
            .bind(format!("task-count-{}", i))
            .bind(agent_id)
            .bind(r#"{"message":"test"}"#)
            .bind(status)
            .bind(Utc::now())
            .execute(&ctx.pool)
            .await
            .expect("Failed to insert task");
        }

        // Query counts by status
        let completed: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM tasks WHERE agent_id = $1 AND status = $2",
        )
        .bind(agent_id)
        .bind("Completed")
        .fetch_one(&ctx.pool)
        .await
        .expect("Failed to query completed count");

        let failed: (i64,) =
            sqlx::query_as("SELECT COUNT(*) FROM tasks WHERE agent_id = $1 AND status = $2")
                .bind(agent_id)
                .bind("Failed")
                .fetch_one(&ctx.pool)
                .await
                .expect("Failed to query failed count");

        assert_eq!(completed.0, 3);
        assert_eq!(failed.0, 2);
    }

    // ========== FILTERING AND PAGINATION ==========

    #[sqlx::test(migrations = "./migrations")]
    async fn test_query_with_pagination_offset(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent_id = "test-agent-pagination";

        // INSERT agent
        sqlx::query(
            r#"
            INSERT INTO agents (id, name, description, agent_type, enabled, config, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(agent_id)
        .bind("Pagination Test Agent")
        .bind("Description")
        .bind("Email")
        .bind(true)
        .bind(r#"{"model":"claude-opus","temperature":0.7,"max_tokens":2048,"timeout_seconds":30,"retry_count":3,"custom_params":{}}"#)
        .bind(Utc::now())
        .bind(Utc::now())
        .execute(&ctx.pool)
        .await
        .expect("Failed to insert agent");

        // INSERT 10 tasks
        for i in 0..10 {
            sqlx::query(
                r#"
                INSERT INTO tasks (id, agent_id, input, status, created_at)
                VALUES ($1, $2, $3, $4, $5)
                "#,
            )
            .bind(format!("task-page-{}", i))
            .bind(agent_id)
            .bind(format!(r#"{{"index":{}}}"#, i))
            .bind("Queued")
            .bind(Utc::now())
            .execute(&ctx.pool)
            .await
            .expect("Failed to insert task");
        }

        let page_size = 3i64;

        // Query page 1 (offset 0, limit 3)
        let page1: Vec<(String,)> = sqlx::query_as(
            "SELECT id FROM tasks WHERE agent_id = $1 ORDER BY id LIMIT $2 OFFSET $3",
        )
        .bind(agent_id)
        .bind(page_size)
        .bind(0i64)
        .fetch_all(&ctx.pool)
        .await
        .expect("Failed to query page 1");

        assert_eq!(page1.len(), 3);

        // Query page 2 (offset 3, limit 3)
        let page2: Vec<(String,)> = sqlx::query_as(
            "SELECT id FROM tasks WHERE agent_id = $1 ORDER BY id LIMIT $2 OFFSET $3",
        )
        .bind(agent_id)
        .bind(page_size)
        .bind(3i64)
        .fetch_all(&ctx.pool)
        .await
        .expect("Failed to query page 2");

        assert_eq!(page2.len(), 3);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_filtering_agents_by_type(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);

        let agent_types = vec!["Email", "Email", "Slack", "Email", "Teams", "Slack"];

        // INSERT agents of different types
        for (i, agent_type) in agent_types.iter().enumerate() {
            sqlx::query(
                r#"
                INSERT INTO agents (id, name, description, agent_type, enabled, config, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                "#,
            )
            .bind(format!("test-agent-type-{}", i))
            .bind(format!("Agent {}", i))
            .bind("Description")
            .bind(agent_type)
            .bind(true)
            .bind(r#"{"model":"claude-opus","temperature":0.7,"max_tokens":2048,"timeout_seconds":30,"retry_count":3,"custom_params":{}}"#)
            .bind(Utc::now())
            .bind(Utc::now())
            .execute(&ctx.pool)
            .await
            .expect("Failed to insert agent");
        }

        // Count email agents
        let email_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM agents WHERE agent_type = $1")
            .bind("Email")
            .fetch_one(&ctx.pool)
            .await
            .expect("Failed to count email agents");

        // Count slack agents
        let slack_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM agents WHERE agent_type = $1")
            .bind("Slack")
            .fetch_one(&ctx.pool)
            .await
            .expect("Failed to count slack agents");

        assert_eq!(email_count.0, 3);
        assert_eq!(slack_count.0, 2);
    }

    // ========== FILTERING BY STATUS ==========

    #[sqlx::test(migrations = "./migrations")]
    async fn test_filtering_tasks_by_status(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent_id = "test-agent-status-filter";

        // INSERT agent
        sqlx::query(
            r#"
            INSERT INTO agents (id, name, description, agent_type, enabled, config, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(agent_id)
        .bind("Status Filter Agent")
        .bind("Description")
        .bind("Email")
        .bind(true)
        .bind(r#"{"model":"claude-opus","temperature":0.7,"max_tokens":2048,"timeout_seconds":30,"retry_count":3,"custom_params":{}}"#)
        .bind(Utc::now())
        .bind(Utc::now())
        .execute(&ctx.pool)
        .await
        .expect("Failed to insert agent");

        let statuses = vec![
            "Queued", "Running", "Completed", "Failed", "Completed", "Running", "Queued", "Failed",
        ];

        // INSERT tasks with different statuses
        for (i, status) in statuses.iter().enumerate() {
            sqlx::query(
                r#"
                INSERT INTO tasks (id, agent_id, input, status, created_at)
                VALUES ($1, $2, $3, $4, $5)
                "#,
            )
            .bind(format!("task-status-{}", i))
            .bind(agent_id)
            .bind(r#"{"message":"test"}"#)
            .bind(status)
            .bind(Utc::now())
            .execute(&ctx.pool)
            .await
            .expect("Failed to insert task");
        }

        // Count pending (Queued or Running)
        let pending: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM tasks WHERE agent_id = $1 AND (status = $2 OR status = $3)",
        )
        .bind(agent_id)
        .bind("Queued")
        .bind("Running")
        .fetch_one(&ctx.pool)
        .await
        .expect("Failed to count pending");

        // Count completed
        let completed: (i64,) =
            sqlx::query_as("SELECT COUNT(*) FROM tasks WHERE agent_id = $1 AND status = $2")
                .bind(agent_id)
                .bind("Completed")
                .fetch_one(&ctx.pool)
                .await
                .expect("Failed to count completed");

        // Count failed
        let failed: (i64,) =
            sqlx::query_as("SELECT COUNT(*) FROM tasks WHERE agent_id = $1 AND status = $2")
                .bind(agent_id)
                .bind("Failed")
                .fetch_one(&ctx.pool)
                .await
                .expect("Failed to count failed");

        assert_eq!(pending.0, 4);
        assert_eq!(completed.0, 2);
        assert_eq!(failed.0, 2);
    }

    // ========== UNIQUE AND NULL CONSTRAINTS ==========

    #[sqlx::test(migrations = "./migrations")]
    async fn test_unique_constraint_violation(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);
        let agent_id = "duplicate-test";

        // First insert succeeds
        let result1 = sqlx::query(
            r#"
            INSERT INTO agents (id, name, description, agent_type, enabled, config, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(agent_id)
        .bind("Test Agent")
        .bind("Description")
        .bind("Email")
        .bind(true)
        .bind(r#"{"model":"claude-opus","temperature":0.7,"max_tokens":2048,"timeout_seconds":30,"retry_count":3,"custom_params":{}}"#)
        .bind(Utc::now())
        .bind(Utc::now())
        .execute(&ctx.pool)
        .await;

        assert!(result1.is_ok());

        // Second insert with same ID should fail
        let result2 = sqlx::query(
            r#"
            INSERT INTO agents (id, name, description, agent_type, enabled, config, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(agent_id)
        .bind("Duplicate Agent")
        .bind("Description")
        .bind("Email")
        .bind(true)
        .bind(r#"{"model":"claude-opus","temperature":0.7,"max_tokens":2048,"timeout_seconds":30,"retry_count":3,"custom_params":{}}"#)
        .bind(Utc::now())
        .bind(Utc::now())
        .execute(&ctx.pool)
        .await;

        assert!(result2.is_err());
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_not_null_constraint_enforcement(pool: PgPool) {
        let ctx = TestContext::from_pool(pool);

        // Attempting to insert task without agent_id should fail
        let result = sqlx::query(
            r#"
            INSERT INTO tasks (id, agent_id, input, status, created_at)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind("task-no-agent")
        .bind::<Option<String>>(None) // NULL agent_id
        .bind(r#"{"message":"test"}"#)
        .bind("Queued")
        .bind(Utc::now())
        .execute(&ctx.pool)
        .await;

        assert!(result.is_err());
    }
}
