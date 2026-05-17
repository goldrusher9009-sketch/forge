/// Built-in example tools for the Forge agent platform
/// These tools demonstrate the AgentTool trait implementation and serve as
/// reference implementations for custom tool development.

use crate::agents::tool_interface::{AgentTool, ToolError, ToolMetadata, ToolResult};
use async_trait::async_trait;
use serde_json::{json, Value};
use std::time::Instant;

/// Echo tool - simple test tool that returns input as output
pub struct EchoTool {
    metadata: ToolMetadata,
}

impl EchoTool {
    pub fn new() -> Self {
        Self {
            metadata: ToolMetadata::new("echo", "Echo Tool".to_string())
                .with_description("Returns the input value unchanged")
                .with_category("utility")
                .with_tag("test")
                .with_tag("echo")
                .with_timeout_seconds(5),
        }
    }
}

#[async_trait]
impl AgentTool for EchoTool {
    fn metadata(&self) -> &ToolMetadata {
        &self.metadata
    }

    async fn execute(
        &self,
        input: Value,
        execution_id: String,
    ) -> Result<ToolResult, ToolError> {
        let start = Instant::now();

        // Validate input
        if input.is_null() {
            return Err(ToolError::new(
                "INVALID_INPUT",
                "Echo tool requires non-null input".to_string(),
            ));
        }

        let duration_ms = start.elapsed().as_millis();

        Ok(ToolResult {
            success: true,
            data: Some(input),
            error: None,
            duration_ms,
            tool_name: self.metadata.name.clone(),
            execution_id,
        })
    }
}

/// JSON Validator tool - validates JSON structure
pub struct JsonValidatorTool {
    metadata: ToolMetadata,
}

impl JsonValidatorTool {
    pub fn new() -> Self {
        Self {
            metadata: ToolMetadata::new("json-validator", "JSON Validator".to_string())
                .with_description("Validates JSON structure and returns validation result")
                .with_category("validation")
                .with_tag("json")
                .with_tag("validation")
                .with_timeout_seconds(10),
        }
    }
}

#[async_trait]
impl AgentTool for JsonValidatorTool {
    fn metadata(&self) -> &ToolMetadata {
        &self.metadata
    }

    async fn execute(
        &self,
        input: Value,
        execution_id: String,
    ) -> Result<ToolResult, ToolError> {
        let start = Instant::now();

        // Check if input is valid JSON object or array
        let is_valid = input.is_object() || input.is_array();

        if !is_valid {
            return Err(ToolError::new(
                "INVALID_JSON",
                "Input must be a JSON object or array".to_string(),
            ));
        }

        let duration_ms = start.elapsed().as_millis();

        Ok(ToolResult {
            success: true,
            data: Some(json!({
                "valid": true,
                "type": if input.is_object() { "object" } else { "array" },
                "keys_count": if let Some(obj) = input.as_object() {
                    obj.len()
                } else {
                    input.as_array().map(|a| a.len()).unwrap_or(0)
                }
            })),
            error: None,
            duration_ms,
            tool_name: self.metadata.name.clone(),
            execution_id,
        })
    }
}

/// String Transform tool - applies transformations to strings
pub struct StringTransformTool {
    metadata: ToolMetadata,
}

impl StringTransformTool {
    pub fn new() -> Self {
        Self {
            metadata: ToolMetadata::new("string-transform", "String Transform".to_string())
                .with_description("Transforms strings (uppercase, lowercase, reverse, etc.)")
                .with_category("text")
                .with_tag("string")
                .with_tag("transform")
                .with_timeout_seconds(5),
        }
    }
}

#[async_trait]
impl AgentTool for StringTransformTool {
    fn metadata(&self) -> &ToolMetadata {
        &self.metadata
    }

    async fn execute(
        &self,
        input: Value,
        execution_id: String,
    ) -> Result<ToolResult, ToolError> {
        let start = Instant::now();

        let operation = input
            .get("operation")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ToolError::new("MISSING_OPERATION", "operation field is required".to_string()))?;

        let text = input
            .get("text")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ToolError::new("MISSING_TEXT", "text field is required".to_string()))?;

        let result = match operation {
            "uppercase" => text.to_uppercase(),
            "lowercase" => text.to_lowercase(),
            "reverse" => text.chars().rev().collect::<String>(),
            "length" => text.len().to_string(),
            _ => {
                return Err(ToolError::new(
                    "INVALID_OPERATION",
                    format!("Unknown operation: {}", operation),
                ))
            }
        };

        let duration_ms = start.elapsed().as_millis();

        Ok(ToolResult {
            success: true,
            data: Some(json!({
                "operation": operation,
                "result": result
            })),
            error: None,
            duration_ms,
            tool_name: self.metadata.name.clone(),
            execution_id,
        })
    }
}

/// Math Calculator tool - performs basic math operations
pub struct MathCalculatorTool {
    metadata: ToolMetadata,
}

impl MathCalculatorTool {
    pub fn new() -> Self {
        Self {
            metadata: ToolMetadata::new("math-calculator", "Math Calculator".to_string())
                .with_description("Performs basic arithmetic operations")
                .with_category("calculation")
                .with_tag("math")
                .with_tag("calculator")
                .with_timeout_seconds(5),
        }
    }
}

