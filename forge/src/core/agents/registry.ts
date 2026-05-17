/**
 * Agent Registry
 *
 * Manages lifecycle, capabilities, and health of all registered agents.
 * Enables dynamic agent discovery and selection based on required capabilities.
 */

import { v4 as uuidv4 } from 'uuid';

// Types and Interfaces
export type CapabilityCategory = 'reasoning' | 'coding' | 'analysis' | 'planning' | 'execution' | 'custom';
export type AgentStatus = 'active' | 'inactive' | 'maintenance' | 'error';
export type ModelProvider = 'openai' | 'anthropic' | 'local' | 'custom';

export interface AgentCapability {
  name: string;
  description: string;
  category: CapabilityCategory;
  version: string;
  requiresTools: boolean;
}

export interface AgentModel {
  name: string;
  provider: ModelProvider;
  modelId: string;
  version: string;
  maxTokens: number;
  costPer1kTokens: number;
  supportedCapabilities: string[];
}

export interface AgentConfig {
  name: string;
  description: string;
  model: AgentModel;
  capabilities: string[];
  maxConcurrentTasks: number;
  timeoutMs: number;
  retryPolicy: {
    maxRetries: number;
    initialBackoffMs: number;
    maxBackoffMs: number;
  };
  metadata?: Record<string, unknown>;
}

export interface AgentHealth {
  lastHeartbeat: Date;
  errorCount: number;
  successCount: number;
  avgResponseTime: number;
  errorThreshold: number;
}

export interface RegisteredAgent {
  id: string;
  config: AgentConfig;
  enabled: boolean;
  status: AgentStatus;
  health: AgentHealth;
  createdAt: Date;
  updatedAt: Date;
}

export interface CapabilityFilter {
  required?: string[];
  any?: string[];
  exclude?: string[];
}

export interface RegistryStats {
  totalAgents: number;
  activeAgents: number;
  totalCapabilities: number;
  totalModels: number;
  avgHealthScore: number;
}

/**
 * Agent Registry
 *
 * Central registry for managing agents, their capabilities, and health status.
 */
export class AgentRegistry {
  private agents: Map<string, RegisteredAgent> = new Map();
  private capabilities: Map<string, AgentCapability> = new Map();
  private models: Map<string, AgentModel> = new Map();
  private readonly errorThreshold = 5;

  /**
   * Register a new agent in the registry
   */
  register(config: AgentConfig, metadata?: Record<string, unknown>): string {
    const id = uuidv4();
    const now = new Date();

    const agent: RegisteredAgent = {
      id,
      config: {
        ...config,
        metadata
      },
      enabled: true,
      status: 'active',
      health: {
        lastHeartbeat: now,
        errorCount: 0,
        successCount: 0,
        avgResponseTime: 0,
        errorThreshold: this.errorThreshold
      },
      createdAt: now,
      updatedAt: now
    };

    this.agents.set(id, agent);
    return id;
  }

  /**
   * Get agent by ID
   */
  get(id: string): RegisteredAgent | undefined {
    return this.agents.get(id);
  }

  /**
   * Find agents by capability requirements
   */
  findByCapabilities(filter: CapabilityFilter): RegisteredAgent[] {
    return Array.from(this.agents.values()).filter(agent => {
      const agentCapabilities = new Set(agent.config.capabilities);

      // Check required capabilities
      if (filter.required && !filter.required.every(cap => agentCapabilities.has(cap))) {
        return false;
      }

      // Check any (at least one must match)
      if (filter.any && !filter.any.some(cap => agentCapabilities.has(cap))) {
        return false;
      }

      // Check exclude (none should match)
      if (filter.exclude && filter.exclude.some(cap => agentCapabilities.has(cap))) {
        return false;
      }

      return true;
    });
  }

  /**
   * Find agents by model provider
   */
  findByProvider(provider: ModelProvider): RegisteredAgent[] {
    return Array.from(this.agents.values()).filter(
      agent => agent.config.model.provider === provider
    );
  }

  /**
   * Find agents by model ID
   */
  findByModel(modelId: string): RegisteredAgent[] {
    return Array.from(this.agents.values()).filter(
      agent => agent.config.model.modelId === modelId
    );
  }

  /**
   * Get all active agents
   */
  getActive(): RegisteredAgent[] {
    return Array.from(this.agents.values()).filter(
      agent => agent.enabled && agent.status === 'active'
    );
  }

  /**
   * Update agent status
   */
  updateStatus(id: string, status: AgentStatus): void {
    const agent = this.agents.get(id);
    if (agent) {
      agent.status = status;
      agent.updatedAt = new Date();
    }
  }

  /**
   * Record successful execution
   */
  recordSuccess(id: string, responseTimeMs: number): void {
    const agent = this.agents.get(id);
    if (agent) {
      agent.health.successCount++;
      agent.health.lastHeartbeat = new Date();

      // Update average response time
      const total = agent.health.successCount + agent.health.errorCount;
      agent.health.avgResponseTime =
        (agent.health.avgResponseTime * (total - 1) + responseTimeMs) / total;

      agent.updatedAt = new Date();
    }
  }

