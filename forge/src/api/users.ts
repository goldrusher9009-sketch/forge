import { apiFetch, handleApiError } from './client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'user';
  mfa_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const fetchCurrentUser = async (): Promise<UserProfile> => {
  const response = await apiFetch(`${API_URL}/api/v1/users/me`);

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const updateUserProfile = async (data: {
  first_name?: string;
  last_name?: string;
}): Promise<UserProfile> => {
  const response = await apiFetch(`${API_URL}/api/v1/users/me`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/api/v1/users/change-password`, {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const enableMfa = async (): Promise<{
  secret: string;
  qr_code: string;
}> => {
  const response = await apiFetch(`${API_URL}/api/v1/users/mfa/enable`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const confirmMfa = async (code: string): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/api/v1/users/mfa/confirm`, {
    method: 'POST',
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const disableMfa = async (): Promise<{ message: string }> => {
  const response = await apiFetch(`${API_URL}/api/v1/users/mfa/disable`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};
