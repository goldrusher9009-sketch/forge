import { apiFetch, handleApiError } from './client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'archived';
  model: string;
  system_prompt: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface AgentExecution {
  id: string;
  agent_id: string;
  input: string;
  output?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export const fetchAgents = async (offset: number = 0, limit: number = 20) => {
  const response = await apiFetch(
    `${API_URL}/api/v1/agents?offset=${offset}&limit=${limit}`
  );

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const fetchAgentById = async (id: string): Promise<Agent> => {
  const response = await apiFetch(`${API_URL}/api/v1/agents/${id}`);

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const createAgent = async (data: {
  name: string;
  description: string;
  model: string;
  system_prompt: string;
}): Promise<Agent> => {
  const response = await apiFetch(`${API_URL}/api/v1/agents`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const updateAgent = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    status?: 'active' | 'inactive' | 'archived';
    model?: string;
    system_prompt?: string;
  }
): Promise<Agent> => {
  const response = await apiFetch(`${API_URL}/api/v1/agents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const deleteAgent = async (id: string): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/api/v1/agents/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const executeAgent = async (id: string, input: string): Promise<AgentExecution> => {
  const response = await apiFetch(`${API_URL}/api/v1/agents/${id}/execute`, {
    method: 'POST',
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const fetchAgentExecutions = async (
  agentId: string,
  offset: number = 0,
  limit: number = 20
) => {
  const response = await apiFetch(
    `${API_URL}/api/v1/agents/${agentId}/executions?offset=${offset}&limit=${limit}`
  );

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const fetchExecutionById = async (
  agentId: string,
  executionId: string
): Promise<AgentExecution> => {
  const response = await apiFetch(
    `${API_URL}/api/v1/agents/${agentId}/executions/${executionId}`
  );

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};
