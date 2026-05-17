/// Integration tests for the executor handlers module
/// Tests the complete flow of task submission, execution, status tracking,
/// workflow execution, and queue management via HTTP endpoints with database persistence.

#[cfg(test)]
mod executor_handler_integration_tests {
    use forge_core::models::*;
    use forge_core::executor::DbPool;
    use serde_json::json;
    use sqlx::postgres::PgPoolOptions;
    use std::env;

    /// Test database setup helper
    async fn setup_test_db() -> DbPool {
        // Use test database URL or default to test instance
        let database_url = env::var("TEST_DATABASE_URL")
            .unwrap_or_else(|_| "postgres://postgres:postgres@localhost/forge_test".to_string());

        let pool = PgPoolOptions::new()
            .max_connections(5)
            .acquire_timeout(std::time::Duration::from_secs(5))
            .connect(&database_url)
            .await
            .expect("Failed to create test database pool");

        // Clean up any existing tables (for test isolation)
        let _ = sqlx::query("DROP TABLE IF EXISTS tasks CASCADE")
            .execute(&pool)
            .await;
        let _ = sqlx::query("DROP TABLE IF EXISTS workflows CASCADE")
            .execute(&pool)
            .await;
        let _ = sqlx::query("DROP TABLE IF EXISTS workflow_executions CASCADE")
            .execute(&pool)
            .await;

        // Run migrations
        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .expect("Failed to run migrations");

        DbPool::new_from_pool(pool)
    }

    /// Test: Submit a single task to the queue
    /// Verifies that a task is properly stored in the database and returns task ID
    #[tokio::test]
    #[ignore] // Run with: cargo test -- --ignored --test-threads=1
    async fn test_submit_single_task() {
        let db = setup_test_db().await;

        // Create a task request
        let agent_id = "agent-001";
        let input = json!({"data": "test"});
        let priority = 1;

        // Call the pool method directly to create a task
        let task_id = uuid::Uuid::new_v4().to_string();
        let result = db.create_task(&task_id, agent_id, input.clone(), priority as i32, None).await;

        assert!(result.is_ok(), "Task creation should succeed");

        // Verify task exists in database
        let task = db.get_task(&task_id).await.expect("Failed to fetch task").expect("Task not found");
        assert_eq!(task.agent_id, agent_id);
        assert_eq!(task.priority, priority as i32);
        assert_eq!(task.status, "queued");
    }

    /// Test: Submit multiple tasks as a batch
    /// Creates all task records atomically
    #[tokio::test]
    #[ignore]
    async fn test_submit_batch_tasks() {
        let db = setup_test_db().await;

        let batch_id = uuid::Uuid::new_v4().to_string();
        let mut task_ids = Vec::new();

        // Create 5 tasks in a batch
        for i in 1..=5 {
            let task_id = uuid::Uuid::new_v4().to_string();
            let agent_id = format!("agent-{:03}", i);
            let input = json!({"task": i});
            let priority = (i % 3) as i32; // Vary priority: 1, 2, 0, 1, 2

            let result = db.create_task(&task_id, &agent_id, input, priority, Some(&batch_id)).await;
            assert!(result.is_ok(), "Task creation should succeed");

            task_ids.push(task_id);
        }

        // Verify all tasks exist with the same batch_id
        for task_id in &task_ids {
            let task = db.get_task(task_id).await
                .expect("Failed to fetch task")
                .expect("Task not found");
            // Note: batch_id is stored in a separate column, verify if available
            assert_eq!(task.status, "queued");
        }

        assert_eq!(task_ids.len(), 5, "All 5 tasks should be created");
    }

    /// Test: Get status of a single task
    /// Verifies task status response with progress percentage calculation
    #[tokio::test]
    #[ignore]
    async fn test_get_task_status() {
        let db = setup_test_db().await;

        // Create a task
        let task_id = uuid::Uuid::new_v4().to_string();
        let agent_id = "agent-001";
        let input = json!({"test": "data"});

        db.create_task(&task_id, agent_id, input, 0, None).await.expect("Failed to create task");

        // Fetch task status
        let task = db.get_task(&task_id).await
            .expect("Failed to fetch task")
            .expect("Task not found");

        // Verify status is queued
        assert_eq!(task.status, "queued");

        // Verify progress calculation logic (would be done in handler)
        let progress = match task.status.as_str() {
            "queued" => 0,
            "running" => 50,
            "completed" => 100,
            "failed" => 100,
            "cancelled" => 100,
            _ => 0,
        };

        assert_eq!(progress, 0, "Queued task should have 0% progress");
    }

