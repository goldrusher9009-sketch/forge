use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::sync::Mutex;
use tracing::{info, warn};
use uuid::Uuid;

/// Routing decision record for observability and data flywheel
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutingDecision {
    pub id: String,
    pub correlation_id: String,
    pub timestamp: String,
    pub prompt: String,
    pub prompt_length: usize,
    pub complexity_tier: String,
    pub complexity_score: f32,
    pub selected_provider: String,
    pub selected_model: String,
    pub model_index_in_chain: usize,
    pub was_fallback: bool,
    pub latency_ms: u128,
    pub cost_estimate: f32,
    pub actual_cost: Option<f32>,
    pub success: bool,
    pub error_message: Option<String>,
    pub output_length: Option<usize>,
}

impl RoutingDecision {
    /// Create a new routing decision record
    pub fn new(
        correlation_id: String,
        prompt: String,
        complexity_tier: String,
        complexity_score: f32,
        selected_provider: String,
        selected_model: String,
        model_index_in_chain: usize,
        latency_ms: u128,
        cost_estimate: f32,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            correlation_id,
            timestamp: chrono::Utc::now().to_rfc3339(),
            prompt: prompt.clone(),
            prompt_length: prompt.len(),
            complexity_tier,
            complexity_score,
            selected_provider,
            selected_model,
            model_index_in_chain,
            was_fallback: model_index_in_chain > 0,
            latency_ms,
            cost_estimate,
            actual_cost: None,
            success: true,
            error_message: None,
            output_length: None,
        }
    }

    /// Mark as failed with error message
    pub fn with_error(mut self, error: String) -> Self {
        self.success = false;
        self.error_message = Some(error);
        self
    }

    /// Record actual output and cost
    pub fn with_output(mut self, output_length: usize, actual_cost: f32) -> Self {
        self.output_length = Some(output_length);
        self.actual_cost = Some(actual_cost);
        self
    }
}

/// Observability collector for routing metrics and data flywheel
pub struct RoutingObservability {
    decisions: Arc<Mutex<Vec<RoutingDecision>>>,
    max_decisions: usize,
}

impl RoutingObservability {
    /// Create a new observability collector
    pub fn new(max_decisions: usize) -> Self {
        Self {
            decisions: Arc::new(Mutex::new(Vec::new())),
            max_decisions,
        }
    }

    /// Record a routing decision
    pub fn record_decision(&self, decision: RoutingDecision) {
        let decision_copy = decision.clone();

        // Log to stdout/OpenTelemetry
        if decision.success {
            info!(
                correlation_id = %decision.correlation_id,
                tier = %decision.complexity_tier,
                score = decision.complexity_score,
                provider = %decision.selected_provider,
                model = %decision.selected_model,
                fallback = decision.was_fallback,
                latency_ms = decision.latency_ms,
                cost = decision.cost_estimate,
                actual_cost = ?decision.actual_cost,
                output_tokens = ?decision.output_length,
                "Routing decision recorded (success)"
            );
        } else {
            warn!(
                correlation_id = %decision.correlation_id,
                tier = %decision.complexity_tier,
                score = decision.complexity_score,
                provider = %decision.selected_provider,
                model = %decision.selected_model,
                fallback = decision.was_fallback,
                latency_ms = decision.latency_ms,
                error = ?decision.error_message,
                "Routing decision recorded (failure)"
            );
        }

        // Store in memory (builds the data flywheel)
        if let Ok(mut decisions) = self.decisions.lock() {
            decisions.push(decision_copy);

            // Keep rolling window to prevent unbounded growth
            if decisions.len() > self.max_decisions {
                let drain_count = decisions.len() - self.max_decisions;
                decisions.drain(0..drain_count);
            }
        }
    }

    /// Get all recorded decisions
    pub fn get_all_decisions(&self) -> Vec<RoutingDecision> {
        if let Ok(decisions) = self.decisions.lock() {
            decisions.clone()
        } else {
            Vec::new()
        }
    }

    /// Get statistics about routing decisions
    pub fn get_statistics(&self) -> RoutingStatistics {
        if let Ok(decisions) = self.decisions.lock() {
            RoutingStatistics::from_decisions(&decisions)
        } else {
            RoutingStatistics::default()
        }
    }

    /// Get statistics filtered by complexity tier
    pub fn get_statistics_by_tier(&self, tier: &str) -> RoutingStatistics {
        if let Ok(decisions) = self.decisions.lock() {
            let filtered: Vec<_> = decisions
                .iter()
                .filter(|d| d.complexity_tier == tier)
                .cloned()
                .collect();
            RoutingStatistics::from_decisions(&filtered)
        } else {
            RoutingStatistics::default()
        }
    }

    /// Get most common model selections
    pub fn get_top_models(&self, limit: usize) -> Vec<(String, usize)> {
        if let Ok(decisions) = self.decisions.lock() {
            let mut model_counts: HashMap<String, usize> = HashMap::new();

            for decision in decisions.iter() {
                let model_key = format!("{}:{}", decision.selected_provider, decision.selected_model);
                *model_counts.entry(model_key).or_insert(0) += 1;
            }

            let mut sorted: Vec<_> = model_counts.into_iter().collect();
            sorted.sort_by(|a, b| b.1.cmp(&a.1));
            sorted.into_iter().take(limit).collect()
        } else {
            Vec::new()
        }
    }

