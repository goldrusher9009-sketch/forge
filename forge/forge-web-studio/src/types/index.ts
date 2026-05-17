export interface Agent {
  id: string;
  name: string;
  description: string;
  type: string;
  enabled: boolean;
  config: AgentConfig;
  stats: AgentStats;
  createdAt: string;
  updatedAt: string;
}

export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  timeoutSeconds: number;
  retryCount: number;
  customParams: Record<string, unknown>;
}

export interface AgentStats {
  tasksProcessed: number;
  tasksFailed: number;
  averageExecutionTime: number;
  successRate: number;
}

export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Task {
  id: string;
  agentId: string;
  status: TaskStatus;
  priority: number;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ExecutionResult {
  taskId: string;
  status: TaskStatus;
  result?: unknown;
  error?: string;
  executionTime: number;
  timestamp: string;
}

export interface QueueStatus {
  totalQueued: number;
  totalRunning: number;
  totalCompleted: number;
  totalFailed: number;
  averageWaitTime: number;
  averageExecutionTime: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  agentId: string;
  inputMapping: Record<string, unknown>;
  outputMapping: Record<string, unknown>;
  condition?: string;
  retryPolicy?: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

export interface MemoryEntry {
  id: string;
  agentId: string;
  type: 'working' | 'episodic' | 'semantic';
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
  createdAt: string;
  expiresAt?: string;
}

export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  enabled: boolean;
  stats: ToolStats;
}

export interface ToolStats {
  invocations: number;
  successCount: number;
  failureCount: number;
  averageExecutionTime: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
