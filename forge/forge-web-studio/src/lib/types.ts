// Generic API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Agent types
export interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  tools: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Workflow types
export interface WorkflowStep {
  id: string;
  name: string;
  type: 'agent' | 'condition' | 'action';
  config: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Task/Queue types
export enum TaskStatus {
  Queued = 'queued',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export interface Task {
  id: string;
  workflowId: string;
  workflowName: string;
  status: TaskStatus;
  progress: number; // 0-100
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface QueueStatus {
  activeWorkflows: number;
  completedTasks: number;
  queuedTasks: number;
  averageWaitTime: number;
}

// Execution/History types
export enum ExecutionStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  stepsCompleted: number;
  totalSteps: number;
  duration: number; // milliseconds
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface ExecutionMetrics {
  totalExecutions: number;
  successful: number;
  failed: number;
  avgDuration: number;
  successRate: number;
}

// Models available
export const AVAILABLE_MODELS = [
  'gpt-4',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
  'claude-3-opus',
  'claude-3-sonnet',
  'claude-3-haiku',
] as const;

export type ModelType = typeof AVAILABLE_MODELS[number];
