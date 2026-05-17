/// Built-in tool registration and initialization
/// Provides helper functions to register all built-in tools with a ToolRegistry

use crate::agents::{ToolRegistry, tools::*};
use std::sync::Arc;

/// Register all built-in tools with a ToolRegistry
///
/// This function instantiates all built-in tools and registers them with the provided
/// registry. It's typically called during application startup to populate the registry
/// with reference implementations and utility tools.
pub fn register_builtin_tools(registry: &Arc<ToolRegistry>) -> Result<(), String> {
    // Register Echo Tool
    registry
        .register_tool(Arc::new(EchoTool::new()))
        .map_err(|e| format!("Failed to register echo tool: {}", e))?;

    // Register JSON Validator Tool
    registry
        .register_tool(Arc::new(JsonValidatorTool::new()))
        .map_err(|e| format!("Failed to register json-validator tool: {}", e))?;

    // Register String Transform Tool
    registry
        .register_tool(Arc::new(StringTransformTool::new()))
        .map_err(|e| format!("Failed to register string-transform tool: {}", e))?;

    // Register Math Calculator Tool
    registry
        .register_tool(Arc::new(MathCalculatorTool::new()))
        .map_err(|e| format!("Failed to register math-calculator tool: {}", e))?;

    // Register Delay Simulator Tool
    registry
        .register_tool(Arc::new(DelaySimulatorTool::new()))
        .map_err(|e| format!("Failed to register delay-simulator tool: {}", e))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_register_builtin_tools() {
        let registry = Arc::new(ToolRegistry::new());
        let result = register_builtin_tools(&registry);

        assert!(result.is_ok());
        assert_eq!(registry.tool_count(), 5);

        // Verify each tool is registered
        assert!(registry.tool_exists("echo"));
        assert!(registry.tool_exists("json-validator"));
        assert!(registry.tool_exists("string-transform"));
        assert!(registry.tool_exists("math-calculator"));
        assert!(registry.tool_exists("delay-simulator"));
    }

    #[test]
    fn test_builtin_tools_metadata() {
        let registry = Arc::new(ToolRegistry::new());
        register_builtin_tools(&registry).unwrap();

        // Check echo tool metadata
        let echo_meta = registry.get_metadata("echo").unwrap();
        assert_eq!(echo_meta.name, "Echo Tool");
        assert_eq!(echo_meta.category, "utility");

        // Check json-validator metadata
        let validator_meta = registry.get_metadata("json-validator").unwrap();
        assert_eq!(validator_meta.name, "JSON Validator");
        assert_eq!(validator_meta.category, "validation");

        // Check string-transform metadata
        let transform_meta = registry.get_metadata("string-transform").unwrap();
        assert_eq!(transform_meta.name, "String Transform");
        assert_eq!(transform_meta.category, "text");

        // Check math-calculator metadata
        let calc_meta = registry.get_metadata("math-calculator").unwrap();
        assert_eq!(calc_meta.name, "Math Calculator");
        assert_eq!(calc_meta.category, "calculation");

        // Check delay-simulator metadata
        let delay_meta = registry.get_metadata("delay-simulator").unwrap();
        assert_eq!(delay_meta.name, "Delay Simulator");
        assert_eq!(delay_meta.category, "testing");
    }

    #[test]
    fn test_builtin_tools_categories() {
        let registry = Arc::new(ToolRegistry::new());
        register_builtin_tools(&registry).unwrap();

        // Get tools by category
        let utility_tools = registry.list_tools_by_category("utility");
        assert_eq!(utility_tools.len(), 1);
        assert_eq!(utility_tools[0].id, "echo");

        let text_tools = registry.list_tools_by_category("text");
        assert_eq!(text_tools.len(), 1);
        assert_eq!(text_tools[0].id, "string-transform");

        let calc_tools = registry.list_tools_by_category("calculation");
        assert_eq!(calc_tools.len(), 1);
        assert_eq!(calc_tools[0].id, "math-calculator");
    }
}
