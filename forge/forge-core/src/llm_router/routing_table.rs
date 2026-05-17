use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use super::classifier::ComplexityTier;

/// Model provider configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelConfig {
    pub provider: String,
    pub model: String,
    pub max_tokens: Option<usize>,
    pub temperature: Option<f32>,
    pub cost_per_1k_input: f32,
    pub cost_per_1k_output: f32,
}

/// Fallback chain for a complexity tier
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TierConfig {
    pub primary: ModelConfig,
    pub fallback: Vec<ModelConfig>,
    pub timeout_seconds: u64,
}

/// Routing table loaded from TOML configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutingTable {
    pub trivial: TierConfig,
    pub simple: TierConfig,
    pub moderate: TierConfig,
    pub complex: TierConfig,
}

impl RoutingTable {
    /// Load routing table from TOML file
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self, Box<dyn std::error::Error>> {
        let content = fs::read_to_string(path)?;
        let config: RoutingTable = toml::from_str(&content)?;
        Ok(config)
    }

    /// Load routing table from TOML string (useful for testing)
    pub fn from_str(content: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let config: RoutingTable = toml::from_str(content)?;
        Ok(config)
    }

    /// Get the tier configuration for a complexity level
    pub fn get_tier(&self, tier: ComplexityTier) -> &TierConfig {
        match tier {
            ComplexityTier::Trivial => &self.trivial,
            ComplexityTier::Simple => &self.simple,
            ComplexityTier::Moderate => &self.moderate,
            ComplexityTier::Complex => &self.complex,
        }
    }

    /// Get the primary model for a complexity tier
    pub fn get_primary_model(&self, tier: ComplexityTier) -> &ModelConfig {
        &self.get_tier(tier).primary
    }

    /// Get all models (primary + fallbacks) for a complexity tier in order
    pub fn get_model_chain(&self, tier: ComplexityTier) -> Vec<&ModelConfig> {
        let tier_config = self.get_tier(tier);
        let mut chain = vec![&tier_config.primary];
        chain.extend(&tier_config.fallback);
        chain
    }

    /// Create a default routing table (for development/testing)
    pub fn default() -> Self {
        Self {
            trivial: TierConfig {
                primary: ModelConfig {
                    provider: "ollama".to_string(),
                    model: "llama2".to_string(),
                    max_tokens: Some(500),
                    temperature: Some(0.3),
                    cost_per_1k_input: 0.0,
                    cost_per_1k_output: 0.0,
                },
                fallback: vec![],
                timeout_seconds: 10,
            },
            simple: TierConfig {
                primary: ModelConfig {
                    provider: "openrouter".to_string(),
                    model: "meta-llama/llama-3.3-70b-instruct".to_string(),
                    max_tokens: Some(1024),
                    temperature: Some(0.5),
                    cost_per_1k_input: 0.0007,
                    cost_per_1k_output: 0.0009,
                },
                fallback: vec![
                    ModelConfig {
                        provider: "ollama".to_string(),
                        model: "llama2".to_string(),
                        max_tokens: Some(1024),
                        temperature: Some(0.5),
                        cost_per_1k_input: 0.0,
                        cost_per_1k_output: 0.0,
                    },
                ],
                timeout_seconds: 20,
            },
            moderate: TierConfig {
                primary: ModelConfig {
                    provider: "anthropic".to_string(),
                    model: "claude-3-sonnet-4.6".to_string(),
                    max_tokens: Some(2048),
                    temperature: Some(0.6),
                    cost_per_1k_input: 0.003,
                    cost_per_1k_output: 0.015,
                },
                fallback: vec![
                    ModelConfig {
                        provider: "openrouter".to_string(),
                        model: "meta-llama/llama-3.3-70b-instruct".to_string(),
                        max_tokens: Some(2048),
                        temperature: Some(0.6),
                        cost_per_1k_input: 0.0007,
                        cost_per_1k_output: 0.0009,
                    },
                ],
                timeout_seconds: 30,
            },
            complex: TierConfig {
                primary: ModelConfig {
                    provider: "anthropic".to_string(),
                    model: "claude-opus-4.6".to_string(),
                    max_tokens: Some(4096),
                    temperature: Some(0.7),
                    cost_per_1k_input: 0.015,
                    cost_per_1k_output: 0.075,
                },
                fallback: vec![
                    ModelConfig {
                        provider: "anthropic".to_string(),
                        model: "claude-3-sonnet-4.6".to_string(),
                        max_tokens: Some(4096),
                        temperature: Some(0.7),
                        cost_per_1k_input: 0.003,
                        cost_per_1k_output: 0.015,
                    },
                ],
                timeout_seconds: 60,
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_routing_table() {
        let table = RoutingTable::default();

        assert_eq!(table.trivial.primary.model, "llama2");
        assert_eq!(table.simple.primary.provider, "openrouter");
        assert_eq!(table.moderate.primary.provider, "anthropic");
        assert_eq!(table.complex.primary.model, "claude-opus-4.6");
    }

    #[test]
    fn test_get_tier() {
        let table = RoutingTable::default();

        let trivial = table.get_tier(ComplexityTier::Trivial);
        assert_eq!(trivial.primary.model, "llama2");

        let complex = table.get_tier(ComplexityTier::Complex);
        assert_eq!(complex.primary.model, "claude-opus-4.6");
    }

    #[test]
    fn test_get_model_chain() {
        let table = RoutingTable::default();

        let chain = table.get_model_chain(ComplexityTier::Simple);
        assert_eq!(chain.len(), 2); // primary + 1 fallback
        assert_eq!(chain[0].model, "llama-3.3-70b-instruct");
        assert_eq!(chain[1].model, "llama2");
    }

    #[test]
    fn test_from_toml_string() {
        let toml_str = r#"
[trivial]
primary = { provider = "ollama", model = "tinyllama", max_tokens = 256, temperature = 0.3, cost_per_1k_input = 0.0, cost_per_1k_output = 0.0 }
fallback = []
timeout_seconds = 10

[simple]
primary = { provider = "openrouter", model = "meta-llama/llama-3.3-70b", max_tokens = 1024, temperature = 0.5, cost_per_1k_input = 0.0007, cost_per_1k_output = 0.0009 }
fallback = []
timeout_seconds = 20

[moderate]
primary = { provider = "anthropic", model = "claude-3-sonnet", max_tokens = 2048, temperature = 0.6, cost_per_1k_input = 0.003, cost_per_1k_output = 0.015 }
fallback = []
timeout_seconds = 30

[complex]
primary = { provider = "anthropic", model = "claude-opus", max_tokens = 4096, temperature = 0.7, cost_per_1k_input = 0.015, cost_per_1k_output = 0.075 }
fallback = []
timeout_seconds = 60
"#;

        let table = RoutingTable::from_str(toml_str).expect("Failed to parse TOML");
        assert_eq!(table.complex.primary.model, "claude-opus");
    }
}
