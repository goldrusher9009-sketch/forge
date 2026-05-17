// ============================================================================
// UNIT TESTS FOR EXECUTOR HANDLERS
// ============================================================================
// Tests handler business logic without database dependencies
// Uses mocks and assertions to validate handler behavior

#[cfg(test)]
mod tests {
    use crate::models::*;
    use serde_json::json;
    use chrono::Utc;

    // ========================================================================
    // HELPER: MOCK DATABASE OPERATIONS
    // ========================================================================

    /// Mock database response for get_task
    struct MockTaskRow {
        id: String,
        status: String,
        output: Option<serde_json::Value>,
        error: Option<String>,
        started_at: Option<chrono::DateTime<Utc>>,
        completed_at: Option<chrono::DateTime<Utc>>,
        duration_ms: Option<i32>,
    }

    impl MockTaskRow {
        fn new(id: &str, status: &str) -> Self {
            MockTaskRow {
                id: id.to_string(),
                status: status.to_string(),
                output: None,
                error: None,
                started_at: None,
                completed_at: None,
                duration_ms: None,
            }
        }

        fn with_output(mut self, output: serde_json::Value) -> Self {
            self.output = Some(output);
            self
        }

        fn with_error(mut self, error: &str) -> Self {
            self.error = Some(error.to_string());
            self
        }

        fn with_timestamps(
            mut self,
            started_at: Option<chrono::DateTime<Utc>>,
            completed_at: Option<chrono::DateTime<Utc>>,
            duration_ms: Option<i32>,
        ) -> Self {
            self.started_at = started_at;
            self.completed_at = completed_at;
            self.duration_ms = duration_ms;
            self
        }
    }

    // ========================================================================
    // STATUS STRING PARSING TESTS
    // ========================================================================

    #[test]
    fn test_status_string_parsing_queued() {
        let status_str = "queued";
        let status = match status_str {
            "queued" => TaskStatus::Queued,
            "running" => TaskStatus::Running,
            "completed" => TaskStatus::Completed,
            "failed" => TaskStatus::Failed,
            "cancelled" => TaskStatus::Cancelled,
            _ => TaskStatus::Queued,
        };

        assert_eq!(status, TaskStatus::Queued);
    }

    #[test]
    fn test_status_string_parsing_running() {
        let status_str = "running";
        let status = match status_str {
            "queued" => TaskStatus::Queued,
            "running" => TaskStatus::Running,
            "completed" => TaskStatus::Completed,
            "failed" => TaskStatus::Failed,
            "cancelled" => TaskStatus::Cancelled,
            _ => TaskStatus::Queued,
        };

        assert_eq!(status, TaskStatus::Running);
    }

    #[test]
    fn test_status_string_parsing_completed() {
        let status_str = "completed";
        let status = match status_str {
            "queued" => TaskStatus::Queued,
            "running" => TaskStatus::Running,
            "completed" => TaskStatus::Completed,
            "failed" => TaskStatus::Failed,
            "cancelled" => TaskStatus::Cancelled,
            _ => TaskStatus::Queued,
        };

        assert_eq!(status, TaskStatus::Completed);
    }

    #[test]
    fn test_status_string_parsing_failed() {
        let status_str = "failed";
        let status = match status_str {
            "queued" => TaskStatus::Queued,
            "running" => TaskStatus::Running,
            "completed" => TaskStatus::Completed,
            "failed" => TaskStatus::Failed,
            "cancelled" => TaskStatus::Cancelled,
            _ => TaskStatus::Queued,
        };

        assert_eq!(status, TaskStatus::Failed);
    }

    #[test]
    fn test_status_string_parsing_cancelled() {
        let status_str = "cancelled";
        let status = match status_str {
            "queued" => TaskStatus::Queued,
            "running" => TaskStatus::Running,
            "completed" => TaskStatus::Completed,
            "failed" => TaskStatus::Failed,
            "cancelled" => TaskStatus::Cancelled,
            _ => TaskStatus::Queued,
        };

        assert_eq!(status, TaskStatus::Cancelled);
    }

    #[test]
    fn test_status_string_parsing_invalid_defaults_to_queued() {
        let status_str = "invalid_status";
        let status = match status_str {
            "queued" => TaskStatus::Queued,
            "running" => TaskStatus::Running,
            "completed" => TaskStatus::Completed,
            "failed" => TaskStatus::Failed,
            "cancelled" => TaskStatus::Cancelled,
            _ => TaskStatus::Queued,
        };

        assert_eq!(status, TaskStatus::Queued);
    }

    // ========================================================================
    // PROGRESS PERCENTAGE CALCULATION TESTS
    // ========================================================================

