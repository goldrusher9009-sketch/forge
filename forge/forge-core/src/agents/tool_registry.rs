use crate::agents::tool_interface::{AgentTool, ToolError, ToolMetadata, ToolStats};
use dashmap::DashMap;
use std::sync::Arc;

/// Tool registry for managing available tools and their metadata
pub struct ToolRegistry {
    tools: DashMap<String, Arc<dyn AgentTool>>,
    metadata: DashMap<String, ToolMetadata>,
    stats: DashMap<String, ToolStats>,
}

impl ToolRegistry {
    /// Create a new tool registry
    pub fn new() -> Self {
        Self {
            tools: DashMap::new(),
            metadata: DashMap::new(),
            stats: DashMap::new(),
        }
    }

    /// Register a tool in the registry
    pub fn register_tool(&self, tool: Arc<dyn AgentTool>) -> Result<(), ToolError> {
        let metadata = tool.metadata();
        let tool_id = &metadata.id;

        // Check if tool already registered
        if self.tools.contains_key(tool_id) {
            return Err(ToolError::new(
                "TOOL_ALREADY_REGISTERED",
                format!("Tool '{}' is already registered", tool_id),
            ));
        }

        // Validate tool metadata
        self.validate_metadata(metadata)?;

        // Register tool, metadata, and initialize stats
        self.tools.insert(tool_id.clone(), tool);
        self.metadata.insert(tool_id.clone(), metadata.clone());
        self.stats.insert(tool_id.clone(), ToolStats::new());

        Ok(())
    }

    /// Unregister a tool from the registry
    pub fn unregister_tool(&self, tool_id: &str) -> Result<(), ToolError> {
        self.tools
            .remove(tool_id)
            .ok_or_else(|| {
                ToolError::new("TOOL_NOT_FOUND", format!("Tool '{}' not found", tool_id))
            })?;

        self.metadata.remove(tool_id);
        self.stats.remove(tool_id);

        Ok(())
    }

    /// Get a tool by ID
    pub fn get_tool(&self, tool_id: &str) -> Result<Arc<dyn AgentTool>, ToolError> {
        self.tools
            .get(tool_id)
            .map(|entry| entry.value().clone())
            .ok_or_else(|| {
                ToolError::new("TOOL_NOT_FOUND", format!("Tool '{}' not found", tool_id))
            })
    }

    /// Get tool metadata
    pub fn get_metadata(&self, tool_id: &str) -> Result<ToolMetadata, ToolError> {
        self.metadata
            .get(tool_id)
            .map(|entry| entry.value().clone())
            .ok_or_else(|| {
                ToolError::new(
                    "METADATA_NOT_FOUND",
                    format!("Metadata for tool '{}' not found", tool_id),
                )
            })
    }

    /// List all registered tools
    pub fn list_tools(&self) -> Vec<ToolMetadata> {
        self.metadata
            .iter()
            .map(|entry| entry.value().clone())
            .collect()
    }

    /// List tools by category
    pub fn list_tools_by_category(&self, category: &str) -> Vec<ToolMetadata> {
        self.metadata
            .iter()
            .filter(|entry| entry.value().category == category)
            .map(|entry| entry.value().clone())
            .collect()
    }

    /// List tools by tag
    pub fn list_tools_by_tag(&self, tag: &str) -> Vec<ToolMetadata> {
        self.metadata
            .iter()
            .filter(|entry| entry.value().tags.contains(&tag.to_string()))
            .map(|entry| entry.value().clone())
            .collect()
    }

    /// Get tool statistics
    pub fn get_stats(&self, tool_id: &str) -> Result<ToolStats, ToolError> {
        self.stats
            .get(tool_id)
            .map(|entry| entry.value().clone())
            .ok_or_else(|| {
                ToolError::new("STATS_NOT_FOUND", format!("Stats for tool '{}' not found", tool_id))
            })
    }

    /// Update tool statistics after execution
    pub fn update_stats(&self, tool_id: &str, success: bool, duration_ms: u128) -> Result<(), ToolError> {
        if let Some(mut stats) = self.stats.get_mut(tool_id) {
            stats.record_execution(success, duration_ms);
            Ok(())
        } else {
            Err(ToolError::new(
                "STATS_NOT_FOUND",
                format!("Stats for tool '{}' not found", tool_id),
            ))
        }
    }

    /// Check if a tool is available (enabled and healthy)
    pub fn is_available(&self, tool_id: &str) -> Result<bool, ToolError> {
        let tool = self.get_tool(tool_id)?;
        Ok(tool.is_available())
    }

    /// Get available tools (enabled and healthy)
    pub fn get_available_tools(&self) -> Vec<ToolMetadata> {
        self.tools
            .iter()
            .filter_map(|entry| {
                let tool_id = entry.key();
                if let Ok(true) = self.is_available(tool_id) {
                    self.metadata.get(tool_id).map(|m| m.value().clone())
                } else {
                    None
                }
            })
            .collect()
    }

    /// Get tool count
    pub fn tool_count(&self) -> usize {
        self.tools.len()
    }

    /// Validate tool metadata
    fn validate_metadata(&self, metadata: &ToolMetadata) -> Result<(), ToolError> {
        // Validate ID is not empty
        if metadata.id.is_empty() {
            return Err(ToolError::new(
                "INVALID_METADATA",
                "Tool ID cannot be empty",
            ));
        }

        // Validate name is not empty
        if metadata.name.is_empty() {
            return Err(ToolError::new(
                "INVALID_METADATA",
                "Tool name cannot be empty",
            ));
        }

        // Validate timeout is positive
        if metadata.timeout_seconds == 0 {
            return Err(ToolError::new(
                "INVALID_METADATA",
                "Tool timeout must be greater than 0",
            ));
        }

        // Validate max retries is non-negative
        if metadata.max_retries > 100 {
            return Err(ToolError::new(
                "INVALID_METADATA",
                "Tool max retries cannot exceed 100",
            ));
        }

        Ok(())
    }

