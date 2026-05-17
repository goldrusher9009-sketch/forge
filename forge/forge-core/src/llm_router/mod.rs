//! Smart routing module for intelligent model selection and failover
//!
//! The router is the core intelligence layer of Forge, implementing:
//! - Complexity classification (heuristic + token-based scoring)
//! - Configuration-driven routing tables (TOML-based tier-to-model mappings)
//! - Smart decorator pattern for transparent routing integration
//! - Fallback cascade with intelligent error classification
//! - Observability and data flywheel for continuous improvement

pub mod classifier;
pub mod routing_table;
pub mod fallback;
pub mod decorator;
pub mod observability;

// Re-export public types for convenience
pub use classifier::{ComplexityClassifier, ComplexityTier};
pub use routing_table::{ModelConfig, RoutingTable, TierConfig};
pub use fallback::{FallbackAttempt, FallbackHandler, FallbackStats};
pub use decorator::{RoutedResponse, RoutingMetadata, SmartRoutingDecorator};
pub use observability::{RoutingDecision, RoutingObservability, RoutingStatistics};

/// Initialize a complete smart routing system
///
/// Returns a SmartRoutingDecorator that can classify prompts and route them
/// to appropriate models with fallback chain support.
///
/// # Example
/// ```ignore
/// let router = build_router();
/// let response = router.route_request("refactor the system", 2000).await?;
/// println!("{}", response.content);
/// ```
pub fn build_router() -> SmartRoutingDecorator {
    let classifier = ComplexityClassifier::new();
    let routing_table = RoutingTable::default();
    SmartRoutingDecorator::new(classifier, routing_table)
}

/// Initialize a smart routing system with a custom routing table
///
/// Allows loading routing configuration from a TOML file instead of using
/// default tier-to-model mappings.
///
/// # Arguments
/// * `routing_table` - Custom RoutingTable with tier configurations
///
/// # Example
/// ```ignore
/// let table = RoutingTable::from_file("routing.toml")?;
/// let router = build_router_with_config(table);
/// ```
pub fn build_router_with_config(routing_table: RoutingTable) -> SmartRoutingDecorator {
    let classifier = ComplexityClassifier::new();
    SmartRoutingDecorator::new(classifier, routing_table)
}

#[cfg(test)]
mod integration_tests {
    use super::*;

    #[test]
    fn test_router_initialization() {
        let router = build_router();
        // Verify router was created successfully
        let (tier, conf, _model) = router.classify_and_route("refactor architecture");
        assert_eq!(tier, ComplexityTier::Complex);
        assert!(conf > 0.5);
    }

    #[test]
    fn test_router_with_custom_config() {
        let toml_str = r#"
[trivial]
primary = { provider = "ollama", model = "tinyllama", max_tokens = 256, temperature = 0.3, cost_per_1k_input = 0.0, cost_per_1k_output = 0.0 }
fallback = []
timeout_seconds = 10

[simple]
primary = { provider = "ollama", model = "llama2", max_tokens = 1024, temperature = 0.5, cost_per_1k_input = 0.0, cost_per_1k_output = 0.0 }
fallback = []
timeout_seconds = 20

[moderate]
primary = { provider = "openrouter", model = "meta-llama/llama-3.3-70b", max_tokens = 2048, temperature = 0.6, cost_per_1k_input = 0.0007, cost_per_1k_output = 0.0009 }
fallback = []
timeout_seconds = 30

[complex]
primary = { provider = "anthropic", model = "claude-opus", max_tokens = 4096, temperature = 0.7, cost_per_1k_input = 0.015, cost_per_1k_output = 0.075 }
fallback = []
timeout_seconds = 60
"#;

        let table = RoutingTable::from_str(toml_str).expect("Failed to parse TOML");
        let router = build_router_with_config(table);

        let (tier, _conf, model) = router.classify_and_route("fix a simple typo");
        assert_eq!(tier, ComplexityTier::Simple);
        assert_eq!(model.provider, "ollama");
    }
}
