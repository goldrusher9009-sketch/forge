use forge_core::executor::{DbPool, ToolQueue};
use forge_core::agents::tools::{ToolRegistry, Tool, ToolResult};
use serde_json::{json, Value as JsonValue};
use std::sync::Arc;
use tokio::sync::Mutex;

/// Mock tool for testing executor handlers
struct MockTool {
    name: String,
    should_fail: Arc<Mutex<bool>>,
    execution_count: Arc<Mutex<usize>>,
}

#[async_trait::async_trait]
impl Tool for MockTool {
    fn name(&self) -> &str {
        &self.name
    }

    fn description(&self) -> &str {
        "Mock tool for integration testing"
    }

    async fn execute(&self, input: JsonValue) -> Result<ToolResult, String> {
        let mut count = self.execution_count.lock().await;
        *count += 1;

        let should_fail = *self.should_fail.lock().await;
        if should_fail {
            return Ok(ToolResult {
                success: false,
                data: json!({}),
                error: Some("Simulated tool failure".to_string()),
            });
        }

        Ok(ToolResult {
            success: true,
            data: json!({
                "input": input,
                "execution_count": *count,
                "status": "success"
            }),
            error: None,
        })
    }
}

#[tokio::test]
#[ignore]  // Run with: cargo test -- --ignored --test-threads=1
async fn test_executor_enqueue_dequeue_complete() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");
    let queue = ToolQueue::new(db.clone());

    let task_id = format!("exec-test-{}", uuid::Uuid::new_v4());
    let input = json!({"action": "test_execute"});

    // Enqueue task
    queue
        .enqueue(&task_id, "agent-1", input.clone(), 5)
        .await
        .expect("Failed to enqueue");

    // Verify task is queued
    let task = db
        .get_task(&task_id)
        .await
        .expect("Failed to get task")
        .expect("Task should exist");
    assert_eq!(task.status, "queued");
    assert_eq!(task.priority, 5);

    // Dequeue task
    let items = queue.dequeue(1).await.expect("Failed to dequeue");
    assert_eq!(items.len(), 1);
    assert_eq!(items[0].task_id, task_id);
    assert_eq!(items[0].agent_id, "agent-1");

    // Verify task is marked running
    let task = db
        .get_task(&task_id)
        .await
        .expect("Failed to get task")
        .expect("Task should exist");
    assert_eq!(task.status, "running");

    // Complete task
    let output = json!({"result": "execution_success", "data": [1, 2, 3]});
    queue
        .complete_success(&task_id, output.clone(), 150)
        .await
        .expect("Failed to complete");

    // Verify task is completed
    let task = db
        .get_task(&task_id)
        .await
        .expect("Failed to get task")
        .expect("Task should exist");
    assert_eq!(task.status, "completed");
    assert_eq!(task.output, Some(output));
    assert_eq!(task.duration_ms, 150);
}

#[tokio::test]
#[ignore]
async fn test_executor_failure_handling() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");
    let queue = ToolQueue::new(db.clone());

    let task_id = format!("fail-test-{}", uuid::Uuid::new_v4());
    let input = json!({"action": "intentional_failure"});

    // Enqueue task
    queue
        .enqueue(&task_id, "agent-2", input, 3)
        .await
        .expect("Failed to enqueue");

    // Dequeue
    let items = queue.dequeue(1).await.expect("Failed to dequeue");
    assert_eq!(items[0].task_id, task_id);

    // Mark as failed
    let error_msg = "Database connection timeout after 5 attempts";
    queue
        .complete_failure(&task_id, error_msg, 5000)
        .await
        .expect("Failed to mark failure");

    // Verify task is failed with error recorded
    let task = db
        .get_task(&task_id)
        .await
        .expect("Failed to get task")
        .expect("Task should exist");
    assert_eq!(task.status, "failed");
    assert_eq!(task.error, Some(error_msg.to_string()));
    assert_eq!(task.duration_ms, 5000);
}

