# Forge LLM Router Module - Implementation Summary

## Overview
The `src/llm_router/` module implements the core routing intelligence for Forge, enabling complexity-based model selection with intelligent fallback cascades.

## Module Structure

### Components

#### 1. **ComplexityClassifier** (`src/llm_router/classifier.rs`)
- **Purpose**: Analyze prompts to determine complexity tier
- **Tiers**: Trivial, Simple, Moderate, Complex
- **Classification Logic**:
  - Keyword-based detection (heuristic scoring)
  - Token estimation (chars / 4 → token count)
  - Combined heuristic + token approach for accuracy
- **Confidence Scoring**: Returns (ComplexityTier, f32 confidence)

**Example Classification**:
```
"refactor architecture" → (Complex, 0.9)
"fix typo" → (Simple, 0.85)
"debug memory leak" → (Moderate, 0.75)
```

#### 2. **RoutingTable** (`src/llm_router/routing_table.rs`)
- **Purpose**: Map complexity tiers to model chains with fallback options
- **Configuration**: TOML-based tier-to-model mappings
- **Default Mappings**:
  - Trivial → Llama 2 (local)
  - Simple → Llama 3.3-70B (OpenRouter)
  - Moderate → Claude-3-Sonnet
  - Complex → Claude-Opus
- **Methods**: `get_primary_model()`, `get_model_chain()`, `from_file()`, `from_str()`

#### 3. **FallbackHandler** (`src/llm_router/fallback.rs`)
- **Purpose**: Execute model fallback chain on failures with intelligent error classification
- **Error Classification**:
  - **Retryable**: Rate limits, timeouts, temporary service issues (429, 503)
  - **Permanent**: Auth failures, invalid requests, model not found (400, 401, 403, 404)
- **Backoff Strategy**: Exponential backoff (100ms × 2^attempt, capped at 5s) with ±25% jitter
- **Tracking**: FallbackStats tracks attempts, successes, failures, chain exhaustion

#### 4. **SmartRoutingDecorator** (`src/llm_router/decorator.rs`)
- **Purpose**: Orchestrate end-to-end routing decisions with comprehensive logging
- **Key Methods**:
  - `classify_and_route()` - Get tier + select primary model
  - `estimate_cost()` - Calculate token-based pricing
  - `generate_correlation_id()` - UUID-based tracing
  - `route_request()` - Single-attempt routing with metadata
  - `route_with_fallback()` - Full fallback chain execution
- **Metadata Tracking**: correlation_id, complexity_tier/score, selected_model, latency, cost, timestamp

#### 5. **RoutingObservability** (`src/llm_router/observability.rs`)
- **Purpose**: Collect routing decisions for data flywheel and continuous improvement
- **Data Collection**:
  - RoutingDecision struct captures all routing metadata + outcomes
  - In-memory rolling window (configurable max_decisions)
  - Structured logging via tracing (info for success, warn for failures)
- **Analytics Methods**:
  - `get_statistics()` - Overall metrics (success_rate, avg_latency, avg_cost)
  - `get_statistics_by_tier()` - Tier-specific performance
  - `get_top_models()` - Model usage frequency
  - `export_json()` - Export for external analysis

#### 6. **Module Interface** (`src/llm_router/mod.rs`)
- **Re-exports**: All public types from submodules
- **Convenience Functions**:
  - `build_router()` - Creates SmartRoutingDecorator with defaults
  - `build_router_with_config(routing_table)` - Custom configuration
- **Integration Tests**: Validates router initialization and custom config loading

## Architecture

### Request Flow
```
Prompt Input
    ↓
ComplexityClassifier.classify() → (Tier, Confidence)
    ↓
RoutingTable.get_model_chain(tier) → Vec<ModelConfig>
    ↓
SmartRoutingDecorator.route_with_fallback()
    ├→ Try primary model (index 0)
    ├→ On failure: Check error classification
    │  ├→ Retryable: Move to next model with backoff
    │  └→ Permanent: Abort immediately
    ├→ Continue chain until success or exhausted
    └→ RoutingObservability.record_decision() [data flywheel]
    ↓
RoutedResponse (content + metadata)
```

