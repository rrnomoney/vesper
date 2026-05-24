import { getAuthToken, handleUnauthorized } from './authSession';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.251.52.102:8080/api';

export type ApiResult<T> = {
  code: number;
  message: string;
  data: T;
};

type QueryParams = Record<string, string | number | undefined | null>;
type RequestOptions = {
  auth?: boolean;
};
type RequestBody = Record<string, unknown> | undefined;

function buildQueryString(params?: QueryParams) {
  if (!params) {
    return '';
  }

  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return query ? `?${query}` : '';
}

export async function apiGet<T>(path: string, params?: QueryParams, options?: RequestOptions): Promise<T> {
  return apiRequest<T>('GET', path, { ...options, params });
}

export async function apiPost<T>(path: string, body?: RequestBody, options?: RequestOptions): Promise<T> {
  return apiRequest<T>('POST', path, { ...options, body });
}

export async function apiDelete<T>(path: string, options?: RequestOptions): Promise<T> {
  return apiRequest<T>('DELETE', path, options);
}

async function readResult<T>(response: Response): Promise<ApiResult<T> | null> {
  try {
    return (await response.json()) as ApiResult<T>;
  } catch {
    return null;
  }
}

async function apiRequest<T>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  options?: RequestOptions & { body?: RequestBody; params?: QueryParams },
): Promise<T> {
  const headers: Record<string, string> = {};

  if (options?.auth) {
    const token = getAuthToken();

    if (!token) {
      throw new Error('Please log in to continue.');
    }

    headers.Authorization = `Bearer ${token}`;
  }

  if (options?.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}${buildQueryString(options?.params)}`, {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  const result = await readResult<T>(response);

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }

    throw new Error(result?.message || 'Something went wrong');
  }

  if (!result) {
    throw new Error('Something went wrong');
  }

  if (result.code !== 200) {
    if (result.code === 401) {
      handleUnauthorized();
    }

    throw new Error(result.message || 'Something went wrong');
  }

  return result.data;
}
