/**
 * Agent Model
 * Represents AI agents with configuration, tools, and execution history
 */

export interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  description?: string;
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | string;
  systemPrompt: string;
  temperature: number; // 0-2
  maxTokens: number; // 100-8000
  tools: AgentTool[];
  tags: string[];
  enabled: boolean;
  isPublic: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  userId: string;
  workflowExecutionId?: string;
  input: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  result?: string;
  toolCalls: Array<{
    id: string;
    name: string;
    arguments: Record<string, any>;
    result?: string;
    error?: string;
    timestamp: Date;
  }>;
  status: 'pending' | 'running' | 'success' | 'failed';
  error?: string;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost?: number;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface AgentVersion {
  id: string;
  agentId: string;
  version: number;
  snapshot: Agent;
  createdAt: Date;
}

/**
 * Database Table Schema for agents
 */
export const AgentTableSchema = `
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  model VARCHAR(100) NOT NULL,
  system_prompt TEXT NOT NULL,
  temperature NUMERIC(3, 2) NOT NULL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER NOT NULL DEFAULT 2000 CHECK (max_tokens >= 100 AND max_tokens <= 8000),
  tools JSONB DEFAULT '[]'::JSONB,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  enabled BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_enabled ON agents(enabled);
CREATE INDEX IF NOT EXISTS idx_agents_is_public ON agents(is_public);
CREATE INDEX IF NOT EXISTS idx_agents_model ON agents(model);
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON agents(created_at DESC);

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE
  ON agents FOR EACH ROW EXECUTE FUNCTION update_agents_updated_at_column();
`;

/**
 * Database Table Schema for agent executions
 */
export const AgentExecutionTableSchema = `
CREATE TABLE IF NOT EXISTS agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,
  input TEXT NOT NULL,
  messages JSONB DEFAULT '[]'::JSONB,
  result TEXT,
  tool_calls JSONB DEFAULT '[]'::JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed')),
  error TEXT,
  tokens_used JSONB,
  cost NUMERIC(10, 6),
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_executions_agent_id ON agent_executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_user_id ON agent_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_created_at ON agent_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_executions_workflow_execution_id ON agent_executions(workflow_execution_id);
`;

/**
 * Database Table Schema for agent versions
 */
export const AgentVersionTableSchema = `
CREATE TABLE IF NOT EXISTS agent_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_id, version)
);

CREATE INDEX IF NOT EXISTS idx_agent_versions_agent_id ON agent_versions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_versions_version ON agent_versions(version DESC);
`;
