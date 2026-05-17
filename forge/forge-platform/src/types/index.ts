// Task Types
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
  agentId: string;
  status: TaskStatus;
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Workflow Types
export enum WorkflowStatus {
  Draft = 'draft',
  Active = 'active',
  Paused = 'paused',
  Archived = 'archived',
}

export interface WorkflowStep {
  id: string;
  type: 'agent' | 'condition' | 'action';
  name: string;
  config: Record<string, unknown>;
  nextStepId?: string;
  errorStepId?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Agent Types
export enum AgentCapability {
  DataProcessing = 'data_processing',
  Analysis = 'analysis',
  Automation = 'automation',
  Integration = 'integration',
  Monitoring = 'monitoring',
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  provider: string;
  capabilities: AgentCapability[];
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  tools: string[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Queue Types
export interface QueueStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
  queued: number;
  avgDuration: number;
}

export interface QueueStatus {
  healthy: boolean;
  stats: QueueStats;
  lastUpdate: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: Date;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Error Types
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