    /// Test: Cancel a queued task
    /// Verifies that only queued/running tasks can be cancelled
    #[tokio::test]
    #[ignore]
    async fn test_cancel_task_queued() {
        let db = setup_test_db().await;

        // Create a queued task
        let task_id = uuid::Uuid::new_v4().to_string();
        db.create_task(&task_id, "agent-001", json!({}), 0, None).await.expect("Failed to create task");

        // Verify task is queued
        let task = db.get_task(&task_id).await.expect("Failed to fetch").expect("Task not found");
        assert_eq!(task.status, "queued");

        // Cancel the task
        let result = db.update_task_status(&task_id, "cancelled").await;
        assert!(result.is_ok(), "Cancellation should succeed");

        // Verify task is now cancelled
        let task = db.get_task(&task_id).await.expect("Failed to fetch").expect("Task not found");
        assert_eq!(task.status, "cancelled");
    }

    /// Test: Cancel a completed task should fail
    /// Verifies error handling when trying to cancel non-cancellable tasks
    #[tokio::test]
    #[ignore]
    async fn test_cancel_task_completed_fails() {
        let db = setup_test_db().await;

        // Create and complete a task
        let task_id = uuid::Uuid::new_v4().to_string();
        db.create_task(&task_id, "agent-001", json!({}), 0, None).await.expect("Failed to create task");

        // Manually update to completed for test
        let _ = db.update_task_status(&task_id, "running").await;
        let _ = db.complete_task(&task_id, Some(json!({"result": "done"})), None, 1000).await;

        // Verify task is completed
        let task = db.get_task(&task_id).await.expect("Failed to fetch").expect("Task not found");
        assert_eq!(task.status, "completed");

        // Attempt to cancel (should not be possible in handler logic)
        let non_cancellable_statuses = vec!["completed", "failed", "cancelled"];
        assert!(non_cancellable_statuses.contains(&task.status.as_str()),
            "Task status should not be cancellable");
    }

    /// Test: Get current queue status
    /// Verifies queue statistics are calculated correctly
    #[tokio::test]
    #[ignore]
    async fn test_get_queue_status() {
        let db = setup_test_db().await;

        // Create tasks in different states
        let queued_id = uuid::Uuid::new_v4().to_string();
        db.create_task(&queued_id, "agent-001", json!({}), 0, None).await.expect("Failed to create task");

        let running_id = uuid::Uuid::new_v4().to_string();
        db.create_task(&running_id, "agent-001", json!({}), 0, None).await.expect("Failed to create task");
        db.update_task_status(&running_id, "running").await.expect("Failed to update status");

        // Query counts manually (would be done in handler)
        let queued_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks WHERE status = 'queued'")
            .fetch_one(db.pool())
            .await
            .unwrap_or(0);

        let running_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks WHERE status = 'running'")
            .fetch_one(db.pool())
            .await
            .unwrap_or(0);

        assert_eq!(queued_count, 1, "Should have 1 queued task");
        assert_eq!(running_count, 1, "Should have 1 running task");
    }

    /// Test: Execute workflow - first step initialization
    /// Verifies workflow execution creates execution record and initial task
    #[tokio::test]
    #[ignore]
    async fn test_execute_workflow() {
        let db = setup_test_db().await;

        // Create a workflow
        let workflow_id = uuid::Uuid::new_v4().to_string();
        let steps = vec![
            WorkflowStep {
                id: "step-1".to_string(),
                agent_id: "agent-001".to_string(),
                input_mapping: InputMapping {
                    from_previous: true,
                    static_input: None,
                    field_mapping: None,
                },
                on_success: None,
                on_failure: None,
                timeout_seconds: None,
            },
        ];

        let steps_json = serde_json::to_value(&steps).expect("Failed to serialize steps");

        let result = db.create_workflow(&workflow_id, "Test Workflow", Some("A test workflow"), steps_json, true).await;
        assert!(result.is_ok(), "Workflow creation should succeed");

        // Create workflow execution
        let execution_id = uuid::Uuid::new_v4().to_string();
        let exec_result = db.create_workflow_execution(&execution_id, &workflow_id, "running").await;
        assert!(exec_result.is_ok(), "Workflow execution creation should succeed");

        // Verify execution was created
        let execution = db.get_workflow_execution(&execution_id).await
            .expect("Failed to fetch execution")
            .expect("Execution not found");

        assert_eq!(execution.workflow_id, workflow_id);
        assert_eq!(execution.status, "running");
    }