#[async_trait]
impl AgentTool for MathCalculatorTool {
    fn metadata(&self) -> &ToolMetadata {
        &self.metadata
    }

    async fn execute(
        &self,
        input: Value,
        execution_id: String,
    ) -> Result<ToolResult, ToolError> {
        let start = Instant::now();

        let operation = input
            .get("operation")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ToolError::new("MISSING_OPERATION", "operation field is required".to_string()))?;

        let a = input
            .get("a")
            .and_then(|v| v.as_f64())
            .ok_or_else(|| ToolError::new("MISSING_A", "a field must be a number".to_string()))?;

        let b = input
            .get("b")
            .and_then(|v| v.as_f64())
            .ok_or_else(|| ToolError::new("MISSING_B", "b field must be a number".to_string()))?;

        let result = match operation {
            "add" => a + b,
            "subtract" => a - b,
            "multiply" => a * b,
            "divide" => {
                if b == 0.0 {
                    return Err(ToolError::new("DIVISION_BY_ZERO", "Cannot divide by zero".to_string()));
                }
                a / b
            }
            "power" => a.powf(b),
            _ => {
                return Err(ToolError::new(
                    "INVALID_OPERATION",
                    format!("Unknown operation: {}", operation),
                ))
            }
        };

        let duration_ms = start.elapsed().as_millis();

        Ok(ToolResult {
            success: true,
            data: Some(json!({
                "operation": operation,
                "a": a,
                "b": b,
                "result": result
            })),
            error: None,
            duration_ms,
            tool_name: self.metadata.name.clone(),
            execution_id,
        })
    }
}

/// Delay Simulator tool - simulates processing time
pub struct DelaySimulatorTool {
    metadata: ToolMetadata,
}

impl DelaySimulatorTool {
    pub fn new() -> Self {
        Self {
            metadata: ToolMetadata::new("delay-simulator", "Delay Simulator".to_string())
                .with_description("Simulates processing delay and returns input after delay")
                .with_category("testing")
                .with_tag("delay")
                .with_tag("simulation")
                .with_timeout_seconds(30),
        }
    }
}

#[async_trait]
impl AgentTool for DelaySimulatorTool {
    fn metadata(&self) -> &ToolMetadata {
        &self.metadata
    }

    async fn execute(
        &self,
        input: Value,
        execution_id: String,
    ) -> Result<ToolResult, ToolError> {
        let start = Instant::now();

        let delay_ms = input
            .get("delay_ms")
            .and_then(|v| v.as_u64())
            .unwrap_or(100);

        if delay_ms > 30000 {
            return Err(ToolError::new(
                "DELAY_TOO_LONG",
                "Delay cannot exceed 30 seconds".to_string(),
            ));
        }

        // Simulate delay
        tokio::time::sleep(tokio::time::Duration::from_millis(delay_ms)).await;

        let duration_ms = start.elapsed().as_millis();

        Ok(ToolResult {
            success: true,
            data: Some(json!({
                "requested_delay_ms": delay_ms,
                "actual_delay_ms": duration_ms,
                "message": "Delay simulation completed"
            })),
            error: None,
            duration_ms,
            tool_name: self.metadata.name.clone(),
            execution_id,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_echo_tool() {
        let tool = EchoTool::new();
        let input = json!({"message": "hello"});
        let result = tool.execute(input.clone(), "test-1".to_string()).await;

        assert!(result.is_ok());
        let result = result.unwrap();
        assert!(result.success);
        assert_eq!(result.data, Some(input));
    }

    #[tokio::test]
    async fn test_json_validator_valid() {
        let tool = JsonValidatorTool::new();
        let input = json!({"key": "value"});
        let result = tool.execute(input, "test-2".to_string()).await;

        assert!(result.is_ok());
        assert!(result.unwrap().success);
    }

    #[tokio::test]
    async fn test_string_transform_uppercase() {
        let tool = StringTransformTool::new();
        let input = json!({"operation": "uppercase", "text": "hello"});
        let result = tool.execute(input, "test-3".to_string()).await;

        assert!(result.is_ok());
        let result = result.unwrap();
        assert!(result.success);
        assert_eq!(result.data.unwrap()["result"], "HELLO");
    }

    #[tokio::test]
    async fn test_math_calculator_add() {
        let tool = MathCalculatorTool::new();
        let input = json!({"operation": "add", "a": 5.0, "b": 3.0});
        let result = tool.execute(input, "test-4".to_string()).await;

        assert!(result.is_ok());
        let result = result.unwrap();
        assert!(result.success);
        assert_eq!(result.data.unwrap()["result"], 8.0);
    }

    #[tokio::test]
    async fn test_math_calculator_division_by_zero() {
        let tool = MathCalculatorTool::new();
        let input = json!({"operation": "divide", "a": 5.0, "b": 0.0});
        let result = tool.execute(input, "test-5".to_string()).await;

        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_delay_simulator() {
        let tool = DelaySimulatorTool::new();
        let input = json!({"delay_ms": 100});
        let result = tool.execute(input, "test-6".to_string()).await;

        assert!(result.is_ok());
        let result = result.unwrap();
        assert!(result.success);
        assert!(result.duration_ms >= 100);
    }
}