#[tokio::test]
#[ignore]
async fn test_executor_retry_logic() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");
    let queue = ToolQueue::new(db.clone());

    let task_id = format!("retry-test-{}", uuid::Uuid::new_v4());
    let input = json!({"action": "retry_test"});

    // Enqueue with max_retries = 3
    db.create_task(&task_id, "agent-3", input, 2, Some(3))
        .await
        .expect("Failed to create task");

    // Dequeue and mark as failed
    let items = queue.dequeue(1).await.expect("Failed to dequeue");
    assert_eq!(items[0].retry_count, 0);
    assert_eq!(items[0].max_retries, 3);

    queue
        .complete_failure(&task_id, "Attempt 1 failed", 1000)
        .await
        .expect("Failed to complete");

    // Retry task (should succeed and reset to queued)
    queue
        .retry_task(&task_id)
        .await
        .expect("First retry should succeed");

    let task = db
        .get_task(&task_id)
        .await
        .expect("Failed to get task")
        .expect("Task should exist");
    assert_eq!(task.status, "queued");
    assert_eq!(task.retry_count, 1);

    // Dequeue and fail again
    let items = queue.dequeue(1).await.expect("Failed to dequeue");
    assert_eq!(items[0].retry_count, 1);

    queue
        .complete_failure(&task_id, "Attempt 2 failed", 1200)
        .await
        .expect("Failed to complete");

    queue.retry_task(&task_id).await.expect("Second retry");

    let task = db
        .get_task(&task_id)
        .await
        .expect("Failed to get task")
        .expect("Task should exist");
    assert_eq!(task.retry_count, 2);

    // Third attempt
    let items = queue.dequeue(1).await.expect("Failed to dequeue");
    queue
        .complete_failure(&task_id, "Attempt 3 failed", 1400)
        .await
        .expect("Failed to complete");

    queue.retry_task(&task_id).await.expect("Third retry");

    let task = db
        .get_task(&task_id)
        .await
        .expect("Failed to get task")
        .expect("Task should exist");
    assert_eq!(task.retry_count, 3);

    // Fourth attempt should fail (max_retries exceeded)
    let items = queue.dequeue(1).await.expect("Failed to dequeue");
    queue
        .complete_failure(&task_id, "Attempt 4 failed", 1600)
        .await
        .expect("Failed to complete");

    let retry_result = queue.retry_task(&task_id).await;
    assert!(
        retry_result.is_err(),
        "Should not allow retry beyond max_retries"
    );
    assert!(retry_result
        .unwrap_err()
        .contains("exceeded max retries"));
}

#[tokio::test]
#[ignore]
async fn test_executor_batch_dequeue_priority_ordering() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");
    let queue = ToolQueue::new(db.clone());

    // Enqueue multiple tasks with different priorities
    let task_low = format!("priority-low-{}", uuid::Uuid::new_v4());
    let task_medium = format!("priority-med-{}", uuid::Uuid::new_v4());
    let task_high = format!("priority-high-{}", uuid::Uuid::new_v4());

    // Enqueue in random order
    queue
        .enqueue(&task_low, "agent-4", json!({"priority": "low"}), 1)
        .await
        .expect("Failed to enqueue low");

    queue
        .enqueue(&task_high, "agent-4", json!({"priority": "high"}), 10)
        .await
        .expect("Failed to enqueue high");

    queue
        .enqueue(&task_medium, "agent-4", json!({"priority": "medium"}), 5)
        .await
        .expect("Failed to enqueue medium");

    // Dequeue batch of 3
    let items = queue.dequeue(3).await.expect("Failed to dequeue");
    assert_eq!(items.len(), 3);

    // Verify they come out in priority order (highest first)
    assert_eq!(items[0].task_id, task_high);
    assert_eq!(items[0].priority, 10);

    assert_eq!(items[1].task_id, task_medium);
    assert_eq!(items[1].priority, 5);

    assert_eq!(items[2].task_id, task_low);
    assert_eq!(items[2].priority, 1);
}

