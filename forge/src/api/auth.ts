import { getAuthHeader, handleApiError } from './client';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  requires_mfa?: boolean;
  mfa_type?: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'user';
    created_at: string;
  };
}

interface RegisterResponse {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    created_at: string;
  };
  message: string;
}

export const loginUser = async (
  email: string,
  password: string,
  mfaCode?: string
): Promise<LoginResponse> => {
  const body: any = { email, password };
  if (mfaCode) {
    body.mfa_code = mfaCode;
  }

  const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const registerUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<RegisterResponse> => {
  const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    }),
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const refreshAccessToken = async (refreshToken: string): Promise<LoginResponse> => {
  const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const requestPasswordReset = async (email: string): Promise<{ message: string }> => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/v1/auth/password-reset-request`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    }
  );

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const resetPassword = async (token: string, newPassword: string): Promise<{ message: string }> => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/v1/auth/password-reset`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, new_password: newPassword }),
    }
  );

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};

export const verifyEmail = async (token: string): Promise<{ message: string }> => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/v1/auth/verify-email`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    }
  );

  if (!response.ok) {
    throw handleApiError(response);
  }

  return response.json();
};