    /// Calculate cost per routing decision
    pub fn get_average_cost(&self) -> f32 {
        if let Ok(decisions) = self.decisions.lock() {
            if decisions.is_empty() {
                return 0.0;
            }

            let total_cost: f32 = decisions.iter().map(|d| d.cost_estimate).sum();
            total_cost / decisions.len() as f32
        } else {
            0.0
        }
    }

    /// Export decisions as JSON for analysis
    pub fn export_json(&self) -> Result<String, serde_json::Error> {
        let decisions = self.get_all_decisions();
        serde_json::to_string_pretty(&decisions)
    }
}

/// Statistics computed from routing decisions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutingStatistics {
    pub total_decisions: usize,
    pub successful_decisions: usize,
    pub failed_decisions: usize,
    pub fallback_used_count: usize,
    pub success_rate: f32,
    pub average_latency_ms: f32,
    pub average_cost: f32,
    pub total_cost: f32,
}

impl RoutingStatistics {
    /// Compute statistics from decisions
    pub fn from_decisions(decisions: &[RoutingDecision]) -> Self {
        if decisions.is_empty() {
            return Self::default();
        }

        let successful = decisions.iter().filter(|d| d.success).count();
        let failed = decisions.len() - successful;
        let fallback_used = decisions.iter().filter(|d| d.was_fallback).count();

        let total_latency: u128 = decisions.iter().map(|d| d.latency_ms).sum();
        let average_latency = total_latency as f32 / decisions.len() as f32;

        let total_cost: f32 = decisions.iter().map(|d| d.cost_estimate).sum();
        let average_cost = total_cost / decisions.len() as f32;

        Self {
            total_decisions: decisions.len(),
            successful_decisions: successful,
            failed_decisions: failed,
            fallback_used_count: fallback_used,
            success_rate: successful as f32 / decisions.len() as f32,
            average_latency_ms: average_latency,
            average_cost,
            total_cost,
        }
    }
}

impl Default for RoutingStatistics {
    fn default() -> Self {
        Self {
            total_decisions: 0,
            successful_decisions: 0,
            failed_decisions: 0,
            fallback_used_count: 0,
            success_rate: 0.0,
            average_latency_ms: 0.0,
            average_cost: 0.0,
            total_cost: 0.0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_routing_decision_creation() {
        let decision = RoutingDecision::new(
            "corr-123".to_string(),
            "refactor architecture".to_string(),
            "Complex".to_string(),
            0.9,
            "anthropic".to_string(),
            "claude-opus".to_string(),
            0,
            150,
            0.05,
        );

        assert_eq!(decision.complexity_tier, "Complex");
        assert_eq!(decision.complexity_score, 0.9);
        assert!(!decision.was_fallback);
        assert!(decision.success);
    }

    #[test]
    fn test_routing_statistics() {
        let decisions = vec![
            RoutingDecision::new(
                "1".to_string(),
                "prompt1".to_string(),
                "Simple".to_string(),
                0.5,
                "ollama".to_string(),
                "llama2".to_string(),
                0,
                100,
                0.001,
            ),
            RoutingDecision::new(
                "2".to_string(),
                "prompt2".to_string(),
                "Complex".to_string(),
                0.95,
                "anthropic".to_string(),
                "claude-opus".to_string(),
                1,
                200,
                0.05,
            ),
        ];

        let stats = RoutingStatistics::from_decisions(&decisions);

        assert_eq!(stats.total_decisions, 2);
        assert_eq!(stats.successful_decisions, 2);
        assert_eq!(stats.failed_decisions, 0);
        assert_eq!(stats.fallback_used_count, 1);
        assert_eq!(stats.success_rate, 1.0);
        assert!(stats.average_latency_ms > 100.0 && stats.average_latency_ms < 200.0);
    }

    #[test]
    fn test_observability_collector() {
        let collector = RoutingObservability::new(100);

        let decision = RoutingDecision::new(
            "corr-123".to_string(),
            "test prompt".to_string(),
            "Moderate".to_string(),
            0.7,
            "anthropic".to_string(),
            "claude-sonnet".to_string(),
            0,
            120,
            0.02,
        );

        collector.record_decision(decision.clone());

        let all = collector.get_all_decisions();
        assert_eq!(all.len(), 1);
        assert_eq!(all[0].correlation_id, "corr-123");
    }

    #[test]
    fn test_top_models() {
        let collector = RoutingObservability::new(100);

        collector.record_decision(RoutingDecision::new(
            "1".to_string(),
            "p1".to_string(),
            "Simple".to_string(),
            0.5,
            "anthropic".to_string(),
            "claude-sonnet".to_string(),
            0,
            100,
            0.01,
        ));
        collector.record_decision(RoutingDecision::new(
            "2".to_string(),
            "p2".to_string(),
            "Simple".to_string(),
            0.5,
            "anthropic".to_string(),
            "claude-sonnet".to_string(),
            0,
            100,
            0.01,
        ));
        collector.record_decision(RoutingDecision::new(
            "3".to_string(),
            "p3".to_string(),
            "Complex".to_string(),
            0.9,
            "anthropic".to_string(),
            "claude-opus".to_string(),
            0,
            200,
            0.05,
        ));

        let top = collector.get_top_models(2);
        assert_eq!(top.len(), 2);
        assert_eq!(top[0].1, 2); // claude-sonnet used twice
    }
}
