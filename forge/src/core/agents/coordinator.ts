/**
 * Agent Coordinator
 *
 * Orchestrates agent selection and execution based on task requirements.
 * Handles load balancing, capability matching, and execution coordination.
 */

import AgentRegistry, {
  RegisteredAgent,
  CapabilityFilter,
  AgentStatus,
  AgentConfig
} from './registry';

export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';
export type ExecutionMode = 'sequential' | 'parallel' | 'adaptive';

export interface ExecutionRequest {
  taskId: string;
  description: string;
  requiredCapabilities: string[];
  optionalCapabilities?: string[];
  excludeCapabilities?: string[];
  priority: TaskPriority;
  timeoutMs?: number;
  metadata?: Record<string, unknown>;
}

export interface ExecutionResult {
  taskId: string;
  agentId: string;
  status: 'success' | 'failure' | 'timeout';
  result?: unknown;
  error?: string;
  executionTimeMs: number;
  tokensUsed?: number;
}

export interface CoordinatorStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgExecutionTime: number;
  successRate: number;
}

export interface AgentSelection {
  agent: RegisteredAgent;
  score: number;
  reason: string;
}

/**
 * Agent Coordinator
 *
 * Intelligently selects and coordinates agent execution based on task requirements.
 */
export class AgentCoordinator {
  private registry: AgentRegistry;
  private executionHistory: ExecutionResult[] = [];
  private activeExecutions: Map<string, Promise<ExecutionResult>> = new Map();

  constructor(registry: AgentRegistry) {
    this.registry = registry;
  }

  /**
   * Select the best agent for a given request
   */
  selectAgent(request: ExecutionRequest): AgentSelection | null {
    // Build capability filter
    const filter: CapabilityFilter = {
      required: request.requiredCapabilities,
      any: request.optionalCapabilities,
      exclude: request.excludeCapabilities
    };

    // Find candidate agents
    const candidates = this.registry.findByCapabilities(filter);

    if (candidates.length === 0) {
      return null;
    }

    // Filter to active agents
    const activeAgents = candidates.filter(a => a.enabled && a.status === 'active');

    if (activeAgents.length === 0) {
      return null;
    }

    // Score and rank agents
    const scored = activeAgents.map(agent => ({
      agent,
      score: this.scoreAgent(agent, request),
      reason: this.getSelectionReason(agent, request)
    }));

    // Return highest scoring agent
    scored.sort((a, b) => b.score - a.score);
    return scored[0];
  }

  /**
   * Select multiple agents for parallel or distributed execution
   */
  selectAgents(
    request: ExecutionRequest,
    count: number = 3
  ): AgentSelection[] {
    const filter: CapabilityFilter = {
      required: request.requiredCapabilities,
      any: request.optionalCapabilities,
      exclude: request.excludeCapabilities
    };

    const candidates = this.registry
      .findByCapabilities(filter)
      .filter(a => a.enabled && a.status === 'active');

    if (candidates.length === 0) {
      return [];
    }

    const scored = candidates.map(agent => ({
      agent,
      score: this.scoreAgent(agent, request),
      reason: this.getSelectionReason(agent, request)
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, Math.min(count, scored.length));
  }

  /**
   * Execute task with selected agent
   */
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      const selection = this.selectAgent(request);

      if (!selection) {
        const result: ExecutionResult = {
          taskId: request.taskId,
          agentId: '',
          status: 'failure',
          error: 'No suitable agent found for task',
          executionTimeMs: Date.now() - startTime
        };

        this.recordExecution(result);
        return result;
      }

      const agent = selection.agent;
      const timeoutMs = request.timeoutMs || agent.config.timeoutMs;

      // Simulate execution (in real implementation, would call agent service)
      const result = await this.executeWithAgent(agent, request, timeoutMs);

      // Record metrics
      this.recordExecution(result);
      this.registry.recordSuccess(agent.id, result.executionTimeMs);

      return result;
    } catch (error) {
      const result: ExecutionResult = {
        taskId: request.taskId,
        agentId: '',
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime
      };

      this.recordExecution(result);
      return result;
    }
  }

