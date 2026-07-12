import axios from 'axios';
import { API_BASE_URL, ADMIN_ROUTES } from './config';
import { refreshAdminToken } from './tokenRefresh';
import {
  ADMIN_TOKEN_KEY,
  ADMIN_REFRESH_TOKEN_KEY,
  ADMIN_USER_KEY,
  ADMIN_UNAUTHORIZED_EVENT,
} from '../constants/adminAuth';

const adminAxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let refreshPromise = null;

function clearAdminStorage() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
  window.dispatchEvent(new CustomEvent(ADMIN_UNAUTHORIZED_EVENT));
}

function shouldAttemptRefresh(config) {
  if (!config) return false;
  const url = config.url || '';
  if (url.includes(ADMIN_ROUTES.refreshToken)) return false;
  if (url.includes(ADMIN_ROUTES.login)) return false;
  return true;
}

adminAxiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error),
);

adminAxiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      shouldAttemptRefresh(originalRequest) &&
      !originalRequest?._retry
    ) {
      const refreshToken = localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        clearAdminStorage();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshAdminToken(refreshToken).finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;

        const newAccessToken = localStorage.getItem(ADMIN_TOKEN_KEY);
        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return adminAxiosInstance(originalRequest);
      } catch {
        clearAdminStorage();
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401 && shouldAttemptRefresh(originalRequest)) {
      clearAdminStorage();
    }

    return Promise.reject(error);
  },
);

export {
  ADMIN_TOKEN_KEY,
  ADMIN_REFRESH_TOKEN_KEY,
  ADMIN_USER_KEY,
} from '../constants/adminAuth';
export default adminAxiosInstance;
