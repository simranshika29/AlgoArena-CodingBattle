import axios, { AxiosError } from 'axios';
import config from '../config';

export const TOKEN_KEY = 'algoarena.token';

const api = axios.create({
  baseURL: `${config.apiBaseUrl}/api`,
  timeout: 60_000, // judging several test cases can take a while
});

api.interceptors.request.use((request) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) request.headers.Authorization = `Bearer ${token}`;
  return request;
});

type UnauthorizedListener = () => void;
let onUnauthorized: UnauthorizedListener | null = null;
export const setUnauthorizedListener = (listener: UnauthorizedListener | null) => {
  onUnauthorized = listener;
};

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error.config?.url || '';
    const isSignInAttempt = ['/auth/login', '/auth/register', '/auth/google'].some((path) => url.startsWith(path));
    if (error.response?.status === 401 && !isSignInAttempt) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

/** Turns any API error into a sentence that is safe to show to the user. */
export const getErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.') => {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
    if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
    if (!error.response) return 'Cannot reach the AlgoArena server. Check your connection and try again.';
  }
  return fallback;
};

export default api;