    /// Check if tool with ID exists
    pub fn tool_exists(&self, tool_id: &str) -> bool {
        self.tools.contains_key(tool_id)
    }

    /// Get all tool stats
    pub fn get_all_stats(&self) -> Vec<(String, ToolStats)> {
        self.stats
            .iter()
            .map(|entry| (entry.key().clone(), entry.value().clone()))
            .collect()
    }
}

impl Default for ToolRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl Clone for ToolRegistry {
    fn clone(&self) -> Self {
        Self {
            tools: DashMap::new(),
            metadata: DashMap::new(),
            stats: DashMap::new(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agents::tool_interface::{ToolCapability, ToolInputSpec};

    struct MockTool {
        metadata: ToolMetadata,
    }

    impl MockTool {
        fn new(id: &str, name: &str) -> Self {
            Self {
                metadata: ToolMetadata::new(id, name)
                    .with_description("A mock tool for testing")
                    .with_category("testing"),
            }
        }
    }

    impl AgentTool for MockTool {
        fn metadata(&self) -> &ToolMetadata {
            &self.metadata
        }

        async fn execute(
            &self,
            _input: serde_json::Value,
            _execution_id: String,
        ) -> Result<crate::agents::tool_interface::ToolResult, ToolError> {
            Ok(crate::agents::tool_interface::ToolResult::success(
                &self.metadata.name,
                "test-exec-id",
                serde_json::json!({"status": "ok"}),
                100,
            ))
        }
    }

    #[test]
    fn test_register_tool() {
        let registry = ToolRegistry::new();
        let tool = Arc::new(MockTool::new("tool-1", "Test Tool"));

        assert!(registry.register_tool(tool).is_ok());
        assert!(registry.tool_exists("tool-1"));
        assert_eq!(registry.tool_count(), 1);
    }

    #[test]
    fn test_register_duplicate_tool() {
        let registry = ToolRegistry::new();
        let tool = Arc::new(MockTool::new("tool-1", "Test Tool"));

        registry.register_tool(tool.clone()).unwrap();
        let result = registry.register_tool(tool);

        assert!(result.is_err());
        assert_eq!(registry.tool_count(), 1);
    }

    #[test]
    fn test_get_tool() {
        let registry = ToolRegistry::new();
        let tool = Arc::new(MockTool::new("tool-1", "Test Tool"));

        registry.register_tool(tool.clone()).unwrap();
        let retrieved = registry.get_tool("tool-1");

        assert!(retrieved.is_ok());
    }

    #[test]
    fn test_get_nonexistent_tool() {
        let registry = ToolRegistry::new();
        let result = registry.get_tool("nonexistent");

        assert!(result.is_err());
    }

    #[test]
    fn test_unregister_tool() {
        let registry = ToolRegistry::new();
        let tool = Arc::new(MockTool::new("tool-1", "Test Tool"));

        registry.register_tool(tool).unwrap();
        assert_eq!(registry.tool_count(), 1);

        registry.unregister_tool("tool-1").unwrap();
        assert_eq!(registry.tool_count(), 0);
    }

    #[test]
    fn test_list_tools() {
        let registry = ToolRegistry::new();
        let tool1 = Arc::new(MockTool::new("tool-1", "Test Tool 1"));
        let tool2 = Arc::new(MockTool::new("tool-2", "Test Tool 2"));

        registry.register_tool(tool1).unwrap();
        registry.register_tool(tool2).unwrap();

        let tools = registry.list_tools();
        assert_eq!(tools.len(), 2);
    }

    #[test]
    fn test_list_tools_by_category() {
        let registry = ToolRegistry::new();

        let mut metadata1 = ToolMetadata::new("tool-1", "Test Tool 1")
            .with_category("testing");
        metadata1.category = "analytics".to_string();

        let tool1 = Arc::new(MockTool {
            metadata: metadata1,
        });

        let tool2 = Arc::new(
            MockTool::new("tool-2", "Test Tool 2")
        );

        registry.register_tool(tool1).unwrap();
        registry.register_tool(tool2).unwrap();

        let analytics_tools = registry.list_tools_by_category("analytics");
        assert_eq!(analytics_tools.len(), 1);

        let testing_tools = registry.list_tools_by_category("testing");
        assert_eq!(testing_tools.len(), 1);
    }

    #[test]
    fn test_tool_stats() {
        let registry = ToolRegistry::new();
        let tool = Arc::new(MockTool::new("tool-1", "Test Tool"));

        registry.register_tool(tool).unwrap();

        // Update stats
        registry.update_stats("tool-1", true, 100).unwrap();
        registry.update_stats("tool-1", true, 150).unwrap();
        registry.update_stats("tool-1", false, 75).unwrap();

        let stats = registry.get_stats("tool-1").unwrap();
        assert_eq!(stats.total_executions, 3);
        assert_eq!(stats.successful_executions, 2);
        assert_eq!(stats.failed_executions, 1);
    }

    #[test]
    fn test_tool_exists() {
        let registry = ToolRegistry::new();
        let tool = Arc::new(MockTool::new("tool-1", "Test Tool"));

        registry.register_tool(tool).unwrap();

        assert!(registry.tool_exists("tool-1"));
        assert!(!registry.tool_exists("tool-2"));
    }
}
