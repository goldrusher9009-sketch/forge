/// Integration tests for the agent tool management system
/// Tests the complete flow from tool registration through execution planning
/// and result retrieval via the coordinator.

#[cfg(test)]
mod agent_tool_integration_tests {
    use forge_core::agents::{
        register_builtin_tools, ToolRegistry, AgentCoordinator, ExecutionPlan, ToolCall,
    };
    use serde_json::json;
    use std::sync::Arc;

    /// Test: Register all built-in tools and verify they're available
    #[test]
    fn test_builtin_tools_registration_and_availability() {
        let registry = Arc::new(ToolRegistry::new());
        assert!(register_builtin_tools(&registry).is_ok());

        // Verify all 5 built-in tools are registered and available
        assert_eq!(registry.tool_count(), 5);

        let available = registry.get_available_tools();
        assert_eq!(available.len(), 5);

        // Verify specific tools exist
        assert!(registry.tool_exists("echo"));
        assert!(registry.tool_exists("json-validator"));
        assert!(registry.tool_exists("string-transform"));
        assert!(registry.tool_exists("math-calculator"));
        assert!(registry.tool_exists("delay-simulator"));
    }

    /// Test: Tool filtering by category
    #[test]
    fn test_tool_filtering_by_category() {
        let registry = Arc::new(ToolRegistry::new());
        register_builtin_tools(&registry).unwrap();

        // Verify category filtering
        let utility = registry.list_tools_by_category("utility");
        assert_eq!(utility.len(), 1);
        assert_eq!(utility[0].id, "echo");

        let validation = registry.list_tools_by_category("validation");
        assert_eq!(validation.len(), 1);
        assert_eq!(validation[0].id, "json-validator");

        let text = registry.list_tools_by_category("text");
        assert_eq!(text.len(), 1);
        assert_eq!(text[0].id, "string-transform");

        let calculation = registry.list_tools_by_category("calculation");
        assert_eq!(calculation.len(), 1);
        assert_eq!(calculation[0].id, "math-calculator");

        let testing = registry.list_tools_by_category("testing");
        assert_eq!(testing.len(), 1);
        assert_eq!(testing[0].id, "delay-simulator");
    }

    /// Test: Tool filtering by tags
    #[test]
    fn test_tool_filtering_by_tags() {
        let registry = Arc::new(ToolRegistry::new());
        register_builtin_tools(&registry).unwrap();

        // Verify tag filtering
        let echo_tools = registry.list_tools_by_tag("echo");
        assert_eq!(echo_tools.len(), 1);
        assert_eq!(echo_tools[0].id, "echo");

        let test_tools = registry.list_tools_by_tag("test");
        assert_eq!(test_tools.len(), 1);
        assert_eq!(test_tools[0].id, "echo");

        let json_tools = registry.list_tools_by_tag("json");
        assert_eq!(json_tools.len(), 1);
        assert_eq!(json_tools[0].id, "json-validator");

        let math_tools = registry.list_tools_by_tag("math");
        assert_eq!(math_tools.len(), 1);
        assert_eq!(math_tools[0].id, "math-calculator");
    }

    /// Test: Single tool execution via coordinator
    #[tokio::test]
    async fn test_single_tool_execution() {
        let registry = Arc::new(ToolRegistry::new());
        register_builtin_tools(&registry).unwrap();
        let coordinator = AgentCoordinator::new(registry.clone());

        let plan = ExecutionPlan {
            task_id: "single-echo-test".to_string(),
            tools: vec![ToolCall {
                tool_id: "echo".to_string(),
                input: json!({"message": "test message"}),
                dependencies: vec![],
                priority: 0,
            }],
            metadata: json!({}),
        };

        let result = coordinator.execute_plan(plan).await;
        assert!(result.is_ok());

        let coordinated = result.unwrap();
        assert!(coordinated.success);
        assert_eq!(coordinated.results.len(), 1);
        assert_eq!(coordinated.execution_order.len(), 1);
        assert_eq!(coordinated.execution_order[0], "echo");
        assert_eq!(coordinated.errors.len(), 0);
    }

