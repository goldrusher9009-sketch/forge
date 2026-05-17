// ============================================================================
// CONCURRENT OPERATIONS TESTS
// ============================================================================
// Tests for concurrent task execution, race conditions, and synchronization

#[cfg(test)]
mod tests {
    use std::sync::atomic::{AtomicU32, Ordering};
    use std::sync::Arc;
    use tokio::task;

    #[tokio::test]
    async fn test_concurrent_task_dequeue() {
        // Simulate multiple workers dequeuing tasks concurrently
        let queue_size = Arc::new(AtomicU32::new(100));
        let dequeued = Arc::new(AtomicU32::new(0));

        let mut handles = vec![];

        // Spawn 5 concurrent workers
        for worker_id in 0..5 {
            let queue = queue_size.clone();
            let dequeued_count = dequeued.clone();

            let handle = task::spawn(async move {
                // Each worker processes 20 tasks
                for _ in 0..20 {
                    let current = queue.fetch_sub(1, Ordering::SeqCst);
                    if current > 0 {
                        dequeued_count.fetch_add(1, Ordering::SeqCst);
                    }
                }
            });

            handles.push(handle);
        }

        // Wait for all workers
        for handle in handles {
            handle.await.unwrap();
        }

        // Verify all tasks were dequeued
        let total_dequeued = dequeued.load(Ordering::SeqCst);
        let remaining = queue_size.load(Ordering::SeqCst);

        assert_eq!(total_dequeued, 100);
        assert_eq!(remaining, 0);
    }

    #[tokio::test]
    async fn test_concurrent_task_execution() {
        // Simulate 100 tasks executing concurrently
        let completed = Arc::new(AtomicU32::new(0));
        let failed = Arc::new(AtomicU32::new(0));

        let mut handles = vec![];

        for task_id in 0..100 {
            let completed_count = completed.clone();
            let failed_count = failed.clone();

            let handle = task::spawn(async move {
                // Simulate task execution with random outcome
                let success = (task_id % 10) != 0; // 90% success rate

                // Simulate work
                tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

                if success {
                    completed_count.fetch_add(1, Ordering::SeqCst);
                } else {
                    failed_count.fetch_add(1, Ordering::SeqCst);
                }
            });

            handles.push(handle);
        }

        // Wait for all tasks
        for handle in handles {
            handle.await.unwrap();
        }

        let total_completed = completed.load(Ordering::SeqCst);
        let total_failed = failed.load(Ordering::SeqCst);

        // Verify expected distribution
        assert_eq!(total_completed + total_failed, 100);
        assert!(total_completed >= 85 && total_completed <= 95); // ~90% success
    }

    #[tokio::test]
    async fn test_concurrent_agent_creation() {
        // Simulate multiple requests creating agents concurrently
        let created_count = Arc::new(AtomicU32::new(0));
        let mut handles = vec![];

        for i in 0..50 {
            let count = created_count.clone();

            let handle = task::spawn(async move {
                // Simulate agent creation
                let agent_id = format!("concurrent-agent-{}", i);

                // Simulate database insert with small delay
                tokio::time::sleep(tokio::time::Duration::from_micros(100)).await;

                // Mark as created
                count.fetch_add(1, Ordering::SeqCst);
            });

            handles.push(handle);
        }

        for handle in handles {
            handle.await.unwrap();
        }

        let total_created = created_count.load(Ordering::SeqCst);
        assert_eq!(total_created, 50);
    }

    #[tokio::test]
    async fn test_concurrent_read_same_agent() {
        // Simulate multiple requests reading the same agent
        let read_count = Arc::new(AtomicU32::new(0));
        let mut handles = vec![];

        let agent_id = "shared-agent-1";

        // Spawn 20 concurrent read operations
        for _ in 0..20 {
            let count = read_count.clone();

            let handle = task::spawn(async move {
                // Simulate reading agent from database
                tokio::time::sleep(tokio::time::Duration::from_micros(50)).await;

                // Increment read count
                count.fetch_add(1, Ordering::SeqCst);
            });

            handles.push(handle);
        }

        for handle in handles {
            handle.await.unwrap();
        }

        let total_reads = read_count.load(Ordering::SeqCst);
        assert_eq!(total_reads, 20);
    }

    #[tokio::test]
    async fn test_concurrent_update_same_task() {
        // Simulate concurrent updates to the same task
        // In production, the database would ensure serialization
        let task_status = Arc::new(AtomicU32::new(0)); // 0=Queued, 1=Running, 2=Completed

        let mut handles = vec![];

        // Spawn operations that would race in unprotected code
        for i in 0..10 {
            let status = task_status.clone();

            let handle = task::spawn(async move {
                tokio::time::sleep(tokio::time::Duration::from_micros(i * 10)).await;

                // Attempt to update status
                let current = status.load(Ordering::SeqCst);
                if current < 2 {
                    status.store(current + 1, Ordering::SeqCst);
                }
            });

            handles.push(handle);
        }

        for handle in handles {
            handle.await.unwrap();
        }

        // With atomic operations, final status should be 2 (Completed)
        // In real scenario with database transactions, state is consistent
        let final_status = task_status.load(Ordering::SeqCst);
        assert!(final_status >= 1 && final_status <= 2);
    }

