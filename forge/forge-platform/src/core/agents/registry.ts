import { Agent } from '../../types';

export class AgentRegistry {
  private agents = new Map<string, Agent>();

  register(agent: Agent): void {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent ${agent.id} is already registered`);
    }
    this.agents.set(agent.id, agent);
  }

  unregister(agentId: string): void {
    this.agents.delete(agentId);
  }

  get(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getAll(): Agent[] {
    return Array.from(this.agents.values());
  }

  getByCapability(capability: string): Agent[] {
    return Array.from(this.agents.values()).filter(agent =>
      agent.capabilities.includes(capability as any)
    );
  }

  exists(agentId: string): boolean {
    return this.agents.has(agentId);
  }
}

export const agentRegistry = new AgentRegistry();
