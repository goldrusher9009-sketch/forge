# Integration Testing Guide for Forge Core

## Overview

The `tests/integration_executor_handlers.rs` file contains comprehensive integration tests for the executor handlers module. These tests verify the complete flow of task submission, execution status tracking, workflow orchestration, and queue management with actual database persistence.

## Prerequisites

### Required Software

1. **PostgreSQL 12 or higher**
   - Install from: https://www.postgresql.org/download/
   - On Windows: Use the official installer or Windows Subsystem for Linux (WSL)
   - On macOS: Use `brew install postgresql` or PostgreSQL.app
   - On Linux: Use your distribution's package manager

2. **Rust toolchain** (Already required for the project)
   ```bash
   rustup update
   ```

3. **SQLx CLI** (for offline mode compilation)
   ```bash
   cargo install sqlx-cli --no-default-features --features postgres
   ```

### Database Setup

1. **Create test database**
   ```bash
   # Using psql command line
   psql -U postgres -c "CREATE DATABASE forge_test;"
   
   # Optional: Create dedicated test user
   psql -U postgres -c "CREATE USER forge_test WITH PASSWORD 'test_password';"
   psql -U postgres -c "ALTER DATABASE forge_test OWNER TO forge_test;"
   ```

2. **Set environment variable** for test database
   ```bash
   # On Windows (Command Prompt)
   set TEST_DATABASE_URL=postgres://postgres:postgres@localhost/forge_test
   
   # On Windows (PowerShell)
   $env:TEST_DATABASE_URL="postgres://postgres:postgres@localhost/forge_test"
   
   # On macOS/Linux (Bash/Zsh)
   export TEST_DATABASE_URL="postgres://postgres:postgres@localhost/forge_test"
   
   # Or add to .env.test file:
   # TEST_DATABASE_URL=postgres://postgres:postgres@localhost/forge_test
   ```

3. **Alternative: Docker Setup** (Recommended for isolated environments)
   ```bash
   # Start PostgreSQL in Docker
   docker run --name forge_postgres \
     -e POSTGRES_DB=forge_test \
     -e POSTGRES_PASSWORD=postgres \
     -p 5432:5432 \
     -d postgres:14-alpine
   
   # Set environment variable
   export TEST_DATABASE_URL="postgres://postgres:postgres@localhost/forge_test"
   ```

## Running Integration Tests

### Run all integration tests
```bash
cargo test --test integration_executor_handlers -- --ignored --test-threads=1
```

### Run a specific test
```bash
cargo test --test integration_executor_handlers test_submit_single_task -- --ignored --test-threads=1
```

### Run tests with output
```bash
cargo test --test integration_executor_handlers -- --ignored --test-threads=1 --nocapture
```

### Run tests in parallel (not recommended for database tests)
```bash
cargo test --test integration_executor_handlers -- --ignored
```

## Test Categories

### Task Queue Tests
- `test_submit_single_task` - Single task submission to queue
- `test_submit_batch_tasks` - Batch task submission with multiple tasks
- `test_get_task_status` - Task status retrieval with progress calculation
- `test_cancel_task_queued` - Cancellation of queued tasks
- `test_cancel_task_running` - Cancellation of running tasks
- `test_cancel_task_completed_fails` - Verification that completed tasks cannot be cancelled
- `test_cancel_task_failed_fails` - Verification that failed tasks cannot be cancelled
- `test_get_queue_status` - Queue statistics aggregation (counts by status, average wait time)
- `test_get_task_status_not_found` - Error handling for non-existent tasks
- `test_queue_priority_ordering` - Task ordering by priority in queue

### Workflow Tests
- `test_execute_workflow` - Single workflow execution with first step creation
- `test_execute_workflow_not_found` - Error handling for non-existent workflows
- `test_workflow_step_chaining` - Execution of multi-step workflows with success handlers
- `test_workflow_failure_handler` - Execution of on_failure handlers after step failure
- `test_workflow_input_mapping` - Input mapping between workflow definition and step execution

### Error Handling Tests
- `test_error_invalid_priority` - Handling of out-of-range priority values
- `test_error_missing_agent_id` - Handling of missing required agent_id field
- `test_error_invalid_workflow_steps` - Handling of malformed workflow step definitions
- `test_error_database_connection` - Graceful handling of database connectivity issues

### Data Structure Tests (No database required)
- `test_task_status_enum_parsing` - Deserialization of task status values
- `test_workflow_status_enum_parsing` - Deserialization of workflow status values
- `test_execute_task_request_serialization` - JSON serialization of task requests
- `test_workflow_step_input_mapping_parsing` - Parsing of input mapping configurations

## Test Isolation

Each test:
1. Creates a fresh database pool via `setup_test_db()`
2. Drops existing tables to ensure clean state
3. Runs all migrations fresh
4. Executes test-specific operations
5. Automatically cleans up when the test pool is dropped

**Important**: Tests are run with `--test-threads=1` to ensure database operations don't interfere with each other.

## Troubleshooting

### "Connection refused" error
```
Error: Failed to create test database pool: connection refused
```
**Solution**: Ensure PostgreSQL is running
- Windows: Start PostgreSQL service in Services panel
- macOS: `brew services start postgresql` or use PostgreSQL.app
- Linux: `sudo systemctl start postgresql`
- Docker: `docker start forge_postgres`

### "Database does not exist" error
```
Error: database "forge_test" does not exist
```
**Solution**: Create the test database
```bash
psql -U postgres -c "CREATE DATABASE forge_test;"
```

### "Failed to run migrations" error
```
Error: Failed to run migrations: query file missing
```
**Solution**: Ensure you're in the forge-core directory where migrations/ folder exists
```bash
cd C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-core
```

### Migrations not found
```
Error: Failed to run migrations: no migrations found
```
**Solution**: Verify migration files exist in `./migrations/` directory
```bash
ls migrations/
# Should see files like: 001_create_tasks_table.sql, 002_create_agents_table.sql, etc.
```

### SQLx offline mode errors
```
Error: sqlx::migrate!("./migrations") could not find migrations
```
**Solution**: Either:
1. Set `SQLX_OFFLINE=false` in environment
2. Or run: `cargo sqlx prepare --database-url postgres://postgres:postgres@localhost/forge_test`

## Continuous Integration

For GitHub Actions CI/CD pipeline:

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14-alpine
        env:
          POSTGRES_DB: forge_test
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - name: Run integration tests
        env:
          TEST_DATABASE_URL: postgres://postgres:postgres@localhost/forge_test
        run: cargo test --test integration_executor_handlers -- --ignored --test-threads=1
```

## Test Coverage

Current test file covers:
- ✅ Task submission (single and batch)
- ✅ Task status tracking
- ✅ Task cancellation with state validation
- ✅ Queue statistics aggregation
- ✅ Workflow execution initialization
- ✅ Priority-based ordering
- ✅ Error handling and validation
- ✅ Database persistence verification
- ✅ Enum parsing and serialization

## Next Steps

1. Set up local PostgreSQL instance using instructions above
2. Create test database: `forge_test`
3. Set `TEST_DATABASE_URL` environment variable
4. Run tests: `cargo test --test integration_executor_handlers -- --ignored --test-threads=1`
5. Verify all tests pass
6. Add CI/CD configuration to GitHub Actions for automated test runs
