# Executor Integration Tests

Comprehensive integration tests for the Forge Core executor handlers covering database persistence, task queuing, memory systems, and metrics aggregation.

## Test Coverage

### Core Queue Operations
- **test_executor_enqueue_dequeue_complete**: Full task lifecycle (enqueue → dequeue → complete)
- **test_executor_failure_handling**: Task failure recording with error messages
- **test_executor_retry_logic**: Retry mechanism with max_retries enforcement
- **test_executor_batch_dequeue_priority_ordering**: Priority-based task ordering in batch dequeue
- **test_executor_duplicate_task_prevention**: Idempotent enqueue (ON CONFLICT DO NOTHING)
- **test_executor_concurrent_dequeue_safety**: Thread-safe concurrent dequeue operations

### Execution History & Metrics
- **test_executor_execution_history_recording**: Execution history recording with full metadata
- **test_executor_tool_metrics_aggregation**: Auto-calculated tool metrics from execution history

### Memory System Tests
- **test_executor_working_memory_management**: Task-scoped working memory with expiration support
- **test_executor_episodic_memory_recall**: High-importance episode storage and recall counting
- **test_executor_semantic_memory_confidence_decay**: Learned knowledge with confidence scoring
- **test_executor_memory_relationships**: Linking between different memory types

## Prerequisites

1. **PostgreSQL Database**: Must be running and accessible
2. **Database Initialization**: Run migrations first
   ```bash
   sqlx database create
   sqlx migrate run
   ```

3. **Environment Variable**: Set DATABASE_URL
   ```bash
   export DATABASE_URL="postgres://user:password@localhost:5432/forge_test"
   ```

## Running Tests

### Run all executor integration tests:
```bash
cargo test --test executor_integration_tests -- --ignored --test-threads=1
```

### Run specific test:
```bash
cargo test --test executor_integration_tests test_executor_enqueue_dequeue_complete -- --ignored --test-threads=1
```

### Run with output:
```bash
cargo test --test executor_integration_tests -- --ignored --test-threads=1 --nocapture
```

## Important Notes

- Tests use `#[ignore]` attribute to prevent accidental execution without database setup
- `--test-threads=1` is required to ensure sequential execution (prevents concurrent database modifications)
- Each test generates unique task IDs to avoid conflicts
- Tests verify both successful paths and error conditions

## What's Tested

### Task Queue Durability
- Tasks survive across application restarts (PostgreSQL persistence)
- Priority ordering in dequeue operations
- Batch dequeue returns highest-priority tasks first
- Queue size calculation

### Retry Logic
- Retry count increments on each retry attempt
- max_retries constraint prevents excessive retries
- Failed task status reset to "queued" for retry
- Error returned when max_retries exceeded

### Execution History
- Full execution metadata recorded (input, output, duration, model used)
- Complexity heuristics calculated for inputs/outputs
- Retry attempt numbers tracked
- History linked to task via execution_id

### Tool Metrics (Database Triggers)
- Success rate calculation (4 success / 5 total = 0.80)
- Execution count aggregation
- Duration statistics (min, max, average)
- Last execution timestamp tracking

### Memory Systems
- **Working Memory**: Task-scoped key-value storage with optional expiration
- **Episodic Memory**: High-importance events with recall counting
- **Semantic Memory**: Learned knowledge with confidence decay
- **Memory Relationships**: Links between different memory types (episodic→semantic)

### Concurrency & Safety
- Concurrent dequeue operations don't duplicate task assignments
- Thread-safe task status transitions
- Proper locking in database layer

## Database Schema Dependencies

Tests expect these tables/features to exist:
- `tasks` table with columns: id, status, agent_id, input, output, error, priority, retry_count, max_retries, created_at, started_at, completed_at, duration_ms
- `execution_history` table for tracking individual tool executions
- `tool_metrics` view auto-updated by triggers
- `working_memory` table for task context
- `episodic_memory` table for important episodes
- `semantic_memory` table for learned knowledge
- `memory_relationships` table for memory linking
- Database triggers that automatically update metrics from execution history

## Troubleshooting

### "DATABASE_URL not set" error
```bash
export DATABASE_URL="postgres://user:password@localhost:5432/forge_test"
```

### "Failed to create DB pool" error
- Verify PostgreSQL is running
- Check DATABASE_URL connection string
- Ensure database exists: `createdb forge_test`

### Tests hang or timeout
- Verify `--test-threads=1` is set
- Check for long-running migrations
- Ensure no locks held by other processes

### "Task should exist" assertion failures
- May indicate ON CONFLICT DO NOTHING behavior changed
- Verify database schema matches expected structure
- Check for cascading deletes affecting test data

## Test Execution Order

All tests are independent and can run in any order, but:
1. Priority tests should run after enqueue tests
2. Metrics tests should run after execution history tests
3. Memory relationship tests assume episodic memory exists

## Future Enhancements

- [ ] Agent coordinator integration tests
- [ ] Tool registry interaction tests
- [ ] Memory decay rate calculations
- [ ] Performance benchmarks for batch operations
- [ ] Stress tests with large task batches
- [ ] Cross-agent coordination tests
