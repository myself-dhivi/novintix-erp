import type { AuthUser } from '@novintix/shared';
import { apiClient } from './axios';
import { setAccessToken } from './token';

export const authApi = {
  async login(input: { email: string; password: string }) {
    const { data } = await apiClient.post<{ data: { accessToken: string } }>('/auth/login', input);
    setAccessToken(data.data.accessToken);
    return data.data.accessToken;
  },
  async refresh() {
    const { data } = await apiClient.post<{ data: { accessToken: string } }>('/auth/refresh');
    setAccessToken(data.data.accessToken);
    return data.data.accessToken;
  },
  async me() {
    return (await apiClient.get<{ data: AuthUser }>('/auth/me')).data.data;
  },
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },
};