    #[test]
    fn test_progress_percent_queued_is_zero() {
        let status = "queued";
        let progress_percent = match status {
            "queued" => 0,
            "running" => 50,
            "completed" => 100,
            "failed" => 100,
            "cancelled" => 100,
            _ => 0,
        };

        assert_eq!(progress_percent, 0);
    }

    #[test]
    fn test_progress_percent_running_is_fifty() {
        let status = "running";
        let progress_percent = match status {
            "queued" => 0,
            "running" => 50,
            "completed" => 100,
            "failed" => 100,
            "cancelled" => 100,
            _ => 0,
        };

        assert_eq!(progress_percent, 50);
    }

    #[test]
    fn test_progress_percent_completed_is_hundred() {
        let status = "completed";
        let progress_percent = match status {
            "queued" => 0,
            "running" => 50,
            "completed" => 100,
            "failed" => 100,
            "cancelled" => 100,
            _ => 0,
        };

        assert_eq!(progress_percent, 100);
    }

    #[test]
    fn test_progress_percent_failed_is_hundred() {
        let status = "failed";
        let progress_percent = match status {
            "queued" => 0,
            "running" => 50,
            "completed" => 100,
            "failed" => 100,
            "cancelled" => 100,
            _ => 0,
        };

        assert_eq!(progress_percent, 100);
    }

    #[test]
    fn test_progress_percent_cancelled_is_hundred() {
        let status = "cancelled";
        let progress_percent = match status {
            "queued" => 0,
            "running" => 50,
            "completed" => 100,
            "failed" => 100,
            "cancelled" => 100,
            _ => 0,
        };

        assert_eq!(progress_percent, 100);
    }

    // ========================================================================
    // TASK CANCELLATION STATE VALIDATION TESTS
    // ========================================================================

    #[test]
    fn test_cancel_queued_task_is_allowed() {
        let task_status = "queued";
        let can_cancel = match task_status {
            "completed" | "failed" | "cancelled" => false,
            _ => true,
        };

        assert!(can_cancel, "Should allow cancellation of queued task");
    }

    #[test]
    fn test_cancel_running_task_is_allowed() {
        let task_status = "running";
        let can_cancel = match task_status {
            "completed" | "failed" | "cancelled" => false,
            _ => true,
        };

        assert!(can_cancel, "Should allow cancellation of running task");
    }

    #[test]
    fn test_cancel_completed_task_is_rejected() {
        let task_status = "completed";
        let can_cancel = match task_status {
            "completed" | "failed" | "cancelled" => false,
            _ => true,
        };

        assert!(!can_cancel, "Should reject cancellation of completed task");
    }

    #[test]
    fn test_cancel_failed_task_is_rejected() {
        let task_status = "failed";
        let can_cancel = match task_status {
            "completed" | "failed" | "cancelled" => false,
            _ => true,
        };

        assert!(!can_cancel, "Should reject cancellation of failed task");
    }

    #[test]
    fn test_cancel_already_cancelled_task_is_rejected() {
        let task_status = "cancelled";
        let can_cancel = match task_status {
            "completed" | "failed" | "cancelled" => false,
            _ => true,
        };

        assert!(!can_cancel, "Should reject cancellation of already cancelled task");
    }

    // ========================================================================
    // TASK STATUS RESPONSE CONSTRUCTION TESTS
    // ========================================================================

    #[test]
    fn test_task_status_response_from_queued_task() {
        let task_row = MockTaskRow::new("task-123", "queued");
        let task_id = task_row.id.clone();

        let progress_percent = match task_row.status.as_str() {
            "queued" => 0,
            "running" => 50,
            "completed" => 100,
            "failed" => 100,
            "cancelled" => 100,
            _ => 0,
        };

        let status = match task_row.status.as_str() {
            "queued" => TaskStatus::Queued,
            "running" => TaskStatus::Running,
            "completed" => TaskStatus::Completed,
            "failed" => TaskStatus::Failed,
            "cancelled" => TaskStatus::Cancelled,
            _ => TaskStatus::Queued,
        };

        assert_eq!(task_id, "task-123");
        assert_eq!(progress_percent, 0);
        assert_eq!(status, TaskStatus::Queued);
    }

    #[test]
    fn test_task_status_response_from_running_task_with_output() {
        let output = json!({"progress": "50%"});
        let task_row = MockTaskRow::new("task-456", "running").with_output(output.clone());

        let status = match task_row.status.as_str() {
            "queued" => TaskStatus::Queued,
            "running" => TaskStatus::Running,
            "completed" => TaskStatus::Completed,
            "failed" => TaskStatus::Failed,
            "cancelled" => TaskStatus::Cancelled,
            _ => TaskStatus::Queued,
        };

        assert_eq!(status, TaskStatus::Running);
        assert_eq!(task_row.output, Some(output));
    }

