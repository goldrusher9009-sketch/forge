use std::time::Duration;
use tracing::{error, warn, info};
use super::routing_table::ModelConfig;

/// Result of a fallback attempt
#[derive(Debug, Clone)]
pub struct FallbackAttempt {
    pub model_index: usize,
    pub provider: String,
    pub model: String,
    pub success: bool,
    pub error: Option<String>,
    pub duration_ms: u128,
}

/// Fallback cascade handler that retries with alternative models on failure
pub struct FallbackHandler {
    models: Vec<ModelConfig>,
    correlation_id: String,
}

impl FallbackHandler {
    /// Create a new fallback handler with a chain of models to try in order
    pub fn new(models: Vec<ModelConfig>, correlation_id: String) -> Self {
        Self {
            models,
            correlation_id,
        }
    }

    /// Get the next model in the fallback chain
    pub fn get_next_model(&self, current_index: usize) -> Option<&ModelConfig> {
        self.models.get(current_index + 1)
    }

    /// Check if there are more fallback options available
    pub fn has_fallback(&self, current_index: usize) -> bool {
        current_index + 1 < self.models.len()
    }

    /// Get the total number of models in the chain
    pub fn chain_length(&self) -> usize {
        self.models.len()
    }

    /// Log a fallback attempt with structured information
    pub fn log_fallback_attempt(&self, attempt: &FallbackAttempt) {
        if attempt.success {
            info!(
                correlation_id = %self.correlation_id,
                model_index = attempt.model_index,
                provider = %attempt.provider,
                model = %attempt.model,
                duration_ms = attempt.duration_ms,
                "Fallback attempt succeeded"
            );
        } else {
            warn!(
                correlation_id = %self.correlation_id,
                model_index = attempt.model_index,
                provider = %attempt.provider,
                model = %attempt.model,
                error = ?attempt.error,
                duration_ms = attempt.duration_ms,
                "Fallback attempt failed, trying next in chain"
            );
        }
    }

    /// Log that fallback chain exhausted
    pub fn log_chain_exhausted(&self) {
        error!(
            correlation_id = %self.correlation_id,
            total_models = self.models.len(),
            "All models in fallback chain exhausted"
        );
    }

    /// Determine if an error is retryable
    pub fn is_retryable_error(error: &str) -> bool {
        let error_lower = error.to_lowercase();
        // Retryable: rate limits, timeouts, temporary service issues
        error_lower.contains("rate limit")
            || error_lower.contains("timeout")
            || error_lower.contains("temporarily unavailable")
            || error_lower.contains("503")
            || error_lower.contains("429")
            || error_lower.contains("connection refused")
            || error_lower.contains("deadline exceeded")
    }

    /// Determine if an error is NOT retryable (permanent failures)
    pub fn is_permanent_error(error: &str) -> bool {
        let error_lower = error.to_lowercase();
        // Permanent: auth failures, invalid requests, unsupported models
        error_lower.contains("unauthorized")
        || error_lower.contains("forbidden")
        || error_lower.contains("invalid request")
        || error_lower.contains("model not found")
        || error_lower.contains("400")
        || error_lower.contains("401")
        || error_lower.contains("403")
        || error_lower.contains("404")
    }

    /// Calculate backoff delay for retry attempt (exponential backoff with jitter)
    pub fn calculate_backoff(&self, attempt_number: usize) -> Duration {
        // Base backoff: 100ms * 2^attempt_number (100ms, 200ms, 400ms, ...)
        let base_ms = 100u64 * 2_u64.pow(attempt_number as u32);
        // Cap at 5 seconds
        let capped_ms = base_ms.min(5000);
        // Add jitter: ±25%
        let jitter_ms = (capped_ms as f64 * 0.25 * rand::random::<f64>()) as u64;
        let final_ms = if rand::random::<bool>() {
            capped_ms + jitter_ms
        } else {
            capped_ms.saturating_sub(jitter_ms)
        };
        Duration::from_millis(final_ms)
    }
}

/// Helper for tracking fallback statistics
pub struct FallbackStats {
    pub total_attempts: usize,
    pub successful_attempts: usize,
    pub failed_attempts: usize,
    pub chain_exhausted_count: usize,
}

impl FallbackStats {
    pub fn new() -> Self {
        Self {
            total_attempts: 0,
            successful_attempts: 0,
            failed_attempts: 0,
            chain_exhausted_count: 0,
        }
    }

    pub fn record_attempt(&mut self, success: bool) {
        self.total_attempts += 1;
        if success {
            self.successful_attempts += 1;
        } else {
            self.failed_attempts += 1;
        }
    }

    pub fn record_chain_exhausted(&mut self) {
        self.chain_exhausted_count += 1;
    }

    pub fn success_rate(&self) -> f32 {
        if self.total_attempts == 0 {
            0.0
        } else {
            self.successful_attempts as f32 / self.total_attempts as f32
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fallback_handler_creation() {
        let models = vec![
            ModelConfig {
                provider: "anthropic".to_string(),
                model: "claude-opus".to_string(),
                max_tokens: None,
                temperature: None,
                cost_per_1k_input: 0.015,
                cost_per_1k_output: 0.075,
            },
            ModelConfig {
                provider: "ollama".to_string(),
                model: "llama2".to_string(),
                max_tokens: None,
                temperature: None,
                cost_per_1k_input: 0.0,
                cost_per_1k_output: 0.0,
            },
        ];

        let handler = FallbackHandler::new(models, "test-123".to_string());
        assert_eq!(handler.chain_length(), 2);
        assert!(handler.has_fallback(0));
        assert!(!handler.has_fallback(1));
    }

    #[test]
    fn test_error_classification() {
        // Retryable errors
        assert!(FallbackHandler::is_retryable_error("Rate limit exceeded"));
        assert!(FallbackHandler::is_retryable_error("Request timeout"));
        assert!(FallbackHandler::is_retryable_error("Service temporarily unavailable"));
        assert!(FallbackHandler::is_retryable_error("503 Service Unavailable"));
        assert!(FallbackHandler::is_retryable_error("429 Too Many Requests"));

        // Permanent errors
        assert!(FallbackHandler::is_permanent_error("Unauthorized"));
        assert!(FallbackHandler::is_permanent_error("Invalid request"));
        assert!(FallbackHandler::is_permanent_error("Model not found"));
        assert!(FallbackHandler::is_permanent_error("401 Unauthorized"));

        // Non-matching
        assert!(!FallbackHandler::is_retryable_error("Invalid request"));
        assert!(!FallbackHandler::is_permanent_error("Request timeout"));
    }

    #[test]
    fn test_fallback_stats() {
        let mut stats = FallbackStats::new();

        stats.record_attempt(true);
        stats.record_attempt(true);
        stats.record_attempt(false);

        assert_eq!(stats.total_attempts, 3);
        assert_eq!(stats.successful_attempts, 2);
        assert_eq!(stats.failed_attempts, 1);
        assert_eq!(stats.success_rate(), 2.0 / 3.0);
    }

    #[test]
    fn test_backoff_calculation() {
        let models = vec![];
        let handler = FallbackHandler::new(models, "test".to_string());

        // First attempt: 100ms ± 25%
        let backoff_0 = handler.calculate_backoff(0);
        assert!(backoff_0.as_millis() <= 125);

        // Second attempt: 200ms ± 25%
        let backoff_1 = handler.calculate_backoff(1);
        assert!(backoff_1.as_millis() >= 150 && backoff_1.as_millis() <= 250);

        // Cap at 5 seconds
        let backoff_large = handler.calculate_backoff(10);
        assert!(backoff_large.as_millis() <= 5000);
    }
}
