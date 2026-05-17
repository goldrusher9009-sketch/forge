/**
 * Agent Module
 *
 * Core agent management system including registry and coordinator.
 */

export {
  AgentRegistry,
  createDefaultRegistry,
  type AgentCapability,
  type AgentModel,
  type AgentConfig,
  type AgentHealth,
  type RegisteredAgent,
  type CapabilityFilter,
  type RegistryStats,
  type CapabilityCategory,
  type AgentStatus,
  type ModelProvider
} from './registry';

export {
  AgentCoordinator,
  type ExecutionRequest,
  type ExecutionResult,
  type CoordinatorStats,
  type AgentSelection,
  type TaskPriority,
  type ExecutionMode
} from './coordinator';