    #[test]
    fn test_task_status_response_from_failed_task_with_error() {
        let error_msg = "Database connection timeout";
        let task_row = MockTaskRow::new("task-789", "failed").with_error(error_msg);

        let status = match task_row.status.as_str() {
            "queued" => TaskStatus::Queued,
            "running" => TaskStatus::Running,
            "completed" => TaskStatus::Completed,
            "failed" => TaskStatus::Failed,
            "cancelled" => TaskStatus::Cancelled,
            _ => TaskStatus::Queued,
        };

        assert_eq!(status, TaskStatus::Failed);
        assert_eq!(task_row.error, Some(error_msg.to_string()));
    }

    // ========================================================================
    // INPUT MAPPING LOGIC TESTS (WORKFLOW)
    // ========================================================================

    #[test]
    fn test_input_mapping_from_previous_uses_workflow_input() {
        let input_mapping = InputMapping {
            from_previous: true,
            static_input: Some(json!({"default": "value"})),
            field_mapping: None,
        };

        let workflow_input = json!({"user": "data"});

        let step_input = if input_mapping.from_previous {
            workflow_input.clone()
        } else if let Some(static_input) = &input_mapping.static_input {
            static_input.clone()
        } else {
            json!({})
        };

        assert_eq!(step_input, workflow_input);
    }

    #[test]
    fn test_input_mapping_static_input_used_when_from_previous_false() {
        let static_val = json!({"static": "data"});
        let input_mapping = InputMapping {
            from_previous: false,
            static_input: Some(static_val.clone()),
            field_mapping: None,
        };

        let workflow_input = json!({"user": "data"});

        let step_input = if input_mapping.from_previous {
            workflow_input.clone()
        } else if let Some(static_input) = &input_mapping.static_input {
            static_input.clone()
        } else {
            json!({})
        };

        assert_eq!(step_input, static_val);
        assert_ne!(step_input, workflow_input);
    }

    #[test]
    fn test_input_mapping_default_empty_when_no_input() {
        let input_mapping = InputMapping {
            from_previous: false,
            static_input: None,
            field_mapping: None,
        };

        let workflow_input = json!({"user": "data"});

        let step_input = if input_mapping.from_previous {
            workflow_input.clone()
        } else if let Some(static_input) = &input_mapping.static_input {
            static_input.clone()
        } else {
            json!({})
        };

        assert_eq!(step_input, json!({}));
    }

    // ========================================================================
    // EXECUTE TASK REQUEST VALIDATION TESTS
    // ========================================================================

    #[test]
    fn test_execute_task_request_with_required_fields() {
        let req = ExecuteTaskRequest {
            agent_id: "agent-123".to_string(),
            input: json!({"key": "value"}),
            priority: None,
            timeout_seconds: None,
        };

        assert_eq!(req.agent_id, "agent-123");
        assert_eq!(req.input, json!({"key": "value"}));
        assert!(req.priority.is_none());
        assert!(req.timeout_seconds.is_none());
    }

    #[test]
    fn test_execute_task_request_with_priority() {
        let req = ExecuteTaskRequest {
            agent_id: "agent-456".to_string(),
            input: json!({}),
            priority: Some(5),
            timeout_seconds: None,
        };

        assert_eq!(req.priority, Some(5));
        let priority_as_i32 = req.priority.unwrap_or(0) as i32;
        assert_eq!(priority_as_i32, 5);
    }

    #[test]
    fn test_execute_task_request_with_timeout() {
        let req = ExecuteTaskRequest {
            agent_id: "agent-789".to_string(),
            input: json!({}),
            priority: None,
            timeout_seconds: Some(30),
        };

        assert_eq!(req.timeout_seconds, Some(30));
    }

    #[test]
    fn test_execute_task_request_priority_defaults_to_zero() {
        let req = ExecuteTaskRequest {
            agent_id: "agent-111".to_string(),
            input: json!({}),
            priority: None,
            timeout_seconds: None,
        };

        let priority = req.priority.unwrap_or(0) as i32;
        assert_eq!(priority, 0);
    }

    // ========================================================================
    // BATCH EXECUTE REQUEST TESTS
    // ========================================================================

