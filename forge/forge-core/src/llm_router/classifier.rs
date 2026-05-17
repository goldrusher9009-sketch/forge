/// Complexity classifier for routing prompts to appropriate models.
/// Scores incoming prompts as Trivial, Simple, Moderate, or Complex.

use serde::{Deserialize, Serialize};

/// Complexity tier determined by heuristic classification
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Hash)]
#[serde(rename_all = "lowercase")]
pub enum ComplexityTier {
    Trivial,
    Simple,
    Moderate,
    Complex,
}

impl ComplexityTier {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Trivial => "trivial",
            Self::Simple => "simple",
            Self::Moderate => "moderate",
            Self::Complex => "complex",
        }
    }
}

/// Heuristic classifier that scores prompts using token count and keyword detection
pub struct ComplexityClassifier {
    complex_keywords: Vec<String>,
    moderate_keywords: Vec<String>,
    simple_keywords: Vec<String>,
}

impl Default for ComplexityClassifier {
    fn default() -> Self {
        Self::new()
    }
}

impl ComplexityClassifier {
    /// Create a new classifier with default keyword lists
    pub fn new() -> Self {
        Self {
            // Complex task indicators
            complex_keywords: vec![
                "refactor".to_string(),
                "architecture".to_string(),
                "memory leak".to_string(),
                "performance optimization".to_string(),
                "distributed system".to_string(),
                "machine learning".to_string(),
                "neural network".to_string(),
                "concurrent".to_string(),
                "parallel".to_string(),
                "optimization algorithm".to_string(),
                "cryptography".to_string(),
                "security vulnerability".to_string(),
                "multi-threaded".to_string(),
                "async pipeline".to_string(),
            ],
            // Moderate task indicators
            moderate_keywords: vec![
                "debug".to_string(),
                "implement".to_string(),
                "feature".to_string(),
                "module".to_string(),
                "class".to_string(),
                "function".to_string(),
                "testing".to_string(),
                "integration".to_string(),
                "api".to_string(),
                "database".to_string(),
                "schema".to_string(),
                "migration".to_string(),
                "error handling".to_string(),
                "validation".to_string(),
            ],
            // Simple task indicators
            simple_keywords: vec![
                "lint".to_string(),
                "format".to_string(),
                "rename".to_string(),
                "comment".to_string(),
                "docstring".to_string(),
                "typo".to_string(),
                "style".to_string(),
                "fix test".to_string(),
                "update version".to_string(),
                "add import".to_string(),
                "remove unused".to_string(),
            ],
        }
    }

    /// Classify a prompt based on token count and keyword detection
    /// Returns a complexity tier and confidence score (0.0-1.0)
    pub fn classify(&self, prompt: &str) -> (ComplexityTier, f32) {
        let token_estimate = estimate_tokens(prompt);
        let prompt_lower = prompt.to_lowercase();

        // Check for complex keywords
        let complex_matches = self
            .complex_keywords
            .iter()
            .filter(|kw| prompt_lower.contains(kw.as_str()))
            .count();

        // Check for moderate keywords
        let moderate_matches = self
            .moderate_keywords
            .iter()
            .filter(|kw| prompt_lower.contains(kw.as_str()))
            .count();

        // Check for simple keywords
        let simple_matches = self
            .simple_keywords
            .iter()
            .filter(|kw| prompt_lower.contains(kw.as_str()))
            .count();

        // Decision logic based on matches and token count
        let (tier, confidence) = if complex_matches > 0 {
            (ComplexityTier::Complex, 0.9)
        } else if token_estimate > 3000 {
            (ComplexityTier::Complex, 0.7)
        } else if moderate_matches > 2 || (moderate_matches > 0 && token_estimate > 1500) {
            (ComplexityTier::Moderate, 0.8)
        } else if token_estimate > 1000 || moderate_matches > 0 {
            (ComplexityTier::Moderate, 0.6)
        } else if simple_matches > 0 || token_estimate < 200 {
            (ComplexityTier::Simple, 0.85)
        } else if token_estimate < 100 {
            (ComplexityTier::Trivial, 0.9)
        } else {
            (ComplexityTier::Simple, 0.7)
        };

        (tier, confidence)
    }
}

/// Estimate token count from text (rough approximation)
/// Average English: ~4 characters per token
fn estimate_tokens(text: &str) -> usize {
    (text.len() / 4).max(1)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_prompts() {
        let classifier = ComplexityClassifier::new();

        // Simple keyword should classify as simple
        let (tier, _conf) = classifier.classify("fix typo in file.rs");
        assert_eq!(tier, ComplexityTier::Simple);

        // Very short prompt should be trivial
        let (tier, _conf) = classifier.classify("hi");
        assert_eq!(tier, ComplexityTier::Trivial);
    }

    #[test]
    fn test_moderate_prompts() {
        let classifier = ComplexityClassifier::new();

        let (tier, _conf) = classifier.classify("implement a new feature for user authentication");
        assert_eq!(tier, ComplexityTier::Moderate);

        let (tier, _conf) = classifier.classify("debug the api integration issue");
        assert_eq!(tier, ComplexityTier::Moderate);
    }

    #[test]
    fn test_complex_prompts() {
        let classifier = ComplexityClassifier::new();

        let (tier, _conf) = classifier.classify("refactor the system architecture to support distributed computing");
        assert_eq!(tier, ComplexityTier::Complex);

        let (tier, _conf) = classifier.classify("optimize memory leak in concurrent data structure");
        assert_eq!(tier, ComplexityTier::Complex);
    }

    #[test]
    fn test_token_estimation() {
        let classifier = ComplexityClassifier::new();

        // Very large prompt should push toward complex
        let large_prompt = "a".repeat(5000);
        let (tier, _conf) = classifier.classify(&large_prompt);
        assert_eq!(tier, ComplexityTier::Complex);
    }
}
