use std::time::Instant;
use uuid::Uuid;
use tracing::{info, error};
use serde::{Deserialize, Serialize};

use super::classifier::{ComplexityClassifier, ComplexityTier};
use super::routing_table::{RoutingTable, ModelConfig};
use super::fallback::{FallbackHandler, FallbackAttempt};

/// Request metadata with routing information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutingMetadata {
    pub correlation_id: String,
    pub prompt: String,
    pub complexity_tier: ComplexityTier,
    pub complexity_confidence: f32,
    pub selected_model: ModelConfig,
    pub model_index_in_chain: usize,
    pub latency_ms: u128,
    pub cost_estimate: f32,
    pub timestamp: String,
}

/// Response from routing decorator
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutedResponse {
    pub content: String,
    pub metadata: RoutingMetadata,
    pub fallback_used: bool,
    pub fallback_attempts: usize,
}

/// Smart routing decorator that wraps LLM provider calls
pub struct SmartRoutingDecorator {
    classifier: ComplexityClassifier,
    routing_table: RoutingTable,
}

impl SmartRoutingDecorator {
    /// Create a new smart routing decorator
    pub fn new(classifier: ComplexityClassifier, routing_table: RoutingTable) -> Self {
        Self {
            classifier,
            routing_table,
        }
    }

    /// Classify a prompt and select appropriate model
    pub fn classify_and_route(&self, prompt: &str) -> (ComplexityTier, f32, &ModelConfig) {
        let (tier, confidence) = self.classifier.classify(prompt);
        let model = self.routing_table.get_primary_model(tier);

        info!(
            tier = ?tier,
            confidence = confidence,
            provider = %model.provider,
            model = %model.model,
            "Prompt classified and routed"
        );

        (tier, confidence, model)
    }

    /// Estimate cost for routing decision
    pub fn estimate_cost(prompt: &str, model: &ModelConfig, estimated_output_tokens: usize) -> f32 {
        // Rough token estimation: ~4 chars per token
        let input_tokens = (prompt.len() / 4).max(1);

        let input_cost = (input_tokens as f32 / 1000.0) * model.cost_per_1k_input;
        let output_cost = (estimated_output_tokens as f32 / 1000.0) * model.cost_per_1k_output;

        input_cost + output_cost
    }

    /// Generate unique correlation ID for request tracking
    pub fn generate_correlation_id() -> String {
        format!("forge-{}", Uuid::new_v4().to_string())
    }

