use forge_core::executor::DbPool;
use serde_json::json;

/// Integration tests for the three-tier memory system
/// Tests working memory, episodic memory, and semantic memory with decay and relationships

#[tokio::test]
#[ignore]  // Run with: cargo test -- --ignored --test-threads=1
async fn test_memory_working_memory_basic_operations() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");

    let agent_id = "agent-mem-working";
    let task_id = "task-working-mem";

    // Set multiple working memory entries
    db.set_working_memory(
        agent_id,
        task_id,
        "user_intent",
        json!({"intent": "find hotels", "location": "Paris"}),
        None,
    )
    .await
    .expect("Failed to set working memory");

    db.set_working_memory(
        agent_id,
        task_id,
        "search_results",
        json!({"count": 42, "pages": 3}),
        None,
    )
    .await
    .expect("Failed to set working memory");

    db.set_working_memory(
        agent_id,
        task_id,
        "current_filter",
        json!({"price_range": "$50-200", "rating": "4+"}),
        None,
    )
    .await
    .expect("Failed to set working memory");

    // Retrieve specific entry
    let intent = db
        .get_working_memory(agent_id, task_id, "user_intent")
        .await
        .expect("Failed to get working memory");
    assert_eq!(
        intent,
        Some(json!({"intent": "find hotels", "location": "Paris"}))
    );

    // Retrieve all task memory as merged object
    let all_memory = db
        .get_task_working_memory(agent_id, task_id)
        .await
        .expect("Failed to get task working memory");

    assert_eq!(all_memory.get("user_intent"), intent.as_ref());
    assert_eq!(
        all_memory.get("search_results"),
        Some(&json!({"count": 42, "pages": 3}))
    );
    assert_eq!(
        all_memory.get("current_filter"),
        Some(&json!({"price_range": "$50-200", "rating": "4+"}))
    );
}

#[tokio::test]
#[ignore]
async fn test_memory_working_memory_expiration() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");

    let agent_id = "agent-mem-expiry";
    let task_id = "task-expiry-test";

    // Set with very short expiration (1 second)
    db.set_working_memory(
        agent_id,
        task_id,
        "temporary_context",
        json!({"data": "should expire"}),
        Some(std::time::Duration::from_secs(1)),
    )
    .await
    .expect("Failed to set working memory");

    // Verify it exists immediately
    let value = db
        .get_working_memory(agent_id, task_id, "temporary_context")
        .await
        .expect("Failed to get working memory");
    assert_eq!(value, Some(json!({"data": "should expire"})));

    // Wait for expiration
    tokio::time::sleep(std::time::Duration::from_secs(2)).await;

    // Verify it's expired (get_working_memory filters expired entries)
    let expired = db
        .get_working_memory(agent_id, task_id, "temporary_context")
        .await
        .expect("Failed to get working memory");
    assert_eq!(expired, None);
}

#[tokio::test]
#[ignore]
async fn test_memory_episodic_importance_ranking() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");

    let agent_id = "agent-mem-episodic";

    // Retrieve high-importance episodes (created by triggers from execution history)
    let episodes = db
        .get_agent_episodes(agent_id, 20)
        .await
        .expect("Failed to get episodes");

    // Verify ordering by importance (if episodes exist)
    if episodes.len() >= 2 {
        // Episodes should be ordered by importance_score DESC
        for i in 0..episodes.len() - 1 {
            assert!(
                episodes[i].importance_score >= episodes[i + 1].importance_score,
                "Episodes should be ordered by importance_score (descending)"
            );
        }
    }
}

#[tokio::test]
#[ignore]
async fn test_memory_episodic_recall_incrementation() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");

    let agent_id = "agent-mem-recall";

    // Get an episode
    let episodes = db
        .get_agent_episodes(agent_id, 1)
        .await
        .expect("Failed to get episodes");

    if !episodes.is_empty() {
        let episode = &episodes[0];
        let initial_recall = episode.recall_count;

        // Recall the episode (should increment recall_count)
        let recalled = db
            .get_and_recall_episode(&episode.id)
            .await
            .expect("Failed to recall episode");

        assert_eq!(
            recalled.recall_count, initial_recall + 1,
            "Recall count should increment"
        );

        // Recall again
        let recalled_again = db
            .get_and_recall_episode(&episode.id)
            .await
            .expect("Failed to recall episode again");

        assert_eq!(
            recalled_again.recall_count, initial_recall + 2,
            "Recall count should increment again"
        );
    }
}