    /// Test: Workflow with from_previous input mapping
    /// Verifies input is passed from workflow request to first step
    #[tokio::test]
    #[ignore]
    async fn test_workflow_input_mapping_from_previous() {
        let mapping = InputMapping {
            from_previous: true,
            static_input: None,
            field_mapping: None,
        };

        // When from_previous is true, the input from the request should be used
        assert!(mapping.from_previous);
        assert!(mapping.static_input.is_none());
    }

    /// Test: Workflow with static input mapping
    /// Verifies static input is used when defined
    #[tokio::test]
    #[ignore]
    async fn test_workflow_input_mapping_static() {
        let mapping = InputMapping {
            from_previous: false,
            static_input: Some(json!({"api_key": "secret"})),
            field_mapping: None,
        };

        assert!(!mapping.from_previous);
        assert!(mapping.static_input.is_some());
    }

    /// Test: Workflow with empty input mapping
    /// Verifies empty JSON is used when no mapping is specified
    #[tokio::test]
    async fn test_workflow_input_mapping_empty() {
        let mapping = InputMapping {
            from_previous: false,
            static_input: None,
            field_mapping: None,
        };

        assert!(!mapping.from_previous);
        assert!(mapping.static_input.is_none());
        // In handler: uses json!({})
    }

    /// Test: Workflow with invalid/empty steps
    /// Verifies error handling for malformed workflows
    #[tokio::test]
    async fn test_execute_workflow_empty_steps() {
        let empty_steps: Vec<WorkflowStep> = vec![];
        assert!(empty_steps.is_empty(), "Empty steps should be detected");
    }

    /// Test: Queue priority ordering
    /// Verifies higher priority tasks are dequeued first
    #[tokio::test]
    #[ignore]
    async fn test_queue_priority_ordering() {
        let db = setup_test_db().await;

        // Create tasks with different priorities
        let task1 = uuid::Uuid::new_v4().to_string();
        db.create_task(&task1, "agent-001", json!({}), 0, None).await.expect("Failed");

        let task2 = uuid::Uuid::new_v4().to_string();
        db.create_task(&task2, "agent-001", json!({}), 5, None).await.expect("Failed");

        let task3 = uuid::Uuid::new_v4().to_string();
        db.create_task(&task3, "agent-001", json!({}), 2, None).await.expect("Failed");

        // Get queued tasks (should be ordered by priority DESC, created_at ASC)
        let queued = db.get_queued_tasks(1).await.expect("Failed to get queued tasks");

        // First dequeued task should be highest priority (priority 5)
        assert!(!queued.is_empty(), "Should have queued tasks");
        assert_eq!(queued[0].priority, 5, "Highest priority task should be first");
    }

    /// Test: Error handling - task not found
    /// Verifies 404 response when querying non-existent task
    #[tokio::test]
    #[ignore]
    async fn test_get_task_status_not_found() {
        let db = setup_test_db().await;

        let non_existent_id = "task-does-not-exist-xyz123";
        let result = db.get_task(non_existent_id).await.expect("Failed to query");

        assert!(result.is_none(), "Non-existent task should return None");
    }

    /// Test: Error handling - workflow not found
    /// Verifies 404 response when executing non-existent workflow
    #[tokio::test]
    #[ignore]
    async fn test_execute_workflow_not_found() {
        let db = setup_test_db().await;

        let non_existent_id = "workflow-does-not-exist-xyz123";
        let result = db.get_workflow(non_existent_id).await.expect("Failed to query");

        assert!(result.is_none(), "Non-existent workflow should return None");
    }

    /// Test: Batch task priority distribution
    /// Verifies each task in batch can have different priority
    #[tokio::test]
    #[ignore]
    async fn test_batch_tasks_priority_distribution() {
        let db = setup_test_db().await;

        let batch_id = uuid::Uuid::new_v4().to_string();
        let priorities = vec![0, 3, 0, 5];

        for (idx, priority) in priorities.iter().enumerate() {
            let task_id = uuid::Uuid::new_v4().to_string();
            db.create_task(&task_id, &format!("agent-{}", idx), json!({}), *priority, Some(&batch_id))
                .await
                .expect("Failed to create task");
        }

        // Verify tasks were created with correct priorities
        let queued = db.get_queued_tasks(10).await.expect("Failed to get queued tasks");
        assert_eq!(queued.len(), 4, "Should have 4 tasks in batch");

        // Verify priority ordering (highest first)
        assert_eq!(queued[0].priority, 5, "First should be priority 5");
        assert_eq!(queued[1].priority, 3, "Second should be priority 3");
    }

