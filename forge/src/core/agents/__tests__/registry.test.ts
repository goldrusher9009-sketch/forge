/**
 * Agent Registry Tests
 */

import AgentRegistry, {
  createDefaultRegistry,
  type AgentConfig,
  type AgentCapability,
  type AgentModel
} from '../registry';

describe('AgentRegistry', () => {
  let registry: AgentRegistry;

  beforeEach(() => {
    registry = new AgentRegistry();
  });

  describe('register', () => {
    it('should register an agent and return ID', () => {
      const config: AgentConfig = {
        name: 'Test Agent',
        description: 'A test agent',
        model: {
          name: 'Test Model',
          provider: 'openai',
          modelId: 'test-model',
          version: '1.0',
          maxTokens: 4096,
          costPer1kTokens: 0.01,
          supportedCapabilities: ['reasoning']
        },
        capabilities: ['reasoning'],
        maxConcurrentTasks: 5,
        timeoutMs: 30000,
        retryPolicy: {
          maxRetries: 3,
          initialBackoffMs: 100,
          maxBackoffMs: 5000
        }
      };

      const id = registry.register(config);
      expect(id).toBeTruthy();
      expect(id).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should store metadata during registration', () => {
      const config: AgentConfig = {
        name: 'Test Agent',
        description: 'A test agent',
        model: {
          name: 'Test Model',
          provider: 'openai',
          modelId: 'test-model',
          version: '1.0',
          maxTokens: 4096,
          costPer1kTokens: 0.01,
          supportedCapabilities: ['reasoning']
        },
        capabilities: ['reasoning'],
        maxConcurrentTasks: 5,
        timeoutMs: 30000,
        retryPolicy: {
          maxRetries: 3,
          initialBackoffMs: 100,
          maxBackoffMs: 5000
        }
      };

      const metadata = { customData: 'test' };
      const id = registry.register(config, metadata);
      const agent = registry.get(id);

      expect(agent?.config.metadata).toEqual(metadata);
    });
  });

  describe('get', () => {
    it('should retrieve agent by ID', () => {
      const config: AgentConfig = {
        name: 'Test Agent',
        description: 'A test agent',
        model: {
          name: 'Test Model',
          provider: 'openai',
          modelId: 'test-model',
          version: '1.0',
          maxTokens: 4096,
          costPer1kTokens: 0.01,
          supportedCapabilities: ['reasoning']
        },
        capabilities: ['reasoning'],
        maxConcurrentTasks: 5,
        timeoutMs: 30000,
        retryPolicy: {
          maxRetries: 3,
          initialBackoffMs: 100,
          maxBackoffMs: 5000
        }
      };

      const id = registry.register(config);
      const agent = registry.get(id);

      expect(agent).toBeTruthy();
      expect(agent?.id).toBe(id);
      expect(agent?.config.name).toBe('Test Agent');
    });

    it('should return undefined for unknown ID', () => {
      const agent = registry.get('nonexistent-id');
      expect(agent).toBeUndefined();
    });
  });

  describe('findByCapabilities', () => {
    beforeEach(() => {
      const model: AgentModel = {
        name: 'Test Model',
        provider: 'openai',
        modelId: 'test-model',
        version: '1.0',
        maxTokens: 4096,
        costPer1kTokens: 0.01,
        supportedCapabilities: ['reasoning', 'coding']
      };

      const config1: AgentConfig = {
        name: 'Agent 1',
        description: 'Agent with coding',
        model,
        capabilities: ['code_generation', 'code_analysis'],
        maxConcurrentTasks: 5,
        timeoutMs: 30000,
        retryPolicy: {
          maxRetries: 3,
          initialBackoffMs: 100,
          maxBackoffMs: 5000
        }
      };

      const config2: AgentConfig = {
        name: 'Agent 2',
        description: 'Agent with reasoning',
        model,
        capabilities: ['reasoning', 'planning'],
        maxConcurrentTasks: 5,
        timeoutMs: 30000,
        retryPolicy: {
          maxRetries: 3,
          initialBackoffMs: 100,
          maxBackoffMs: 5000
        }
      };

      registry.register(config1);
      registry.register(config2);
    });

    it('should find agents by required capability', () => {
      const agents = registry.findByCapabilities({
        required: ['code_generation']
      });

      expect(agents.length).toBe(1);
      expect(agents[0].config.name).toBe('Agent 1');
    });

    it('should find agents with any of specified capabilities', () => {
      const agents = registry.findByCapabilities({
        any: ['reasoning', 'code_generation']
      });

      expect(agents.length).toBe(2);
    });

    it('should exclude agents with specified capabilities', () => {
      const agents = registry.findByCapabilities({
        required: ['code_generation'],
        exclude: ['planning']
      });

      expect(agents.length).toBe(1);
      expect(agents[0].config.name).toBe('Agent 1');
    });

    it('should return empty array when no matches', () => {
      const agents = registry.findByCapabilities({
        required: ['nonexistent_capability']
      });

      expect(agents.length).toBe(0);
    });
  });

  describe('findByProvider', () => {
    beforeEach(() => {
      const openaiModel: AgentModel = {
        name: 'OpenAI Model',
        provider: 'openai',
        modelId: 'gpt-4',
        version: '1.0',
        maxTokens: 8192,
        costPer1kTokens: 0.03,
        supportedCapabilities: ['reasoning']
      };

      const anthropicModel: AgentModel = {
        name: 'Anthropic Model',
        provider: 'anthropic',
        modelId: 'claude-3',
        version: '1.0',
        maxTokens: 100000,
        costPer1kTokens: 0.01,
        supportedCapabilities: ['reasoning']
      };

      registry.register({
        name: 'OpenAI Agent',
        description: 'Test',
        model: openaiModel,
        capabilities: ['reasoning'],
        maxConcurrentTasks: 5,
        timeoutMs: 30000,
        retryPolicy: {
          maxRetries: 3,
          initialBackoffMs: 100,
          maxBackoffMs: 5000
        }
      });

      registry.register({
        name: 'Anthropic Agent',
        description: 'Test',
        model: anthropicModel,
        capabilities: ['reasoning'],
        maxConcurrentTasks: 5,
        timeoutMs: 30000,
        retryPolicy: {
          maxRetries: 3,
          initialBackoffMs: 100,
          maxBackoffMs: 5000
        }
      });
    });

    it('should find agents by provider', () => {
      const agents = registry.findByProvider('openai');
      expect(agents.length).toBe(1);
      expect(agents[0].config.model.provider).toBe('openai');
    });
  });

  describe('updateStatus', () => {
    it('should update agent status', () => {
      const config: AgentConfig = {
        name: 'Test Agent',
        description: 'A test agent',
        model: {
          name: 'Test Model',
          provider: 'openai',
          modelId: 'test-model',
          version: '1.0',
          maxTokens: 4096,
          costPer1kTokens: 0.01,
          supportedCapabilities: ['reasoning']
        },
        capabilities: ['reasoning'],
        maxConcurrentTasks: 5,
        timeoutMs: 30000,
        retryPolicy: {
          maxRetries: 3,
          initialBackoffMs: 100,
          maxBackoffMs: 5000
        }
      };

      const id = registry.register(config);
      registry.updateStatus(id, 'maintenance');

      const agent = registry.get(id);
      expect(agent?.status).toBe('maintenance');
    });
  });

  describe('recordSuccess', () => {
    it('should track successful executions', () => {
      const config: AgentConfig = {
        name: 'Test Agent',
        description: 'A test agent',
        model: {
          name: 'Test Model',
          provider: 'openai',
          modelId: 'test-model',
          version: '1.0',
          maxTokens: 4096,
          costPer1kTokens: 0.01,
          supportedCapabilities: ['reasoning']
        },
        capabilities: ['reasoning'],
        maxConcurrentTasks: 5,
        timeoutMs: 30000,
        retryPolicy: {
          maxRetries: 3,
          initialBackoffMs: 100,
          maxBackoffMs: 5000
        }
      };

      const id = registry.register(config);
      registry.recordSuccess(id, 100);
      registry.recordSuccess(id, 200);

      const agent = registry.get(id);
      expect(agent?.health.successCount).toBe(2);
      expect(agent?.health.avgResponseTime).toBe(150);
    });
  });

  describe('recordError', () => {
    it('should track error count', () => {
      const config: AgentConfig = {
        name: 'Test Agent',
        description: 'A test agent',
        model: {
          name: 'Test Model',
          provider: 'openai',
          modelId: 'test-model',
          version: '1.0',
          maxTokens: 4096,
          costPer1kTokens: 0.01,
          supportedCapabilities: ['reasoning']
        },
        capabilities: ['reasoning'],
        maxConcurrentTasks: 5,
        timeoutMs: 30000,
        retryPolicy: {
          maxRetries: 3,
          initialBackoffMs: 100,
          maxBackoffMs: 5000
        }
      };

      const id = registry.register(config);
      registry.recordError(id);

      const agent = registry.get(id);
      expect(agent?.health.errorCount).toBe(1);
    });

    it('should disable agent after error threshold', () => {
      const config: AgentConfig = {
        name: 'Test Agent',
        description: 'A test agent',
        model: {
          name: 'Test Model',
          provider: 'openai',
          modelId: 'test-model',
          version: '1.0',
          maxTokens: 4096,
          costPer1kTokens: 0.01,
          supportedCapabilities: ['reasoning']
        },
        capabilities: ['reasoning'],
        maxConcurrentTasks: 5,
        timeoutMs: 30000,
        retryPolicy: {
          maxRetries: 3,
          initialBackoffMs: 100,
          maxBackoffMs: 5000
        }
      };

      const id = registry.register(config);

      // Record enough errors to exceed threshold (default 5)
      for (let i = 0; i < 5; i++) {
        registry.recordError(id);
      }

      const agent = registry.get(id);
      expect(agent?.enabled).toBe(false);
      expect(agent?.status).toBe('error');
    });
  });

  describe('capabilities', () => {
    it('should register and retrieve capabilities', () => {
      const capability: AgentCapability = {
        name: 'test_capability',
        description: 'A test capability',
        category: 'custom',
        version: '1.0.0',
        requiresTools: false
      };

      registry.registerCapability(capability);
      const capabilities = registry.getCapabilities();

      expect(capabilities).toContainEqual(capability);
    });
  });

  describe('models', () => {
    it('should register and retrieve models', () => {
      const model: AgentModel = {
        name: 'Test Model',
        provider: 'openai',
        modelId: 'test-model',
        version: '1.0',
        maxTokens: 4096,
        costPer1kTokens: 0.01,
        supportedCapabilities: ['reasoning']
      };

      registry.registerModel(model);
      const models = registry.getModels();

      expect(models).toContainEqual(model);
    });
  });

  describe('createDefaultRegistry', () => {
    it('should create registry with default capabilities', () => {
      const defaultRegistry = createDefaultRegistry();
      const capabilities = defaultRegistry.getCapabilities();

      expect(capabilities.length).toBe(7);
      expect(capabilities.map(c => c.name)).toContain('code_generation');
      expect(capabilities.map(c => c.name)).toContain('reasoning');
    });

    it('should create registry with default models', () => {
      const defaultRegistry = createDefaultRegistry();
      const models = defaultRegistry.getModels();

      expect(models.length).toBe(5);
      expect(models.map(m => m.provider)).toContain('openai');
      expect(models.map(m => m.provider)).toContain('anthropic');
    });
  });

  describe('getStats', () => {
    it('should return registry statistics', () => {
      const config: AgentConfig = {
        name: 'Test Agent',
        description: 'A test agent',
        model: {
          name: 'Test Model',
          provider: 'openai',
          modelId: 'test-model',
          version: '1.0',
          maxTokens: 4096,
          costPer1kTokens: 0.01,
          supportedCapabilities: ['reasoning']
        },
        capabilities: ['reasoning'],
        maxConcurrentTasks: 5,
        timeoutMs: 30000,
        retryPolicy: {
          maxRetries: 3,
          initialBackoffMs: 100,
          maxBackoffMs: 5000
        }
      };

      registry.register(config);

      const stats = registry.getStats();
      expect(stats.totalAgents).toBe(1);
      expect(stats.activeAgents).toBe(1);
    });
  });
});
