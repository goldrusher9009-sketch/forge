/**
 * Agent Repository Tests
 */

import { AgentRepository, Agent } from './agent';
import { DatabaseConnection } from '../connection';

describe('AgentRepository', () => {
  let repository: AgentRepository;
  let connection: DatabaseConnection;

  beforeEach(async () => {
    const config = {
      driver: 'sqlite' as const,
      database: ':memory:',
      poolSize: 5
    };
    connection = new DatabaseConnection(config);
    await connection.initialize();
    repository = new AgentRepository(connection);

    // Create test table
    const conn = await connection.acquire();
    try {
      await conn.exec(`
        CREATE TABLE IF NOT EXISTS agents (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'active',
          config TEXT,
          capabilityIds TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          lastHeartbeat TIMESTAMP,
          errorMessage TEXT
        )
      `);
    } finally {
      connection.release(conn);
    }
  });

  afterEach(async () => {
    await connection.drain();
  });

  describe('create', () => {
    it('should create an agent', async () => {
      const agent: Partial<Agent> = {
        id: 'agent-1',
        name: 'Test Agent',
        description: 'A test agent',
        status: 'active',
        config: { timeout: 5000 },
        capabilityIds: ['capability-1', 'capability-2']
      };

      const result = await repository.create(agent);
      expect(result).toBeTruthy();
    });
  });

  describe('findActive', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'agent-1',
        name: 'Active Agent',
        status: 'active',
        config: {},
        capabilityIds: []
      });
      await repository.create({
        id: 'agent-2',
        name: 'Inactive Agent',
        status: 'inactive',
        config: {},
        capabilityIds: []
      });
    });

    it('should find only active agents', async () => {
      const agents = await repository.findActive();
      expect(agents.length).toBe(1);
      expect(agents[0]?.id).toBe('agent-1');
    });
  });

  describe('findByStatus', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'agent-1',
        name: 'Active',
        status: 'active',
        config: {},
        capabilityIds: []
      });
      await repository.create({
        id: 'agent-2',
        name: 'Error',
        status: 'error',
        config: {},
        capabilityIds: []
      });
    });

    it('should find agents by specific status', async () => {
      const active = await repository.findByStatus('active');
      expect(active.length).toBe(1);
      expect(active[0]?.id).toBe('agent-1');

      const error = await repository.findByStatus('error');
      expect(error.length).toBe(1);
      expect(error[0]?.id).toBe('agent-2');
    });
  });

  describe('updateHeartbeat', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'agent-1',
        name: 'Test Agent',
        status: 'active',
        config: {},
        capabilityIds: []
      });
    });

    it('should update agent heartbeat timestamp', async () => {
      const now = new Date();
      await repository.updateHeartbeat('agent-1', now);

      const agent = await repository.findById('agent-1');
      expect(agent?.lastHeartbeat).toBeTruthy();
    });
  });

  describe('recordError', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'agent-1',
        name: 'Test Agent',
        status: 'active',
        config: {},
        capabilityIds: []
      });
    });

    it('should mark agent as errored with message', async () => {
      await repository.recordError('agent-1', 'Connection timeout');

      const agent = await repository.findById('agent-1');
      expect(agent?.status).toBe('error');
      expect(agent?.errorMessage).toBe('Connection timeout');
    });
  });

  describe('clearError', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'agent-1',
        name: 'Test Agent',
        status: 'error',
        errorMessage: 'Previous error',
        config: {},
        capabilityIds: []
      });
    });

    it('should clear agent error state', async () => {
      await repository.clearError('agent-1');

      const agent = await repository.findById('agent-1');
      expect(agent?.status).toBe('active');
      expect(agent?.errorMessage).toBeNull();
    });
  });

  describe('updateCapabilities', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'agent-1',
        name: 'Test Agent',
        status: 'active',
        config: {},
        capabilityIds: ['old-1']
      });
    });

    it('should update agent capabilities', async () => {
      await repository.updateCapabilities('agent-1', ['new-1', 'new-2']);

      const agent = await repository.findById('agent-1');
      expect(agent?.capabilityIds).toEqual(['new-1', 'new-2']);
    });
  });

  describe('countByStatus', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'agent-1',
        name: 'Active 1',
        status: 'active',
        config: {},
        capabilityIds: []
      });
      await repository.create({
        id: 'agent-2',
        name: 'Active 2',
        status: 'active',
        config: {},
        capabilityIds: []
      });
      await repository.create({
        id: 'agent-3',
        name: 'Inactive',
        status: 'inactive',
        config: {},
        capabilityIds: []
      });
    });

    it('should count agents by status', async () => {
      const activeCount = await repository.countByStatus('active');
      expect(activeCount).toBe(2);

      const inactiveCount = await repository.countByStatus('inactive');
      expect(inactiveCount).toBe(1);
    });
  });

  describe('findStaleAgents', () => {
    it('should find agents with stale heartbeats', async () => {
      const oldTime = new Date(Date.now() - 30000); // 30 seconds ago
      const newTime = new Date(Date.now() - 5000);  // 5 seconds ago

      await repository.create({
        id: 'agent-1',
        name: 'Stale',
        status: 'active',
        lastHeartbeat: oldTime,
        config: {},
        capabilityIds: []
      });
      await repository.create({
        id: 'agent-2',
        name: 'Fresh',
        status: 'active',
        lastHeartbeat: newTime,
        config: {},
        capabilityIds: []
      });
      await repository.create({
        id: 'agent-3',
        name: 'Never',
        status: 'active',
        config: {},
        capabilityIds: []
      });

      const stale = await repository.findStaleAgents(10000); // 10 second threshold
      expect(stale.length).toBeGreaterThanOrEqual(1);
    });
  });
});