    /// Test: Multiple sequential tool execution with dependencies
    #[tokio::test]
    async fn test_sequential_tool_execution_with_dependencies() {
        let registry = Arc::new(ToolRegistry::new());
        register_builtin_tools(&registry).unwrap();
        let coordinator = AgentCoordinator::new(registry.clone());

        // Create a plan that validates JSON, then transforms it
        let plan = ExecutionPlan {
            task_id: "sequential-test".to_string(),
            tools: vec![
                ToolCall {
                    tool_id: "json-validator".to_string(),
                    input: json!({"key": "value"}),
                    dependencies: vec![],
                    priority: 0,
                },
                ToolCall {
                    tool_id: "string-transform".to_string(),
                    input: json!({"operation": "uppercase", "text": "hello"}),
                    dependencies: vec![0], // Depends on json-validator
                    priority: 1,
                },
            ],
            metadata: json!({}),
        };

        let result = coordinator.execute_plan(plan).await;
        assert!(result.is_ok());

        let coordinated = result.unwrap();
        assert!(coordinated.success);
        assert_eq!(coordinated.results.len(), 2);
        assert_eq!(coordinated.execution_order.len(), 2);
        assert_eq!(coordinated.execution_order[0], "json-validator");
        assert_eq!(coordinated.execution_order[1], "string-transform");
    }

    /// Test: Tool execution result caching
    #[tokio::test]
    async fn test_execution_result_caching() {
        let registry = Arc::new(ToolRegistry::new());
        register_builtin_tools(&registry).unwrap();
        let coordinator = AgentCoordinator::new(registry.clone());

        let plan = ExecutionPlan {
            task_id: "cache-test".to_string(),
            tools: vec![ToolCall {
                tool_id: "echo".to_string(),
                input: json!({"value": "cached"}),
                dependencies: vec![],
                priority: 0,
            }],
            metadata: json!({}),
        };

        let result = coordinator.execute_plan(plan).await;
        assert!(result.is_ok());

        // Retrieve from cache
        let cached = coordinator.get_cached_result("cache-test");
        assert!(cached.is_some());
        assert_eq!(cached.unwrap().task_id, "cache-test");
    }

    /// Test: Math calculator tool operations
    #[tokio::test]
    async fn test_math_operations() {
        let registry = Arc::new(ToolRegistry::new());
        register_builtin_tools(&registry).unwrap();
        let coordinator = AgentCoordinator::new(registry.clone());

        // Test addition
        let add_plan = ExecutionPlan {
            task_id: "add-test".to_string(),
            tools: vec![ToolCall {
                tool_id: "math-calculator".to_string(),
                input: json!({"operation": "add", "a": 10.0, "b": 5.0}),
                dependencies: vec![],
                priority: 0,
            }],
            metadata: json!({}),
        };

        let result = coordinator.execute_plan(add_plan).await;
        assert!(result.is_ok());
        let coordinated = result.unwrap();
        assert!(coordinated.success);
        assert_eq!(
            coordinated.results[0].data.as_ref().unwrap()["result"],
            15.0
        );

        // Test multiplication
        let mul_plan = ExecutionPlan {
            task_id: "mul-test".to_string(),
            tools: vec![ToolCall {
                tool_id: "math-calculator".to_string(),
                input: json!({"operation": "multiply", "a": 4.0, "b": 3.0}),
                dependencies: vec![],
                priority: 0,
            }],
            metadata: json!({}),
        };

        let result = coordinator.execute_plan(mul_plan).await;
        assert!(result.is_ok());
        let coordinated = result.unwrap();
        assert!(coordinated.success);
        assert_eq!(
            coordinated.results[0].data.as_ref().unwrap()["result"],
            12.0
        );
    }

