// Forge Core - Agent Platform Library
// The defensible moat: outcome data flywheel + multi-tier memory system + proprietary router

pub mod agents;
pub mod executor;
pub mod router;

// Re-export core types
pub use agents::tools::{AgentTool, ToolRegistry, ToolResult};
pub use executor::{DbPool, ExecutionPlan, ToolQueue};
pub use router::build_router;