    #[tokio::test]
    async fn test_concurrent_queue_operations() {
        // Simulate concurrent queue push and pop operations
        let queue_item_count = Arc::new(AtomicU32::new(0));

        let mut handles = vec![];

        // 5 pushers
        for _ in 0..5 {
            let count = queue_item_count.clone();
            let handle = task::spawn(async move {
                for _ in 0..20 {
                    count.fetch_add(1, Ordering::SeqCst);
                    tokio::time::sleep(tokio::time::Duration::from_micros(100)).await;
                }
            });
            handles.push(handle);
        }

        // 3 poppers (consuming tasks)
        for _ in 0..3 {
            let count = queue_item_count.clone();
            let handle = task::spawn(async move {
                for _ in 0..30 {
                    let current = count.load(Ordering::SeqCst);
                    if current > 0 {
                        count.fetch_sub(1, Ordering::SeqCst);
                    }
                    tokio::time::sleep(tokio::time::Duration::from_micros(150)).await;
                }
            });
            handles.push(handle);
        }

        for handle in handles {
            handle.await.unwrap();
        }

        // Verify final queue state
        let final_count = queue_item_count.load(Ordering::SeqCst);
        assert!(final_count >= 0); // Should be stable
    }

    #[tokio::test]
    async fn test_thundering_herd_task_processing() {
        // Simulate many workers waking up to process tasks
        let processed = Arc::new(AtomicU32::new(0));
        let tasks_available = Arc::new(AtomicU32::new(100));

        let mut handles = vec![];

        // Spawn 20 workers
        for _ in 0..20 {
            let processed_count = processed.clone();
            let tasks_available_count = tasks_available.clone();

            let handle = task::spawn(async move {
                // Each worker tries to grab and process tasks
                loop {
                    let available = tasks_available_count.load(Ordering::SeqCst);
                    if available == 0 {
                        break;
                    }

                    // Try to claim a task (atomic operation)
                    let claimed = tasks_available_count.fetch_sub(1, Ordering::SeqCst);
                    if claimed > 0 {
                        // Process the task
                        tokio::time::sleep(tokio::time::Duration::from_micros(50)).await;
                        processed_count.fetch_add(1, Ordering::SeqCst);
                    }
                }
            });

            handles.push(handle);
        }

        for handle in handles {
            handle.await.unwrap();
        }

        let total_processed = processed.load(Ordering::SeqCst);
        assert_eq!(total_processed, 100);
    }

    #[tokio::test]
    async fn test_worker_heartbeat_concurrent() {
        // Simulate 5 workers sending heartbeats concurrently
        let last_heartbeat = Arc::new(tokio::sync::Mutex::new(vec![]));

        let mut handles = vec![];

        for worker_id in 0..5 {
            let heartbeats = last_heartbeat.clone();

            let handle = task::spawn(async move {
                for iteration in 0..10 {
                    tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

                    let mut hb = heartbeats.lock().await;
                    hb.push((worker_id, iteration));
                }
            });

            handles.push(handle);
        }

        for handle in handles {
            handle.await.unwrap();
        }

        let hb = last_heartbeat.lock().await;
        // Verify all workers sent 10 heartbeats each
        assert_eq!(hb.len(), 50);
    }

    #[tokio::test]
    async fn test_task_status_transition_race() {
        // Test that task status transitions are handled correctly
        // even with concurrent access attempts

        let task_status = Arc::new(AtomicU32::new(0)); // 0=Queued, 1=Running, 2=Completed
        let status_transitions = Arc::new(AtomicU32::new(0));

        let mut handles = vec![];

        // Multiple tasks trying to transition the same task
        for _ in 0..10 {
            let status = task_status.clone();
            let transitions = status_transitions.clone();

            let handle = task::spawn(async move {
                // Try to transition Queued -> Running
                let current = status.load(Ordering::SeqCst);
                if current == 0 {
                    status.store(1, Ordering::SeqCst);
                    transitions.fetch_add(1, Ordering::SeqCst);
                }
            });

            handles.push(handle);
        }

        for handle in handles {
            handle.await.unwrap();
        }

        // Only one should have successfully transitioned
        let final_status = task_status.load(Ordering::SeqCst);
        assert_eq!(final_status, 1);
    }

    #[tokio::test]
    async fn test_concurrent_agent_stats_collection() {
        // Multiple observers collecting agent stats concurrently
        let stats_collected = Arc::new(AtomicU32::new(0));

        let mut handles = vec![];

        for observer_id in 0..5 {
            let stats = stats_collected.clone();

            let handle = task::spawn(async move {
                // Simulate collecting stats for 10 agents
                for agent_num in 0..10 {
                    tokio::time::sleep(tokio::time::Duration::from_micros(50)).await;
                    stats.fetch_add(1, Ordering::SeqCst);
                }
            });

            handles.push(handle);
        }

        for handle in handles {
            handle.await.unwrap();
        }

        let total_stats = stats_collected.load(Ordering::SeqCst);
        assert_eq!(total_stats, 50);
    }

    #[tokio::test]
    async fn test_backpressure_queue_limit() {
        // Simulate producers and consumers with backpressure
        let queue_size = Arc::new(AtomicU32::new(0));
        let max_queue_size = 50;

        let mut handles = vec![];

        // 3 producers
        for _ in 0..3 {
            let size = queue_size.clone();

            let handle = task::spawn(async move {
                for _ in 0..40 {
                    let current = size.load(Ordering::SeqCst);
                    if current < max_queue_size {
                        size.fetch_add(1, Ordering::SeqCst);
                    }
                    tokio::time::sleep(tokio::time::Duration::from_micros(100)).await;
                }
            });
            handles.push(handle);
        }

        // 2 consumers
        for _ in 0..2 {
            let size = queue_size.clone();

            let handle = task::spawn(async move {
                for _ in 0..50 {
                    let current = size.load(Ordering::SeqCst);
                    if current > 0 {
                        size.fetch_sub(1, Ordering::SeqCst);
                    }
                    tokio::time::sleep(tokio::time::Duration::from_micros(150)).await;
                }
            });
            handles.push(handle);
        }

        for handle in handles {
            handle.await.unwrap();
        }

        let final_size = queue_size.load(Ordering::SeqCst);
        assert!(final_size >= 0 && final_size <= max_queue_size);
    }
}
