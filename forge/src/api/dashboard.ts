import { apiFetch, handleApiError } from './client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const fetchWorkflowStats = async (startDate?: Date, endDate?: Date) => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate.toISOString());
  if (endDate) params.append('end_date', endDate.toISOString());

  const response = await apiFetch(`${API_URL}/api/v1/dashboard/workflow-stats?${params.toString()}`);

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const fetchAgentStats = async (startDate?: Date, endDate?: Date) => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate.toISOString());
  if (endDate) params.append('end_date', endDate.toISOString());

  const response = await apiFetch(`${API_URL}/api/v1/dashboard/agent-stats?${params.toString()}`);

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const fetchUserDashboard = async () => {
  const response = await apiFetch(`${API_URL}/api/v1/dashboard/user`);

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const fetchRecentActivities = async (limit: number = 10) => {
  const response = await apiFetch(`${API_URL}/api/v1/dashboard/activities?limit=${limit}`);

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};