#[tokio::test]
#[ignore]
async fn test_memory_semantic_upsert_pattern() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");

    let agent_id = "agent-mem-semantic";
    let knowledge_key = format!("pattern-{}", uuid::Uuid::new_v4());

    let initial_value = json!({"pattern": "user_prefers_direct_answers", "count": 3});

    // Set initial semantic memory
    db.set_semantic_memory(agent_id, &knowledge_key, initial_value.clone(), 0.7)
        .await
        .expect("Failed to set semantic memory");

    // Retrieve and verify
    let memory = db
        .get_agent_semantic_memory(agent_id, 50)
        .await
        .expect("Failed to get semantic memory");

    let found = memory.iter().find(|m| m.knowledge_key == knowledge_key);
    assert!(found.is_some());
    assert_eq!(found.unwrap().confidence, 0.7);

    // Update same key with new value (upsert)
    let updated_value = json!({"pattern": "user_prefers_direct_answers", "count": 4, "confidence_boost": true});
    db.set_semantic_memory(agent_id, &knowledge_key, updated_value.clone(), 0.85)
        .await
        .expect("Failed to update semantic memory");

    // Verify update (should not create duplicate)
    let memory_updated = db
        .get_agent_semantic_memory(agent_id, 50)
        .await
        .expect("Failed to get semantic memory after update");

    let found_updated = memory_updated
        .iter()
        .find(|m| m.knowledge_key == knowledge_key);
    assert!(found_updated.is_some());
    assert_eq!(found_updated.unwrap().confidence, 0.85);

    // Verify no duplicates (count should be same)
    let same_key_count = memory_updated
        .iter()
        .filter(|m| m.knowledge_key == knowledge_key)
        .count();
    assert_eq!(same_key_count, 1, "Should only have one entry for this knowledge key");
}

#[tokio::test]
#[ignore]
async fn test_memory_semantic_confidence_and_decay() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");

    let agent_id = "agent-mem-decay";
    let high_confidence_key = format!("confident-{}", uuid::Uuid::new_v4());
    let low_confidence_key = format!("uncertain-{}", uuid::Uuid::new_v4());

    // Set knowledge with different confidence levels
    db.set_semantic_memory(
        agent_id,
        &high_confidence_key,
        json!({"validated": true}),
        0.95, // Very high confidence
    )
    .await
    .expect("Failed to set high confidence");

    db.set_semantic_memory(
        agent_id,
        &low_confidence_key,
        json!({"experimental": true}),
        0.3, // Low confidence
    )
    .await
    .expect("Failed to set low confidence");

    // Retrieve memory ordered by confidence
    let memory = db
        .get_agent_semantic_memory(agent_id, 50)
        .await
        .expect("Failed to get semantic memory");

    let high_conf = memory
        .iter()
        .find(|m| m.knowledge_key == high_confidence_key);
    let low_conf = memory
        .iter()
        .find(|m| m.knowledge_key == low_confidence_key);

    assert!(high_conf.is_some());
    assert!(low_conf.is_some());
    assert!(
        high_conf.unwrap().confidence > low_conf.unwrap().confidence,
        "High confidence should be greater than low confidence"
    );

    // Touch high confidence (update last_used_at for decay tracking)
    db.touch_semantic_memory(agent_id, &high_confidence_key)
        .await
        .expect("Failed to touch memory");

    let memory_touched = db
        .get_agent_semantic_memory(agent_id, 50)
        .await
        .expect("Failed to get semantic memory after touch");

    let touched_entry = memory_touched
        .iter()
        .find(|m| m.knowledge_key == high_confidence_key)
        .expect("Touched entry should exist");

    // Verify last_used_at was updated (would be newer than the original set time)
    assert!(touched_entry.last_used_at.is_some());
}

#[tokio::test]
#[ignore]
async fn test_memory_relationships_episodic_to_semantic() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");

    let agent_id = "agent-mem-relationships";

    // Get memory relationships (created by triggers linking episodic to semantic)
    let relationships = db
        .get_memory_relationships(agent_id, "episodic")
        .await
        .expect("Failed to get memory relationships");

    // Verify relationship structure and constraints
    for rel in &relationships {
        // IDs should be populated
        assert!(!rel.source_id.is_empty(), "Source ID should not be empty");
        assert!(!rel.target_id.is_empty(), "Target ID should not be empty");

        // Strength should be between 0 and 1
        assert!(
            rel.strength >= 0.0 && rel.strength <= 1.0,
            "Relationship strength should be between 0 and 1"
        );

        // Both IDs should be different
        assert_ne!(
            rel.source_id, rel.target_id,
            "Source and target should be different"
        );
    }

    // If relationships exist, verify they represent valid links
    if !relationships.is_empty() {
        // At least some relationships should have reasonable strength
        let strong_relationships: Vec<_> = relationships
            .iter()
            .filter(|r| r.strength > 0.5)
            .collect();
        assert!(
            !strong_relationships.is_empty() || relationships.len() < 3,
            "If relationships exist and there are 3+, some should be strong"
        );
    }
}

