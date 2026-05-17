'use client';

import { useState, useCallback, useEffect } from 'react';
import { ApiResponse } from '@/lib/types';
import { authFetch } from '@/lib/auth';

interface UseApiOptions {
  autoFetch?: boolean;
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(
  url: string,
  options: UseApiOptions = { autoFetch: true }
): UseApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: options.autoFetch !== false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await authFetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = (await response.json()) as ApiResponse<T>;

      if (!json.success) {
        throw new Error(json.error || 'API request failed');
      }

      setState({
        data: json.data || null,
        loading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
    }
  }, [url]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchData();
    }
  }, [url, fetchData, options.autoFetch]);

  return {
    ...state,
    refetch: fetchData,
  };
}

export async function apiCall<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const response = await authFetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<ApiResponse<T>>;
}