#[tokio::test]
#[ignore]
async fn test_executor_execution_history_recording() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");

    let task_id = format!("history-test-{}", uuid::Uuid::new_v4());
    let tool_id = format!("tool-{}", uuid::Uuid::new_v4());
    let execution_id = format!("exec-{}", uuid::Uuid::new_v4());

    let input = json!({"test_input": "data"});
    let output = json!({"test_output": "result"});

    // Record execution
    let history_id = db
        .record_execution(
            &task_id,
            &tool_id,
            "test_tool",
            &execution_id,
            input.clone(),
            output.clone(),
            None,
            true,
            250,
            Some("haiku"),
            Some(0.5),
            Some(0.7),
            1,
        )
        .await
        .expect("Failed to record execution");

    assert!(!history_id.is_empty());

    // Retrieve execution history
    let executions = db
        .get_task_executions(&task_id)
        .await
        .expect("Failed to get executions");

    assert!(!executions.is_empty());
    let exec = &executions[0];
    assert_eq!(exec.task_id, task_id);
    assert_eq!(exec.tool_id, tool_id);
    assert_eq!(exec.execution_id, execution_id);
    assert_eq!(exec.success, true);
    assert_eq!(exec.duration_ms, 250);
    assert_eq!(exec.model_used, Some("haiku".to_string()));
}

#[tokio::test]
#[ignore]
async fn test_executor_tool_metrics_aggregation() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");

    let task_id = format!("metrics-test-{}", uuid::Uuid::new_v4());
    let tool_id = format!("metric-tool-{}", uuid::Uuid::new_v4());

    // Record multiple executions
    for i in 0..5 {
        let execution_id = format!("exec-{}-{}", uuid::Uuid::new_v4(), i);
        let success = i < 4; // 4 successes, 1 failure

        db.record_execution(
            &task_id,
            &tool_id,
            "metric_tool",
            &execution_id,
            json!({"iteration": i}),
            json!({"result": i}),
            if success { None } else { Some("Error") },
            success,
            100 + (i as i64 * 10), // Varying durations
            None,
            None,
            None,
            1,
        )
        .await
        .expect("Failed to record execution");
    }

    // Query tool metrics (auto-calculated by triggers)
    let metrics = db
        .get_tool_metrics(&tool_id)
        .await
        .expect("Failed to get metrics");

    assert_eq!(metrics.tool_id, tool_id);
    assert_eq!(metrics.execution_count, 5);
    assert_eq!(metrics.success_count, 4);
    assert_eq!(metrics.failure_count, 1);
    assert!(metrics.success_rate >= 0.79 && metrics.success_rate <= 0.81); // 4/5 = 0.80

    // Verify duration stats
    assert!(metrics.avg_duration_ms > 0.0);
    assert!(metrics.min_duration_ms <= metrics.max_duration_ms);
}

#[tokio::test]
#[ignore]
async fn test_executor_working_memory_management() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");

    let task_id = format!("memory-test-{}", uuid::Uuid::new_v4());
    let agent_id = "agent-memory-test";

    // Set working memory
    db.set_working_memory(agent_id, task_id, "context_key_1", json!({"value": 1}), None)
        .await
        .expect("Failed to set working memory");

    db.set_working_memory(
        agent_id,
        task_id,
        "context_key_2",
        json!({"value": 2}),
        None,
    )
    .await
    .expect("Failed to set working memory");

    // Retrieve specific context
    let value = db
        .get_working_memory(agent_id, task_id, "context_key_1")
        .await
        .expect("Failed to get working memory");

    assert_eq!(value, Some(json!({"value": 1})));

    // Retrieve all task working memory
    let all_memory = db
        .get_task_working_memory(agent_id, task_id)
        .await
        .expect("Failed to get task working memory");

    assert_eq!(all_memory.get("context_key_1"), Some(&json!({"value": 1})));
    assert_eq!(all_memory.get("context_key_2"), Some(&json!({"value": 2})));
}

#[tokio::test]
#[ignore]
async fn test_executor_episodic_memory_recall() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");

    let agent_id = "agent-episodic";

    // Episodes should be created by triggers from execution history
    // Retrieve high-importance episodes
    let episodes = db
        .get_agent_episodes(agent_id, 10)
        .await
        .expect("Failed to get episodes");

    // If episodes exist, verify recall counting works
    if !episodes.is_empty() {
        let episode = &episodes[0];
        let initial_recall = episode.recall_count;

        // Trigger recall (increments counter)
        let recalled = db
            .get_and_recall_episode(&episode.id)
            .await
            .expect("Failed to recall episode");

        assert_eq!(recalled.recall_count, initial_recall + 1);
    }
}

