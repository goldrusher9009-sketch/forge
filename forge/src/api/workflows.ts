import { apiFetch, handleApiError } from './client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export const fetchWorkflows = async (offset: number = 0, limit: number = 20) => {
  const response = await apiFetch(
    `${API_URL}/api/v1/workflows?offset=${offset}&limit=${limit}`
  );

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const fetchWorkflowById = async (id: string): Promise<Workflow> => {
  const response = await apiFetch(`${API_URL}/api/v1/workflows/${id}`);

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const createWorkflow = async (data: {
  name: string;
  description: string;
  definition?: any;
}): Promise<Workflow> => {
  const response = await apiFetch(`${API_URL}/api/v1/workflows`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const updateWorkflow = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    status?: 'active' | 'inactive' | 'archived';
    definition?: any;
  }
): Promise<Workflow> => {
  const response = await apiFetch(`${API_URL}/api/v1/workflows/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const deleteWorkflow = async (id: string): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/api/v1/workflows/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const executeWorkflow = async (id: string): Promise<WorkflowExecution> => {
  const response = await apiFetch(`${API_URL}/api/v1/workflows/${id}/execute`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const fetchWorkflowExecutions = async (
  workflowId: string,
  offset: number = 0,
  limit: number = 20
) => {
  const response = await apiFetch(
    `${API_URL}/api/v1/workflows/${workflowId}/executions?offset=${offset}&limit=${limit}`
  );

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const fetchExecutionById = async (
  workflowId: string,
  executionId: string
): Promise<WorkflowExecution> => {
  const response = await apiFetch(
    `${API_URL}/api/v1/workflows/${workflowId}/executions/${executionId}`
  );

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};