    /// Test: Tool statistics tracking
    #[tokio::test]
    async fn test_tool_statistics_tracking() {
        let registry = Arc::new(ToolRegistry::new());
        register_builtin_tools(&registry).unwrap();
        let coordinator = AgentCoordinator::new(registry.clone());

        // Execute echo tool multiple times
        for i in 0..3 {
            let plan = ExecutionPlan {
                task_id: format!("stats-test-{}", i),
                tools: vec![ToolCall {
                    tool_id: "echo".to_string(),
                    input: json!({"msg": "test"}),
                    dependencies: vec![],
                    priority: 0,
                }],
                metadata: json!({}),
            };
            coordinator.execute_plan(plan).await.ok();
        }

        // Verify statistics were updated
        let stats = registry.get_stats("echo");
        assert!(stats.is_ok());
        let stats = stats.unwrap();
        assert_eq!(stats.total_executions, 3);
        assert_eq!(stats.successful_executions, 3);
        assert_eq!(stats.failed_executions, 0);
        assert!(stats.success_rate > 0.99);
    }

    /// Test: Registry information retrieval
    #[test]
    fn test_registry_information() {
        let registry = Arc::new(ToolRegistry::new());
        register_builtin_tools(&registry).unwrap();

        // Verify tool count
        assert_eq!(registry.tool_count(), 5);

        // Verify metadata retrieval
        let all_tools = registry.list_tools();
        assert_eq!(all_tools.len(), 5);

        for tool in all_tools {
            assert!(!tool.id.is_empty());
            assert!(!tool.name.is_empty());
            assert!(!tool.category.is_empty());
        }
    }

    /// Test: Parallel plan execution
    #[tokio::test]
    async fn test_parallel_plan_execution() {
        let registry = Arc::new(ToolRegistry::new());
        register_builtin_tools(&registry).unwrap();
        let coordinator = AgentCoordinator::new(registry.clone());

        let plans = vec![
            ExecutionPlan {
                task_id: "parallel-1".to_string(),
                tools: vec![ToolCall {
                    tool_id: "echo".to_string(),
                    input: json!({"id": 1}),
                    dependencies: vec![],
                    priority: 0,
                }],
                metadata: json!({}),
            },
            ExecutionPlan {
                task_id: "parallel-2".to_string(),
                tools: vec![ToolCall {
                    tool_id: "echo".to_string(),
                    input: json!({"id": 2}),
                    dependencies: vec![],
                    priority: 0,
                }],
                metadata: json!({}),
            },
            ExecutionPlan {
                task_id: "parallel-3".to_string(),
                tools: vec![ToolCall {
                    tool_id: "echo".to_string(),
                    input: json!({"id": 3}),
                    dependencies: vec![],
                    priority: 0,
                }],
                metadata: json!({}),
            },
        ];

        let results = coordinator.execute_plans_parallel(plans).await;
        assert_eq!(results.len(), 3);
        assert!(results.iter().all(|r| r.is_ok()));
    }

    /// Test: Cache clearing
    #[tokio::test]
    async fn test_cache_clearing() {
        let registry = Arc::new(ToolRegistry::new());
        register_builtin_tools(&registry).unwrap();
        let coordinator = AgentCoordinator::new(registry.clone());

        // Execute a plan
        let plan = ExecutionPlan {
            task_id: "cache-clear-test".to_string(),
            tools: vec![ToolCall {
                tool_id: "echo".to_string(),
                input: json!({"msg": "test"}),
                dependencies: vec![],
                priority: 0,
            }],
            metadata: json!({}),
        };

        coordinator.execute_plan(plan).await.ok();

        // Verify result is cached
        assert!(coordinator.get_cached_result("cache-clear-test").is_some());

        // Clear cache
        coordinator.clear_cache();

        // Verify cache is empty
        assert!(coordinator.get_cached_result("cache-clear-test").is_none());
    }
}