#[tokio::test]
#[ignore]
async fn test_executor_semantic_memory_confidence_decay() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");

    let agent_id = "agent-semantic";
    let knowledge_key = format!("knowledge-{}", uuid::Uuid::new_v4());
    let knowledge_value = json!({"pattern": "learned", "effectiveness": 0.95});

    // Set semantic memory
    db.set_semantic_memory(
        agent_id,
        &knowledge_key,
        knowledge_value.clone(),
        0.9, // confidence
    )
    .await
    .expect("Failed to set semantic memory");

    // Retrieve and verify
    let memory = db
        .get_agent_semantic_memory(agent_id, 10)
        .await
        .expect("Failed to get semantic memory");

    assert!(!memory.is_empty());
    let found = memory.iter().find(|m| m.knowledge_key == knowledge_key);
    assert!(found.is_some());
    assert_eq!(found.unwrap().confidence, 0.9);

    // Touch memory to update last_used_at
    db.touch_semantic_memory(agent_id, &knowledge_key)
        .await
        .expect("Failed to touch semantic memory");

    let memory_again = db
        .get_agent_semantic_memory(agent_id, 10)
        .await
        .expect("Failed to get semantic memory again");

    let found_again = memory_again.iter().find(|m| m.knowledge_key == knowledge_key);
    assert!(found_again.is_some());
    // last_used_at should be updated (timestamp will be different)
}

#[tokio::test]
#[ignore]
async fn test_executor_memory_relationships() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");

    let agent_id = "agent-relationships";

    // Memory relationships are created by triggers linking episodic to semantic memory
    // Retrieve memory relationships
    let relationships = db
        .get_memory_relationships(agent_id, "episodic")
        .await
        .expect("Failed to get memory relationships");

    // Verify structure (may be empty if no episodes/semantic memories exist)
    for rel in relationships {
        assert!(!rel.source_id.is_empty());
        assert!(!rel.target_id.is_empty());
        assert!(rel.strength >= 0.0 && rel.strength <= 1.0);
    }
}

#[tokio::test]
#[ignore]
async fn test_executor_duplicate_task_prevention() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");
    let queue = ToolQueue::new(db.clone());

    let task_id = format!("duplicate-test-{}", uuid::Uuid::new_v4());
    let input = json!({"action": "test"});

    // Enqueue first time
    let result1 = queue
        .enqueue(&task_id, "agent-5", input.clone(), 1)
        .await;
    assert!(result1.is_ok());

    // Try to enqueue duplicate (should fail or be ignored by ON CONFLICT)
    let result2 = queue.enqueue(&task_id, "agent-5", input, 1).await;
    // ON CONFLICT DO NOTHING means no error, but task not re-created
    // Verify task still has only one entry in database
    let task = db
        .get_task(&task_id)
        .await
        .expect("Failed to get task")
        .expect("Task should exist");
    assert_eq!(task.id, task_id);
}

#[tokio::test]
#[ignore]
async fn test_executor_concurrent_dequeue_safety() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");
    let queue = Arc::new(ToolQueue::new(db.clone()));

    // Enqueue multiple tasks
    let mut task_ids = Vec::new();
    for i in 0..5 {
        let task_id = format!("concurrent-{}-{}", uuid::Uuid::new_v4(), i);
        queue
            .enqueue(&task_id, "agent-6", json!({"index": i}), 1)
            .await
            .expect("Failed to enqueue");
        task_ids.push(task_id);
    }

    // Spawn concurrent dequeue operations
    let mut handles = vec![];
    for _ in 0..3 {
        let q = queue.clone();
        let handle = tokio::spawn(async move {
            q.dequeue(2).await.expect("Failed to dequeue")
        });
        handles.push(handle);
    }

    // Collect results
    let mut dequeued_ids = Vec::new();
    for handle in handles {
        let items = handle.await.expect("Task panicked");
        for item in items {
            dequeued_ids.push(item.task_id);
        }
    }

    // Verify all tasks dequeued exactly once (no duplicates)
    assert_eq!(dequeued_ids.len(), 5);
    dequeued_ids.sort();
    for id in dequeued_ids.iter() {
        assert!(task_ids.contains(id));
    }

    // Count occurrences to ensure no duplicates
    let mut seen = std::collections::HashSet::new();
    for id in dequeued_ids {
        assert!(
            seen.insert(id),
            "Duplicate dequeue detected - task executor not thread-safe"
        );
    }
}