### Data Flywheel
Every routing decision is recorded with:
- Input: prompt, prompt_length, complexity_tier, complexity_score
- Decision: selected_provider, selected_model, model_index_in_chain
- Execution: latency_ms, success/failure, error_message
- Cost: cost_estimate, actual_cost
- Correlation: correlation_id for tracing

This creates a dataset that can be analyzed to:
- Identify misclassifications and refine the classifier
- Detect cost overruns or model inefficiencies
- Improve tier-to-model mappings based on success rates
- Optimize fallback chains

## Naming Resolution

**Issue**: Rust doesn't allow both `src/router.rs` (HTTP router) and `src/router/` (LLM router) in the same module.

**Solution**: Renamed LLM router to `src/llm_router/`
- `src/router.rs` - HTTP/Axum endpoint routing (unchanged)
- `src/llm_router/` - LLM complexity routing (new subsystem)
- `src/main.rs` - Updated with clear comments distinguishing both

## Dependencies

Added to `Cargo.toml`:
- `toml = "0.8"` - TOML configuration parsing
- `rand = "0.8"` - Random jitter in exponential backoff

Existing dependencies used:
- `tokio` - Async runtime
- `uuid` - Correlation ID generation
- `chrono` - Timestamp recording
- `serde` - Serialization
- `tracing` - Structured logging

## Testing

Each module includes comprehensive test coverage:
- **classifier.rs**: Keyword detection, token estimation, tier classification
- **routing_table.rs**: Default/custom configs, TOML parsing, tier mapping
- **fallback.rs**: Error classification, backoff calculation, fallback chain logic
- **decorator.rs**: Correlation IDs, cost estimation, routing metadata
- **observability.rs**: Decision recording, statistics computation, top models ranking
- **mod.rs**: Router initialization, custom config loading

## Next Steps

1. **Test Compilation**: Run `cargo check` on a machine with Rust installed to verify no compilation errors
2. **Agent Tool Registry**: Implement tool discovery and registration system (per Forge briefing Section 8)
3. **Coordinator**: Build orchestration layer that uses the router to select models for multi-step agent workflows
4. **Integration Testing**: End-to-end tests with mock LLM providers
5. **Performance Optimization**: Profile the classifier and observability collector under load

## Usage Example

```rust
use forge_core::llm_router::{SmartRoutingDecorator, RoutingTable};

#[tokio::main]
async fn main() {
    // Option 1: Default routing
    let router = llm_router::build_router();
    
    // Option 2: Custom TOML config
    let table = RoutingTable::from_file("routing.toml")?;
    let router = llm_router::build_router_with_config(table);
    
    // Route a request with fallback
    let prompt = "refactor the authentication system";
    let response = router.route_with_fallback(prompt, 2000).await?;
    
    println!("Response: {}", response.content);
    println!("Model used: {}", response.metadata.selected_model.model);
    println!("Cost: ${:.4}", response.metadata.cost_estimate);
}
```

## Key Design Decisions

1. **Heuristic + Token Hybrid Classification**: Avoids over-reliance on single signal
2. **Error Classification**: Prevents wasteful retries on permanent failures
3. **Exponential Backoff with Jitter**: Prevents thundering herd during service recovery
4. **In-Memory Data Flywheel**: Fast access for analytics without external dependencies
5. **Structured Logging**: OpenTelemetry-compatible for production observability
6. **TOML Configuration**: Human-readable, version-controllable tier-to-model mappings
7. **Correlation IDs**: End-to-end request tracing across distributed system

## Files
- `src/llm_router/mod.rs` - 103 lines
- `src/llm_router/classifier.rs` - ~250 lines
- `src/llm_router/routing_table.rs` - ~200 lines
- `src/llm_router/fallback.rs` - ~246 lines
- `src/llm_router/decorator.rs` - ~343 lines
- `src/llm_router/observability.rs` - ~394 lines

**Total**: ~1,536 lines of production code + comprehensive test coverage
