export const getAuthHeader = (): { Authorization: string } | {} => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const handleApiError = (response: Response): Error => {
  const statusCode = response.status;

  if (statusCode === 401) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return new Error('Session expired. Please log in again.');
  }

  if (statusCode === 403) {
    return new Error('You do not have permission to perform this action.');
  }

  if (statusCode === 404) {
    return new Error('The requested resource was not found.');
  }

  if (statusCode === 500) {
    return new Error('Server error. Please try again later.');
  }

  return new Error(`Request failed with status ${statusCode}`);
};

export const apiFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
};
