// ============================================================================
// TEST FIXTURES
// ============================================================================
// Reusable test data and database setup for integration tests
//
// Usage with #[sqlx::test]:
//   #[sqlx::test(migrations = "./migrations")]
//   async fn test_name(pool: PgPool) {
//       let ctx = TestContext::from_pool(pool);
//       // test code
//   }

use crate::models::*;
use chrono::Utc;
use serde_json::json;
use sqlx::PgPool;

pub struct TestContext {
    pub pool: PgPool,
}

impl TestContext {
    /// Create TestContext from existing pool (used with sqlx::test attribute)
    pub fn from_pool(pool: PgPool) -> Self {
        Self { pool }
    }

    /// For manual setup in integration tests without sqlx::test macro
    pub async fn setup() -> Self {
        let pool = sqlx::postgres::PgPoolOptions::new()
            .max_connections(5)
            .connect("postgres://localhost/forge_test")
            .await
            .expect("Failed to connect to test database");

        Self { pool }
    }

    pub async fn create_test_agent(&self) -> Agent {
        let agent = Agent {
            id: format!("test-agent-{}", uuid::Uuid::new_v4()),
            name: "Test Agent".to_string(),
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
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Insert into database
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
        .execute(&self.pool)
        .await
        .expect("Failed to insert test agent");

        agent
    }

    pub async fn create_test_task(&self, agent_id: &str) -> Task {
        let task = Task {
            id: format!("task-{}", uuid::Uuid::new_v4()),
            agent_id: agent_id.to_string(),
            input: json!({"message": "test"}),
            status: TaskStatus::Queued,
            output: None,
            error: None,
            created_at: Utc::now(),
            started_at: None,
            completed_at: None,
            duration_ms: None,
        };

        sqlx::query(
            r#"
            INSERT INTO tasks (id, agent_id, input, status, created_at)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(&task.id)
        .bind(&task.agent_id)
        .bind(serde_json::to_string(&task.input).unwrap())
        .bind(&task.status.to_string())
        .bind(task.created_at)
        .execute(&self.pool)
        .await
        .expect("Failed to insert test task");

        task
    }

    pub async fn create_test_workflow(&self, agent_id: &str) -> Workflow {
        let workflow = Workflow {
            id: format!("workflow-{}", uuid::Uuid::new_v4()),
            name: "Test Workflow".to_string(),
            description: "Integration test workflow".to_string(),
            steps: vec![
                WorkflowStep {
                    id: "step-1".to_string(),
                    agent_id: agent_id.to_string(),
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

        sqlx::query(
            r#"
            INSERT INTO workflows (id, name, description, steps, enabled, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
        )
        .bind(&workflow.id)
        .bind(&workflow.name)
        .bind(&workflow.description)
        .bind(serde_json::to_string(&workflow.steps).unwrap())
        .bind(workflow.enabled)
        .bind(workflow.created_at)
        .bind(workflow.updated_at)
        .execute(&self.pool)
        .await
        .expect("Failed to insert test workflow");

        workflow
    }

    pub async fn cleanup(&self) {
        // Clean up test data
        sqlx::query("DELETE FROM metrics WHERE agent_id LIKE 'test-%'")
            .execute(&self.pool)
            .await
            .ok();

        sqlx::query("DELETE FROM tasks WHERE agent_id LIKE 'test-%'")
            .execute(&self.pool)
            .await
            .ok();

        sqlx::query("DELETE FROM workflows WHERE id LIKE 'workflow-%'")
            .execute(&self.pool)
            .await
            .ok();

        sqlx::query("DELETE FROM agents WHERE id LIKE 'test-agent-%'")
            .execute(&self.pool)
            .await
            .ok();
    }
}

pub mod builders {
    use super::*;

    pub struct AgentBuilder {
        name: String,
        agent_type: AgentType,
        enabled: bool,
    }

    impl AgentBuilder {
        pub fn new(name: &str) -> Self {
            Self {
                name: name.to_string(),
                agent_type: AgentType::Email,
                enabled: true,
            }
        }

        pub fn with_type(mut self, agent_type: AgentType) -> Self {
            self.agent_type = agent_type;
            self
        }

        pub fn disabled(mut self) -> Self {
            self.enabled = false;
            self
        }

        pub fn build(self) -> Agent {
            Agent {
                id: format!("test-agent-{}", uuid::Uuid::new_v4()),
                name: self.name,
                description: "Test agent".to_string(),
                agent_type: self.agent_type,
                enabled: self.enabled,
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
            }
        }
    }
}