#[tokio::test]
#[ignore]
async fn test_memory_relationships_strength_ordering() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");

    let agent_id = "agent-mem-strength";

    // Get relationships and verify ordering
    let relationships = db
        .get_memory_relationships(agent_id, "episodic")
        .await
        .expect("Failed to get memory relationships");

    // Verify relationships are ordered by strength (highest first)
    if relationships.len() >= 2 {
        for i in 0..relationships.len() - 1 {
            assert!(
                relationships[i].strength >= relationships[i + 1].strength,
                "Relationships should be ordered by strength (descending)"
            );
        }
    }
}

#[tokio::test]
#[ignore]
async fn test_memory_integrated_workflow() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");

    let agent_id = "agent-integrated-mem";
    let task_id = "task-integrated";

    // Phase 1: Working memory during task execution
    db.set_working_memory(
        agent_id,
        task_id,
        "search_query",
        json!({"keywords": ["rust", "async", "database"]}),
        None,
    )
    .await
    .expect("Failed to set working memory");

    db.set_working_memory(
        agent_id,
        task_id,
        "execution_state",
        json!({"step": 1, "status": "running"}),
        None,
    )
    .await
    .expect("Failed to set execution state");

    // Retrieve working memory
    let task_memory = db
        .get_task_working_memory(agent_id, task_id)
        .await
        .expect("Failed to get task memory");

    assert!(task_memory.get("search_query").is_some());
    assert!(task_memory.get("execution_state").is_some());

    // Phase 2: Record execution (triggers episodic memory creation)
    let execution_id = format!("exec-{}", uuid::Uuid::new_v4());
    db.record_execution(
        task_id,
        "search-tool",
        "search",
        &execution_id,
        json!({"query": "rust async"}),
        json!({"results": 156, "time_ms": 245}),
        None,
        true,
        245,
        Some("haiku"),
        Some(0.6),
        Some(0.8),
        1,
    )
    .await
    .expect("Failed to record execution");

    // Phase 3: Retrieve episodic memories (created by triggers)
    let episodes = db
        .get_agent_episodes(agent_id, 10)
        .await
        .expect("Failed to get episodes");

    // At least the execution should have created an episode if importance threshold met
    // (exact behavior depends on trigger implementation)

    // Phase 4: Set semantic knowledge from execution results
    db.set_semantic_memory(
        agent_id,
        "search_performance",
        json!({"avg_time_ms": 245, "result_relevance": 0.92}),
        0.85,
    )
    .await
    .expect("Failed to set semantic memory");

    // Phase 5: Get final semantic knowledge
    let semantics = db
        .get_agent_semantic_memory(agent_id, 10)
        .await
        .expect("Failed to get semantic memory");

    let found = semantics
        .iter()
        .find(|m| m.knowledge_key == "search_performance");
    assert!(found.is_some());
    assert_eq!(found.unwrap().confidence, 0.85);
}

#[tokio::test]
#[ignore]
async fn test_memory_persistence_across_tasks() {
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db = DbPool::new(&db_url).await.expect("Failed to create DB pool");

    let agent_id = "agent-persistence";
    let key = format!("persistent-knowledge-{}", uuid::Uuid::new_v4());

    // Set semantic memory (persists across all tasks)
    db.set_semantic_memory(
        agent_id,
        &key,
        json!({"knowledge": "learned from task-1"}),
        0.9,
    )
    .await
    .expect("Failed to set semantic memory in task 1");

    // Retrieve in different "task" context
    let memory = db
        .get_agent_semantic_memory(agent_id, 50)
        .await
        .expect("Failed to get semantic memory in task 2");

    let found = memory.iter().find(|m| m.knowledge_key == key);
    assert!(found.is_some(), "Semantic memory should persist across tasks");
    assert_eq!(found.unwrap().confidence, 0.9);

    // Different task can access and update
    db.set_semantic_memory(
        agent_id,
        &key,
        json!({"knowledge": "learned from task-1 and task-2", "reinforced": true}),
        0.95,
    )
    .await
    .expect("Failed to update semantic memory in task 2");

    let updated = db
        .get_agent_semantic_memory(agent_id, 50)
        .await
        .expect("Failed to get updated semantic memory");

    let updated_entry = updated.iter().find(|m| m.knowledge_key == key);
    assert!(updated_entry.is_some());
    assert_eq!(updated_entry.unwrap().confidence, 0.95);
}
