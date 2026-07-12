import axios from 'axios';
import { API_BASE_URL, USER_ROUTES } from './config';
import { refreshUserToken } from './tokenRefresh';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  USER_UNAUTHORIZED_EVENT,
} from '../constants/userAuth';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let refreshPromise = null;

export function clearUserSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new CustomEvent(USER_UNAUTHORIZED_EVENT));
}

function shouldAttemptRefresh(config) {
  if (!config) return false;
  const url = config.url || '';
  if (url.includes(USER_ROUTES.refreshToken)) return false;
  if (url.includes(USER_ROUTES.login)) return false;
  if (url.includes(USER_ROUTES.register)) return false;
  return true;
}

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      shouldAttemptRefresh(originalRequest) &&
      !originalRequest?._retry
    ) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        clearUserSession();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshUserToken(refreshToken).finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;

        const newAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return axiosInstance(originalRequest);
      } catch {
        clearUserSession();
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401 && shouldAttemptRefresh(originalRequest)) {
      clearUserSession();
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