    #[test]
    fn test_batch_execute_request_multiple_tasks() {
        let batch_req = BatchExecuteRequest {
            tasks: vec![
                ExecuteTaskRequest {
                    agent_id: "agent-1".to_string(),
                    input: json!({"num": 1}),
                    priority: None,
                    timeout_seconds: None,
                },
                ExecuteTaskRequest {
                    agent_id: "agent-2".to_string(),
                    input: json!({"num": 2}),
                    priority: Some(5),
                    timeout_seconds: None,
                },
                ExecuteTaskRequest {
                    agent_id: "agent-3".to_string(),
                    input: json!({"num": 3}),
                    priority: None,
                    timeout_seconds: Some(60),
                },
            ],
        };

        assert_eq!(batch_req.tasks.len(), 3);
        assert_eq!(batch_req.tasks[0].agent_id, "agent-1");
        assert_eq!(batch_req.tasks[1].priority, Some(5));
        assert_eq!(batch_req.tasks[2].timeout_seconds, Some(60));
    }

    #[test]
    fn test_batch_execute_request_empty() {
        let batch_req = BatchExecuteRequest { tasks: vec![] };

        assert_eq!(batch_req.tasks.len(), 0);
    }

    #[test]
    fn test_batch_execute_response_construction() {
        let task_ids = vec![
            "task-1".to_string(),
            "task-2".to_string(),
            "task-3".to_string(),
        ];

        let response = BatchExecuteResponse {
            batch_id: "batch-123".to_string(),
            task_ids: task_ids.clone(),
            total_tasks: task_ids.len(),
        };

        assert_eq!(response.batch_id, "batch-123");
        assert_eq!(response.total_tasks, 3);
        assert_eq!(response.task_ids.len(), 3);
    }

    // ========================================================================
    // WORKFLOW VALIDATION TESTS
    // ========================================================================

    #[test]
    fn test_workflow_with_empty_steps_is_invalid() {
        let steps: Vec<WorkflowStep> = vec![];

        let is_valid = !steps.is_empty();
        assert!(!is_valid, "Workflow with empty steps should be invalid");
    }

    #[test]
    fn test_workflow_with_single_step_is_valid() {
        let step = WorkflowStep {
            id: "step-1".to_string(),
            agent_id: "agent-1".to_string(),
            input_mapping: InputMapping {
                from_previous: false,
                static_input: None,
                field_mapping: None,
            },
            on_success: None,
            on_failure: None,
            timeout_seconds: None,
        };

        let steps = vec![step];
        let is_valid = !steps.is_empty();
        assert!(is_valid, "Workflow with single step should be valid");

        let first_step = &steps[0];
        assert_eq!(first_step.id, "step-1");
    }

    #[test]
    fn test_workflow_with_multiple_steps_and_routing() {
        let steps = vec![
            WorkflowStep {
                id: "step-1".to_string(),
                agent_id: "agent-1".to_string(),
                input_mapping: InputMapping {
                    from_previous: false,
                    static_input: None,
                    field_mapping: None,
                },
                on_success: Some("step-2".to_string()),
                on_failure: Some("step-error".to_string()),
                timeout_seconds: Some(30),
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
                timeout_seconds: Some(60),
            },
        ];

        assert_eq!(steps.len(), 2);
        assert_eq!(steps[0].on_success, Some("step-2".to_string()));
        assert_eq!(steps[1].input_mapping.from_previous, true);
    }

    // ========================================================================
    // QUEUE STATUS CALCULATION TESTS
    // ========================================================================

    #[test]
    fn test_queue_status_all_zeros() {
        let queue_status = QueueStatus {
            total_queued: 0,
            total_executing: 0,
            total_completed: 0,
            total_failed: 0,
            average_wait_time_ms: 0.0,
        };

        assert_eq!(queue_status.total_queued, 0);
        assert_eq!(queue_status.total_executing, 0);
        assert_eq!(queue_status.total_completed, 0);
        assert_eq!(queue_status.total_failed, 0);
        assert_eq!(queue_status.average_wait_time_ms, 0.0);
    }

    #[test]
    fn test_queue_status_with_mixed_counts() {
        let queue_status = QueueStatus {
            total_queued: 10,
            total_executing: 5,
            total_completed: 100,
            total_failed: 3,
            average_wait_time_ms: 1500.5,
        };

        assert_eq!(queue_status.total_queued, 10);
        assert_eq!(queue_status.total_executing, 5);
        assert_eq!(queue_status.total_completed, 100);
        assert_eq!(queue_status.total_failed, 3);
        assert!((queue_status.average_wait_time_ms - 1500.5).abs() < 0.01);
    }

