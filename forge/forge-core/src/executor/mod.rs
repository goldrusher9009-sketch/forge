// Agent executor module - orchestrates task execution, tool calling, and persistence
// Implements the outcome data flywheel and memory system

pub mod db;
pub mod queue;

pub use db::DbPool;
pub use queue::{ExecutionPlan, ToolCall, ToolQueue};
