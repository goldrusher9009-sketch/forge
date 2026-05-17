// ============================================================================
// UNIT TESTS: MODELS
// ============================================================================

#[cfg(test)]
mod tests {
    use crate::models::*;
    use chrono::Utc;
    use serde_json::json;

    #[test]
    fn test_agent_creation() {
        let agent = Agent {
            id: "test-agent-1".to_string(),
            name: "Test Agent".to_string(),
            description: "A test agent".to_string(),
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
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        assert_eq!(agent.id, "test-agent-1");
        assert_eq!(agent.name, "Test Agent");
        assert!(agent.enabled);
        assert_eq!(agent.config.temperature, 0.7);
    }

    #[test]
    fn test_task_creation() {
        let task = Task {
            id: "task-1".to_string(),
            agent_id: "agent-1".to_string(),
            input: json!({"message": "test"}),
            status: TaskStatus::Queued,
            output: None,
            error: None,
            created_at: Utc::now(),
            started_at: None,
            completed_at: None,
            duration_ms: None,
        };

        assert_eq!(task.id, "task-1");
        assert_eq!(task.agent_id, "agent-1");
        assert_eq!(task.status, TaskStatus::Queued);
        assert!(task.output.is_none());
    }

    #[test]
    fn test_workflow_creation() {
        let workflow = Workflow {
            id: "workflow-1".to_string(),
            name: "Test Workflow".to_string(),
            description: "A test workflow".to_string(),
            steps: vec![
                WorkflowStep {
                    id: "step-1".to_string(),
                    agent_id: "agent-1".to_string(),
                    input_mapping: InputMapping {
                        from_previous: false,
                        static_input: Some(json!({"key": "value"})),
                        field_mapping: None,
                    },
                    on_success: Some("step-2".to_string()),
                    on_failure: None,
                    timeout_seconds: Some(30),
                },
            ],
            enabled: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        assert_eq!(workflow.id, "workflow-1");
        assert_eq!(workflow.steps.len(), 1);
        assert_eq!(workflow.steps[0].agent_id, "agent-1");
    }

    #[test]
    fn test_task_status_transitions() {
        let mut task = Task {
            id: "task-1".to_string(),
            agent_id: "agent-1".to_string(),
            input: json!({}),
            status: TaskStatus::Queued,
            output: None,
            error: None,
            created_at: Utc::now(),
            started_at: None,
            completed_at: None,
            duration_ms: None,
        };

        // Queued -> Running
        task.status = TaskStatus::Running;
        task.started_at = Some(Utc::now());
        assert_eq!(task.status, TaskStatus::Running);

        // Running -> Completed
        task.status = TaskStatus::Completed;
        task.completed_at = Some(Utc::now());
        task.output = Some(json!({"result": "success"}));
        assert_eq!(task.status, TaskStatus::Completed);
    }

    #[test]
    fn test_agent_config_serialization() {
        let config = AgentConfig {
            model: "claude-opus".to_string(),
            temperature: 0.7,
            max_tokens: 2048,
            timeout_seconds: 30,
            retry_count: 3,
            custom_params: json!({"key": "value"}),
        };

        let serialized = serde_json::to_string(&config).unwrap();
        let deserialized: AgentConfig = serde_json::from_str(&serialized).unwrap();

        assert_eq!(deserialized.model, config.model);
        assert_eq!(deserialized.temperature, config.temperature);
    }

    #[test]
    fn test_workflow_step_mapping() {
        let step = WorkflowStep {
            id: "step-1".to_string(),
            agent_id: "agent-1".to_string(),
            input_mapping: InputMapping {
                from_previous: true,
                static_input: None,
                field_mapping: Some(
                    [("output".to_string(), "input".to_string())]
                        .iter()
                        .cloned()
                        .collect(),
                ),
            },
            on_success: Some("step-2".to_string()),
            on_failure: Some("step-error".to_string()),
            timeout_seconds: Some(60),
        };

        assert!(step.input_mapping.from_previous);
        assert_eq!(step.on_success, Some("step-2".to_string()));
        assert_eq!(step.on_failure, Some("step-error".to_string()));
    }

    #[test]
    fn test_batch_execute_request() {
        let batch = BatchExecuteRequest {
            tasks: vec![
                ExecuteTaskRequest {
                    agent_id: "agent-1".to_string(),
                    input: json!({"data": "task1"}),
                    priority: Some(1),
                    timeout_seconds: Some(30),
                },
                ExecuteTaskRequest {
                    agent_id: "agent-2".to_string(),
                    input: json!({"data": "task2"}),
                    priority: Some(2),
                    timeout_seconds: Some(60),
                },
            ],
        };

        assert_eq!(batch.tasks.len(), 2);
        assert_eq!(batch.tasks[0].agent_id, "agent-1");
        assert_eq!(batch.tasks[1].priority, Some(2));
    }

    #[test]
    fn test_queue_status_calculation() {
        let queue = QueueStatus {
            total_queued: 10,
            total_executing: 5,
            total_completed: 100,
            total_failed: 5,
            average_wait_time_ms: 123.45,
        };

        assert_eq!(queue.total_queued + queue.total_executing, 15);
        assert_eq!(queue.total_completed + queue.total_failed, 105);
    }

    #[test]
    fn test_system_stats_aggregation() {
        let stats = SystemStats {
            uptime_seconds: 86400,
            total_agents: 5,
            active_agents: 4,
            total_tasks_executed: 1000,
            success_rate: 0.95,
            average_execution_time_ms: 500.0,
            queue_status: QueueStatus {
                total_queued: 10,
                total_executing: 5,
                total_completed: 950,
                total_failed: 50,
                average_wait_time_ms: 100.0,
            },
        };

        assert!(stats.success_rate > 0.9);
        assert_eq!(stats.queue_status.total_completed + stats.queue_status.total_failed, 1000);
    }
}
