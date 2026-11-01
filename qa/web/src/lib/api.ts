import axios, { AxiosError } from 'axios';

export const TOKEN_KEY = 'wenqu_token';
export const USER_KEY = 'wenqu_user';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (!error.response) return '连接不上服务器，请确认后端已启动';
    if (error.code === 'ECONNABORTED') return '请求超时，请稍后再试';
  }
  if (error instanceof Error) return error.message;
  return '出了点问题，请稍后再试';
}
