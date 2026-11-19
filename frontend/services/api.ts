import { API_BASE_URL } from '@/lib/constants';
import { ApiErrorResponse, AppApiError } from '@/types/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, body, ...restOptions } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const defaultHeaders: Record<string, string> = {};
  if (!isFormData) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const finalHeaders = {
    ...defaultHeaders,
    ...(headers as Record<string, string>),
  };

  let response: Response;
  try {
    response = await fetch(url, {
      ...restOptions,
      headers: finalHeaders,
      body,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network request failed';
    throw new AppApiError(
      `Unable to reach the backend server at ${API_BASE_URL}. Please verify the server is running. (${msg})`,
      'network_error',
      0
    );
  }

  // Multi-status 207 is valid for partial batch uploads
  const isSuccess = response.ok || response.status === 207;

  if (!isSuccess) {
    let errorCode = 'api_error';
    let errorMessage = `Request failed with status ${response.status} (${response.statusText})`;

    try {
      const errorJson = (await response.json()) as ApiErrorResponse;
      if (errorJson?.error?.message) {
        errorMessage = errorJson.error.message;
        errorCode = errorJson.error.code || errorCode;
      }
    } catch {
      // response was not JSON
    }

    throw new AppApiError(errorMessage, errorCode, response.status);
  }

  // Parse JSON response
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}
