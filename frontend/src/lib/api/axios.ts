import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, setAccessToken } from './token';

export type NormalizedApiError = Error & { status?: number; errors?: Record<string, string[]> };
const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
export const apiClient = axios.create({ baseURL, withCredentials: true, timeout: 30_000 });
let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    const original = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/refresh')
    ) {
      original._retry = true;
      refreshPromise ??= axios
        .post<{ data: { accessToken: string } }>(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        )
        .then(({ data }) => {
          setAccessToken(data.data.accessToken);
          return data.data.accessToken;
        })
        .finally(() => {
          refreshPromise = null;
        });
      try {
        const token = await refreshPromise;
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      } catch {
        setAccessToken(null);
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth:expired'));
      }
    }
    const normalized = new Error(
      error.response?.data?.message ?? error.message ?? 'Request failed',
    ) as NormalizedApiError;
    normalized.status = error.response?.status;
    normalized.errors = error.response?.data?.errors;
    return Promise.reject(normalized);
  },
);