  /**
   * Record error and potentially disable agent
   */
  recordError(id: string): void {
    const agent = this.agents.get(id);
    if (agent) {
      agent.health.errorCount++;
      agent.health.lastHeartbeat = new Date();

      // Auto-disable if error threshold exceeded
      if (agent.health.errorCount >= agent.health.errorThreshold) {
        agent.enabled = false;
        agent.status = 'error';
      }

      agent.updatedAt = new Date();
    }
  }

  /**
   * Register a new capability
   */
  registerCapability(capability: AgentCapability): void {
    this.capabilities.set(capability.name, capability);
  }

  /**
   * Get all registered capabilities
   */
  getCapabilities(): AgentCapability[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * Register a new model
   */
  registerModel(model: AgentModel): void {
    this.models.set(model.modelId, model);
  }

  /**
   * Get all registered models
   */
  getModels(): AgentModel[] {
    return Array.from(this.models.values());
  }

  /**
   * List all agents
   */
  list(): RegisteredAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get registry statistics
   */
  getStats(): RegistryStats {
    const agents = Array.from(this.agents.values());
    const activeAgents = agents.filter(a => a.enabled && a.status === 'active');

    const avgHealthScore = agents.length > 0
      ? agents.reduce((sum, agent) => {
          const errorRate = agent.health.errorCount /
            (agent.health.successCount + agent.health.errorCount || 1);
          return sum + (1 - errorRate);
        }, 0) / agents.length
      : 0;

    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      totalCapabilities: this.capabilities.size,
      totalModels: this.models.size,
      avgHealthScore
    };
  }
}

/**
 * Create a default registry with common capabilities and models
 */
export function createDefaultRegistry(): AgentRegistry {
  const registry = new AgentRegistry();

  // Register capabilities
  const capabilities: AgentCapability[] = [
    {
      name: 'code_generation',
      description: 'Generate code from specifications',
      category: 'coding',
      version: '1.0.0',
      requiresTools: false
    },
    {
      name: 'code_analysis',
      description: 'Analyze code quality and suggest improvements',
      category: 'analysis',
      version: '1.0.0',
      requiresTools: false
    },
    {
      name: 'reasoning',
      description: 'Complex logical reasoning and problem solving',
      category: 'reasoning',
      version: '1.0.0',
      requiresTools: false
    },
    {
      name: 'planning',
      description: 'Break down complex tasks into steps',
      category: 'planning',
      version: '1.0.0',
      requiresTools: false
    },
    {
      name: 'data_analysis',
      description: 'Analyze and visualize data',
      category: 'analysis',
      version: '1.0.0',
      requiresTools: true
    },
    {
      name: 'web_search',
      description: 'Search and retrieve information from the web',
      category: 'execution',
      version: '1.0.0',
      requiresTools: true
    },
    {
      name: 'file_handling',
      description: 'Read, write, and manipulate files',
      category: 'execution',
      version: '1.0.0',
      requiresTools: true
    }
  ];

  capabilities.forEach(cap => registry.registerCapability(cap));

  // Register models
  const models: AgentModel[] = [
    {
      name: 'GPT-4 Turbo',
      provider: 'openai',
      modelId: 'gpt-4-turbo-preview',
      version: '2024-04-09',
      maxTokens: 128000,
      costPer1kTokens: 0.03,
      supportedCapabilities: [
        'code_generation',
        'code_analysis',
        'reasoning',
        'planning',
        'data_analysis'
      ]
    },
    {
      name: 'GPT-4',
      provider: 'openai',
      modelId: 'gpt-4',
      version: '2023-06-13',
      maxTokens: 8192,
      costPer1kTokens: 0.03,
      supportedCapabilities: [
        'code_generation',
        'code_analysis',
        'reasoning',
        'planning'
      ]
    },
    {
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      modelId: 'claude-3-opus-20240229',
      version: '2024-02-29',
      maxTokens: 200000,
      costPer1kTokens: 0.015,
      supportedCapabilities: [
        'code_generation',
        'code_analysis',
        'reasoning',
        'planning',
        'data_analysis',
        'web_search',
        'file_handling'
      ]
    },
    {
      name: 'Claude 3 Sonnet',
      provider: 'anthropic',
      modelId: 'claude-3-sonnet-20240229',
      version: '2024-02-29',
      maxTokens: 200000,
      costPer1kTokens: 0.003,
      supportedCapabilities: [
        'code_generation',
        'code_analysis',
        'reasoning',
        'planning',
        'data_analysis'
      ]
    },
    {
      name: 'Claude 3 Haiku',
      provider: 'anthropic',
      modelId: 'claude-3-haiku-20240307',
      version: '2024-03-07',
      maxTokens: 200000,
      costPer1kTokens: 0.00025,
      supportedCapabilities: [
        'code_analysis',
        'reasoning',
        'planning'
      ]
    }
  ];

  models.forEach(model => registry.registerModel(model));

  return registry;
}

export default AgentRegistry;