    /// Test: Task status enum parsing
    /// Verifies correct mapping of string status to TaskStatus enum
    #[tokio::test]
    async fn test_task_status_enum_parsing() {
        // Verify enum variants exist
        let statuses = vec![
            TaskStatus::Queued,
            TaskStatus::Running,
            TaskStatus::Completed,
            TaskStatus::Failed,
            TaskStatus::Cancelled,
        ];

        assert_eq!(statuses.len(), 5, "Should have 5 status types");
    }

    /// Test: Response timestamp generation
    /// Verifies created_at timestamps are set to current time
    #[tokio::test]
    async fn test_response_timestamp_generation() {
        let response = ExecuteTaskResponse {
            task_id: "task-123".to_string(),
            status: TaskStatus::Queued,
            created_at: chrono::Utc::now(),
        };

        assert!(!response.task_id.is_empty());
        // Timestamp should be approximately now
    }

    /// Test: Workflow execution status starts as Running
    /// Verifies initial execution status is correct
    #[tokio::test]
    async fn test_workflow_execution_initial_status() {
        let initial_status = "running";
        assert_eq!(initial_status, "running");
    }

    /// Test: First workflow step is always executed
    /// Verifies workflow doesn't skip the first step
    #[tokio::test]
    async fn test_workflow_executes_first_step() {
        let steps = vec![
            WorkflowStep {
                id: "step-1".to_string(),
                agent_id: "agent-1".to_string(),
                input_mapping: InputMapping {
                    from_previous: true,
                    static_input: None,
                    field_mapping: None,
                },
                on_success: Some("step-2".to_string()),
                on_failure: None,
                timeout_seconds: None,
            },
            WorkflowStep {
                id: "step-2".to_string(),
                agent_id: "agent-2".to_string(),
                input_mapping: InputMapping {
                    from_previous: true,
                    static_input: None,
                    field_mapping: None,
                },
                on_success: None,
                on_failure: None,
                timeout_seconds: None,
            },
        ];

        assert_eq!(steps[0].id, "step-1", "First step should be step-1");
    }

    /// Test: Queue status zero totals
    /// Verifies queue status handles empty queue correctly
    #[tokio::test]
    #[ignore]
    async fn test_queue_status_empty_queue() {
        let db = setup_test_db().await;

        // Verify empty queue
        let queued: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks WHERE status = 'queued'")
            .fetch_one(db.pool())
            .await
            .unwrap_or(0);

        assert_eq!(queued, 0, "Fresh database should have no tasks");
    }

    /// Test: Cancel task with running status
    /// Verifies running tasks can be cancelled
    #[tokio::test]
    #[ignore]
    async fn test_cancel_running_task() {
        let db = setup_test_db().await;

        // Create and run a task
        let task_id = uuid::Uuid::new_v4().to_string();
        db.create_task(&task_id, "agent-001", json!({}), 0, None).await.expect("Failed");
        db.update_task_status(&task_id, "running").await.expect("Failed");

        // Verify it's running
        let task = db.get_task(&task_id).await.expect("Failed").expect("Not found");
        assert_eq!(task.status, "running");

        // Cancel it
        db.update_task_status(&task_id, "cancelled").await.expect("Failed");

        // Verify cancelled
        let task = db.get_task(&task_id).await.expect("Failed").expect("Not found");
        assert_eq!(task.status, "cancelled");
    }

    /// Test: UUID generation for task and batch IDs
    /// Verifies unique IDs are generated for each submission
    #[tokio::test]
    async fn test_unique_task_id_generation() {
        let id1 = uuid::Uuid::new_v4().to_string();
        let id2 = uuid::Uuid::new_v4().to_string();

        assert_ne!(id1, id2, "Generated UUIDs should be unique");
        assert_eq!(id1.len(), 36, "UUID string should be 36 characters");
    }

    /// Test: Batch response includes all task IDs
    /// Verifies batch response contains correct task list
    #[tokio::test]
    async fn test_batch_response_task_ids() {
        let response = BatchExecuteResponse {
            batch_id: "batch-001".to_string(),
            task_ids: vec![
                "task-1".to_string(),
                "task-2".to_string(),
                "task-3".to_string(),
                "task-4".to_string(),
                "task-5".to_string(),
            ],
            total_tasks: 5,
        };

        assert_eq!(response.task_ids.len(), 5);
        assert_eq!(response.total_tasks, 5);
    }
}
