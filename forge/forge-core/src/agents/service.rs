use crate::models::*;
use crate::error::AppError;
use std::collections::HashMap;
use dashmap::DashMap;

/// Agent Service - manages agent lifecycle and execution
pub struct AgentService {
    agents: DashMap<String, Agent>,
    stats: DashMap<String, AgentStats>,
}

impl AgentService {
    pub fn new() -> Self {
        Self {
            agents: DashMap::new(),
            stats: DashMap::new(),
        }
    }

    /// Create a new agent
    pub fn create_agent(&self, agent: Agent) -> Result<Agent, AppError> {
        if self.agents.contains_key(&agent.id) {
            return Err(AppError::Conflict("Agent already exists".to_string()));
        }

        self.agents.insert(agent.id.clone(), agent.clone());
        self.stats.insert(
            agent.id.clone(),
            AgentStats {
                total_executions: 0,
                successful_executions: 0,
                failed_executions: 0,
                average_duration_ms: 0.0,
                success_rate: 1.0,
                last_execution: None,
            },
        );

        Ok(agent)
    }

    /// Get an agent
    pub fn get_agent(&self, id: &str) -> Result<Agent, AppError> {
        self.agents
            .get(id)
            .map(|a| a.clone())
            .ok_or_else(|| AppError::NotFound("Agent not found".to_string()))
    }

    /// Update an agent
    pub fn update_agent(&self, id: &str, agent: Agent) -> Result<Agent, AppError> {
        if !self.agents.contains_key(id) {
            return Err(AppError::NotFound("Agent not found".to_string()));
        }

        self.agents.insert(id.to_string(), agent.clone());
        Ok(agent)
    }

    /// Delete an agent
    pub fn delete_agent(&self, id: &str) -> Result<(), AppError> {
        if self.agents.remove(id).is_none() {
            return Err(AppError::NotFound("Agent not found".to_string()));
        }
        self.stats.remove(id);
        Ok(())
    }

    /// List all agents
    pub fn list_agents(&self) -> Vec<Agent> {
        self.agents
            .iter()
            .map(|entry| entry.value().clone())
            .collect()
    }

    /// Get agent statistics
    pub fn get_stats(&self, id: &str) -> Result<AgentStats, AppError> {
        self.stats
            .get(id)
            .map(|s| s.clone())
            .ok_or_else(|| AppError::NotFound("Stats not found".to_string()))
    }

    /// Update agent statistics after execution
    pub fn update_stats(
        &self,
        id: &str,
        duration_ms: u64,
        success: bool,
    ) -> Result<(), AppError> {
        if let Some(mut stats) = self.stats.get_mut(id) {
            stats.total_executions += 1;

            if success {
                stats.successful_executions += 1;
            } else {
                stats.failed_executions += 1;
            }

            // Update average duration
            let total_duration =
                stats.average_duration_ms * (stats.total_executions - 1) as f64 + duration_ms as f64;
            stats.average_duration_ms = total_duration / stats.total_executions as f64;

            // Update success rate
            stats.success_rate = stats.successful_executions as f64 / stats.total_executions as f64;

            stats.last_execution = Some(chrono::Utc::now());

            Ok(())
        } else {
            Err(AppError::NotFound("Agent not found".to_string()))
        }
    }

    /// Enable an agent
    pub fn enable_agent(&self, id: &str) -> Result<(), AppError> {
        if let Some(mut agent) = self.agents.get_mut(id) {
            agent.enabled = true;
            Ok(())
        } else {
            Err(AppError::NotFound("Agent not found".to_string()))
        }
    }

    /// Disable an agent
    pub fn disable_agent(&self, id: &str) -> Result<(), AppError> {
        if let Some(mut agent) = self.agents.get_mut(id) {
            agent.enabled = false;
            Ok(())
        } else {
            Err(AppError::NotFound("Agent not found".to_string()))
        }
    }

    /// Check if agent is enabled
    pub fn is_enabled(&self, id: &str) -> Result<bool, AppError> {
        self.agents
            .get(id)
            .map(|a| a.enabled)
            .ok_or_else(|| AppError::NotFound("Agent not found".to_string()))
    }
}

impl Default for AgentService {
    fn default() -> Self {
        Self::new()
    }
}

impl Clone for AgentService {
    fn clone(&self) -> Self {
        // Note: In production, you'd want a proper Arc-based approach
        Self {
            agents: DashMap::new(),
            stats: DashMap::new(),
        }
    }
}
