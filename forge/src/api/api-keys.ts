import { apiFetch, handleApiError } from './client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  secret: string;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export const fetchApiKeys = async (offset: number = 0, limit: number = 20) => {
  const response = await apiFetch(
    `${API_URL}/api/v1/api-keys?offset=${offset}&limit=${limit}`
  );

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const fetchApiKeyById = async (id: string): Promise<ApiKeyResponse> => {
  const response = await apiFetch(`${API_URL}/api/v1/api-keys/${id}`);

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const createApiKey = async (name: string): Promise<ApiKey> => {
  const response = await apiFetch(`${API_URL}/api/v1/api-keys`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const updateApiKey = async (
  id: string,
  data: {
    name?: string;
    is_active?: boolean;
  }
): Promise<ApiKeyResponse> => {
  const response = await apiFetch(`${API_URL}/api/v1/api-keys/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const deleteApiKey = async (id: string): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/api/v1/api-keys/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const rotateApiKey = async (id: string): Promise<ApiKey> => {
  const response = await apiFetch(`${API_URL}/api/v1/api-keys/${id}/rotate`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};
