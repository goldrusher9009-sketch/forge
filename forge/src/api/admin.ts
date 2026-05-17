import { apiFetch, handleApiError } from './client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const fetchSystemHealth = async () => {
  const response = await apiFetch(`${API_URL}/api/v1/admin/system-health`);

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const fetchWorkflowStats = async (startDate?: Date, endDate?: Date) => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate.toISOString());
  if (endDate) params.append('end_date', endDate.toISOString());

  const response = await apiFetch(`${API_URL}/api/v1/admin/stats?${params.toString()}`);

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const fetchAgentStats = async (startDate?: Date, endDate?: Date) => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate.toISOString());
  if (endDate) params.append('end_date', endDate.toISOString());

  const response = await apiFetch(`${API_URL}/api/v1/admin/agent-stats?${params.toString()}`);

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const fetchAuditLogs = async (
  filters?: {
    entity_type?: string;
    entity_id?: string;
    action?: string;
    user_id?: string;
    start_date?: Date;
    end_date?: Date;
    offset?: number;
    limit?: number;
  }
) => {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.entity_type) params.append('entity_type', filters.entity_type);
    if (filters.entity_id) params.append('entity_id', filters.entity_id);
    if (filters.action) params.append('action', filters.action);
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.start_date) params.append('start_date', filters.start_date.toISOString());
    if (filters.end_date) params.append('end_date', filters.end_date.toISOString());
    if (filters.offset) params.append('offset', filters.offset.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
  }

  const response = await apiFetch(`${API_URL}/api/v1/admin/audit-logs?${params.toString()}`);

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const fetchOrganizations = async (offset: number = 0, limit: number = 20) => {
  const response = await apiFetch(
    `${API_URL}/api/v1/admin/organizations?offset=${offset}&limit=${limit}`
  );

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const fetchOrganizationById = async (id: string) => {
  const response = await apiFetch(`${API_URL}/api/v1/admin/organizations/${id}`);

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const updateOrganization = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    website?: string;
    logo_url?: string;
  }
) => {
  const response = await apiFetch(`${API_URL}/api/v1/admin/organizations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const deleteOrganization = async (id: string) => {
  const response = await apiFetch(`${API_URL}/api/v1/admin/organizations/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};