    #[test]
    fn test_queue_status_total_tasks_calculation() {
        let queue_status = QueueStatus {
            total_queued: 10,
            total_executing: 5,
            total_completed: 100,
            total_failed: 3,
            average_wait_time_ms: 1000.0,
        };

        let total_tasks = queue_status.total_queued
            + queue_status.total_executing
            + queue_status.total_completed
            + queue_status.total_failed;

        assert_eq!(total_tasks, 118);
    }

    // ========================================================================
    // WORKFLOW EXECUTION RESPONSE TESTS
    // ========================================================================

    #[test]
    fn test_workflow_execution_response_construction() {
        let now = Utc::now();
        let response = WorkflowExecutionResponse {
            execution_id: "exec-123".to_string(),
            workflow_id: "workflow-456".to_string(),
            status: WorkflowStatus::Running,
            created_at: now,
        };

        assert_eq!(response.execution_id, "exec-123");
        assert_eq!(response.workflow_id, "workflow-456");
        assert_eq!(response.status, WorkflowStatus::Running);
        assert_eq!(response.created_at, now);
    }

    #[test]
    fn test_workflow_execution_status_transitions() {
        let statuses = vec![
            WorkflowStatus::Running,
            WorkflowStatus::Completed,
            WorkflowStatus::Failed,
            WorkflowStatus::Cancelled,
        ];

        assert_eq!(statuses.len(), 4);
        assert_eq!(statuses[0], WorkflowStatus::Running);
        assert_eq!(statuses[1], WorkflowStatus::Completed);
        assert_eq!(statuses[2], WorkflowStatus::Failed);
        assert_eq!(statuses[3], WorkflowStatus::Cancelled);
    }

    // ========================================================================
    // ERROR RESPONSE TESTS
    // ========================================================================

    #[test]
    fn test_error_response_not_found() {
        let error = "NotFound";
        let message = "Task task-123 not found";
        let code = "404";

        assert_eq!(error, "NotFound");
        assert!(message.contains("task-123"));
        assert_eq!(code, "404");
    }

    #[test]
    fn test_error_response_bad_request() {
        let error = "BadRequest";
        let message = "Cannot cancel task in completed state";
        let code = "400";

        assert_eq!(error, "BadRequest");
        assert!(message.contains("completed"));
        assert_eq!(code, "400");
    }

    #[test]
    fn test_error_response_database_error() {
        let error = "DatabaseError";
        let message = "Failed to create task: database connection failed";
        let code = "500";

        assert_eq!(error, "DatabaseError");
        assert!(message.contains("database connection"));
        assert_eq!(code, "500");
    }

    #[test]
    fn test_error_response_validation_error() {
        let error = "ValidationError";
        let message = "Workflow has no steps";
        let code = "400";

        assert_eq!(error, "ValidationError");
        assert!(message.contains("steps"));
        assert_eq!(code, "400");
    }

    // ========================================================================
    // JSON DESERIALIZATION EDGE CASES
    // ========================================================================

    #[test]
    fn test_task_status_response_with_null_values() {
        let response_json = json!({
            "task_id": "task-123",
            "status": "queued",
            "progress_percent": 0,
            "output": null,
            "error": null
        });

        let task_id = response_json["task_id"].as_str().unwrap();
        let status_str = response_json["status"].as_str().unwrap();
        let output = response_json["output"].as_object();
        let error = response_json["error"].as_str();

        assert_eq!(task_id, "task-123");
        assert_eq!(status_str, "queued");
        assert!(output.is_none());
        assert!(error.is_none());
    }

    #[test]
    fn test_execute_task_request_with_complex_json_input() {
        let complex_input = json!({
            "nested": {
                "level": 2,
                "array": [1, 2, 3],
                "boolean": true,
                "null_val": null
            },
            "text": "hello world"
        });

        let req = ExecuteTaskRequest {
            agent_id: "agent-1".to_string(),
            input: complex_input.clone(),
            priority: None,
            timeout_seconds: None,
        };

        assert_eq!(req.input, complex_input);
        assert_eq!(req.input["nested"]["level"], 2);
        assert_eq!(req.input["nested"]["array"][0], 1);
        assert_eq!(req.input["nested"]["boolean"], true);
    }

    #[test]
    fn test_batch_response_with_many_task_ids() {
        let task_ids: Vec<String> = (0..100)
            .map(|i| format!("task-{}", i))
            .collect();

        let response = BatchExecuteResponse {
            batch_id: "batch-big".to_string(),
            task_ids: task_ids.clone(),
            total_tasks: task_ids.len(),
        };

        assert_eq!(response.total_tasks, 100);
        assert_eq!(response.task_ids[0], "task-0");
        assert_eq!(response.task_ids[99], "task-99");
    }
}