    /// Execute routing decision with logging
    pub async fn route_request(
        &self,
        prompt: &str,
        expected_output_tokens: usize,
    ) -> Result<RoutedResponse, Box<dyn std::error::Error>> {
        let correlation_id = Self::generate_correlation_id();
        let start = Instant::now();

        // Classify and get routing decision
        let (tier, confidence, model) = self.classify_and_route(prompt);

        // Get fallback chain
        let model_chain = self.routing_table.get_model_chain(tier);
        let fallback_handler = FallbackHandler::new(
            model_chain.iter().map(|m| (*m).clone()).collect(),
            correlation_id.clone(),
        );

        // Estimate cost
        let cost_estimate = Self::estimate_cost(prompt, model, expected_output_tokens);

        // Log routing decision
        let routing_decision = format!(
            "Routing decision: tier={:?}, confidence={:.2}, model={}:{}, cost_estimate=${:.6}",
            tier, confidence, model.provider, model.model, cost_estimate
        );

        info!(
            correlation_id = %correlation_id,
            tier = ?tier,
            confidence = confidence,
            provider = %model.provider,
            model = %model.model,
            cost_estimate = cost_estimate,
            model_chain_length = fallback_handler.chain_length(),
            "{}",
            routing_decision
        );

        // Create metadata
        let metadata = RoutingMetadata {
            correlation_id: correlation_id.clone(),
            prompt: prompt.to_string(),
            complexity_tier: tier,
            complexity_confidence: confidence,
            selected_model: model.clone(),
            model_index_in_chain: 0,
            latency_ms: start.elapsed().as_millis(),
            cost_estimate,
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        // For now, return a mock response
        // In production, this would call the actual LLM provider
        Ok(RoutedResponse {
            content: format!("Mock response from {}", model.model),
            metadata,
            fallback_used: false,
            fallback_attempts: 0,
        })
    }

    /// Execute request with fallback chain on failure
    pub async fn route_with_fallback(
        &self,
        prompt: &str,
        expected_output_tokens: usize,
    ) -> Result<RoutedResponse, Box<dyn std::error::Error>> {
        let correlation_id = Self::generate_correlation_id();
        let start = Instant::now();

        // Classify and get routing decision
        let (tier, confidence, primary_model) = self.classify_and_route(prompt);

        // Get fallback chain
        let model_chain = self.routing_table.get_model_chain(tier);
        let fallback_handler = FallbackHandler::new(
            model_chain.iter().map(|m| (*m).clone()).collect(),
            correlation_id.clone(),
        );

        let cost_estimate = Self::estimate_cost(prompt, primary_model, expected_output_tokens);

        info!(
            correlation_id = %correlation_id,
            tier = ?tier,
            confidence = confidence,
            provider = %primary_model.provider,
            model = %primary_model.model,
            cost_estimate = cost_estimate,
            model_chain_length = fallback_handler.chain_length(),
            "Starting request with fallback chain enabled"
        );

        // Try each model in the chain
        let mut last_error = None;
        let mut fallback_attempts = 0;

        for (index, model) in model_chain.iter().enumerate() {
            let attempt_start = Instant::now();

            // Simulate request (would be actual LLM call in production)
            let result = self.simulate_llm_call(model, prompt).await;

            let duration = attempt_start.elapsed();
            fallback_attempts = index;

            match result {
                Ok(content) => {
                    let attempt = FallbackAttempt {
                        model_index: index,
                        provider: model.provider.clone(),
                        model: model.model.clone(),
                        success: true,
                        error: None,
                        duration_ms: duration.as_millis(),
                    };
                    fallback_handler.log_fallback_attempt(&attempt);

                    let metadata = RoutingMetadata {
                        correlation_id: correlation_id.clone(),
                        prompt: prompt.to_string(),
                        complexity_tier: tier,
                        complexity_confidence: confidence,
                        selected_model: (*model).clone(),
                        model_index_in_chain: index,
                        latency_ms: start.elapsed().as_millis(),
                        cost_estimate,
                        timestamp: chrono::Utc::now().to_rfc3339(),
                    };

                    return Ok(RoutedResponse {
                        content,
                        metadata,
                        fallback_used: index > 0,
                        fallback_attempts,
                    });
                }
                Err(e) => {
                    let error_msg = e.to_string();
                    last_error = Some(error_msg.clone());

                    // Check if error is retryable
                    if !FallbackHandler::is_retryable_error(&error_msg)
                        && FallbackHandler::is_permanent_error(&error_msg)
                    {
                        error!(
                            correlation_id = %correlation_id,
                            model_index = index,
                            provider = %model.provider,
                            error = %error_msg,
                            "Permanent error, not attempting fallback"
                        );
                        return Err(Box::new(std::io::Error::new(
                            std::io::ErrorKind::Other,
                            format!("Permanent error from {}: {}", model.model, error_msg),
                        )));
                    }

                    let attempt = FallbackAttempt {
                        model_index: index,
                        provider: model.provider.clone(),
                        model: model.model.clone(),
                        success: false,
                        error: Some(error_msg),
                        duration_ms: duration.as_millis(),
                    };
                    fallback_handler.log_fallback_attempt(&attempt);

                    // Try next if available
                    if !fallback_handler.has_fallback(index) {
                        fallback_handler.log_chain_exhausted();
                        break;
                    }
                }
            }
        }

        // All models failed
        error!(
            correlation_id = %correlation_id,
            last_error = ?last_error,
            total_attempts = fallback_attempts,
            "All models in fallback chain failed"
        );

        Err(Box::new(std::io::Error::new(
            std::io::ErrorKind::Other,
            format!("All fallback models exhausted. Last error: {:?}", last_error),
        )))
    }

    /// Simulate an LLM API call (for testing/development)
    async fn simulate_llm_call(
        &self,
        model: &ModelConfig,
        _prompt: &str,
    ) -> Result<String, Box<dyn std::error::Error>> {
        // Simulated success for most models, occasional failures
        if model.provider == "ollama" && rand::random::<f32>() < 0.1 {
            Err(Box::new(std::io::Error::new(
                std::io::ErrorKind::TimedOut,
                "Simulated timeout",
            )))
        } else {
            Ok(format!(
                "Response from {}:{} (simulated)",
                model.provider, model.model
            ))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_correlation_id_generation() {
        let id1 = SmartRoutingDecorator::generate_correlation_id();
        let id2 = SmartRoutingDecorator::generate_correlation_id();

        assert!(id1.starts_with("forge-"));
        assert!(id2.starts_with("forge-"));
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_cost_estimation() {
        let model = ModelConfig {
            provider: "anthropic".to_string(),
            model: "claude-opus".to_string(),
            max_tokens: None,
            temperature: None,
            cost_per_1k_input: 0.015,
            cost_per_1k_output: 0.075,
        };

        let prompt = "a".repeat(4000); // ~1000 tokens
        let output_tokens = 1000;

        let cost = SmartRoutingDecorator::estimate_cost(&prompt, &model, output_tokens);

        // Input: 1000 tokens * $0.015/1k = $0.015
        // Output: 1000 tokens * $0.075/1k = $0.075
        // Total: ~$0.09
        assert!(cost > 0.08 && cost < 0.10);
    }

    #[test]
    fn test_classify_and_route() {
        let classifier = ComplexityClassifier::new();
        let routing_table = RoutingTable::default();
        let decorator = SmartRoutingDecorator::new(classifier, routing_table);

        let (tier, confidence, model) = decorator.classify_and_route("refactor the architecture");

        assert_eq!(tier, ComplexityTier::Complex);
        assert!(confidence > 0.5);
        assert_eq!(model.model, "claude-opus-4.6");
    }
}