  /**
   * Execute task with fallback agents
   */
  async executeWithFallback(
    request: ExecutionRequest,
    maxRetries: number = 3
  ): Promise<ExecutionResult> {
    const agents = this.selectAgents(request, maxRetries);

    if (agents.length === 0) {
      return {
        taskId: request.taskId,
        agentId: '',
        status: 'failure',
        error: 'No suitable agents found for task',
        executionTimeMs: 0
      };
    }

    let lastError = '';

    for (const selection of agents) {
      try {
        const result = await this.executeWithAgent(
          selection.agent,
          request,
          request.timeoutMs || selection.agent.config.timeoutMs
        );

        if (result.status === 'success') {
          this.recordExecution(result);
          this.registry.recordSuccess(selection.agent.id, result.executionTimeMs);
          return result;
        } else {
          lastError = result.error || 'Unknown error';
          this.registry.recordError(selection.agent.id);
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        this.registry.recordError(selection.agent.id);
      }
    }

    return {
      taskId: request.taskId,
      agentId: '',
      status: 'failure',
      error: `All agents failed. Last error: ${lastError}`,
      executionTimeMs: 0
    };
  }

  /**
   * Execute task in parallel with multiple agents
   */
  async executeParallel(request: ExecutionRequest): Promise<ExecutionResult[]> {
    const agents = this.selectAgents(request, 3);

    if (agents.length === 0) {
      return [{
        taskId: request.taskId,
        agentId: '',
        status: 'failure',
        error: 'No suitable agents found for task',
        executionTimeMs: 0
      }];
    }

    const promises = agents.map(selection =>
      this.executeWithAgent(
        selection.agent,
        request,
        request.timeoutMs || selection.agent.config.timeoutMs
      )
    );

    const results = await Promise.all(promises);
    results.forEach(result => this.recordExecution(result));

    return results;
  }

  /**
   * Get coordinator statistics
   */
  getStats(): CoordinatorStats {
    const total = this.executionHistory.length;
    const successful = this.executionHistory.filter(r => r.status === 'success').length;
    const failed = this.executionHistory.filter(r => r.status === 'failure').length;

    const avgTime = total > 0
      ? this.executionHistory.reduce((sum, r) => sum + r.executionTimeMs, 0) / total
      : 0;

    return {
      totalExecutions: total,
      successfulExecutions: successful,
      failedExecutions: failed,
      avgExecutionTime: avgTime,
      successRate: total > 0 ? successful / total : 0
    };
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit: number = 100): ExecutionResult[] {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executionHistory = [];
  }

  /**
   * Private helper to score agents
   */
  private scoreAgent(agent: RegisteredAgent, request: ExecutionRequest): number {
    let score = 0;

    // Health score (0-30 points)
    const errorRate = agent.health.errorCount /
      (agent.health.successCount + agent.health.errorCount || 1);
    const healthScore = (1 - errorRate) * 30;
    score += healthScore;

    // Capability match (0-40 points)
    const requiredMatches = request.requiredCapabilities.filter(cap =>
      agent.config.capabilities.includes(cap)
    ).length;
    const capabilityScore = (requiredMatches / request.requiredCapabilities.length) * 40;
    score += capabilityScore;

    // Optional capability bonus (0-15 points)
    if (request.optionalCapabilities) {
      const optionalMatches = request.optionalCapabilities.filter(cap =>
        agent.config.capabilities.includes(cap)
      ).length;
      const optionalScore = (optionalMatches / request.optionalCapabilities.length) * 15;
      score += optionalScore;
    }

    // Priority-based load balancing (0-15 points)
    const activeCount = this.registry.getActive().length;
    const loadScore = (1 - (this.activeExecutions.size / Math.max(activeCount, 1))) * 15;
    score += loadScore;

    return score;
  }

  /**
   * Private helper to get selection reason
   */
  private getSelectionReason(agent: RegisteredAgent, request: ExecutionRequest): string {
    const matchedCapabilities = request.requiredCapabilities.filter(cap =>
      agent.config.capabilities.includes(cap)
    );

    return `Agent matches ${matchedCapabilities.length}/${request.requiredCapabilities.length} required capabilities`;
  }

  /**
   * Private helper to execute with specific agent
   */
  private async executeWithAgent(
    agent: RegisteredAgent,
    request: ExecutionRequest,
    timeoutMs: number
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<ExecutionResult>((_, reject) =>
        setTimeout(
          () => reject(new Error('Execution timeout')),
          timeoutMs
        )
      );

      // Create execution promise (simulated)
      const executionPromise = this.simulateAgentExecution(agent, request);

      // Race against timeout
      const result = await Promise.race([executionPromise, timeoutPromise]);

      return {
        ...result,
        agentId: agent.id,
        executionTimeMs: Date.now() - startTime
      };
    } catch (error) {
      return {
        taskId: request.taskId,
        agentId: agent.id,
        status: error instanceof Error && error.message === 'Execution timeout' ? 'timeout' : 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Simulate agent execution (placeholder for real implementation)
   */
  private async simulateAgentExecution(
    agent: RegisteredAgent,
    request: ExecutionRequest
  ): Promise<ExecutionResult> {
    // In real implementation, this would call the agent service
    // For now, simulate with a delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

    return {
      taskId: request.taskId,
      agentId: agent.id,
      status: 'success',
      result: {
        message: `Executed by ${agent.config.name}`,
        capabilities: request.requiredCapabilities
      },
      executionTimeMs: Math.random() * 100
    };
  }

  /**
   * Record execution in history
   */
  private recordExecution(result: ExecutionResult): void {
    this.executionHistory.push(result);

    // Keep history size bounded
    if (this.executionHistory.length > 10000) {
      this.executionHistory = this.executionHistory.slice(-5000);
    }
  }
}

export default AgentCoordinator;
